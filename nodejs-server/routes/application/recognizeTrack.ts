import {ServerRoute} from "hapi";
import handleService from "../handleService";
import extractRequestSchema from "../extractRequestSchema";
import {JoiExtractTypes} from "../../types/JoiExtractTypes";
import {JoiWithReadableStreamType} from "../../constants/joi";
import Joi from "joi";
import {v4} from 'uuid'
import app from "../../app";
import {promisify} from "util";
import {timeout} from "promise-timeout";
import {internal} from "@hapi/boom";
import {IFingerPrint, IRedisAnchor} from "../../interfaces/IFingerPrint";
import {ConsumeMessage} from "amqplib";
import getAddressKey from "../../helpers/getAddressKey";
import {CANNOT_RECOGNIZE_SONG_ERROR_TEXT} from "../../constants/errors";
import _ from "lodash";
import getSongAddressKey from "../../helpers/getSongAddressKey";
import IMongoSong from "../../interfaces/IMongoSong";
import {res} from "pino-std-serializers";

const RequestSchemaPayload = Joi.object({
    file: JoiWithReadableStreamType.readable().required()
}).required();

const coeff = 0.9;

async function recognizeTrack({ file }: JoiExtractTypes<typeof RequestSchemaPayload>) {
    // Init db clients
    const { minio, config, rabbit, log, redis, mongo } = app;
    const upload = promisify(minio.upload).bind(minio);
    const db = mongo.db(config.MONGO_DATABASE);
    const collection = db.collection<IMongoSong>('music')
    const songId = v4();

    console.time('upload file');
    const key = `${ songId }.mp3`
    // Upload file to temporary bucket to be parsed by workers
    await upload({
        Bucket: config.MINIO_TMP_BUCKET,
        Key: key,
        Body: file,
    });
    console.timeEnd('upload file');

    console.time('send to queue');
    // Create temporary queue for rpc call
    const queue = await rabbit.channel
        .assertQueue('',
            { exclusive: true, durable: false, autoDelete: true }
        );

    rabbit.channel.sendToQueue(
            config.RABBIT_MUSIC_RECOGNITION_REQUEST_QUEUE,
            Buffer.from(key),
            {
                headers: {
                    minioBucket: config.MINIO_TMP_BUCKET,
                },
                replyTo: queue.queue,
            }
        );

    console.timeEnd('send to queue');

    console.time('awaiting python');
    // Wait 10 seconds for answer from worker. If there is no answer - drop error
    const message = await timeout(new Promise(async (resolve, reject) => {
        const { consumerTag } = await rabbit.channel.consume(queue.queue, (msg) => {
            rabbit.channel.cancel(consumerTag)
            resolve(msg)
        } );
    }), 10000).catch((error) => {
        log.error(error);
        return null;
    }) as ConsumeMessage | null;

    await rabbit.channel.deleteQueue(queue.queue);

    if (message === null) {
        throw internal(CANNOT_RECOGNIZE_SONG_ERROR_TEXT);
    }
    console.timeEnd('awaiting python');

    console.time('parsing python');
    // Parse input result
    const content = message.content.toString();
    const parsedMessage = JSON.parse(content) as unknown as IFingerPrint;
    const recordTargetZoneCount = Object.keys(parsedMessage).length;

    console.timeEnd('parsing python');



    console.time('finding pairs');

    // Finding all anchors that have at least one fragment address
    const pairsCounterMap: { [stringifiedAnchor: string]: number } = {};
    const localCache = {};
    for (const [timeInterval, addresses] of Object.entries(parsedMessage)) {
      const stringifiedAddresses = addresses.map((address) =>
        JSON.stringify(address)
      );

      const foundAnchors = (await Promise.allSettled(
        stringifiedAddresses.map((address) => {
            if (!localCache[address]) {
                localCache[address] = redis.lRange(getAddressKey(address), 0, -1);
            }

            return localCache[address];
        })
      ))
      .filter((el) => el.status === "fulfilled")
      .flatMap((res: PromiseFulfilledResult<Array<string | null>>) => res.value
        .filter(el => (el !== null))
        .map(el => JSON.parse(el as string))
      ) as IRedisAnchor[]

      for (const anchor of foundAnchors) {
        const stringifiedAnchor = anchor.toString();
        const currentValue = pairsCounterMap[stringifiedAnchor];
        pairsCounterMap[stringifiedAnchor] = currentValue === undefined ? 1 : currentValue + 1;
      }
    }
    console.timeEnd('finding pairs');

    console.log(
        'recordTargetZoneCount', recordTargetZoneCount,
        'pairsCounterMap', Object.keys(pairsCounterMap).length
    );

    // If no match - drop error
    if (!Object.keys(pairsCounterMap).length) {
        throw internal(CANNOT_RECOGNIZE_SONG_ERROR_TEXT);
    }

    console.time('count target zone match by song');
    // Count how many target zones each song match with the sample
    const songTargetZoneCounterMap: { [songId: string]: number } = {};
    for (const [pair, count] of Object.entries(pairsCounterMap)) {
      if (count < 4) {
        delete pairsCounterMap[pair];
      } else {
        const songId = pair.split(',')[1] as string;
        const currentValue = songTargetZoneCounterMap[songId];
        songTargetZoneCounterMap[songId] = currentValue === undefined ? 1 : currentValue + 1;
      }
    }

    const filteredSongKeys = Object.keys(songTargetZoneCounterMap)
        .filter((key) => {
            const value = songTargetZoneCounterMap[key];
            return value >= recordTargetZoneCount * coeff;
        })
        .sort((a,b) => songTargetZoneCounterMap[b] - songTargetZoneCounterMap[a])
        .slice(0,25);

    console.log('pairsCounterMap after filter', Object.keys(pairsCounterMap).length);
    console.log('song count after filter', filteredSongKeys.length);

    if (!filteredSongKeys.length) {
        throw internal(CANNOT_RECOGNIZE_SONG_ERROR_TEXT);
    }
    console.timeEnd('count target zone match by song');


    console.time('Matching deltas');

    // For every song find [maxDelta, maxCountOfMatches] and preserve the best ones
    const result: {[songId: string]: [string, number]} = {};
    for await (const song of filteredSongKeys) {
        const deltas = {};
        const localCache = {};

        // Test every shift in song
        for await (const [timeInterval, addresses] of Object.entries(parsedMessage)) {
            for await (const address of addresses) {
                const key = getSongAddressKey(song, JSON.stringify(address));
                if (!localCache[key]) {
                    localCache[key] = await redis.sMembers(key);
                }

                const positionsInSong = localCache[key];

                for (const position of positionsInSong) {
                    const deltaDiff = +timeInterval - +position;
                    if (deltas[deltaDiff]){
                        deltas[deltaDiff]++;
                    } else {
                        deltas[deltaDiff] = 1;
                    }
                }
            }
        }

        const deltaKeys = Object.keys(deltas);

        // If song was deleted but preserved in redis (due to specific implementation of deleting) - skip it
        if (!deltaKeys.length) {
            continue;
        }

        // Getting delta with best result
        const maxDelta = deltaKeys
            .reduce((a, b) => deltas[a] > deltas[b] ? a : b);

        result[song] = [maxDelta, deltas[maxDelta]];
    }

    console.timeEnd('Matching deltas');

    // Filter songs with match less than targetZoneCount of sample
    const filteredResult = Object.keys(result).filter(key => {
        const matched = result[key][1];
        return matched >= recordTargetZoneCount * coeff;
    })

    console.log(
        "Resulting song count after filtering",
        filteredResult.length
    );

    // Take the best matched song of all resulting songs
    const matchedSong: string | null = filteredResult.sort((a,b) => result[b][1] - result[a][1])[0] || null;

    if (!matchedSong) {
        throw internal(CANNOT_RECOGNIZE_SONG_ERROR_TEXT);
    }

    // Find its metadata in database
    const matchedSongFromDb = await collection.findOne({ _id: matchedSong });

    if (!matchedSongFromDb) {
        throw internal(CANNOT_RECOGNIZE_SONG_ERROR_TEXT);
    }

    return matchedSongFromDb;
}

recognizeTrack.payload = RequestSchemaPayload;

const route: ServerRoute = {
    method: 'POST',
    path: '/recognize-track',
    handler: handleService(recognizeTrack),
    options: {
        cors: {
            additionalHeaders: [
                'authorization',
                'x-requested-with',
            ],
        },
        payload: {
            maxBytes: 1048576 * 5,
            multipart: {
                output: 'stream'
            },
            parse: true,
        },
        validate: extractRequestSchema(recognizeTrack),
    },
};

export default route;

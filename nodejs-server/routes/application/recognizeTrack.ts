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

const RequestSchemaPayload = Joi.object({
    file: JoiWithReadableStreamType.readable().required()
}).required();

const coeff = 0.7;

async function recognizeTrack({ file }: JoiExtractTypes<typeof RequestSchemaPayload>) {
    const { minio, config, rabbit, log, redis, mongo } = app;
    const upload = promisify(minio.upload).bind(minio);
    const db = mongo.db(config.MONGO_DATABASE);
    const collection = db.collection<IMongoSong>('music')
    const songId = v4();

    const key = `${ songId }.mp3`

    await upload({
        Bucket: config.MINIO_TMP_BUCKET,
        Key: key,
        Body: file,
    });

    const queue = await rabbit.channel.assertQueue('', { exclusive: true, durable: false, autoDelete: true });

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

    const content = message.content.toString();
    const parsedMessage = JSON.parse(content) as unknown as IFingerPrint;

    const pairsCounter: { [stringifiedAnchor: string]: number } = {};

    for (const [timeInterval, addresses] of Object.entries(parsedMessage)) {
      const stringifiedAddresses = addresses.map((address) =>
        JSON.stringify(address)
      );

      const result = await Promise.allSettled(
        stringifiedAddresses.map((address) => redis.lRange(getAddressKey(address), 0, -1))
      );

      const fulfilled = result.filter(
      (el) => el.status === "fulfilled"
      ) as PromiseFulfilledResult<Array<string | null>>[];

      const found = fulfilled
        .flatMap(res => res.value
            .filter(el => (el !== null))
            .map(el => JSON.parse(el as string))
        ) as IRedisAnchor[];

      for (const foundAnchor of found) {
        const currentValue = pairsCounter[foundAnchor.toString()];
        pairsCounter[foundAnchor.toString()] = currentValue === undefined ? 1 : currentValue + 1;
      }
    }
    if (!Object.keys(pairsCounter).length) {
        throw internal(CANNOT_RECOGNIZE_SONG_ERROR_TEXT);
    }

    const songTargetZoneCount: { [songId: string]: number } = {};

    for (const [pair, count] of Object.entries(pairsCounter)) {
      if (count < 4) {
        delete pairsCounter[pair];
      } else {
        const songId = pair.split(',')[1] as string;
        const currentValue = songTargetZoneCount[songId];
        songTargetZoneCount[songId] = currentValue === undefined ? 1 : currentValue + 1;
      }
    }

    const targetZoneCount = Object.keys(songTargetZoneCount).length

    const maxKey = Object.keys(songTargetZoneCount)
        .reduce((a, b) => songTargetZoneCount[a] > songTargetZoneCount[b] ? a : b);

    const filteredSongKeys = Object.keys(songTargetZoneCount).filter((key) => {
        const value = songTargetZoneCount[key];
        return value >= targetZoneCount * coeff;
    })

    if (!filteredSongKeys.length) {
        throw new Error(CANNOT_RECOGNIZE_SONG_ERROR_TEXT);
    }

    const result = {};

    for (const song of filteredSongKeys) {
        const deltas = {};
        for (const [timeInterval, addresses] of Object.entries(parsedMessage)) {
            for (const address of addresses) {
                const key = getSongAddressKey(song, JSON.stringify(address));
                const positionsInSong = await redis.sMembers(key);
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
        const maxDelta = Object.keys(deltas)
            .reduce((a, b) => deltas[a] > deltas[b] ? a : b);

        result[song] = [maxDelta, deltas[maxDelta]];
    }

    console.log('result', result);

    const filteredResult = Object.keys(result).filter(key => {
        const matched = result[key][1];
        return matched >= targetZoneCount * coeff;
    })

    const matchedSong: string | null = filteredResult.sort((a,b) => result[a][1] - result[b][1])[0] || null;

    if (!matchedSong) {
        throw new Error(CANNOT_RECOGNIZE_SONG_ERROR_TEXT);
    }

    console.log(
        `message_length: ${Object.keys(parsedMessage).length}`,
        `targetZoneCount: ${targetZoneCount}`,
        `key: ${maxKey}`,
        `value: ${songTargetZoneCount[maxKey]}`,
        `pairsCounter: ${Object.keys(pairsCounter).length}`
        );

    const song = await collection.findOne({ _id: matchedSong })

    return song;
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

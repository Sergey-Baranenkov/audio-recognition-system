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

const coeff = 1;

async function recognizeTrack({ file }: JoiExtractTypes<typeof RequestSchemaPayload>) {
    console.time('upload file')
    const { minio, config, rabbit, log, redis, mongo } = app;
    const upload = promisify(minio.upload).bind(minio);
    const db = mongo.db(config.MONGO_DATABASE);
    const collection = db.collection<IMongoSong>('music')
    const songId = v4();

    const key = `${ songId }.mp3`
    // загружаем файл во временный бакет
    await upload({
        Bucket: config.MINIO_TMP_BUCKET,
        Key: key,
        Body: file,
    });
    console.timeEnd('upload file');

    console.time('send to queue');
    // Создаем временную очередь
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

    // Ждем 10 секунд ответа. Если не приходит - отсылаем пользователю ответ и отписываем консьюмера
    // очередь должна автоматически удалиться?
    const message = await timeout(new Promise(async (resolve, reject) => {
        const { consumerTag } = await rabbit.channel.consume(queue.queue, (msg) => {
            rabbit.channel.cancel(consumerTag)
            resolve(msg)
        } );
    }), 10000).catch((error) => {
        log.error(error);
        return null;
    }) as ConsumeMessage | null;

    // Проверить нужно ли это ?
    await rabbit.channel.deleteQueue(queue.queue);

    if (message === null) {
        throw internal(CANNOT_RECOGNIZE_SONG_ERROR_TEXT);
    }
    console.timeEnd('awaiting python');

    console.time('parsing python');
    // парсим входящий результат
    const content = message.content.toString();
    const parsedMessage = JSON.parse(content) as unknown as IFingerPrint;

    const recordTargetZoneCount = Object.keys(parsedMessage).length;

    console.timeEnd('parsing python');
    const pairsCounterMap: { [stringifiedAnchor: string]: number } = {};

    // Считаем количество пар songId timeInterval
    //console.log(parsedMessage);
    console.time('first part');
    let fpRedisCnt = 0, fpCnt = 0;
    // Перебираем адреса чтобы найти в каких песнях они встречаются
    for (const [timeInterval, addresses] of Object.entries(parsedMessage)) {

      // адреса в определеный промежуток времени
      const stringifiedAddresses = addresses.map((address) =>
        JSON.stringify(address)
      );
      if (fpRedisCnt === 0) {
          console.log(stringifiedAddresses);
      }
      fpRedisCnt+=stringifiedAddresses.length;
      const result = await Promise.allSettled(
        stringifiedAddresses.map((address) => redis.lRange(getAddressKey(address), 0, -1))
      );

      const fulfilled = result.filter((el) => el.status === "fulfilled") as PromiseFulfilledResult<Array<string | null>>[];

      const found = fulfilled
        .flatMap(res => res.value
            .filter(el => (el !== null))
            .map(el => JSON.parse(el as string))
        ) as IRedisAnchor[];
      // console.log(found.length);
      // if (fpCnt === 0) {
      //     console.log(found);
      // }
      for (const foundAnchor of found) {
        fpCnt++;
        const currentValue = pairsCounterMap[foundAnchor.toString()];
        pairsCounterMap[foundAnchor.toString()] = currentValue === undefined ? 1 : currentValue + 1;
      }
    }

    console.log(Math.max(...new Set(Object.values(pairsCounterMap))));
    console.log('fpCnt', fpCnt, 'fpRedisCnt', fpRedisCnt);
    console.log('recordTargetZoneCount', recordTargetZoneCount, 'pairsCounterMap', Object.keys(pairsCounterMap).length);
    console.timeEnd('first part');
    if (!Object.keys(pairsCounterMap).length) {
        throw internal(CANNOT_RECOGNIZE_SONG_ERROR_TEXT);
    }

    const songTargetZoneCounterMap: { [songId: string]: number } = {};

    console.time('second part');
    // Считаем сколько метчей целевых зон от каждой песни
    for (const [pair, count] of Object.entries(pairsCounterMap)) {
      if (count < 4) {
        delete pairsCounterMap[pair];
      } else {
        const songId = pair.split(',')[1] as string;
        const currentValue = songTargetZoneCounterMap[songId];
        songTargetZoneCounterMap[songId] = currentValue === undefined ? 1 : currentValue + 1;
      }
    }
    console.log('song count', Object.keys(songTargetZoneCounterMap).length);
    console.log('pairsCounterMap after filter', Object.keys(pairsCounterMap).length);
    // Отфильтровываем результаты с низким показателем
    const filteredSongKeys = Object.keys(songTargetZoneCounterMap).filter((key) => {
        const value = songTargetZoneCounterMap[key];
        //console.log(key)
        return value >= recordTargetZoneCount * coeff;
    })
    console.log('song count after filter', filteredSongKeys.length);
    if (!filteredSongKeys.length) {
        throw internal(CANNOT_RECOGNIZE_SONG_ERROR_TEXT);
    }
    console.timeEnd('second part');
    // Сопоставляем результаты по времени
    const result: {[songId: string]: [string, number]} = {};

    console.log(
        recordTargetZoneCount,
        filteredSongKeys.length
    );

    console.time('third part');
    let cnt = 0;
    for (const song of filteredSongKeys) {
        const deltas = {};
        for (const [timeInterval, addresses] of Object.entries(parsedMessage)) {
            for (const address of addresses) {
                cnt ++;
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
        const deltaKeys = Object.keys(deltas);

        // Если песня была удалена, но осталась в поиске по адресу
        if (!deltaKeys.length) {
            continue;
        }

        const maxDelta = deltaKeys
            .reduce((a, b) => deltas[a] > deltas[b] ? a : b);

        result[song] = [maxDelta, deltas[maxDelta]];
    }
    console.log('counter', cnt);
    console.timeEnd('third part');
    // Отфильтровываем результаты с низким показателем
    const filteredResult = Object.keys(result).filter(key => {
        const matched = result[key][1];
        return matched >= recordTargetZoneCount * coeff;
    })
    console.log(Object.values(result));
    console.log(Object.keys(result).length, filteredResult.length);
    // Берем песню с наивысшим матчем
    const matchedSong: string | null = filteredResult.sort((a,b) => result[b][1] - result[a][1])[0] || null;

    if (!matchedSong) {
        throw internal(CANNOT_RECOGNIZE_SONG_ERROR_TEXT);
    }

    // Ищем в бд
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

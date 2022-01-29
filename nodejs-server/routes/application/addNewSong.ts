import {ServerRoute} from "hapi";
import handleService from "../handleService";
import extractRequestSchema from "../extractRequestSchema";
import {JoiExtractTypes} from "../../types/JoiExtractTypes";
import {JoiFormDataParser, JoiWithReadableStreamType} from "../../constants/joi";
import Joi from "joi";
import {v4} from 'uuid'
import { createWriteStream } from "fs";
import app from "../../app";
import {promisify} from "util";
import IMongoSong from "../../interfaces/IMongoSong";

const RequestSchemaPayload = Joi.object({
    file: JoiWithReadableStreamType
        .readable()
        .required()
        .description('Файл музыки'),
    title: JoiFormDataParser.init()
        .schema(Joi.string().required())
        .required()
        .description('Название песни'),
    author: JoiFormDataParser.init()
        .schema(Joi.string().required())
        .required()
        .description('Исполнитель песни'),
    genres: JoiFormDataParser.init()
        .schema(Joi.array().items(Joi.string()).required())
        .required()
        .description('Массив жанров песни'),
}).required();

async function addNewSong({ file, title, author, genres }: JoiExtractTypes<typeof RequestSchemaPayload>) {
    const songId = v4();
    const key = `${ songId }.mp3`;

    const { mongo, config, minio, rabbit } = app;

    const db = mongo.db(config.MONGO_DATABASE);
    const collection = db.collection<IMongoSong>('music')
    const metadata = {
        _id: songId,
        title,
        author,
        genres,
    }

    await collection.insertOne(metadata);

    const upload = promisify(minio.upload).bind(minio);


    await upload({
        Bucket: config.MINIO_MUSIC_BUCKET,
        Key: key,
        Body: file,
    });

    rabbit.channel.sendToQueue(
            config.RABBIT_NEW_SONG_REQUEST_QUEUE,
            Buffer.from(key),
            {
                headers: {
                    minioBucket: config.MINIO_MUSIC_BUCKET,
                },
                replyTo: config.RABBIT_NEW_SONG_RESPONSE_QUEUE,
                correlationId: songId,
                persistent: true,
            }
        );

    return true;
}

addNewSong.payload = RequestSchemaPayload;

const route: ServerRoute = {
    method: 'POST',
    path: '/add-song',
    handler: handleService(addNewSong),
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
        validate: extractRequestSchema(addNewSong),
    },
};

export default route;

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
    const songId = Math.floor(Math.random() * 1000000000000);

    const metadata = {
        songId,
        title,
        author,
        genres,
    }

    console.log(metadata);

    // const { minio, config, rabbit } = app;
    // const upload = promisify(minio.upload).bind(minio);
    // const key = `${v4()}.mp3`
    //
    // await upload({
    //     Bucket: config.MINIO_MUSIC_BUCKET,
    //     Key: key,
    //     Body: file,
    // });
    //
    // rabbit.channel.publish(
    //         config.RABBIT_EXCHANGE,
    //         config.RABBIT_NEW_SONG_ROUTING_KEY,
    //         Buffer.from(key),
    //         { headers: { songId } }
    //     );

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

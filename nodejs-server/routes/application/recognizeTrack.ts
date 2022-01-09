import {ServerRoute} from "hapi";
import handleService from "../handleService";
import extractRequestSchema from "../extractRequestSchema";
import {JoiExtractTypes} from "../../types/JoiExtractTypes";
import {JoiWithReadableStreamType} from "../../constants/joi";
import Joi from "joi";
import { createWriteStream } from "fs";

const RequestSchemaPayload = Joi.object({
    file: JoiWithReadableStreamType.readable().required()
}).required();

function recognizeTrack({ file }: JoiExtractTypes<typeof RequestSchemaPayload>) {
    const writeStream = createWriteStream('./test.wav');
    file.pipe(writeStream);

    console.log(file.hapi.filename);
    return { songName: "Имя песни: " + Math.random().toString() };
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

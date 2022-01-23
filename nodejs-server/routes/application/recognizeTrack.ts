import {ServerRoute} from "hapi";
import handleService from "../handleService";
import extractRequestSchema from "../extractRequestSchema";
import {JoiExtractTypes} from "../../types/JoiExtractTypes";
import {JoiWithReadableStreamType} from "../../constants/joi";
import Joi from "joi";
import {v4} from 'uuid'
import app from "../../app";
import {promisify} from "util";

const RequestSchemaPayload = Joi.object({
    file: JoiWithReadableStreamType.readable().required()
}).required();

async function recognizeTrack({ file }: JoiExtractTypes<typeof RequestSchemaPayload>) {
    const { minio, config, rabbit } = app;
    const upload = promisify(minio.upload).bind(minio);
    const key = `${v4()}.mp3`

    await upload({
        Bucket: config.MINIO_TMP_BUCKET,
        Key: key,
        Body: file,
    });



    return true
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

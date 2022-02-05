import {ServerRoute} from "hapi";
import handleService from "../handleService";
import extractRequestSchema from "../extractRequestSchema";
import {JoiExtractTypes} from "../../types/JoiExtractTypes";
import Joi from "joi";
import app from "../../app";
import IMongoSong from "../../interfaces/IMongoSong";
import {promisify} from "util";
import getSongKey from "../../helpers/getSongKey";


const RequestSchemaParams = Joi.object({
    songId: Joi.string().required().description('id песни, которую нужно удалить'),
}).required();

async function songDelete({ songId }: JoiExtractTypes<typeof RequestSchemaParams>) {
    const { mongo, config, minio, redis } = app;
    const db = mongo.db(config.MONGO_DATABASE);
    const collection = db.collection<IMongoSong>('music')
    const key = `${songId}.mp3`;

    const deleteObject = promisify(minio.deleteObject).bind(minio);
    const minioQuery = deleteObject({Bucket: config.MINIO_MUSIC_BUCKET, Key: key});
    const mongoQuery = collection.deleteOne({_id: songId});
    const redisKeysToDelete = await redis.sendCommand<Array<string>>(
        undefined,
        false,
        ['KEYS',`${getSongKey(songId)}*`]
    );
    const redisQuery = redisKeysToDelete.map(key => redis.del(key));

    await Promise.all([minioQuery, mongoQuery, redisQuery]);

    return 'ok';
}

songDelete.params = RequestSchemaParams;

const route: ServerRoute = {
    method: 'DELETE',
    path: '/song/{songId}',
    handler: handleService(songDelete),
    options: {
        validate: extractRequestSchema(songDelete),
    },
};

export default route;

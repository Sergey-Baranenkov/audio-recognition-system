import {ServerRoute} from "hapi";
import handleService from "../handleService";
import extractRequestSchema from "../extractRequestSchema";
import {JoiExtractTypes} from "../../types/JoiExtractTypes";
import Joi from "joi";
import app from "../../app";
import IMongoSong from "../../interfaces/IMongoSong";
import {promisify} from "util";
import getSongKey from "../../helpers/getSongKey";
import _ from "lodash";


const RequestSchemaParams = Joi.object({
    songId: Joi.string().required().description('id песни, которую нужно обновить'),
}).required();

const RequestSchemaPayload = Joi.object({
    newTitle: Joi.string().optional().description('Новый заголовок'),
    newAuthor: Joi.string().optional().description('Новый автор'),
    newGenres: Joi.array().items(Joi.string()).optional().description('Новый массив жанров'),
}).required().or('newTitle', 'newAuthor', 'newGenres');

async function songUpdate({ songId, newTitle, newAuthor, newGenres }: JoiExtractTypes<typeof RequestSchemaParams, typeof RequestSchemaPayload>) {
    const { mongo, config } = app;
    const db = mongo.db(config.MONGO_DATABASE);
    const collection = db.collection<IMongoSong>('music');
    console.log(newGenres)
    const toUpdate = _.omitBy({ title: newTitle, author: newAuthor, genres: newGenres }, _.isUndefined);

    await collection.updateOne(
        { _id: songId },
        { $set: toUpdate }
    );


    return 'ok';
}

songUpdate.params = RequestSchemaParams;
songUpdate.payload = RequestSchemaPayload;

const route: ServerRoute = {
    method: 'PUT',
    path: '/song/{songId}',
    handler: handleService(songUpdate),
    options: {
        validate: extractRequestSchema(songUpdate),
    },
};

export default route;

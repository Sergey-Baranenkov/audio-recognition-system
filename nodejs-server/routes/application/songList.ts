import {ServerRoute} from "hapi";
import handleService from "../handleService";
import extractRequestSchema from "../extractRequestSchema";
import {JoiExtractTypes} from "../../types/JoiExtractTypes";
import Joi from "joi";
import app from "../../app";
import IMongoSong from "../../interfaces/IMongoSong";


const RequestSchemaQuery = Joi.object({
    search: Joi.string().optional().description('Полнотекстовый поиск'),
    offset: Joi.number().integer().required().description('Смещение'),
    limit: Joi.number().integer().required().description('Максимальное количество записей'),
}).required();

async function songList({ offset, limit, search }: JoiExtractTypes<typeof RequestSchemaQuery>) {
    const { mongo, config } = app;
    const db = mongo.db(config.MONGO_DATABASE);
    const collection = db.collection<IMongoSong>('music')

    const filter = search ? {
        $text: {
            $search: search,
            $caseSensitive: false,
        }
    }: {}

    return collection.find<IMongoSong>(filter, { skip: offset, limit, projection: ['title', 'author', 'genres'] }).toArray()
}

songList.query = RequestSchemaQuery;

const route: ServerRoute = {
    method: 'GET',
    path: '/song-list',
    handler: handleService(songList),
    options: {
        validate: extractRequestSchema(songList),
    },
};

export default route;

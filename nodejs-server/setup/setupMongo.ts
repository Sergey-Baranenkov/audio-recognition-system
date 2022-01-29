import * as AWS from 'aws-sdk'
import {AppEnvironmentVariablesType} from "./validateEnvironmentVariables";
import {MongoClient} from "mongodb";

export default async function (config: AppEnvironmentVariablesType) {
    const client = new MongoClient(config.MONGO_ENDPOINT, { authSource: config.MONGO_DATABASE });
    await client.connect();

    return client;
}

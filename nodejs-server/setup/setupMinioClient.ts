import * as AWS from 'aws-sdk'
import {AppEnvironmentVariablesType} from "./validateEnvironmentVariables";

export default function (config: AppEnvironmentVariablesType) {
    return new AWS.S3({
        accessKeyId: config.MINIO_ACCESS_KEY,
        secretAccessKey: config.MINIO_SECRET_KEY,
        endpoint: `http://${config.MINIO_ENDPOINT}`,
        s3ForcePathStyle: true,
        signatureVersion: 'v4',
    });
}

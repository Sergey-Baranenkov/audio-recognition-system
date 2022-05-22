export enum AppEnvironmentVariablesEnum {
  LOG_LEVEL = 'LOG_LEVEL',
  SERVER_PORT = 'SERVER_PORT',
  MINIO_ACCESS_KEY = 'MINIO_ACCESS_KEY',
  MINIO_SECRET_KEY = 'MINIO_SECRET_KEY',
  MINIO_ENDPOINT = 'MINIO_ENDPOINT',
  MINIO_MUSIC_BUCKET = 'MINIO_MUSIC_BUCKET',
  MINIO_TMP_BUCKET = 'MINIO_TMP_BUCKET',
  MINIO_PUBLIC_URL = 'MINIO_PUBLIC_URL',

  RABBIT_ENDPOINT='RABBIT_ENDPOINT',
  RABBIT_USER='RABBIT_USER',
  RABBIT_PASSWORD='RABBIT_PASSWORD',

  RABBIT_MUSIC_RECOGNITION_REQUEST_QUEUE='RABBIT_MUSIC_RECOGNITION_REQUEST_QUEUE',
  RABBIT_MUSIC_RECOGNITION_RESPONSE_QUEUE='RABBIT_MUSIC_RECOGNITION_RESPONSE_QUEUE',
  RABBIT_NEW_SONG_REQUEST_QUEUE='RABBIT_NEW_SONG_REQUEST_QUEUE',
  RABBIT_NEW_SONG_RESPONSE_QUEUE='RABBIT_NEW_SONG_RESPONSE_QUEUE',

  REDIS_SERVICE_ENDPOINT = 'REDIS_SERVICE_ENDPOINT',
  REDIS_USER = 'REDIS_USER',
  REDIS_PASSWORD = 'REDIS_PASSWORD',

  MONGO_ENDPOINT = 'MONGO_ENDPOINT',
  MONGO_DATABASE = 'MONGO_DATABASE',
}

export type AppEnvironmentVariablesType = {
  [key in keyof typeof AppEnvironmentVariablesEnum]: string;
};

export default function (variables: object): asserts variables is AppEnvironmentVariablesType {
  const missingVariables = Object.keys(AppEnvironmentVariablesEnum).filter((key) => variables[key] === undefined);
  if (missingVariables.length) {
    throw new Error(`Не заданы необходимые переменные окружения: \n${missingVariables.join('\n')}`);
  }
}

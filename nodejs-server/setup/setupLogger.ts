import pino, { LoggerOptions } from 'pino';
import { AppEnvironmentVariablesType } from './validateEnvironmentVariables';

export default function (config: AppEnvironmentVariablesType) {
  let options: LoggerOptions;
  const excludeFiles = {
    redact: {
      paths: [
        'request.body.file',
      ],
      censor: 'too big to show',
    },
  };

  switch (config.LOG_LEVEL) {
    case 'local':
      options = { prettyPrint: { colorize: true }, level: 'debug', ...excludeFiles };
      break;
    default:
      options = { level: config.LOG_LEVEL, ...excludeFiles };
  }

  return pino(options);
}

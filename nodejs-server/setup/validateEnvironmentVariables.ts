export enum AppEnvironmentVariablesEnum {
  LOG_LEVEL = 'LOG_LEVEL',
  SERVER_PORT = 'SERVER_PORT',
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

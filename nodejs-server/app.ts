import Pino from 'pino';
import Inert from '@hapi/inert';

import * as Hapi from '@hapi/hapi';
import * as Boom from '@hapi/boom';
import * as AWS from 'aws-sdk'


import setupLogger from './setup/setupLogger';
import routes from './routes';
import validateEnvironmentVariables, {AppEnvironmentVariablesType} from "./setup/validateEnvironmentVariables";
import * as Path from "path";
import setupMinioClient from "./setup/setupMinioClient";
import amqp from "amqplib";
import setupRabbit, {IRabbit} from "./setup/setupRabbit";

class App {
  private logger: Pino.Logger;

  private _minio: AWS.S3;

  private _rabbit: IRabbit;

  private server: Hapi.Server;

  private _config: AppEnvironmentVariablesType;

  public async start(environmentVariables: object): Promise<Hapi.Server> {
    process.on('unhandledRejection', (err) => {
      console.error('unhandledRejection', err);
      // process.exit(1);
    });

    validateEnvironmentVariables(environmentVariables);
    this._config = environmentVariables;

    try {
      this.logger = setupLogger(this.config);
      this._minio = setupMinioClient(this.config);
      await this.connectRabbit();

      await this.initServer();
      await this.server.start();

      this.log.info(`Server running at ${this.server.info.uri}`);
    } catch (err) {
      const logger = this.log || console;
      if (this.server) {
        await this.server.stop();
      }
      logger.error(err);
    }

    return this.server;
  }

  public async stop() {
    return this.server.stop();
  }

  private async connectRabbit() {
    try {
      this._rabbit = await setupRabbit(this.config);
      this._rabbit.connection.on(
          'error',
          async () => {
            this.log.error('Connection with rabbit lost!');
            setTimeout(this.connectRabbit.bind(this), 3000)
          }
      );
      this.log.info('Connection with rabbit established!');
    } catch (e) {
      this.log.warn('Trying to reconnect to rabbit...');
      setTimeout(this.connectRabbit.bind(this), 3000);
    }
  }


  public get config(): AppEnvironmentVariablesType {
    return this._config;
  }

  public get log(): Pino.Logger {
    return this.logger;
  }

  public get minio(): AWS.S3 {
    return this._minio;
  }

  public get rabbit(): IRabbit {
    return this._rabbit;
  }

  private async initServer() {
    this.server = new Hapi.Server({
      port: +this.config.SERVER_PORT,
      routes: {
        files: {
          relativeTo: Path.join(__dirname, 'static'),
        },
        cors: {
          origin: ['*'],
        },
        validate: {
          failAction: async (request, h, err) => {
            if (err) {
              throw Boom.badRequest(err.message);
            }
          },
          options: {
            abortEarly: false,
          },
        },
      },
    });

    this.server.events.on('response', (request) => {
      const {
        info: { remoteAddress },
      } = request;


      this.log.info({
        request: {
          from: remoteAddress,
          to: `${request.method.toUpperCase()} ${request.path}`,
          headers: request.headers,
          body: request.payload,
        },
        response: {
          body: 'response'
        },
      });
      return true;
    });

    await this.server.register(Inert);
    this.server.route(routes);
  }
}

export default new App();

import Pino from 'pino';
import Inert from '@hapi/inert';

import * as Hapi from '@hapi/hapi';
import * as Boom from '@hapi/boom';

import setupLogger from './setup/setupLogger';
import routes from './routes';
import validateEnvironmentVariables, {AppEnvironmentVariablesType} from "./setup/validateEnvironmentVariables";
import * as Path from "path";

class App {
  private logger: Pino.Logger;

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

  public get config(): AppEnvironmentVariablesType {
    return this._config;
  }

  public get log(): Pino.Logger {
    return this.logger;
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

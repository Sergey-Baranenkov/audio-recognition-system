import { ServerRoute } from 'hapi';
import Boom from '@hapi/boom';

export const routeNotExist: ServerRoute = {
  method: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  path: '/{any*}',
  handler: () => Boom.methodNotAllowed('Method Not Allowed'), // Code 405
};

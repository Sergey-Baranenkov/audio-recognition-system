import Boom from '@hapi/boom';
import app from '../app';

export default function(service: any) {
  return async (req, h) => {
    let data = { ...req.query, ...req.payload, ...req.params };

    try {
      return await service(data, h.request.headers, h);
    } catch (error) {

      const isBoom = Boom.isBoom(error);
      if (!isBoom) {
        app.log.error(error);
      }

      return Boom.badRequest(error.message);
    }
  };
}

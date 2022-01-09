import _ from 'lodash';

export default function(service: any) {
  const { params, payload, query } = service;

  return _.omitBy({ params, payload, query }, _.isUndefined);
}

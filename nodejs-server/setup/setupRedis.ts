import { AppEnvironmentVariablesType } from './validateEnvironmentVariables';
import {createCluster} from "redis";

export default async function (config: AppEnvironmentVariablesType) {
   const cluster = createCluster({
       rootNodes: [{ url: `redis://${config.REDIS_SERVICE_ENDPOINT}` }],
       defaults: {
           password: config.REDIS_PASSWORD,
       }
   });

   await cluster.connect();

   return cluster;
}

import { routeNotExist } from './system/routeNotExists';
import { ServerRoute } from 'hapi';
import recognizeTrack from "./application/recognizeTrack";


const routes: ServerRoute[] = [
  recognizeTrack,
  routeNotExist
];

export default routes;

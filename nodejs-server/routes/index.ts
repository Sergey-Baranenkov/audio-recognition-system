import { routeNotExist } from './system/routeNotExists';
import { ServerRoute } from 'hapi';
import recognizeTrack from "./application/recognizeTrack";
import addNewSong from "./application/addNewSong";


const routes: ServerRoute[] = [
  addNewSong,
  recognizeTrack,
  routeNotExist
];

export default routes;

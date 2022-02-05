import { routeNotExist } from './system/routeNotExists';
import { ServerRoute } from 'hapi';
import recognizeTrack from "./application/recognizeTrack";
import addNewSong from "./application/addNewSong";
import songList from "./application/songList";


const routes: ServerRoute[] = [
  songList,
  addNewSong,
  recognizeTrack,
  routeNotExist
];

export default routes;

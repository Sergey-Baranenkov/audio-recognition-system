import { routeNotExist } from './system/routeNotExists';
import { ServerRoute } from 'hapi';
import recognizeTrack from "./application/recognizeTrack";
import addNewSong from "./application/addNewSong";
import songList from "./application/songList";
import songDelete from "./application/songDelete";


const routes: ServerRoute[] = [
  songDelete,
  songList,
  addNewSong,
  recognizeTrack,
  routeNotExist
];

export default routes;

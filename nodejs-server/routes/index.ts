import { routeNotExist } from './system/routeNotExists';
import { ServerRoute } from 'hapi';
import recognizeTrack from "./application/recognizeTrack";
import addNewSong from "./application/addNewSong";
import songList from "./application/songList";
import songDelete from "./application/songDelete";
import songUpdate from "./application/songUpdate";


const routes: ServerRoute[] = [
  songUpdate,
  songDelete,
  songList,
  addNewSong,
  recognizeTrack,
  routeNotExist
];

export default routes;

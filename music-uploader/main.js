import fs from 'fs';
import {parseFile} from "music-metadata";
import FormData from "form-data";
import fetch from 'node-fetch';

export default async function parseMP3Metadata(path){
    return parseFile(path);
}

const musicFolder = '/home/araxal/harddrive/fma_small';

const filesInMainFolder = fs.readdirSync(musicFolder, { withFileTypes: true }) ;
const directoriesInMainFolder = filesInMainFolder
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

const genresToUpload = 15;
let counter = 0;

const endpoint = 'http://127.0.0.1:1337/add-song';

for (const directory of directoriesInMainFolder) {
    if (counter >= genresToUpload) {
        break;
    }
    counter++;

    console.log('Current genre', directory);

    const filesInSubdirectory = fs.readdirSync(`${musicFolder}/${directory}`);
    for await (const file of filesInSubdirectory) {
        const link = `${musicFolder}/${directory}/${file}`;
        const { common } = await parseMP3Metadata(link);
        const body = new FormData();
        body.append('title', common.title || 'Unknown song');
        body.append('author', common.artist || 'Unknown artist');
        body.append('genres', JSON.stringify(common.genre  || ['unknown']));
        body.append('file', fs.createReadStream(link));

        await fetch(endpoint, { method: "POST", body });
    }
    console.log('files of genre uploaded:', filesInSubdirectory.length);
}

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

let counter = 0;

const endpoint = 'http://localhost:1337/add-song';

label:
for (const directory of directoriesInMainFolder) {
    const filesInSubdirectory = fs.readdirSync(`${musicFolder}/${directory}`);
    for await (const file of filesInSubdirectory) {
        console.log(directory, file);
        const link = `${musicFolder}/${directory}/${file}`;
        const { common } = await parseMP3Metadata(link);

        console.log(common)
        const body = new FormData();
        body.append('title', common.title || 'Unknown song');
        body.append('author', common.artist || 'Unknown artist');
        body.append('genres', JSON.stringify(common.genre  || ['unknown']));
        body.append('file', fs.createReadStream(link));

        await fetch(endpoint, { method: "POST", body });


        counter ++;
        if (counter > 100) {
            break label;
        }
    }
}

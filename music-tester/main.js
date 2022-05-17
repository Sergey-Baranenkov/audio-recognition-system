import fs from 'fs';
import {parseFile} from "music-metadata";
import fetch from 'node-fetch';
import FormData from 'form-data';

export default async function parseMP3Metadata(path){
    return parseFile(path);
}

const musicFolder = '/home/araxal/harddrive/fma_small';

const cutMusicFolder = '/home/araxal/harddrive/fma_small_cut';

const timeInterval = '5s';

const genresToTest = 1;
let counter = 0;

const endpoint = 'http://localhost:1337/recognize-track';

let globalIncorrectlyRecognizedCounter = 0;
let globalRecognizedCounter = 0;
let globalUnrecognizedCounter = 0;

const filesInMainFolder = fs.readdirSync(musicFolder, { withFileTypes: true }) ;
const directoriesInMainFolder = filesInMainFolder
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

for (const directory of directoriesInMainFolder) {
    let incorrectlyRecognizedCounter = 0;
    let recognizedCounter = 0;
    let unrecognizedCounter = 0;

    if (counter >= genresToTest) {
        break;
    }
    counter++;

    console.log('Current genre', directory);

    const filesInSubdirectory = fs.readdirSync(`${musicFolder}/${directory}`);
    for await (const file of filesInSubdirectory) {
        const link = `${directory}/${file}`;
        const { common } = await parseMP3Metadata(`${musicFolder}/${link}`);


        const cutFile = fs.createReadStream(`${cutMusicFolder}/${timeInterval}/${link}`);

        const body = new FormData();
        body.append('file', cutFile);

        const result = await fetch(endpoint, { method: "POST", body })
            .then(res => res.json())
            .catch(e => { return null; });

        if (result && result.title && result.title === common.title && result.author === common.artist) {
            recognizedCounter ++;
            globalRecognizedCounter++;
        } else if (result && result.title) {
            //console.log('incorrect', file, common, result)
            globalIncorrectlyRecognizedCounter++;
            incorrectlyRecognizedCounter++;
        } else {
            //console.log('unrecognized', file, common)
            globalUnrecognizedCounter++;
            unrecognizedCounter++ ;
        }
    }
    console.log('Result for genre:', { recognizedCounter, incorrectlyRecognizedCounter, unrecognizedCounter });
}
console.log('Total:', { globalRecognizedCounter, globalIncorrectlyRecognizedCounter, globalUnrecognizedCounter });

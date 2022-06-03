import fs from 'fs';
import combiner from './audio-combiner.js';
const cutMusicFolder = '/home/araxal/harddrive/fma_small_cut';

const timeInterval = '5s';
const noiseFile = `noise_${timeInterval}.mp3`;
const genresToTest = 15;
let counter = 0;

const filesInSubdirectory = fs.readdirSync(`${cutMusicFolder}/${timeInterval}`);
for (const genre of filesInSubdirectory) {
    counter ++;
    if (counter > genresToTest) break;
    const genreLink = `${cutMusicFolder}/${timeInterval}/${genre}`;
    const resultingGenreLink = genreLink.replace('fma_small_cut', 'fma_small_cut_noise');
    fs.mkdir(
        resultingGenreLink,
        { recursive: true },
        ()=>{});

    for (const file of fs.readdirSync(genreLink)) {
        const fullLink = `${genreLink}/${file}`;
        const fullResultingLink = `${resultingGenreLink}/${file}`;
        combiner.combineSamples(fullLink, noiseFile, fullResultingLink, () => {});
    }

}

import fs from 'fs';
import cutter from 'mp3-cutter';

const musicFolder = '/home/araxal/harddrive/fma_small';
const targetFolder = '/home/araxal/harddrive/fma_small_cut';

const filesInMainFolder = fs.readdirSync(musicFolder, { withFileTypes: true }) ;
const directoriesInMainFolder = filesInMainFolder
    .filter(dirent => dirent.isDirectory())
    .map(dirent => dirent.name);

const timeIntervals = ['5s', '7s', '10s'];

for (const timeInterval of timeIntervals) {
    const intSecond = parseInt(timeInterval);
    for (const directory of directoriesInMainFolder) {
        fs.mkdirSync(`${targetFolder}/${timeInterval}/${directory}`)


        const filesInSubdirectory = fs.readdirSync(`${musicFolder}/${directory}`);
        for await (const file of filesInSubdirectory) {
            const link = `${musicFolder}/${directory}/${file}`;
            cutter.cut({
                src: link,
                target: `${targetFolder}/${timeInterval}/${directory}/${file}`,
                start: 5,
                end: 5 + intSecond,
            })
            console.log(link)
        }
    }
}


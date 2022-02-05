import getSongKey from "./getSongKey";

export default function (songId: any, addr: string) {
    return `${getSongKey(songId)}:addr#${addr}`;
}

import {Readable} from "stream";

export interface IHapiReadable extends Readable {
    hapi: {
        filename: string,
        headers: {
            [key: string]: string,
        }
    }
}

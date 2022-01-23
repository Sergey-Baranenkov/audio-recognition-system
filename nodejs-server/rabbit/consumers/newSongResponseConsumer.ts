import { ConsumeMessage } from "amqplib";
import {IFingerPrint, IRedisAnchor} from "../../interfaces/IFingerPrint";
import app from "../../app";
import getSongKey from '../../helpers/getSongKey';
import getAddressKey from "../../helpers/getAddressKey";

export default async function (message: ConsumeMessage) {
  console.log(message.properties.headers)
  const songId = 2000;
  const { redis } = app;
  const content = message.content.toString();
  const parsedMessage = JSON.parse(content) as unknown as IFingerPrint;
  // for (const [timeInterval, addresses] of Object.entries(parsedMessage)) {
  //     const stringifiedAddresses = addresses.map((address) => JSON.stringify(address));
  //     const stringifiedAnchor = JSON.stringify([+timeInterval, songId]);
  //     await Promise.all([
  //         redis.set(getSongKey(songId), content),
  //         stringifiedAddresses.map((address) => redis.rPush(getAddressKey(address), stringifiedAnchor)),
  //     ]);
  // }


  const pairsCounter: { [stringifiedAnchor: string]: number } = {};

  for (const [timeInterval, addresses] of Object.entries(parsedMessage)) {
    const stringifiedAddresses = addresses.map((address) =>
      JSON.stringify(address)
    );

    const result = await Promise.allSettled(
      stringifiedAddresses.map((address) => redis.lRange(getAddressKey(address), 0, -1))
    );

    const fulfilled = result.filter(
    (el) => el.status === "fulfilled"
    ) as PromiseFulfilledResult<Array<string | null>>[];

    const found = fulfilled
      .flatMap(res => res.value
          .filter(el => el !== null)
          .map(el => JSON.parse(el as string))
      ) as IRedisAnchor[];

    for (const foundAnchor of found) {
      const currentValue = pairsCounter[foundAnchor.toString()];
      pairsCounter[foundAnchor.toString()] = currentValue === undefined ? 1 : currentValue + 1;
    }
  }

  const songTargetZoneCount: { [songId: string]: number } = {};

  for (const [pair, count] of Object.entries(pairsCounter)) {
    if (count < 4) {
      delete pairsCounter[pair];
    } else {
      const songId = pair.split(',')[1] as string;
      const currentValue = songTargetZoneCount[songId];
      songTargetZoneCount[songId] = currentValue === undefined ? 1 : currentValue + 1;
    }
  }

  console.log( Object.keys(parsedMessage).length,Object.entries(songTargetZoneCount));
}

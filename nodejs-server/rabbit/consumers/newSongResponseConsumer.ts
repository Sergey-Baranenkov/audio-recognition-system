import { ConsumeMessage } from "amqplib";
import {IFingerPrint, IRedisAnchor} from "../../interfaces/IFingerPrint";
import app from "../../app";
import getSongKey from '../../helpers/getSongKey';
import getAddressKey from "../../helpers/getAddressKey";

export default async function (message: ConsumeMessage) {
  const songId: number | undefined = message.properties.correlationId;
  if (!songId) {
    throw new Error(`Unrecognized songId! Got ${songId}`);
  }

  const { redis } = app;
  const content = message.content.toString();
  const parsedMessage = JSON.parse(content) as unknown as IFingerPrint;

  for (const [timeInterval, addresses] of Object.entries(parsedMessage)) {
      const stringifiedAddresses = addresses.map((address) => JSON.stringify(address));
      const stringifiedAnchor = JSON.stringify([+timeInterval, songId]);
      await Promise.all([
          // redis.set(getSongKey(songId), content),
          stringifiedAddresses.map((address) => redis.rPush(getAddressKey(address), stringifiedAnchor)),
      ]);
  }
}

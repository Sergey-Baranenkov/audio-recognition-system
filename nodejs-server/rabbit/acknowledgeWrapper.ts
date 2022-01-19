import {ConsumeMessage, Message} from "amqplib";
import app from "../app";

export function acknowledgeWrapper(listener: (m: ConsumeMessage) => any) {
    return async (msg: ConsumeMessage) => {
        try {
            await listener(msg);
            await app.rabbit.channel.ack(msg);
        } catch (e) {
            // удаляем сообщение из очереди
            await app.rabbit.channel.nack(msg, undefined, false);
            throw e;
        }
    };
}

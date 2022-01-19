import {ConsumeMessage, Message} from "amqplib";

export default async function (message: ConsumeMessage) {
    console.log(JSON.parse(message.content.toString()));
}

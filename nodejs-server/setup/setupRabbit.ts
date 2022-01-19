import amqp, {Channel} from 'amqplib';

import {AppEnvironmentVariablesType} from "./validateEnvironmentVariables";
import {timeout, TimeoutError} from "promise-timeout";
import initConsumers from "../rabbit/consumers/initConsumers";

export interface IRabbit {
    channel: amqp.Channel;
    connection: amqp.Connection;
}

function handleConnectionString(config: AppEnvironmentVariablesType): string {
    return `amqp://${config.RABBIT_USER}:${config.RABBIT_PASSWORD}@${config.RABBIT_ENDPOINT}`
}

export default async function (config: AppEnvironmentVariablesType) {
    const connectionString = handleConnectionString(config);
    const connection = await amqp.connect(connectionString).catch((error) => {
        throw new Error(`Не удалось подключиться к RabbitMQ: ${error.message}`);
    });
    const timeoutInMillis = 5 * 1000;
    const channel = await timeout(
        connection.createChannel() as unknown as Promise<Channel>,
        timeoutInMillis
    ).catch(async (error) => {
        await channel.close();
        if (error instanceof TimeoutError) {
            throw new Error(`Не удалось подключиться к RabbitMQ по таймауту ${timeoutInMillis}мс`);
        }
        throw error;
    });

    await channel.prefetch(10);
    await initConsumers(channel);
    return { channel, connection };
}

import app from "../../app";
import newSongResponseConsumer from "./newSongResponseConsumer";
import {Channel} from "amqplib";
import {acknowledgeWrapper} from "../acknowledgeWrapper";

export default async function initConsumers(channel: Channel) {
    const listenerSet = {
        [app.config.RABBIT_NEW_SONG_RESPONSE_QUEUE]: newSongResponseConsumer,
    };
    await Promise.all(
        Object.entries(listenerSet).map(([q, listener]) => channel.consume(q, acknowledgeWrapper(listener))),
    );
}

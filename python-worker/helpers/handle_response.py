import json
import os

from pika.channel import Channel
import pika

def handle_response(ch: Channel, result: list, properties: dict):
    json_data = json.dumps(result)

    ch.basic_publish(
        exchange='', # Если не указан то routing_key === queue_name
        routing_key=properties.reply_to,
        body=json_data,
        properties=pika.BasicProperties ( correlation_id = properties.correlation_id )
    )

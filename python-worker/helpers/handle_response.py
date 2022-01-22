import json
import os

from pika.channel import Channel


def handle_response(ch: Channel, result: list):
    exchange = os.getenv('RABBIT_EXCHANGE')
    routing_key = os.getenv('RABBIT_RESPONSE_ROUTING_KEY')
    json_data = json.dumps(result)
    print('handled')
    ch.basic_publish(exchange=exchange, routing_key=routing_key, body=json_data)

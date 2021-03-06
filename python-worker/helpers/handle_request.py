
from pika.channel import Channel
from pika.spec import Basic, BasicProperties

from helpers.downsample_sound import downsample_sound
from helpers.handle_response import handle_response
from helpers.parse_file import parse_file
from helpers.perform_algorithm import perform_algorithm


def handle_request(ch: Channel, method: Basic.Deliver, properties: BasicProperties, body: bytes):
    filename = body.decode()
    sound = parse_file(filename, properties.headers['minioBucket'])
    downsampled_sound, downsampled_frame_rate = downsample_sound(sound)
    #тут вероятно добавить 3 параметр 4096 / 4 так как мы в 4 раза даунсемплим
    result = perform_algorithm(downsampled_sound, downsampled_frame_rate, 1024)
    handle_response(ch, result, properties)
    print('handled', method.routing_key)
    ch.basic_ack(delivery_tag=method.delivery_tag)

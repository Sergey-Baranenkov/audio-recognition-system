
from pika.channel import Channel
from pika.spec import Basic, BasicProperties

from helpers.downsample_sound import downsample_sound
from helpers.handle_response import handle_response
from helpers.parse_file import parse_file
from helpers.perform_algorithm import perform_algorithm


def handle_request(ch: Channel, method: Basic.Deliver, properties: BasicProperties, body: bytes):
    filename = body.decode()
    sound = parse_file(filename)
    downsampled_sound, downsampled_frame_rate = downsample_sound(sound)
    result = perform_algorithm(downsampled_sound, downsampled_frame_rate)
    handle_response(ch, result)
    ch.basic_ack(delivery_tag=method.delivery_tag)

import pika

from helpers.handle_request import handle_request


def run_rabbit(
        username: str,
        password: str,
        host: str,
        port: int,
        request_queue: str,
        consumer_tag: str
):
    credentials = pika.PlainCredentials(username, password)
    connection = pika.BlockingConnection(
        pika.ConnectionParameters(host=host, port=port, credentials=credentials)
    )
    channel = connection.channel()
    channel.basic_qos(prefetch_count=1)
    channel.basic_consume(
        request_queue,
        handle_request,
        consumer_tag=consumer_tag,
    )

    print('Starting consuming messages...')
    channel.start_consuming()
    connection.close()

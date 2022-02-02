import pika

from helpers.handle_request import handle_request

def parse_queues_to_list(request_queues: str):
    return request_queues.split(',')

def run_rabbit(
        username: str,
        password: str,
        host: str,
        port: int,
        request_queues: str,
):
    credentials = pika.PlainCredentials(username, password)
    connection = pika.BlockingConnection(
        pika.ConnectionParameters(host=host, port=port, credentials=credentials)
    )
    channel = connection.channel()
    channel.basic_qos(prefetch_count=1)

    queues = parse_queues_to_list(request_queues)

    for queue in queues:
        channel.basic_consume(
            queue,
            handle_request,
        )

    print('Starting consuming messages...')
    channel.start_consuming()
    connection.close()

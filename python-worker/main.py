import os

from helpers.run_rabbit import run_rabbit


def main():
    run_rabbit(
        username=os.getenv('RABBIT_USERNAME'),
        password=os.getenv('RABBIT_PASSWORD'),
        host=os.getenv('RABBIT_HOST'),
        port=int(os.getenv('RABBIT_PORT')),
        request_queues=os.getenv('RABBIT_REQUEST_QUEUES'),
    )


if __name__ == '__main__':
    main()

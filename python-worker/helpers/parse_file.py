import io
import os

import boto3
from pydub import AudioSegment


def parse_file(filename, bucket):
    session = boto3.Session(
        aws_access_key_id=os.getenv('MINIO_ACCESS_KEY'),
        aws_secret_access_key=os.getenv('MINIO_SECRET_KEY')
    )
    client = session.client('s3', endpoint_url='http://' + os.getenv('MINIO_ENDPOINT'))

    obj = client.get_object(Bucket=bucket, Key=filename)
    file = io.BytesIO(obj['Body'].read())
    return AudioSegment.from_file(file)

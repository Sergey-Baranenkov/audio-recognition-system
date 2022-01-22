from python:3.10-slim

RUN apt-get update && apt-get install -yq ffmpeg

WORKDIR /usr/src/app/

COPY . .

RUN pip install --disable-pip-version-check --no-cache-dir -r requirements.txt

CMD python -u main.py
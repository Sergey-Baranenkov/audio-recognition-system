FROM node:16.13.0-alpine3.14

COPY . /usr/src/app/

WORKDIR /usr/src/app/

RUN npm ci

RUN ls

CMD ["npm", "run", "dev"]

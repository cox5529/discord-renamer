FROM node:16 as build

WORKDIR /app
COPY package.json .
COPY package-lock.json .

RUN npm ci

COPY . .

RUN npm run build
ENTRYPOINT [ "node", "./build/index.js" ]

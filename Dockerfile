FROM node:16 as build

WORKDIR /app
COPY package.json .
COPY package-lock.json .

RUN npm ci

COPY . .

RUN npm run build

FROM node:16 as final
RUN mkdir /app
COPY --from=build /app/package*.json /app/
COPY --from=build /app/build/* /app/build/
WORKDIR /app
ENTRYPOINT [ "node", "./build/index.js" ]

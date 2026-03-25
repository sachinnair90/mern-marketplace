FROM node:14-alpine

WORKDIR /app

COPY package.json ./
RUN npm install --legacy-peer-deps

COPY . .

RUN ./node_modules/.bin/webpack --config webpack.config.client.production.js && \
    ./node_modules/.bin/webpack --mode=production --config webpack.config.server.js

EXPOSE 3000

CMD ["npm", "start"]

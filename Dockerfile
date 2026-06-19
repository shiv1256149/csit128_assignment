FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build:css

EXPOSE 3010

ENTRYPOINT ["docker/entrypoint.sh"]

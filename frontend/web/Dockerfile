FROM node:20-alpine

WORKDIR /app
ENV HOSTNAME=0.0.0.0

COPY package.json /app/package.json
COPY frontend/web/package.json /app/frontend/web/package.json
RUN npm install

COPY . /app
RUN npm run build:web

WORKDIR /app/frontend/web
CMD ["node", ".next/standalone/frontend/web/server.js"]

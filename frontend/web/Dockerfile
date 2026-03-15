FROM node:20-alpine

WORKDIR /app

COPY package.json /app/package.json
COPY frontend/web/package.json /app/frontend/web/package.json
RUN npm install

COPY . /app
RUN npm run build:web

WORKDIR /app/frontend/web
CMD ["npm", "run", "start"]

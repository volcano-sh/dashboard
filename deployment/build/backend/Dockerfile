FROM node:lts-slim

WORKDIR /app

COPY backend .

RUN npm install

EXPOSE 3001

CMD ["node", "src/server.js"]
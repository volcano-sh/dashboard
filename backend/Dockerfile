FROM node:16.18.1-alpine3.17

WORKDIR /app
COPY . .

# COPY package*.json ./
RUN npm install

EXPOSE 3000

CMD ["node", "server.js"]
# Frontend/Dockerfile
FROM node:16.18.1-buster 

WORKDIR /app

COPY . .

RUN npm install

RUN npm run build

RUN npm install -g serve

EXPOSE 3001

CMD ["serve", "-s", "build", "-p", "3001"]
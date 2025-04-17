FROM node:lts-slim AS builder

WORKDIR /app
ENV ROLLUP_SKIP_NATIVES=true
COPY frontend/package*.json ./

RUN npm install

COPY frontend .

RUN npm run build

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html

COPY frontend/nginx.conf /etc/nginx/nginx.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
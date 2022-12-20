FROM node:latest as node
WORKDIR /tradeui
COPY . .
RUN npm install
RUN npm run build --prod

FROM nginx:alpine
COPY --from=node /tradeui/dist/figuration-engine /usr/share/nginx/html

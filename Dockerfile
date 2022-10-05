FROM node:16-alpine as build-image
WORKDIR /build
COPY package*.json ./
COPY tsconfig.json ./
COPY ./src ./src
RUN npm ci
RUN npx tsc

FROM node:16-alpine
WORKDIR /project
COPY package*.json ./
COPY --from=build-image ./build/dist ./
RUN npm ci --production
EXPOSE 8080
CMD [ "node", "/project" ]

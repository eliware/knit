FROM ghcr.io/eliware/centos10-node26:latest

WORKDIR /home/node/knit
ENV NODE_ENV=production \
    PORT=3456

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY bin ./bin
COPY src ./src
COPY assets ./assets
COPY commands ./commands
COPY events ./events
COPY locales ./locales

EXPOSE 3456
CMD ["node", "bin/knit.mjs"]

FROM node:26-bookworm-slim

WORKDIR /opt/knit
ENV NODE_ENV=production \
    PORT=3456

RUN apt-get update \
    && apt-get install -y --no-install-recommends openssh-client ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts
COPY knit.mjs ./
COPY src ./src
COPY assets ./assets

EXPOSE 3456
CMD ["node", "knit.mjs"]

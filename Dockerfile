FROM node:26-bookworm-slim

WORKDIR /opt/knit
ENV NODE_ENV=production \
    PORT=3456 \
    KNIT_APP_REPO_URL=https://github.com/eliware/knit.git \
    KNIT_APP_REPO_REF=main \
    KNIT_APP_REPO_PATH=/opt/knit \
    KNIT_CONFIG_REPO_URL=git@github.com:eliware/knit-configs.git \
    KNIT_CONFIG_REPO_REF=main \
    KNIT_CONFIG_REPO_PATH=/opt/knit/repos \
    KNIT_CONFIG_DEPLOY_KEY_FILE=/run/secrets/knit_configs_deploy_key \
    KNIT_CONFIG_KNOWN_HOSTS_FILE=/run/secrets/knit_known_hosts \
    KNIT_AGE_IDENTITY_FILE=/run/secrets/knit_configs_age_key

RUN apt-get update \
    && apt-get install -y --no-install-recommends git openssh-client age ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && mkdir -p /opt/knit/repos

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod 0755 /usr/local/bin/docker-entrypoint.sh

EXPOSE 3456
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]

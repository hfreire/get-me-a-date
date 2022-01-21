FROM node:17.4.0 AS node

# Install base utils
RUN set -x \
  && apt-get update && apt-get install -y --no-install-recommends \
    curl \
    netcat \
  && rm -rf /var/lib/apt/lists/* \
  && apt-get purge -y --auto-remove

# Install gosu for easy step-down from root
ENV GOSU_VERSION 1.11
RUN set -x \
  && apt-get update && apt-get install -y --no-install-recommends ca-certificates wget gnupg dirmngr && rm -rf /var/lib/apt/lists/* \
  && wget -O /usr/local/bin/gosu "https://github.com/tianon/gosu/releases/download/$GOSU_VERSION/gosu-$(dpkg --print-architecture)" \
  && wget -O /usr/local/bin/gosu.asc "https://github.com/tianon/gosu/releases/download/$GOSU_VERSION/gosu-$(dpkg --print-architecture).asc" \
  && export GNUPGHOME="$(mktemp -d)" \
  && gpg --batch --keyserver hkps://keys.openpgp.org --recv-keys B42F6819007F00F88E364FD4036A9C25BF357DD4 \
  && gpg --batch --verify /usr/local/bin/gosu.asc /usr/local/bin/gosu \
  && { command -v gpgconf > /dev/null && gpgconf --kill all || :; } \
  && rm -rf "$GNUPGHOME" /usr/local/bin/gosu.asc \
  && chmod +x /usr/local/bin/gosu \
  && gosu nobody true \
  && apt-get purge -y --auto-remove ca-certificates wget gnupg dirmngr

# Install app runtime and build dependencies
RUN set -x \
  && apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    git \
    libatk-bridge2.0-0 \
    libgtk-3-0 \
    libx11-xcb1 \
    libnss3 \
    libxss1 \
    libgconf-2-4 \
    libasound2 \
  && rm -rf /var/lib/apt/lists/* \
  && apt-get purge -y --auto-remove

FROM node AS build
ARG NAME
ARG NPM_TOKEN
USER node

RUN mkdir /home/node/$NAME
WORKDIR /home/node/$NAME

# Install npm packages
COPY --chown=node:node package.json package-lock.json tsconfig.json webpack.config.js .snyk ./
RUN NODE_ENV= npm ci

# Build app
COPY --chown=node:node src src/
RUN set -x \
  && npm run build --if-present \
  && npm prune --production \
  && npm cache clean --force

FROM node
LABEL maintainer="hugo@exec.sh"
ARG NAME
ARG VERSION
ARG VERSION_COMMIT
ARG VERSION_BUILD_DATE

RUN gosu node mkdir /home/node/$NAME
WORKDIR /home/node/$NAME

# Copy app build
COPY --from=build --chown=node:node /home/node/$NAME /home/node/$NAME
COPY --chown=node:node share/docker/start.sh start.sh
COPY --chown=node:node share/docker/test.sh test.sh

# Set app runtime environment variables
ENV NAME $NAME
ENV VERSION $VERSION
ENV VERSION_COMMIT $VERSION_COMMIT
ENV VERSION_BUILD_DATE $VERSION_BUILD_DATE

EXPOSE 3000

ENTRYPOINT [ "./start.sh" ]

HEALTHCHECK --start-period=10s --interval=5m --timeout=3s \
  CMD nc -z localhost 3000 || exit 1

FROM node:6.10.3-slim

MAINTAINER hugo@exec.sh

# Set version information available for runtime
ARG NPM_TOKEN
ARG NAME
ENV NAME $NAME
ARG VERSION
ENV VERSION $VERSION
ARG VERSION_COMMIT
ENV VERSION_COMMIT $VERSION_COMMIT
ARG VERSION_BUILD_DATE
ENV VERSION_BUILD_DATE $VERSION_BUILD_DATE

ENV HOME /opt/$NAME

RUN apt-get update &&\
    apt-get install -y git &&\
    apt-get clean

# Create app directory
RUN mkdir -p $HOME
WORKDIR $HOME

# Install app dependencies
COPY package.json $HOME
RUN npm install --production

# Bundle app source
COPY src $HOME/src

COPY share/docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 3000
ENTRYPOINT [ "/entrypoint.sh" ]

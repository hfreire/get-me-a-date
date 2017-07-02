FROM node:6.11.0

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

# Create app directory
RUN mkdir -p $HOME
WORKDIR $HOME

RUN apt-get update &&\
    apt-get install -y libgtk2.0-0 libgconf-2-4 libasound2 libxtst6 libxss1 libnss3 xvfb &&\
    apt-get install -y build-essential git python &&\
    apt-get clean

# Install app dependencies
COPY package.json $HOME
RUN npm install --production

RUN apt-get remove --purge -y build-essential git python &&\
    apt-get autoremove --purge -y

# Bundle app source
COPY src $HOME/src

COPY share/docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 3000
ENTRYPOINT [ "/entrypoint.sh" ]

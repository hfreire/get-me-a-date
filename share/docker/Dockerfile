FROM node:6.11.0

MAINTAINER hugo@exec.sh

# Set app runtime environment variables
ARG NPM_TOKEN
ARG NAME
ENV NAME $NAME
ARG VERSION
ENV VERSION $VERSION
ARG VERSION_COMMIT
ENV VERSION_COMMIT $VERSION_COMMIT
ARG VERSION_BUILD_DATE
ENV VERSION_BUILD_DATE $VERSION_BUILD_DATE

# Create app directory
ENV HOME /opt/$NAME
RUN mkdir -p $HOME
WORKDIR $HOME

# Install app runtime and build dependencies
RUN apt-get update &&\
    apt-get install -y libgtk2.0-0 libgconf-2-4 libasound2 libxtst6 libxss1 libnss3 xvfb &&\
    apt-get install -y build-essential git python &&\
    apt-get clean
COPY package.json $HOME
COPY tsconfig.json $HOME
COPY webpack.config.js $HOME
RUN npm install

# Copy app source
COPY src $HOME/src

# Compile app source
RUN npm run compile

# Remove app build dependencies
RUN npm prune --production
RUN apt-get remove --purge -y build-essential git python &&\
    apt-get autoremove --purge -y

COPY share/docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 3000
ENTRYPOINT [ "/entrypoint.sh" ]

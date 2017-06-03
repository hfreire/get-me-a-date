# :heart_eyes: Help me get a :cupid: date tonight :first_quarter_moon_with_face:

[![JavaScript Style Guide](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)
[![Build Status](https://travis-ci.org/hfreire/get-me-a-date.svg?branch=master)](https://travis-ci.org/hfreire/get-me-a-date)
[![Coverage Status](https://coveralls.io/repos/github/hfreire/get-me-a-date/badge.svg?branch=master)](https://coveralls.io/github/hfreire/get-me-a-date?branch=master)
[![Greenkeeper badge](https://badges.greenkeeper.io/hfreire/get-me-a-date.svg)](https://greenkeeper.io/)
[![](https://img.shields.io/github/release/hfreire/get-me-a-date.svg)](https://github.com/hfreire/get-me-a-date/releases)
[![](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Uses [AWS Rekognition](https://aws.amazon.com/rekognition) deep learning-based image recognition to help you automate your [Tinder](https://tinder.com) date discovery.

<p align="center"><img src="share/github/overview.png" width="720"></p>

### Features
* Launch :rocket: inside a Docker container :whale: so you don't need to manage the dependencies :raised_hands: :white_check_mark:

### How to use

#### Use it in your terminal
Run the Docker image in a container exposing the port `5940`
```
docker run -d -p "5940:3000" hfreire/get-me-a-date
```
#### Available environment variables
Variable | Description | Required | Default value
:---:|:---:|:---:|:---:
PORT | The port to be used by the HTTP server | false | `3000`
API_KEYS | The secret keys that should be used when securing endpoints | false | `undefined`
ENVIRONMENT | The environment the app is running on | false | `undefined`
ROLLBAR_API_KEY | The server API key used to talk with Rollbar | false | `undefined`
SO_TIMEOUT | Node socket timeout. Defaults to 2 minutes. Set to false to disable socket timeouts. | false | `undefined`

### How to build
Clone the GitHub repo
```
git clone https://github.com/hfreire/get-me-a-date.git
```

Change current directory
```
cd get-me-a-date
```

Install dependencies
```
npm install
```

Run the NPM script that will build the Docker image
```
npm run build
```

# :heart_eyes: Help me get a :cupid: date tonight :first_quarter_moon_with_face:

[![](https://github.com/hfreire/get-me-a-date/workflows/ci/badge.svg)](https://github.com/hfreire/get-me-a-date/actions?workflow=ci)
[![](https://github.com/hfreire/get-me-a-date/workflows/cd/badge.svg)](https://github.com/hfreire/get-me-a-date/actions?workflow=cd)
[![Coverage Status](https://coveralls.io/repos/github/hfreire/get-me-a-date/badge.svg?branch=master)](https://coveralls.io/github/hfreire/get-me-a-date?branch=master)
[![Known Vulnerabilities](https://snyk.io/test/github/hfreire/get-me-a-date/badge.svg)](https://snyk.io/test/github/hfreire/get-me-a-date)
[![](https://img.shields.io/github/release/hfreire/get-me-a-date.svg)](https://github.com/hfreire/get-me-a-date/releases)
[![Docker Stars](https://img.shields.io/docker/stars/hfreire/get-me-a-date.svg)](https://hub.docker.com/r/hfreire/get-me-a-date/)
[![Docker Pulls](https://img.shields.io/docker/pulls/hfreire/get-me-a-date.svg)](https://hub.docker.com/r/hfreire/get-me-a-date/)

> Uses [AWS Rekognition](https://aws.amazon.com/rekognition) deep learning-based image recognition to help you automate your date discovery.

<p align="center"><img src="share/github/overview.gif" width="720"></p>

### Features
* Supports [Tinder](https://github.com/hfreire/tinder-wrapper) dating app :white_check_mark:
* Supports [Happn](https://github.com/hfreire/happn-wrapper) dating app :white_check_mark:
* Supports [Mint](https://github.com/hfreire/mint-wrapper) dating app :white_check_mark:
* Uses your existing matches :revolving_hearts: for machine-learning :robot: when to :+1: or :-1: new recommendations :white_check_mark:
* Periodically :clock10: gets dating app :girl::woman: recommendations and automatically :robot: :+1: or :-1: :white_check_mark:
* Launch :rocket: inside a Docker container :whale: so you don't need to manage the dependencies :raised_hands: :white_check_mark:

### How to use

#### Use it in your terminal
Run the Docker image in a container exposing the port `5940`
```
docker run -d -p "5940:3000" hfreire/get-me-a-date
```

#### Available REST API endpoints
Swagger documentation available at `http://localhost:5940/docs`.

#### Available environment variables
Variable | Description | Required | Default value
:---:|:---:|:---:|:---:
FACEBOOK_USER_EMAIL | Facebook user e-mail address used for login. | true | `undefined`
FACEBOOK_USER_PASSWORD | Facebook user password used for login. | true | `undefined`
AWS_REGION | AWS region used for S3 and Rekognition. | true | `undefined`
AWS_ACCESS_KEY_ID | AWS access key  used for S3 and Rekognition. | true | `undefined`
AWS_SECRET_ACCESS_KEY | AWS secret access key used for S3 and Rekognition. | true | `undefined`
FIND_DATES_PERIOD | The time period (in seconds) between finding dates. | false | `600`
PORT | The port to be used by the HTTP server. | false | `3000`
API_KEYS | The secret keys that should be used when securing endpoints. | false | `undefined`
SO_TIMEOUT | TCP socket connection timeout. | false | `120000`
LOG_LEVEL | The log level verbosity. | false | `info`
ENVIRONMENT | The environment the app is running on. | false | `undefined`
ROLLBAR_API_KEY | The server API key used to talk with Rollbar. | false | `undefined`

### How to build
Clone the GitHub repo
```
git clone https://github.com/hfreire/get-me-a-date.git
```

Change current directory
```
cd get-me-a-date
```

Run the NPM install
```
npm install
```

Run the NPM script that will build the Docker image
```
npm run build
```

### How to contribute
You can contribute either with code (e.g., new features, bug fixes and documentation) or by [donating 5 EUR](https://paypal.me/hfreire/5). You can read the [contributing guidelines](CONTRIBUTING.md) for instructions on how to contribute with code.

All donation proceedings will go to the [Sverige för UNHCR](https://sverigeforunhcr.se), a swedish partner of the [UNHCR - The UN Refugee Agency](http://www.unhcr.org), a global organisation dedicated to saving lives, protecting rights and building a better future for refugees, forcibly displaced communities and stateless people.

### License
Read the [license](./LICENSE.md) for permissions and limitations.

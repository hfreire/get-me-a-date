/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

const _ = require('lodash')
const Promise = require('bluebird')
const retry = require('bluebird-retry')
const Brakes = require('brakes')

const Nightmare = require('nightmare')
Nightmare.Promise = Promise

const Logger = require('modern-logger')

const Health = require('health-checkup')

const RandomUserAgent = require('random-http-useragent')

const { join } = require('path')

const authorizeApp = function (email, password, url, userAgent) {
  let facebookUserId
  let accessToken

  const nightmare = Nightmare(this._options.nightmare)

  return nightmare
    .useragent(userAgent)
    .on('page', function (type, url, method, response) {
      if (type !== 'xhr-complete') {
        return
      }

      if (url.path === '/pull') {
        const match = response.match(/"u":(.*),"ms"/)
        facebookUserId = match.length === 2 ? match[ 1 ] : undefined

        return
      }

      if (_.includes(url, 'oauth/confirm?dpr')) {
        const match = response.match(/access_token=(.*)&/)
        accessToken = match.length === 2 ? match[ 1 ] : undefined
      }
    })
    .goto('https://facebook.com')
    .type('input#email', email)
    .type('input#pass', password)
    .click('#loginbutton input')
    .wait(3000)
    .goto(url)
    .wait('button._42ft._4jy0.layerConfirm._1flv._51_n.autofocus.uiOverlayButton._4jy5._4jy1.selected._51sy')
    .click('button._42ft._4jy0.layerConfirm._1flv._51_n.autofocus.uiOverlayButton._4jy5._4jy1.selected._51sy')
    .wait(10000)
    .end()
    .then(() => {
      if (!accessToken || !facebookUserId) {
        throw new Error('unable to authorize app')
      }

      return { accessToken, facebookUserId }
    })
}

const defaultOptions = {
  nightmare: {
    show: false,
    partition: 'nopersist',
    webPreferences: {
      preload: join(__dirname, '/preload.js'),
      webSecurity: false
    }
  },
  retry: { max_tries: 3, interval: 15000, timeout: 40000, throw_original: true },
  breaker: { timeout: 60000, threshold: 80, circuitDuration: 3 * 60 * 60 * 1000 }
}

class Facebook {
  constructor (options = {}) {
    this._options = _.defaults(options, defaultOptions)

    this._breaker = new Brakes(this._options.breaker)

    this._authorizeAppCircuitBreaker = this._breaker.slaveCircuit((...params) => retry(() => authorizeApp.bind(this)(...params), this._options.retry))

    Health.addCheck('facebook', () => new Promise((resolve, reject) => {
      if (this._breaker.isOpen()) {
        return reject(new Error(`circuit breaker is open`))
      } else {
        return resolve()
      }
    }))
  }

  authorizeApp (email, password, url) {
    Logger.debug('Started authorizing app in Facebook')

    return RandomUserAgent.get()
      .then((userAgent) => this._authorizeAppCircuitBreaker.exec(email, password, url, userAgent))
      .finally(() => Logger.debug('Finished authorizing app in Facebook'))
  }
}

module.exports = Facebook

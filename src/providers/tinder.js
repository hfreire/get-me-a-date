/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

const FACEBOOK_USER_ID = process.env.FACEBOOK_USER_ID
const FACEBOOK_OAUTH_ACCESS_TOKEN = process.env.FACEBOOK_OAUTH_ACCESS_TOKEN
let TINDER_API_TOKEN = process.env.TINDER_API_TOKEN

const Promise = require('bluebird')

const { TinderClient } = require('tinder')

class Tinder {
  constructor () {
    this.client = Promise.promisifyAll(new TinderClient())
  }

  authenticate () {
    if (TINDER_API_TOKEN) {
      this.client.setAuthToken(TINDER_API_TOKEN)

      return Promise.resolve()
    }

    return this.client.authorizeAsync(FACEBOOK_OAUTH_ACCESS_TOKEN, FACEBOOK_USER_ID)
      .then(() => {
        TINDER_API_TOKEN = this.client.getAuthToken()
      })
  }

  getRecommendations () {
    return this.client.getRecommendationsAsync(10)
  }
}

module.exports = new Tinder()

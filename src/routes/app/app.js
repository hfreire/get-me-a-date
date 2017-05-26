/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

const { Route } = require('serverful')

const { join } = require('path')

class App extends Route {
  constructor () {
    super('GET', '/', 'Single page application', 'Returns a single page application')
  }

  handler (request, reply) {
    reply.file(join(__dirname, './index.html'))
  }

  auth () {
    return false
  }
}

module.exports = new App()

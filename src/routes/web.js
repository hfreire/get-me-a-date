/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

const { Route } = require('serverful')

const _ = require('lodash')

const { join } = require('path')

class Web extends Route {
  constructor () {
    super('GET', '/', 'web', 'web')
  }

  auth () {
    return false
  }

  tags () {
    return []
  }

  toRoute () {
    return [
      _(super.toRoute())
        .omit('config.handler')
        .merge({
          method: 'GET',
          path: '/{param*}',
          handler: {
            directory: {
              path: join(__dirname, '../../tmp/web'),
              index: true
            }
          }
        })
        .value()
    ]
  }
}

module.exports = new Web()

/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

class Channel {
  constructor (name) {
    this._name = name
  }

  get name () {
    return this._name
  }
}

module.exports = Channel


/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

class AlreadyLikedError extends Error {
  constructor (recommendation) {
    super(`recommendation id ${recommendation.id}`)

    this.name = this.constructor.name
    this._recommendation = recommendation

    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor)
    } else {
      this.stack = (new Error(`recommendation id ${recommendation.id}`)).stack
    }
  }

  get recommendation () {
    return this._recommendation
  }
}

module.exports = AlreadyLikedError

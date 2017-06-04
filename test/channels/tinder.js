/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

const { SQLite } = require('../../src/database')

describe('Tinder', () => {
  let subject

  afterEach(() => td.reset())

  describe('when getting updates', () => {
    beforeEach(() => {
      subject = require('../../src/channels/tinder')
    })
  })
})

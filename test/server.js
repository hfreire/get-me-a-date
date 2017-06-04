/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

const { Serverful } = require('serverful')

describe('Server', () => {
  let subject

  describe('when loading', () => {
    beforeEach(() => {
      subject = require('../src/server')
    })

    it('should return an instance of serverful', () => {
      subject.should.be.instanceOf(Serverful)
    })
  })
})

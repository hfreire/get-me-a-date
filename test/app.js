/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

describe('App', () => {
  let subject // eslint-disable-line
  let Server

  afterEach(() => {
    td.reset()
  })

  describe('when running', () => {
    beforeEach(() => {
      Server = td.replace('../src/server', td.object([ 'start', 'stop' ]))
    })

    afterEach(() => {
      delete require.cache[ require.resolve('../src/app') ]
    })

    it('should start Server', () => {
      subject = require('../src/app')

      td.verify(Server.start(), { times: 1 })
    })
  })
})

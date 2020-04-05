/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE.md file in the root directory of this source tree.
 */

describe('Server', () => {
  let subject
  let serverful
  let Logger
  let Database
  let Dates

  beforeAll(() => {
    serverful = td.object([])
    serverful.Serverful = td.constructor([])

    Logger = td.object([ 'error' ])

    Database = td.object([ 'start' ])

    Dates = td.object([ 'start' ])
  })

  describe('when exporting', () => {
    beforeEach(() => {
      td.replace('serverful', serverful)

      td.replace('modern-logger', Logger)

      td.replace('../src/database', Database)

      td.replace('../src/dates', Dates)

      subject = require('../src/server')
    })

    it('should be instance of serverful', () => {
      expect(subject).toBeInstanceOf(serverful.Serverful)
    })
  })
})

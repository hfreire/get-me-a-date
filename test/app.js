/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE.md file in the root directory of this source tree.
 */

/* eslint-disable no-unused-vars,unicorn/no-process-exit */

describe.skip('App', () => {
  let subject
  let Logger
  let Server

  describe('when running', () => {
    const VERSION = 'my-version'
    const VERSION_COMMIT = 'my-version-commint'
    const VERSION_BUILD_DATE = 'my-version-build-date'

    beforeAll(() => {
      process.env.VERSION = VERSION
      process.env.VERSION_COMMIT = VERSION_COMMIT
      process.env.VERSION_BUILD_DATE = VERSION_BUILD_DATE
    })

    beforeEach(() => {
      Logger = td.replace('modern-logger')

      Server = td.replace('../src/server')

      subject = require('../src/app')
    })

    afterAll(() => {
      delete process.env.VERSION
      delete process.env.VERSION_COMMIT
      delete process.env.VERSION_BUILD_DATE
    })

    it('should start the server', () => {
      td.verify(Server.start(), { times: 1 })
    })

    it('should log version information', () => {
      td.verify(Logger.info(`Running version ${VERSION} from commit ${VERSION_COMMIT} built on ${VERSION_BUILD_DATE}`), { times: 1 })
    })
  })

  describe('when catching an interrupt signal', () => {
    let on
    let exit
    let callback

    beforeAll(() => {
      on = process.on
      exit = process.exit

      process.on = td.function()

      process.exit = td.function()
    })

    beforeEach(() => {
      td.when(process.on('SIGINT'), { ignoreExtraArgs: true }).thenDo((event, _callback) => { callback = _callback })

      td.replace('modern-logger')

      Server = td.replace('../src/server')
      td.when(Server.stop()).thenResolve()

      subject = require('../src/app')
    })

    afterAll(() => {
      process.on = on
      process.exit = exit
    })

    it('should stop the server', () => {
      return callback()
        .then(() => {
          td.verify(process.exit(0), { times: 1 })
        })
    })

    it('should exit process with return value 0', () => {
      return callback()
        .then(() => {
          td.verify(process.exit(0), { times: 1 })
        })
    })
  })

  describe('when catching a termination signal', () => {
    let on
    let exit
    let callback

    beforeAll(() => {
      on = process.on
      exit = process.exit

      process.on = td.function()

      process.exit = td.function()
    })

    beforeEach(() => {
      td.when(process.on('SIGTERM'), { ignoreExtraArgs: true }).thenDo((event, _callback) => { callback = _callback })

      td.replace('modern-logger')

      Server = td.replace('../src/server')
      td.when(Server.stop()).thenResolve()

      subject = require('../src/app')
    })

    afterAll(() => {
      process.on = on
      process.exit = exit
    })

    it('should stop the server', () => {
      return callback()
        .then(() => {
          td.verify(process.exit(0), { times: 1 })
        })
    })

    it('should exit process with return value 0', () => {
      return callback()
        .then(() => {
          td.verify(process.exit(0), { times: 1 })
        })
    })
  })

  describe('when catching a hang up signal', () => {
    let on
    let exit
    let callback

    beforeAll(() => {
      on = process.on
      exit = process.exit

      process.on = td.function()

      process.exit = td.function()
    })

    beforeEach(() => {
      td.when(process.on('SIGHUP'), { ignoreExtraArgs: true }).thenDo((event, _callback) => { callback = _callback })

      td.replace('modern-logger')

      Server = td.replace('../src/server')
      td.when(Server.stop()).thenResolve()

      subject = require('../src/app')
    })

    afterAll(() => {
      process.on = on
      process.exit = exit
    })

    it('should stop the server', () => {
      return callback()
        .then(() => {
          td.verify(process.exit(0), { times: 1 })
        })
    })

    it('should exit process with return value 0', () => {
      return callback()
        .then(() => {
          td.verify(process.exit(0), { times: 1 })
        })
    })
  })

  describe('when catching an abort signal', () => {
    let on
    let exit

    beforeAll(() => {
      on = process.on
      exit = process.exit

      process.on = td.function()

      process.exit = td.function()
    })

    beforeEach(() => {
      td.when(process.on('SIGABRT'), { ignoreExtraArgs: true }).thenCallback()

      td.replace('modern-logger')

      Server = td.replace('../src/server')
      td.when(Server.stop()).thenResolve()

      subject = require('../src/app')
    })

    afterAll(() => {
      process.on = on
      process.exit = exit
    })

    it('should exit process with return value 1', () => {
      td.verify(process.exit(1), { times: 1 })
    })
  })

  describe('when catching an uncaught exception', () => {
    const error = new Error('my-error-message')
    let on
    let exit
    let callback

    beforeAll(() => {
      on = process.on
      exit = process.exit

      process.on = td.function()

      process.exit = td.function()
    })

    beforeEach(() => {
      process.on = td.function()
      process.exit = td.function()

      td.when(process.on('uncaughtException'), { ignoreExtraArgs: true }).thenDo((event, _callback) => { callback = _callback })

      Logger = td.replace('modern-logger')
      td.when(Logger.error(), { ignoreExtraArgs: true }).thenResolve()

      Server = td.replace('../src/server')
      td.when(Server.stop()).thenResolve()

      subject = require('../src/app')
    })

    afterAll(() => {
      process.on = on
      process.exit = exit
    })

    it('should log error', () => {
      return callback(error)
        .then(() => {
          td.verify(Logger.error(error), { times: 1 })
        })
    })

    it('should stop the server', () => {
      return callback(error)
        .then(() => {
          td.verify(Server.stop(), { times: 1 })
        })
    })

    it('should exit process with return value 1', () => {
      return callback()
        .then(() => {
          td.verify(process.exit(1), { times: 1 })
        })
    })
  })

  describe('when catching an unhandled rejection', () => {
    const error = new Error('my-error-message')
    let on
    let exit
    let callback

    beforeAll(() => {
      on = process.on
      exit = process.exit

      process.on = td.function()

      process.exit = td.function()
    })

    beforeEach(() => {
      process.on = td.function()
      process.exit = td.function()

      td.when(process.on('unhandledRejection'), { ignoreExtraArgs: true }).thenDo((event, _callback) => { callback = _callback })

      Logger = td.replace('modern-logger')
      td.when(Logger.error(), { ignoreExtraArgs: true }).thenResolve()

      Server = td.replace('../src/server')
      td.when(Server.stop()).thenResolve()

      subject = require('../src/app')
    })

    afterAll(() => {
      process.on = on
      process.exit = exit
    })

    it('should log error', () => {
      return callback(error)
        .then(() => {
          td.verify(Logger.error(error), { times: 1 })
        })
    })

    it('should stop the server', () => {
      return callback(error)
        .then(() => {
          td.verify(Server.stop(), { times: 1 })
        })
    })

    it('should exit process with return value 1', () => {
      return callback()
        .then(() => {
          td.verify(process.exit(1), { times: 1 })
        })
    })
  })
})

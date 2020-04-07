#!/usr/bin/env node

/*
 * Copyright (c) 2020, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE.md file in the root directory of this source tree.
 */

const Logger = require('modern-logger')

const { VERSION, VERSION_COMMIT, VERSION_BUILD_DATE } = process.env

Logger.configure({
  transports: {
    console: [
      {
        colorize: false,
        timestamp: false
      }
    ]
  }
})

if (VERSION && VERSION_COMMIT && VERSION_BUILD_DATE) {
  Logger.info(
    `Running version ${VERSION} from commit ${VERSION_COMMIT} built on ${VERSION_BUILD_DATE}`
  )
}

const Server = require('./server')

// shutdown gracefully
const shutdown = (exitStatus = 0) => {
  return Server.stop().finally(() => process.exit(exitStatus))
}

const logErrorAndShutdown = error => {
  return Logger.error(error).finally(() => shutdown(1))
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
process.on('SIGHUP', shutdown) // reload
process.on('SIGABRT', () => process.exit(1)) // force immediate shutdown, i.e. systemd watchdog?
process.on('uncaughtException', logErrorAndShutdown)
process.on('unhandledRejection', logErrorAndShutdown)

Server.start()

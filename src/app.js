/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

const VERSION = process.env.VERSION
const VERSION_COMMIT = process.env.VERSION_COMMIT
const VERSION_BUILD_DATE = process.env.VERSION_BUILD_DATE

const Logger = require('modern-logger')

if (VERSION && VERSION_COMMIT && VERSION_BUILD_DATE) {
  Logger.info(`Running version ${VERSION} from commit ${VERSION_COMMIT} built on ${VERSION_BUILD_DATE}`)
}

const Server = require('./server')

// shutdown gracefully
const shutdown = () => {
  return Server.stop()
    .timeout(1000)
    .finally(() => {
      process.exit(0)
    })
}

process.on('SIGINT', shutdown)
process.on('SIGTERM', shutdown)
process.on('SIGHUP', shutdown) // reload
process.on('SIGABRT', () => process.exit(1)) // force immediate shutdown, i.e. systemd watchdog?
process.once('SIGUSR2', () => {
  Server.stop(() => {
    process.kill(process.pid, 'SIGUSR2')
  })
}) // stop and then shutdown, i.e. forever daemon
process.on('SIGSEGV', () => Logger.error(new Error('segmentation fault')).then(() => process.exit(1)))
process.on('exit', () => {})
process.on('uncaughtException', (error) => Logger.error(error, shutdown))
process.on('unhandledRejection', (error) => Logger.error(error, shutdown))

Server.start()

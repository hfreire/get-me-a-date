/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

const ENVIRONMENT = process.env.ENVIRONMENT || 'local'
const FIND_DATES_PERIOD = process.env.FIND_DATES_PERIOD || 10 * 60 * 1000

const { Serverful } = require('serverful')

const _ = require('lodash')
const Promise = require('bluebird')

const Logger = require('modern-logger')

const Tinder = require('./providers/tinder')
const { NotAuthorizedError } = require('./providers/errors')

const Taste = require('./taste')
const { SQLite, People } = require('./database')

const uuidV4 = require('uuid/v4')

const checkRecommendationOut = (provider, rec) => {
  const providerId = rec._id
  const person = {}

  return Promise.props({ photos: Taste.checkPhotosOut(rec.photos) })
    .then(({ photos }) => {
      person.id = uuidV4()
      person.provider = provider
      person.provider_id = providerId
      person.like = photos.like
      person.photos_similarity_mean = photos.faceSimilarityMean
      person.data = rec

      return People.save(provider, providerId, person)
        .then(() => person)
    })
}

const findDates = function () {
  return Tinder.getRecommendations()
    .then((recs) => {
      const provider = 'tinder'

      Logger.info(`Got ${recs.length} recommendations from ${_.capitalize(provider)}`)

      return Promise.map(recs, (rec) => {
        return checkRecommendationOut(provider, rec)
          .then(({ photos_similarity_mean, data, like }) => {
            // eslint-disable-next-line camelcase
            return Logger.info(`${data.name} got a ${like ? 'like :+1:' : 'pass :-1:'}(photos = ${photos_similarity_mean}%)`)
          })
          .catch((error) => Logger.warn(error))
      }, { concurrency: 5 })
    })
    .catch(NotAuthorizedError, () => Tinder.authorize())
    .catch((error) => Logger.error(error))
}

class Server extends Serverful {
  start () {
    if (ENVIRONMENT === 'local') {
      return Promise.all([ super.start(), SQLite.start() ])
      /* .then(() => {
       const AWS_REGION = process.env.AWS_REGION
       const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID
       const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY
       const AWS_S3_BUCKET = process.env.AWS_S3_BUCKET
       const S3 = require('./utils/s3')
       const s3 = new S3({
       region: AWS_REGION,
       bucket: AWS_S3_BUCKET,
       accessKeyId: AWS_ACCESS_KEY_ID,
       secretAccessKey: AWS_SECRET_ACCESS_KEY
       })
       const request = Promise.promisifyAll(require('request').defaults({ encoding: null }))
       let i = 0
       return People.findAll(1, 600)
       .then(({ results }) => results)
       .mapSeries((person) => {
       i++
       console.log(i)
       const { data } = person
       const { photos } = data

       if (photos.length === 0) {
       return
       }

       const thumbnail = _.find(photos[0].processedFiles, { width: 84, height: 84 })

       const url = require('url').parse(thumbnail.url)
       if (!url) {
       return Promise.reject(new Error('invalid photo url'))
       }

       return request.getAsync(url.href)
       .then(({ body }) => {
       return s3.putObject(`photos/tinder${url.pathname}`, body)
       .then(() => {
       data.photos[0].thumbnailUrl = `https://s3-${AWS_REGION}.amazonaws.com/${AWS_S3_BUCKET}/photos/tinder${url.pathname}`

       return People.save(person.provider, person.provider_id, { data })
       })
       })
       .delay(1000)
       })
       }) */
    }

    return Promise.all([ super.start(), SQLite.start().then(() => Tinder.authorize()), Taste.bootstrap() ])
      .then(() => {
        if (FIND_DATES_PERIOD > 0) {
          this.findDates()
        }
      })
  }

  findDates () {
    const startDate = _.now()

    Logger.info('Started finding dates')

    return findDates.bind(this)()
      .finally(() => {
        const stopDate = _.now()
        const duration = _.round((stopDate - startDate) / 1000, 1)

        Logger.info(`Finished finding dates (time = ${duration}s)`)

        this.timeout = setTimeout(() => this.findDates(), FIND_DATES_PERIOD)
      })
  }
}

module.exports = new Server()

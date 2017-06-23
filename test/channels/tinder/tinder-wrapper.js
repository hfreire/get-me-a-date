/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

const { OutOfLikesError } = require('../../../src/channels/errors')

describe('Tinder Wrapper', () => {
  let subject
  let request

  before(() => {
    request = td.object([ 'defaults', 'get', 'post' ])
  })

  afterEach(() => td.reset())

  describe('when constructing', () => {
    beforeEach(() => {
      td.when(request.defaults(), { ignoreExtraArgs: true }).thenReturn(request)
      td.replace('request', request)

      const TinderWrapper = require('../../../src/channels/tinder/tinder-wrapper')
      subject = new TinderWrapper()
    })

    it('should set default request headers', () => {
      const captor = td.matchers.captor()

      td.verify(request.defaults(captor.capture()))

      const options = captor.value
      options.should.have.nested.property('headers.User-Agent', 'Tinder Android Version 4.5.5')
      options.should.have.nested.property('headers.os_version', '23')
      options.should.have.nested.property('headers.platform', 'android')
      options.should.have.nested.property('headers.app-version', '854')
      options.should.have.nested.property('headers.Accept-Language', 'en')
    })
  })

  describe('when constructing and loading request', () => {
    beforeEach(() => {
      const TinderWrapper = require('../../../src/channels/tinder/tinder-wrapper')
      subject = new TinderWrapper()
    })

    it('should create a request with defaults function', () => {
      subject._request.should.have.property('defaults')
      subject._request.get.should.be.instanceOf(Function)
    })

    it('should create a request with get function', () => {
      subject._request.should.have.property('get')
      subject._request.get.should.be.instanceOf(Function)
    })

    it('should create a request with post function', () => {
      subject._request.should.have.property('post')
      subject._request.get.should.be.instanceOf(Function)
    })
  })

  describe('when authorizing', () => {
    const facebookAccessToken = 'my-facebook-access-token'
    const facebookUserId = 'my-facebook-user-id'
    const token = 'my-token'
    const body = { token }
    const response = { body }

    beforeEach(() => {
      td.when(request.defaults(), { ignoreExtraArgs: true }).thenReturn(request)
      td.when(request.post(td.matchers.anything()), { ignoreExtraArgs: true }).thenCallback(null, response)
      td.replace('request', request)

      const TinderWrapper = require('../../../src/channels/tinder/tinder-wrapper')
      subject = new TinderWrapper()

      return subject.authorize(facebookAccessToken, facebookUserId)
    })

    it('should do a post request to https://api.gotinder.com/auth', () => {
      const captor = td.matchers.captor()

      td.verify(request.post(captor.capture()), { ignoreExtraArgs: true, times: 1 })

      const options = captor.value
      options.should.have.property('url', 'https://api.gotinder.com/auth')
    })

    it('should do a post request with body', () => {
      const captor = td.matchers.captor()

      td.verify(request.post(captor.capture()), { ignoreExtraArgs: true, times: 1 })

      const options = captor.value
      options.should.have.nested.property('body.facebook_token', facebookAccessToken)
      options.should.have.nested.property('body.facebook_id', facebookUserId)
      options.should.have.nested.property('body.locale', 'en')
    })

    it('should set authentication token', () => {
      subject.authToken.should.be.equal(token)
    })
  })

  describe('when authorizing with invalid facebook access token and user id', () => {
    const facebookAccessToken = undefined
    const facebookUserId = undefined

    beforeEach(() => {
      const TinderWrapper = require('../../../src/channels/tinder/tinder-wrapper')
      subject = new TinderWrapper()
    })

    it('should reject with invalid arguments error', () => {
      return subject.authorize(facebookAccessToken, facebookUserId)
        .catch((error) => {
          error.should.be.instanceOf(Error)
          error.message.should.be.equal('invalid arguments')
        })
    })
  })

  describe('when getting recommendations', () => {
    const body = {}
    const response = { body }

    beforeEach(() => {
      td.when(request.defaults(), { ignoreExtraArgs: true }).thenReturn(request)
      td.when(request.get(td.matchers.anything()), { ignoreExtraArgs: true }).thenCallback(null, response)
      td.replace('request', request)

      const TinderWrapper = require('../../../src/channels/tinder/tinder-wrapper')
      subject = new TinderWrapper()
    })

    it('should do a get request to https://api.gotinder.com/user/recs', () => {
      return subject.getRecommendations()
        .then(() => {
          const captor = td.matchers.captor()

          td.verify(request.get(captor.capture()), { ignoreExtraArgs: true, times: 1 })

          const options = captor.value
          options.should.have.property('url', 'https://api.gotinder.com/user/recs')
        })
    })

    it('should resolve with response body as data', () => {
      return subject.getRecommendations()
        .then((data) => {
          data.should.be.equal(body)
        })
    })
  })

  describe('when getting account', () => {
    const body = {}
    const response = { body }

    beforeEach(() => {
      td.when(request.defaults(), { ignoreExtraArgs: true }).thenReturn(request)
      td.when(request.get(td.matchers.anything()), { ignoreExtraArgs: true }).thenCallback(null, response)
      td.replace('request', request)

      const TinderWrapper = require('../../../src/channels/tinder/tinder-wrapper')
      subject = new TinderWrapper()
    })

    it('should do a get request to https://api.gotinder.com/meta', () => {
      return subject.getAccount()
        .then(() => {
          const captor = td.matchers.captor()

          td.verify(request.get(captor.capture()), { ignoreExtraArgs: true, times: 1 })

          const options = captor.value
          options.should.have.property('url', 'https://api.gotinder.com/meta')
        })
    })

    it('should resolve with response body as data', () => {
      return subject.getAccount()
        .then((data) => {
          data.should.be.equal(body)
        })
    })
  })

  describe('when getting user', () => {
    const userId = 'my-user-id'
    const body = {}
    const response = { body }

    beforeEach(() => {
      td.when(request.defaults(), { ignoreExtraArgs: true }).thenReturn(request)
      td.when(request.get(td.matchers.anything()), { ignoreExtraArgs: true }).thenCallback(null, response)
      td.replace('request', request)

      const TinderWrapper = require('../../../src/channels/tinder/tinder-wrapper')
      subject = new TinderWrapper()
    })

    it('should do a get request to https://api.gotinder.com/user/my-user-id', () => {
      return subject.getUser(userId)
        .then(() => {
          const captor = td.matchers.captor()

          td.verify(request.get(captor.capture()), { ignoreExtraArgs: true, times: 1 })

          const options = captor.value
          options.should.have.property('url', 'https://api.gotinder.com/user/my-user-id')
        })
    })

    it('should resolve with response body as data', () => {
      return subject.getUser(userId)
        .then((data) => {
          data.should.be.equal(body)
        })
    })
  })

  describe('when getting user with invalid id', () => {
    const userId = undefined

    beforeEach(() => {
      const TinderWrapper = require('../../../src/channels/tinder/tinder-wrapper')
      subject = new TinderWrapper()
    })

    it('should reject with invalid arguments error', () => {
      return subject.getUser(userId)
        .catch((error) => {
          error.should.be.instanceOf(Error)
          error.message.should.be.equal('invalid arguments')
        })
    })
  })

  describe('when getting updates with a last activity date', () => {
    const lastActivityDate = new Date()
    const body = {}
    const response = { body }

    beforeEach(() => {
      td.when(request.defaults(), { ignoreExtraArgs: true }).thenReturn(request)
      td.when(request.post(td.matchers.anything()), { ignoreExtraArgs: true }).thenCallback(null, response)
      td.replace('request', request)

      const TinderWrapper = require('../../../src/channels/tinder/tinder-wrapper')
      subject = new TinderWrapper()
    })

    it('should do a post request to https://api.gotinder.com/updates', () => {
      return subject.getUpdates(lastActivityDate)
        .then(() => {
          const captor = td.matchers.captor()

          td.verify(request.post(captor.capture()), { ignoreExtraArgs: true, times: 1 })

          const options = captor.value
          options.should.have.property('url', 'https://api.gotinder.com/updates')
        })
    })

    it('should do a post request with body', () => {
      return subject.getUpdates(lastActivityDate)
        .then(() => {
          const captor = td.matchers.captor()

          td.verify(request.post(captor.capture()), { ignoreExtraArgs: true, times: 1 })

          const options = captor.value
          options.should.have.nested.property('body.last_activity_date', lastActivityDate.toISOString())
        })
    })

    it('should resolve with response body as data', () => {
      return subject.getUpdates(lastActivityDate)
        .then((data) => {
          data.should.be.equal(body)
        })
    })
  })

  describe('when getting updates without a last activity date', () => {
    const body = {}
    const response = { body }

    beforeEach(() => {
      td.when(request.defaults(), { ignoreExtraArgs: true }).thenReturn(request)
      td.when(request.post(td.matchers.anything()), { ignoreExtraArgs: true }).thenCallback(null, response)
      td.replace('request', request)

      const TinderWrapper = require('../../../src/channels/tinder/tinder-wrapper')
      subject = new TinderWrapper()
    })

    it('should do a post request to https://api.gotinder.com/updates', () => {
      return subject.getUpdates()
        .then(() => {
          const captor = td.matchers.captor()

          td.verify(request.post(captor.capture()), { ignoreExtraArgs: true, times: 1 })

          const options = captor.value
          options.should.have.property('url', 'https://api.gotinder.com/updates')
        })
    })

    it('should do a post request with body', () => {
      return subject.getUpdates()
        .then(() => {
          const captor = td.matchers.captor()

          td.verify(request.post(captor.capture()), { ignoreExtraArgs: true, times: 1 })

          const options = captor.value
          options.should.have.nested.property('body.last_activity_date', '')
        })
    })

    it('should resolve with response body as data', () => {
      return subject.getUpdates()
        .then((data) => {
          data.should.be.equal(body)
        })
    })
  })

  describe('when getting updates with invalid last activity date', () => {
    const lastActivityDate = null
    const body = {}
    const response = { body }

    beforeEach(() => {
      td.when(request.defaults(), { ignoreExtraArgs: true }).thenReturn(request)
      td.when(request.post(td.matchers.anything()), { ignoreExtraArgs: true }).thenCallback(null, response)
      td.replace('request', request)

      const TinderWrapper = require('../../../src/channels/tinder/tinder-wrapper')
      subject = new TinderWrapper()
    })

    it('should reject with invalid arguments error', () => {
      return subject.getUpdates(lastActivityDate)
        .catch((error) => {
          error.should.be.instanceOf(Error)
          error.message.should.be.equal('invalid arguments')
        })
    })
  })

  describe('when sending message', () => {
    const matchId = 'my-match-id'
    const message = 'my-message'
    const body = {}
    const response = { body }

    beforeEach(() => {
      td.when(request.defaults(), { ignoreExtraArgs: true }).thenReturn(request)
      td.when(request.post(td.matchers.anything()), { ignoreExtraArgs: true }).thenCallback(null, response)
      td.replace('request', request)

      const TinderWrapper = require('../../../src/channels/tinder/tinder-wrapper')
      subject = new TinderWrapper()
    })

    it('should do a post request to https://api.gotinder.com/user/matches/my-match-id', () => {
      return subject.sendMessage(matchId, message)
        .then(() => {
          const captor = td.matchers.captor()

          td.verify(request.post(captor.capture()), { ignoreExtraArgs: true, times: 1 })

          const options = captor.value
          options.should.have.property('url', 'https://api.gotinder.com/user/matches/my-match-id')
        })
    })

    it('should do a post request with body', () => {
      return subject.sendMessage(matchId, message)
        .then(() => {
          const captor = td.matchers.captor()

          td.verify(request.post(captor.capture()), { ignoreExtraArgs: true, times: 1 })

          const options = captor.value
          options.should.have.nested.property('body.message', message)
        })
    })

    it('should resolve with response body as data', () => {
      return subject.sendMessage(matchId, message)
        .then((data) => {
          data.should.be.equal(body)
        })
    })
  })

  describe('when sending message with invalid match id and message', () => {
    const matchId = undefined
    const message = undefined
    const body = {}
    const response = { body }

    beforeEach(() => {
      td.when(request.defaults(), { ignoreExtraArgs: true }).thenReturn(request)
      td.when(request.post(td.matchers.anything()), { ignoreExtraArgs: true }).thenCallback(null, response)
      td.replace('request', request)

      const TinderWrapper = require('../../../src/channels/tinder/tinder-wrapper')
      subject = new TinderWrapper()
    })

    it('should reject with invalid arguments error', () => {
      return subject.sendMessage(matchId, message)
        .catch((error) => {
          error.should.be.instanceOf(Error)
          error.message.should.be.equal('invalid arguments')
        })
    })
  })

  describe('when liking', () => {
    const userId = 'my-user-id'
    const photoId = 'my-photo-id'
    const contentHash = 'my-content-hash'
    const sNumber = 'my-s-number'
    const body = { likes_remaining: 100 }
    const response = { body }

    beforeEach(() => {
      td.when(request.defaults(), { ignoreExtraArgs: true }).thenReturn(request)
      td.when(request.get(td.matchers.anything()), { ignoreExtraArgs: true }).thenCallback(null, response)
      td.replace('request', request)

      const TinderWrapper = require('../../../src/channels/tinder/tinder-wrapper')
      subject = new TinderWrapper()
    })

    it('should do a get request to https://api.gotinder.com/like/my-user-id?photoId=my-photo-id&content_hash=my-content-hash&s_number=my-s-number', () => {
      return subject.like(userId, photoId, contentHash, sNumber)
        .then(() => {
          const captor = td.matchers.captor()

          td.verify(request.get(captor.capture()), { ignoreExtraArgs: true, times: 1 })

          const options = captor.value
          options.should.have.property('url', 'https://api.gotinder.com/like/my-user-id?photoId=my-photo-id&content_hash=my-content-hash&s_number=my-s-number')
        })
    })

    it('should resolve with response body as data', () => {
      return subject.like(userId, photoId, contentHash, sNumber)
        .then((data) => {
          data.should.be.equal(body)
        })
    })
  })

  describe('when liking and out of likes', () => {
    const userId = 'my-user-id'
    const photoId = 'my-photo-id'
    const contentHash = 'my-content-hash'
    const sNumber = 'my-s-number'
    const body = { likes_remaining: 0 }
    const response = { body }

    beforeEach(() => {
      td.when(request.defaults(), { ignoreExtraArgs: true }).thenReturn(request)
      td.when(request.get(td.matchers.anything()), { ignoreExtraArgs: true }).thenCallback(null, response)
      td.replace('request', request)

      const TinderWrapper = require('../../../src/channels/tinder/tinder-wrapper')
      subject = new TinderWrapper()
    })

    it('should reject with out of likes error', () => {
      return subject.like(userId, photoId, contentHash, sNumber)
        .catch((error) => {
          error.should.be.instanceOf(OutOfLikesError)
        })
    })
  })

  describe('when liking with invalid user id', () => {
    const userId = undefined
    const body = {}
    const response = { body }

    beforeEach(() => {
      td.when(request.defaults(), { ignoreExtraArgs: true }).thenReturn(request)
      td.when(request.post(td.matchers.anything()), { ignoreExtraArgs: true }).thenCallback(null, response)
      td.replace('request', request)

      const TinderWrapper = require('../../../src/channels/tinder/tinder-wrapper')
      subject = new TinderWrapper()
    })

    it('should reject with invalid arguments error', () => {
      return subject.like(userId)
        .catch((error) => {
          error.should.be.instanceOf(Error)
          error.message.should.be.equal('invalid arguments')
        })
    })
  })

  describe('when passing', () => {
    const userId = 'my-user-id'
    const statusCode = 200
    const body = {}
    const response = { statusCode, body }

    beforeEach(() => {
      td.when(request.defaults(), { ignoreExtraArgs: true }).thenReturn(request)
      td.when(request.get(td.matchers.anything()), { ignoreExtraArgs: true }).thenCallback(null, response)
      td.replace('request', request)

      const TinderWrapper = require('../../../src/channels/tinder/tinder-wrapper')
      subject = new TinderWrapper()
    })

    it('should do a get request to https://api.gotinder.com/pass/my-user-id', () => {
      return subject.pass(userId)
        .then(() => {
          const captor = td.matchers.captor()

          td.verify(request.get(captor.capture()), { ignoreExtraArgs: true, times: 1 })

          const options = captor.value
          options.should.have.property('url', 'https://api.gotinder.com/pass/my-user-id')
        })
    })

    it('should resolve with response body as data', () => {
      return subject.pass(userId)
        .then((data) => {
          data.should.be.equal(body)
        })
    })
  })

  describe('when passing with invalid user id', () => {
    const userId = undefined
    const body = {}
    const response = { body }

    beforeEach(() => {
      td.when(request.defaults(), { ignoreExtraArgs: true }).thenReturn(request)
      td.when(request.get(td.matchers.anything()), { ignoreExtraArgs: true }).thenCallback(null, response)
      td.replace('request', request)

      const TinderWrapper = require('../../../src/channels/tinder/tinder-wrapper')
      subject = new TinderWrapper()
    })

    it('should reject with invalid arguments error', () => {
      return subject.pass(userId)
        .catch((error) => {
          error.should.be.instanceOf(Error)
          error.message.should.be.equal('invalid arguments')
        })
    })
  })
})

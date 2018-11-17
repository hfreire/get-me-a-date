/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE.md file in the root directory of this source tree.
 */

module.exports = {
  Tinder: require('./tinder'),
  Happn: require('./happn'),
  Mint: require('./mint'),
  NotAuthorizedError: require('./errors').NotAuthorizedError,
  OutOfLikesError: require('./errors').OutOfLikesError
}

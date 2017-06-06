/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

/* eslint-disable no-undef */

window.__nightmare = {}
__nightmare.ipc = require('electron').ipcRenderer
__nightmare.sliced = require('sliced')

// Listen for error events
window.addEventListener('error', function (e) {
  __nightmare.ipc.send('page', 'error', e.message, e.error.stack)
})

var open = window.XMLHttpRequest.prototype.open
window.XMLHttpRequest.prototype.open = function (method, url, async, user, pass) {
  this.addEventListener('readystatechange', function () {
    if (this.readyState === 4) {
      __nightmare.ipc.send('page', 'xhr-complete', url, method, this.responseText)
    }
  }, false)
  open.apply(this, arguments)
};

(function () {
  // prevent 'unload' and 'beforeunload' from being bound
  var defaultAddEventListener = window.addEventListener
  window.addEventListener = function (type) {
    if (type === 'unload' || type === 'beforeunload') {
      return
    }
    defaultAddEventListener.apply(window, arguments)
  }

  // prevent 'onunload' and 'onbeforeunload' from being set
  Object.defineProperties(window, {
    onunload: {
      enumerable: true,
      writable: false,
      value: null
    },
    onbeforeunload: {
      enumerable: true,
      writable: false,
      value: null
    }
  })

  // listen for console.log
  var defaultLog = console.log
  console.log = function () {
    __nightmare.ipc.send('console', 'log', __nightmare.sliced(arguments))
    return defaultLog.apply(this, arguments)
  }

  // listen for console.warn
  var defaultWarn = console.warn
  console.warn = function () {
    __nightmare.ipc.send('console', 'warn', __nightmare.sliced(arguments))
    return defaultWarn.apply(this, arguments)
  }

  // listen for console.error
  var defaultError = console.error
  console.error = function () {
    __nightmare.ipc.send('console', 'error', __nightmare.sliced(arguments))
    return defaultError.apply(this, arguments)
  }

  // overwrite the default alert
  window.alert = function (message) {
    __nightmare.ipc.send('page', 'alert', message)
  }

  // overwrite the default prompt
  window.prompt = function (message, defaultResponse) {
    __nightmare.ipc.send('page', 'prompt', message, defaultResponse)
  }

  // overwrite the default confirm
  window.confirm = function (message, defaultResponse) {
    __nightmare.ipc.send('page', 'confirm', message, defaultResponse)
  }
})()

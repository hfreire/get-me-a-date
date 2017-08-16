/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { enableProdMode } from '@angular/core'
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic'

import './assets/styles/styles.scss'

import { AppModule } from './app'

if (process.env.NODE_ENV === 'production') {
  enableProdMode()
}

export function main () {
  return platformBrowserDynamic()
    .bootstrapModule(AppModule)
}

if (document.readyState === 'complete') {
  main()
} else {
  document.addEventListener('DOMContentLoaded', main)
}

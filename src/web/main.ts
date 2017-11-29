/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the 
 * LICENSE.md file in the root directory of this source tree.
 */

const NODE_ENV = process.env.NODE_ENV

import { enableProdMode } from '@angular/core'
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic'

import './assets/styles/styles.scss'

import { AppModule } from './app'

if (NODE_ENV === 'production') {
  enableProdMode()
}

export function bootstrap () {
  return platformBrowserDynamic()
    .bootstrapModule(AppModule)
}

if (document.readyState === 'complete') {
  bootstrap()
} else {
  document.addEventListener('DOMContentLoaded', bootstrap)
}

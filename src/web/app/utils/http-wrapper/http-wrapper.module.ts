/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { NgModule } from '@angular/core'
import { HttpModule } from '@angular/http'

import { HttpWrapper } from './http-wrapper'

@NgModule({
  imports: [ HttpModule ],
  declarations: [],
  providers: [ HttpWrapper ]
})
export class HttpWrapperModule {
}

/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the 
 * LICENSE.md file in the root directory of this source tree.
 */

import { NgModule } from '@angular/core'

import { HttpWrapper } from './http-wrapper'
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http'
import { HttpBaseApiUrlInterceptor } from './http-base-api-url.interceptor'

@NgModule({
  imports: [ HttpClientModule ],
  declarations: [],
  providers: [
    HttpWrapper,
    { provide: HTTP_INTERCEPTORS, useClass: HttpBaseApiUrlInterceptor, multi: true }
  ]
})
export class HttpWrapperModule {
}

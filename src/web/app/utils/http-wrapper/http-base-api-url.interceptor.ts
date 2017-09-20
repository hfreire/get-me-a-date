/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Inject, Injectable } from '@angular/core'
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http'
import { Observable } from 'rxjs/Observable'
import { DOCUMENT } from '@angular/platform-browser'

const BASE_API_URL = process.env.BASE_API_URL

@Injectable()
export class HttpBaseApiUrlInterceptor implements HttpInterceptor {
  private baseApiUrl: string

  constructor (@Inject(DOCUMENT) private document: any) {
    this.baseApiUrl = BASE_API_URL ? BASE_API_URL : `${this.document.location.hostname}:5940`
  }

  intercept (req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    req = req.clone({ url: `//${this.baseApiUrl}/${req.url}` })

    return next.handle(req)
  }
}

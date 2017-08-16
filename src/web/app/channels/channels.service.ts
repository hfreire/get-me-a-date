/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Injectable } from '@angular/core'

import { HttpWrapper } from '../utils/http-wrapper/http-wrapper'
import { Observable } from 'rxjs/Observable'

@Injectable()
export class ChannelsService {
  constructor (private http: HttpWrapper) {
  }

  getAll (): Observable<any> {
    return this.http.get('channels')
  }

  update (name: string, channel: any): Observable<any> {
    return this.http.put(`channels/${name}`, JSON.stringify(channel))
  }
}

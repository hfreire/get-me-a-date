/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Injectable } from '@angular/core'
import { Http } from '@angular/http'
import 'rxjs/add/operator/map'

@Injectable()
export class ChannelsService {
  constructor (private http: Http) {
  }

  getAll () {
    return this.http.get('/channels')
      .map((res) => res.json())
  }

  updateChannel (name: string, channel: any) {
    return this.http.put(`/channels/${name}`, JSON.stringify(channel))
      .map((res) => res.json())
  }
}

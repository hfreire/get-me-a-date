/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Inject, Injectable } from '@angular/core'
import { Http } from '@angular/http'
import 'rxjs/add/operator/map'
import { DOCUMENT } from '@angular/platform-browser'

@Injectable()
export class ChannelsService {
  constructor (private http: Http, @Inject(DOCUMENT) private document: any) {
  }

  getAll () {
    return this.http.get(`//${this.document.location.hostname}:5940/channels`)
      .map((res) => res.json())
  }

  updateChannel (name: string, channel: any) {
    return this.http.put(`//${this.document.location.hostname}:5940/channels/${name}`, JSON.stringify(channel))
      .map((res) => res.json())
  }
}

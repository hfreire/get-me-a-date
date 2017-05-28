/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import {Injectable} from "@angular/core";
import {Http} from "@angular/http";
import "rxjs/add/operator/map";

@Injectable()
export class PeopleService {
  constructor (private http: Http) {
  }

  getAll () {
    return this.http.get('/people')
      .map((res) => res.json());
  }

  train (id: string) {
    console.log(id)

    return this.http.post(`/train/${id}`, {})
      .map(() => {})
  }
}

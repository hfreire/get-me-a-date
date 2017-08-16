/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as _ from 'lodash'

import { Component, Input } from '@angular/core'
import { MdDialog, MdDialogConfig, MdDialogRef } from '@angular/material'
import { BehaviorSubject } from 'rxjs/BehaviorSubject'
import 'rxjs/add/operator/takeWhile'

import { RecommendationDialogComponent } from './recommendation-dialog'
import { RecommendationsService } from '../recommendations.service'

@Component({
  selector: 'recommendations-list',
  templateUrl: 'recommendations-list.html',
  providers: [ RecommendationsService ]
})
export class RecommendationsListComponent {
  @Input()
  set recommendations (value) {
    this._recommendations.next(value)
  }

  get recommendations () {
    return this._recommendations.asObservable()
  }

  private _recommendations = new BehaviorSubject<any>([])
  private _dialog: MdDialogRef<RecommendationDialogComponent>

  constructor (private recommendationService: RecommendationsService, public dialog: MdDialog) {}

  onRecommendationClick (id: string, index: number) {
    this.recommendationService.getById(id)
      .subscribe((recommendation) => {
        const config = new MdDialogConfig()
        config.width = '450px'
        config.data = { recommendation }

        this._dialog = this.dialog.open(RecommendationDialogComponent, config)
        this._dialog.afterClosed()
          .subscribe(() => {
            this._recommendations.getValue()[ index ] = _.pick(config.data.recommendation, _.keys(this._recommendations.getValue()[ index ]))
          })
      })
  }
}

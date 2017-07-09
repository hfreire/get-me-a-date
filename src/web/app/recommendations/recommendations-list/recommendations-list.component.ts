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
  templateUrl: '/app/recommendations/recommendations-list/recommendations-list.html',
  providers: [ RecommendationsService ]
})
export class RecommendationsListComponent {
  @Input()
  set data (value) {
    this._data.next(value)
  }

  get data () {
    return this._data.getValue()
  }

  recommendationDialog: MdDialogRef<RecommendationDialogComponent>

  recommendations: any = []

  private _data = new BehaviorSubject<any>([])

  constructor (private recommendationService: RecommendationsService, public dialog: MdDialog) {}

  ngOnInit () {
    this._data
      .subscribe((data) => {
        this.recommendations = data
      })
  }

  onRecommendationClick (id: string, index: number) {
    this.recommendationService.getById(id)
      .subscribe((recommendation) => {
        const config = new MdDialogConfig()
        config.width = '450px'
        config.data = { recommendation }

        this.recommendationDialog = this.dialog.open(RecommendationDialogComponent, config)
        this.recommendationDialog.afterClosed()
          .subscribe(() => {
            this.recommendations[ index ] = _.pick(config.data.recommendation, _.keys(this.recommendations[ index ]))
          })
      })
  }
}

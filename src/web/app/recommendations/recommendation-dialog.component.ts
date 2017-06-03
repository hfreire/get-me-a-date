/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { RecommendationsService } from './recommendations.service'

import { Component, Inject } from '@angular/core'
import { MD_DIALOG_DATA, MdDialogRef } from '@angular/material'

import * as _ from 'lodash'

@Component({
  selector: 'recommendation-dialog',
  templateUrl: '/app/recommendations/recommendation-dialog.html',
  providers: [ RecommendationsService ]
})
export class RecommendationDialogComponent {
  occupation: any
  private today: Date
  private recommendation: any

  constructor (public dialogRef: MdDialogRef<any>, @Inject(MD_DIALOG_DATA) public data: any, private recommendationService: RecommendationsService) { }

  ngOnInit () {
    this.today = new Date()
    this.recommendation = this.data.recommendation
    this.occupation = _.has(this.recommendation, 'data.schools[0].name') ? this.recommendation.data.schools[ 0 ].name : _.has(this.recommendation, 'data.jobs[0].company.name') ? this.recommendation.data.jobs[ 0 ].company.name : ''
  }

  trainRecommendation () {
    //noinspection TsLint
    this.recommendationService.train(this.recommendation.id)
      .subscribe(() => {
        this.recommendation.train = true
      })
  }
}

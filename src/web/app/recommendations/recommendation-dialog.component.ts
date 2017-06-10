/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { RecommendationsService } from './recommendations.service'

import { Component, Inject } from '@angular/core'
import { MD_DIALOG_DATA, MdDialogRef } from '@angular/material'
import { animate, state, style, transition, trigger } from '@angular/animations'

import * as _ from 'lodash'

@Component({
  selector: 'recommendation-dialog',
  templateUrl: '/app/recommendations/recommendation-dialog.html',
  providers: [ RecommendationsService ],
  animations: [
    trigger('fadeInOut', [
      state('in', style({ opacity: 1, visibility: 'visible' })),
      state('out', style({ opacity: 0, visibility: 'hidden' })),
      transition('in <=> out', [
        animate('1s ease-out')
      ])
    ])
  ]
})
export class RecommendationDialogComponent {
  fadeInState = 'in'
  fadeOutState = 'out'

  occupation: any
  private today: Date
  private recommendation: any

  constructor (public dialogRef: MdDialogRef<any>, @Inject(MD_DIALOG_DATA) public data: any, private recommendationService: RecommendationsService) { }

  ngOnInit () {
    this.today = new Date()
    this.recommendation = this.data.recommendation
    this.occupation = _.has(this.recommendation, 'data.schools[0].name') ? this.recommendation.data.schools[ 0 ].name : _.has(this.recommendation, 'data.jobs[0].company.name') ? this.recommendation.data.jobs[ 0 ].company.name : ''
  }

  public isLoaded (event: Event) {
    this.fadeInState = 'out'
    this.fadeOutState = 'in'
  }

  like () {
    this.recommendationService.like(this.recommendation.id)
      .subscribe((recommendation) => {
        this.recommendation = recommendation
        this.data.recommendation = recommendation
      })
  }

  pass () {
    this.recommendationService.pass(this.recommendation.id)
      .subscribe((recommendation) => {
        this.recommendation = recommendation
        this.data.recommendation = recommendation
      })
  }
}

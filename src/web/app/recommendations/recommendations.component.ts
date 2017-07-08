/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Component } from '@angular/core'

import { RecommendationsService } from './recommendations.service'
import { RecommendationDialogComponent } from './recommendation-dialog/recommendation-dialog.component'

import { MdDialog, MdDialogConfig, MdDialogRef } from '@angular/material'
import { animate, state, style, transition, trigger } from '@angular/animations'
import * as _ from 'lodash'

@Component({
  selector: 'recommendations',
  templateUrl: '/app/recommendations/recommendations.html',
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
export class RecommendationsComponent {
  loadedPage = false

  fadeInState = 'in'
  fadeOutState = 'out'

  recommendations: any = []
  recommendation: any
  recommendationProperties = [ 'id', 'name', 'thumbnailUrl', 'isLike', 'isPass', 'isTrain', 'isHumanDecision', 'isMatch', 'photosSimilarityMean' ]

  dialogRef: MdDialogRef<RecommendationDialogComponent>

  channelCriteria: any = [
    { value: { channelName: undefined }, label: 'All' },
    { value: { channelName: 'tinder' }, label: 'Tinder' },
    { value: { channelName: 'happn' }, label: 'Happn' }
  ]
  actionCriteria: any = [
    { value: { isLike: undefined, isPass: undefined, isMatch: undefined, isTrain: undefined }, label: 'All' },
    { value: { isLike: true, isPass: undefined, isMatch: undefined, isTrain: undefined }, label: 'Liked' },
    { value: { isLike: undefined, isPass: 1, isMatch: undefined, isTrain: undefined }, label: 'Passed' },
    { value: { isLike: false, isPass: 0, isMatch: undefined, isTrain: undefined }, label: 'Waiting' },
    { value: { isLike: undefined, isPass: undefined, isMatch: 1, isTrain: undefined }, label: 'Matched' },
    { value: { isLike: undefined, isPass: undefined, isMatch: undefined, isTrain: 1 }, label: 'Trained' }
  ]
  currentCriteria: any = _.assign({}, this.channelCriteria[ 0 ].value, this.actionCriteria[ 0 ].value)
  sorts: any = [
    { value: 'lastCheckedOutDate', label: 'Last checked out' },
    { value: 'checkedOutTimes', label: 'Number of times checked out' }
  ]
  currentSort: any = this.sorts[ 0 ].value

  currentPage: number = 0
  itemsPerPage: number = 100
  totalItems: number

  constructor (private recommendationService: RecommendationsService, public dialog: MdDialog) {}

  public ngOnInit () {
    this.getPage()
  }

  public isLoaded (event: Event) {
    this.fadeInState = 'out'
    this.fadeOutState = 'in'
  }

  openRecommendationDialog (recommendationId: string, index: number) {
    this.recommendationService.getById(recommendationId)
      .subscribe((recommendation) => {
        const config = new MdDialogConfig()
        config.width = '450px'
        config.data = { recommendation }

        this.dialogRef = this.dialog.open(RecommendationDialogComponent, config)
        this.dialogRef.afterClosed()
          .subscribe(() => {
            this.recommendations[ index ] = _.pick(config.data.recommendation, this.recommendationProperties)
          })
      })
  }

  getPage (page: number = this.currentPage, limit: number = this.itemsPerPage, criteria: any = this.currentCriteria, select: any = this.recommendationProperties, sort: string = this.currentSort) {
    this.loadedPage = false

    this.currentPage = page
    this.itemsPerPage = limit

    this.recommendations = []

    this.recommendationService.getAll(page, limit, criteria, select, sort)
      .subscribe(({ results, meta }) => {
        this.recommendations = results
        this.totalItems = meta.totalCount

        this.loadedPage = true
      })
  }

  setPageCriterion ({ value }: any) {
    this.currentCriteria = _.assign(this.currentCriteria, value)

    this.getPage(0, undefined)
  }

  setPageSort ({ value }: any) {
    this.currentSort = value

    this.getPage(0, undefined)
  }
}

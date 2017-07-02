/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Component } from '@angular/core'

import { RecommendationsService } from './recommendations.service'
import { RecommendationDialogComponent } from './recommendation-dialog.component'

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
  recommendationProperties = [ 'id', 'name', 'thumbnail_url', 'like', 'is_pass', 'train', 'is_human_decision', 'match', 'photos_similarity_mean' ]
  dialogRef: MdDialogRef<RecommendationDialogComponent>
  currentPage: number = 1
  itemsPerPage: number = 100
  totalItems: number

  channelCriteria: any = [
    { value: { channel: undefined }, label: 'All' },
    { value: { channel: 'tinder' }, label: 'Tinder' },
    { value: { channel: 'happn' }, label: 'Happn' }
  ]
  actionCriteria: any = [
    { value: { like: undefined, is_pass: undefined, match: undefined, train: undefined }, label: 'All' },
    { value: { like: 1, is_pass: undefined, match: undefined, train: undefined }, label: 'Liked' },
    { value: { like: undefined, is_pass: 1, match: undefined, train: undefined }, label: 'Passed' },
    { value: { like: 0, is_pass: 0, match: undefined, train: undefined }, label: 'Waiting' },
    { value: { like: undefined, is_pass: undefined, match: 1, train: undefined }, label: 'Matched' },
    { value: { like: undefined, is_pass: undefined, match: undefined, train: 1 }, label: 'Trained' }
  ]
  currentCriteria: any = _.assign({}, this.channelCriteria[ 0 ].value, this.actionCriteria[ 0 ].value)
  sorts: any = [
    { value: 'last_checked_out_date', label: 'Last checked out' },
    { value: 'checked_out_times', label: 'Number of times checked out' }
  ]
  currentSort: any = this.sorts[ 0 ].value

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

    this.recommendationService.getAll(page, limit, criteria, select, sort)
      .subscribe(({ results, meta }) => {
        this.currentPage = page
        this.recommendations = results
        this.totalItems = meta.totalCount

        this.loadedPage = true
      })
  }

  setPageCriterion ({ value }: any) {
    this.currentCriteria = _.assign(this.currentCriteria, value)

    this.getPage(undefined, undefined)
  }

  setPageSort ({ value }: any) {
    this.currentSort = value

    this.getPage(undefined, undefined)
  }
}

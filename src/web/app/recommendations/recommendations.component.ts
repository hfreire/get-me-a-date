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
  dialogRef: MdDialogRef<RecommendationDialogComponent>
  currentPage: number = 1
  itemsPerPage: number = 100
  totalItems: number

  criteria: any = [
    { value: {}, label: 'All' },
    { value: { like: 1 }, label: 'Likes' },
    { value: { like: 0 }, label: 'Passes' },
    { value: { match: 1 }, label: 'Matches' },
    { value: { train: 1 }, label: 'Training' }
  ]
  currentCriteria: any = this.criteria[ 0 ].value

  constructor (private recommendationService: RecommendationsService, public dialog: MdDialog) {}

  public ngOnInit () {
    this.getPage()
  }

  public isLoaded (event: Event) {
    this.fadeInState = 'out'
    this.fadeOutState = 'in'
  }

  openPersonDialog (recommendation: any) {
    const config = new MdDialogConfig()
    config.width = '450px'
    config.data = { recommendation }

    this.dialogRef = this.dialog.open(RecommendationDialogComponent, config)
  }

  getPage (page: number = this.currentPage, limit: number = this.itemsPerPage, criteria: any = this.currentCriteria) {
    this.loadedPage = false

    this.recommendationService.getAll(page, limit, criteria)
      .subscribe(({ results, meta }) => {
        this.currentPage = page
        this.recommendations = results
        this.totalItems = meta.totalCount

        this.loadedPage = true
      })
  }

  setPageCriteria ({ value }: any) {
    this.currentCriteria = value

    this.getPage(undefined, undefined)
  }
}

/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import * as _ from 'lodash'

import { Component } from '@angular/core'
import { MdDialog, MdDialogConfig, MdDialogRef } from '@angular/material'

import { RecommendationsService } from './recommendations.service'
import { RecommendationDialogComponent } from './recommendation-dialog/recommendation-dialog.component'

@Component({
  selector: 'recommendations',
  templateUrl: '/app/recommendations/recommendations.html',
  providers: [ RecommendationsService ]
})
export class RecommendationsComponent {
  _criteria: any = {}
  _select = [
    'id', 'name', 'thumbnailUrl', 'isLike', 'isPass',
    'isTrain', 'isHumanDecision', 'isMatch', 'photosSimilarityMean'
  ]
  _sort: string = undefined

  recommendations: any = []
  dialogRef: MdDialogRef<RecommendationDialogComponent>

  loadedPage = false
  currentPage: number = 0
  itemsPerPage: number = 100
  totalItems: number

  constructor (private recommendationService: RecommendationsService, public dialog: MdDialog) {}

  public ngOnInit () {
    this.getPage()
  }

  getPage (page: number = this.currentPage, limit: number = this.itemsPerPage, criteria: any = this._criteria, select: any = this._select, sort: string = this._sort) {
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

  onCriteriaChange (criteria: any) {
    this._criteria = criteria

    this.getPage(0, undefined, this._criteria)
  }

  onSortChange (sort: any) {
    this._sort = sort

    this.getPage(0, undefined, undefined, undefined, this._sort)
  }

  onRecommendationsListClick (event: any) {
    this.recommendationService.getById(event.id)
      .subscribe((recommendation) => {
        const config = new MdDialogConfig()
        config.width = '450px'
        config.data = { recommendation }

        this.dialogRef = this.dialog.open(RecommendationDialogComponent, config)
        this.dialogRef.afterClosed()
          .subscribe(() => {
            this.recommendations[ event.index ] = _.pick(config.data.recommendation, this._select)
          })
      })
  }
}

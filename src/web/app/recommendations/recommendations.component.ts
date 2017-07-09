/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Component } from '@angular/core'
import { MdDialog } from '@angular/material'

import { RecommendationsService } from './recommendations.service'

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
}

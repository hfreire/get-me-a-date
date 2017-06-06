/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Component } from '@angular/core'
import { StatsService } from './stats.service'
import * as _ from 'lodash'

@Component({
  selector: 'stats',
  templateUrl: '/app/stats/stats.html',
  providers: [ StatsService ]
})
export class StatsComponent {
  // lineChart
  public lineChartData: Array<any> = [
    { label: 'Likes', data: [] },
    { label: 'Passes', data: [] },
    { label: 'Matches', data: [] },
    { label: 'Training', data: [] }
  ]
  public lineChartLabels: Array<any>
  public lineChartType: string = 'line'
  public lineChartColors: Array<any> = [
    {
      backgroundColor: 'rgba(194, 24, 91, 0.1)',
      borderColor: 'rgba(194, 24, 91, 1)',
      pointBackgroundColor: 'rgba(194, 24, 91, 1)',
      pointBorderColor: 'rgba(212, 203, 207, 1)',
      pointHoverBackgroundColor: 'rgba(212, 203, 207, 1)',
      pointHoverBorderColor: 'rgba(194, 24, 91, 1)'
    },
    {
      backgroundColor: 'rgba(77,83,96,0.2)',
      borderColor: 'rgba(77,83,96,1)',
      pointBackgroundColor: 'rgba(77,83,96,1)',
      pointBorderColor: 'rgba(212, 203, 207, 1)',
      pointHoverBackgroundColor: 'rgba(212, 203, 207, 1)',
      pointHoverBorderColor: 'rgba(77,83,96,1)'
    },
    {
      borderColor: 'rgba(255, 86, 7, 1)',
      pointBackgroundColor: 'rgba(255, 86, 7, 1)',
      pointBorderColor: 'rgba(212, 203, 207, 1)',
      pointHoverBackgroundColor: 'rgba(212, 203, 207, 1)',
      pointHoverBorderColor: 'rgba(255, 86, 7, 1)'
    },
    {
      borderColor: 'rgba(255, 255, 0, 1)',
      pointBackgroundColor: 'rgba(255, 255, 0, 1)',
      pointBorderColor: 'rgba(212, 203, 207, 1)',
      pointHoverBackgroundColor: 'rgba(212, 203, 207, 1)',
      pointHoverBorderColor: 'rgba(255, 255, 0, 1)'
    }
  ]

  constructor (private statsService: StatsService) {}

  public ngOnInit () {
    this.getPage(1, 15)
  }

  getPage (page: number, limit: number = 25) {
    this.statsService.getAll(page, limit)
      .subscribe(({ results }) => {
        this.lineChartLabels = _.reverse(_.map(results, 'date'))
        this.lineChartData[ 0 ].data = _.reverse(_.map(results, 'likes'))
        this.lineChartData[ 1 ].data = _.reverse(_.map(results, 'passes'))
        this.lineChartData[ 2 ].data = _.reverse(_.map(results, 'matches'))
        this.lineChartData[ 3 ].data = _.reverse(_.map(results, 'trains'))
      })
  }
}

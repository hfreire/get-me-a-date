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
  templateUrl: 'stats.html',
  providers: [ StatsService ]
})
export class StatsComponent {
  public lineChartData: Array<any> = [
    { label: 'Machine likes', data: [], type: 'line' },
    { label: 'Human likes', data: [], type: 'line' },
    { label: 'Machine passes', data: [], type: 'line' },
    { label: 'Human passes', data: [], type: 'line' },
    { label: 'Matches', data: [], yAxisID: 'y-axis-2' }
  ]
  public lineChartLabels: Array<any>
  public lineChartType: string = 'bar'
  public lineChartColors: Array<any> = [
    {
      backgroundColor: 'rgba(194, 24, 91, 0.3)',
      borderColor: 'rgba(194, 24, 91, 1)',
      pointBackgroundColor: 'rgba(194, 24, 91, 1)',
      pointBorderColor: 'rgba(212, 203, 207, 1)',
      pointHoverBackgroundColor: 'rgba(212, 203, 207, 1)',
      pointHoverBorderColor: 'rgba(194, 24, 91, 1)'
    },
    {
      backgroundColor: 'rgba(0, 255, 0, 0.1)',
      borderColor: 'rgba(0, 255, 0, 1)',
      pointBackgroundColor: 'rgba(0, 255, 0, 1)',
      pointBorderColor: 'rgba(212, 203, 207, 1)',
      pointHoverBackgroundColor: 'rgba(212, 203, 207, 1)',
      pointHoverBorderColor: 'rgba(0, 255, 0, 1)'
    },
    {
      backgroundColor: 'rgba(36, 36, 36, 0.1)',
      borderColor: 'rgba(36, 36, 36, 1)',
      pointBackgroundColor: 'rgba(36, 36, 36, 1)',
      pointBorderColor: 'rgba(212, 203, 207, 1)',
      pointHoverBackgroundColor: 'rgba(212, 203, 207, 1)',
      pointHoverBorderColor: 'rgba(36, 36, 36, 1)'
    },
    {
      backgroundColor: 'rgba(255, 0, 21, 0.1)',
      borderColor: 'rgba(255, 0, 21, 0.5)',
      pointBackgroundColor: 'rgba(255, 0, 21, 0.5)',
      pointBorderColor: 'rgba(212, 203, 207, 1)',
      pointHoverBackgroundColor: 'rgba(212, 203, 207, 1)',
      pointHoverBorderColor: 'rgba(255, 0, 21, 0.5)'
    },
    {
      backgroundColor: 'rgba(189, 128, 18, 0.3)',
      borderColor: 'rgba(189, 128, 18, 1)',
      pointBackgroundColor: 'rgba(189, 128, 18, 1)',
      pointBorderColor: 'rgba(212, 203, 207, 1)',
      pointHoverBackgroundColor: 'rgba(212, 203, 207, 1)',
      pointHoverBorderColor: 'rgba(189, 128, 18, 1)'
    }
  ]
  public lineChartOptions: any = {
    scales: {
      tooltips: {
        mode: 'index',
        intersect: true
      },
      yAxes: [{
        type: 'linear', // only linear but allow scale type registration. This allows extensions to exist solely for log scale for instance
        display: true,
        position: 'left',
        id: 'y-axis-1'
      }, {
        type: 'linear', // only linear but allow scale type registration. This allows extensions to exist solely for log scale for instance
        display: true,
        position: 'right',
        id: 'y-axis-2',
        gridLines: {
          drawOnChartArea: false
        }
      }]
    }
  }

  constructor (private statsService: StatsService) {}

  public ngOnInit () {
    this.getPage(1)
  }

  getPage (page: number, limit: number = 25) {
    this.statsService.getAll(page, limit)
      .subscribe(({ results }) => {
        this.lineChartLabels = _.reverse(_.map(results, ({ date }) => date.replace(/T.*$/, '')))
        this.lineChartData[ 0 ].data = _.reverse(_.map(results, 'machineLikes'))
        this.lineChartData[ 1 ].data = _.reverse(_.map(results, 'humanLikes'))
        this.lineChartData[ 2 ].data = _.reverse(_.map(results, 'machinePasses'))
        this.lineChartData[ 3 ].data = _.reverse(_.map(results, 'humanPasses'))
        this.lineChartData[ 4 ].data = _.reverse(_.map(results, 'matches'))
      })
  }
}

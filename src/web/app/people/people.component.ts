/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Component } from '@angular/core'

import { PeopleService } from './people.service'
import { PersonDialogComponent } from './person-dialog.component'

import { MdDialog, MdDialogConfig, MdDialogRef } from '@angular/material'
import { animate, state, style, transition, trigger } from '@angular/animations'

@Component({
  selector: 'people',
  templateUrl: '/app/people/people.html',
  providers: [ PeopleService ],
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
export class PeopleComponent {
  loadedPage = false

  fadeInState = 'in'
  fadeOutState = 'out'

  people: any = []
  person: any
  dialogRef: MdDialogRef<PersonDialogComponent>
  currentPage: number = 1
  itemsPerPage: number = 100
  totalItems: number

  criteria: any = [
    { value: {}, label: 'Everyone' },
    { value: { like: 1 }, label: 'Likes' },
    { value: { like: 0 }, label: 'Passes' },
    { value: { train: 1 }, label: 'Training' }
  ]

  constructor (private peopleService: PeopleService, public dialog: MdDialog) {}

  public ngOnInit () {
    this.getPage()
  }

  public isLoaded (event: Event) {
    this.fadeInState = 'out'
    this.fadeOutState = 'in'
  }

  openPersonDialog (person: any) {
    const config = new MdDialogConfig()
    config.width = '450px'
    config.data = { person }

    this.dialogRef = this.dialog.open(PersonDialogComponent, config)
  }

  getPage (page: number = this.currentPage, limit: number = this.itemsPerPage, criteria?: any) {
    this.loadedPage = false

    this.peopleService.getAll(page, limit, criteria)
      .subscribe(({ results, meta }) => {
        this.currentPage = page
        this.people = results
        this.totalItems = meta.totalCount

        this.loadedPage = true
      })
  }

  setPageCriteria ({ value }: any) {
    this.getPage(undefined, undefined, value)
  }
}

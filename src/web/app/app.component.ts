/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Component } from '@angular/core'

import { PeopleService } from './people/people.service'
import { PersonDialogComponent } from './people/person-dialog.component'

import { MdDialog, MdDialogConfig, MdDialogRef } from '@angular/material'
import { animate, state, style, transition, trigger } from '@angular/animations'

@Component({
  selector: 'app',
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
export class AppComponent {
  loaded = false
  fadeInState = 'in'
  fadeOutState = 'out'

  people: any = []
  person: any
  dialogRef: MdDialogRef<PersonDialogComponent>
  currentPage: number = 1
  itemsPerPage: number = 100
  totalItems: number

  constructor (private peopleService: PeopleService, public dialog: MdDialog) {}

  public ngOnInit () {
    this.getPage(this.currentPage, this.itemsPerPage)
  }

  public isLoaded (event: Event) {
    this.loaded = true
    this.fadeInState = 'out'
    this.fadeOutState = 'in'
  }

  openPersonDialog (person: any) {
    const config = new MdDialogConfig()
    config.data = { person }

    this.dialogRef = this.dialog.open(PersonDialogComponent, config)
  }

  getPage (page: number, limit: number = this.itemsPerPage) {
    this.peopleService.getAll(page, limit)
      .subscribe(({ results, meta }) => {
        this.currentPage = page
        this.people = results
        this.totalItems = meta.totalCount
      })
  }
}

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

@Component({
  selector: 'app',
  templateUrl: '/app/people/people.html',
  providers: [ PeopleService ]
})
export class AppComponent {
  people: any
  person: any
  dialogRef: MdDialogRef<PersonDialogComponent>

  constructor (private service: PeopleService, public dialog: MdDialog) {
    service.getAll()
      .subscribe((people) => {
        this.people = people
      })
  }

  openPersonDialog (person: any) {
    const config = new MdDialogConfig()
    config.data = { person }

    this.dialogRef = this.dialog.open(PersonDialogComponent, config)
  }
}

/*
 * Copyright (c) 2017, Hugo Freire <hugo@exec.sh>.
 *
 * This source code is licensed under the license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { Component } from '@angular/core'

import { ChannelsService } from './channels.service'

@Component({
  selector: 'channels',
  templateUrl: '/app/channels/channels.html',
  providers: [ ChannelsService ]
})
export class ChannelsComponent {
  channels: any

  constructor (private channelsService: ChannelsService) {}

  public ngOnInit () {
    this.getAllChannels()
  }

  getAllChannels () {
    this.channelsService.getAll()
      .subscribe((channels) => {
        this.channels = channels
      })
  }

  toggleChannel (channel: any) {
    this.channelsService.updateChannel(channel.name, { is_enabled: !channel.is_enabled })
      .subscribe((_channel) => {
        channel.is_enabled = _channel.is_enabled
      })
  }
}

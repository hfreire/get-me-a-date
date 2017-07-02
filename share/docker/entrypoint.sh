#!/bin/sh

export DISPLAY=:0

$(which Xvfb) $DISPLAY -ac &

$(which npm) start

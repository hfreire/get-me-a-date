#!/bin/sh

export DISPLAY=:0

$(which Xvfb) $DISPLAY -ac >/dev/null 2>&1 &

$(which npm) start

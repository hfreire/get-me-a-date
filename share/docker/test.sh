#!/bin/sh

./start.sh &

sleep 10

curl \
--silent \
--fail \
--connect-timeout 5 \
--max-time 10 \
--retry 5 \
--retry-delay 5 \
--retry-max-time 60 \
http://localhost:3000/ping >/dev/null 2>&1 || exit 1

#!/bin/bash

export NODE_PATH=.:$NODE_PATH
export PORT=5000
export MOCHA_OPTS="--timeout 7000"

pkill node
set -e

echo "=========================================="
echo "Integration Tests"
echo "=========================================="

if [ "$TRAVIS" = "true" ]; then
	DEBUG=echo:* bin/www &
else
	DEBUG=echo:* bin/www 2&>/tmp/echojs.log &
fi

sleep 2

if [ $# -gt 0 ]; then
	mocha $MOCHA_OPTS $@
else
	mocha $MOCHA_OPTS --recursive test/integration
fi

pkill node

# echo "Server log:"
# cat -n /tmp/echojs.log
# rm /tmp/echojs.log

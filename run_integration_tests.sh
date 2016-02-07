#!/bin/bash

export NODE_PATH=.:$NODE_PATH
export PORT=5000

pkill node

echo "=========================================="
echo "Integration Tests"
echo "=========================================="

set -e

bin/www >/tmp/echojs.log &
sleep 1

if [ $# -gt 0 ]; then
	mocha $@
else
	mocha --recursive test/integration
fi

pkill node

echo "Server log:"
cat /tmp/echojs.log
rm /tmp/echojs.log

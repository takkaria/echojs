#!/bin/bash

export NODE_PATH=.:$NODE_PATH
export PORT=5000

pkill node
set -e

echo "=========================================="
echo "Integration Tests"
echo "=========================================="

bin/www 2&>/tmp/echojs.log &
sleep 2

if [ $# -gt 0 ]; then
	mocha $@
else
	mocha --recursive test/integration
fi

pkill node

echo "Server log:"
cat -n /tmp/echojs.log
rm /tmp/echojs.log

#!/bin/sh

export NODE_PATH=.:$NODE_PATH

echo "=========================================="
echo "Unit Tests"
echo "=========================================="

if [ $# -gt 0 ]; then
	mocha $MOCHA_OPTS $@
else
	mocha $MOCHA_OPTS --recursive test/unit
fi

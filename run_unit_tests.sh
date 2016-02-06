#!/bin/sh

export NODE_PATH=.:$NODE_PATH

echo "=========================================="
echo "Unit Tests"
echo "=========================================="

mocha --recursive test/unit/ $@

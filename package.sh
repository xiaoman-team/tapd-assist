#!/bin/sh

CURRENT_DIR=`pwd`
EXTENSION_DIR=`dirname "${BASH_SOURCE[0]}"`

cd $EXTENSION_DIR/src \
    && zip -r ../src.zip . \
    && cd $CURRENT_DIR


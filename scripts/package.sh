#!/bin/sh

CURRENT_DIR=`pwd`
SCRIPTS_DIR=`dirname "${BASH_SOURCE[0]}"`

cd $SCRIPTS_DIR/../src \
    && zip -r ../src.zip . \
    && cd $CURRENT_DIR


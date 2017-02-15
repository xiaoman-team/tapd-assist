#!/bin/sh

CURRENT_DIR=`pwd`
SCRIPTS_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

cd $SCRIPTS_DIR/../src \
    && rm -rf ../src.zip \
    && zip -r ../src.zip . \
    && cd $CURRENT_DIR


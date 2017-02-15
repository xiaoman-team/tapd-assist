#!/bin/sh

# your extension id, modify it if needed
EXTENSION_ID=ifnplghlomamhddgdknfcennkpcjcoke

if [ "$CURL_OPTS" = "" ]; then
    echo '\033[0;31m[Warn]\033[0m \033[1;33mThis script will access google services. You can config CURL_OPTS to fuck GFW\033[0m'
    echo '    CURL_OPTS="--proxy=http://localhost:8000/" ./scripts/publish.sh'
    echo ' or CURL_OPTS="--socks5-hostname localhost:2080" ./scripts/publish.sh'
fi

# CURL_OPTS=

# token got from https://console.developers.google.com/apis/credentials?project=xiaomanassistextension&authuser=1
CLIENT_ID=941813370135-unca1mt7pch2nje1j8qfpk83344sv8dn.apps.googleusercontent.com
CLIENT_SECRET=EcKyG5WpHsIQmGx_Tucx8lxL
REFRESH_TOKEN=1/Lc9krxfpGzQm6yUu2X5UdpPpU_T2qmLXzbMQ9BYrUxmh6eBvExlAECyVPYyycCs4

SCRIPTS_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
CHROME_LEASE_VERSION=31.0.1609.0
CRX_FILENAME=$SCRIPTS_DIR/../${EXTENSION_ID}_main.crx

get_manifest_version() {
    node $SCRIPTS_DIR/json.js version $SCRIPTS_DIR/../src/manifest.json
}

get_access_token() {
    curl \
        $CURL_OPTS \
        -s \
        -H 'Content-Type: application/x-www-form-urlencoded' \
        -X POST \
        -d "client_id=$CLIENT_ID&client_secret=$CLIENT_SECRET&grant_type=refresh_token&refresh_token=$REFRESH_TOKEN" \
        "https://accounts.google.com/o/oauth2/token" | \
        node $SCRIPTS_DIR/json.js access_token
}

get_extension_version() {
    curl \
        $CURL_OPTS \
        -s \
        -H "Authorization: Bearer $ACCESS_TOKEN"  \
        -H "x-goog-api-version: 2" \
        -H "Content-Length: 0" \
        -H "Expect:" \
        "https://www.googleapis.com/chromewebstore/v1.1/items/$EXTENSION_ID?projection=draft" | \
        node $SCRIPTS_DIR/json.js crxVersion
}

upload_extension_zip() {
    tempfile=`mktemp`.json
    curl \
        $CURL_OPTS \
        -s \
        -H "Authorization: Bearer $ACCESS_TOKEN"  \
        -H "x-goog-api-version: 2" \
        -X PUT \
        --upload-file $SCRIPTS_DIR/../src.zip \
        "https://www.googleapis.com/upload/chromewebstore/v1.1/items/$EXTENSION_ID" > $tempfile
    state=`node $SCRIPTS_DIR/json.js uploadState $tempfile`
    if [ $state = "FAILURE" ]; then
        node $SCRIPTS_DIR/json.js itemError $tempfile
        return 1
    fi
    echo state
}

publish_extension() {
    tempfile=`mktemp`.json
    curl \
        $CURL_OPTS \
        -s \
        -H "Authorization: Bearer $ACCESS_TOKEN"  \
        -H "x-goog-api-version: 2" \
        -H "Content-Type: application/json" \
        -X POST \
        -d '{"target":"default"}' \
        "https://www.googleapis.com/chromewebstore/v1.1/items/$EXTENSION_ID/publish" > $tempfile
    status=`node $SCRIPTS_DIR/json.js status.0 $tempfile`
    if [ $status != "OK" ]; then
        node $SCRIPTS_DIR/json.js status $tempfile
        node $SCRIPTS_DIR/json.js statusDetail $tempfile
        return 1
    fi
    echo $status
}

get_crx_download_url() {
    curl \
        $CURL_OPTS \
        -s \
        -D - \
        "https://clients2.google.com/service/update2/crx?response=redirect&prodversion=$CHROME_LEASE_VERSION&x=id%3D$EXTENSION_ID%26uc" | \
        grep '^Location:' | \
        sed 's/^Location:[ \t]*\(.*\)$/\1/'
}

download_bin() {
    url=$1
    filename=$2

    curl \
        $CURL_OPTS \
        -s \
        $url \
        > $filename
}

echo "Start" \
    && MANIFEST_VERSION=`get_manifest_version` \
    && echo "manifest version $MANIFEST_VERSION" \
    && echo "packaging zip..." \
    && $SCRIPTS_DIR/package.sh \
    && echo "getting access token..." \
    && ACCESS_TOKEN=`get_access_token` \
    && echo "access token: $ACCESS_TOKEN" \
    && echo "uploading zip..." \
    && upload_extension_zip \
    && echo "uploaded zip" \
    && echo "publish extension..." \
    && publish_extension \
    && echo "published extension" \
    && EXTENSION_VERSION=`get_extension_version` \
    && echo "current chrome store version $EXTENSION_VERSION" \
    && CRX_DOWNLOAD_URL=`get_crx_download_url` \
    && echo "download extension $CRX_DOWNLOAD_URL" \
    && download_bin $CRX_DOWNLOAD_URL $CRX_FILENAME \
    && echo "downloaded crx $CRX_FILENAME" \
    && echo "Done"



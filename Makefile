MAIN ?= mp3.main

export MP3_JSON = web/mp3.json

_test: test

test-db: MAIN=mp3.db
test-db: test

include build/Makefile

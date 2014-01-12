MAIN ?= mp3.server

_test: test

test-db: MAIN=mp3.db
test-db: test

include build/Makefile

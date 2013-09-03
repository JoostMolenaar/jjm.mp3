NAME = mp3

PIP_NAME = mp3
PIP_REQ = requirements.txt

MAIN ?= mp3.server

PKG = xhttp xmlist sh

STATIC_DIRS = conf run static

_test: test

test-db: MAIN=mp3.db
test-db: test

include build/Makefile

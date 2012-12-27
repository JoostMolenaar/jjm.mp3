NAME = mp3

PIP_NAME = jjm.mp3
PIP_REQ = requirements.txt

MAIN ?= jjm.mp3.server

PKG_BASE = file:///home/joost/git
PKG = jjm jjm.xhttp jjm.xml jjm.sh

STATIC_DIRS = conf web run

test-db: MAIN=jjm.mp3.db
test-db: test


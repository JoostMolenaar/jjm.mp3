#!/bin/bash

paths=/home/joost/shared/Music/{Ambient,Dub*,Electro*,Exotic,Hip-Hop,Metal*,Trip*,Weird*}
outfile=web/mp3.json

if [ "$1" == "--check" ]; then
	eval "./mp3lint.py $paths"
else
    cd env ; eval "bin/python -m jjm.mp3.indexer $paths" > ../$outfile.tmp  || exit 1
    cd .. ; mv $outfile.tmp $outfile
fi

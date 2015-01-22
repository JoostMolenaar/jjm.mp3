#!/usr/bin/env python2.7

repo_names = ['xhttp', 'sh', 'xmlist']
dist_names = ['pillow', 'mutagen', 'unidecode', 'fusepy']
static_dirs = ['static']

import os
from setuptools import setup

try:
    with open('mp3.egg-info/version.txt', 'r') as f:
        version = f.read()
except:
    version = None

setup(
    name='mp3',
    version=version,
    version_command=('git describe', None),
    packages=['mp3'],
    author='Joost Molenaar',
    author_email='j.j.molenaar@gmail.com',
    url='https://github.com/j0057/mp3',
    data_files=[ (root, map(lambda f: root + '/' + f, files))
                 for src_dir in static_dirs
                 for (root, dirs, files) in os.walk(src_dir) ],
    install_requires=dist_names+repo_names,
    entry_points={
        'console_scripts': [
            'scan = mp3.scanner:main'
        ]
    },
    custom_metadata={
        'x_repo_names': repo_names,
        'x_dist_names': dist_names,
        'x_static_dirs': static_dirs
    })



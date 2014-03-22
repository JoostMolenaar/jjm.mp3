import argparse
import sys
import os.path

import mp3.db

mp3.db.QUIET = False

def open_db(run, user):
    if not os.path.isdir(run):
        os.makedirs(run)
    db = mp3.db.Users(run)
    try:
        db.get_by_name(user)
    except KeyError:
        db.add_local_user(user)
    return db

def update_user(run, user):
    db = open_db(run, user)
    db.get_by_name(user).library.update()
    db.save()

def add_path(run, user, path):
    db = open_db(run, user)
    db.get_by_name(user).library.add(path)
    db.save()

def main():
    if len(sys.argv) == 3:
        run = sys.argv[1].decode('utf8')
        user = sys.argv[2].decode('utf8')
        update_user(run, user)
    elif len(sys.argv) == 4:
        run = sys.argv[1].decode('utf8')
        user = sys.argv[2].decode('utf8')
        path = sys.argv[3].decode('utf8')
        add_path(run, user, path)
    else:
        print 'error'

if __name__ == '__main__':
    main()

#    users = Users('run')
#    users.add('Joost', Library())
#    users.get_by_name('Joost').library.add('/mnt/usb1t/music/Electronic')
#    users.get_by_name('Joost').library.update()

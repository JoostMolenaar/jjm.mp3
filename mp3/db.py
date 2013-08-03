#!/usr/bin/env python

import hashlib 
import json
import os.path
import re
import StringIO

from itertools import groupby

import mutagen
import mutagen.id3
import mutagen.mp3

import Image as PIL

from unidecode import unidecode

import sh

# A Library contains zero or more Collection objects, which inherit from TrackList,
# and which contain zero or more Track objects. TrackList allows filtering tracks by certain
# properties of a track, such as artist and album.

mutagen.id3.pedantic = False

__all__ = [ 'Track', 'TrackList', 'Library' ]

QUIET = True

def _clean_url(name, s="-"):
    name = name.lower()
    name = unidecode(name)
    name = name.replace('\'', '')
    name = re.sub('[^a-z0-9+]+', s, name)
    name = re.sub('^' + s, '', name)
    name = re.sub(s + '$', '', name)
    return name

#
# Track
#

class Track(object):
    def __init__(self, fn, mtime, artist, album, track, title, **extra_props):
        self.fn = fn

        self.mtime = mtime
        self.artist = artist
        self.album = album
        self.track = track
        self.title = title

        self.artist_url = _clean_url(self.artist)
        self.album_url = _clean_url(self.album)
        self.title_url = _clean_url(self.title)

        self.__dict__.update(extra_props)

    def __repr__(self):
        return "{0}/{1}/{2}-{3}.mp3".format(self.artist_url, self.album_url, self.track, self.title_url)

    @staticmethod
    def from_file(fn, **extra_props):
        t = mutagen.mp3.MP3(os.path.abspath(fn))

        artist = t.has_key('TPE1') and t['TPE1'].text[0] or None
        album  = t.has_key('TALB') and t['TALB'].text[0] or None
        track  = t.has_key('TRCK') and t['TRCK'].text[0] or None
        title  = t.has_key('TIT2') and t['TIT2'].text[0] or None

        assert artist is not None, u'No artist'
        assert album is not None, u'No album'
        assert track is not None, u'No track'
        assert title is not None, u'No title'

        if not artist: raise Exception('No artist')
        if not album: raise Exception('No album')
        if not track: raise Exception('No track')
        if not title: raise Exception('No title')

        if 0:
            for phrase in ['vs.', 'vs', 'ft.', 'ft', 'Meets', 'Presents']:
                artist = artist.replace(' ' + phrase + ' ', ' & ')

        track = track.split('/')[0] if '/' in track else track
        track = int(track)
        track = '{0:02d}'.format(track)

        mtime = os.stat(fn).st_mtime
        mtime = int(mtime)

        extra_props['bitrate'] = t.info.bitrate
        extra_props['length'] = t.info.length
        try: 
            if t.has_key('TDRC'): extra_props['year'] = str(t['TDRC'].text[0])
            if t.has_key('TDRL'): extra_props['year'] = str(t['TDRL'].text[0])
            extra_props['year'] = int(extra_props['year'])
        except:
            extra_props['year'] = None

        try:
            extra_props['image_type'] = t['APIC:'].mime
            extra_props['image_hash'] = hashlib.sha1(t['APIC:'].data).hexdigest()
            extra_props['image_size'] = len(t['APIC:'].data)
        except:
            extra_props['image_type'] = None
            extra_props['image_hash'] = None
            extra_props['image_size'] = None

        return Track(fn, mtime, artist, album, track, title, **extra_props) 

    @staticmethod
    def try_from_file(fn, **extra_props):
        try:
            result = Track.from_file(fn, **extra_props)
            if not QUIET:
                print result
            return result
        except Exception as e:
            if not QUIET:
                print fn, ':', str(e)
            return None

    @staticmethod
    def from_obj(obj, **extra_props):
        obj.update(extra_props)
        fn = obj.pop('fn')
        mtime = obj.pop('mtime')
        artist = obj.pop('artist')
        album = obj.pop('album')
        track = obj.pop('track')
        title = obj.pop('title')
        return Track(fn, mtime, artist, album, track, title, **obj)

    def obj(self):
        return {
            'fn': self.fn,
            'mtime': self.mtime,
            'artist': self.artist,
            'album': self.album,
            'track': self.track,
            'title': self.title,
            'bitrate': self.bitrate,
            'length': self.length,
            'year': self.year,
            'image_type': self.image_type,
            'image_hash': self.image_hash,
            'image_size': self.image_size
        }

    @property
    def image_data(self):
        return mutagen.mp3.MP3(os.path.abspath(self.fn))['APIC:'].data

    @property
    def image_data_small(self):
        data = StringIO.StringIO(self.image_data)
        result = StringIO.StringIO()
        image = PIL.open(data)
        thumb = image.resize((75, 75), PIL.ANTIALIAS)
        thumb.save(result, 'jpeg')
        result.seek(0)
        return result.buf

#
# TrackList
#

class TrackList(object):
    def __init__(self, items=None):
        items = [] if items is None else items
        items = [ t for t in items if t ]
        self.items = items

    def __getitem__(self, i):
        return self.items[i]

    def __repr__(self):
        return '<TrackList [{0}]>'.format(', '.join(repr(t) for t in self.items))

    def get_by_artist(self, artist):
        result = (track for track in self.items if track.artist == artist)
        return TrackList(sorted(result, key=lambda t: (t.artist, t.album, t.track)))

    def get_by_artist_url(self, artist_url):
        result = (track for track in self.items if track.artist_url == artist_url)
        return TrackList(sorted(result, key=lambda t: (t.artist, t.album, t.track))) 

    def get_by_album(self, album):
        result = (track for track in self.items if track.album == album)
        return TrackList(sorted(result, key=lambda t: (t.artist, t.album, t.track)))

    def get_by_album_url(self, album_url):
        result = (track for track in self.items if track.album_url == album_url)
        return TrackList(sorted(result, key=lambda t: (t.artist, t.album, t.track)))

    def get_by_track_num(self, track_num):
        for track in self.items:
            if track.track == track_num:
                return track
        raise KeyError(track_num)

    def get_artists(self):
        return sorted({ (track.artist, track.artist_url) for track in self.items })

    def get_albums(self):
        return sorted({ (track.album, track.album_url) for track in self.items })

    def get_tracks(self):
        return sorted({ (track.title, track.title_url) for track in self.items })

    def get_mtime(self):
        return max(track.mtime for track in self.items)

    def get_first_with_cover(self):
        result = (track for track in self.items if track.image_type) 
        try:
            return next(result)
        except StopIteration:
            return None

#
# Collection
#

class Collection(TrackList):
    def __init__(self, path, files_generator, **extra_props):
        self.path = path

        self.name = os.path.basename(self.path)
        self.name_url = _clean_url(self.name)

        self.__dict__.update(extra_props)

        super(Collection, self).__init__(files_generator(self))

    def __repr__(self):
        return '<Collection "{0}" ({1})>'.format(self.name, len(self.items))

    @staticmethod
    def scan_files(path):
        return sh.findf(path, '*.mp3')

    @staticmethod
    def scan(path):
        files_gen = lambda self: (Track.try_from_file(fn, library=self.name, library_url=self.name_url) 
                                  for fn in Collection.scan_files(path))
        return Collection(path, files_gen) 

    def obj(self):
        return {
            'name': self.name,
            'path': self.path,
            'tracks': [ item.obj() for item in self.items ]
        }

    @staticmethod
    def from_obj(obj, **extra_props):
        files_gen = lambda self: (Track.from_obj(track, library=self.name, library_url=self.name_url) 
                                  for track in obj['tracks'])
        result = Collection(obj['path'], files_gen)
        result.__dict__.update(extra_props)
        return result

    def update(self):
        files = { fn: int(os.path.getmtime(fn))
                  for fn in Collection.scan_files(self.path) }

        remove = [ i for (i, track) in enumerate(self.items)
                   if (track.fn not in files) 
                   or (track.mtime != files[track.fn]) ]

        for i in remove[::-1]:
            del self.items[i]
                
        current = { track.fn for track in self.items }
        add = [ Track.try_from_file(fn) for fn in files if fn not in current ]
        add = [ track for track in add if track ]

        self.items += add
        self.items = sorted(self.items, key=lambda t: (t.artist, t.album, t.track))

#
# Library 
#

class Library(object):
    def __init__(self, items=None):
        self.items = items or []

    def __repr__(self):
        return "<Library: {0!r}>".format(self.items)

    def obj(self):
        return [ collection.obj() for collection in self.items ] 

    @staticmethod
    def from_obj(obj):
        return Library([ Collection.from_obj(collection) for collection in obj ])

    def add(self, path):
        collection = Collection.scan(path)
        self.items.append(collection)
        return collection

    def update(self):
        for collection in self.items:
            collection.update()

    def get_by_name(self, name):
        for collection in self.items:
            if collection.name == name:
                return collection
        raise KeyError(name)

    def get_by_name_url(self, name_url):
        for collection in self.items:
            if collection.name_url == name_url:
                return collection
        raise KeyError(name_url)

    def get_mtime(self):
        return max(collection.get_mtime() for collection in self.items)

#
# LocalUser
#

class LocalUser(object):
    def __init__(self, name, library):
        self.name = name
        self.name_url = _clean_url(name)
        self.library = library

    def __repr__(self):
        return "<LocalUser {0} ({1})>".format(self.name, len(self.library.items))

    def obj(self):
        return {
            "_type": "LocalUser",
            "name": self.name,
            "library": self.library.obj()
        }

    @classmethod
    def from_obj(cls, obj):
        return cls(obj["name"], Library.from_obj(obj["library"]))

#
# Users
#

class Users(object):
    def __init__(self, path):
        self.path = path
        self.items = list(self.scan_users())

    def scan_users(self):
        for fn in sh.findf(self.path, "*.json"):
            obj = load_json(fn)
            if obj["_type"] == "LocalUser":
                user = LocalUser.from_obj(obj)
            elif obj["_type"] == "RemoteUser":
                user = RemoteUser.from_obj(obj)
            yield user

    def get_by_name(self, name):
        for user in self.items:
            if user.name == name:
                return user
        raise KeyError(name)

    def get_by_name_url(self, name_url):
        for user in self.items:
            if user.name_url == name_url:
                return user
        raise KeyError(name_url)

    def save(self):
        for user in self.items:
            save_json(os.path.join(self.path, user.name_url + ".json"), user.obj())

    def resolve(self, *args):
        args = list(args)
      
        result = self.get_by_name_url(args.pop(0)) # -> User
        if not args: return result

        result = result.library.get_by_name_url(args.pop(0)) # -> Collection
        if not args: return result

        artist_url = args.pop(0)
        result = result.get_by_artist_url(artist_url) # -> TrackList (artist_url)
        if not result.items: raise KeyError(artist_url)
        if not args: return result

        album_url = args.pop(0)
        result = result.get_by_album_url(album_url) # -> TrackList (album_url)
        if not result.items: raise KeyError(album_url)
        if not args: return result

        result = result.get_by_track_num(args.pop(0)) # -> Track
        if not args: return result

        title_url = args.pop(0)
        if result.title_url != title_url: raise KeyError(title_url)
        if not args: return result

        raise Exception("Leftover arguments: {0!r}".format(args)) 

#
# json helper functions
#

obj_to_json = lambda o: json.dumps(o, sort_keys=True, indent=4, encoding='utf8')
json_to_obj = lambda s: json.loads(s, encoding='utf8')

def load_json(fn):
    with open(fn, 'r') as f:
        return json_to_obj(f.read())

def save_json(fn, obj):
    with open(fn, 'w') as f:
        f.write(obj_to_json(obj))
        f.write('\n')


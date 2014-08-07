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

import PIL.Image

from unidecode import unidecode

import sh

# A Library contains zero or more Collection objects, which inherit from
# TrackList, and which contain zero or more Track objects. TrackList allows
# filtering tracks by certain properties of a track, such as artist and album.

mutagen.id3.pedantic = False

__all__ = ['Track', 'TrackList', 'Library']

QUIET = True


def _clean_url(name, s="-"):
    if not name:
        return None
    name = name.lower()
    name = unidecode(name)
    name = name.replace('\'', '')
    name = re.sub('[^a-z0-9+]+', s, name)
    name = re.sub('^' + s, '', name)
    name = re.sub(s + '$', '', name)
    return name


class Track(object):
    def __init__(self, fn, mtime, artist, album, track, title, **extra_props):
        self.fn = fn

        self.mtime = mtime
        self.artist = artist
        self.album = album
        self.track = track
        self.title = title

        self.artists = artist
        for phrase in ['vs.', 'vs', 'ft.', 'ft', 'Meets', 'Presents']:
            self.artists = self.artists.replace(' ' + phrase + ' ', ' & ')
        self.artists = self.artists.split(' & ')

        self.artist_url = _clean_url(self.artist)
        self.artists_url = map(_clean_url, self.artists)
        self.album_url = _clean_url(self.album)
        self.title_url = _clean_url(self.title)

        if 'genres' in extra_props: self.genres_url = map(_clean_url, extra_props['genres'])
        if 'label' in extra_props: self.label_url = _clean_url(extra_props['label'])
        if 'catno' in extra_props: self.catno_url = _clean_url(extra_props['catno'])

        self.__dict__.update(extra_props)

    def __repr__(self):
        return "{0}/{1}/{2}-{3}.mp3".format(self.artist_url, self.album_url, self.track, self.title_url)

    @staticmethod
    def from_file(fn, **extra_props):
        # TPE1 : artist
        # TALB : album name
        # TRCK : track number
        # TIT2 : track title
        # TCON : genres
        # TDRC/TDRL : year
        # APIC : cover
        # TPUB : label
        # TXXX:CATALOGNUMBER : cat.no

        t = mutagen.mp3.MP3(os.path.abspath(fn))

        artist = t.has_key('TPE1') and t['TPE1'].text[0] or None
        album  = t.has_key('TALB') and t['TALB'].text[0] or None
        track  = t.has_key('TRCK') and t['TRCK'].text[0] or None
        title  = t.has_key('TIT2') and t['TIT2'].text[0] or None

        if not artist: raise Exception('No artist')
        if not album: raise Exception('No album')
        if not track: raise Exception('No track')
        if not title: raise Exception('No title')

        track = track.split('/')[0] if '/' in track else track
        track = int(track)
        track = '{0:02d}'.format(track)

        mtime = os.stat(fn).st_mtime
        mtime = int(mtime)

        extra_props['genres'] = t.has_key('TCON') and t['TCON'].text or []

        extra_props['label'] = t.has_key('TPUB') and t['TPUB'].text[0] or None
        extra_props['catno'] = t.has_key('TXXX:CATALOGNUMBER') and t['TXXX:CATALOGNUMBER'].text[0] or None

        extra_props['bitrate'] = t.info.bitrate
        extra_props['length'] = t.info.length
        try:
            if 'TDRC' in t: extra_props['year'] = str(t['TDRC'].text[0])
            if 'TDRL' in t: extra_props['year'] = str(t['TDRL'].text[0])
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
            'image_size': self.image_size,
            'genres': self.genres,
            'label': self.label,
            'catno': self.catno
        }

    @property
    def image_data(self):
        return mutagen.mp3.MP3(os.path.abspath(self.fn))['APIC:'].data

    @property
    def image_data_small(self):
        data = StringIO.StringIO(self.image_data)
        result = StringIO.StringIO()
        image = PIL.Image.open(data)
        thumb = image.resize((75, 75), PIL.Image.ANTIALIAS)
        thumb.save(result, 'jpeg')
        result.seek(0)
        return result.buf


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

    def get_by_splitted_artist(self, artist):
        result = (track for track in self.items if artist in track.artists)
        return TrackList(sorted(result, key=lambda t: (t.artist, t.album, t.track)))

    def get_by_splitted_artist_url(self, artist_url):
        result = (track for track in self.items if artist_url in track.artists_url)
        return TrackList(sorted(result, key=lambda t: (t.artist, t.album, t.track)))

    def get_by_album(self, album):
        result = (track for track in self.items if track.album == album)
        return TrackList(sorted(result, key=lambda t: (t.artist, t.album, t.track)))

    def get_by_album_url(self, album_url):
        result = (track for track in self.items if track.album_url == album_url)
        return TrackList(sorted(result, key=lambda t: (t.artist, t.album, t.track)))

    def get_by_genre(self, genre):
        result = (track for track in self.items if genre in track.genres)
        return TrackList(sorted(result, key=lambda t: (t.artist, t.album, t.track)))

    def get_by_genre_url(self, genre_url):
        result = (track for track in self.items if genre_url in track.genres_url)
        return TrackList(sorted(result, key=lambda t: (t.artist, t.album, t.track)))

    def get_by_label(self, label):
        result = (track for track in self.items if track.label == label)
        return TrackList(sorted(result, key=lambda t: (t.catno, t.artist, t.album, t.track)))

    def get_by_label_url(self, label_url):
        result = (track for track in self.items if track.label_url == label_url)
        return TrackList(sorted(result, key=lambda t: (t.catno, t.artist, t.album, t.track)))

    def get_by_catno(self, catno):
        result = (track for track in self.items if track.catno == catno)
        return TrackList(sorted(result, key=lambda t: (t.catno, t.artist, t.album, t.track)))

    def get_by_catno_url(self, catno):
        result = (track for track in self.items if track.catno_url == catno_url)
        return TrackList(sorted(result, key=lambda t: (t.catno, t.artist, t.album, t.track)))

    def get_by_track_num(self, track_num):
        for track in self.items:
            if track.track == track_num:
                return track
        raise KeyError(track_num)


    def get_artists(self):
        return sorted({ (track.artist, track.artist_url) for track in self.items })

    def get_artists_splitted(self):
        return sorted({ (artist, artist_url)
                        for track in self.items
                        for (artist, artist_url) in zip(track.artists, track.artists_url) })

    def get_albums(self):
        return sorted({ (track.album, track.album_url) for track in self.items })

    def get_artist_albums(self):
        return sorted({ (track.artist, track.artist_url, track.album, track.album_url)
                        for track in self.items })

    def get_tracks(self):
        return sorted({ (track.title, track.title_url) for track in self.items })

    def get_genres(self):
        return sorted({ (genre, genre_url) 
                        for track in self.items
                        for (genre, genre_url) in zip(track.genres, track.genres_url) })

    def get_labels(self):
        return sorted({ (track.label, track.label_url) 
                        for track in self.items 
                        if track.label })

    def get_years(self):
        return sorted({ track.year for track in self.items if track.year is not None })

    def get_collections(self):
        return sorted({ (track.library, track.library_url) for track in self.items })

    def get_mtime(self):
        return max(track.mtime for track in self.items)


    def get_first_with_cover(self):
        result = (track for track in self.items if track.image_type)
        try:
            return next(result)
        except StopIteration:
            return None

    def apply_filter(self, properties):
        items = self.items
        for (key, value) in properties:
            if key in ('artists', 'artists_url', 'genres', 'genres_url'):
                items = [ track for track in items if value in getattr(track, key) ]
            else:
                items = [ track for track in items if getattr(track, key) == value ]
        return TrackList(items)

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
        if any(item.path == path for item in self.items):
            raise Exception('{0!r} already in library'.format(path))
        collection = Collection.scan(path)
        self.items.append(collection)
        self.sort()
        return collection

    def update(self):
        for collection in self.items:
            collection.update()

    def sort(self):
        self.items.sort(key=lambda library: library.name)

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

    def all(self):
        return TrackList(track for collection in self.items
                               for track in collection.items)


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

    def add_local_user(self, name):
        user = LocalUser(name, Library())
        self.items.append(user)
        return user

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

        result = self.get_by_name_url(args.pop(0))  # -> User
        if not args:
            return result

        result = result.library.get_by_name_url(args.pop(0))  # -> Collection
        if not args:
            return result

        artist_url = args.pop(0)
        result = result.get_by_artist_url(artist_url)  # -> TrackList (artist_url)
        if not result.items:
            raise KeyError(artist_url)
        if not args:
            return result

        album_url = args.pop(0)
        result = result.get_by_album_url(album_url)  # -> TrackList (album_url)
        if not result.items:
            raise KeyError(album_url)
        if not args:
            return result

        result = result.get_by_track_num(args.pop(0))  # -> Track
        if not args:
            return result

        title_url = args.pop(0)
        if result.title_url != title_url:
            raise KeyError(title_url)
        if not args:
            return result

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

if __name__ == '__main__' and 1:
    from pprint import pprint

    QUIET = False

    users = Users('run')

    if not any(item.name == 'Joost' for item in users.items):
        users.add_local_user('Joost')

    for name in ['Ambient','Classic','Dub & Reggae','Dubstep','Electronic','Exotic','Hip-Hop','Metal & Punk & Surf','Trip-Hop & Turntables','Weird & Pop']:
        if not any(item.name == name for item in users.get_by_name('Joost').library.items):
            users.get_by_name('Joost').library.add('/home/joost/shared/Music/{0}'.format(name))

    users.get_by_name('Joost').library.update()
    users.save()

    tracks = TrackList(track for collection in users.get_by_name('Joost').library.items
                             for track in collection.items)

    mp3 = mutagen.mp3.MP3('/home/joost/shared/Music/Ambient/Biosphere - Autour De La Lune/Biosphere - Autour De La Lune - 01 - Translation.mp3')


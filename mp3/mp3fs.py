import errno
import logging
import os
import stat
import time

import fuse

class TrackListView(object):
    def __init__(self, tracks):
        print '## {0}.__init__ {1}'.format(type(self).__name__, len(tracks.items))
        self.tracks = tracks
        
class Directory(TrackListView):
    def getattr(self):
        print '## {0}.getattr'.format(type(self).__name__,)
        return { 'st_mode': stat.S_IFDIR | 0755 }

    def readdir(self):
        yield '.'
        yield '..'

class ArtistAlbumDir(Directory):
    'dir with filter subdirs and {artist}--{album} subdirs'
    def readdir(self):
        yield '.'
        yield '..'
        yield '.artist'
        yield '.album'
        yield '.genre'
        yield '.year'
        yield '.label'
        yield '.collection'
        for (artist_url, album_url) in sorted({ (artist_url, album_url) for (_, artist_url, _, album_url) in self.tracks.get_artist_albums() }):
            yield '{0}--{1}'.format(artist_url, album_url)

class CatNoArtistAlbumDir(Directory):
    'dir with filter subdirs and {catno}--{artist}--{album} subdirs'
    def readdir(self):
        yield '.'
        yield '..'
        yield '.artist'
        yield '.album'
        yield '.genre'
        yield '.year'
        yield '.label'
        yield '.collection'
        for (catno_url, artist_url, album_url) in sorted({ (track.catno_url, track.artist_url, track.album_url)
                                                           for track in self.tracks.items }):
            yield '{0}--{1}--{2}'.format(catno_url, artist_url, album_url)

class TracksDir(Directory):
    'dir with {track}-{title}.mp3 files'
    def readdir(self):
        yield '.'
        yield '..'
        for track in self.tracks.items:
            yield '{0}-{1}.mp3'.format(track.track, track.title_url)

class ArtistDir(Directory):
    'dir with {artist} subdirs'
    def readdir(self):
        yield '.'
        yield '..'
        for artist_url in sorted({ artist_url for (_, artist_url) in self.tracks.get_artists_splitted() }):
            yield artist_url

class AlbumDir(Directory):
    'dir with {album} subdirs'
    def readdir(self):
        yield '.'
        yield '..'
        for album_url in sorted({ album_url for (_, album_url) in self.tracks.get_albums() }):
            yield album_url

class GenreDir(Directory):
    'dir with {genre} subdirs'
    def readdir(self):
        yield '.'
        yield '..'
        for genre_url in sorted({ genre_url for (_, genre_url) in self.tracks.get_genres() }):
            yield genre_url

class YearDir(Directory):
    'dir with {year} subdirs'
    def readdir(self):
        yield '.'
        yield '..'
        for year in self.tracks.get_years():
            yield str(year)

class LabelDir(Directory):
    'dir with {label} subdirs'
    def readdir(self):
        yield '.'
        yield '..'
        for label_url in sorted({ label_url for (_, label_url) in self.tracks.get_labels() }):
            yield label_url

class CollectionDir(Directory):
    'dir with {collection} subdirs'
    def readdir(self):
        yield '.'
        yield '..'
        for coll_url in sorted({ coll_url for (_, coll_url) in self.tracks.get_collections() }):
            yield coll_url

class Mp3FS(fuse.LoggingMixIn, fuse.Operations):
    def __init__(self, tracks):
        super(Mp3FS, self).__init__()
        self.tracks = tracks
        self.fd = 0

    def _parse_path(self, tracks, parts, default=ArtistAlbumDir):
        print '## _parse_path', parts, default.__name__
        if not parts:
            return default(tracks)

        if len(parts) == 1:
            first = parts[0]

            if first == '.artist': 
                return ArtistDir(tracks)

            if first == '.album': 
                return AlbumDir(tracks)

            if first == '.genre':
                return GenreDir(tracks)

            if first == '.year': 
                return YearDir(tracks)

            if first == '.label': 
                return LabelDir(tracks)

            if first == '.collection':
                return CollectionDir(tracks)

.           if default == ArtistAlbumDir:
                tracks = self.tracks.apply_filter(zip(['artist_url', 'album_url'], first.split('--')))
                return TracksDir(tracks)

.           if default == CatNoArtistAlbumDir:
                tracks = self.tracks.apply_filter(zip(['catno_url', 'artist_url', 'album_url'], first.split('--')))
                return TracksDir(tracks)

        elif len(parts) >= 2:
            first  = parts[0]
            second = parts[1]

            if first == '.artist': 
                return self._parse_path(tracks.get_by_splitted_artist_url(second), parts[2:], default)

            if first == '.album': 
                return self._parse_path(tracks.get_by_album_url(second), parts[2:], default)

            if first == '.genre': 
                return self._parse_path(tracks.get_by_genre_url(second), parts[2:], default)

            if first == '.year': 
                return self._parse_path(tracks.get_by_year(second), parts[2:], default)

            if first == '.label': 
                return self._parse_path(tracks.get_by_label_url(second), parts[2:], default=CatNoArtistAlbumDir)

            if first == '.collection': 
                return self._parse_path(tracks.get_by_collection_url(second), parts[2:], default)

        print '## _parse_path not found:', parts, default.__name__

        raise fuse.FuseOSError(errno.ENOENT)

    def getattr(self, path, fh=None):
        parts = [ part for part in path[1:].split('/') if part ]
        view = self._parse_path(self.tracks, parts)
        return view.getattr()

    def readdir(self, path, fh):
        parts = [ part for part in path[1:].split('/') if part ]
        view = self._parse_path(self.tracks, parts)
        return view.readdir()

if __name__ == '__main__':
    handler = logging.StreamHandler()
    handler.setLevel(logging.DEBUG)

    logger = logging.getLogger('fuse.log-mixin')
    logger.setLevel(logging.DEBUG)
    logger.addHandler(handler)

    print 'loading database'
    import mp3.db
    mp3.db.QUIET = False
    tracks = mp3.db.Users('run').get_by_name_url('joost').library.all()
    fs = fuse.FUSE(Mp3FS(tracks), 'fs', foreground=True)


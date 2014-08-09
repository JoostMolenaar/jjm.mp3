import errno
import logging
import os
import stat
import time

import fuse

class TrackListView(object):
    def __init__(self, tracks):
        self.tracks = tracks
        
class ArtistAlbumDir(TrackListView):
    'dir with filter subdirs and {artist}--{album} subdirs'

    def getattr(self, filename):
        return { 'st_mode': stat.S_IFDIR | 0755 }

    def readdir(self):
        yield '.'
        yield '..'
        yield '.artist'
        yield '.album'
        yield '.genre'
        yield '.year'
        yield '.label'
        yield '.collection'
        names = sorted({ (artist_url, album_url) 
                         for (_, artist_url, _, album_url) in self.tracks.get_artist_albums() })
        for (artist_url, album_url) in names:
            yield '{0}--{1}'.format(artist_url, album_url)

class CatNoArtistAlbumDir(TrackListView):
    'dir with filter subdirs and {catno}--{artist}--{album} subdirs'

    def getattr(self, filename):
        return { 'st_mode': stat.S_IFDIR | 0755 }

    def readdir(self):
        yield '.'
        yield '..'
        yield '.artist'
        yield '.album'
        yield '.genre'
        yield '.year'
        yield '.label'
        yield '.collection'
        names = sorted({ (track.catno_url, track.artist_url, track.album_url)
                         for track in self.tracks.items })
        for (catno_url, artist_url, album_url) in names:
            yield '{0}--{1}--{2}'.format(catno_url, artist_url, album_url)

class TracksDir(TrackListView):
    'dir with {track}-{title}.mp3 files'

    def getattr(self, filename):
        return { 'st_mode': stat.S_IFREG | 0644 }

    def readdir(self):
        yield '.'
        yield '..'
        for track in self.tracks.items:
            yield '{0}-{1}.mp3'.format(track.track, track.title_url)

class Mp3File(object):
    'mp3 file'

    def __init__(self, track):
        self.track = track

class ArtistDir(TrackListView):
    'dir with {artist} subdirs'

    def getattr(self, filename):
        return { 'st_mode': stat.S_IFDIR | 0755 }

    def readdir(self):
        yield '.'
        yield '..'
        for artist_url in sorted({ artist_url for (_, artist_url) in self.tracks.get_artists_splitted() }):
            yield artist_url

class AlbumDir(TrackListView):
    'dir with {album} subdirs'

    def getattr(self, filename):
        return { 'st_mode': stat.S_IFDIR | 0755 }

    def readdir(self):
        yield '.'
        yield '..'
        for album_url in sorted({ album_url for (_, album_url) in self.tracks.get_albums() }):
            yield album_url

class GenreDir(TrackListView):
    'dir with {genre} subdirs'

    def getattr(self, filename):
        return { 'st_mode': stat.S_IFDIR | 0755 }

    def readdir(self):
        yield '.'
        yield '..'
        for genre_url in sorted({ genre_url for (_, genre_url) in self.tracks.get_genres() }):
            yield genre_url

class YearDir(TrackListView):
    'dir with {year} subdirs'

    def getattr(self, filename):
        return { 'st_mode': stat.S_IFDIR | 0755 }

    def readdir(self):
        yield '.'
        yield '..'
        for year in self.tracks.get_years():
            yield str(year)

class LabelDir(TrackListView):
    'dir with {label} subdirs'

    def getattr(self, filename):
        return { 'st_mode': stat.S_IFDIR | 0755 }

    def readdir(self):
        yield '.'
        yield '..'
        for label_url in sorted({ label_url for (_, label_url) in self.tracks.get_labels() }):
            yield label_url

class CollectionDir(TrackListView):
    'dir with {collection} subdirs'

    def getattr(self, filename):
        return { 'st_mode': stat.S_IFDIR | 0755 }

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

    def _parse_path(self, tracks, parts, default):
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

            if default == ArtistAlbumDir:
                filters = zip(['artist_url', 'album_url'], first.split('--'))
                tracks = self.tracks.apply_filter(filters)
                return TracksDir(tracks)

            if default == CatNoArtistAlbumDir:
                filters = zip(['catno_url', 'artist_url', 'album_url'], first.split('--'))
                tracks = self.tracks.apply_filter(filters)
                return TracksDir(tracks)

        elif len(parts) >= 2:
            first  = parts[0]
            second = parts[1]

            if first == '.artist': 
                return self._parse_path(tracks.get_by_splitted_artist_url(second), parts[2:], ArtistAlbumDir)

            if first == '.album': 
                return self._parse_path(tracks.get_by_album_url(second), parts[2:], TracksDir)

            if first == '.genre': 
                return self._parse_path(tracks.get_by_genre_url(second), parts[2:], ArtistAlbumDir)

            if first == '.year': 
                return self._parse_path(tracks.get_by_year(int(second)), parts[2:], ArtistAlbumDir)

            if first == '.label': 
                return self._parse_path(tracks.get_by_label_url(second), parts[2:], CatNoArtistAlbumDir)

            if first == '.collection': 
                return self._parse_path(tracks.get_by_collection_url(second), parts[2:], ArtistAlbumDir)

            if default == ArtistAlbumDir:
                filters = zip(['artist_url', 'album_url'], first.split('--'))
                track = self.tracks.apply_filter(filters).items[0]
                return Mp3File(track)

            if default == CatNoArtistAlbumDir:
                filters = zip(['catno_url', 'artist_url', 'album_url'], first.split('--'))
                track = self.tracks.apply_filter(filters).items[0]
                return Mp3File(track)

        print '## _parse_path not found:', parts, default.__name__

        raise fuse.FuseOSError(errno.ENOENT)

    def getattr(self, path, fh=None):
        parts = [ part for part in path[1:].split('/') if part ]
        view = self._parse_path(self.tracks, parts[:-1], ArtistAlbumDir)
        return view.getattr(parts[-1] if parts else '/')

    def readdir(self, path, fh):
        parts = [ part for part in path[1:].split('/') if part ]
        view = self._parse_path(self.tracks, parts, ArtistAlbumDir)
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


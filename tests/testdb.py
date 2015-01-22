import unittest
import os.path

import mp3.db

mp3.db.QUIET = True

FILENAME = "data/silence.mp3"

EXPECTED_OBJ = lambda: {
    "fn":           "data/silence.mp3",
    "artist":       u"Silent Artist",
    "album":        u"Silent Album",
    "track":        "42",
    "title":        u"The Sound Of Silence",
    "bitrate":      320000,
    "length":       2.112,
    "year":         2012,
    "image_type":   u"image/jpeg",
    "image_size":   21992,
    "image_hash":   "dedad50a19cd1f56bac1d6a31d0500f4fb4738db",
    "mtime":        int(os.path.getmtime(FILENAME)),
    "catno":        None,
    "label":        None,
    "genres":       []
}

class TestTrack(unittest.TestCase):
    def assert_properties(self, track):
        self.assertIsNotNone(track)

        self.assertEqual(track.fn, "data/silence.mp3")

        self.assertEqual(track.artist, "Silent Artist")
        self.assertEqual(track.album, "Silent Album")
        self.assertEqual(track.track, "42")
        self.assertEqual(track.title, "The Sound Of Silence")

        self.assertEqual(track.artist_url, "silent-artist")
        self.assertEqual(track.album_url, "silent-album") 
        self.assertEqual(track.title_url, "the-sound-of-silence")

        self.assertEqual(track.bitrate, 320000)
        self.assertEqual(track.length, 2.112)

        self.assertEqual(track.year, 2012)

        self.assertEqual(track.image_type, 'image/jpeg')
        self.assertEqual(track.image_hash, 'dedad50a19cd1f56bac1d6a31d0500f4fb4738db')
        self.assertEqual(track.image_size, 21992)

        self.assertEqual(track.collection, 'Foo')
        self.assertEqual(track.collection_url, 'foo')
   
    def test_from_file(self):
        track = mp3.db.Track.from_file(FILENAME, collection="Foo", collection_url='foo')

        self.assert_properties(track)

    def test_from_obj(self):
        track = mp3.db.Track.from_obj(EXPECTED_OBJ(), collection='Foo', collection_url='foo')

        self.assert_properties(track)

    def test_repr(self):
        track = mp3.db.Track.from_file(FILENAME)

        r = repr(track)

        self.assertEqual(r, "silent-artist/silent-album/42-the-sound-of-silence.mp3")

    def test_obj(self):
        track = mp3.db.Track.from_file(FILENAME)

        obj = track.obj()

        self.assertEqual(obj, EXPECTED_OBJ())

class TestCollection(unittest.TestCase):
    def setUp(self):
        self.maxDiff = None

    def test_scan(self):
        collection = mp3.db.Collection.scan("data")

        self.assertIsNotNone(collection)

        self.assertEqual(collection.name, "data")
        self.assertEqual(collection.name_url, "data")

        self.assertGreater(len(collection.items), 0)

    def test_get_item(self):
        collection = mp3.db.Collection.scan("data")

        self.assertGreater(len(collection.items), 0)
        self.assertEqual(collection[0].fn, "data/silence.mp3")

    def test_repr(self):
        collection = mp3.db.Collection.scan("data")

        u = repr(collection)

        self.assertEqual(u, "<Collection \"data\" (1)>")

    def test_obj(self):
        collection = mp3.db.Collection.scan("data")

        obj = collection.obj()

        self.assertIsNotNone(obj)

        self.assertEqual(obj, {
            'name': "data",
            'path': "data",
            'tracks': [EXPECTED_OBJ()]
        })

    def test_from_obj(self):
        collection = mp3.db.Collection.from_obj({
            "path": "data",
            "tracks": [EXPECTED_OBJ()]
        })
        self.assertEqual(repr(collection), "<Collection \"data\" (1)>")

    def test_gets(self):
        collection = mp3.db.Collection.from_obj({
            "path": "data",
            "tracks": [EXPECTED_OBJ()]
        })

        silent_artist = collection.get_by_artist("Silent Artist")
        self.assertEqual(repr(silent_artist), "<TrackList [silent-artist/silent-album/42-the-sound-of-silence.mp3]>")

        silent_artist = collection.get_by_artist_url("silent-artist")
        self.assertEqual(repr(silent_artist), "<TrackList [silent-artist/silent-album/42-the-sound-of-silence.mp3]>")

        silent_album = collection.get_by_album("Silent Album")
        self.assertEqual(repr(silent_artist), "<TrackList [silent-artist/silent-album/42-the-sound-of-silence.mp3]>")

        silent_album = collection.get_by_album_url("silent-album")
        self.assertEqual(repr(silent_artist), "<TrackList [silent-artist/silent-album/42-the-sound-of-silence.mp3]>")

class TestLibrary(unittest.TestCase):
    def setUp(self):
        self.maxDiff = None

    def test_obj(self):
        library = mp3.db.Library()
        library.add("data")

        obj = library.obj()
        
        self.assertEqual(obj, [
            { "name": "data",
              "path": "data",
              "tracks": [EXPECTED_OBJ()] }
        ])

    def test_from_obj(self):
        library = mp3.db.Library.from_obj([
            { "name": "data",
              "path": "data",
              "tracks": [EXPECTED_OBJ()] }
        ])
        self.assertEqual(repr(library), "<Library: [<Collection \"data\" (1)>]>")

    def test_get_by_name(self):
        library = mp3.db.Library.from_obj([
            { "name": "data",
              "path": "data",
              "tracks": [EXPECTED_OBJ()] }
        ])

        data = library.get_by_name("data")
        self.assertEquals(repr(data), "<Collection \"data\" (1)>")

        data = library.get_by_name_url("data")
        self.assertEquals(repr(data), "<Collection \"data\" (1)>")

        with self.assertRaises(KeyError):
            library.get_by_name("Foo")

        with self.assertRaises(KeyError):
            library.get_by_name_url("foo")

    def test_save_load(self):
        library = mp3.db.Library()
        library.add("data")
        library.save("library.json")


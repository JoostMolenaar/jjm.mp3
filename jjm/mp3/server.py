import json
import os, os.path
import re
import StringIO
import zipfile

from jjm import xhttp 
from jjm import sh

from . import db

XHTML = "http://www.w3.org/1999/xhtml"

class Users(xhttp.Resource):
    def __init__(self, users):
        self.users = users 

    @xhttp.accept_charset
    @xhttp.accept
    def GET(self, req):
        users = [
            { "href": "/mp3/u/{0}/".format(user.name_url), "text": user.name }
            for user in self.users.items
        ]
        return {
            "x-status": xhttp.status.OK,
            "x-content": users,
            "x-content-view": {
                "application/json": lambda obj: obj,
                "application/xhtml+xml": lambda obj: (["ul", ("xmlns", "http://www.w3.org/1999/xhtml")] 
                    + [ ["li", ["a", ("href", a["href"]), a["text"]]] for a in obj ]),
                "text/plain": lambda obj: repr(obj) + "\n"
            }
        }

class Library(xhttp.Resource):
    def __init__(self, users):
        self.users = users

    @xhttp.accept_charset
    @xhttp.accept
    def GET(self, req, username):
        try:
            user = self.users.resolve(username)
        except KeyError as e:
            raise xhttp.HTTPException(xhttp.status.NOT_FOUND, { "x-detail": e.message })

        collections = [ { "href": "/mp3/u/{0}/{1}".format(username, collection.name_url), 
                          "text": collection.name }
                        for collection in user.library.items ]

        return {
            "x-status": xhttp.status.OK,
            "x-content": collections,
            "x-content-view": {
                "application/json": lambda obj: obj,
                "application/xhtml+xml": lambda obj: (
                    ["ul", ("xmlns", XHTML)] + [ ["li", ["a", ("href", a["href"]), a["text"]]] for a in obj ]
                ),
                "text/plain": lambda obj: repr(obj) + "\n"
            }
        }

    @xhttp.post({ "path": "^(.+)$" })
    def POST(self, req, username):
        user = self.users.get_by_name_url(username)
        collection = user.library.add(req["x-post"]["path"])
        self.users.save()
        location = "/mp3/u/{0}/{1}/".format(username, collection.name_url)
        raise xhttp.HTTPException(xhttp.status.SEE_OTHER, { "location": location })

class Collection(xhttp.Resource):
    def __init__(self, users):
        self.users = users

    @xhttp.accept_charset
    @xhttp.accept
    def GET(self, req, username, collection_name):
        try:
            collection = self.users.resolve(username, collection_name)
        except KeyError as e:
            raise xhttp.HTTPException(xhttp.status.NOT_FOUND, { "x-detail": e.message })

        artists = [ { "href": "/mp3/u/{0}/{1}/{2}/".format(username, collection_name, href), "text": text }
                    for (text, href) in collection.get_artists() ]

        return { 
            "x-status": xhttp.status.OK,
            "x-content": artists,
            "x-content-view": {
                "application/json": lambda obj: obj,
                "application/xhtml+xml": lambda obj: (
                    ["ul", ("xmlns", XHTML)] + [ ["li", ["a", ("href", a["href"]), a["text"]]] for a in obj ]
                ),
                "text/plain": lambda obj: repr(obj) + "\n"
            }
        }

class Artist(xhttp.Resource):
    def __init__(self, users):
        self.users = users
   
    @xhttp.accept_charset
    @xhttp.accept 
    def GET(self, req, username, collection_name, artist_name):
        try:
            albums = self.users.resolve(username, collection_name, artist_name)
        except KeyError as e:
            raise xhttp.HTTPException(xhttp.status.NOT_FOUND, { "x-detail": e.message })

        document = [ { "href": "/mp3/u/{0}/{1}/{2}/{3}/".format(username, collection_name, artist_name, href), 
                       "text": text }
                     for (text, href) in albums.get_albums() ]

        return {
            "x-status": xhttp.status.OK,
            "x-content": document,
            "x-content-view": {
                "application/json": lambda obj: obj,
                "application/xhtml+xml": lambda obj: (
                    ["ul", ("xmlns", XHTML)] + [ ["li", ["a", ("href", a["href"]), a["text"]]] for a in obj ]),
                "text/plain": lambda obj: repr(obj) + "\n"
            },
            "x-handler": type(self).__name__
        }

class Album(xhttp.Resource):
    def __init__(self, users):
        self.users = users
   
    @xhttp.accept_charset
    @xhttp.accept 
    def GET(self, req, username, collection_name, artist_name, album_name):
        try:
            tracks = self.users.resolve(username, collection_name, artist_name, album_name)
        except KeyError as e:
            raise xhttp.HTTPException(xhttp.status.NOT_FOUND, { "x-detail": e.message })

        document = {
            "download_url": "/mp3/u/{0}/{1}/{2}/{3}.zip".format(username, collection_name, artist_name, album_name),
            "items": [ { "href": "/mp3/u/{0}/{1}/{2}/{3}/{4}-{5}/".format(username, collection_name, artist_name, album_name, track.track, track.title_url), 
                         "text": track.title }
                       for track in tracks.items ]
        }

        return {
            "x-status": xhttp.status.OK,
            "x-content": document,
            "x-content-view": {
                "application/json": lambda obj: obj,
                "application/xhtml+xml": lambda obj: (
                    ["div", ("xmlns", XHTML),
                        ["ol"] + [ ["li", ["a", ("href", a["href"]), a["text"]]] for a in obj["items"] ],
                        ["a", ("href", obj["download_url"]), "Download"]]
                ),
                "text/plain": lambda obj: repr(obj) + "\n"
            }
        }

class AlbumZipFile(xhttp.Resource):
    def __init__(self, users):
        self.users = users

class TrackInfo(xhttp.Resource):
    def __init__(self, users):
        self.users = users

    @xhttp.accept_charset
    @xhttp.accept
    def GET(self, req, username, collection_name, artist_name, album_name, track_num, track_name):
        try:
            track = self.users.resolve(username, collection_name, artist_name, album_name, track_num, track_name)
        except KeyError as e:
            raise xhttp.HTTPException(xhttp.status.NOT_FOUND, { "x-detail": e.message })

        document = {
            "artist": track.artist,
            "album": track.album,
            "track": track.track,
            "title": track.title,
            "year": track.year,
            "mp3_url": "/mp3/u/{0}/{1}/{2}/{3}/{4}-{5}.mp3".format(username, collection_name, artist_name, album_name,
                                                                   track_num, track_name),
            "cover_url": "/mp3/u/{0}/{1}/{2}/{3}/{4}-{5}.jpg".format(username, collection_name, artist_name, album_name,
                                                                     track_num, track_name)
                         if track.image_type else None
        }

        return {
            "x-status": xhttp.status.OK,
            "x-content": document,
            "x-content-view": {
                "application/json": lambda obj: obj,
                "application/xhtml+xml": lambda obj: (
                    ["dl", ("xmlns", XHTML),
                        ["dt", "Artist"], ["dd", obj["artist"]],
                        ["dt", "Album"], ["dd", obj["album"]],
                        ["dt", "Track"], ["dd", obj["track"]],
                        ["dt", "Title"], ["dd", obj["title"]],
                        ["dt", "Address"], ["dd", ["a", ("href", obj["mp3_url"]), obj["mp3_url"]]],
                        ["dt", "Cover"], ["dd", ["img", ("src", obj["cover_url"])] if obj["cover_url"] else "-"]]
                ),
                "text/plain": lambda obj: repr(obj) + "\n"
            }
        }

class MP3File(xhttp.Resource):
    def __init__(self, users):
        self.users = users

    def GET(self, req, username, collection_name, artist_name, album_name, track_num, track_name):
        try:
            track = self.users.resolve(username, collection_name, artist_name, album_name, track_num, track_name)
        except KeyError as e:
            raise xhttp.HTTPException(xhttp.status.NOT_FOUND, { "x-detail": e.message })

        return {
            "x-status": xhttp.status.OK,
            "x-content": open(track.fn, "rb").read(),
            "content-type": "audio/mpeg"
        }

class MP3Cover(xhttp.Resource):
    def __init__(self, users):
        self.users = users

    def GET(self, req, username, collection_name, artist_name, album_name, track_num, track_name):
        try:
            track = self.users.resolve(username, collection_name, artist_name, album_name, track_num, track_name)
        except KeyError as e:
            raise xhttp.HTTPException(xhttp.status.NOT_FOUND, { "x-detail": e.message })

        if not track.image_type:
            raise xhttp.HTTPException(xhttp.status.NOT_FOUND)

        return {
            "x-status": xhttp.status.OK,
            "x-content": track.image_data,
            "content-type": track.image_type
        }
   
class MP3Server(xhttp.Router):
    def __init__(self):
        self.users = db.Users("run")
        super(MP3Server, self).__init__(
            ("^/mp3/u/(.+?)/(.+?)/(.+?)/(.+?)/(\d+)-(.+?).jpg$",    MP3Cover(self.users)),
            ("^/mp3/u/(.+?)/(.+?)/(.+?)/(.+?)/(\d+)-(.+?).mp3$",    MP3File(self.users)),
            ("^/mp3/u/(.+?)/(.+?)/(.+?)/(.+?)/(\d+)-(.+?)/$",       TrackInfo(self.users)),
            ("^/mp3/u/(.+?)/(.+?)/(.+?)/(.+?).zip$",                AlbumZipFile(self.users)),
            ("^/mp3/u/(.+?)/(.+?)/(.+?)/(.+?)/$",                   Album(self.users)),
            ("^/mp3/u/(.+?)/(.+?)/(.+?)/$",                         Artist(self.users)),
            ("^/mp3/u/(.+?)/(.+?)/$",                               Collection(self.users)),
            ("^/mp3/u/(.+?)/$",                                     Library(self.users)),
            ("^/mp3/u/$",                                           Users(self.users)),
        )

class Application(MP3Server):
    @xhttp.xhttp_app
    @xhttp.catcher
    def __call__(self, req, *a, **k):
        return super(Application, self).__call__(req, *a, **k)

app = Application()

if __name__ == "__main__":
    xhttp.run_server(app, ip="", port=8000)


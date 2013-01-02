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
        document = { "href": "/mp3/u/",
                     "name": "Users",
                     "items": [ { "href": "/mp3/u/{0}/".format(user.name_url),
                                  "name": user.name }
                                for user in self.users.items ] }
        return {
            "x-status": xhttp.status.OK,
            "x-content": document,
            "x-content-view": {
                "application/json": lambda obj: obj,
                "application/xhtml+xml": lambda obj: (
                    ["dl", ("xmlns", XHTML),
                        ["dt", "Name"], ["dd", obj["name"]],
                        ["dt", "Address"], ["dd", ["a", ("href", obj["href"]), obj["href"]]],
                        ["dt", "Items"], ["dd",
                            ["ul"] + [ ["li", ["a", ("href", a["href"]), a["name"]]] for a in obj["items"] ]]]),
                "text/plain": lambda obj: repr(obj) + "\n"
            }
        }

class Library(xhttp.Resource):
    def __init__(self, users):
        self.users = users

    @xhttp.vary("Accept", "Accept-Charset", "Accept-Encoding")
    @xhttp.cache_control("max-age=0", "must-revalidate")
    @xhttp.if_modified_since
    @xhttp.accept_encoding
    @xhttp.accept_charset
    @xhttp.accept
    def GET(self, req, username):
        try:
            user = self.users.resolve(username)
        except KeyError as e:
            raise xhttp.HTTPException(xhttp.status.NOT_FOUND, { "x-detail": e.message })

        document = { "href": "/mp3/u/{0}/".format(username),
                     "name": user.name,
                     "items": [ { "href": "/mp3/u/{0}/{1}/".format(username, collection.name_url),
                                  "name": collection.name }
                                for collection in user.library.items ] }
        return {
            "x-status": xhttp.status.OK,
            "x-content": document,
            "x-content-view": {
                "application/json": lambda obj: obj,
                "application/xhtml+xml": lambda obj: (
                    ["dl", ("xmlns", XHTML),
                        ["dt", "Name"], ["dd", obj["name"]],
                        ["dt", "Address"], ["dd", ["a", ("href", obj["href"]), obj["href"]]],
                        ["dt", "Items"], ["dd",
                            ["ul"] + [ ["li", ["a", ("href", a["href"]), a["name"]]] for a in obj["items"] ]]]),
                "text/plain": lambda obj: repr(obj) + "\n"
            },
            "last-modified": xhttp.DateHeader(user.library.get_mtime()),
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

    @xhttp.vary("Accept", "Accept-Charset", "Accept-Encoding")
    @xhttp.cache_control("max-age=0", "must-revalidate")
    @xhttp.if_modified_since
    @xhttp.accept_encoding
    @xhttp.accept_charset
    @xhttp.accept
    def GET(self, req, username, collection_name):
        try:
            collection = self.users.resolve(username, collection_name)
        except KeyError as e:
            raise xhttp.HTTPException(xhttp.status.NOT_FOUND, { "x-detail": e.message })

        document = { "href": "/mp3/u/{0}/{1}/".format(username, collection_name),
                     "name": collection.name,
                     "items": [ { "href": "/mp3/u/{0}/{1}/{2}/".format(username, collection_name, href), 
                                  "name": name}
                                for (name, href) in collection.get_artists() ] }

        return { 
            "x-status": xhttp.status.OK,
            "x-content": document,
            "x-content-view": {
                "application/json": lambda obj: obj,
                "application/xhtml+xml": lambda obj: (
                    ["dl", ("xmlns", XHTML),
                        ["dt", "Name"], ["dd", obj["name"]],
                        ["dt", "Address"], ["dd", ["a", ("href", obj["href"]), obj["href"]]],
                        ["dt", "Items"], ["dd",
                            ["ul"] + [ ["li", ["a", ("href", a["href"]), a["name"]]] for a in obj["items"] ]]]),
                "text/plain": lambda obj: repr(obj) + "\n"
            },
            "last-modified": xhttp.DateHeader(collection.get_mtime())
        }

class Artist(xhttp.Resource):
    def __init__(self, users):
        self.users = users
   
    @xhttp.vary("Accept", "Accept-Charset", "Accept-Encoding")
    @xhttp.cache_control("max-age=0", "must-revalidate")
    @xhttp.if_modified_since
    @xhttp.accept_encoding
    @xhttp.accept_charset
    @xhttp.accept 
    def GET(self, req, username, collection_name, artist_name):
        try:
            albums = self.users.resolve(username, collection_name, artist_name)
        except KeyError as e:
            raise xhttp.HTTPException(xhttp.status.NOT_FOUND, { "x-detail": e.message })

        document = { "href": "/mp3/u/{0}/{1}/{2}/".format(username, collection_name, artist_name),
                     "name": albums[0].artist,
                     "items": [ { "href": "/mp3/u/{0}/{1}/{2}/{3}/".format(username, collection_name, artist_name, href), 
                                  "name": name}
                              for (name, href) in albums.get_albums() ] }

        return {
            "x-status": xhttp.status.OK,
            "x-content": document,
            "x-content-view": {
                "application/json": lambda obj: obj,
                "application/xhtml+xml": lambda obj: (
                    ["dl", ("xmlns", XHTML),
                        ["dt", "Name"], ["dd", obj["name"]],
                        ["dt", "Address"], ["dd", ["a", ("href", obj["href"]), obj["href"]]],
                        ["dt", "Items"], ["dd",
                            ["ul"] + [ ["li", ["a", ("href", a["href"]), a["name"]]] for a in obj["items"] ]]]),
                "text/plain": lambda obj: repr(obj) + "\n"
            },
            "last-modified": xhttp.DateHeader(albums.get_mtime())
        }

class Album(xhttp.Resource):
    def __init__(self, users):
        self.users = users
   
    @xhttp.vary("Accept", "Accept-Charset", "Accept-Encoding")
    @xhttp.cache_control("max-age=0", "must-revalidate")
    @xhttp.if_modified_since
    @xhttp.accept_encoding
    @xhttp.accept_charset
    @xhttp.accept 
    def GET(self, req, username, collection_name, artist_name, album_name):
        try:
            album = self.users.resolve(username, collection_name, artist_name, album_name)
        except KeyError as e:
            raise xhttp.HTTPException(xhttp.status.NOT_FOUND, { "x-detail": e.message })

        cover_track = album.get_first_with_cover()

        document = { "href": "/mp3/u/{0}/{1}/{2}/{3}/".format(username, collection_name, artist_name, album_name), 
                     "name": album[0].album,
                     "download_url": "/mp3/u/{0}/{1}/{2}/{3}.zip".format(username, collection_name, artist_name, album_name),
                     "cover_image_url": "/mp3/u/{0}/{1}/{2}/{3}.jpg".format(username, collection_name, artist_name, album_name) if cover_track else None,
                     "cover_thumb_url": "/mp3/u/{0}/{1}/{2}/{3}.jpg?small=true".format(username, collection_name, artist_name, album_name) if cover_track else None,
                     "items": [ { "href": "/mp3/u/{0}/{1}/{2}/{3}/{4}-{5}/".format(username, collection_name, artist_name, album_name, track.track, track.title_url), 
                                  "name": track.title }
                                for track in album.items ] }

        return {
            "x-status": xhttp.status.OK,
            "x-content": document,
            "x-content-view": {
                "application/json": lambda obj: obj,
                "application/xhtml+xml": lambda obj: (
                    ["dl", ("xmlns", XHTML),
                        ["dt", "Name"], ["dd", obj["name"]],
                        ["dt", "Address"], ["dd", ["a", ("href", obj["href"]), obj["href"]]],
                        ["dt", "Items"], ["dd",
                            ["ol"] + [ ["li", ["a", ("href", a["href"]), a["name"]]] for a in obj["items"] ]],
                        ["dt", "Download"], ["dd", ["a", ("href", obj["download_url"]), obj["download_url"]]],
                        ["dt", "Cover thumbnail"], ["dd", ["img", ("src", obj["cover_thumb_url"])] if obj["cover_thumb_url"] else "-"],
                        ["dt", "Cover image"], ["dd", ["img", ("src", obj["cover_image_url"])] if obj["cover_image_url"] else "-"]
                    ]),
                "text/plain": lambda obj: repr(obj) + "\n"
            },
            "last-modified": xhttp.DateHeader(album.get_mtime())
        }

class AlbumZipFile(xhttp.Resource):
    def __init__(self, users):
        self.users = users

class AlbumCover(xhttp.Resource):
    def __init__(self, users):
        self.users = users

    @xhttp.cache_control("max-age=0", "must-revalidate")
    @xhttp.if_modified_since
    @xhttp.get({ "small?" : "^false|true$" })
    def GET(self, req, username, collection_name, artist_name, album_name):
        try:
            album = self.users.resolve(username, collection_name, artist_name, album_name)
        except KeyError as e:
            raise xhttp.HTTPException(xhttp.status.NOT_FOUND, { "x-detail": e.message })

        track = album.get_first_with_cover()
        if not track:
            raise xhttp.HTTPException(xhttp.status.NOT_FOUND)

        small = req["x-get"]["small"] == "true"

        return {
            "x-status": xhttp.status.OK,
            "x-content": track.image_data_small if small else track.image_data,
            "content-type": track.image_type,
            "last-modified": xhttp.DateHeader(track.mtime)
        }

class TrackInfo(xhttp.Resource):
    def __init__(self, users):
        self.users = users

    @xhttp.vary("Accept", "Accept-Charset", "Accept-Encoding")
    @xhttp.cache_control("max-age=0", "must-revalidate")
    @xhttp.if_modified_since
    @xhttp.accept_encoding
    @xhttp.accept_charset
    @xhttp.accept
    def GET(self, req, username, collection_name, artist_name, album_name, track_num, track_name):
        try:
            track = self.users.resolve(username, collection_name, artist_name, album_name, track_num, track_name)
        except KeyError as e:
            raise xhttp.HTTPException(xhttp.status.NOT_FOUND, { "x-detail": e.message })

        document = {
            "href": "/mp3/{0}/{1}/{2}/{3}/{4}-{5}/".format(username, collection_name, artist_name, album_name, track_num, track_name),
            "name": track.title,
            "artist": track.artist,
            "album": track.album,
            "track": track.track,
            "title": track.title,
            "year": track.year,
            "bitrate": track.bitrate,
            "length": track.length,
            "mp3_url": "/mp3/u/{0}/{1}/{2}/{3}/{4}-{5}.mp3".format(username, collection_name, artist_name, album_name, track_num, track_name),
            "cover_url": "/mp3/u/{0}/{1}/{2}/{3}/{4}-{5}.jpg".format(username, collection_name, artist_name, album_name, track_num, track_name)
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
                        ["dt", "Length"], ["dd", str(obj["length"])],
                        ["dt", "Bitrate"], ["dd", obj["bitrate"]],
                        ["dt", "MP3 file"], ["dd", ["a", ("href", obj["mp3_url"]), obj["mp3_url"]]],
                        ["dt", "Cover"], ["dd", ["img", ("src", obj["cover_url"])] if obj["cover_url"] else "-"]]
                ),
                "text/plain": lambda obj: repr(obj) + "\n"
            },
            "last-modified": xhttp.DateHeader(track.mtime)
        }

class MP3File(xhttp.Resource):
    def __init__(self, users):
        self.users = users

    @xhttp.vary("Range", "If-Modified-Since")
    @xhttp.cache_control("max-age=0", "must-revalidate")
    @xhttp.if_modified_since
    @xhttp.ranged
    def GET(self, req, username, collection_name, artist_name, album_name, track_num, track_name):
        try:
            track = self.users.resolve(username, collection_name, artist_name, album_name, track_num, track_name)
        except KeyError as e:
            raise xhttp.HTTPException(xhttp.status.NOT_FOUND, { "x-detail": e.message })

        return {
            "x-status": xhttp.status.OK,
            "x-content": open(track.fn, "rb").read(),
            "content-type": "audio/mpeg",
            "last-modified": xhttp.DateHeader(track.mtime)
        }

class MP3Cover(xhttp.Resource):
    def __init__(self, users):
        self.users = users

    @xhttp.vary("If-Modified-Since")
    @xhttp.cache_control("max-age=0", "must-revalidate")
    @xhttp.if_modified_since
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
            "content-type": track.image_type,
            "last-modified": xhttp.DateHeader(track.mtime)
        }
   
class MP3Server(xhttp.Router):
    def __init__(self):
        self.users = db.Users("run")
        super(MP3Server, self).__init__(
            ("^/mp3/u/(.+?)/(.+?)/(.+?)/(.+?)/(\d+)-(.+?).jpg$",    MP3Cover(self.users)),
            ("^/mp3/u/(.+?)/(.+?)/(.+?)/(.+?)/(\d+)-(.+?).mp3$",    MP3File(self.users)),
            ("^/mp3/u/(.+?)/(.+?)/(.+?)/(.+?)/(\d+)-(.+?)/$",       TrackInfo(self.users)),
            ("^/mp3/u/(.+?)/(.+?)/(.+?)/(.+?).zip$",                AlbumZipFile(self.users)),
            ("^/mp3/u/(.+?)/(.+?)/(.+?)/(.+?).jpg$",                AlbumCover(self.users)),
            ("^/mp3/u/(.+?)/(.+?)/(.+?)/(.+?)/$",                   Album(self.users)),
            ("^/mp3/u/(.+?)/(.+?)/(.+?)/$",                         Artist(self.users)),
            ("^/mp3/u/(.+?)/(.+?)/$",                               Collection(self.users)),
            ("^/mp3/u/(.+?)/$",                                     Library(self.users)),
            ("^/mp3/u/$",                                           Users(self.users)),
            ("^/mp3/(.*\.css)$",                                    xhttp.FileServer("static", "text/css")),
            ("^/mp3/(.*\.js)$",                                     xhttp.FileServer("static", "application/javascript")),
            ("^/mp3/(.*\.html)$",                                   xhttp.FileServer("static", "application/xhtml+xml")),
            ("^/mp3/$",                                             xhttp.Redirector("/mp3/mp3.html"))
        )

    @xhttp.catcher
    def __call__(self, req, *a, **k):
        return super(MP3Server, self).__call__(req, *a, **k)

class Application(MP3Server):
    def __init__(self, debug=False):
        self.debug = debug
        super(Application, self).__init__()

    @xhttp.xhttp_app
    def __call__(self, req, *a, **k):
        if self.debug:
            print
            for key in sorted(req.keys()):
                print "> {0:20} : {1!r}".format(key, req[key])
            print
        try:
            res = super(Application, self).__call__(req, *a, **k)
        except xhttp.HTTPException as e:
            if self.debug:
                res = e.response()
                for key in sorted(res.keys()):
                    if key == "x-content":
                        print "<!{0:20} : {1!r} ({2})".format(key, type(res[key]), len(res[key]))
                    else:
                        print "<!{0:20} : {1!r}".format(key, res[key])
            print
            raise
        if self.debug:
            for key in sorted(res.keys()):
                if key == "x-content":
                    print "< {0:20} : {1!r} ({2})".format(key, type(res[key]), len(res[key]))
                else:
                    print "< {0:20} : {1!r}".format(key, res[key])
            print
        return res

app = Application(debug=True)

if __name__ == "__main__":
    xhttp.run_server(app, ip="", port=8000)


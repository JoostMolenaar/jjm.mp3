mp3.viewmodel.Users = Object.extend({
    constructor: function(data) {
        this.propertyChanged = new mp3.Event();
        this.users = data.users;
    },
    _setValue: function(field, data) {
        if (!data) {
            this["_" + field] = data;
            this.propertyChanged.trigger(field, data);
        }
        else {
            data.fetch()
                .done(function() {
                    this["_" + field] = data;
                    this.propertyChanged.trigger(field, data);
                }.bind(this));
        }
    },
    users: {
        get: function() {
            return this._users; 
        },
        set: function(v) {
            this._setValue("users", v);
            this.collections = this.artists = this.albums = this.tracks = this.track = null;
        }
    },
    collections: {
        get: function() {
            return this._collections;
        },
        set: function(v) {
            this._setValue("collections", v); 
            this.artists = this.albums = this.tracks = this.track = null;
        }
    },
    artists: {
        get: function() {
            return this._artists;
        },
        set: function(v) {
            this._setValue("artists", v);
            this.albums = this.tracks = this.track = null;
        }
    },
    albums: {
        get: function() {
            return this._albums;
        },
        set: function(v) {
            this._setValue("albums", v);
            this.tracks = this.track = null;
        }
    },
    tracks: {
        get: function() {
            return this._tracks;
        },
        set: function(v) {
            this._setValue("tracks", v);
            this.track = null;
        }
    },
    track: {
        get: function() {
            return this._track;
        },
        set: function(v) {
            this._setValue("track", v);
        }
    }
});

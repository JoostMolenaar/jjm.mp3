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
    _get_users: function() { 
        return this._users; 
    },
    _set_users: function(v) {
        this._setValue("users", v);
        this.collections = this.artists = this.albums = this.tracks = this.track = null;
    },
    _get_collections: function() { 
        return this._collections;
    },
    _set_collections: function(v) { 
        this._setValue("collections", v); 
        this.artists = this.albums = this.tracks = this.track = null;
    },
    _get_artists: function() {
        return this._artists;
    },
    _set_artists: function(v) {
        this._setValue("artists", v);
        this.albums = this.tracks = this.track = null;
    },
    _get_albums: function() {
        return this._albums;
    },
    _set_albums: function(v) {
        this._setValue("albums", v);
        this.tracks = this.track = null;
    },
    _get_tracks: function() {
        return this._tracks;
    },
    _set_tracks: function(v) {
        this._setValue("tracks", v);
        this.track = null;
    },
    _get_track: function() {
        return this._track;
    },
    _set_track: function(v) {
        this._setValue("track", v);
    },
});

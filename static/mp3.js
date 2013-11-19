//
// namespaces
//

mp3 = {
    model: {},
    viewmodel: {},
    view: {}
};

//
// polyfills
//

window.AudioContext = window.AudioContext || window.webkitAudioContext;

//
// frameworkish things
//

Function.prototype.extend = function(attrs, statics) {
    var ctor = attrs.constructor;
    ctor.prototype = Object.create(this.prototype);
    ctor.prototype.constructor = ctor;
    ctor.prototype.__super__ = this;
    for (var key in attrs) {
        var setter = /^_set_(.*)$/.exec(key)
        var getter = /^_get_(.*)$/.exec(key)
        if (setter) {
            ctor.prototype.__defineSetter__(setter[1], attrs[key]);
        } else if (getter) {
            ctor.prototype.__defineGetter__(getter[1], attrs[key]);
        } else {
            ctor.prototype[key] = attrs[key];
        }
    }
    statics = statics || {}
    for (var key in statics) {
        ctor[key] = statics[key];
    }
    return ctor;
};

mp3.Event = Object.extend({
    constructor: function() {
        this.listeners = [];
    },
    listen: function(handler, context) {
        this.listeners.push({ handler: handler, context: context });
    },
    trigger: function() {
        for (var i = 0; i < this.listeners.length; i++) {
            window.setTimeout((function(listener, args) {
                return function(e) {
                    listener.handler.apply(listener.context, args);
                };
            })(this.listeners[i], Array.prototype.slice.call(arguments)), 0);
        }
    }
});

mp3.StateMachine = Object.extend({
    constructor: function(states, initial) {
        this._value = initial;
        this._states = states;
        this.changed = new mp3.Event();
    },
    _get_value: function() {
        return this._value;
    },
    _set_value: function(value) {
        if (Object.keys(this._states).indexOf(value) == -1) {
            throw "Illegal state: " + value;
        }
        if (this._value && this._states[this._value].indexOf(value) == -1) {
            throw "Illegal state transition from " + this._value + " to " + value;
        }
        this._value = value;
        this.changed.trigger(this._value);
    }
});

//
// views
//

mp3.view.ToggleButton = Object.extend({
    constructor: function(selector, initialState) {
        this.toggled = new mp3.Event();
        this._state = !!initialState;
        this.$button = $(selector)
            .click(function(e) { 
                this.state = !this.state;
                this.toggled.trigger(this.state);
            }.bind(this));
    },
    _get_state: function() {
        return this._state;
    },
    _set_state: function(state) {
        this._state = state;
        this.$button
            .removeClass(state ? "toggle-false" : "toggle-true")
            .addClass(state ? "toggle-true" : "toggle-false");
    }
});

mp3.view.BrowserPanel = Object.extend({
    constructor: function(selector) {
        this.$panel = $(selector)
            .delegate(".item-container a", "click", function(e) {
                e.preventDefault();
                this.select.trigger($(e.target).data("item"));
            }.bind(this));
        this.select = new mp3.Event();
    },
    setData: function(data) {
        this.$panel
            .css("display", data ? "block" : "none")
            .find("h1")
                .text(data ? data.name : "")
            .end()
            .find(".item-container")
                .empty()
                .each(function(i, div) {
                    if (data && data.items) {
                        $.each(data.items, function(i, item) {
                            this.addItem($(div), item);
                        }.bind(this));
                    }
                }.bind(this))
            .end();
    },
    addItem: function($container, item) {
        $("<div><a/></div>")
            .find("a")
                .attr("href", item.url)
                .text(item.name)
                .data("item", item)
            .end()
            .appendTo($container);
    }
});

mp3.view.ArtistBrowserPanel = mp3.view.BrowserPanel.extend({
    constructor: function() {
        this.__super__.prototype.constructor.apply(this, arguments);
        this.$panel
            .delegate(".item-container .button", "click", function(e) {
                var item = $(e.target).data("item");
                this.addAlbum.trigger(item);
            }.bind(this));
        this.addAlbum = new mp3.Event();
    },
    addItem: function($container, item) {
        $("<div><img/><a/><div/></div>")
            .find("img")
                .attr("src", item.cover_url)
                .attr("width", 75)
                .attr("height", 75)
            .end()
            .find("a")
                .attr("href", item.url)
                .text(item.name)
                .data("item", item)
            .end()
            .find("div")
                .attr("class", "button")
                .text("+")
                .data("item", item)
            .end()
            .appendTo($container);
    }
});

mp3.view.AlbumBrowserPanel = mp3.view.BrowserPanel.extend({
    constructor: function() {
        this.__super__.prototype.constructor.apply(this, arguments);
        this.$panel
            .delegate(".item-container .button", "click", function(e) {
                var item = $(e.target).data("item");
                this.addTrack.trigger(item);
            }.bind(this));
        this.addTrack = new mp3.Event();
    },
    addItem: function($container, item) {
        $("<div><a/><div/></div>")
            .find("a")
                .attr("href", item.url)
                .text(item.name)
                .data("item", item)
            .end()
            .find("div")
                .attr("class", "button")
                .text("+")
                .data("item", item)
            .end()
            .appendTo($container);
    }
});

mp3.view.TrackBrowserPanel = mp3.view.BrowserPanel.extend({
    constructor: function() {
        this.__super__.prototype.constructor.apply(this, arguments);
    },
    addItem: function($container, item) {
        $("<div/>")
            .append("<b>foo</b>");
    }
});

mp3.view.Panel = Object.extend({
    constructor: function(selector) {
        this.$panel = $(selector);
    },
    _set_isVisible: function(isVisible) {
        this.$panel.css("display", isVisible ? "block" : "none");
    }
});

mp3.view.Browser = mp3.view.Panel.extend({
    constructor: function(selector, usersViewModel) {
        this.__super__.prototype.constructor.call(this, selector);

        this.usersViewModel = usersViewModel;
        this.usersViewModel.propertyChanged.listen(function(property, data) {
            this[property].setData(data);
        }, this);

        this.users = new mp3.view.BrowserPanel("#users");
        this.users.select.listen(function(user) {
            this.usersViewModel.collections = user;
        }, this);

        this.collections = new mp3.view.BrowserPanel("#collections");
        this.collections.select.listen(function(collection) {
            this.usersViewModel.artists = collection;
        }, this);

        this.artists = new mp3.view.BrowserPanel("#artists");
        this.artists.select.listen(function(artist) {
            this.usersViewModel.albums = artist;
        }, this);

        this.albums = new mp3.view.ArtistBrowserPanel("#albums");
        this.albums.select.listen(function(album) {
            this.usersViewModel.tracks = album;
        }, this);

        this.tracks = new mp3.view.AlbumBrowserPanel("#tracks");
        this.tracks.select.listen(function(track) {
            this.usersViewModel.track = track;
        }, this);

        this.track = new mp3.view.TrackBrowserPanel("#track");
    }
});

mp3.view.Playlist = mp3.view.Panel.extend({
    constructor: function(selector, playlistViewModel) {
        this.__super__.prototype.constructor.call(this, selector);

        this.playlistViewModel = playlistViewModel;
        this.playlistViewModel.trackAdded.listen(function(track) {
            this.addTrack(track);
        }, this);
    },
    addTrack: function(track) {
        $("<div><span/></div>")
            .find("span")
                .text(track.track.name)
            .end()
            .appendTo(this.$panel);
    }
});

mp3.view.Controls = Object.extend({
    constructor: function(selector, controlsViewModel) {
        this.controlsViewModel = controlsViewModel;
        this.controlsViewModel.propertyChanged.listen(function(name, state) {
            if (name == "state") {
                this.$controls
                    .find("#stopped-button")
                        .removeClass("toggle-true")
                        .addClass("toggle-false")
                    .end()
                    .find("#playing-button")
                        .removeClass("toggle-true")
                        .addClass("toggle-false")
                    .end()
                    .find("#paused-button")
                        .removeClass("toggle-true")
                        .addClass("toggle-false")
                    .end()
                    .find("#" + state + "-button")
                        .removeClass(state ? "toggle-false" : "toggle-true")
                        .addClass(state ? "toggle-true" : "toggle-false")
                    .end();
            }
        }, this);

        this.$controls = $(selector)
            .find("#playing-button")
                .click(function(e) { 
                    controlsViewModel.state = "playing";
                })
            .end()
            .find("#stopped-button")
                .click(function(e) { 
                    controlsViewModel.state = "stopped";
                })
            .end()
            .find("#paused-button")
                .click(function(e) { 
                    controlsViewModel.state = "paused";
                })
            .end();
    }
});

//
// viewmodels
//

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

mp3.viewmodel.Playlist = Object.extend({
    constructor: function() {
        this.items = [];
        this.audio = new AudioContext();
        this.trackAdded = new mp3.Event();
        this.state = new mp3.StateMachine({
            "stopped": ["playing"],
            "playing": ["stopped", "paused"],
            "paused" : ["stopped", "playing"] 
        }, "stopped");
        this.state.changed.listen(this.stateChanged, this);
        this._current = -1;
        this._next = -1;
    },
    _get_current: function() {
        return (0 <= this._current) && (this._current < this.items.length)
             ? this.items[this._current]
             : null;
    },
    _get_next: function() {
        return (0 <= this._next) && (this._next < this.items.length)
             ? this.items[this._next]
             : null;
    },
    addTrack: function(track) {
        var item = new mp3.model.PlaylistItem(track, this.audio);
        item.state.changed.listen(this.itemStateChanged.bind(this));
        this.items.push(item);
        this.trackAdded.trigger(item);
        this.protectInvariants();
    },
    addAlbum: function(album) {
        var self = this;
        album
            .fetch()
            .done(function() {
                album.items.forEach(function(item) {
                    self.addTrack(item);
                });
            });
    },
    findFirstIndex: function(states) {
        for (var i = 0; i < this.items.length; i++) {
            if (states.indexOf(this.items[i].state.value) >= 0) {
                return i;
            }
        }
        return -1;
    },
    findFirst: function(states) {
        var i = this.findFirstIndex(states);
        return i == -1 ? null : this.items[i];
    },
    itemStateChanged: function(state) {
        this.protectInvariants();
    },
    stateChanged: function(state) {
        this.protectInvariants();
    },
    findNext: function() {
        this._next = this.findFirstIndex(["idle"]);
        if (this.next && this.next.state.value == "idle") {
            this.next.load();
        }
    },
    protectInvariants: function() {
        console.log("-> playlist", this.state.value, this._current, this._next, !this.current ? "null" : this.current.state.value, !this.next ? "null" : this.next.state.value);
        if (!this.next) {
            this.findNext();
        }
        if (!this.current || ["load","ready","play"].indexOf(this.current.state.value) == -1) {
            this._current = this._next;
            this.findNext();
        }
        if (this.current) {
            switch (this.state.value) {
                case "stopped":
                    if (this.current.state.value == "play") {
                        this.current.stop();
                    }
                    break;
                case "playing":
                    if (this.current.state.value == "ready") {
                        this.current.play();
                    }
                    break;
                case "paused":
                    if (this.current.state.value == "play") {
                        this.current.pause();
                    }
                    break;
            }
        }
        console.log("<- playlist", this.state.value, this._current, this._next, !this.current ? "null" : this.current.state.value, !this.next ? "null" : this.next.state.value);
    }
});

mp3.viewmodel.Controls = Object.extend({
    constructor: function() {
        this.propertyChanged = new mp3.Event();
        this._state = "stopped";
    },
    _get_state: function() {
        return this._state;
    },
    _set_state: function(v) {
        this._state = v;
        this.propertyChanged.trigger("state", v);
    }
});

//
// models
//

mp3.model.Users = Object.extend({
    constructor: function() {
        this.users = {
            name: "Users",
            url: "/mp3/u/",
            loaded: false,
            fetch: this._fetch
        };
    },
    _fetch: function() {
        if (this.loaded) {
            return $.Deferred().resolveWith(this).promise();
        }
        else {
            console.log(this.url, "(fetch)");
            var deferred = $.Deferred();
            jQuery
                .get(this.url)
                .done(function(data) {
                    Object.keys(data).forEach(function(k) {
                        this[k] = data[k];
                    }.bind(this));
                    if (this.items) {
                        this.items.forEach(function(item) {
                            item.loaded = false;
                            item.fetch = this.fetch;
                        }.bind(this));
                    }
                    this.loaded = true;
                    deferred.resolveWith(this);
                 }.bind(this));
            return deferred.promise();
        }
    }
});

mp3.model.PlaylistItemXhrStrategy = Object.extend({
    constructor: function(item) {
        this.item = item;
    },
    load: function() {
        console.log(this.item.track.url, "(XHR load)");
        var self = this;
        return self
            .downloadArrayBuffer(self.item.track.mp3_url)
            .then(function(array) {
                return self.decodeAudio(array);
            })
            .then(function(buffer) {
                return self.createBufferSource(buffer);
            });
    },
    unload: function() {
        this.item.source.disconnect();
        this.item.source.onended = null;
        this.item.source = null;
        this.item.buffer = null;
    },
    play: function() {
        this.item.source.start(0);
    },
    stop: function() {
        this.item.source.stop(0);
    },
    pause: function() {
        this.item.source.stop(0);
    },
    downloadArrayBuffer: function(url) {
        console.log(this.item.track.url, "(downloadArrayBuffer)");
        var deferred = $.Deferred();
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.responseType = "arraybuffer";
        xhr.send();
        xhr.onreadystatechange = function() {
            if (xhr.readyState == XMLHttpRequest.DONE) {
                if (xhr.status == 200) {
                    deferred.resolve(xhr.response);
                }
                else {
                    deferred.reject("error from downloadArrayBuffer");
                }
            }
        };
        return deferred.promise();
    },
    decodeAudio: function(array) {
        console.log(this.item.track.url, "(decodeAudioData)");
        var deferred = $.Deferred();
        this.item.context.decodeAudioData(array, function(buffer) {
            deferred.resolve(buffer);
        }, function() {
            deferred.reject("error from decodeAudioData");
        });
        return deferred.promise();
    },
    createBufferSource: function(buffer) {
        console.log(this.item.track.url, "(createBufferSource)");
        this.item.buffer = buffer;
        this.item.source = this.item.context.createBufferSource();
        this.item.source.buffer = this.item.buffer;
        this.item.source.connect(this.item.context.destination);
        this.item.source.onended = function(e) {
            if (this.item.state.value != "pause") {
                this.item.state.value = "end";
            }
            this.unload();
        }.bind(this);
        this.item.state.value = "ready";
    },
});

mp3.model.PlaylistItemMediaStrategy = Object.extend({
    constructor: function(item) {
        this.item = item;
    },
    load: function() {
        console.log(this.item.track.url, "(media load)");
        var deferred = $.Deferred();
        this.item.audio = new Audio();
        this.item.audio.src = this.item.track.mp3_url;
        this.item.audio.load();
        this.item.audio.addEventListener("canplaythrough", function(e) {
            this.item.source = this.item.context.createMediaElementSource(this.item.audio);
            this.item.source.connect(this.item.context.destination);
            this.item.state.value = "ready";
            deferred.resolve();
        }.bind(this));
        this.item.audio.addEventListener("ended", function(e) {
            if (this.item.state.value != "pause") {
                this.item.state.value = "end";
            }
            this.unload();
        }.bind(this));
        return deferred.promise();
    },
    unload: function() {
        console.error("TODO: mp3.model.PlaylistItemMediaStrategy.unload");
    },
    play: function() {
        this.item.audio.play();
    },
    stop: function() {
    },
    pause: function() {
    },
});

mp3.model.PlaylistItem = Object.extend({
    constructor: function(track, context) {
        this.track = track;
        this.context = context;
        this.buffer = this.source = null;
        this.state = new mp3.StateMachine({
            "init":  ["idle"],
            "idle":  ["load"],
            "load":  ["ready", "error"],
            "ready": ["play", "error"],
            "play":  ["end", "pause", "error"],
            "pause": ["play"],
            "error": ["end"],
            "end":   []
        }, "init");
        this.state.changed.listen(function(state) { 
            console.log(this.track.url, state); 
        }, this)
        this.state.value = "idle";
    },
    load: function() {
        var self = this;
        this.state.value = "load";
        this.track
            .fetch()
            .then(function() {
                // XXX Audio element doesn't like being queued for > 1 minute, so use buffer
                self.strategy = self.track.length < 60 || true 
                    ? new mp3.model.PlaylistItemXhrStrategy(self)
                    : new mp3.model.PlaylistItemMediaStrategy(self);
                return self.strategy.load();
            })
            .fail(function(msg) {
                if (msg) console.error(msg);
                self.state.value = "error";
            });
    },
    play: function() {
        this.state.value = "play";
        this.strategy.play();
    },
    stop: function() {
        this.strategy.stop();
    },
    pause: function() {
        this.state.value = "pause";
        this.strategy.pause();
    }
});

//
// app
//

mp3.App = Object.extend({
    constructor: function() { 
        // browser
        this.users = new mp3.model.Users();

        this.usersViewModel = new mp3.viewmodel.Users(this.users);

        this.browserView = new mp3.view.Browser("#browser", this.usersViewModel);
        this.browserView.albums.addAlbum.listen(function(album) {
            this.playlist.addAlbum(album);
        }, this);
        this.browserView.tracks.addTrack.listen(function(track) {
            this.playlist.addTrack(track);
        }, this);

        // playlist
        this.playlist = new mp3.viewmodel.Playlist();

        this.playlistView = new mp3.view.Playlist("#playlist", this.playlist);

        // controls
        this.controlsViewModel = new mp3.viewmodel.Controls();
        this.controlsViewModel.propertyChanged.listen(function(name, state) {
            this.playlist.state.value = state;
        }, this);

        this.controlsView = new mp3.view.Controls("#controls", this.controlsViewModel);

        // toggle buttons
        this.libraryButton = new mp3.view.ToggleButton("#library-button");
        this.libraryButton.toggled.listen(function(state) {
            this.browserView.isVisible = state;
            state ? $("#main-panel").addClass("browser-visible")
                  : $("#main-panel").removeClass("browser-visible");
        }, this);

        this.playlistButton = new mp3.view.ToggleButton("#playlist-button");
        this.playlistButton.toggled.listen(function(state) {
            this.playlistView.isVisible = state;
            state ? $("#main-panel").addClass("playlist-visible")
                  : $("#main-panel").removeClass("playlist-visible");
        }, this);
    }
}, {
    launch: function() {
        window.app = new mp3.App();
    }
});

//
// launch it
//

$(mp3.App.launch);

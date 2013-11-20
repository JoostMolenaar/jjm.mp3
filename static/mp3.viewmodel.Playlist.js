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
        this.moveNext();
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
        this.moveNext();
    },
    stateChanged: function(state) {
        this.moveNext();
    },
    findNext: function() {
        this._next = this.findFirstIndex(["idle"]);
    },
    moveNext: function() {
        console.log("-> playlist", this.state.value, this._current, this._next, !this.current ? "null" : this.current.state.value, !this.next ? "null" : this.next.state.value);

        if (!this.next) {
            this.findNext();
        }

        if (!this.current && this.next && this.next.state.hasValue(["idle"])) {
            this.next.load();
        }

        if (!this.current || !this.current.state.hasValue(["load","ready","play","pause","stop"])) {
            this._current = this._next;
            this.findNext();
        }

        switch (this.state.value) {
            case "stopped":
                if (this.current && this.current.state.hasValue(["play", "ready"])) {
                    this.current.stop();
                }
                break;
            case "playing":
                if (this.current && this.current.state.value == "ready") {
                    this.current.play();
                }
                break;
            case "paused":
                if (this.current && this.current.state.value == "play") {
                    this.current.pause();
                }
                break;
        }

        if (this.current && !this.current.state.hasValue(["load","ready"]) && this.next && this.next.state.hasValue(["idle"])) {
            this.next.load();
        }

        switch (this.state.value) {
            case "playing":
                var p1 = !this.current && !this.next;
                var p2 = this.current && this.current.state.hasValue(["load","ready"]) && (!this.next || this.next.state.hasValue(["idle"]));
                var p3 = this.current && this.current.state.hasValue(["play"]) && (!this.next || this.next.state.hasValue(["load","ready"]));
                break;
            case "paused":
                var p1 = !this.current && !this.next;
                var p2 = this.current && this.current.state.hasValue(["load","ready"]) && (!this.next || this.next.state.hasValue(["idle"]));
                var p3 = this.current && this.current.state.hasValue(["pause"]) && (!this.next || this.next.state.hasValue(["load", "ready"]));
                break;
            case "stopped":
                var p1 = !this.current && !this.next;
                var p2 = this.current && this.current.state.hasValue(["load","ready"]) && (!this.next || this.next.state.hasValue(["idle"]));
                var p3 = this.current && this.current.state.hasValue(["stop"]) && (!this.next || this.next.state.hasValue(["load", "ready"]));
                break;
        }
        if (!(p1 || p2 || p3)) {
            console.error("illegal state combination:")
        }

        console.log("<- playlist", this.state.value, this._current, this._next, !this.current ? "null" : this.current.state.value, !this.next ? "null" : this.next.state.value);
    }
});

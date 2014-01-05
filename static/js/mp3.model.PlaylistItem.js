mp3.model.PlaylistItem = Object.extend({
    constructor: function(track, playlist) {
        this.track = track;
        this.playlist = playlist;
        this.buffer = this.source = null;
        this.state = new mp3.StateMachine({
            "init":  ["idle"],
            "idle":  ["load"],
            "load":  ["ready", "error"],
            "ready": ["play", "error"],
            "play":  ["end", "pause", "stop", "error"],
            "pause": ["ready"],
            "stop":  ["ready"],
            "end":   ["idle"],
            "error": [],
        }, "init");
        this.state.changed.listen(function(state) { 
            console.log(this.track.url, state); 
        }, this)
        this.state.value = "idle";
        this.startedAt = null;
        this.startAt = 0;
    },
    load: function() {
        var self = this;
        this.state.value = "load";
        this.track
            .fetch()
            .then(function() {
                self.strategy = self.track.length < 60 
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
        if (this.state.value == "play") {
            this.state.value = "stop";
        }
        this.strategy.stop();
    },
    pause: function() {
        this.state.value = "pause";
        this.strategy.pause();
    }
});

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

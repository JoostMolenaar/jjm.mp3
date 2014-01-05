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
            this.item.source = this.item.playlist.context.createMediaElementSource(this.item.audio);
            this.item.source.connect(this.item.playlist.output);
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
        console.error("TODO: mp3.model.PlaylistItemMediaStrategy.stop");
    },
    pause: function() {
        console.error("TODO: mp3.model.PlaylistItemMediaStrategy.pause");
    },
});

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

mp3.components.Controls = Backbone.Class.extend({
    constructor: function() {
        this.libraryButton = new mp3.base.ToggleButton({ el: "#library-button" });
        this.playlistButton = new mp3.base.ToggleButton({ el: "#playlist-button" });
        this.listenTo(this.libraryButton, "toggled", this.libraryToggled);
        this.listenTo(this.playlistButton, "toggled", this.playlistToggled);
    },
    libraryToggled: function() {
        if (this.libraryButton.state) {
            $("#main-panel").addClass("browser-visible");
        }
        else {
            $("#main-panel").removeClass("browser-visible");
        }
    },
    playlistToggled: function() {
        if (this.playlistButton.state) {
            $("#main-panel").addClass("playlist-visible");
        }
        else {
            $("#main-panel").removeClass("playlist-visible");
        }
    }
});

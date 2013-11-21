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

        this.analysis = new mp3.view.Analysis("#analysis", this.playlist);

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
    },
    _static_launch: function() {
        app = new mp3.App();
    }
});

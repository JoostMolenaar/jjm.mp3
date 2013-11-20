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

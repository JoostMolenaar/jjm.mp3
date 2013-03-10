mp3.views.ArtistList = mp3.base.ListView.extend({
    el: "#artists",
    template: "#artists-template",
    itemViewType: mp3.base.ListItem.extend({
        template: "#artist-item-template"
    }),
    nextViewType: mp3.views.AlbumList
});

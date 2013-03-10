mp3.views.CollectionList = mp3.base.ListView.extend({
    el: "#collections",
    template: "#collections-template",
    itemViewType: mp3.base.ListItem.extend({ 
        template: "#collection-item-template" 
    }),
    nextViewType: mp3.views.ArtistList
});

mp3.models.Album = mp3.base.CollectionResource.extend({
    itemType: Backbone.Collection.extend({ model: mp3.models.Track })
});

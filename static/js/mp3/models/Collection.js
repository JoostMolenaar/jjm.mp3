mp3.models.Collection = mp3.base.CollectionResource.extend({
    itemType: Backbone.Collection.extend({ model: mp3.models.Artist })
});

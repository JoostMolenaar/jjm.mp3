mp3.models.Library = mp3.base.CollectionResource.extend({
    itemType: Backbone.Collection.extend({ model: mp3.models.Collection })
});

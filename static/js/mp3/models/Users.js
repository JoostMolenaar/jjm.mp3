mp3.models.Users = mp3.base.CollectionResource.extend({
    itemType: Backbone.Collection.extend({ model: mp3.models.Library })
});

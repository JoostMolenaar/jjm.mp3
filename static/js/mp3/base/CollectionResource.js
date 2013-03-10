mp3.base.CollectionResource = mp3.base.Resource.extend({
    defaults: function() {
        return { 
            items: new this.itemType(),
            loaded: false,
        };
    },
    parse: function(obj) {
        obj.items = new this.itemType(obj.items);
        obj.loaded = true;
        return obj;
    },
    toJSON: function() {
        var obj = Backbone.Model.prototype.toJSON.call(this);
        obj.items = obj.items.map(function(item) { return item.toJSON() });
        return obj;
    }
});


var Track = Backbone.Model.extend({
    url: function() {
        return this.get("href");
    }
});

var Album = Backbone.Model.extend({
    itemType: Backbone.Collection.extend({ model: Track }),

    defaults: function() {
        return { items: new this.itemType() };
    },

    parse: function(obj) {
        this.get("items").reset(obj.items);
    },

    url: function() {
        return this.get("href");
    }
});

var Artist = Backbone.Model.extend({
    itemType: Backbone.Collection.extend({ model: Album }),

    defaults: function() {
        return { items: new this.itemType() };
    },

    parse: function(obj) {
        this.get("items").reset(obj.items);
    },

    url: function() {
        return this.get("href");
    }
});

var Collection = Backbone.Model.extend({
    itemType: Backbone.Collection.extend({ model: Artist }),

    defaults: function() {
        return { items: new this.itemType() };
    },

    parse: function(obj) {
        this.get("items").reset(obj.items);
    },

    url: function() { 
        return this.get("href");
    } 
});

var Library = Backbone.Model.extend({
    itemType: Backbone.Collection.extend({ model: Collection }),

    defaults: function() {
        return { items: new this.itemType() };
    },

    parse: function(obj) {
        this.get("items").reset(obj.items)
    },

    url: function() {
        return this.get("href");
    }
});

var Users = Backbone.Model.extend({
    itemType: Backbone.Collection.extend({ model: Library }),

    defaults: function() {
        return { items: new this.itemType() };
    },

    parse: function(obj) {
        this.get("items").reset(obj.items);
    },

    url: function() { 
        return "/mp3/u/";
    }
});

USERS = new Users();
USERS.fetch();

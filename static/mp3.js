
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
        obj.items = this.get("items").reset(obj.items);
        return obj;
    },

    url: function() {
        return this.get("href");
    },

    toJSON: function() {
        var obj = Backbone.Model.prototype.toJSON.call(this);
        obj.items = obj.items.map(function(item) { return item.toJSON() });
        return obj;
    }
});

var Artist = Backbone.Model.extend({
    itemType: Backbone.Collection.extend({ model: Album }),

    defaults: function() {
        return { items: new this.itemType() };
    },

    parse: function(obj) {
        obj.items = this.get("items").reset(obj.items);
        return obj;
    },

    url: function() {
        return this.get("href");
    },

    toJSON: function() {
        var obj = Backbone.Model.prototype.toJSON.call(this);
        obj.items = obj.items.map(function(item) { return item.toJSON() });
        return obj;
    }
});

var Collection = Backbone.Model.extend({
    itemType: Backbone.Collection.extend({ model: Artist }),

    defaults: function() {
        return { items: new this.itemType() };
    },

    parse: function(obj) {
        obj.items = this.get("items").reset(obj.items);
        return obj;
    },

    url: function() { 
        return this.get("href");
    },

    toJSON: function() {
        var obj = Backbone.Model.prototype.toJSON.call(this);
        obj.items = obj.items.map(function(item) { return item.toJSON() });
        return obj;
    }
});

var Library = Backbone.Model.extend({
    itemType: Backbone.Collection.extend({ model: Collection }),

    defaults: function() {
        return { items: new this.itemType() };
    },

    parse: function(obj) {
        obj.items = this.get("items").reset(obj.items);
        return obj;
    },

    url: function() {
        return this.get("href");
    },

    toJSON: function() {
        var obj = Backbone.Model.prototype.toJSON.call(this);
        obj.items = obj.items.map(function(item) { return item.toJSON() });
        return obj;
    }
});

var Users = Backbone.Model.extend({
    itemType: Backbone.Collection.extend({ model: Library }),

    defaults: function() {
        return { items: new this.itemType() };
    },

    parse: function(obj) {
        obj.items = this.get("items").reset(obj.items);
        return obj;
    },

    url: function() { 
        return "/mp3/u/";
    },

    toJSON: function() {
        var obj = Backbone.Model.prototype.toJSON.call(this);
        obj.items = obj.items.map(function(item) { return item.toJSON() });
        return obj;
    }
});

var UserListView = Backbone.View.extend({
    el: "#users",

    template: $("#users-template").html(),

    initialize: function() {
        this.listenTo(this.model, "change", this.render);
    },

    render: function() {
        var obj = this.model.toJSON();
        console.log(JSON.stringify(obj));
        var html = Mustache.render(this.template, obj);
        this.$el.html(html);
        return this;
    }
});

USERS = new Users();
USERS.fetch();

USERSVIEW= new UserListView({
    model: USERS
});
 

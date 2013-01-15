var Resource = Backbone.Model.extend({
    url: function() {
        return this.get("url");
    },

    dump: function() {
        obj = this.toJSON();
        console && console.log && console.log(JSON.stringify(obj));
        return obj;
    }
});

var CollectionResource = Resource.extend({
    defaults: function() {
        return { items: new this.itemType() };
    },

    parse: function(obj) {
        obj.items = this.get("items").reset(obj.items);
        return obj;
    },

    toJSON: function() {
        var obj = Backbone.Model.prototype.toJSON.call(this);
        obj.items = obj.items.map(function(item) { return item.toJSON() });
        return obj;
    }
});

var Track = Resource.extend();

var Album = CollectionResource.extend({
    itemType: Backbone.Collection.extend({ model: Track })
});

var Artist = CollectionResource.extend({
    itemType: Backbone.Collection.extend({ model: Album })
});

var Collection = CollectionResource.extend({
    itemType: Backbone.Collection.extend({ model: Artist })
});

var Library = CollectionResource.extend({
    itemType: Backbone.Collection.extend({ model: Collection })
});

var Users = CollectionResource.extend({
    itemType: Backbone.Collection.extend({ model: Library }),

    url: function() { 
        return "/mp3/u/";
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
 

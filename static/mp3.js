
/*
 * Model base types 
 */

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
    //initialize: function() {
    //    this.get("items").on("reset", this.change.bind(this));
    //},

    defaults: function() {
        return { items: new this.itemType() };
    },

    parse: function(obj) {
        //obj.items = this.get("items").reset(obj.items);
        obj.items = new this.itemType(obj.items);
        return obj;
    },

    toJSON: function() {
        var obj = Backbone.Model.prototype.toJSON.call(this);
        obj.items = obj.items.map(function(item) { return item.toJSON() });
        return obj;
    }
});

/*
 * Model types
 */

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

/*
 * Base view types
 */

var ListView = Backbone.View.extend({
    events: {
        "click a": "itemClicked"
    },

    initialize: function() {
        if (!this.model)
            return;
        this.listenTo(this.model, "change", this.render);
    },

    render: function() {
        var obj = this.model.toJSON();
        var html = Mustache.render(this.template, obj);
        this.$el.html(html);
        return this;
    },

    itemClicked: function(e) {
        e.preventDefault();
        var url = $(e.target).attr("href");
        var model = this.model.get("items").find(function(item) { return item.get("url") == url; });
        this.trigger("select", model);
    }
});

/*
 * View types
 */
var TrackList = ListView.extend({
    el: "#tracks",
    template: $("#tracks-template").html()
});

var AlbumList = ListView.extend({
    el: "#albums",
    template: $("#albums-template").html()
});

var ArtistList = ListView.extend({
    el: "#artists",
    template: $("#artists-template").html()
});

var CollectionList = ListView.extend({
    el: "#collections",
    template: $("#collections-template").html()
});

var UserList = ListView.extend({
    el: "#users",
    template: $("#users-template").html()
});

/*
 * Application
 */

USERS = new Users();
USERS.fetch();

TRACKLIST = new TrackList();
TRACKLIST.on("select", function(model) {
    console && console.log && console.log("track selected");
    model.dump();
});

ALBUMLIST = new AlbumList();
ALBUMLIST.on("select", function(model) {
    console && console.log && console.log("album elected:");
    model.dump();

    TRACKLIST.model = model;
    TRACKLIST.initialize();

    model.fetch();
});

ARTISTLIST = new ArtistList();
ARTISTLIST.on("select", function(model) {
    console && console.log && console.log("artist elected:");
    model.dump();

    ALBUMLIST.model = model;
    ALBUMLIST.initialize();

    model.fetch();
});

COLLECTIONLIST = new CollectionList();
COLLECTIONLIST.on("select", function(model) {
    console && console.log && console.log("collection selected:");
    model.dump();

    ARTISTLIST.model = model;
    ARTISTLIST.initialize();

    model.fetch();
});

USERLIST = new UserList({
    model: USERS
});
USERLIST.on("select", function(model) {
    console && console.log && console.log("user selected:");
    model.dump();

    COLLECTIONLIST.model = model;
    COLLECTIONLIST.initialize();

    model.fetch();
}); 

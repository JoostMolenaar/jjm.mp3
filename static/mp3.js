
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
    defaults: function() {
        return { 
            items: new this.itemType(),
            loaded: false,
            selected: null
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
    itemType: Backbone.Collection.extend({ model: Library })
});

/*
 * View base types
 */

var Template = Backbone.View.extend({
    initialize: function() {
        this.listenTo(this.model, "change", this.render);
    },

    render: function() {
        var obj = this.format(this.model.toJSON());
        var html = Mustache.render(this.template, obj);
        this.$el.html(html);
        return this;
    },

    format: function(obj) {
        return obj;
    }
});

var ListView = Template.extend({
    events: {
        "click a": "itemClicked"
    },

    initialize: function() {
        this.listenTo(this.model, "change", this.render);
        this.listenTo(this.model, "change:selected", this.changeSubview);
    },

    destroy: function() {
        if (this.subview) {
            this.subview.destroy();
        }
        this.$el.empty();
        this.stopListening();
    },

    itemClicked: function(e) {
        e.preventDefault();
        var url = $(e.target).attr("href");
        var model = this.model.get("items").find(function(item) { return item.get("url") == url; });
        this.model.set("selected", null);
        this.model.set("selected", model);
    },

    changeSubview: function() {
        if (this.subview) {
            this.subview.destroy();
        }
        var selected = this.model.get("selected");
        if (selected) {
            this.subview = new this.subviewType({ model: selected });
            if (selected.get("loaded")) {
                this.subview.render();
            }
            else {
                selected.fetch();
            }
        }
    }
});

/*
 * View types
 */

var TrackDetails = Template.extend({
    el: "#track",
    template: $("#track-template").html(),

    destroy: function() {
        this.$el.empty();
        this.stopListening();
    },

    format: function(obj) {
        obj.year = !!obj.year ? { year: obj.year } : null;
        obj.length = Math.floor(obj.length);
        obj.bitrate = Math.floor(obj.bitrate / 1000)
        return obj;
    }
});

var TrackList = ListView.extend({
    el: "#tracks",
    subviewType: TrackDetails,
    template: $("#tracks-template").html()
});

var AlbumList = ListView.extend({
    el: "#albums",
    subviewType: TrackList,
    template: $("#albums-template").html()
});

var ArtistList = ListView.extend({
    el: "#artists",
    subviewType: AlbumList,
    template: $("#artists-template").html()
});

var CollectionList = ListView.extend({
    el: "#collections",
    subviewType: ArtistList,
    template: $("#collections-template").html()
});

var UserList = ListView.extend({
    el: "#users",
    subviewType: CollectionList,
    template: $("#users-template").html()
});

/*
 * Application
 */

USERS = new Users({ "url": "/mp3/u/" })
USERS.fetch();

USERLIST = new UserList({ model: USERS });


//
// Model base types 
//

var Resource = Backbone.Model.extend({
    url: function() {
        return this.get("url");
    },

    parse: function(obj) {
        obj.loaded = true;
        return obj;
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
    },

    setSelected: function(model) {
    }
});

//
// Model types
//

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

//
// Base view types
//

var Template = Backbone.View.extend({
    initialize: function() {
        this.template = $(this.template).text();
        this.listenTo(this.model, "change", this.render);
    },
    render: function() {
        var obj = this.model.toJSON();
        var html = Mustache.render(this.template, obj);
        this.$el.html(html);
        return this;
    },
    destroy: function() {
        this.stopListening();
        this.$el.empty();
    }
});

var ListView = Template.extend({
    render: function() {
        Template.prototype.render.call(this);
        this.items = this.model.get("items").map(function(item) {
            var itemView = new this.itemViewType({ model: item });
            itemView.render();
            this.listenTo(itemView, "selected", this.itemSelected);
            return itemView;
        }, this);
        this.$el.find(".item-container").append(this.items.map(function(item) { return item.el; }));
    },
    itemSelected: function(model) {
        if (this.nextView) 
            this.nextView.destroy();
        this.nextView = new this.nextViewType({ model: model });
        if (model.get("loaded"))
            model.trigger("change")
        else
            model.fetch();
    },
    destroy: function() {
        if (this.nextView)
            this.nextView.destroy();
        if (this.items)
            this.items.forEach(function(item) { item.destroy(); });
        Template.prototype.destroy.call(this);
    }
});

var ListItem = Template.extend({
    events: { "click a": "itemClicked" },
    itemClicked: function(e) {
        e.preventDefault();
        this.trigger("selected", this.model);
    }
});

//
// View types
//

var TrackInfo = Template.extend({
    el: "#track",
    template: "#track-template",
});

var TrackList = ListView.extend({
    el: "#tracks",
    template: "#tracks-template",
    itemViewType: ListItem.extend({
        template: "#track-item-template"
    }),
    nextViewType: TrackInfo
});

var AlbumList = ListView.extend({
    el: "#albums",
    template: "#albums-template",
    itemViewType: ListItem.extend({
        template: "#album-item-template"
    }),
    nextViewType: TrackList
});

var ArtistList = ListView.extend({
    el: "#artists",
    template: "#artists-template",
    itemViewType: ListItem.extend({
        template: "#artist-item-template"
    }),
    nextViewType: AlbumList
});

var CollectionList = ListView.extend({
    el: "#collections",
    template: "#collections-template",
    itemViewType: ListItem.extend({ 
        template: "#collection-item-template" 
    }),
    nextViewType: ArtistList
})

var UserList = ListView.extend({
    el: "#users",
    template: "#users-template",
    itemViewType: ListItem.extend({ 
        template: "#user-item-template" 
    }),
    nextViewType: CollectionList
});

//
// ToggleButton
//

var ToggleButton = Backbone.View.extend({
    state: false,
    events: {
        "click": "buttonClicked"
    },
    initialize: function() {
        this.updateState();
    },
    buttonClicked: function(e) {
        this.state = !this.state;
        this.updateState();
        this.trigger("toggled");
    },
    updateState: function() {
        if (this.state) {
            this.$el.removeClass("toggle-false").addClass("toggle-true");
        }
        else {
            this.$el.removeClass("toggle-true").addClass("toggle-false");
        }
    }
});

//
// Controls
//

var Controls = Backbone.View.extend({
    initialize: function() {
        this.libraryButton = new ToggleButton({ el: "#library-button" });
        this.playlistButton = new ToggleButton({ el: "#playlist-button" });
        this.listenTo(this.libraryButton, "toggled", this.libraryToggled);
        this.listenTo(this.playlistButton, "toggled", this.playlistToggled);
    },
    libraryToggled: function() {
        if (this.libraryButton.state) {
            $("#browser").removeClass("invisible");
        }
        else {
            $("#browser").addClass("invisible");
        }
    }
});

/*
 * Application
 */

Application = function() {
    this.users = new Users({ url: "/mp3/u/" })
    this.users.fetch();

    this.userlist = new UserList({ model: this.users });

    this.controls = new Controls();
};

$(document).ready(function(e) {
    window.app = new Application();
});

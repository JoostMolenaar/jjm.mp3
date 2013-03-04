
//
// Class -- can't believe Backbone doesn't have this!
//

Backbone.Class = function() { }
Backbone.Class.extend = Backbone.Model.extend;

_.extend(Backbone.Class.prototype, Backbone.Events);

//
// MP3 namespace
//

MP3 = {
    Base: {},
    Components: {},
    Models: {},
    Views: {}
};

//
// Model base types 
//

MP3.Base.Resource = Backbone.Model.extend({
    url: function() {
        return this.get("url");
    },
    defaults: function() {
        return {
            loaded: false
        };
    },
    parse: function(obj) {
        obj.loaded = true;
        return obj;
    },
    fetch: function() {
        return this.get("loaded")
            ? $.Deferred().resolveWith(null, null, null).promise()
            : Backbone.Model.prototype.fetch.call(this);
    },
    dump: function() {
        obj = this.toJSON();
        console && console.log && console.log(JSON.stringify(obj));
        return obj;
    }
});

MP3.Base.CollectionResource = MP3.Base.Resource.extend({
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

//
// Model types
//

MP3.Models.Track = MP3.Base.Resource.extend();

MP3.Models.Album = MP3.Base.CollectionResource.extend({
    itemType: Backbone.Collection.extend({ model: MP3.Models.Track })
});

MP3.Models.Artist = MP3.Base.CollectionResource.extend({
    itemType: Backbone.Collection.extend({ model: MP3.Models.Album })
});

MP3.Models.Collection = MP3.Base.CollectionResource.extend({
    itemType: Backbone.Collection.extend({ model: MP3.Models.Artist })
});

MP3.Models.Library = MP3.Base.CollectionResource.extend({
    itemType: Backbone.Collection.extend({ model: MP3.Models.Collection })
});

MP3.Models.Users = MP3.Base.CollectionResource.extend({
    itemType: Backbone.Collection.extend({ model: MP3.Models.Library })
});

//
// Base view types
//

MP3.Base.Template = Backbone.View.extend({
    initialize: function() {
        this.template = $(this.template).text();
        this.listenTo(this.model, "change", this.render);
    },
    format: function(obj) {
        return obj;
    },
    render: function() {
        var obj = this.format(this.model.toJSON());
        var html = Mustache.render(this.template, obj);
        this.$el.html(html);
        return this;
    },
    destroy: function() {
        this.stopListening();
        this.$el.empty();
    }
});

MP3.Base.ListView = MP3.Base.Template.extend({
    render: function() {
        MP3.Base.Template.prototype.render.call(this);
        this.items = this.model.get("items").map(function(item) {
            var itemView = new this.itemViewType({ model: item });
            itemView.render();
            this.listenTo(itemView, "all", function() {
                var args = _.initial(arguments, 0);
                args.splice(1, 0, this);
                this.trigger.apply(this, args);
            });
            return itemView;
        }, this);
        this.$el.find(".item-container").append(this.items.map(function(item) { return item.el; }));
    },
    destroy: function() {
        if (this.items) {
            this.items.forEach(function(item) { item.destroy(); });
        }
        MP3.Base.Template.prototype.destroy.call(this);
    }
});

MP3.Base.ListItem = MP3.Base.Template.extend({
    events: function() {
        return {
            "click a": "itemClicked"
        };
    },
    itemClicked: function(e) {
        e.preventDefault();
        this.trigger("select", this.model);
    }
});

//
// View types
//

MP3.Views.TrackInfo = MP3.Base.Template.extend({
    el: "#track",
    template: "#track-template",
    format: function(obj) {
        obj.length = Math.floor(obj.length);
        obj.bitrate = Math.floor(obj.bitrate / 1000);
        return obj;
    }
});

MP3.Views.TrackList = MP3.Base.ListView.extend({
    el: "#tracks",
    template: "#tracks-template",
    itemViewType: MP3.Base.ListItem.extend({
        template: "#track-item-template",
        events: function() {
            return _.extend(MP3.Base.ListItem.prototype.events.call(this), {
                "click .button": "add"
            });
        },
        add: function(e) {
            this.trigger("addTrack", this.model);
        }
    }),
    nextViewType: MP3.Views.TrackInfo
});

MP3.Views.AlbumList = MP3.Base.ListView.extend({
    el: "#albums",
    template: "#albums-template",
    itemViewType: MP3.Base.ListItem.extend({
        template: "#album-item-template",
        events: function() {
            return _.extend(MP3.Base.ListItem.prototype.events.call(this), {
                "click .button": "add"
            });
        },
        add: function(e) {
            this.model
                .fetch()
                .done(function() {
                    //this.trigger("addAlbum", this.model)
                    // TODO : add API support for eager loading instead of abusing deferreds like this
                    $.when
                        .apply(this, this.model.get("items").map(function(item) { return item.fetch(); }))
                        .done(function() {
                            this.trigger("addAlbum", this.model);
                        }.bind(this));
                }.bind(this));
        }
    }),
    nextViewType: MP3.Views.TrackList
});

MP3.Views.ArtistList = MP3.Base.ListView.extend({
    el: "#artists",
    template: "#artists-template",
    itemViewType: MP3.Base.ListItem.extend({
        template: "#artist-item-template"
    }),
    nextViewType: MP3.Views.AlbumList
});

MP3.Views.CollectionList = MP3.Base.ListView.extend({
    el: "#collections",
    template: "#collections-template",
    itemViewType: MP3.Base.ListItem.extend({ 
        template: "#collection-item-template" 
    }),
    nextViewType: MP3.Views.ArtistList
});

MP3.Views.UserList = MP3.Base.ListView.extend({
    el: "#users",
    template: "#users-template",
    itemViewType: MP3.Base.ListItem.extend({ 
        template: "#user-item-template" 
    }),
    nextViewType: MP3.Views.CollectionList
});

//
// Browser
//

MP3.Components.Browser = Backbone.Class.extend({
    constructor: function(users) {
        this.views = _.chain([
            new MP3.Views.UserList({ model: users }) 
        ]);
        this.hookEvents(this.views.first().value());
    },
    hookEvents: function(view) {
        this.listenTo(view, "select", this.displayPanel);
        this.listenTo(view, "addAlbum", this.addAlbum);
        this.listenTo(view, "addTrack", this.addTrack);
    },
    displayPanel: function(listView, model) {
        this.destroyAfter(listView);
        this.views.push(new listView.nextViewType({ model: model }));
        this.hookEvents(this.views.last().value());
        model
            .fetch()
            .done(function(data, textStatus, jqXHR) {
                if (!jqXHR) {
                    model.trigger("change");
                }
            });
    },
    destroyAfter: function(listView) {
        var i = this.views.indexOf(listView).value();
        this.views
            .tail(i+1)
            .each(function(view) {
                this.stopListening(view);
                view.destroy();
            }, this);
        this.views = this.views.head(i+1);
    },
    addAlbum: function(listView, model) {
        console.log("addAlbum", model.toJSON());
    },
    addTrack: function(listView, model) {
        console.log("addTrack", model.toJSON());
    }
});

//
// ToggleButton
//

MP3.Base.ToggleButton = Backbone.View.extend({
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

MP3.Components.Controls = Backbone.Class.extend({
    constructor: function() {
        this.libraryButton = new MP3.Base.ToggleButton({ el: "#library-button" });
        this.playlistButton = new MP3.Base.ToggleButton({ el: "#playlist-button" });
        this.listenTo(this.libraryButton, "toggled", this.libraryToggled);
        this.listenTo(this.playlistButton, "toggled", this.playlistToggled);
    },
    libraryToggled: function() {
        if (this.libraryButton.state) {
            $("#main-panel").addClass("browser-visible");
        }
        else {
            $("#main-panel").removeClass("browser-visible");
        }
    },
    playlistToggled: function() {
        if (this.playlistButton.state) {
            $("#main-panel").addClass("playlist-visible");
        }
        else {
            $("#main-panel").removeClass("playlist-visible");
        }
    }
});

//
// Application
//

MP3.Application = Backbone.Class.extend({
    constructor: function() {
        this.users = new MP3.Models.Users({ url: "/mp3/u/" })
        this.users.fetch();

        this.browser = new MP3.Components.Browser(this.users);
        this.controls = new MP3.Components.Controls();
    }
});

//
// Fire it up
//

var app = null;

$(document).ready(function(e) {
    app = new MP3.Application();
});

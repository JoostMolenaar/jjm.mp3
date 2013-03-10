mp3.components.Browser = Backbone.Class.extend({
    constructor: function(users) {
        this.views = _.chain([
            new mp3.views.UserList({ model: users }) 
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

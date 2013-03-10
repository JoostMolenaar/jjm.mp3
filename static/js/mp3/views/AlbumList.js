mp3.views.AlbumList = mp3.base.ListView.extend({
    el: "#albums",
    template: "#albums-template",
    itemViewType: mp3.base.ListItem.extend({
        template: "#album-item-template",
        events: function() {
            return _.extend(mp3.base.ListItem.prototype.events.call(this), {
                "click .button": "add"
            });
        },
        add: function(e) {
            this.model
                .fetch()
                .done(function() {
                    $.when
                        .apply(this, this.model.get("items").map(function(item) { return item.fetch(); }))
                        .done(function() {
                            this.trigger("addAlbum", this.model);
                        }.bind(this));
                }.bind(this));
        }
    }),
    nextViewType: mp3.views.TrackList
});

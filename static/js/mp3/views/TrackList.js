mp3.views.TrackList = mp3.base.ListView.extend({
    el: "#tracks",
    template: "#tracks-template",
    itemViewType: mp3.base.ListItem.extend({
        template: "#track-item-template",
        events: function() {
            return _.extend(mp3.base.ListItem.prototype.events.call(this), {
                "click .button": "add"
            });
        },
        add: function(e) {
            this.trigger("addTrack", this.model);
        }
    }),
    nextViewType: mp3.views.TrackInfo
});


mp3.base.ListItem = mp3.base.Template.extend({
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

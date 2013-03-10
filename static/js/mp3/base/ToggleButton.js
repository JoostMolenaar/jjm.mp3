mp3.base.ToggleButton = Backbone.View.extend({
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

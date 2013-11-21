mp3.view.ToggleButton = Object.extend({
    constructor: function(selector, initialState) {
        this.toggled = new mp3.Event();
        this._state = !!initialState;
        this.$button = $(selector)
            .click(function(e) { 
                this.state = !this.state;
                this.toggled.trigger(this.state);
            }.bind(this));
    },
    state: {
        get: function() {
            return this._state;
        },
        set: function(state) {
            this._state = state;
            this.$button
                .removeClass(state ? "toggle-false" : "toggle-true")
                .addClass(state ? "toggle-true" : "toggle-false");
        }
    }
});

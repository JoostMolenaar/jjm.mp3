mp3.viewmodel.Controls = Object.extend({
    constructor: function() {
        this.propertyChanged = new mp3.Event();
        this._state = "stopped";
    },
    state: {
        get: function() {
            return this._state;
        },
        set: function(value) {
            this._state = value;
            this.propertyChanged.trigger("state", value);
        }
    }
});

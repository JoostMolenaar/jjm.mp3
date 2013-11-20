mp3.viewmodel.Controls = Object.extend({
    constructor: function() {
        this.propertyChanged = new mp3.Event();
        this._state = "stopped";
    },
    _get_state: function() {
        return this._state;
    },
    _set_state: function(v) {
        this._state = v;
        this.propertyChanged.trigger("state", v);
    }
});

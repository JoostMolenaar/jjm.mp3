mp3.StateMachine = Object.extend({
    constructor: function(states, initial) {
        this._value = initial;
        this._states = states;
        this.changed = new mp3.Event();
    },
    value: {
        get: function() {
            return this._value;
        },
        set: function(value) {
            if (Object.keys(this._states).indexOf(value) == -1) {
                throw "Illegal state: " + value;
            }
            if (this._value && this._states[this._value].indexOf(value) == -1) {
                throw "Illegal state transition from " + this._value + " to " + value;
            }
            this._value = value;
            this.changed.trigger(this._value);
        }
    },
    hasValue: function(states) {
        return states.indexOf(this.value) > -1;
    }
});

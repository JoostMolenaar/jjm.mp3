mp3.Event = Object.extend({
    constructor: function() {
        this.listeners = [];
    },
    listen: function(handler, context) {
        this.listeners.push({ handler: handler, context: context });
    },
    trigger: function() {
        var args = Array.prototype.slice.call(arguments);
        window.setTimeout(function() {
            for (var i = 0; i < this.listeners.length; i++) {
                this.listeners[i].handler.apply(this.listeners[i].context, args);
            }    
        }.bind(this), 0);
    }
});

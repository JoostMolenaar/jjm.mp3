mp3.Event = Object.extend({
    constructor: function() {
        this.listeners = [];
    },
    listen: function(handler, context) {
        this.listeners.push({ handler: handler, context: context });
    },
    trigger: function() {
        for (var i = 0; i < this.listeners.length; i++) {
            window.setTimeout((function(listener, args) {
                return function(e) {
                    listener.handler.apply(listener.context, args);
                };
            })(this.listeners[i], Array.prototype.slice.call(arguments)), 0);
        }
    }
});

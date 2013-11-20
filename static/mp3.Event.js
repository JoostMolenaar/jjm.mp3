mp3.Event = Object.extend({
    constructor: function() {
        this.listeners = [];
    },
    listen: function(handler, context) {
        this.listeners.push({ handler: handler, context: context });
    },
    trigger: function() {
        //for (var i = 0; i < this.listeners.length; i++) {
        //    window.setTimeout((function(listener, args) {
        //        return function(e) {
        //            listener.handler.apply(listener.context, args);
        //        };
        //    })(this.listeners[i], Array.prototype.slice.call(arguments)), 0);
        //}
        var args = Array.prototype.slice.call(arguments);
        window.setTimeout(function() {
            for (var i = 0; i < this.listeners.length; i++) {
                this.listeners[i].handler.apply(this.listeners[i].context, args);
            }    
        }.bind(this), 0);
    }
});

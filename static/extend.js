Function.prototype.extend = function(attrs) {
    var ctor = attrs.constructor;
    ctor.prototype = Object.create(this.prototype);
    ctor.prototype.constructor = ctor;
    ctor.prototype.__super__ = this;
    for (var key in attrs) {
        var staticFunc = /^_static_(.*)$/.exec(key)
        if (typeof attrs[key] == "object") {
            Object.defineProperty(ctor.prototype, key, attrs[key]);
        } 
        else if (staticFunc) {
            ctor[staticFunc[1]] = attrs[key];
        } 
        else {
            ctor.prototype[key] = attrs[key];
        }
    }
    return ctor;
};


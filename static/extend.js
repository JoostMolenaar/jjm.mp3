Function.prototype.extend = function(attrs, statics) {
    var ctor = attrs.constructor;
    ctor.prototype = Object.create(this.prototype);
    ctor.prototype.constructor = ctor;
    ctor.prototype.__super__ = this;
    for (var key in attrs) {
        var setter = /^_set_(.*)$/.exec(key)
        var getter = /^_get_(.*)$/.exec(key)
        if (setter) {
            ctor.prototype.__defineSetter__(setter[1], attrs[key]);
        } else if (getter) {
            ctor.prototype.__defineGetter__(getter[1], attrs[key]);
        } else {
            ctor.prototype[key] = attrs[key];
        }
    }
    statics = statics || {}
    for (var key in statics) {
        ctor[key] = statics[key];
    }
    return ctor;
};


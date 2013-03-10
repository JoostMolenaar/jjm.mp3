mp3.base.Resource = Backbone.Model.extend({
    url: function() {
        return this.get("url");
    },
    defaults: function() {
        return {
            loaded: false
        };
    },
    parse: function(obj) {
        obj.loaded = true;
        return obj;
    },
    fetch: function() {
        return this.get("loaded")
            ? $.Deferred().resolveWith(null, null, null).promise()
            : Backbone.Model.prototype.fetch.call(this);
    },
    dump: function() {
        obj = this.toJSON();
        console && console.log && console.log(JSON.stringify(obj));
        return obj;
    }
});

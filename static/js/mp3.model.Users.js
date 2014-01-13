mp3.model.Users = Object.extend({
    constructor: function() {
        this.users = {
            name: "Users",
            url: "u/",
            loaded: false,
            fetch: this._fetch
        };
    },
    _fetch: function() {
        if (this.loaded) {
            return $.Deferred().resolveWith(this).promise();
        }
        else {
            console.log(this.url, "(fetch)");
            var deferred = $.Deferred();
            jQuery
                .get(this.url)
                .done(function(data) {
                    Object.keys(data).forEach(function(k) {
                        this[k] = data[k];
                    }.bind(this));
                    if (this.items) {
                        this.items.forEach(function(item) {
                            item.loaded = false;
                            item.fetch = this.fetch;
                        }.bind(this));
                    }
                    this.loaded = true;
                    deferred.resolveWith(this);
                 }.bind(this));
            return deferred.promise();
        }
    }
});

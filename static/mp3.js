var Reference = Backbone.Model.extend({
    defaults: function() {
        return {
            href: null,
            text: null
        };
    }
});

var ReferenceList = Backbone.Collection.extend({
    model: Reference
});

var Users = Backbone.Model.extend({
    defaults: function() {
        return {
            items: new ReferenceList()
        };
    },

    parse: function(obj) {
        this.get("items").reset(obj.items);
    },

    url: function() { 
        return "/mp3/u/";
    }
});

var Library = Backbone.Model.extend({
    defaults: function() {
        return {
            items: new ReferenceList()
        };
    },

    parse: function(obj) {
        this.get("items").reset(obj.items);
    }
});

USERS = new Users();
USERS.fetch({ 
    success: function() { 
        console.log("ok");
        console.log(USERS.get("items").get("joost").toJSON());
    }
});

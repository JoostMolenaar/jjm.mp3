
mp3.Application = Backbone.Class.extend({
    constructor: function() {
        this.users = new mp3.models.Users({ url: "/mp3/u/" })
        this.users.fetch();

        this.browser = new mp3.components.Browser(this.users);
        this.controls = new mp3.components.Controls();
    }
});



//
// Class -- can't believe Backbone doesn't have this!
//

Backbone.Class = function() { }
Backbone.Class.extend = Backbone.Model.extend;

_.extend(Backbone.Class.prototype, Backbone.Events);

//
// MP3 namespace
//

mp3 = {
    base: {},
    components: {},
    models: {},
    views: {}
};

//
// Fire it up
//

var app = null;

$(document).ready(function(e) {
    app = new mp3.Application();
});


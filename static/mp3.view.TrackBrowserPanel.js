mp3.view.TrackBrowserPanel = mp3.view.BrowserPanel.extend({
    constructor: function() {
        this.__super__.prototype.constructor.apply(this, arguments);
    },
    addItem: function($container, item) {
        $("<div/>")
            .append("<b>foo</b>");
    }
});


mp3.view.TrackBrowserPanel = mp3.view.BrowserPanel.extend({
    constructor: function(selector) {
        this.__super__.prototype.constructor.call(this, selector);
    },
    addItem: function($container, item) {
        $("<div/>")
            .append("<b>foo</b>")
            .appendTo($container);
    }
});


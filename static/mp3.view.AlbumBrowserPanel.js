mp3.view.AlbumBrowserPanel = mp3.view.BrowserPanel.extend({
    constructor: function() {
        this.__super__.prototype.constructor.apply(this, arguments);
        this.$panel
            .delegate(".item-container .button", "click", function(e) {
                var item = $(e.target).data("item");
                this.addTrack.trigger(item);
            }.bind(this));
        this.addTrack = new mp3.Event();
    },
    addItem: function($container, item) {
        $("<div><a/><div/></div>")
            .find("a")
                .attr("href", item.url)
                .text(item.name)
                .data("item", item)
            .end()
            .find("div")
                .attr("class", "button")
                .text("+")
                .data("item", item)
            .end()
            .appendTo($container);
    }
});

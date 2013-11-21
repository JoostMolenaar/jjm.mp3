mp3.view.ArtistBrowserPanel = mp3.view.BrowserPanel.extend({
    constructor: function() {
        this.__super__.prototype.constructor.apply(this, arguments);
        this.$panel
            .delegate(".item-container .button", "click", function(e) {
                var item = $(e.target).data("item");
                this.addAlbum.trigger(item);
            }.bind(this));
        this.addAlbum = new mp3.Event();
    },
    addItem: function($container, item) {
        $("<div><img/><a/><div/></div>")
            .find("img")
                .attr("src", item.cover_url)
                .attr("width", 75)
                .attr("height", 75)
            .end()
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

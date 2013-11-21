mp3.view.BrowserPanel = Object.extend({
    constructor: function(selector) {
        this.$panel = $(selector)
            .delegate(".item-container a", "click", function(e) {
                e.preventDefault();
                this.select.trigger($(e.target).data("item"));
            }.bind(this));
        this.select = new mp3.Event();
    },
    setData: function(data) {
        this.$panel
            .css("display", data ? "block" : "none")
            .find("h1")
                .text(data ? data.name : "")
            .end()
            .find(".item-container")
                .empty()
                .each(function(i, div) {
                    if (data && data.items) {
                        $.each(data.items, function(i, item) {
                            this.addItem($(div), item);
                        }.bind(this));
                    }
                }.bind(this))
            .end();
    },
    addItem: function($container, item) {
        $("<div><a/></div>")
            .find("a")
                .attr("href", item.url)
                .text(item.name)
                .data("item", item)
            .end()
            .appendTo($container);
    }
});

mp3.base.ListView = mp3.base.Template.extend({
    render: function() {
        mp3.base.Template.prototype.render.call(this);
        this.items = this.model.get("items").map(function(item) {
            var itemView = new this.itemViewType({ model: item });
            itemView.render();
            this.listenTo(itemView, "all", function() {
                var args = _.initial(arguments, 0);
                args.splice(1, 0, this);
                this.trigger.apply(this, args);
            });
            return itemView;
        }, this);
        this.$el.find(".item-container").append(this.items.map(function(item) { return item.el; }));
    },
    destroy: function() {
        if (this.items) {
            this.items.forEach(function(item) { item.destroy(); });
        }
        mp3.base.Template.prototype.destroy.call(this);
    }
});

mp3.base.Template = Backbone.View.extend({
    initialize: function() {
        this.template = $(this.template).text();
        this.listenTo(this.model, "change", this.render);
    },
    format: function(obj) {
        return obj;
    },
    render: function() {
        var obj = this.format(this.model.toJSON());
        var html = Mustache.render(this.template, obj);
        this.$el.html(html);
        return this;
    },
    destroy: function() {
        this.stopListening();
        this.$el.empty();
    }
});

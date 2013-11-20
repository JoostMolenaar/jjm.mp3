mp3.view.Panel = Object.extend({
    constructor: function(selector) {
        this.$panel = $(selector);
    },
    _set_isVisible: function(isVisible) {
        this.$panel.css("display", isVisible ? "block" : "none");
    }
});

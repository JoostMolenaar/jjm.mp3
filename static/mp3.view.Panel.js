mp3.view.Panel = Object.extend({
    constructor: function(selector) {
        this.$panel = $(selector);
    },
    isVisible: {
        set: function(isVisible) {
            this.$panel.css("display", isVisible ? "block" : "none");
        }
    }
});

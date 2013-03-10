mp3.views.TrackInfo = mp3.base.Template.extend({
    el: "#track",
    template: "#track-template",
    format: function(obj) {
        obj.length = Math.floor(obj.length);
        obj.bitrate = Math.floor(obj.bitrate / 1000);
        return obj;
    }
});

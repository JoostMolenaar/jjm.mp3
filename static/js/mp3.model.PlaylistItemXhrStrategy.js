mp3.model.PlaylistItemXhrStrategy = Object.extend({
    constructor: function(item) {
        this.item = item;
    },
    load: function() {
        console.log(this.item.track.url, "(XHR load)");
        var self = this;
        return self
            .downloadArrayBuffer(self.item.track.mp3_url)
            .then(function(array) {
                return self.decodeAudio(array);
            })
            .then(function(buffer) {
                return self.createBufferSource(buffer);
            });
    },
    unload: function() {
        this.item.source.disconnect();
        this.item.source.onended = null;
        this.item.source = null;
        this.item.buffer = null;
    },
    play: function() {
        this.item.source.start(0, this.item.startAt);
        this.item.startedAt = this.item.playlist.context.currentTime - this.item.startAt;
    },
    stop: function() {
        if (this.item.source) {
            this.item.source.stop(0);
        }
        this.item.startAt = 0;
    },
    pause: function() {
        this.item.source.stop(0);
        this.item.startAt = this.item.playlist.context.currentTime - this.item.startedAt;
    },
    downloadArrayBuffer: function(url) {
        console.log(this.item.track.url, "(downloadArrayBuffer)");
        var deferred = $.Deferred();
        var xhr = new XMLHttpRequest();
        xhr.open("GET", url, true);
        xhr.responseType = "arraybuffer";
        xhr.send();
        xhr.onreadystatechange = function() {
            if (xhr.readyState == XMLHttpRequest.DONE) {
                if (xhr.status == 200) {
                    deferred.resolve(xhr.response);
                }
                else {
                    deferred.reject("error from downloadArrayBuffer");
                }
            }
        };
        return deferred.promise();
    },
    decodeAudio: function(array) {
        console.log(this.item.track.url, "(decodeAudioData)");
        var deferred = $.Deferred();
        this.item.playlist.context.decodeAudioData(array, function(buffer) {
            deferred.resolve(buffer);
        }, function() {
            deferred.reject("error from decodeAudioData");
        });
        return deferred.promise();
    },
    createBufferSource: function(buffer) {
        console.log(this.item.track.url, "(createBufferSource)");
        this.item.buffer = buffer;
        this.item.source = this.item.playlist.context.createBufferSource();
        this.item.source.buffer = this.item.buffer;
        this.item.source.connect(this.item.playlist.output);
        this.item.source.onended = function(e) {
            if (this.item.state.value == "play") {
                this.item.state.value = "end";
            }
            this.unload();
            if (this.item.state.hasValue(["pause","stop"])) {
                this.createBufferSource(buffer);
            }
        }.bind(this);
        this.item.state.value = "ready";
    }
});

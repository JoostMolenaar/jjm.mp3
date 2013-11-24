mp3.view.Analysis = Object.extend({
    constructor: function(selector, playlist) {
        this.$canvas = $(selector);
        this.context = this.$canvas[0].getContext("2d");

        this.playlist = playlist;

        this.last = 0;

        this.playlist.output.fftSize = 256;
        this.size = this.playlist.output.frequencyBinCount;
        this.data = new Uint8Array(this.size);

        this.animate = this.animate.bind(this);
        this.drawLinear = this.drawLinear.bind(this);
        this.drawLog1 = this.drawLog1.bind(this);
        this.draw = this.drawLinear;

        this.frequency = 60;

        window.requestAnimationFrame(this.animate);
    },
    animate: function(t) {
        if ((this.width != this.$canvas.width()) || (this.height != this.$canvas.height())) {
            this.width = this.$canvas.width();
            this.height = this.$canvas.height();
            this.$canvas
                .prop("width", this.width)
                .prop("height", this.height);
        }

        if ((t - this.last) >= (1000 / this.frequency)) {
            this.last = t;

            this.playlist.output.getByteFrequencyData(this.data);

            var image = this.context.getImageData(0, 0, this.width, this.height);
            this.context.clearRect(0, 0, this.width, this.height);       
            this.context.putImageData(image, -1, 0);

            this.draw();
        }

        window.requestAnimationFrame(this.animate);
    },
    drawLinear: function() {
        for (var i = 0; i < this.size; i++) {
            var v = 255 - this.data[i];
            this.context.fillStyle = "rgb(" + v + "," + v + "," + v + ")";
            this.context.fillRect(this.width - 1, this.height - i, 1, 1); 
        };
    },
    drawLog1: function() {
        for (var i = 0; i < this.size; i++) {
            var v = 255 - this.data[i];
            this.context.fillStyle = "rgb(" + v + "," + v + "," + v + ")";
            var y1 = (Math.log(i+1) / Math.log(this.size+1) * this.size);
            var y2 = (Math.log(i+2) / Math.log(this.size+2) * this.size);
            this.context.fillRect(this.width - 1, this.height - y2, 1, y2 - y1 + 1);
        };
    },
    drawLog2: function() {
    }
});


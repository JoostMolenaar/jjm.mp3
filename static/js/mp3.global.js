/*
 * globals
 */

var mp3 = {
        model: {},
        viewmodel: {},
        view: {}
    },
    app = null;

/*
 * duck punches
 */

window.AudioContext = window.AudioContext 
                   || window.webkitAudioContext;

window.requestAnimationFrame = window.requestAnimationFrame
                            || window.webkitRequestAnimationFrame;

Math.logn = function(n, m) { return Math.log(n) / Math.log(m); }

Math.log2  = function(n) { return Math.logn(n, 2); }
Math.log10 = function(n) { return Math.logn(n, 10); }

Array.prototype.contains = function(obj) {
    return this.some(function(item) { return item == obj; }); 
};

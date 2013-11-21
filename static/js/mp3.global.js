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


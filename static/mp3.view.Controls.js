mp3.view.Controls = Object.extend({
    constructor: function(selector, controlsViewModel) {
        this.controlsViewModel = controlsViewModel;
        this.controlsViewModel.propertyChanged.listen(function(name, state) {
            if (name == "state") {
                this.$controls
                    .find("#stopped-button")
                        .removeClass("toggle-true")
                        .addClass("toggle-false")
                    .end()
                    .find("#playing-button")
                        .removeClass("toggle-true")
                        .addClass("toggle-false")
                    .end()
                    .find("#paused-button")
                        .removeClass("toggle-true")
                        .addClass("toggle-false")
                    .end()
                    .find("#" + state + "-button")
                        .removeClass(state ? "toggle-false" : "toggle-true")
                        .addClass(state ? "toggle-true" : "toggle-false")
                    .end();
            }
        }, this);

        this.$controls = $(selector)
            .find("#playing-button")
                .click(function(e) { 
                    controlsViewModel.state = "playing";
                })
            .end()
            .find("#stopped-button")
                .click(function(e) { 
                    controlsViewModel.state = "stopped";
                })
            .end()
            .find("#paused-button")
                .click(function(e) { 
                    controlsViewModel.state = "paused";
                })
            .end();
    }
});

app.service('MouseTracker', [function() {

    var self = this;

    self.x = null;
    self.y = null;

    document.addEventListener('mousemove', onMouseUpdate, false);
    document.addEventListener('mouseenter', onMouseUpdate, false);

    function onMouseUpdate(e) {
        self.x = e.pageX;
        self.y = e.pageY;
    }

    return {
        getMouseX: function() {
            return self.x;
        },
        getMouseY: function() {
            return self.y;
        },
    }
}]);

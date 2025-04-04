app.service('ImageGenerator', ['DrawService',
    function(DrawService) {

    this.generate = function(onFinish) {

        DrawService.fit(DrawService.FitEnum.FIT_HORIZONTALLY);
        DrawService.render(true);

        window.scrollTo(0, 0);

        // Get svg markup as string
        var element = document.getElementById('svg-canvas-export');
        var svg = element.innerHTML;
        var svgWidth = element.firstChild.getAttribute("width");
        var svgHeight = element.firstChild.getAttribute("height");

        if (svg) {
            svg = svg.replace(/\r?\n|\r/g, '').trim();
        }

        var canvas = document.createElement('canvas');
        canvg(canvas, svg);

        function getClippedRegion(image, x, y, width, height) {
            var canvas = document.createElement('canvas'), ctx = canvas.getContext('2d');
            canvas.width = width;
            canvas.height = height;
            ctx.drawImage(image, x, y, width, height, 0, 0, width, height);
            return canvas;
        }

        var imgData;

        var clip = getClippedRegion(canvas, 0, 0, Math.round(svgWidth), Math.round(svgHeight));
        imgData = clip.toDataURL('image/jpeg');

        DrawService.fit(DrawService.FitEnum.FIT_ALL);
        DrawService.clear("svg-canvas-export");

        onFinish(imgData);
    }

}]);
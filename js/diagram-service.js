app.factory('DrawService', ['TilingData', '$window', '$timeout', '$translate', 'ToastService',
    function(TilingData, $window, $timeout, $translate, ToastService) {

    var self = this;

    var FitEnum = Object.freeze({"FIT_ALL": 1, "FIT_HORIZONTALLY": 2, "FIT_VERTICALLY": 3});

    var fit = FitEnum.FIT_ALL;

    const lockIconPath = "M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM9 6c0-1.66 1.34-3 3-3s3 1.34 3 3v2H9V6zm9 14H6V10h12v10zm-6-3c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z";
    const lockOpenIconPath = "M12 17c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm6-9h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6h1.9c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm0 12H6V10h12v10z";
    const panAndZoom = "M10 9h4V6h3l-5-5-5 5h3v3zm-1 1H6V7l-5 5 5 5v-3h3v-4zm14 2l-5-5v3h-3v4h3v3l5-5zm-9 3h-4v3H7l5 5 5-5h-3v-3z";
    const zoomInIconPath = 'M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14zm.5-7H9v2H7v1h2v2h1v-2h2V9h-2z';
    const zoomOutIconPath = 'M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14zM7 9h5v1H7V9z';
    const zoomResetIconPath = "M17.01 14h-.8l-.27-.27c.98-1.14 1.57-2.61 1.57-4.23 0-3.59-2.91-6.5-6.5-6.5s-6.5 3-6.5 6.5H2l3.84 4 4.16-4H6.51C6.51 7 8.53 5 11.01 5s4.5 2.01 4.5 4.5c0 2.48-2.02 4.5-4.5 4.5-.65 0-1.26-.14-1.82-.38L7.71 15.1c.97.57 2.09.9 3.3.9 1.61 0 3.08-.59 4.22-1.57l.27.27v.79l5.01 4.99L22 19l-4.99-5z";
    const increaseTextSizeIconPath = "M9.67673749 15.40260198C8.13307099 15.40260198 6.58940399 15.40260198 5.04573749 15.40260198C4.66190414 16.83776848 4.27807084 18.27293548 3.89423749 19.70810198C2.63857084 19.70810198 1.38290414 19.70810198 0.12723749 19.70810198C1.76673749 14.37610198 3.40623749 9.04410198 5.04573749 3.71210198C6.64523749 3.71210198 8.24473749 3.71210198 9.84423749 3.71210198C11.23023749 8.11276848 12.61623749 12.51343548 14.00223749 16.91410198C14.90790399 14.01060198 15.81357099 11.10710198 16.71923749 8.20360198C17.88257099 8.20360198 19.04590399 8.20360198 20.20923749 8.20360198C21.43057099 12.03976848 22.65190399 15.87593548 23.87323749 19.71210198C22.91373749 19.71210198 21.95423749 19.71210198 20.99473749 19.71210198C20.69223749 18.66826848 20.38973749 17.62443548 20.08723749 16.58060198C18.96457099 16.58060198 17.84190399 16.58060198 16.71923749 16.58060198C16.44007099 17.62443548 16.16090399 18.66826848 15.88173749 19.71210198C14.22923749 19.71075198 12.57673749 19.70945198 10.92423749 19.70810198C10.50840399 18.27293548 10.09257099 16.83776848 9.67673749 15.40260198C9.67673749 15.40260198 9.67673749 15.40260198 9.67673749 15.40260198M5.57373749 12.80110198C6.76540399 12.80110198 7.95707099 12.80110198 9.14873749 12.80110198C8.51113499 10.64676798 7.84811199 8.49864848 7.32523749 6.31260198C7.15780249 6.55174798 7.15061649 6.99275798 7.04498399 7.30975548C6.64221949 9.16379198 6.09327099 10.97772248 5.57373749 12.80110198C5.57373749 12.80110198 5.57373749 12.80110198 5.57373749 12.80110198M17.10323749 14.68910198C17.96990399 14.68910198 18.83657099 14.68910198 19.70323749 14.68910198C19.23921399 13.12255498 18.75728049 11.56036598 18.37723749 9.97060198C18.19679149 10.39107198 18.13751899 10.95927448 17.99782349 11.43577448C17.74675999 12.53263148 17.40301799 13.60505098 17.10323749 14.68910198C17.10323749 14.68910198 17.10323749 14.68910198 17.10323749 14.68910198M15.34723749 3.71210198C17.34723749 3.71210198 19.34723749 3.71210198 21.34723749 3.71210198C20.34723749 4.71210198 19.34723749 5.71210198 18.34723749 6.71210198C17.34723749 5.71210198 16.34723749 4.71210198 15.34723749 3.71210198C15.34723749 3.71210198 15.34723749 3.71210198 15.34723749 3.71210198";
    const decreaseFontSizeIconPath = "M14.3237375 15.402602C14.3237375 15.402602 18.9547375 15.402602 18.9547375 15.402602C18.9547375 15.402602 20.1062375 19.708102 20.1062375 19.708102C20.1062375 19.708102 23.87323751 19.708102 23.87323751 19.708102C23.87323751 19.708102 18.9547375 3.712102 18.9547375 3.712102C18.9547375 3.712102 14.1562375 3.712102 14.1562375 3.712102C14.1562375 3.712102 9.998238 16.914102 9.998238 16.914102C9.998238 16.914102 7.281238 8.203602 7.281238 8.203602C7.281238 8.203602 3.791238 8.203602 3.791238 8.203602C3.791238 8.203602 0.127238 19.712102 0.127238 19.712102C0.127238 19.712102 3.005738 19.712102 3.005738 19.712102C3.005738 19.712102 3.913238 16.580602 3.913238 16.580602C3.913238 16.580602 7.281238 16.580602 7.281238 16.580602C7.281238 16.580602 8.118738 19.712102 8.118738 19.712102C9.771238 19.710702 11.423738 19.709402 13.076238 19.708102C13.076238 19.708102 14.3237375 15.402602 14.3237375 15.402602C14.3237375 15.402602 14.3237375 15.402602 14.3237375 15.402602M18.4267375 12.801102C18.4267375 12.801102 14.8517375 12.801102 14.8517375 12.801102C15.48934 10.646768 16.152363 8.4986485 16.6752375 6.312602C16.8426725 6.551748 16.8498585 6.992758 16.955491 7.3097555C17.3582555 9.163792 17.907204 10.977722 18.4267375 12.801102C18.4267375 12.801102 18.4267375 12.801102 18.4267375 12.801102M6.897238 14.689102C6.897238 14.689102 4.297238 14.689102 4.297238 14.689102C4.761261 13.122555 5.243195 11.560366 5.623238 9.970602C5.803684 10.391072 5.862956 10.959274 6.002652 11.435774C6.253715 12.532631 6.597457 13.605051 6.897238 14.689102C6.897238 14.689102 6.897238 14.689102 6.897238 14.689102M8.653238 6.6188817C8.653238 6.6188817 2.653238 6.6188817 2.653238 6.6188817C2.653238 6.6188817 5.653238 3.6188817 5.653238 3.6188817C5.653238 3.6188817 8.653238 6.6188817 8.653238 6.6188817C8.653238 6.6188817 8.653238 6.6188817 8.653238 6.6188817";
    const colors = "M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01-.23-.26-.38-.61-.38-.99 0-.83.67-1.5 1.5-1.5H16c2.76 0 5-2.24 5-5 0-4.42-4.03-8-9-8zm-5.5 9c-.83 0-1.5-.67-1.5-1.5S5.67 9 6.5 9 8 9.67 8 10.5 7.33 12 6.5 12zm3-4C8.67 8 8 7.33 8 6.5S8.67 5 9.5 5s1.5.67 1.5 1.5S10.33 8 9.5 8zm5 0c-.83 0-1.5-.67-1.5-1.5S13.67 5 14.5 5s1.5.67 1.5 1.5S15.33 8 14.5 8zm3 4c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z";
    const cutOrder = "M18 17h2v.5h-1v1h1v.5h-2v1h3v-4h-3zm1-9h1V4h-2v1h1zm-1 3h1.8L18 13.1v.9h3v-1h-1.8l1.8-2.1V10h-3zM2 5h14v2H2zm0 12h14v2H2zm0-6h14v2H2z";
    const rotateIconPathCW = "M7.34 6.41L.86 12.9l6.49 6.48 6.49-6.48-6.5-6.49zM3.69 12.9l3.66-3.66L11 12.9l-3.66 3.66-3.65-3.66zm15.67-6.26C17.61 4.88 15.3 4 13 4V.76L8.76 5 13 9.24V6c1.79 0 3.58.68 4.95 2.05 2.73 2.73 2.73 7.17 0 9.9C16.58 19.32 14.79 20 13 20c-.97 0-1.94-.21-2.84-.61l-1.49 1.49C10.02 21.62 11.51 22 13 22c2.3 0 4.61-.88 6.36-2.64 3.52-3.51 3.52-9.21 0-12.72z";
    const rotateIconPathCCW = "M16.036 7.171 22.516 13.661l-6.49 6.48-6.49-6.48 6.5-6.49zM19.686 13.661l-3.66-3.66L12.376 13.661l3.66 3.66 3.65-3.66zm-15.67-6.26C5.766 5.641 8.076 4.761 10.376 4.761V1.521L14.616 5.761 10.376 10.001V6.761c-1.79 0-3.58.68-4.95 2.05-2.73 2.73-2.73 7.17 0 9.9C6.796 20.081 8.586 20.761 10.376 20.761c.97 0 1.94-.21 2.84-.61l1.49 1.49C13.356 22.381 11.866 22.761 10.376 22.761c-2.3 0-4.61-.88-6.36-2.64-3.52-3.51-3.52-9.21 0-12.72z";
    const dimensionsIconPath = "M21 6H3c-1.1 0-2 .9-2 2v8c0 1.1.9 2 2 2h18c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 10H3V8h2v4h2V8h2v4h2V8h2v4h2V8h2v4h2V8h2v8z";

    const btnWidth = 24;

    var cutIdxSvgElems = [];
    var dimensionsSvgElems = [];

    var isMouseHoveringButton = false;
    var tooltip = d3.select("body")
        .append("div")
        .style("position", "absolute")
        .style("text-align", "center")
        .style("padding", "5px 10px")
        .style("background", "#F3F3F3")
        .style("border-radius", "8px")
        .style("z-index", "10")
        .style("pointer-events", "none")
        .style("user-select", "none")
        .style("opacity", .0)
        .style("filter", "drop-shadow(2px 2px 2px rgba(0,0,0,0.5))")
        .style("visibility", "hidden");

    var strokeWidth = 1;
    var thickStrokeWidth = 3;

    self.mosaicsToRender = [];

    self.renderedSoultionId = null;

    self.cfg = {
        isPannable: false,
        isTilesColorFilled: true,
        isDimensionsVisible: true,
        isCutOrderVisible: false,
        isRotated90: false,
        isLabelsVisible: true,
        zoomFactor: 1,
        fontSizeFactor: 1,
        isEdgeBandingVisible: false,
        isGrainVisible: false,
        initZoom: 1
    };

    function setDimensionFormater(formater) {
        dimensionFormater = formater;
    }

    self.ratio = 1;
    self.zoom = 1;

    // Used to cumulatively store translations and zoom
    self.transformStack = "";

    self.isPannedOrZoomed = false;

    self.animate = true;

    var materialColors = [
        '#f8f8ff',
        '#fff8f8',
        '#f8fff8',
        '#f8ffff',
        '#fffff8',
        '#fff8ff'
    ];

    var materialColorTable = [];

    var edgeBandColors = [
        '#0000aa',
        '#aa0000',
        '#007700',
        '#aa00aa',
        '#0077aa',
        '#aa7700'];

    var edgeBandColorTable = [];
    var tmpSvgOverlayElems = [];

    self.divWidth = null;
    self.svgContainer = null;
    self.svgBtnContainer = null;

    var gradients = [];

    function generateGradient(id, color, opacity1, opacity2) {

        gradients.push(id);

        linearGradient = self.svgContainer.select("defs")
            .append("linearGradient")
            .attr("id", id)
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "100%")
            .attr("y2", "100%")
            .attr("spreadMethod", "pad");

        linearGradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", color)
            .attr("stop-opacity", opacity1);

        linearGradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", color)
            .attr("stop-opacity", opacity2);
    }

    function generateGradients() {

        const defs = self.svgContainer.append("defs");

        generateGradient("gradient", "#004B7A", 0.1, 0.25);
        generateGradient("gradient1", "#8A161B", 0.1, 0.25);
        generateGradient("gradient2", "#B39100", 0.1, 0.25);
        generateGradient("gradient3", "#00533F", 0.1, 0.25);
        generateGradient("gradient4", "#AA5600", 0.1, 0.25);
        generateGradient("gradient5", "#6E3A68", 0.1, 0.25);

        var vCutGradient = defs.append("linearGradient")
            .attr("id", "vCutGradient")
            .attr("x1", "0%")
            .attr("x2", "00%")
            .attr("y1", "0%")
            .attr("y2", "100%");
        vCutGradient.append("stop")
            .attr('class', 'start')
            .attr("offset", "0%")
            .attr("stop-color", "#ffaaaa")
            .attr("stop-opacity", 1);
        vCutGradient.append("stop")
            .attr('class', 'end')
            .attr("offset", "100%")
            .attr("stop-color", "#dd0000")
            .attr("stop-opacity", 1);

        var hCutGradient = defs.append("linearGradient")
            .attr("id", "hCutGradient")
            .attr("x1", "0%")
            .attr("x2", "100%")
            .attr("y1", "0%")
            .attr("y2", "0%");
        hCutGradient.append("stop")
            .attr('class', 'start')
            .attr("offset", "0%")
            .attr("stop-color", "#0000dd")
            .attr("stop-opacity", 1);
        hCutGradient.append("stop")
            .attr('class', 'end')
            .attr("offset", "100%")
            .attr("stop-color", "#aaaaff")
            .attr("stop-opacity", 1);

        var sizeFactor = self.divWidth / 750;

        var fillPattern = self.svgContainer.append("pattern")
            .attr("id", "diagonalHatch")
            .attr("patternUnits", "userSpaceOnUse")
            .attr("width", sizeFactor * 4)
            .attr("height", sizeFactor * 4)
            .attr("patternTransform", "rotate(45)");
        var fillPatternRectangle = fillPattern.append("rect")
            .attr("height", sizeFactor)
            .attr("width", sizeFactor * 4)
            .attr("fill", "#ccc");

        var hStripeFillPattern = self.svgContainer.append("pattern")
            .attr("id", "horizontal-stripe")
            .attr("patternUnits", "userSpaceOnUse")
            .attr("width", sizeFactor * 8)
            .attr("height", sizeFactor * 8);
        var hStripeFillPatternRectangle = hStripeFillPattern.append("rect")
            .attr("height", sizeFactor)
            .attr("width", sizeFactor * 8)
            .attr("fill", "#ddd");

        var vStripeFillPattern = self.svgContainer.append("pattern")
            .attr("id", "vertical-stripe")
            .attr("patternUnits", "userSpaceOnUse")
            .attr("width", sizeFactor * 8)
            .attr("height", sizeFactor * 8);
        var vStripeFillPatternRectangle = vStripeFillPattern.append("rect")
            .attr("height", sizeFactor * 8)
            .attr("width", sizeFactor)
            .attr("fill", "#ddd");
    }

    function render(isExport, mosaicIdx) {
        if (!TilingData.data) {
            return;
        }
        init(isExport, mosaicIdx);
        limitTranslation();
        renderTiles();
        self.renderedSoultionId = TilingData.data.id;
        if (self.onRender) {
            self.onRender();
        }
    }

    function resetPanAndZoom() {
        self.transformStack = "";
        self.cfg.zoomFactor = 1;
        self.cfg.initZoom = 1;
        self.zoom = 1;
        self.cfg.fontSizeFactor = 1;
        self.isPannedOrZoomed = false;
        self.svgContainer.attr("transform", null)
    }

    function limitTranslation () {
        try {
            const maxAllowedTranslationX = self.divWidth - 150;
            const minAllowedTranslationX = ((-self.panelMaxWidth)  * self.ratio + 100) * self.zoom;

            let xTranslationsStr = self.transformStack.match(/translate\(([\d-.])*/g);
            let totalTranslationX = 0;
            if (xTranslationsStr) {
                xTranslationsStr.forEach(e => {
                    totalTranslationX += Number.parseFloat(e.replace('translate(', ''));
                });
            }
            if (d3.event && d3.event.transform) {
                if (totalTranslationX + d3.event.transform.x > maxAllowedTranslationX) {
                    d3.event.transform.x = maxAllowedTranslationX - totalTranslationX;
                } else if (totalTranslationX + d3.event.transform.x < minAllowedTranslationX) {
                    d3.event.transform.x = minAllowedTranslationX - totalTranslationX;
                }
            } else {
                if (totalTranslationX > maxAllowedTranslationX || totalTranslationX < minAllowedTranslationX) {
                    // Reset translation
                    self.transformStack = "";
                    self.svgContainer.attr("transform", null);
                }
            }

            const maxAllowedTranslationY = self.canvasHeight - 200;
            const minAllowedTranslationY = ((-self.canvasHeight + 200) * self.zoom);

            let yTranslationsStr = self.transformStack.match(/,([\d-])*/g);

            let totalTranslationY = 0;
            if (yTranslationsStr) {
                yTranslationsStr.forEach(e => {
                    totalTranslationY += Number.parseFloat(e.replace(',', ''));
                });
            }
            if (d3.event && d3.event.transform) {
                if (totalTranslationY + d3.event.transform.y > maxAllowedTranslationY) {
                    d3.event.transform.y = maxAllowedTranslationY - totalTranslationY;
                } else if (totalTranslationY + d3.event.transform.y < minAllowedTranslationY) {
                    d3.event.transform.y = minAllowedTranslationY - totalTranslationY;
                }
            } else {
                if (totalTranslationY > maxAllowedTranslationY || totalTranslationY < minAllowedTranslationY) {
                    // Reset translation
                    self.transformStack = "";
                    self.svgContainer.attr("transform", null);
                }
            }

            // Limit minimum zoom
            if (d3.event && d3.event.transform && self.zoom < 0.2) {
                d3.event.transform.k = 0.2;
            }
        } catch(e) {
            console.error("Error while verifying and limiting diagram translation\n" + e.stack);
            self.transformStack = "";
            self.svgContainer.attr("transform", null);
        }
    }

    function init(isExport, mosaicIdx) {

        if (self.svgContainer) {
            // Store transformations to later restore
            const transform = self.svgContainer.attr("transform");
            if (transform) {
                self.transformStack = transform;
            }
        }

        // Make a copy of the data to be rendered
        if (isNaN(mosaicIdx)) {
            self.mosaicsToRender = JSON.parse(JSON.stringify(TilingData.mosaics || []));
        } else {
            self.mosaicsToRender = JSON.parse(JSON.stringify([TilingData.mosaics[mosaicIdx]] || []));
        }

        if (self.cfg.isRotated90) {
            self.mosaicsToRender.forEach(function (mosaic) {
                mosaic.tiles.forEach(function (tile) {
                    var x = tile.y;
                    var y = tile.x;
                    var width = tile.height;
                    var height = tile.width;

                    tile.x = x;
                    tile.y = y;
                    tile.width = width;
                    tile.height = height;
                });

                mosaic.cuts.forEach(function (cut) {
                    var x1 = cut.y1;
                    var y1 = cut.x1;
                    var x2 = cut.y2;
                    var y2 = cut.x2;

                    cut.x1 = x1;
                    cut.y1 = y1;
                    cut.x2 = x2;
                    cut.y2 = y2;
                })
            });
        }

        var elementId = isExport ? "svg-canvas-export" : "svg-canvas";

        self.cfg.initZoom = self.zoom != 1 ? self.zoom : self.cfg.initZoom;

        // Get div element
        var div = document.getElementById(elementId);
        if (!div) {
            return;
        }

        // Calculate the ratio based on the maximum mosaic width
        self.panelMaxWidth = 0;
        self.maxPanelHeight = 0;
        var tilesHeight = 0;
        self.mosaicsToRender.forEach( function(mosaic) {
            self.panelMaxWidth = Math.max(mosaic.tiles[0].width, self.panelMaxWidth);
            self.maxPanelHeight = Math.max(mosaic.tiles[0].height, self.maxPanelHeight);
            tilesHeight += mosaic.tiles[0].height;
        });

        self.divWidth = isExport ? 1024 : div.clientWidth;

        // Find a ratio to fit horizontally
        var ratioH = self.divWidth / self.panelMaxWidth;
        ratioH *= $window.innerWidth > 600 ? 0.85 : 0.78;

        // Find a ratio to fit vertically
        var ratioV = self.divWidth / self.maxPanelHeight;
        ratioV *= 0.80;

        // Apply zoom
        if (!isExport) {
            ratioH *= self.cfg.zoomFactor;
            ratioV *= self.cfg.zoomFactor;
        }

        if (fit === FitEnum.FIT_ALL) {
            // Consider the smallest ratio to fit the mosaics
            self.ratio = Math.min(ratioH, ratioV);
        } else if (fit === FitEnum.FIT_HORIZONTALLY) {
            // Don't allow the ratio be more that two times the vertical ratio
            self.ratio = Math.min(ratioH, ratioV * 2);
        } else if (fit === FitEnum.FIT_VERTICALLY) {
            // Don't allow the ratio be more that two times the horizontal ratio
            self.ratio = Math.min(ratioV, ratioH * 2);
        }

        var canvasHeight = 0;

        function calcCanvasHeight() {

            canvasHeight = 0;

            if (self.mosaicsToRender && self.mosaicsToRender.length > 0) {
                canvasHeight += 40;     // Make room for the buttons
                self.mosaicsToRender.forEach(function (mosaic, index) {

                    mosaic.xRatio = self.ratio;
                    mosaic.yRatio = self.ratio;

                    // Verify ratio to ensure that no rendered stock panel size has extremely small dimensions
                    const minRenderedDimensionAllowed = 20;
                    if (mosaic.tiles[0].width * self.ratio < minRenderedDimensionAllowed) {
                        mosaic.xRatio = minRenderedDimensionAllowed / mosaic.tiles[0].width;
                    }
                    if (mosaic.tiles[0].height * self.ratio < minRenderedDimensionAllowed) {
                        mosaic.yRatio = minRenderedDimensionAllowed / mosaic.tiles[0].height;
                    }

                    var horizontalMargin = self.divWidth * 0.11;

                    canvasHeight += mosaic.tiles[0].height * mosaic.yRatio + horizontalMargin;

                    if (index > 0) {
                        // Add an offset
                        mosaic.yOffset = self.mosaicsToRender[index - 1].yOffset + self.mosaicsToRender[index - 1].tiles[0].height * self.ratio + horizontalMargin;
                        mosaic.yOffset = Math.trunc(mosaic.yOffset);
                    } else {
                        // No offset for the first mosaic
                        mosaic.yOffset = 0;
                    }
                });
            }
            canvasHeight = Math.round(canvasHeight);

            return canvasHeight;
        }

        // Calculate the canvas height but, ensure it's not greater than 32,767.
        var maxHeight = 32767;
        canvasHeight = Infinity;
        while (canvasHeight > maxHeight) {
            canvasHeight = calcCanvasHeight();
            if (canvasHeight > maxHeight) {
                self.ratio -= 0.01;
            }
        }
        self.canvasHeight = canvasHeight;
        
        d3.select("#" + elementId).select("svg").remove();

        div.setAttribute("style", "height:" + canvasHeight + "px");

        self.svgContainer = d3.select("#" + elementId).append("svg")
            .attr("width", self.divWidth)
            .attr("height", canvasHeight)
            .append("g");

        self.svgBtnContainer = self.svgContainer;

        if (self.cfg.isPannable) {
            self.svgContainer.call(d3.zoom().on("zoom", function () {

                // Ignore zoom if mouse is hovering a button to avoid false double click
                if (isMouseHoveringButton) {
                    return;
                }
                limitTranslation();
                self.isPannedOrZoomed = true;
                self.svgContainer.attr("transform", self.transformStack + " " + d3.event.transform);
                self.zoom = self.cfg.initZoom * d3.event.transform.k;
                calcFontSize(self.zoom);
                cleanTmpSvgOverlayElems();
                removeDimensions();
                removeCutIndices();
                self.mosaicsToRender.forEach( function(mosaic) {
                    drawBaseDimensions(mosaic);
                    showDimensions(mosaic);
                    renderPanelLabels(mosaic);
                    renderCutIndices(mosaic);
                });
                renderButtons();

                // Render a rectangle covering the whole canvas to capture future pan and zoom events.
                // Somehow, only in mobile, after first transformation, only events on new elements rendered on this block are captured.
                self.svgContainer.append("rect")
                    .attr("x", 0)
                    .attr("y", 0)
                    .attr("width", "100%")
                    .attr("height", "100%")
                    .style("opacity", 0)
                    .style("pointer-events", "none");
            }));
        }

        // Margins to apply
        if (isExport) {
            xTranslation = self.divWidth * 0.04;
            yTranslation = self.divWidth * 0.04;
        } else {
            xTranslation = self.divWidth * 0.04;
            yTranslation = self.divWidth * 0.04;
            yTranslation += btnWidth * 1.2;    // Make room for the buttons
            if ($window.innerWidth <= 768) {
                // Bigger margins for mobile
                xTranslation += xTranslation * 0.25;
                yTranslation += yTranslation * 0.25;
            }
        }

        // Apply margins
        self.svgContainer = self.svgContainer.append("g");
        self.svgContainer = self.svgContainer.attr("transform", "translate(" + (xTranslation ) + ", " + (yTranslation) + ")").append("g");

        if (isExport) {
            // Ensure that background is white
            self.svgContainer.append("rect").attr("x", -xTranslation).attr("y", -yTranslation).attr("width", "100%").attr("height", "100%").attr("fill", "white");
        } else {
            // Restore previous transformations
            self.svgContainer = self.svgContainer.attr("transform", self.transformStack);
        }

        generateGradients();
        calcFontSize(isExport ? 1 : self.cfg.initZoom);

        if (!isExport) {
            renderButtons();
        }

        self.animate = !isExport;
    }
    
    function renderButtons() {

        if (!self.mosaicsToRender || self.mosaicsToRender.length === 0) {
            return;
        }

        var btnPadding = 16;

        // Make sure all the buttons fit
        if (self.divWidth < (btnWidth + btnPadding) * 10 + btnPadding) {
            btnPadding = ((self.divWidth * 0.97) / 10) - btnWidth;
        }

        self.svgBtnContainer.selectAll("#buttonsBackground").remove();
        self.svgBtnContainer.selectAll("#buttonBoundingBox").remove();
        self.svgBtnContainer.selectAll(".buttonSeparator").remove();
        self.svgBtnContainer.selectAll(".button").remove();

        self.svgBtnContainer
            .append("rect")
            .attr("id", "buttonsBackground")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", self.divWidth)
            .attr("height", 35)
            .style("fill", "#fff")
            .style("opacity", 0.75)
            .on("mousedown", function () { d3.event.stopPropagation(); })
            .on("click", function () { d3.event.stopPropagation(); })
            .on("dblclick", function () { d3.event.stopPropagation(); });

        self.svgBtnContainer.append("line")
            .attr("class", "buttonSeparator")
            .style("stroke", "#000")
            .style("stroke-width", "1")
            .style("fill", "#000")
            .style("opacity", 0.3)
            .attr("x1", 15)
            .attr("y1", 36)
            .attr("x2", self.divWidth - 10)
            .attr("y2", 36);

        function renderButton(path, x, y, tooltipText, onClick, isClickable, isToggled, separator) {

            if (typeof isClickable === 'undefined') {
                isClickable = true;
            }

            if (typeof isToggled === 'undefined') {
                isToggled = true;
            }

            if (typeof separator === 'undefined') {
                separator = true;
            }

            var opacity = 1;
            var color = isClickable && isToggled ? "#90A4AE" : "#ddd" ;

            var buttonId = "button_" + x  + "-" + y;

            var shadowOffset = 1;

            self.svgBtnContainer
                .append('g')
                .attr("id", "button")
                .attr('class', 'button')
                .attr('transform', 'translate(' + (x + shadowOffset) + ', ' + y + ')')
                .style("fill", "#fff")
                .style("opacity", opacity)
                .append('path')
                .attr('d', path);

            self.svgBtnContainer
                .append('g')
                .attr("id", "button")
                .attr('class', 'button')
                .attr('transform', 'translate(' + (x - shadowOffset) + ', ' + y + ')')
                .style("fill", "#fff")
                .style("opacity", opacity)
                .append('path')
                .attr('d', path);

            self.svgBtnContainer
                .append('g')
                .attr("id", "button")
                .attr('class', 'button')
                .attr('transform', 'translate(' + x + ', ' + (y + shadowOffset) + ')')
                .style("fill", "#fff")
                .style("opacity", opacity)
                .append('path')
                .attr('d', path);

            self.svgBtnContainer
                .append('g')
                .attr("id", "button")
                .attr('class', 'button')
                .attr('transform', 'translate(' + x + ', ' + (y - shadowOffset) + ')')
                .style("fill", "#fff")
                .style("opacity", opacity)
                .append('path')
                .attr('d', path);

            self.svgBtnContainer
                .append('g')
                .attr("id", buttonId)
                .attr('class', 'button')
                .attr('transform', 'translate(' + x + ', ' + y + ')')
                .style("fill", color)
                .style("opacity", opacity)
                .append('path')
                .attr('d', path)
                .on("mousedown", function () { d3.event.stopPropagation(); })
                .on("click", function () { d3.event.stopPropagation(); })
                .on("dblclick", function () { d3.event.stopPropagation(); });;

            if (isClickable) {
                self.svgBtnContainer
                    .append("rect")
                    .attr("id", "buttonBoundingBox")
                    .attr('transform', 'translate(' + (x - 3) + ', ' + (y - 3) + ')')
                    .attr("width", 30)
                    .attr("height", 30)
                    .attr("rx", 4)
                    .style("opacity", 0.0)
                    .style("cursor", "pointer")
                    .on("mousedown", function () { d3.event.stopPropagation(); })
                    .on("click", function () {  })
                    .on("dblclick", function () { d3.event.stopPropagation(); })
                    .on("click", function () {
                        onClick();
                        if ($window.innerWidth <= 768) {
                            ToastService.info(tooltipText);
                        }
                        d3.event.stopPropagation();
                    })
                    .on("mouseover", function () {
                        if ($window.innerWidth > 768) {
                            isMouseHoveringButton = true;
                            d3.select(this).style("opacity", 0.1);
                            $timeout(function () {
                                if (isMouseHoveringButton) {
                                    tooltip.style("visibility", "visible");
                                    tooltip.text(tooltipText);
                                    tooltip.transition().duration(250).style("opacity", 1);
                                }
                            }, 500);
                        }
                    }).on("mousemove", function () {
                        if ($window.innerWidth > 768) {
                            tooltip.style("top", (event.pageY - 15) + "px").style("left", (event.pageX + 15) + "px");
                        }
                    }).on("mouseout", function () {
                        if ($window.innerWidth > 768) {
                            isMouseHoveringButton = false;
                            d3.select(this).style("opacity", 0);
                            tooltip.transition().duration(500).style("opacity", 0);
                            $timeout(function () {
                                if (!isMouseHoveringButton) {
                                    tooltip.style("visibility", "hidden");
                                }
                            }, 500);
                        }
                    });
            }

            if (separator) {
                self.svgBtnContainer.append("line")
                    .attr("class", "buttonSeparator")
                    .style("stroke", "#000")
                    .style("stroke-width", "1")
                    .style("fill", "#000")
                    .style("opacity", 0.3)
                    .attr("x1", x + btnWidth + btnPadding / 2)
                    .attr("y1", y+2)
                    .attr("x2", x + btnWidth + btnPadding / 2)
                    .attr("y2", y + 22)
                    .on("mousedown", function () { d3.event.stopPropagation(); })
                    .on("click", function () { d3.event.stopPropagation(); })
                    .on("dblclick", function () { d3.event.stopPropagation(); });
            }
        }

        var btnPos = [];
        for (i = 0; i < 20; i++) {
            btnPos[i] = {};
            btnPos[i].x = btnPadding * 1.25 + (btnWidth + btnPadding) * i;
            btnPos[i].y = 6;
        }

        var btnIdx = 0;

        renderButton(self.cfg.isPannable ? lockOpenIconPath : lockIconPath, btnPos[btnIdx].x, btnPos[btnIdx].y, $translate.instant('IMAGE_PAN_ZOOM'), function () {
            self.cfg.isPannable = !self.cfg.isPannable;
            render();
        }, true, !self.cfg.isPannable);
        btnIdx++;

        renderButton(zoomResetIconPath, btnPos[btnIdx].x, btnPos[btnIdx].y, $translate.instant('RESET_ZOOM'), function () {
            resetPanAndZoom();
            render();
            tooltip.style("visibility", "hidden");
            isMouseHoveringButton = false;
        }, self.isPannedOrZoomed);
        btnIdx++;

        renderButton(zoomInIconPath, btnPos[btnIdx].x, btnPos[btnIdx].y, $translate.instant('ZOOM_IN'), function () {
            self.cfg.zoomFactor = self.cfg.zoomFactor + 0.2;
            self.isPannedOrZoomed = true;
            render();
            if (self.cfg.zoomFactor >= 2) {
                tooltip.style("visibility", "hidden");
                isMouseHoveringButton = false;
            }
        }, self.cfg.zoomFactor < 2);
        btnIdx++;

        renderButton(zoomOutIconPath, btnPos[btnIdx].x, btnPos[btnIdx].y, $translate.instant('ZOOM_OUT'), function () {
            self.cfg.zoomFactor = self.cfg.zoomFactor - 0.2;
            self.isPannedOrZoomed = true;
            render();
            if (self.cfg.zoomFactor <= 0.5) {
                tooltip.style("visibility", "hidden");
                isMouseHoveringButton = false;
            }
        }, self.cfg.zoomFactor > 0.5);
        btnIdx++;

        renderButton(decreaseFontSizeIconPath, btnPos[btnIdx].x, btnPos[btnIdx].y, $translate.instant('INCREASE_FONT_SIZE'), function () {
            self.cfg.fontSizeFactor += 0.2;
            self.isPannedOrZoomed = true;
            render();
            if (self.cfg.fontSizeFactor >= 1.75) {
                tooltip.style("visibility", "hidden");
                isMouseHoveringButton = false;
            }
        },self.cfg.fontSizeFactor < 1.75);
        btnIdx++;

        renderButton(increaseTextSizeIconPath, btnPos[btnIdx].x, btnPos[btnIdx].y, $translate.instant('DECREASE_FONT_SIZE'), function () {
            self.cfg.fontSizeFactor -= 0.2;
            self.isPannedOrZoomed = true;
            render();
            if (self.cfg.fontSizeFactor <= 0.75) {
                tooltip.style("visibility", "hidden");
                isMouseHoveringButton = false;
            }
        }, self.cfg.fontSizeFactor > 0.75);
        btnIdx++;

        renderButton(colors, btnPos[btnIdx].x, btnPos[btnIdx].y, $translate.instant('COLORED_PANELS'), function () {
            self.cfg.isTilesColorFilled = !self.cfg.isTilesColorFilled;
            render();
        }, true, self.cfg.isTilesColorFilled);
        btnIdx++;

        renderButton(dimensionsIconPath, btnPos[btnIdx].x, btnPos[btnIdx].y, $translate.instant('SHOW_DIMENSIONS'), function () {
            self.cfg.isDimensionsVisible = !self.cfg.isDimensionsVisible;
            render();
        }, true, self.cfg.isDimensionsVisible);
        btnIdx++;

        renderButton(cutOrder, btnPos[btnIdx].x, btnPos[btnIdx].y, $translate.instant('SHOW_CUTS'), function () {
            self.cfg.isCutOrderVisible = !self.cfg.isCutOrderVisible;
            render();
        }, true, self.cfg.isCutOrderVisible);
        btnIdx++;

        renderButton(rotateIconPathCCW, btnPos[btnIdx].x, btnPos[btnIdx].y, $translate.instant('ROTATE_90'), function () {
            self.cfg.isRotated90 = !self.cfg.isRotated90;
            render();
        }, true, self.cfg.isRotated90, $window.innerWidth > 420);
        btnIdx++;
    }

    function calcFontSize(zoom) {
        // Text size and margin varies inversely as zoom
        self.textMargin = Math.max(self.divWidth * 0.015, 10) * (1 / zoom);
        self.fontSize = Math.max(self.divWidth * 0.015, 9) * (1 / zoom);
        self.fontSize = self.fontSize * self.cfg.fontSizeFactor + "px";
        thickStrokeWidth = Math.max(self.divWidth * 0.003, 3);

        self.textMargin *= self.cfg.fontSizeFactor;
        self.thickStrokeWidth *= self.cfg.fontSizeFactor;
    }

    function clear(elementId) {
        if (elementId) {
            d3.select("#" + elementId).select("svg").remove();
            var elem;

            elem = document.getElementById(elementId);
            elem.setAttribute("style", "height: 0px");
        } else {
            d3.select("#svg-canvas").select("svg").remove();
            d3.select("#svg-canvas-export").select("svg").remove();

            var elem;

            elem = document.getElementById("svg-canvas");
            elem.setAttribute("style", "height: 0px");

            elem = document.getElementById("svg-canvas-export");
            elem.setAttribute("style", "height: 0px");
        }
    }

    function buildMaterialColorTable() {
        materialColorTable = [];
        let materialColorIdx = 0;
        self.mosaicsToRender.forEach( function(mosaic) {
            if (mosaic.material && !materialColorTable[mosaic.material]) {
                materialColorTable[mosaic.material] = materialColors[materialColorIdx++ % materialColors.length];
            }
        });
    }

    function buildEdgeBandColorTable() {

        edgeBandColorTable = [];
        var edgeBandColorIdx = 0;

        self.mosaicsToRender.forEach( function(mosaic) {
            mosaic.tiles.forEach(function (tile) {
                if (tile.edge) {
                    if (tile.edge.top) {
                        if (!edgeBandColorTable[tile.edge.top]) {
                            edgeBandColorTable[tile.edge.top] = edgeBandColors[edgeBandColorIdx++ % edgeBandColors.length];
                        }
                    }
                    if (tile.edge.left) {
                        if (!edgeBandColorTable[tile.edge.left]) {
                            edgeBandColorTable[tile.edge.left] = edgeBandColors[edgeBandColorIdx++ % edgeBandColors.length];
                        }
                    }
                    if (tile.edge.bottom) {
                        if (!edgeBandColorTable[tile.edge.bottom]) {
                            edgeBandColorTable[tile.edge.bottom] = edgeBandColors[edgeBandColorIdx++ % edgeBandColors.length];
                        }
                    }
                    if (tile.edge.right) {
                        if (!edgeBandColorTable[tile.edge.right]) {
                            edgeBandColorTable[tile.edge.right] = edgeBandColors[edgeBandColorIdx++ % edgeBandColors.length];
                        }
                    }
                }
            });
        });
    }

    function renderTiles() {

        if (!self.mosaicsToRender || self.mosaicsToRender.length === 0) {
            return;
        }

        console.log("Rendering diagram: id[" + self.renderedSoultionId + "]");

        buildMaterialColorTable();
        buildEdgeBandColorTable();

        self.mosaicsToRender.forEach( function(mosaic) {
            drawBaseTile(mosaic);
            drawTiles(mosaic);
            renderEdgeBands(mosaic);
            drawBaseDimensions(mosaic);
            renderCutIndices(mosaic);
            showDimensions(mosaic);
            renderPanelLabels(mosaic);
        });
    }

    function drawBaseTile(mosaic) {

        // filters go in defs element
        var defs = self.svgContainer.append("defs");

        // create filter with id #drop-shadow
        // height=130% so that the shadow is not clipped
        var filter = defs.append("filter")
            .attr("id", "drop-shadow")
            .attr("height", "130%");

        // SourceAlpha refers to opacity of graphic that this filter will be applied to
        // convolve that with a Gaussian with standard deviation 3 and store result
        // in blur
        filter.append("feGaussianBlur")
            .attr("in", "SourceAlpha")
            .attr("stdDeviation", 2)
            .attr("result", "blur");

        // translate output of Gaussian blur to the right and downwards with 2px
        // store result in offsetBlur
        filter.append("feOffset")
            .attr("in", "blur")
            .attr("dx", 1)
            .attr("dy", 1)
            .attr("result", "offsetBlur");

        // overlay original SourceGraphic over translated blurred opacity by using
        // feMerge filter. Order of specifying inputs is important!
        var feMerge = filter.append("feMerge");

        feMerge.append("feMergeNode")
            .attr("in", "offsetBlur")
        feMerge.append("feMergeNode")
            .attr("in", "SourceGraphic");

        // Draw the base tile
        var baseTile = self.svgContainer.append("rect")
            .attr("x", 0)
            .attr("y", mosaic.yOffset)
            .attr("width", mosaic.tiles[0].width * mosaic.xRatio)
            .attr("height", mosaic.tiles[0].height * mosaic.yRatio)
            .attr("vector-effect", "non-scaling-stroke")
            .style("stroke", "black")
            .style("stroke-width", "2")
            .classed('background', true)
            .attr('fill', "white")
            .style("filter", "url(#drop-shadow)");

        if (TilingData.shouldGroupEqualMosaics /*&& mosaic.ocurrences > 1*/) {
            const xPos = (mosaic.tiles[0].width) * mosaic.xRatio + 25;
            const yPos = getTileY2(mosaic, mosaic.tiles[0].y ) + 0;

            const textLabel = self.svgContainer.append("text")
                .attr("x", xPos)
                .attr("y", yPos)
                .attr("fill", mosaic.ocurrences > 1 ? '#555' : '#ccc')
                .attr("font-weight", "bold")
                .attr('text-anchor', 'start')
                .style("font-size", 22 * self.cfg.fontSizeFactor + "px")
                .style("pointer-events", "none")
                .style("user-select", "none")
                .text('x' + mosaic.ocurrences);
        }
    }

    function drawTiles(mosaic) {

        // Render non final tiles
        mosaic.tiles.forEach( function(tile) {

            if (tile.hasChildren || tile.final === true) {
                // This tile has inner tiles, doesn't need to be rendered.
                return;
            }

            var rec = self.svgContainer.append("rect")
                .attr("x", tile.x * mosaic.xRatio)
                .attr("y", getTileY2(mosaic, tile.y + tile.height))
                .attr("width", tile.width * mosaic.xRatio)
                .attr("height", tile.height * mosaic.yRatio)
                .style("stroke", "#bbb")
                .style("stroke-width", strokeWidth)
                .attr("vector-effect", "non-scaling-stroke")
                .classed('background', true)
                .on("mouseover", function () {
                    cleanTmpSvgOverlayElems();
                    drawDimensionH(tile.x, tile.x + tile.width, mosaic);
                    drawDimensionV(tile.y, tile.y + tile.height, mosaic);
                    if (self.cfg.isPannable) {
                        d3.select(this).style("cursor", "move")
                    }
                })
                .on("mouseout", function () {
                    cleanTmpSvgOverlayElems();
                    self.mosaicsToRender.forEach( function(mosaic) {
                        drawBaseDimensions(mosaic);
                    });
                    if (self.cfg.isPannable) {
                        d3.select(this).style("cursor", "default")
                    }
                });

            if (self.cfg.isTilesColorFilled) {
                if (mosaic.material) {
                    rec.attr('fill', materialColorTable[mosaic.material]);
                } else {
                    rec.attr('fill', '#f5f5f5');
                }
            } else {
                rec.attr('fill', 'url(#diagonalHatch)');
            }
        });

        // Render final tiles
        mosaic.tiles.forEach( function (tile) {

            var baseTile = mosaic.tiles[0];

            if (tile.hasChildren || tile.final === false) {
                // This tile has inner tiles, doesn't need to be rendered.
                return;
            }

            if (self.cfg.isGrainVisible && baseTile.orientation !== 0) {
                var rec = self.svgContainer.append("rect")
                    .attr("x", tile.x * self.ratio)
                    .attr("y", getTileY2(mosaic, tile.y + tile.height))
                    .attr("width", tile.width * mosaic.xRatio)
                    .attr("height", tile.height * mosaic.yRatio)
                    .attr("vector-effect", "non-scaling-stroke")
                    .attr('fill', 'white')
                    .style("stroke", "#000")
                    .style("stroke-width", strokeWidth)
                    .classed('background', true);
                if (baseTile.orientation === 1 && !self.cfg.isRotated90 || baseTile.orientation === 2 && self.cfg.isRotated90) {
                    rec.attr('fill', 'url(#horizontal-stripe)');
                } else if (baseTile.orientation === 2 && !self.cfg.isRotated90 || baseTile.orientation === 1 && self.cfg.isRotated90) {
                    rec.attr('fill', 'url(#vertical-stripe)');
                }
            }

            var rec = self.svgContainer.append("rect")
                .attr("x", tile.x * mosaic.xRatio)
                .attr("y", getTileY2(mosaic, tile.y + tile.height))
                .attr("width", tile.width * mosaic.xRatio)
                .attr("height", tile.height * mosaic.yRatio)
                .attr("vector-effect", "non-scaling-stroke")
                .attr('fill', 'white')
                .style("stroke", "#000")
                .style("stroke-width", strokeWidth)
                .classed('background', true)
                .on("click", function () {
                    //alert("test");
                })
                .on("mouseover", function () {
                    cleanTmpSvgOverlayElems();
                    drawDimensionH(tile.x, tile.x + tile.width, mosaic);
                    drawDimensionV(tile.y, tile.y + tile.height, mosaic);
                    if (self.cfg.isPannable) {
                        d3.select(this).style("cursor", "move")
                    }
                })
                .on("mouseout", function () {
                    cleanTmpSvgOverlayElems();
                    self.mosaicsToRender.forEach( function(mosaic) {
                        drawBaseDimensions(mosaic);
                    });
                    if (self.cfg.isPannable) {
                        d3.select(this).style("cursor", "default")
                    }
                });

            if (self.cfg.isTilesColorFilled) {
                gradients.forEach( function (gradient, index) {
                    if (tile.requestObjId % gradients.length === index) {
                        rec.attr('fill', tile.final == true ? "url(#" + gradient + ")" : "#f5f5f5")
                    }
                });
            }
        });
    }

    function renderEdgeBands(mosaic) {

        if (!self.cfg.isEdgeBandingVisible) {
            return;
        }

        mosaic.tiles.forEach(function (tile) {

            if (tile.hasChildren || tile.final === false ) {
                // This tile has inner tiles, doesn't need to be rendered.
                return;
            }

            var isRotated = (tile.rotated && !self.cfg.isRotated90) || (!tile.rotated && self.cfg.isRotated90);

            var offset = 3;
            var strokeWidth = "2";
            var strokeDasharray = "6, 2";

            if (tile.edge) {
                if (tile.edge.top && !isRotated || tile.edge.right && isRotated) {
                    self.svgContainer.append("line")
                        .style("stroke", edgeBandColorTable[isRotated ? tile.edge.right : tile.edge.top])
                        .style("stroke-dasharray", strokeDasharray)
                        .style("stroke-width", strokeWidth)
                        .attr("x1", tile.x * mosaic.xRatio + offset)
                        .attr("y1", getTileY2(mosaic, tile.y + tile.height) + offset)
                        .attr("x2", (tile.x + tile.width) * mosaic.xRatio - offset)
                        .attr("y2", getTileY2(mosaic, tile.y + tile.height) + offset);
                }

                if (tile.edge.left && !isRotated || tile.edge.bottom && isRotated) {
                    self.svgContainer.append("line")
                        .style("stroke", edgeBandColorTable[isRotated ? tile.edge.bottom : tile.edge.left])
                        .style("stroke-dasharray", strokeDasharray)
                        .style("stroke-width", strokeWidth)
                        .attr("x1", tile.x * mosaic.xRatio + offset)
                        .attr("y1", getTileY2(mosaic, tile.y) - offset)
                        .attr("x2", tile.x * mosaic.xRatio + offset)
                        .attr("y2", getTileY2(mosaic, tile.y + tile.height) + offset);
                }

                if (tile.edge.bottom && !isRotated || tile.edge.left && isRotated) {
                    self.svgContainer.append("line")
                        .style("stroke", edgeBandColorTable[isRotated ? tile.edge.left : tile.edge.bottom])
                        .style("stroke-dasharray", strokeDasharray)
                        .style("stroke-width", strokeWidth)
                        .attr("x1", tile.x * mosaic.xRatio + offset)
                        .attr("y1", getTileY2(mosaic, tile.y) - offset)
                        .attr("x2", (tile.x + tile.width) * mosaic.xRatio - offset)
                        .attr("y2", getTileY2(mosaic, tile.y) - offset);
                }

                if (tile.edge.right && !isRotated || tile.edge.top && isRotated) {
                    self.svgContainer.append("line")
                        .style("stroke", edgeBandColorTable[isRotated ? tile.edge.top : tile.edge.right])
                        .style("stroke-dasharray", strokeDasharray)
                        .style("stroke-width", strokeWidth)
                        .attr("x1", (tile.x + tile.width) * mosaic.xRatio - offset)
                        .attr("y1", getTileY2(mosaic, tile.y) - offset)
                        .attr("x2", (tile.x + tile.width) * mosaic.xRatio - offset)
                        .attr("y2", getTileY2(mosaic, tile.y + tile.height) + offset);
                }
            }
        });
    }

    function renderCutIndices(mosaic) {

        if (!self.cfg.isCutOrderVisible ) {
            return;
        }

        mosaic.cuts.forEach( function (cut, index) {

            if (cut.x1 == cut.x2) {

                var textCutIdx = self.svgContainer.append("text")
                    .attr("x", cut.x1 * mosaic.xRatio + self.textMargin * 0.3)
                    .attr("y", getTileY2(mosaic, cut.y1) - self.textMargin * 0.4)
                    .attr("fill", '#dd0000')
                    .attr('text-anchor', 'start')
                    .style("font-size", self.fontSize)
                    .style("pointer-events", "none")
                    .style("user-select", "none")
                    .text(index + 1);

                cutIdxSvgElems.push(textCutIdx);

                var line = self.svgContainer.append("line")
                    .attr("x1", cut.x1 * mosaic.xRatio)
                    .attr("y1", getTileY2(mosaic, cut.y1))
                    .attr("x2", cut.x2 * mosaic.xRatio + 0.001)
                    .attr("y2", getTileY2(mosaic, cut.y2) + 0.001)
                    .attr("stroke-width", thickStrokeWidth)
                    .attr("stroke", "url(#vCutGradient)")
                    .attr("fill", "none")
                    .attr("vector-effect", "non-scaling-stroke");
            } else {

                var textCutIdx = self.svgContainer.append("text")
                    .attr("x", cut.x1 * mosaic.xRatio + self.textMargin * 0.3)
                    .attr("y", getTileY2(mosaic, cut.y1) - self.textMargin * 0.4)
                    .attr("fill", '#0000dd')
                    .attr('text-anchor', 'start')
                    .style("font-size", self.fontSize)
                    .style("pointer-events", "none")
                    .style("user-select", "none")
                    .text(index + 1);

                cutIdxSvgElems.push(textCutIdx);

                var line = self.svgContainer.append("line")
                    .attr("x1", cut.x1 * mosaic.xRatio)
                    .attr("y1", getTileY2(mosaic, cut.y1))
                    .attr("x2", cut.x2 * mosaic.xRatio + 0.001)
                    .attr("y2", getTileY2(mosaic, cut.y2) + 0.001)
                    .attr("stroke-width", thickStrokeWidth)
                    .attr("stroke", "url(#hCutGradient)")
                    .attr("fill", "none")
                    .attr("vector-effect", "non-scaling-stroke");
            }

        });
    }

    function drawCutAnimation() {

        self.mosaicsToRender.forEach( function(mosaic) {

            // Loop through all mosaics for this solution
            mosaic.cuts.forEach( function (cut, index) {

                self.svgContainer.append("line")
                    .style("stroke", "#000")
                    .attr("x1", cut.x1 * mosaic.xRatio)
                    .attr("y1", getTileY2(mosaic, cut.y1))
                    .attr("x2", cut.x1 * mosaic.xRatio)
                    .attr("y2", getTileY2(mosaic, cut.y1))
                    .style("stroke-width", thickStrokeWidth)
                    .attr("vector-effect", "non-scaling-stroke")
                    .transition()
                    .duration(1500)
                    .delay(1500 * index)
                    .attr("x1", cut.x1 * mosaic.xRatio)
                    .attr("y1", getTileY2(mosaic, cut.y1))
                    .attr("x2", cut.x2 * mosaic.xRatio)
                    .attr("y2", getTileY2(mosaic, cut.y2));
            });
        });
    }

    function removeCutIndices() {
        cutIdxSvgElems.forEach( function(svg) {
            svg.remove();
        });
    }

    function removeDimensions() {
        dimensionsSvgElems.forEach( function(svg) {
            svg.remove();
        });
    }

    function showDimensions(mosaic) {

        if (!self.cfg.isDimensionsVisible) {
            return;
        }

        mosaic.tiles.forEach( function (tile) {

            if (tile.hasChildren) {
                return;
            }

            var isRotated = (tile.rotated && !self.cfg.isRotated90) || (!tile.rotated && self.cfg.isRotated90);

            var hDimension = dimensionFormater(tile.width);

            var hOffset = 0;
            if (tile.edge && (!isRotated && tile.edge.top || isRotated && tile.edge.right)) {
                hOffset = 3;
            }

            var textWidth = self.svgContainer.append("text")
                .attr("x", (tile.x + tile.width / 2) * mosaic.xRatio)
                .attr("y", getTileY2(mosaic, tile.y + tile.height) + self.textMargin + hOffset)
                .attr("fill", "#000000")
                .attr('text-anchor', 'middle')
                .style("font-size", self.fontSize)
                .style("pointer-events", "none")
                .style("user-select", "none")
                .text(hDimension);

            if (tile.final == false && self.cfg.isTilesColorFilled) {
                textWidth.attr("fill", "#90A4AD");
            }

            dimensionsSvgElems.push(textWidth);

            var vDimension = dimensionFormater(tile.height);

            var vOffset = 0;
            if (tile.edge && (!isRotated && tile.edge.left || isRotated && tile.edge.bottom)) {
                vOffset = 3;
            }

            var textHeight = self.svgContainer.append("text")
                .attr("fill", "#000000")
                .attr('text-anchor', 'middle')
                .style("font-size", self.fontSize)
                .style("pointer-events", "none")
                .style("user-select", "none")
                .text(vDimension)
                .attr("transform", function (d, i) {
                    return "translate(" + ((tile.x) * mosaic.xRatio + self.textMargin + vOffset) + " , " + (getTileY2(mosaic, tile.y + tile.height / 2)) + ") rotate(270)";
                });

            if (tile.final == false && self.cfg.isTilesColorFilled) {
                textHeight.attr("fill", "#90A4AD");
            }

            dimensionsSvgElems.push(textHeight);
        });
    }


    function renderPanelLabels(mosaic) {

        if (!self.cfg.isLabelsVisible && !mosaic.material) {
            return;
        }

        mosaic.tiles.forEach( function (tile) {

            if (tile.hasChildren) {
                return;
            }

            if (self.cfg.isLabelsVisible) {

                var textLabel;

                if (tile.width > tile.height / 2) {
                    textLabel = self.svgContainer.append("text")
                        .attr("x", (tile.x + tile.width * 0.5) * mosaic.xRatio)
                        .attr("y", getTileY2(mosaic, tile.y + tile.height * 0.5) + self.textMargin * 0.4)
                        .attr("fill", "#555")
                        .attr("font-weight", "bold")
                        .attr('text-anchor', 'middle')
                        .style("font-size", self.fontSize)
                        .style("pointer-events", "none")
                        .style("user-select", "none")
                        .text(tile.label);
                } else {
                    textLabel = self.svgContainer.append("text")
                        .attr("fill", "#555")
                        .attr("font-weight", "bold")
                        .attr('text-anchor', 'middle')
                        .style("font-size", self.fontSize)
                        .style("pointer-events", "none")
                        .style("user-select", "none")
                        .text(tile.label)
                        .attr("transform", function (d, i) {
                            return "translate(" + (((tile.x + tile.width * 0.5) * mosaic.xRatio) + self.textMargin * 0.25) + " , " + getTileY2(mosaic, tile.y + tile.height * 0.5) + ") rotate(270)";
                        });
                }

                dimensionsSvgElems.push(textLabel);
            }
        });

        // Stock sheet label
        if (!!mosaic.stockLabel || !!mosaic.material) {
            var xPos = mosaic.tiles[0].width * mosaic.xRatio;
            var yPos = getTileY2(mosaic, mosaic.tiles[0].y + mosaic.tiles[0].height) - 5;
            var labelwidth = 0;

            var text = '';
            if (!!mosaic.stockLabel && self.cfg.isLabelsVisible) {
                text += mosaic.stockLabel;
                labelwidth += mosaic.stockLabel.length * 10;
            }
            if (!!mosaic.material) {
                if (!!text) {
                    text += ' - ' + mosaic.material;
                } else {
                    text += mosaic.material;
                    labelwidth += mosaic.material.length * 10;
                }
            }

            var textLabel = self.svgContainer.append("text")
                .attr("x", xPos > labelwidth ? xPos : 0)
                .attr("y", yPos)
                .attr("fill", '#555')
                .attr("font-weight", "bold")
                .attr('text-anchor', xPos > labelwidth ? 'end' : 'start')
                .style("font-size", self.fontSize)
                .style("pointer-events", "none")
                .style("user-select", "none")
                .text(text);

            dimensionsSvgElems.push(textLabel);
        }
    }

    function cleanTmpSvgOverlayElems() {
        tmpSvgOverlayElems.forEach( function (svg) {
            svg.remove();
        });
    }

    function resetSvgOverlayElems() {
        cleanTmpSvgOverlayElems();
        self.mosaicsToRender.forEach( function(mosaic) {
            drawBaseDimensions(mosaic);
        });
    }

    function getTileY2(mosaic, y) {
        return (mosaic.tiles[0].height - y) * mosaic.yRatio + mosaic.yOffset;
    }

    const dimAnimSpeed = 250;

    function drawDimensionH(x1, x2, mosaic) {

        const color = '#d9534f';

        const dimensionsOffset = 14;

        let svgElement;

        if (self.animate) {
            svgElement = self.svgContainer.append("line")
                .style("stroke", color)
                .style("stroke-width", "1")
                .attr("x1", (x1 + (x2 - x1) / 2) * mosaic.xRatio)
                .attr("y1", getTileY2(mosaic, 0) + dimensionsOffset)
                .attr("x2", (x2 - (x2 - x1) / 2) * mosaic.xRatio)
                .attr("y2", getTileY2(mosaic, 0) + dimensionsOffset);

            svgElement.transition()
                .duration(dimAnimSpeed)
                .attr("x1", x1 * mosaic.xRatio)
                .attr("x2", x2 * mosaic.xRatio)
                .ease(d3.easeExpOut);
        } else {
            svgElement = self.svgContainer.append("line")
                .style("stroke", color)
                .style("stroke-width", "1")
                .attr("x1", x1 * mosaic.xRatio)
                .attr("y1", getTileY2(mosaic, 0) + dimensionsOffset)
                .attr("x2", x2 * mosaic.xRatio)
                .attr("y2", getTileY2(mosaic, 0) + dimensionsOffset);
        }

        tmpSvgOverlayElems.push(svgElement);

        if (self.animate) {
            svgElement = self.svgContainer.append("line")
                .style("stroke", color)
                .style("stroke-width", "0")
                .attr("x1", x1 * mosaic.xRatio)
                .attr("y1", getTileY2(mosaic, 0) + dimensionsOffset + 4)
                .attr("x2", x1 * mosaic.xRatio)
                .attr("y2", getTileY2(mosaic, 0) + dimensionsOffset - 4);

            svgElement.transition()
                .duration(dimAnimSpeed)
                .style("stroke-width", "1")
                .ease(d3.easeExpIn);
        } else {
            svgElement = self.svgContainer.append("line")
                .style("stroke", color)
                .style("stroke-width", "1")
                .attr("x1", x1 * mosaic.xRatio)
                .attr("y1", getTileY2(mosaic, 0) + dimensionsOffset + 4)
                .attr("x2", x1 * mosaic.xRatio)
                .attr("y2", getTileY2(mosaic, 0) + dimensionsOffset - 4);
        }
        tmpSvgOverlayElems.push(svgElement);

        if (self.animate) {
            svgElement = self.svgContainer.append("line")
                .style("stroke", color)
                .style("stroke-width", "0")
                .attr("x1", x2 * mosaic.xRatio)
                .attr("y1", getTileY2(mosaic, 0) + dimensionsOffset + 4)
                .attr("x2", x2 * mosaic.xRatio)
                .attr("y2", getTileY2(mosaic, 0) + dimensionsOffset - 4);

            svgElement.transition()
                .duration(dimAnimSpeed)
                .style("stroke-width", "1")
                .ease(d3.easeExpIn);
        } else {
            svgElement = self.svgContainer.append("line")
                .style("stroke", color)
                .style("stroke-width", "1")
                .attr("x1", x2 * mosaic.xRatio)
                .attr("y1", getTileY2(mosaic, 0) + dimensionsOffset + 4)
                .attr("x2", x2 * mosaic.xRatio)
                .attr("y2", getTileY2(mosaic, 0) + dimensionsOffset - 4);
        }

        tmpSvgOverlayElems.push(svgElement);

        svgElement = self.svgContainer.append("text")
            .attr("x", (x1 + ((x2 - x1) / 2)) * mosaic.xRatio)
            .attr("y", mosaic.tiles[0].height * mosaic.yRatio + mosaic.yOffset + dimensionsOffset + self.textMargin * 1.25)
            .attr("fill", color)
            .attr('text-anchor', 'middle')
            .style("font-size", self.fontSize)
            .style("pointer-events", "none")
            .style("user-select", "none")
            .text(dimension = dimensionFormater(x2 - x1));

        tmpSvgOverlayElems.push(svgElement);
    }

    var drawDimensionV = function(y1, y2, mosaic) {

        const color = '#d9534f';
        const dimensionsOffset = 14;

        let svgElement;

        if (self.animate) {
            svgElement = self.svgContainer.append("line")
                .style("stroke", color)
                .style("stroke-width", "1")
                .attr("x1", mosaic.tiles[0].width * mosaic.xRatio + dimensionsOffset)
                .attr("y1", getTileY2(mosaic, y1) + (getTileY2(mosaic, y2) - getTileY2(mosaic, y1)) / 2)
                .attr("x2", mosaic.tiles[0].width * mosaic.xRatio + dimensionsOffset)
                .attr("y2", getTileY2(mosaic, y1) + (getTileY2(mosaic, y2) - getTileY2(mosaic, y1)) / 2);

            svgElement.transition()
                .duration(dimAnimSpeed)
                .attr("y1", getTileY2(mosaic, y1))
                .attr("y2", getTileY2(mosaic, y2))
                .ease(d3.easeExpOut);
        } else {
            svgElement = self.svgContainer.append("line")
                .style("stroke", color)
                .style("stroke-width", "1")
                .attr("x1", mosaic.tiles[0].width * mosaic.xRatio + dimensionsOffset)
                .attr("y1", getTileY2(mosaic, y1))
                .attr("x2", mosaic.tiles[0].width * mosaic.xRatio + dimensionsOffset)
                .attr("y2", getTileY2(mosaic, y2));
        }

        tmpSvgOverlayElems.push(svgElement);

        if (self.animate) {
            svgElement = self.svgContainer.append("line")
                .style("stroke", color)
                .style("stroke-width", "0")
                .attr("x1", mosaic.tiles[0].width * mosaic.xRatio + dimensionsOffset - 4)
                .attr("y1", getTileY2(mosaic, y1))
                .attr("x2", mosaic.tiles[0].width * mosaic.xRatio + dimensionsOffset + 4)
                .attr("y2", getTileY2(mosaic, y1));

            svgElement.transition()
                .duration(dimAnimSpeed)
                .style("stroke-width", "1")
                .ease(d3.easeExpIn);
        } else {
            svgElement = self.svgContainer.append("line")
                .style("stroke", color)
                .style("stroke-width", "1")
                .attr("x1", mosaic.tiles[0].width * mosaic.xRatio + dimensionsOffset - 4)
                .attr("y1", getTileY2(mosaic, y1))
                .attr("x2", mosaic.tiles[0].width * mosaic.xRatio + dimensionsOffset + 4)
                .attr("y2", getTileY2(mosaic, y1));
        }

        tmpSvgOverlayElems.push(svgElement);

        if (self.animate) {
            svgElement = self.svgContainer.append("line")
                .style("stroke", color)
                .style("stroke-width", "0")
                .attr("x1", mosaic.tiles[0].width * mosaic.xRatio + dimensionsOffset - 4)
                .attr("y1", getTileY2(mosaic, y2))
                .attr("x2", mosaic.tiles[0].width * mosaic.xRatio + dimensionsOffset + 4)
                .attr("y2", getTileY2(mosaic, y2));

            svgElement.transition()
                .duration(dimAnimSpeed)
                .style("stroke-width", "1")
                .ease(d3.easeExpIn);
        } else {
            svgElement = self.svgContainer.append("line")
                .style("stroke", color)
                .style("stroke-width", "1")
                .attr("x1", mosaic.tiles[0].width * mosaic.xRatio + dimensionsOffset - 4)
                .attr("y1", getTileY2(mosaic, y2))
                .attr("x2", mosaic.tiles[0].width * mosaic.xRatio + dimensionsOffset + 4)
                .attr("y2", getTileY2(mosaic, y2));
        }

        tmpSvgOverlayElems.push(svgElement);

        svgElement = self.svgContainer.append("text")
            .attr("fill", color)
            .attr('text-anchor', 'middle')
            .style("font-size", self.fontSize)
            .style("pointer-events", "none")
            .style("user-select", "none")
            .text(dimensionFormater(y2 - y1))
            .attr("transform", function (d, i) {
                return "translate(" + (mosaic.tiles[0].width * mosaic.xRatio + dimensionsOffset + self.textMargin * 1.25) + " , " + (getTileY2(mosaic, (y1 + ((y2 - y1) / 2)))) + ") rotate(270)";
            });

        tmpSvgOverlayElems.push(svgElement);
    };

    function drawBaseDimensions(mosaic) {
        drawDimensionV(0, mosaic.tiles[0].height, mosaic);
        drawDimensionH(0, mosaic.tiles[0].width, mosaic);
    }

    function drawCut(mosaicIdx, cut) {

        const color = '#d9534f';
        const cutAnimDuration = 300;

        if (self.cfg.isRotated90) {
            var x1 = cut.y1;
            var y1 = cut.x1;
            var x2 = cut.y2;
            var y2 = cut.x2;

            // Create a cut copy and rotate it
            cut = JSON.parse(JSON.stringify(cut));
            cut.x1 = x1;
            cut.y1 = y1;
            cut.x2 = x2;
            cut.y2 = y2;
        }

        var mosaic = self.mosaicsToRender[mosaicIdx];

        cleanTmpSvgOverlayElems();

        var result = mosaic.tiles.filter(function (obj) {
            return obj.id == cut.originalTileId;
        })[0];

        var child1 = mosaic.tiles.filter(function (obj) {
            return obj.id == cut.child1TileId;
        })[0];

        var child2 = mosaic.tiles.filter(function (obj) {
            return obj.id == cut.child2TileId;
        })[0];

        // Overlay to diminish background
        var elem = self.svgContainer.append("rect")
            .attr("width", '100%')
            .attr("height", '100%')
            .attr('fill', "rgba(255,255,255,0.8)")
            .attr("transform", "translate(-5,-12)");    // Undo initial translation

        tmpSvgOverlayElems.push(elem);

        var elem = self.svgContainer.append("rect")
            .attr("x", result.x * mosaic.xRatio)
            .attr("y", getTileY2(mosaic, result.y + result.height))
            .attr("width", result.width * mosaic.xRatio)
            .attr("height", result.height * mosaic.yRatio)
            .attr("vector-effect", "non-scaling-stroke")
            .style("stroke", "black")
            .style("stroke-width", thickStrokeWidth)
            .attr('fill-opacity', "0.6")
            .attr('fill', "url(#gradient)");

        tmpSvgOverlayElems.push(elem);

        if (child1.final === true) {

            var elem = self.svgContainer.append("rect")
                .attr("x", child1.x * mosaic.xRatio)
                .attr("y", getTileY2(mosaic, child1.y + child1.height))
                .attr("width", child1.width * mosaic.xRatio)
                .attr("height", child1.height * mosaic.yRatio)
                .attr("vector-effect", "non-scaling-stroke")
                .style("stroke", "black");
            elem.transition()
                .duration(cutAnimDuration)
                .style("stroke-width", thickStrokeWidth)
                .attr('fill-opacity', "1.7")
                .attr('fill', "#b0bec5");
            tmpSvgOverlayElems.push(elem);
        }

        var elem = self.svgContainer.append("line")
            .style("stroke", color)
            .attr("x1", cut.x1 * mosaic.xRatio)
            .attr("y1", getTileY2(mosaic, cut.y1))
            .attr("x2", cut.x1 * mosaic.xRatio)
            .attr("y2", getTileY2(mosaic, cut.y1))
            .style("stroke-width", "6");

        elem.transition()
            .duration(cutAnimDuration)
            .attr("x1", cut.x1 * mosaic.xRatio)
            .attr("y1", getTileY2(mosaic, cut.y1))
            .attr("x2", cut.x2 * mosaic.xRatio)
            .attr("y2", getTileY2(mosaic, cut.y2));

        tmpSvgOverlayElems.push(elem);

         function isHorizontal(obj) {
            return (obj.x2 - obj.x1) > (obj.y2 - obj.y1);
        }

         function isVertical(obj) {
            return (obj.y2 - obj.y1) > (obj.x2 - obj.x1);
        }

        if (isHorizontal(cut)) {
            drawDimensionH(cut.x1, cut.x2, mosaic);
            drawDimensionV(child1.y, child1.y + child1.height, mosaic);
            if (!!child2) {
                drawDimensionV(child2.y, child2.y + child2.height, mosaic);
            }
        } else if (isVertical(cut)) {
            drawDimensionV(cut.y1, cut.y2, mosaic);
            drawDimensionH(child1.x, child1.x + child1.width, mosaic);
            if (!!child2) {
                drawDimensionH(child2.x, child2.x + child2.width, mosaic);
            }
        }
    }

    function highlightTiles(tile) {

        cleanTmpSvgOverlayElems();

        if (!self.mosaicsToRender) {
            return;
        }

        self.mosaicsToRender.forEach( function(mosaic) {

            var tilesToHighlight = mosaic.tiles.filter(function(obj) {
                return obj.requestObjId === tile.id;
            });

            var drawnDimensions = [];

            tilesToHighlight.forEach( function(tile) {
                var rec = self.svgContainer.append("rect")
                    .attr("x", tile.x * mosaic.xRatio)
                    .attr("x", tile.x * mosaic.xRatio)
                    .attr("y", getTileY2(mosaic, tile.y + tile.height))
                    .attr("width", tile.width * mosaic.xRatio)
                    .attr("height", tile.height * mosaic.yRatio)
                    .attr("vector-effect", "non-scaling-stroke")
                    .style("stroke", "#d9534f")
                    .style("stroke-width", 0)
                    .style("stroke.opacity", 0.0)
                    .classed('background', true)
                    .attr('fill', "#ff0000")
                    .attr('fill-opacity', "0.01");

                rec.transition()
                    .ease(d3.easeElasticOut.amplitude(1).period(0.25))
                    .duration(2000)
                    .style("stroke-width", thickStrokeWidth)
                    .attr('fill-opacity', "0.2");

                // TODO: Use some uid for mosaic
                // Render dimension if not previous rendered
                var key = tile.x.toString() + "x" + (tile.x + tile.width).toString() + JSON.stringify(mosaic);
                if (drawnDimensions.indexOf(key) == -1) {
                    drawDimensionH(tile.x, tile.x + tile.width, mosaic);
                    drawnDimensions.push(key);
                }

                var key = tile.y.toString() + "x" + (tile.y + tile.height).toString() + JSON.stringify(mosaic);
                if (drawnDimensions.indexOf(key) == -1) {
                    drawDimensionV(tile.y, tile.y + tile.height, mosaic);
                    drawnDimensions.push(key);
                }

                tmpSvgOverlayElems.push(rec);
            });
        });
    }

    return {
        clear: clear,
        render: render,
        renderedSoultionId: function() {
            return self.renderedSoultionId;
        },
        cfg: function(value) {
            if(value !== undefined) {
                self.cfg = value;

                // Sanitize values
                if (!self.cfg.initZoom || self.cfg.initZoom < 0 || self.cfg.initZoom > 2) {
                    self.cfg.initZoom = 1;
                }
                if (!self.cfg.zoomFactor || self.cfg.zoomFactor < 0 || self.cfg.zoomFactor > 2) {
                    self.cfg.zoomFactor = 1;
                }
                if (!self.cfg.fontSizeFactor || self.cfg.fontSizeFactor < 0 || self.cfg.fontSizeFactor > 2) {
                    self.cfg.fontSizeFactor = 1;
                }

                if (self.cfg.zoomFactor !== 1 || self.cfg.fontSizeFactor !== 1) {
                    self.isPannedOrZoomed = true;
                }
                render();
            }
            return self.cfg;
        },
        isLabelsVisible: function(value) {
            if(value !== undefined) {
                self.cfg.isLabelsVisible = value;
                render();
            }
            return self.cfg.isLabelsVisible;
        },
        transform: function(value) {
            if(value) {
                self.isPannedOrZoomed = true;
                self.transformStack = value;
                render();
                return;
            }
            return (self.svgContainer ? self.svgContainer.attr("transform") : null);
        },
        zoom: function(value) {
            if(value !== undefined) {
                self.isPannedOrZoomed = true;
                self.zoom = value;
                render();
            }
            return self.zoom;
        },
        resetSvgOverlayElems: resetSvgOverlayElems,
        highlightTiles: highlightTiles,
        drawCut: drawCut,
        setDimensionFormater: setDimensionFormater,
        FitEnum: FitEnum,

        fit: function(value) {
            if(value !== undefined) {
                fit = value;
            }
            return fit;
        },
        isEdgeBandingVisible: function(value) {
            if(value !== undefined) {
                self.cfg.isEdgeBandingVisible = value;
            }
            return self.cfg.isEdgeBandingVisible;
        },
        isGrainVisible: function(value) {
            if(value !== undefined) {
                self.cfg.isGrainVisible = value;
            }
            return self.cfg.isGrainVisible;
        },
        onRender: function(callback) {
            if(callback !== undefined) {
                self.onRender = callback;
            }
            return self.onRender;
        }
    }
}]);

app.service('PdfGenerator', ['DrawService', '$translate', '$q', '$timeout', 'TilingData',
    function(DrawService, $translate, $q, $timeout, TilingData) {

    var self = this;

    self.cfg = {
        font: {size: "20px"},
        headerText: "CutList Optimizer",
        additionalText: "",
        showSummary: true,
        showDate: true,
        showCutsTable: true
    };

    this.generate = function(onFinish, onProgressUpdate) {

        var hMargin = 25;
        var vMargin = 50;

        // Generate PDF
        var doc = new jsPDF('p', 'pt', 'a4');
        doc.page = 1;
        var pdfWidth = doc.internal.pageSize.width;
        var pdfHeight = doc.internal.pageSize.height;

        var infoImgData = [];
        var infoImgWidth = [];
        var infoImgHeight = [];

        var diagramImageData = [];
        var diagramImgWidth = [];
        var diagramImgHeight = [];

        var imgData;

        // Create promises to be resolved once all images are rendered
        var promises = [];
        var deferreds = [];
        for (i = 0; i < TilingData.mosaics.length; i++) {
            var deferred;
            deferred = $q.defer();
            promises.push(deferred.promise);
            deferreds.push(deferred);
        }

        // Used to track progress
        var nbrTotalPromises = TilingData.mosaics.length + 3;
        var nbrPromisesToBeSolved = nbrTotalPromises;

        function refreshPdfExportProgress() {
            nbrPromisesToBeSolved--;
            var pdfProgressPercentage = Math.trunc((nbrTotalPromises - nbrPromisesToBeSolved) / nbrTotalPromises * 100);
            onProgressUpdate(pdfProgressPercentage);
        }

        var resolvedPromiseIndex = -1;

        // Render the header
        var headerDeferred = $q.defer();
        promises.push(headerDeferred.promise);
        deferreds.push(headerDeferred);
        resolvedPromiseIndex++;
        var headerElement = document.getElementById('pdf-header');
        var pdfHeaderElementWidth = pdfWidth - hMargin * 2;
        var pdfHeaderElementHeight = headerElement.clientHeight * pdfHeaderElementWidth / headerElement.clientWidth;
        var headerImageData;
        html2canvas(headerElement, {
            background: '#fff',
            onrendered: function (resolvedPromiseIndex) {
                return function (canvas) {
                    headerImageData = canvas.toDataURL('image/jpeg');
                    deferreds[resolvedPromiseIndex].resolve();
                    refreshPdfExportProgress();
                }
            }(resolvedPromiseIndex)
        });

        // Render the footer
        var footerDeferred = $q.defer();
        promises.push(footerDeferred.promise);
        deferreds.push(footerDeferred);
        resolvedPromiseIndex++;
        var footerElement = document.getElementById('pdf-footer');
        var pdfFooterElementWidth = pdfWidth - hMargin * 2;
        var pdfFooterElementHeight = footerElement.clientHeight * pdfFooterElementWidth / footerElement.clientWidth;
        var footerImageData;
        html2canvas(footerElement, {
            background: '#fff',
            onrendered: function (resolvedPromiseIndex) {
                return function (canvas) {
                    footerImageData = canvas.toDataURL('image/jpeg');
                    deferreds[resolvedPromiseIndex].resolve();
                    refreshPdfExportProgress();
                }
            }(resolvedPromiseIndex)
        });

        // Render the summary
        var deferred;
        deferred = $q.defer();
        promises.push(deferred.promise);
        deferreds.push(deferred);
        resolvedPromiseIndex++;
        var summaryElement = document.getElementById('pdf-summary');
        var pdfSummaryElementWidth = pdfWidth - hMargin * 2;
        var pdfSummaryElementHeight = summaryElement.clientHeight * pdfSummaryElementWidth / summaryElement.clientWidth;
        var summaryImageData;
        if (self.cfg.showSummary || self.cfg.additionalText) {
            html2canvas(summaryElement, {
                background: '#fff',
                onrendered: function (resolvedPromiseIndex) {
                    return function (canvas) {
                        summaryImageData = canvas.toDataURL('image/jpeg');
                        doc.addImage(summaryImageData, 'JPEG', hMargin, 20 + pdfHeaderElementHeight, pdfSummaryElementWidth, pdfSummaryElementHeight);
                        deferreds[resolvedPromiseIndex].resolve();
                        refreshPdfExportProgress();
                    }
                }(resolvedPromiseIndex)
            });
        } else {
            // No need to render the summary, resolve the promise
            deferreds[resolvedPromiseIndex].resolve();
        }

        for (i = 0; i < TilingData.mosaics.length; i++) {

            // Get diagram canvas
            DrawService.fit(DrawService.FitEnum.FIT_HORIZONTALLY);
            DrawService.render(true, i);

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
            imgData = canvas.toDataURL('image/jpeg');

            diagramImageData.push(imgData);
            diagramImgWidth.push(svgWidth);
            diagramImgHeight.push(svgHeight);

            // Get info tables canvas

            var infoElement = document.getElementById('pdf-info-' + i);

            // Store PDF info table image
            // Use promises to wait for previous html2canvas
            resolvedPromiseIndex++;
            promises[resolvedPromiseIndex - 1].then(function (resolvedPromiseIndex, infoElement) {
                return function () {

                    // Make the table visible and store its dimensions
                    infoElement.style.display = "block";
                    infoImgWidth.push(infoElement.clientWidth);
                    infoImgHeight.push(infoElement.clientHeight);

                    // Store the table canvas
                    html2canvas(infoElement, {
                        background: '#fff',
                        onrendered: function (resolvedPromiseIndex) {
                            return function (canvas) {
                                var canvasImgData = canvas.toDataURL('image/jpeg');
                                infoImgData.push(canvasImgData);
                                deferreds[resolvedPromiseIndex].resolve();
                                refreshPdfExportProgress();

                                // Info table is no longer needed, hide it.
                                infoElement.style.display = "none";
                            }
                        }(resolvedPromiseIndex)
                    });
                }
            }(resolvedPromiseIndex, infoElement));
        }

        var yPos = pdfHeaderElementHeight + pdfSummaryElementHeight + 12;

        // Execute after all canvas were rendered
        $q.all(promises).then(function () {

            infoImgData.forEach(function (infoImgDataElem, i) {

                var docInfoImgWidth = 120;
                var docInfoImgHeight = infoImgHeight[i] * docInfoImgWidth / infoImgWidth[i];

                function getDiagramWidth(i) {
                    return pdfWidth - 200;
                }

                function getDiagramHeight(i) {
                    return getDiagramWidth(i) * diagramImgHeight[i] / diagramImgWidth[i];
                }

                function getDiagramDocSize(i, yStartPos, fit) {
                    var width;
                    var height;

                    if (typeof fit === 'undefined') {
                        fit = DrawService.FitEnum.FIT_ALL;
                    }

                    if (fit === DrawService.FitEnum.FIT_ALL) {
                        width = pdfWidth - 155;
                        height = width * diagramImgHeight[i] / diagramImgWidth[i];
                        if (height > pdfHeight - (yPos + 10 + vMargin)) {
                            height = pdfHeight - (yPos + 10 + vMargin);
                            width = height * diagramImgWidth[i] / diagramImgHeight[i];
                        }
                    } else if (fit === DrawService.FitEnum.FIT_HORIZONTALLY)  {
                        width = pdfWidth - 150;
                        height = width * diagramImgHeight[i] / diagramImgWidth[i];
                    } else if (fit === DrawService.FitEnum.FIT_VERTICALLY)  {
                        height = pdfHeight - (yPos + 10 + vMargin);
                        width = height * diagramImgWidth[i] / diagramImgHeight[i];
                    }

                    return {width: width, height: height};
                }

                // Add info table
                doc.addImage(infoImgData[i], 'JPEG', hMargin, yPos + hMargin, docInfoImgWidth, docInfoImgHeight);

                // Add diagram image
                doc.addImage(diagramImageData[i], 'JPEG', 120 + 35, yPos + 10, getDiagramDocSize(i, yPos + 10).width, getDiagramDocSize(i, yPos + 10).height);

                yPos += 15 + Math.max(getDiagramDocSize(i, yPos + 10).height, docInfoImgHeight);

                doc.setFont("helvetica");
                doc.setFontSize(6);

                // Header
                doc.addImage(headerImageData, 'JPEG', hMargin, 20, pdfHeaderElementWidth, pdfHeaderElementHeight);

                // Footer
                doc.addImage(footerImageData, 'JPEG', hMargin, pdfHeight - pdfFooterElementHeight - 20, pdfFooterElementWidth, pdfFooterElementHeight);

                if (i < infoImgData.length - 1) {
                    let isNextDiagramFit = yPos + getDiagramDocSize(i + 1, yPos, DrawService.FitEnum.FIT_HORIZONTALLY).height < pdfHeight - 20;

                    let nextDocInfoImgHeight = infoImgHeight[i + 1] * docInfoImgWidth / infoImgWidth[i + 1];
                    let isNextInfoTableFit = yPos + hMargin + nextDocInfoImgHeight < pdfHeight - 20;

                    // Check whether info diagram isn't too big and fits a single page
                    // If not, print it in current page even if cropped
                    let isInfoTable2Big2Fit1Page = nextDocInfoImgHeight > pdfHeight - 30 - 20 - hMargin;

                    if (!isNextDiagramFit || !isNextInfoTableFit && !isInfoTable2Big2Fit1Page) {
                        // Go to next page if diagram or info table doesn't fit
                        doc.addPage();
                        doc.page++;
                        yPos = 30;
                    }
                }
            });

            // Add page numbers

            var pageCount = doc.internal.getNumberOfPages();
            for (i = 0; i < pageCount; i++) {
                doc.setPage(i);
                doc.text(pdfWidth - 25, pdfHeight - 22, doc.internal.getCurrentPageInfo().pageNumber + "/" + pageCount, 'right');
            }

            DrawService.fit(DrawService.FitEnum.FIT_ALL);
            DrawService.clear("svg-canvas-export");

            onFinish(doc);
        });
    };

}]);
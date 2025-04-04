app.service('CsvHandler', ['fileReader', 'DimensionProcessor', 'ToastService', '$translate',
    function(fileReader, DimensionProcessor, ToastService, $translate) {

    function generateCsvContent(tiles, cfg) {

        var csvContent;

        try {
            var row = 'Length,Width,Qty';

            if (cfg.isMaterialEnabled) {
                row += ',Material';
            }

            if (cfg.isTileLabelVisible) {
                row += ',Label';
            }

            row += ',Enabled';

            if (cfg.considerOrientation) {
                row += ',Grain direction';
            }

            if (cfg.hasEdgeBanding) {
                row += ',Top band,Left band,Bottom band,Right band';
            }

            csvContent = row + "\r\n";

            tiles.forEach(function(tile) {
                if (tile.height && tile.width) {
                    var row = tile.height + "," + tile.width + "," + tile.count;

                    if (cfg.isMaterialEnabled) {
                        row += ',' + (tile.material ? tile.material : '');
                    }

                    if (cfg.isTileLabelVisible) {
                        row += ',' + (tile.label ? tile.label : '');
                    }

                    row += ',' + tile.enabled;

                    if (cfg.considerOrientation) {
                        if (tile.orientation == 0) {
                            row += ',';
                        } else if (tile.orientation == 1) {
                            row += ',h';
                        } else if (tile.orientation == 2) {
                            row += ',v';
                        }
                    }

                    if (cfg.hasEdgeBanding && tile.edge) {
                        row += ',' + (tile.edge.top ? tile.edge.top : '');
                        row += ',' + (tile.edge.left ? tile.edge.left : '');
                        row += ',' + (tile.edge.bottom ? tile.edge.bottom : '');
                        row += ',' + (tile.edge.right ? tile.edge.right : '');
                    }

                    csvContent += row + '\r\n';
                }
            });
        } catch(e) {
            console.error("Error while generating CSV content\n" + e.stack);
        }

        return csvContent;
    }

    function generateConfigurationDataString(cfg) {

        var cfgString = "";

        cfgString += "cutThickness " + cfg.cutThickness * cfg.dimensionFactor + "\n";
        cfgString += "considerGrain " + (cfg.considerOrientation ? "1" : "0") + "\n";
        cfgString += "useSingleStockUnit " + (cfg.useSingleStockUnit ? "1" : "0") + "\n";
        cfgString += "units " + cfg.units + "\n";

        return cfgString;
    }



    function generateProjectContent(tiles, stockTiles, cfg) {

        var tiles =  generateCsvContent(tiles, cfg);
        var stockTiles =  generateCsvContent(stockTiles, cfg);
        var cfgString = generateConfigurationDataString(cfg);

        var projectString = "";

        projectString += "panels {\n";
        projectString += tiles;
        projectString += "}\n";
        projectString += "stock {\n";
        projectString += stockTiles;
        projectString += "}\n";
        projectString += cfgString;

        return projectString;
    }

    function exportTiles(tiles, cfg, filename) {
        try {

            var csvContent = generateCsvContent(tiles, cfg);

            if (typeof android !== 'undefined') {
                android.saveCsv(csvContent, filename);
            } else {
                var ie = navigator.userAgent.match(/MSIE\s([\d.]+)/),
                    ie11 = navigator.userAgent.match(/Trident\/7.0/) && navigator.userAgent.match(/rv:11/),
                    ieEDGE = navigator.userAgent.match(/Edge/g),
                    ieVer = (ie ? ie[1] : (ie11 ? 11 : (ieEDGE ? 12 : -1)));

                if (ie && ieVer < 10) {
                    console.log("No blobs on IE ver<10");
                    return;
                }

                var textFileAsBlob = new Blob([csvContent], {
                    type: 'text/csv'
                });

                if (ieVer > -1) {
                    window.navigator.msSaveBlob(textFileAsBlob, filename);
                } else {
                    var encodedUri = encodeURI('data:text/csv;charset=utf-8,' + csvContent);
                    var downloadLink = document.createElement("a");
                    downloadLink.download = filename;
                    downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
                    downloadLink.onclick = function (e) {
                        document.body.removeChild(e.target);
                    };
                    downloadLink.style.display = "none";
                    document.body.appendChild(downloadLink);
                    downloadLink.click();
                }
            }

        } catch(e) {
            console.error("Error while exporting CSV\n" + e.stack);
        }
    }

    function exportProject(tiles, stockTiles, cfg, filename) {
        try {

            var csvContent = generateProjectContent(tiles, stockTiles, cfg);

            var ie = navigator.userAgent.match(/MSIE\s([\d.]+)/),
                ie11 = navigator.userAgent.match(/Trident\/7.0/) && navigator.userAgent.match(/rv:11/),
                ieEDGE = navigator.userAgent.match(/Edge/g),
                ieVer=(ie ? ie[1] : (ie11 ? 11 : (ieEDGE ? 12 : -1)));

            if (ie && ieVer < 10) {
                console.log("No blobs on IE ver<10");
                return;
            }

            var textFileAsBlob = new Blob([csvContent], {
                type: 'text/csv'
            });

            if (ieVer > -1) {
                window.navigator.msSaveBlob(textFileAsBlob, filename);
            } else {
                var encodedUri = encodeURI('data:text/csv;charset=utf-8,' + csvContent);
                var downloadLink = document.createElement("a");
                downloadLink.download = filename;
                downloadLink.href = window.URL.createObjectURL(textFileAsBlob);
                downloadLink.onclick = function(e) { document.body.removeChild(e.target); };
                downloadLink.style.display = "none";
                document.body.appendChild(downloadLink);
                downloadLink.click();
            }

        } catch(e) {
            console.error("Error while exporting CSV\n" + e.stack);
        }
    }

    function csvToTiles(tiles, csv) {

        function isHeader(row, fieldDelimiter) {
            try {

                var firstCell = removeQuotes(row.split(fieldDelimiter)[0].trim());
                var secondCell = removeQuotes(row.split(fieldDelimiter)[1].trim());

                // Try to identify at least two columns having header
                // Consider not an header if 1st char is a number
                if (isNaN(firstCell.charAt(0)) && parseHeader(firstCell) !== null &&
                    isNaN(secondCell.charAt(0)) && parseHeader(secondCell) !== null) {
                    return true
                } else {
                    return false;
                }
            } catch (e) {
                return false;
            }
        }

        function parseHeader(header) {
            try {
                header = removeQuotes(header.trim());
                if (header.toLowerCase().indexOf("width") !== -1 ||
                    header.toLowerCase().trim() === "w") {
                    return 'width';
                } else if (header.toLowerCase().indexOf("height") !== -1 ||
                    header.toLowerCase().trim() === "h" ||
                    header.toLowerCase().indexOf("length") !== -1 ||
                    header.toLowerCase().indexOf("size") !== -1 ||
                    header.toLowerCase().indexOf("dimension") !== -1) {
                    return 'height';
                } else if (header.toLowerCase().indexOf("qty") !== -1 ||
                    header.toLowerCase().indexOf("count") !== -1 ||
                    header.toLowerCase().indexOf("quantity") !== -1 ||
                    header.toLowerCase().indexOf("copies") !== -1 ||
                    header.toLowerCase().trim() === "num" ||
                    header.toLowerCase().indexOf("number") !== -1) {
                    return 'count';
                } else if (header.toLowerCase().indexOf("enabled") !== -1 ||
                    header.toLowerCase().indexOf("active") !== -1) {
                    return 'enabled';
                } else if (header.toLowerCase().indexOf("material") !== -1) {
                    return 'material';
                } else if (header.toLowerCase().indexOf("label") !== -1 ||
                    header.toLowerCase().indexOf("label") !== -1 ||
                    header.toLowerCase().indexOf("description") !== -1) {
                    return 'label';
                } else if (header.toLowerCase().indexOf("orientation") !== -1 ||
                    header.toLowerCase().indexOf("grain") !== -1) {
                    return 'orientation';
                } else if (header.toLowerCase().indexOf("top") !== -1) {
                    return 'edge.top';
                } else if (header.toLowerCase().indexOf("left") !== -1) {
                    return 'edge.left';
                } else if (header.toLowerCase().indexOf("bottom") !== -1) {
                    return 'edge.bottom';
                } else if (header.toLowerCase().indexOf("right") !== -1) {
                    return 'edge.right';
                } else {
                    console.warn("Unknown CSV header: " + header + "\ncsv:\n" + csv);
                    return null;
                }
            } catch(e) {
                console.error("Error while parsing CSV header" + "\ncsv:\n" + csv + "\n" + e.stack);
            }
        }

        var fieldDelimiter = ',';

        var lines = csv.split("\n");

        // Check if comma is ok as field delimiter
        if (lines[0].split(",").length < 3) {
            // Test alternate field delimiters
            if (lines[0].split(";").length > 2) {
                fieldDelimiter = ';'
            } else if (lines[0].split(":").length > 2) {
                fieldDelimiter = ':';
            }
        }

        var headers;
        var firstRowIdx;

        if (isHeader(lines[0], fieldDelimiter)) {
            headers = lines[0].split(fieldDelimiter);
            firstRowIdx = 1;
        } else {
            headers = ["Length", "Width", "Qty", "Material", "Label", "Enabled", "Grain direction", "Top band", "Left band", "Bottom band", "Right band"];
            firstRowIdx = 0;
        }

        tiles.length = 0;

        for(var i = firstRowIdx; i < lines.length; i++){
            var tile = {};
            var currentline = lines[i].split(fieldDelimiter);

            // Assume there's at least 3 fields
            if (currentline.length < 3) {
                continue;
            }

            try {

                // Parse the row
                for (var j = 0; j < headers.length; j++) {
                    var header = parseHeader(headers[j]);

                    if (!header) {
                        continue;
                    }

                    var value = removeQuotes(currentline[j]);

                    if (header.indexOf('.') === -1) {
                        tile[header] = value === "null" ? "" : value;
                    } else {
                        // Assume we have a nested attribute
                        var attributes = header.split(".");
                        // Ensure first attribute object is initialized
                        tile[attributes[0]] = tile[attributes[0]] ? tile[attributes[0]] : {};
                        // Set the second attribute value
                        tile[attributes[0]][attributes[1]] = value;
                    }
                }

                if (tile.count === "0") {
                    tile.count = "";
                }

                if (tile.orientation && (
                    tile.orientation.toLowerCase().indexOf("hor") !== -1 ||
                    tile.orientation.toLowerCase().trim() == 'h' ||
                    tile.orientation.trim() == '1')) {
                    tile.orientation = 1;
                } else if (tile.orientation && (
                    tile.orientation.toLowerCase().indexOf("ver") !== -1 ||
                    tile.orientation.toLowerCase().trim() == 'v' ||
                    tile.orientation.trim() == '2')) {
                    tile.orientation = 2;
                } else {
                    tile.orientation = 0;
                }

                if (tile.enabled && (
                    tile.enabled.toLowerCase().trim() == 'false' ||
                    tile.enabled.toLowerCase().trim() == 'f' ||
                    tile.enabled.toLowerCase().trim() == 'no' ||
                    tile.enabled.toLowerCase().trim() == 'n' ||
                    tile.enabled.toLowerCase().trim() == 'off' ||
                    tile.enabled.trim() == '0')) {
                    tile.enabled = false;
                } else {
                    tile.enabled = true;
                }

                if (tile.edge) {
                    // Replace Empty string by null
                    tile.edge.top = tile.edge.top === '' ? null : tile.edge.top;
                    tile.edge.left = tile.edge.left === '' ? null : tile.edge.left;
                    tile.edge.bottom = tile.edge.bottom === '' ? null : tile.edge.bottom;
                    tile.edge.right = tile.edge.right === '' ? null : tile.edge.right;
                }

            } catch (e) {
                // In case of error parsing the field, skip to the next one.
                console.error("Error while parsing CSV row\n" + "currentline: " + currentline + "\ncsv:\n" + csv + "\n" + e.stack);
                continue;
            } finally {
                if (!tile.count || isNaN(tile.count)) {
                    tile.count = 1;
                }
                if (!tile.width || isNaN(tile.width.charAt(0))) {
                    tile.width = 1;
                }
                if (!isNaN(tile.height.charAt(0))) {
                    // We have, at least, a count, width and height attribute. The panel is good to go
                    tiles.push(tile);
                }
            }
        }
    }

    function b64DecodeUnicode(str) {
        // Going backwards: from bytestream, to percent-encoding, to original string.
        return decodeURIComponent(atob(str).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
    }

    function importTiles(tiles, scope) {
        try {
            if (scope.file instanceof File ) {
                fileReader.readAsDataUrl(scope.file, scope)
                    .then(function (result) {
                        try {
                            var csv = b64DecodeUnicode(result.split(',')[1]);
                            csv = csv.replace(/\r/g, "\n"); // Replace 'CR' occurrences by 'LF'
                            csvToTiles(tiles, csv);
                            DimensionProcessor.sanitizePanelListDimensions(tiles);
                            scope.refreshEdgeBandList();
                        } catch (e) {
                            console.error("Error while importing CSV from file: " + scope.file.name + "\n" + e.stack);
                            ToastService.error($translate.instant('ERROR'));
                        }
                    });
            } else {
                var csv = scope.file;
                csvToTiles(tiles, csv);
                DimensionProcessor.sanitizePanelListDimensions(tiles);
                scope.refreshEdgeBandList();
            }
        } catch (e) {
            console.error("Error while importing CSV\n" + e.stack);
        }
    }

    function importProject(scope) {
        fileReader.readAsDataUrl(scope.file, scope)
            .then(function(result) {
                try {
                    var csv = b64DecodeUnicode(result.split(',')[1]);
                    csv = csv.replace(/\r/g, "\n"); // Replace 'CR' occurrences by 'LF'

                    loadProject(csv, scope);

                } catch(e) {
                    console.error("Error while importing CSV\n" + e.stack);
                }
            });
    }

    function loadProject(projectData, scope) {

        var lines = projectData.split('\n');

        var panelsCsv = '';
        var stockCsv = '';

        var currentSection;

        for (i = 0; i < lines.length; i++) {
            try {
                if (lines[i].indexOf("panels") !== -1) {
                    currentSection = "panels";
                } else if (lines[i].indexOf("stock") !== -1) {
                    currentSection = "stock";
                } else if (lines[i].indexOf("cutThickness") !== -1) {
                    var cutThickness = lines[i].trim().split(' ')[1];
                    scope.cfg.cutThicknessInput = cutThickness;
                    scope.cutThicknessInput();
                } else if (lines[i].indexOf("considerGrain") !== -1) {
                    var considerGrain = lines[i].trim().split(' ')[1];
                    scope.cfg.considerOrientation = !!+considerGrain;
                } else if (lines[i].indexOf("useSingleStockUnit") !== -1) {
                    var useSingleStockUnit = lines[i].trim().split(' ')[1];
                    scope.cfg.useSingleStockUnit = !!+useSingleStockUnit;
                } else if (lines[i].indexOf("units") !== -1) {
                    var units = lines[i].trim().split(' ')[1];
                    scope.cfg.units = Number(units);
                } else if (lines[i].indexOf("}") !== -1) {
                    currentSection = null;
                } else {
                    if (currentSection === "panels") {
                        panelsCsv += lines[i] + "\n";
                    } else if (currentSection === "stock") {
                        stockCsv += lines[i] + "\n";
                    }
                }
            } catch(e) {
                console.error("Error while parsing project data\n" + "projectData:\n" + projectData + "\n" + e.stack);
            }
        }

        csvToTiles(scope.tiles, panelsCsv);
        csvToTiles(scope.stockTiles, stockCsv);

        DimensionProcessor.sanitizePanelListDimensions(scope.tiles);
        DimensionProcessor.sanitizePanelListDimensions(scope.stockTiles);

        scope.refreshMaterialsList();
        scope.refreshEdgeBandList();
    }

    function removeQuotes(value) {
        // Remove quotes from quoted text
        if (value && value.charAt(0) === '\'') {
            value = value.replace(/(^')|('$)/g, '');
        }
        if (value && value.charAt(0) === '"') {
            value = value.replace(/(^")|("$)/g, '');
            value = value.replace('""', '"');
        }
        return value;
    }

    return {
        generateCsvContent: generateCsvContent,
        importTiles: importTiles,
        exportTiles: exportTiles,
        exportProject: exportProject,
        csvToTiles: csvToTiles,
        loadProject: loadProject,
        importProject: importProject
    }
}]);

app.directive("ngCsvPanelSelect", ['CsvHandler', function(CsvHandler) {
    return {

        link: function($scope, el) {

            el.bind("change", function(e) {

                // Remove the DOM element used for open file dialog
                $scope.tmpHtmlElement.remove();

                $scope.file = (e.srcElement || e.target).files[0];
                CsvHandler.importTiles($scope.tiles, $scope);
            })
        }
    }
}]);

app.directive("ngCsvSheetSelect", ['CsvHandler', function(CsvHandler) {
    return {

        link: function($scope, el) {

            el.bind("change", function(e) {

                // Remove the DOM element used for open file dialog
                $scope.tmpHtmlElement.remove();

                $scope.file = (e.srcElement || e.target).files[0];
                CsvHandler.importTiles($scope.stockTiles, $scope);
            })
        }
    }
}]);

app.directive("ngProjectSelect", ['CsvHandler', function(CsvHandler) {
    return {

        link: function($scope, el) {

            el.bind("change", function(e) {

                // Remove the DOM element used for open file dialog
                $scope.tmpHtmlElement.remove();

                $scope.file = (e.srcElement || e.target).files[0];
                CsvHandler.importProject($scope);
            })
        }
    }
}]);

app.controller('StatsController', ['$scope', 'TilingData', 'DimensionProcessor', '$translate',
    function($scope, TilingData, DimensionProcessor, $translate) {

        $scope.date = (new Date()).toLocaleDateString();

        $scope.getStockPanelListMultiLine = function () {
            try {
                if (!TilingData || !TilingData.data || !TilingData.data.usedStockPanels) {
                    return;
                }

                var html = '';
                for (i = 0; i < TilingData.data.usedStockPanels.length; i++) {
                    const tile = TilingData.data.usedStockPanels[i];

                    const workspacePanel = $scope.$parent.stockTiles.filter(function (obj) {
                        return tile.requestObjId == obj.id;
                    })[0];

                    var toAppend = '<div style="line-height: 1; margin-top:4px; margin-bottom: 4px">';

                    toAppend += '<span class="stats-row-primary">';

                    toAppend += DimensionProcessor.formatPanelDimensionsHtml(tile);

                    toAppend += '\u00A0';
                    toAppend += '<small>';
                    toAppend += 'x' + tile.count;
                    toAppend += '</small>';

                    toAppend += '</span>';

                    var labelAndMaterial = '';
                    if ($scope.$parent.cfg.isTileLabelVisible && workspacePanel && workspacePanel.label && workspacePanel.label !== '') {
                        labelAndMaterial += workspacePanel.label;
                    }

                    if ($scope.$parent.cfg.isMaterialEnabled && workspacePanel && workspacePanel.material && workspacePanel.material !== '') {
                        if (labelAndMaterial) {
                            labelAndMaterial += ' - ';
                        }
                        labelAndMaterial += workspacePanel.material;
                    }
                    if (labelAndMaterial) {
                        toAppend += '<span class="stats-row-secondary">';
                        toAppend += labelAndMaterial.replace(/\u0020/g, '\u00A0');    // Replace spaces with non breakable spaces;
                        toAppend += '</span>';
                    }

                    html += toAppend + '</div>';
                }
            } catch(e) {
                console.error("Error creating panel stock list string\n" + e.stack);
            }

            return html;
        }

        $scope.getPanelInfo = function (mosaic) {

            var ret = "";

            if (!mosaic) {
                return ret;
            }

            if (mosaic.tiles[0].label) {
                ret = mosaic.tiles[0].label + " - ";
            }

            ret += DimensionProcessor.formatPanelDimensionsHtml(mosaic.tiles[0]);

            return ret;
        };

        $scope.getPanelListHtml = function () {
            if (!TilingData.data || !TilingData.data.panels) {
                return;
            }
            return createPanelList(TilingData.data.panels);
        }

        $scope.getStockPanelListHtml = function () {
            if (!TilingData.data || !TilingData.data.usedStockPanels) {
                return;
            }
            return createPanelList(TilingData.data.usedStockPanels);
        }

        function createPanelList(tiles) {
            const separator = '<span style=\'color: darkgray\'>' + '\u00A0\u00A0\\\u00A0 ' + '</span>';
            var str = '';
            for (i = 0; i < tiles.length; i++) {
                var tile = tiles[i];

                if (tile.enabled === false || !(tile.count > 0)) {
                    continue;
                }

                let toAppend =  DimensionProcessor.formatPanelDimensionsHtml(tile);
                toAppend += ' ';

                if ($scope.cfg.isTileLabelVisible && tile.label && tile.label !== '') {
                    toAppend += '<small>' + tile.label + '</small>';
                }

                toAppend += ' ';
                toAppend += '<small>' + 'x' + tile.count + '</small>';
                toAppend = toAppend.replace(/\u0020/g, '\u00A0');    // Replace spaces with non breakable spaces

                str += toAppend + separator;
            }

            // Remove last separator
            str = str.substring(0, str.length - separator.length - 1);

            return str;
        }

        $scope.generateCutResultChild1 = function (cut, mosaic) {
            var childTile1 = mosaic.tiles.filter(function (tile) {
                return tile.id === cut.child1TileId;
            })[0];

            var tooltipCfg = 'data-animation="false" onmouseenter="$(this).tooltip(\'show\')"';

            if (!!childTile1) {
                if(!childTile1.hasChildren) {
                    if (childTile1.final) {
                        if ($scope.cfg.isTileLabelVisible && !!childTile1.label) {
                            let tooltipText = childTile1.label + ' ' + DimensionProcessor.formatDimensions(childTile1);
                            return '<span ' + tooltipCfg + 'title="' + tooltipText + '">' + childTile1.label + '</span>';
                        } else {
                            return DimensionProcessor.formatPanelDimensionsHtml(childTile1);
                        }
                    } else {
                        let label = $translate.instant('SURPLUS') + '  ' + DimensionProcessor.formatDimensions(childTile1);
                        return '<span ' + tooltipCfg + ' title="' + label + '" style="color: darkgray">' + label + ' ' + '</span>';
                    }
                } else {
                    return '<span style="color: darkgray">' + '-' + '</span>';
                }
            } else {
                return '<span style="color: darkgray">' + '-' + '</span>';
            }
        }

        $scope.generateCutResultChild2 = function (cut, mosaic) {
            var childTile2 = mosaic.tiles.filter(function (tile) {
                return tile.id === cut.child2TileId;
            })[0];

            var tooltipCfg = 'data-animation="false" onmouseenter="$(this).tooltip(\'show\')"';

            if (!!childTile2) {
                if ($scope.cfg.isTileLabelVisible && !!childTile2.label) {
                    var tooltipText = childTile2.label + ' ' + DimensionProcessor.formatDimensions(childTile2);
                    return '<span ' + tooltipCfg + ' title="' + tooltipText + '">' + childTile2.label + '</span>';
                } else if (!childTile2.hasChildren) {
                    var label = $translate.instant('SURPLUS') + '  ' + DimensionProcessor.formatDimensions(childTile2);
                    return '<span ' + tooltipCfg + 'title="' + label + '" style="color: darkgray">' + label + '</span>';
                } else {
                    return '<span style="color: darkgray">' + '-' + '</span>';
                }
            } else {
                return '<span style="color: darkgray">' + '-' + '</span>';
            }
        }
}]);

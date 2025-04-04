app.service('MaterialService', [function() {

    function isTileValid(tile) {
        return tile.width !== null && tile.height !== null && tile.count !== null;
    }

    this.getUsedMaterials = function(tiles) {

        var usedMaterials = [];

        if (!tiles) {
            return usedMaterials;
        }

        Object.keys(tiles).forEach(function (key) {
            if (tiles[key].material) {
                usedMaterials.push(tiles[key].material);
            }
        });

        return usedMaterials;
    };

    this.getNoStockMaterials = function(tiles, stockTiles) {

        noStockMaterials = [];

        var tileMaterials = this.getUsedMaterials(tiles);
        var stockTilekMaterials = this.getUsedMaterials(stockTiles);

        tileMaterials.forEach(function (material) {
            if (!stockTilekMaterials.includes(material)) {
                noStockMaterials.push(material);
            }
        });

        noMaterialTiles = tiles.filter(function(obj) { return isTileValid(obj) && obj.material === null; });
        noMaterialStockTiles = stockTiles.filter(function(obj) { return isTileValid(obj) && obj.material === null; });

        if (noMaterialTiles.length > 0 && noMaterialStockTiles.length === 0) {
            noStockMaterials.push(null);
        }

        // Remove duplicated
        noStockMaterials = noStockMaterials.filter(function (value, index, self) { return self.indexOf(value) === index; });

        return noStockMaterials;
    };

    this.getNoStockMaterialTiles = function(tiles, stockTiles) {

        var noStockMaterialTiles = [];

        var noStockMaterials = this.getNoStockMaterials(tiles, stockTiles);

        noStockMaterials.forEach(function (material) {
            noStockMaterialTiles = noStockMaterialTiles.concat(
                tiles.filter(function(obj) {
                    return isTileValid(obj) && obj.material === material;
                })
            );
        });

        return noStockMaterialTiles;
    };

    this.getTilesByMaterial = function(tiles, material) {
        return tiles.filter(function(obj) {
            return obj.material === material;
        });
    };

}]);
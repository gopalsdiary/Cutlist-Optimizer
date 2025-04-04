app.service('TilingData', ['DimensionProcessor',
    function(DimensionProcessor) {

    const self = this;

    self.data = null;

    self.shouldGroupEqualMosaics = true;

    self.getMosaics = function() {
        if (!self.data) {
            return [];
        }

        if (self.shouldGroupEqualMosaics) {
            if (!self.data.groupedMosaics) {
                genGroupedMosaics();
            }

            return self.data.groupedMosaics;
        }

        return self.data.mosaics;
    };

    self.clear = function() {
        self.data = null;
    };

    function genGroupedMosaics () {
        try {

            if (!self.data || !self.data.mosaics) {
                return;
            }

            const groupedMosaics = JSON.parse(JSON.stringify(self.data.mosaics));

            // Calculate an hash code for every mosaic not considering the ids
            groupedMosaics.forEach(function (mosaic) {
                const mosaicCopy = JSON.parse(JSON.stringify(mosaic));
                delete mosaicCopy['panels'];
                filterObject(mosaicCopy, 'id');
                //filterObject(mosaicCopy, 'requestObjId');
                filterObject(mosaicCopy, 'originalTileId');
                filterObject(mosaicCopy, 'child1TileId');
                filterObject(mosaicCopy, 'child2TileId');
                mosaic.hashcode = JSON.stringify(mosaicCopy).hashCode();
            });

            // Check for repeated mosaics within mosaic response array
            self.data.maxGroupOcurrences = 0;
            groupedMosaics.forEach(function (mosaic1, i) {
                if (mosaic1.isDuplicate) {
                    return;
                }
                for (j = i + 1; j < groupedMosaics.length; j++) {
                    if (mosaic1.hashcode === groupedMosaics[j].hashcode) {
                        groupedMosaics[j].isDuplicate = true;
                        mosaic1.ocurrences = ++mosaic1.ocurrences || 1;
                    }
                }
                mosaic1.ocurrences = ++mosaic1.ocurrences || 1;
                self.data.maxGroupOcurrences = Math.max(mosaic1.ocurrences, self.data.maxGroupOcurrences);
            });

            // Filter out repeated mosaics
            self.data.groupedMosaics = groupedMosaics.filter( function(mosaic) {
                return !mosaic.isDuplicate;
            });
        } catch(e) {
            console.error("Error parsing mosaics for repeated instances\n" + e.stack);
        }
    }

    return {
        get mosaics() {
            return self.getMosaics();
        },
        get data() {
            return self.data;
        },
        set data(value) {
            self.data = value;
            genGroupedMosaics();
        },
        get shouldGroupEqualMosaics() {
            return self.shouldGroupEqualMosaics;
        },
        set shouldGroupEqualMosaics(value) {
            self.shouldGroupEqualMosaics = value;
        },
        clear: self.clear
    }
}]);

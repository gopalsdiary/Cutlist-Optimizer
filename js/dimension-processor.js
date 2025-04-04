app.factory('DimensionProcessor', function() {

    const self = this;

    const UnitsEnum = Object.freeze({
        "generic": 1,
        "mm": 2,
        "cm": 3,
        "inches": 4,
        "feet_inches": 5,
        "feet_inches_frac": 6,
        "inches_frac": 7,
        "m": 8
    });

    self.unit = UnitsEnum.generic;

    self.isWidthFirst = false;

    let roundFactor = 100;

    let fractionResolution = 1 / 64;

    function parseDimension(dimension, unit) {
        if (unit === undefined) {
            unit = self.unit;
        }
        if (unit === UnitsEnum.feet_inches_frac || unit === UnitsEnum.inches_frac) {
            return parseDimensionFractional(dimension);
        } else {
            return parseDimensionDecimal(dimension);
        }
    }

    function formatDimension(dimension, includeUnit) {

        if (!dimension) {
            dimension = 0;
        }

        if (includeUnit === undefined) {
            includeUnit = true;
        }

        if (self.unit === UnitsEnum.m) {
            return Math.round(dimension * roundFactor) / roundFactor + (includeUnit ? ' m' : '');
        } else if (self.unit === UnitsEnum.mm) {
            return Math.round(dimension * roundFactor) / roundFactor + (includeUnit ? ' mm' : '');
        } else if (self.unit === UnitsEnum.cm) {
            return Math.round(dimension * roundFactor) / roundFactor + (includeUnit ? ' cm' : '');
        } else if (self.unit === UnitsEnum.inches) {
            return Math.round(dimension * roundFactor) / roundFactor + (includeUnit ? '"' : '');
        } else if (self.unit === UnitsEnum.feet_inches) {
            return formatDimensionFeetInches(Math.round(dimension * roundFactor) / roundFactor);
        } else if (self.unit === UnitsEnum.feet_inches_frac) {
            return formatDimensionFeetInchesFractional(dimension);
        } else if (self.unit === UnitsEnum.inches_frac) {
            return formatDimensionInchesFractional(dimension);
        } else {
            return Math.round(dimension * roundFactor) / roundFactor;
        }
    }

    function formatArea(area) {

        if (!area) {
            area = 0;
        }

        if (self.unit === UnitsEnum.m) {
            area = Math.round(area * roundFactor) / roundFactor;
            return area + " m²";
        } else if (self.unit === UnitsEnum.mm) {
            area = Math.round(area * roundFactor) / roundFactor;
            return area + " mm²";
        } else if (self.unit === UnitsEnum.cm) {
            area = Math.round(area * roundFactor) / roundFactor;
            return area + " cm²";
        } else if (self.unit === UnitsEnum.inches || self.unit === UnitsEnum.inches_frac) {
            area = Math.round(area * roundFactor) / roundFactor;
            return area + " in²";
        } else if (self.unit === UnitsEnum.feet_inches) {
            area = area / 144;
            area = Math.round(area * roundFactor || self.unit === UnitsEnum.feet_inches_frac) / roundFactor;
            return area + " ft²";
        } else {
            area = Math.round(area * roundFactor) / roundFactor;
            return area;
        }
    }

    function convertToDecimalList(panels) {
        panels.forEach(function (panel) {
            if (panel.width) {
                panel.width = parseDimension(panel.width, UnitsEnum.inches_frac);
            }
            if (panel.height) {
                panel.height = parseDimension(panel.height, UnitsEnum.inches_frac);
            }
        });
    }

    function convertDecimalToFractionalList(panels) {
        panels.forEach(function (panel) {
            if (panel.width) {
                panel.width = formatDimension(panel.width, false);
            }
            if (panel.height) {
                panel.height = formatDimension(panel.height, false);
            }
        });
    }


    function sanitizePanelListDimensions(panels) {
        panels.forEach(function (panel) {
            sanitizePanelDimensions(panel);
        });
    }

    function sanitizePanelDimensions (panel) {

        if (self.unit === UnitsEnum.feet_inches_frac) {
            if (panel.width) {
                panel.width = parseDimensionFractional(panel.width);
                panel.width = formatDimensionFeetInchesFractional(panel.width, true);
            }
            if (panel.height) {
                panel.height = parseDimensionFractional(panel.height);
                panel.height = formatDimensionFeetInchesFractional(panel.height, true);
            }
        } else if (self.unit === UnitsEnum.feet_inches) {
            if (panel.width) {
                panel.width = parseDimensionDecimal(panel.width);
                panel.width = formatDimension(panel.width, true);
            }
            if (panel.height) {
                panel.height = parseDimensionDecimal(panel.height);
                panel.height = formatDimension(panel.height, true);
            }
        } else if (self.unit === UnitsEnum.inches_frac) {
            if (panel.width) {
                panel.width = parseDimensionFractional(panel.width);
                panel.width = formatDimensionInchesFractional(panel.width, true);
            }
            if (panel.height) {
                panel.height = parseDimensionFractional(panel.height);
                panel.height = formatDimensionInchesFractional(panel.height, true);
            }
        } else {
            if (panel.width) {
                if (isNaN(panel.width)) {
                    // We must convert from feet/inches to decimal
                    panel.width = parseDimensionDecimal(panel.width);
                } else {
                    panel.width = parseFloat(panel.width);                                  // Remove possible leading zeros
                    panel.width = Math.round(panel.width * roundFactor) / roundFactor;      // Round to the required decimal places
                }
            }
            if (panel.height) {
                if (isNaN(panel.height)) {
                    // We must convert from feet/inches to decimal
                    panel.height = parseDimensionDecimal(panel.height);
                } else {
                    panel.height = parseFloat(panel.height);                                // Remove possible leading zeros
                    panel.height = Math.round(panel.height * roundFactor) / roundFactor;    // Round to the required decimal places
                }
            }
        }
    }

    function formatDimensionFeetInches(dimension) {

        if (isNaN(dimension)) {
            // Try to parse the dimension assuming it's a string previously formatted according to active unit cfg
            dimension = parseDimension(dimension);
            if (!dimension) {
                return null;
            }
        }

        var dimensionLabel = "";

        dimension = Math.round(dimension * roundFactor) / roundFactor;

        var feet = Math.floor(dimension / 12);
        var inches = Math.round((dimension % 12) * roundFactor) / roundFactor;

        dimensionLabel = feet + '\'' + ' ' + inches + '"';

        return dimensionLabel;
    }

    function formatDimensionInchesFractional(dimension) {

        if (isNaN(dimension)) {
            // Try to parse the dimension assuming it's a string previously formatted according to active unit cfg
            dimension = parseDimension(dimension);
            if (!dimension) {
                return null;
            }
        }

        var inchesFractionalPart = dimension % 1;
        var inchesWholeNumber = Math.trunc(dimension);

        if (inchesFractionalPart > 0) {
            inchesFractionalPart = toFraction(eval(inchesFractionalPart), fractionResolution);
        }

        var dimensionLabel = (inchesWholeNumber !== 0 || inchesFractionalPart === 0 ? inchesWholeNumber : '');
        if (inchesWholeNumber !== 0 && inchesFractionalPart !== 0) {
            dimensionLabel += ' ';
        }
        dimensionLabel += (inchesFractionalPart !== 0 ? inchesFractionalPart : '') + '"';

        return dimensionLabel;
    }

    function formatDimensionFeetInchesFractional(dimension) {

        if (isNaN(dimension)) {
            // Try to parse the dimension assuming it's a string previously formatted according to active unit cfg
            dimension = parseDimension(dimension);
            if (!dimension) {
                return null;
            }
        }

        var dimensionLabel = "";

        var feet = Math.floor(dimension / 12);
        var inches = dimension % 12;

        var inchesFractionalPart = inches % 1;

        var inchesWholeNumber = Math.trunc(inches);

        if (inchesFractionalPart > 0) {
            inchesFractionalPart = toFraction(eval(inchesFractionalPart), fractionResolution);
        }

        dimensionLabel = feet + '\'';
        if (inches > 1e-5) {
            dimensionLabel += ' ';
            dimensionLabel += (inchesWholeNumber !== 0 ? inchesWholeNumber : '');
            if (inchesWholeNumber !== 0 && inchesFractionalPart != 0) {
                dimensionLabel += ' ';
            }
            dimensionLabel += (inchesFractionalPart !== 0 ? inchesFractionalPart : '') + '"';
        }

        return dimensionLabel;
    }

    /**
     * Returns dimension as decimal.
     */
    function parseDimensionDecimal (dimension) {

        if (dimension === undefined) {
            return null;
        }

        // Ensure that dimension is a string
        dimension = String(dimension);

        try {
            // Remove spaces
            dimension = dimension.replace(/\s/g, '');
            // Replace '' by "
            dimension = dimension.replace(/''/g, '"');

            // Append " if string is not ending in ' or "
            if (dimension.slice(-1) !== "\"" && dimension.slice(-1) !== "'") {
                dimension += "\"";
            }

            var re = new RegExp("^(?!$|.*\\'[^\x22]+$)(?:([0-9]+\\.*[0-9]*)\\')?(?:([0-9]+\\.*[0-9]*)\x22?)?$", "g");
            var res = re.exec(dimension);
            if (res) {
                var feet = res[1] || 0;
                var inches = res[2] || 0;
                return parseFloat(feet) * 12 + parseFloat(inches);
            } else {
                // Try to parse the dimension as float
                // We'll have to remove the last char because we've added a " above
                return parseFloat(dimension.slice(0, -1));
            }
        } catch(e) {
            console.error("Error while parsing dimension: " + dimension + "\n" + e.stack);
            return null;
        }
    }

    /**
     * Returns dimension as decimal.
     */
    function parseDimensionFractional (dimension) {

        if (dimension === undefined) {
            return null;
        }

        // Ensure that dimension is a string
        dimension = String(dimension);

        try {
            // Separate decimal from fractional using plus sign
            dimension = dimension.replace(/([0-9]+)\s([0-9\/]+)/g, '$1+$2');
            // Remove spaces
            dimension = dimension.replace(/\s/g, '');
            // Replace '' by "
            dimension = dimension.replace(/''/g, '"');

            // Append " if string is not ending in ' or "
            if (dimension.slice(-1) !== "\"" && dimension.slice(-1) !== "'") {
                dimension += "\"";
            }

            var re = new RegExp("^(?!$|.*\\'[^\x22]+$)(?:([0-9\/+]+\\.*[0-9/+]*)\\')?(?:([0-9/+]+\\.*[0-9/+]*)\x22?)?$", "g");
            var res = re.exec(dimension);
            if (res) {
                var feet = res[1] || 0;
                var inches = res[2] || 0;
                return parseFloat(eval(feet)) * 12 + parseFloat(eval(inches));
            } else {
                // Try to parse the dimension as float
                // We'll have to remove the last char because we've added a " above
                return parseFloat(eval(dimension.slice(0, -1)));
            }
        } catch(e) {
            console.error("Error while parsing dimension: " + dimension + "\n" + e.stack);
            return null;
        }
    }

    function formatDimensions (panel) {
        if (self.isWidthFirst) {
            return formatDimension(panel.width, false) + '×' + formatDimension(panel.height, false);
        } else {
            return formatDimension(panel.height, false) + '×' + formatDimension(panel.width, false);
        }
    }

    function formatDimensionsHtml (width, height) {
        let html = '';
        if (self.isWidthFirst) {
            html += '<span>' + formatDimension(width, false) + '</span>';
            html += '<span class="math">&#215;</span>';
            html += '<span>' + formatDimension(height, false) + '</span>';
        } else {
            html += '<span>' + formatDimension(height, false) + '</span>';
            html += '<span class="math">&#215;</span>';
            html += '<span>' + formatDimension(width, false) + '</span>';
        }
        return html;
    }

    function formatPanelDimensionsHtml (panel) {
        let html = '';
        if (self.isWidthFirst) {
            html += '<span>' + formatDimension(panel.width, false) + '</span>';
            html += '<span class="math">&#215;</span>';
            html += '<span>' + formatDimension(panel.height, false) + '</span>';
        } else {
            html += '<span>' + formatDimension(panel.height, false) + '</span>';
            html += '<span class="math">&#215;</span>';
            html += '<span>' + formatDimension(panel.width, false) + '</span>';
        }
        return html;
    }

    return {
        UnitsEnum: UnitsEnum,
        parseDimension: parseDimension,
        formatDimension: formatDimension,
        formatDimensions: formatDimensions,
        formatDimensionsHtml: formatDimensionsHtml,
        formatPanelDimensionsHtml: formatPanelDimensionsHtml,
        formatArea: formatArea,
        sanitizePanelDimensions: sanitizePanelDimensions,
        sanitizePanelListDimensions: sanitizePanelListDimensions,
        convertToDecimalList: convertToDecimalList,
        convertDecimalToFractionalList: convertDecimalToFractionalList,
        unit: function(value) {
            if(value !== undefined) {
                self.unit = value;
            }
            return self.unit;
        },
        isWidthFirst: function(value) {
            if(value !== undefined) {
                self.isWidthFirst = value;
            }
            return self.isWidthFirst;
        },
        isUnitFractional: function (unit) {
            return unit === UnitsEnum.feet_inches_frac || unit === UnitsEnum.inches_frac;
        },
        roundFactor: function(value) {
            if(value !== undefined) {
                roundFactor = value;
            }
            return roundFactor;
        },
        fractionResolution: function(value) {
            if(value !== undefined) {
                fractionResolution = value;
            }
            return fractionResolution;
        }
    }
});

function toFraction(decimal, resolution) {

    if (resolution !== undefined) {
        decimal = Math.round(decimal / resolution) * resolution;
    }

    function gcd (a, b) {
        if (b < 0.0000001) return a;            // Since there is limited precision, we need to limit the value.
        return gcd(b, Math.floor(a % b));    // Discard any fractions due to limitations in precision.
    }

    const length = decimal.toString().length - 2;

    let denominator = Math.pow(10, length);
    let numerator = decimal * denominator;

    const divisor = gcd(numerator, denominator);

    numerator /= divisor;
    denominator /= divisor;

    // Limit the numerator and denominator to three digits
    if (numerator.toString().length > 3 || denominator.toString().length > 3) {
        let digitsToRemove = Math.min(numerator.toString().length, denominator.toString().length);
        digitsToRemove -= 2;
        numerator = Math.floor(numerator / Math.pow(10, digitsToRemove));
        denominator = Math.floor(denominator / Math.pow(10, digitsToRemove));
    }

    return Math.floor(numerator) + '/' + Math.floor(denominator);
}

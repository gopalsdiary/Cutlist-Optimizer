/**
 * Dimension Processor
 * Utility for handling dimension conversions and formatting
 */
const DimensionProcessor = (function() {
    // Private variables
    const isMetric = false; // Default to imperial measurements
    const precision = 2; // Default decimal precision

    // Public methods
    return {
        /**
         * Format a dimension with the correct unit
         * @param {number} value - The measurement value
         * @param {boolean} showUnit - Whether to append the unit in the output
         * @returns {string} - Formatted dimension string
         */
        formatDimension: function(value, showUnit = true) {
            if (value === null || value === undefined) {
                return '';
            }
            
            const fixed = Number(value).toFixed(precision);
            return showUnit ? `${fixed}"` : fixed;
        },

        /**
         * Format dimensions for a panel
         * @param {Object} panel - Panel object with width and height properties
         * @returns {string} - Formatted dimensions
         */
        formatDimensions: function(panel) {
            if (!panel || panel.width === undefined || panel.height === undefined) {
                return '';
            }
            
            return `${this.formatDimension(panel.width, false)} × ${this.formatDimension(panel.height, false)}`;
        },

        /**
         * Format dimensions as HTML with special formatting
         * @param {number} width - Width value
         * @param {number} height - Height value
         * @returns {string} - HTML formatted dimensions
         */
        formatDimensionsHtml: function(width, height) {
            let html = '';
            html += `<span>${this.formatDimension(width, false)}</span>`;
            html += '<span class="math">×</span>';
            html += `<span>${this.formatDimension(height, false)}</span>`;
            return html;
        },

        /**
         * Format panel dimensions as HTML
         * @param {Object} panel - Panel object with width and height properties
         * @returns {string} - HTML formatted dimensions
         */
        formatPanelDimensionsHtml: function(panel) {
            if (!panel) return '';
            return this.formatDimensionsHtml(panel.width, panel.height);
        },

        /**
         * Calculate area and return formatted string
         * @param {number} area - The area value
         * @returns {string} - Formatted area string with units
         */
        formatArea: function(area) {
            if (area === null || area === undefined) {
                return '';
            }
            
            return `${area.toFixed(1)} in²`;
        },

        /**
         * Parse a dimension string into a number
         * @param {string} value - Dimension string with possible unit
         * @returns {number} - Parsed dimension value
         */
        parseDimension: function(value) {
            if (typeof value === 'number') return value;
            
            if (typeof value === 'string') {
                // Remove unit and parse as float
                return parseFloat(value.replace(/[^\d.-]/g, ''));
            }
            
            return 0;
        }
    };
})();
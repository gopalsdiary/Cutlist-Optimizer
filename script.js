// Data structures for parts and stock sheets
let parts = [];
let stockSheets = [];
let options = {
    kerfWidth: 3.5,
    allowRotation: true,
    considerGrain: false,
    optimizationPriority: 'material'
};

// Conversion factor from mm to inches
const MM_TO_INCH = 0.0393701;

// Generate unique IDs
function generateId() {
    return Math.random().toString(36).substring(2, 15);
}

// Import utilities from dimension-processor.js
// Ensure accurate dimension parsing and conversion
function parseDimension(value) {
    // Assuming DimensionProcessor is available globally or imported
    return DimensionProcessor.parseDimension(value);
}

// DOM Elements
document.addEventListener('DOMContentLoaded', () => {
    // Tab switching
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const tabName = btn.getAttribute('data-tab');
            
            // Update active tab button
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Show the selected tab content
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
            });
            document.getElementById(`${tabName}-tab`).classList.add('active');
        });
    });

    // Modal handling
    const modals = document.querySelectorAll('.modal');
    const closeBtns = document.querySelectorAll('.close, .cancel-btn');
    
    // Close modals when clicking close button or outside
    closeBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            modals.forEach(modal => {
                modal.style.display = 'none';
            });
        });
    });
    
    window.addEventListener('click', (e) => {
        modals.forEach(modal => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    });

    // Add Part button
    document.getElementById('add-part-btn').addEventListener('click', () => {
        // Reset form for new part
        document.getElementById('part-form').reset();
        document.getElementById('part-id').value = '';
        document.getElementById('part-modal-title').textContent = 'Add New Part';
        document.getElementById('part-modal').style.display = 'block';
    });

    // Add Stock Sheet button
    document.getElementById('add-stock-btn').addEventListener('click', () => {
        // Reset form for new stock sheet
        document.getElementById('stock-form').reset();
        document.getElementById('stock-id').value = '';
        document.getElementById('stock-modal-title').textContent = 'Add New Stock Sheet';
        document.getElementById('stock-modal').style.display = 'block';
        
        // Set default values
        document.getElementById('stock-length').value = '2440';
        document.getElementById('stock-width').value = '1220';
        document.getElementById('stock-quantity').value = '1';
    });

    // Options button
    document.getElementById('settings-btn').addEventListener('click', () => {
        // Set current options
        document.getElementById('kerf-width').value = options.kerfWidth;
        document.getElementById('allow-rotation').checked = options.allowRotation;
        document.getElementById('consider-grain').checked = options.considerGrain;
        document.getElementById('optimization-priority').value = options.optimizationPriority;
        
        document.getElementById('options-modal').style.display = 'block';
    });

    // Part form submission
    document.getElementById('part-form').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const partId = document.getElementById('part-id').value;
        const partData = {
            id: partId || generateId(),
            label: document.getElementById('part-label').value,
            length: parseFloat(document.getElementById('part-length').value),
            width: parseFloat(document.getElementById('part-width').value),
            quantity: parseInt(document.getElementById('part-quantity').value),
            material: document.getElementById('part-material').value
        };
        
        if (partId) {
            // Edit existing part
            const index = parts.findIndex(p => p.id === partId);
            if (index !== -1) {
                parts[index] = partData;
            }
        } else {
            // Add new part
            parts.push(partData);
        }
        
        // Update UI and close modal
        renderPartsTable();
        document.getElementById('part-modal').style.display = 'none';
    });

    // Stock form submission
    document.getElementById('stock-form').addEventListener('submit', (e) => {
        e.preventDefault();
        
        const stockId = document.getElementById('stock-id').value;
        const stockData = {
            id: stockId || generateId(),
            material: document.getElementById('stock-material').value,
            length: parseFloat(document.getElementById('stock-length').value),
            width: parseFloat(document.getElementById('stock-width').value),
            quantity: parseInt(document.getElementById('stock-quantity').value)
        };
        
        if (stockId) {
            // Edit existing stock
            const index = stockSheets.findIndex(s => s.id === stockId);
            if (index !== -1) {
                stockSheets[index] = stockData;
            }
        } else {
            // Add new stock
            stockSheets.push(stockData);
        }
        
        // Update UI and close modal
        renderStockTable();
        document.getElementById('stock-modal').style.display = 'none';
    });

    // Options form submission
    document.getElementById('options-form').addEventListener('submit', (e) => {
        e.preventDefault();
        
        options = {
            kerfWidth: parseFloat(document.getElementById('kerf-width').value),
            allowRotation: document.getElementById('allow-rotation').checked,
            considerGrain: document.getElementById('consider-grain').checked,
            optimizationPriority: document.getElementById('optimization-priority').value
        };
        
        document.getElementById('options-modal').style.display = 'none';
    });

    // Calculate button
    document.getElementById('calculate-btn').addEventListener('click', () => {
        if (parts.length === 0) {
            alert('Please add at least one part before calculating.');
            return;
        }
        
        if (stockSheets.length === 0) {
            alert('Please add at least one stock sheet before calculating.');
            return;
        }
        
        calculateCutlist();
    });

    // Save button
    document.getElementById('save-btn').addEventListener('click', () => {
        saveProject();
    });

    // Load some default data
    loadDefaultData();
});

// Render the parts table
function renderPartsTable() {
    const tbody = document.querySelector('#parts-table tbody');
    tbody.innerHTML = '';

    if (parts.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="6" class="empty-message">No parts added yet</td>`;
        tbody.appendChild(row);
        return;
    }

    parts.forEach(part => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${part.label}</td>
            <td>${(part.length * MM_TO_INCH).toFixed(2)} in</td>
            <td>${(part.width * MM_TO_INCH).toFixed(2)} in</td>
            <td>${part.quantity}</td>
            <td>${part.material}</td>
            <td class="action-btns">
                <button class="edit-btn" data-id="${part.id}"><span class="material-icons">edit</span></button>
                <button class="delete-btn" data-id="${part.id}"><span class="material-icons">delete</span></button>
            </td>
        `;
        tbody.appendChild(row);
    });

    // Add event listeners to edit and delete buttons
    document.querySelectorAll('#parts-table .edit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const partId = btn.getAttribute('data-id');
            editPart(partId);
        });
    });

    document.querySelectorAll('#parts-table .delete-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const partId = btn.getAttribute('data-id');
            deletePart(partId);
        });
    });
}

// Render the stock table
function renderStockTable() {
    const tbody = document.querySelector('#stock-table tbody');
    tbody.innerHTML = '';
    
    if (stockSheets.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="5" class="empty-message">No stock sheets added yet</td>`;
        tbody.appendChild(row);
        return;
    }
    
    stockSheets.forEach(stock => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${stock.material}</td>
            <td>${(stock.length * MM_TO_INCH).toFixed(2)} in</td>
            <td>${(stock.width * MM_TO_INCH).toFixed(2)} in</td>
            <td>${stock.quantity}</td>
            <td class="action-btns">
                <button class="edit-btn" data-id="${stock.id}"><span class="material-icons">edit</span></button>
                <button class="delete-btn" data-id="${stock.id}"><span class="material-icons">delete</span></button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    // Add event listeners to edit and delete buttons
    document.querySelectorAll('#stock-table .edit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const stockId = btn.getAttribute('data-id');
            editStock(stockId);
        });
    });
    
    document.querySelectorAll('#stock-table .delete-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const stockId = btn.getAttribute('data-id');
            deleteStock(stockId);
        });
    });
}

// Edit a part
function editPart(partId) {
    const part = parts.find(p => p.id === partId);
    if (!part) return;
    
    document.getElementById('part-id').value = part.id;
    document.getElementById('part-label').value = part.label;
    document.getElementById('part-length').value = part.length;
    document.getElementById('part-width').value = part.width;
    document.getElementById('part-quantity').value = part.quantity;
    document.getElementById('part-material').value = part.material;
    
    document.getElementById('part-modal-title').textContent = 'Edit Part';
    document.getElementById('part-modal').style.display = 'block';
}

// Delete a part
function deletePart(partId) {
    if (confirm('Are you sure you want to delete this part?')) {
        parts = parts.filter(p => p.id !== partId);
        renderPartsTable();
    }
}

// Edit a stock sheet
function editStock(stockId) {
    const stock = stockSheets.find(s => s.id === stockId);
    if (!stock) return;
    
    document.getElementById('stock-id').value = stock.id;
    document.getElementById('stock-material').value = stock.material;
    document.getElementById('stock-length').value = stock.length;
    document.getElementById('stock-width').value = stock.width;
    document.getElementById('stock-quantity').value = stock.quantity;
    
    document.getElementById('stock-modal-title').textContent = 'Edit Stock Sheet';
    document.getElementById('stock-modal').style.display = 'block';
}

// Delete a stock sheet
function deleteStock(stockId) {
    if (confirm('Are you sure you want to delete this stock sheet?')) {
        stockSheets = stockSheets.filter(s => s.id !== stockId);
        renderStockTable();
    }
}

// Load default data for demonstration
function loadDefaultData() {
    // Add some sample parts
    parts = [
        { id: generateId(), label: 'up side', length: 36, width: 12, quantity: 2, material: 'particle-board' },
        { id: generateId(), label: 'side side', length: 30, width: 12, quantity: 2, material: 'particle-board' },
        { id: generateId(), label: 'palla', length: 18, width: 30, quantity: 2, material: 'particle-board' },
        { id: generateId(), label: 'back palla', length: 36, width: 30, quantity: 1, material: 'particle-board' }
    ];

    // Add a standard stock sheet
    stockSheets = [
        { id: generateId(), material: 'particle-board', length: 48, width: 84, quantity: 1 }
    ];

    // Render tables
    renderPartsTable();
    renderStockTable();
}

// Enhanced updateStatistics function to handle all statistics panels
function updateStatistics(totalSheets, totalArea, usedArea, totalCuts, cutLength, optimizationPriority) {
    // Update Global Statistics
    const totalSheetsElement = document.getElementById('used-stock-sheets');
    const materialUsageElement = document.getElementById('total-used-area');
    const wasteAreaElement = document.getElementById('total-wasted-area');
    const totalCutsElement = document.getElementById('total-cuts');
    const cutLengthElement = document.getElementById('cut-length');
    const optimizationPriorityElement = document.getElementById('optimization-priority');

    if (totalSheetsElement) {
        totalSheetsElement.textContent = `${totalSheets} sheets`;
    }

    if (materialUsageElement) {
        materialUsageElement.textContent = `${Math.round(usedArea)} in² (${Math.round((usedArea / totalArea) * 100)}%)`;
    }

    if (wasteAreaElement) {
        wasteAreaElement.textContent = `${Math.round(totalArea - usedArea)} in² (${Math.round(((totalArea - usedArea) / totalArea) * 100)}%)`;
    }

    if (totalCutsElement) {
        totalCutsElement.textContent = totalCuts;
    }

    if (cutLengthElement) {
        cutLengthElement.textContent = `${Math.round(cutLength)}"`;
    }

    if (optimizationPriorityElement) {
        optimizationPriorityElement.textContent = optimizationPriority === 'material' ? 'Material Usage' : 'Cut Count';
    }
}

// New function to update statistics for a specific sheet
function updateSheetStatistics(sheetLayout, sheetNumber, utilization, sheetCuts) {
    const sheetStockElement = document.getElementById('sheet-stock');
    const sheetUsedAreaElement = document.getElementById('sheet-used-area');
    const sheetWastedAreaElement = document.getElementById('sheet-wasted-area');
    const sheetCutsElement = document.getElementById('sheet-cuts');
    const sheetPanelsElement = document.getElementById('sheet-panels');
    const sheetWastedPanelsElement = document.getElementById('sheet-wasted-panels');

    // Calculate sheet areas
    const sheetArea = sheetLayout.length * sheetLayout.width;
    const usedArea = sheetLayout.parts.reduce((sum, part) => sum + (part.length * part.width), 0);
    const wastedArea = sheetArea - usedArea;

    // Count the number of parts and wasted panels
    const partsCount = sheetLayout.parts.length;
    const wastedPanels = countWastedPanels(sheetLayout);
    
    if (sheetStockElement) {
        sheetStockElement.textContent = `${sheetLayout.material} (${sheetLayout.length}" × ${sheetLayout.width}")`;
    }
    
    if (sheetUsedAreaElement) {
        sheetUsedAreaElement.textContent = `${Math.round(usedArea)} in² (${Math.round(utilization)}%)`;
    }
    
    if (sheetWastedAreaElement) {
        sheetWastedAreaElement.textContent = `${Math.round(wastedArea)} in² (${Math.round(100 - utilization)}%)`;
    }
    
    if (sheetCutsElement) {
        sheetCutsElement.textContent = sheetCuts;
    }
    
    if (sheetPanelsElement) {
        sheetPanelsElement.textContent = partsCount;
    }
    
    if (sheetWastedPanelsElement) {
        sheetWastedPanelsElement.textContent = wastedPanels;
    }
}

// Helper function to count wasted panels
function countWastedPanels(sheetLayout) {
    // Count areas of free space that are larger than the minimum usable size
    const minUsableSize = 36; // For example, consider anything smaller than 6"x6" as waste
    let wasteCount = 0;
    
    // Find free rectangles by checking empty spaces
    const occupiedAreas = sheetLayout.parts.map(part => ({
        x1: part.x,
        y1: part.y,
        x2: part.x + part.width,
        y2: part.y + part.length
    }));
    
    // Simplified approach: count large enough corners and edges
    wasteCount = Math.floor(Math.random() * 3) + 1; // This is a placeholder logic
    
    return wasteCount;
}

// New function to update Unable to Fit statistics
function updateUnableFitStatistics(unableToParts) {
    const unablePanelElement = document.getElementById('unable-panel');
    const unableQtyElement = document.getElementById('unable-qty');
    
    if (unableToParts && unableToParts.length > 0) {
        if (unablePanelElement) {
            const partNames = unableToParts.map(p => p.label).join(', ');
            unablePanelElement.textContent = partNames;
        }
        
        if (unableQtyElement) {
            const totalQty = unableToParts.reduce((sum, p) => sum + 1, 0);
            unableQtyElement.textContent = totalQty;
        }
    } else {
        if (unablePanelElement) {
            unablePanelElement.textContent = 'None';
        }
        
        if (unableQtyElement) {
            unableQtyElement.textContent = '0';
        }
    }
}

// Enhance the calculateCutlist function
function calculateCutlist() {
    console.log("Starting enhanced cutlist calculation...");

    const diagramsContainer = document.getElementById('cutting-diagrams');
    diagramsContainer.innerHTML = '';

    // Prepare all parts with their repetitions
    let allPartInstances = [];
    parts.forEach(part => {
        for (let i = 0; i < part.quantity; i++) {
            allPartInstances.push({
                ...part,
                instanceId: `${part.id}-${i}`
            });
        }
    });

    // Filter out invalid parts
    allPartInstances = allPartInstances.filter(part => part.length > 0 && part.width > 0);
    
    // Sort strategy: first by area (decreasing), then by the longer dimension
    allPartInstances.sort((a, b) => {
        const areaA = a.length * a.width;
        const areaB = b.length * b.width;
        if (areaB !== areaA) return areaB - areaA;
        
        const maxDimA = Math.max(a.length, a.width);
        const maxDimB = Math.max(b.length, b.width);
        return maxDimB - maxDimA;
    });

    // Group parts by material
    const partsByMaterial = {};
    allPartInstances.forEach(part => {
        if (!partsByMaterial[part.material]) {
            partsByMaterial[part.material] = [];
        }
        partsByMaterial[part.material].push(part);
    });

    // Statistics variables
    let totalSheets = 0;
    let totalArea = 0;
    let usedArea = 0;
    let totalCuts = 0;
    let cutLength = 0;
    let unableToParts = [];
    let lastSheetLayout = null;
    let lastSheetCuts = 0;

    // Process each material type
    Object.keys(partsByMaterial).forEach(material => {
        const materialParts = partsByMaterial[material];
        const availableSheets = stockSheets.filter(sheet => sheet.material === material);

        if (availableSheets.length === 0) {
            alert(`No stock sheets available for material: ${material}`);
            return;
        }

        // Use the largest sheet available for this material
        let sheetToUse = availableSheets.reduce((prev, current) => {
            return (prev.length * prev.width > current.length * current.width) ? prev : current;
        });

        const sheetProperties = { ...sheetToUse };
        let sheetsUsed = 0;
        let remainingParts = [...materialParts];
        
        // Get the kerf width (blade thickness)
        const kerfWidth = options.kerfWidth || 3.5;

        while (remainingParts.length > 0 && sheetsUsed < sheetProperties.quantity) {
            totalSheets++;
            sheetsUsed++;

            // Create a new sheet layout
            const sheetLayout = {
                material: sheetProperties.material,
                length: sheetProperties.length,
                width: sheetProperties.width,
                parts: [],
                cuts: []
            };

            // Initialize with a single free rectangle representing the entire sheet
            let freeRects = [{ 
                x: 0, 
                y: 0, 
                width: sheetProperties.width, 
                length: sheetProperties.length 
            }];

            // Process all remaining parts
            let partIndex = 0;
            let sheetCuts = 0;

            while (partIndex < remainingParts.length) {
                const part = remainingParts[partIndex];
                
                // Try to place the part in any free rectangle
                let placed = false;
                let bestRectIndex = -1;
                let bestFit = Infinity;
                let bestRotation = false;
                let bestX = 0, bestY = 0;
                let bestWidth = 0, bestLength = 0;

                // Convert dimensions to numbers
                let partLength = parseFloat(part.length);
                let partWidth = parseFloat(part.width);
                
                // Check each free rectangle to find the best fit
                for (let rectIndex = 0; rectIndex < freeRects.length; rectIndex++) {
                    const rect = freeRects[rectIndex];
                    
                    // Check normal orientation
                    if (partLength <= rect.length && partWidth <= rect.width) {
                        const fit = (rect.length - partLength) * (rect.width - partWidth);
                        if (fit < bestFit) {
                            bestFit = fit;
                            bestRectIndex = rectIndex;
                            bestRotation = false;
                            bestX = rect.x;
                            bestY = rect.y;
                            bestWidth = partWidth;
                            bestLength = partLength;
                        }
                    }
                    
                    // Check rotated orientation if allowed
                    if (options.allowRotation && 
                        (!options.considerGrain || part.grainDirection !== 'vertical') && 
                        partWidth <= rect.length && partLength <= rect.width) {
                        const fit = (rect.length - partWidth) * (rect.width - partLength);
                        if (fit < bestFit) {
                            bestFit = fit;
                            bestRectIndex = rectIndex;
                            bestRotation = true;
                            bestX = rect.x;
                            bestY = rect.y;
                            bestWidth = partLength;
                            bestLength = partWidth;
                        }
                    }
                }

                // Place the part if we found a fit
                if (bestRectIndex !== -1) {
                    const rect = freeRects[bestRectIndex];
                    
                    // Add the part to the layout
                    const placedPart = {
                        id: part.instanceId,
                        label: part.label,
                        x: bestX,
                        y: bestY,
                        width: bestWidth,
                        length: bestLength,
                        rotated: bestRotation
                    };
                    
                    sheetLayout.parts.push(placedPart);
                    
                    // Remove the used rectangle
                    freeRects.splice(bestRectIndex, 1);
                    
                    // Split the space - accounting for kerf width when calculating new rectangles
                    
                    // Right of placed part
                    if (rect.x + rect.width > placedPart.x + placedPart.width + kerfWidth) {
                        freeRects.push({
                            x: placedPart.x + placedPart.width + kerfWidth,
                            y: rect.y,
                            width: rect.width - (placedPart.x + placedPart.width + kerfWidth - rect.x),
                            length: rect.length
                        });
                        
                        // Create horizontal cut line
                        sheetLayout.cuts.push({
                            type: 'horizontal',
                            x: placedPart.x + placedPart.width,
                            y: placedPart.y,
                            width: kerfWidth,
                            length: placedPart.length
                        });
                        
                        // Add to cut statistics
                        totalCuts++;
                        sheetCuts++;
                        cutLength += placedPart.length;
                    }
                    
                    // Below placed part
                    if (rect.y + rect.length > placedPart.y + placedPart.length + kerfWidth) {
                        freeRects.push({
                            x: rect.x,
                            y: placedPart.y + placedPart.length + kerfWidth,
                            width: rect.width,
                            length: rect.length - (placedPart.y + placedPart.length + kerfWidth - rect.y)
                        });
                        
                        // Create vertical cut line
                        sheetLayout.cuts.push({
                            type: 'vertical',
                            x: placedPart.x,
                            y: placedPart.y + placedPart.length,
                            height: kerfWidth,
                            length: placedPart.width
                        });
                        
                        // Add to cut statistics
                        totalCuts++;
                        sheetCuts++;
                        cutLength += placedPart.width;
                    }

                    // Remove the part from remaining parts
                    remainingParts.splice(partIndex, 1);
                    placed = true;
                    usedArea += bestLength * bestWidth;
                } else {
                    // Try next part
                    partIndex++;
                }
            }
            
            // Sort free rectangles by area (largest first) to optimize subsequent placements
            freeRects.sort((a, b) => (b.length * b.width) - (a.length * a.width));

            // Merge adjacent free rectangles when possible to reduce fragmentation
            for (let i = 0; i < freeRects.length; i++) {
                for (let j = i + 1; j < freeRects.length; j++) {
                    const r1 = freeRects[i];
                    const r2 = freeRects[j];
                    
                    // Check if rectangles can be merged horizontally
                    if (r1.y === r2.y && r1.length === r2.length && 
                        (r1.x + r1.width === r2.x || r2.x + r2.width === r1.x)) {
                        const newX = Math.min(r1.x, r2.x);
                        const newWidth = r1.width + r2.width;
                        
                        freeRects[i] = {
                            x: newX,
                            y: r1.y,
                            width: newWidth,
                            length: r1.length
                        };
                        
                        freeRects.splice(j, 1);
                        j--; // Adjust index after removal
                    }
                    // Check if rectangles can be merged vertically
                    else if (r1.x === r2.x && r1.width === r2.width && 
                             (r1.y + r1.length === r2.y || r2.y + r2.length === r1.y)) {
                        const newY = Math.min(r1.y, r2.y);
                        const newLength = r1.length + r2.length;
                        
                        freeRects[i] = {
                            x: r1.x,
                            y: newY,
                            width: r1.width,
                            length: newLength
                        };
                        
                        freeRects.splice(j, 1);
                        j--; // Adjust index after removal
                    }
                }
            }

            // Update statistics for this sheet
            const sheetArea = sheetProperties.length * sheetProperties.width;
            totalArea += sheetArea;
            const sheetUsedArea = sheetLayout.parts.reduce((sum, part) => sum + (part.length * part.width), 0);
            const utilization = (sheetUsedArea / sheetArea) * 100;

            // Calculate perimeter cuts for outer sheet edges
            const outerPerimeter = (sheetProperties.length * 2) + (sheetProperties.width * 2);
            cutLength += outerPerimeter;
            totalCuts += 4; // Four cuts for the outer edges
            sheetCuts += 4;

            // Keep track of the last sheet for Sheet Statistics
            lastSheetLayout = sheetLayout;
            lastSheetCuts = sheetCuts;

            // Render the cutting diagram
            renderCuttingDiagram(sheetLayout, sheetsUsed, utilization);
        }

        // Add any remaining parts to the unableToParts list
        if (remainingParts.length > 0) {
            unableToParts = unableToParts.concat(remainingParts);
        }
    });

    // Update the Global Statistics
    updateStatistics(totalSheets, totalArea, usedArea, totalCuts, cutLength, options.optimizationPriority);
    
    // Update Sheet Statistics for the most recently processed sheet
    if (lastSheetLayout) {
        const sheetArea = lastSheetLayout.length * lastSheetLayout.width;
        const sheetUsedArea = lastSheetLayout.parts.reduce((sum, part) => sum + (part.length * part.width), 0);
        const utilization = (sheetUsedArea / sheetArea) * 100;
        updateSheetStatistics(lastSheetLayout, totalSheets, utilization, lastSheetCuts);
    }
    
    // Update Unable to Fit Statistics
    updateUnableFitStatistics(unableToParts);

    // Update the Cut statistics panel for the first cut (if any)
    if (lastSheetLayout && lastSheetLayout.cuts.length > 0) {
        updateCutStatistics(lastSheetLayout, lastSheetLayout.cuts[0]);
    }
}

// Render a cutting diagram for a sheet
function renderCuttingDiagram(sheetLayout, sheetNumber, utilization) {
    const container = document.getElementById('cutting-diagrams');
    
    // Create sheet container
    const sheetElement = document.createElement('div');
    sheetElement.className = 'sheet';
    
    // Create sheet header
    const headerElement = document.createElement('div');
    headerElement.className = 'sheet-header';
    headerElement.innerHTML = `
        <div>Sheet ${sheetNumber}: ${sheetLayout.material} (${sheetLayout.length} × ${sheetLayout.width})</div>
        <div>Utilization: ${utilization.toFixed(1)}%</div>
    `;
    sheetElement.appendChild(headerElement);
    
    // Create sheet visualization container
    const sheetContainer = document.createElement('div');
    sheetContainer.className = 'sheet-container';
    sheetElement.appendChild(sheetContainer);
    
    // Calculate scale factor to fit within the container
    const containerWidth = 800; // Default width
    const containerHeight = 400; // Default height
    
    const scaleX = containerWidth / sheetLayout.width;
    const scaleY = containerHeight / sheetLayout.length;
    const scale = Math.min(scaleX, scaleY) * 0.9; // 90% to leave margin
    
    // Set container dimensions with proper aspect ratio
    const displayWidth = sheetLayout.width * scale;
    const displayHeight = sheetLayout.length * scale;
    
    sheetContainer.style.width = displayWidth + 'px';
    sheetContainer.style.height = displayHeight + 'px';
    
    // Add outer border for the sheet
    const outerBorder = document.createElement('div');
    outerBorder.style.position = 'absolute';
    outerBorder.style.left = '0px';
    outerBorder.style.top = '0px';
    outerBorder.style.width = '100%';
    outerBorder.style.height = '100%';
    outerBorder.style.border = '2px solid #000';
    outerBorder.style.boxSizing = 'border-box';
    outerBorder.style.pointerEvents = 'none';
    sheetContainer.appendChild(outerBorder);
    
    // Render parts first (so cuts appear above them)
    sheetLayout.parts.forEach(part => {
        const partElement = document.createElement('div');
        partElement.className = 'part';
        partElement.style.left = (part.x * scale) + 'px';
        partElement.style.top = (part.y * scale) + 'px';
        partElement.style.width = (part.width * scale) + 'px';
        partElement.style.height = (part.length * scale) + 'px';
        
        // Alternate part colors for better visibility
        const partIndex = parseInt(part.id.split('-')[1]) || 0;
        const baseColor = 220 - (partIndex % 3) * 20;
        partElement.style.backgroundColor = `rgb(${baseColor}, ${baseColor}, ${baseColor})`;
        
        // Display part label with better formatting
        const labelElement = document.createElement('div');
        labelElement.style.fontSize = Math.min(14, Math.max(10, Math.min(part.width, part.length) * scale / 8)) + 'px';
        labelElement.style.fontWeight = 'bold';
        labelElement.style.overflow = 'hidden';
        labelElement.style.textOverflow = 'ellipsis';
        labelElement.innerText = part.label + (part.rotated ? ' (R)' : '');
        
        partElement.appendChild(labelElement);
        sheetContainer.appendChild(partElement);
    });
    
    // Render cut lines with proper thickness based on kerf width
    const kerfWidthPx = Math.max(2, options.kerfWidth * scale);
    
    sheetLayout.cuts.forEach(cut => {
        const cutElement = document.createElement('div');
        cutElement.className = `cut-line ${cut.type}`;
        
        if (cut.type === 'horizontal') {
            cutElement.style.left = (cut.x * scale) + 'px';
            cutElement.style.top = (cut.y * scale) + 'px';
            cutElement.style.width = (cut.length * scale) + 'px';
            cutElement.style.height = kerfWidthPx + 'px';
            cutElement.style.backgroundColor = '#dd0000'; // Red for horizontal cuts
        } else {
            cutElement.style.left = (cut.x * scale) + 'px';
            cutElement.style.top = (cut.y * scale) + 'px';
            cutElement.style.width = kerfWidthPx + 'px';
            cutElement.style.height = (cut.length * scale) + 'px';
            cutElement.style.backgroundColor = '#0000dd'; // Blue for vertical cuts
        }
        
        sheetContainer.appendChild(cutElement);
    });
    
    container.appendChild(sheetElement);
}

// Save project to localStorage
function saveProject() {
    const projectData = {
        parts,
        stockSheets,
        options
    };
    
    localStorage.setItem('cutlistProject', JSON.stringify(projectData));
    alert('Project saved successfully!');
}

// Load project from localStorage
function loadProject() {
    const savedProject = localStorage.getItem('cutlistProject');
    if (savedProject) {
        const projectData = JSON.parse(savedProject);
        parts = projectData.parts || [];
        stockSheets = projectData.stockSheets || [];
        options = projectData.options || {
            kerfWidth: 3.5,
            allowRotation: true,
            considerGrain: false,
            optimizationPriority: 'material'
        };
        
        renderPartsTable();
        renderStockTable();
    }
}

// Function to save cutting diagrams as PDF
function saveCuttingDiagramsAsPDF() {
    const { jsPDF } = window.jspdf;
    const pdf = new jsPDF();

    // Get the cutting diagrams container
    const diagramsContainer = document.getElementById('cutting-diagrams');

    // Convert the container to a canvas
    html2canvas(diagramsContainer).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const imgWidth = 190;
        const pageHeight = 295;
        const imgHeight = canvas.height * imgWidth / canvas.width;
        let heightLeft = imgHeight;

        let position = 0;

        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }

        pdf.save('cutting_diagrams.pdf');
    });
}

// Add event listener to the Save as PDF button
document.getElementById('save-pdf-btn').addEventListener('click', saveCuttingDiagramsAsPDF);

// Save functionality
document.getElementById('save-btn').addEventListener('click', function() {
    // Gather all data from the application
    const saveData = {
        parts: getAllParts(),
        stock: getAllStockSheets(),
        options: getOptions()
    };
    
    // Convert data to JSON string
    const jsonData = JSON.stringify(saveData, null, 2);
    
    // Create a Blob and download link
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    // Create a temporary link and trigger download
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cutlist-data.json';
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }, 0);
});

// Load functionality
document.getElementById('load-btn').addEventListener('click', function() {
    // Create a file input element
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = '.json';
    
    fileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const loadedData = JSON.parse(e.target.result);
                
                // Load data into application
                if (loadedData.parts) {
                    loadParts(loadedData.parts);
                }
                
                if (loadedData.stock) {
                    loadStockSheets(loadedData.stock);
                }
                
                if (loadedData.options) {
                    loadOptions(loadedData.options);
                }
                
                alert('Data loaded successfully!');
            } catch (error) {
                alert('Error loading file: ' + error.message);
            }
        };
        reader.readAsText(file);
    });
    
    fileInput.click();
});

// Helper functions for save/load functionality
function getAllParts() {
    // Get all parts from the table
    const parts = [];
    const rows = document.querySelectorAll('#parts-table tbody tr');
    
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 5) {
            parts.push({
                label: cells[0].textContent,
                length: parseFloat(cells[1].textContent),
                width: parseFloat(cells[2].textContent),
                quantity: parseInt(cells[3].textContent),
                material: cells[4].textContent
            });
        }
    });
    
    return parts;
}

function getAllStockSheets() {
    // Get all stock sheets from the table
    const stock = [];
    const rows = document.querySelectorAll('#stock-table tbody tr');
    
    rows.forEach(row => {
        const cells = row.querySelectorAll('td');
        if (cells.length >= 4) {
            stock.push({
                material: cells[0].textContent,
                length: parseFloat(cells[1].textContent),
                width: parseFloat(cells[2].textContent),
                quantity: parseInt(cells[3].textContent)
            });
        }
    });
    
    return stock;
}

function getOptions() {
    return {
        kerfWidth: parseFloat(document.getElementById('kerf-width').value || 3.5),
        optimizationPriority: document.getElementById('optimization-priority').value || 'material',
        allowRotation: document.getElementById('allow-rotation').checked,
        considerGrain: document.getElementById('consider-grain').checked
    };
}

function loadParts(parts) {
    // Clear existing parts
    const tbody = document.querySelector('#parts-table tbody');
    tbody.innerHTML = '';
    
    // Add loaded parts
    parts.forEach(part => {
        addPartToTable(part);
    });
}

function loadStockSheets(stockSheets) {
    // Clear existing stock sheets
    const tbody = document.querySelector('#stock-table tbody');
    tbody.innerHTML = '';
    
    // Add loaded stock sheets
    stockSheets.forEach(stock => {
        addStockToTable(stock);
    });
}

function loadOptions(options) {
    if (options.kerfWidth !== undefined) {
        document.getElementById('kerf-width').value = options.kerfWidth;
    }
    
    if (options.optimizationPriority) {
        document.getElementById('optimization-priority').value = options.optimizationPriority;
    }
    
    if (options.allowRotation !== undefined) {
        document.getElementById('allow-rotation').checked = options.allowRotation;
    }
    
    if (options.considerGrain !== undefined) {
        document.getElementById('consider-grain').checked = options.considerGrain;
    }
}

function addPartToTable(part) {
    const tbody = document.querySelector('#parts-table tbody');
    const row = document.createElement('tr');
    
    row.innerHTML = `
        <td>${part.label}</td>
        <td>${part.length}</td>
        <td>${part.width}</td>
        <td>${part.quantity}</td>
        <td>${part.material}</td>
        <td>
            <button class="edit-btn"><span class="material-icons">edit</span></button>
            <button class="delete-btn"><span class="material-icons">delete</span></button>
        </td>
    `;
    
    tbody.appendChild(row);
    
    // Add event listeners for edit and delete buttons
    const editBtn = row.querySelector('.edit-btn');
    const deleteBtn = row.querySelector('.delete-btn');
    
    editBtn.addEventListener('click', function() {
        // Edit functionality would be here
        // This should be connected to your existing edit part functionality
    });
    
    deleteBtn.addEventListener('click', function() {
        if (confirm('Are you sure you want to delete this part?')) {
            row.remove();
        }
    });
}

function addStockToTable(stock) {
    const tbody = document.querySelector('#stock-table tbody');
    const row = document.createElement('tr');
    
    row.innerHTML = `
        <td>${stock.material}</td>
        <td>${stock.length}</td>
        <td>${stock.width}</td>
        <td>${stock.quantity}</td>
        <td>
            <button class="edit-btn"><span class="material-icons">edit</span></button>
            <button class="delete-btn"><span class="material-icons">delete</span></button>
        </td>
    `;
    
    tbody.appendChild(row);
    
    // Add event listeners for edit and delete buttons
    const editBtn = row.querySelector('.edit-btn');
    const deleteBtn = row.querySelector('.delete-btn');
    
    editBtn.addEventListener('click', function() {
        // Edit functionality would be here
        // This should be connected to your existing edit stock functionality
    });
    
    deleteBtn.addEventListener('click', function() {
        if (confirm('Are you sure you want to delete this stock sheet?')) {
            row.remove();
        }
    });
}

// Function to update the Cuts statistics panel
function updateCutStatistics(sheetLayout, cut) {
    const cutNumberElement = document.getElementById('cut-number');
    const cutPanelElement = document.getElementById('cut-panel');
    const cutCutElement = document.getElementById('cut-cut');
    const cutResultElement = document.getElementById('cut-result');
    
    // Fill in cut number (just showing the first cut)
    if (cutNumberElement) {
        cutNumberElement.textContent = '1';
    }
    
    // Show which panel the cut is on
    if (cutPanelElement) {
        cutPanelElement.textContent = `${sheetLayout.material}`;
    }
    
    // Show cut type and position
    if (cutCutElement) {
        if (cut.type === 'horizontal') {
            cutCutElement.textContent = `Horizontal at ${Math.round(cut.y)}"`;
        } else {
            cutCutElement.textContent = `Vertical at ${Math.round(cut.x)}"`;
        }
    }
    
    // Show resulting panels (simplified)
    if (cutResultElement) {
        if (cut.type === 'horizontal') {
            cutResultElement.textContent = `2 Panels (${Math.round(cut.length)}" × ${cut.width}")`;
        } else {
            cutResultElement.textContent = `2 Panels (${cut.length}" × ${Math.round(cut.height)}")`;
        }
    }
}
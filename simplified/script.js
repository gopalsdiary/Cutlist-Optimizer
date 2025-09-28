/**
 * Cutlist Optimizer - Simplified
 * Modern implementation with advanced bin packing algorithm
 */

// Data structures for parts and stock sheets
let parts = [];
let stockSheets = [];
let options = {
    kerfWidth: 0.125, // Saw blade thickness in inches
    allowRotation: true,
    considerGrain: false,
    optimizationPriority: 'material' // 'material' or 'cuts'
};

// Generate unique IDs
function generateId() {
    return Math.random().toString(36).substring(2, 15);
}

// DOM Elements
document.addEventListener('DOMContentLoaded', () => {
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
        document.getElementById('stock-length').value = '48';
        document.getElementById('stock-width').value = '96';
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

    // Load button
    document.getElementById('load-btn').addEventListener('click', () => {
        loadProject();
    });

    // PDF Export button
    document.getElementById('save-pdf-btn').addEventListener('click', () => {
        saveCuttingDiagramsAsPDF();
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
            <td>${part.length}</td>
            <td>${part.width}</td>
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
            <td>${stock.length}</td>
            <td>${stock.width}</td>
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
        { id: generateId(), label: 'Cabinet Side', length: 30, width: 16, quantity: 2, material: 'plywood' },
        { id: generateId(), label: 'Cabinet Top', length: 24, width: 16, quantity: 1, material: 'plywood' },
        { id: generateId(), label: 'Cabinet Bottom', length: 24, width: 16, quantity: 1, material: 'plywood' },
        { id: generateId(), label: 'Cabinet Shelf', length: 22.5, width: 15, quantity: 3, material: 'plywood' },
        { id: generateId(), label: 'Cabinet Back', length: 30, width: 24, quantity: 1, material: 'plywood' }
    ];

    // Add a standard stock sheet
    stockSheets = [
        { id: generateId(), material: 'plywood', length: 48, width: 96, quantity: 1 }
    ];

    // Render tables
    renderPartsTable();
    renderStockTable();
}

// Define the function to update statistics
function updateStatistics(totalSheets, totalArea, usedArea, totalCuts, cutLength) {
    document.getElementById('total-sheets').textContent = totalSheets;
    document.getElementById('material-usage').textContent = Math.round((usedArea / totalArea) * 100) + '%';
    document.getElementById('waste-area').textContent = Math.round(totalArea - usedArea) + ' sq in';
    document.getElementById('total-cuts').textContent = totalCuts;
}

// Function to update sheet statistics
function updateSheetStatistics(sheetLayout, sheetNumber, utilization, sheetCuts) {
    const sheetArea = sheetLayout.length * sheetLayout.width;
    const usedArea = sheetLayout.parts.reduce((sum, part) => sum + (part.length * part.width), 0);
    const wastedArea = sheetArea - usedArea;
    
    document.getElementById('sheet-stock').textContent = 
        `${sheetLayout.material} (${sheetLayout.length}" × ${sheetLayout.width}")`;
    document.getElementById('sheet-used-area').textContent = 
        `${Math.round(usedArea)} sq in (${Math.round(utilization)}%)`;
    document.getElementById('sheet-wasted-area').textContent = 
        `${Math.round(wastedArea)} sq in (${Math.round(100 - utilization)}%)`;
    document.getElementById('sheet-cuts').textContent = sheetCuts;
    document.getElementById('sheet-panels').textContent = sheetLayout.parts.length;
    
    // Simplified calculation for wasted panels
    const wastedPanels = Math.max(1, Math.floor(wastedArea / 144)); // Assuming wastage > 1 sq ft counts as a panel
    document.getElementById('sheet-wasted-panels').textContent = wastedPanels;
}

// Function to update unable to fit statistics
function updateUnableFitStatistics(unableToParts) {
    if (unableToParts && unableToParts.length > 0) {
        document.getElementById('unable-panel').textContent = 
            unableToParts.map(p => p.label).join(', ');
        document.getElementById('unable-qty').textContent = 
            unableToParts.reduce((sum, p) => sum + 1, 0);
    } else {
        document.getElementById('unable-panel').textContent = 'None';
        document.getElementById('unable-qty').textContent = '0';
    }
}

// Calculate Cutlist - The Main Algorithm
function calculateCutlist() {
    console.log("Starting cutlist calculation...");

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
        const kerfWidth = options.kerfWidth;

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

                // Check each free rectangle to find the best fit
                for (let rectIndex = 0; rectIndex < freeRects.length; rectIndex++) {
                    const rect = freeRects[rectIndex];
                    
                    // Check normal orientation
                    if (part.length <= rect.length && part.width <= rect.width) {
                        const fit = (rect.length - part.length) * (rect.width - part.width);
                        if (fit < bestFit) {
                            bestFit = fit;
                            bestRectIndex = rectIndex;
                            bestRotation = false;
                            bestX = rect.x;
                            bestY = rect.y;
                            bestWidth = part.width;
                            bestLength = part.length;
                        }
                    }
                    
                    // Check rotated orientation if allowed
                    if (options.allowRotation && 
                        (!options.considerGrain || part.grainDirection !== 'vertical') && 
                        part.width <= rect.length && part.length <= rect.width) {
                        const fit = (rect.length - part.width) * (rect.width - part.length);
                        if (fit < bestFit) {
                            bestFit = fit;
                            bestRectIndex = rectIndex;
                            bestRotation = true;
                            bestX = rect.x;
                            bestY = rect.y;
                            bestWidth = part.length;
                            bestLength = part.width;
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
                            width: placedPart.width
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

            // Calculate sheet statistics
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

    // Update all statistics displays
    updateStatistics(totalSheets, totalArea, usedArea, totalCuts, cutLength);
    
    if (lastSheetLayout) {
        const sheetArea = lastSheetLayout.length * lastSheetLayout.width;
        const sheetUsedArea = lastSheetLayout.parts.reduce((sum, part) => sum + (part.length * part.width), 0);
        const utilization = (sheetUsedArea / sheetArea) * 100;
        updateSheetStatistics(lastSheetLayout, totalSheets, utilization, lastSheetCuts);
    }
    
    updateUnableFitStatistics(unableToParts);
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
        const baseColor = 220 - (partIndex % 3) * 30;
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
        } else {
            cutElement.style.left = (cut.x * scale) + 'px';
            cutElement.style.top = (cut.y * scale) + 'px';
            cutElement.style.width = kerfWidthPx + 'px';
            cutElement.style.height = (cut.width * scale) + 'px';
        }
        
        sheetContainer.appendChild(cutElement);
    });
    
    container.appendChild(sheetElement);
}

// Save project data as JSON file
function saveProject() {
    // Create a data object with all project information
    const projectData = {
        parts,
        stockSheets,
        options
    };
    
    // Convert to JSON string
    const jsonData = JSON.stringify(projectData, null, 2);
    
    // Create a download link
    const blob = new Blob([jsonData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'cutlist-project.json';
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    setTimeout(() => {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }, 0);
}

// Load project from a JSON file
function loadProject() {
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
                const projectData = JSON.parse(e.target.result);
                
                // Load data from the file
                if (projectData.parts) {
                    parts = projectData.parts;
                }
                
                if (projectData.stockSheets) {
                    stockSheets = projectData.stockSheets;
                }
                
                if (projectData.options) {
                    options = projectData.options;
                }
                
                // Update UI
                renderPartsTable();
                renderStockTable();
                
                alert('Project loaded successfully!');
            } catch (error) {
                alert('Error loading project: ' + error.message);
            }
        };
        reader.readAsText(file);
    });
    
    fileInput.click();
}

// Function to save cutting diagrams as PDF
function saveCuttingDiagramsAsPDF() {
    const { jsPDF } = window.jspdf;
    if (!jsPDF) {
        alert('PDF library not loaded. Please try again later.');
        return;
    }
    
    const diagramsContainer = document.getElementById('cutting-diagrams');
    if (diagramsContainer.children.length === 0) {
        alert('No cutting diagrams to export. Please generate cutting diagrams first.');
        return;
    }
    
    // Create PDF
    html2canvas(diagramsContainer).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('l', 'mm', 'a4');
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();
        
        // Add title
        pdf.setFontSize(18);
        pdf.text('Cutlist Optimizer - Cutting Diagrams', pageWidth/2, 10, { align: 'center' });
        
        // Add current date
        const today = new Date();
        pdf.setFontSize(10);
        pdf.text(`Generated: ${today.toLocaleDateString()}`, pageWidth/2, 20, { align: 'center' });
        
        // Add statistics
        pdf.setFontSize(12);
        pdf.text('Statistics:', 10, 30);
        pdf.setFontSize(10);
        pdf.text(`Total Sheets: ${document.getElementById('total-sheets').textContent}`, 15, 40);
        pdf.text(`Material Usage: ${document.getElementById('material-usage').textContent}`, 15, 45);
        pdf.text(`Waste Area: ${document.getElementById('waste-area').textContent}`, 15, 50);
        
        // Add the diagram image
        const imgProps = pdf.getImageProperties(imgData);
        const imageWidth = pageWidth - 20;
        const imageHeight = (imgProps.height * imageWidth) / imgProps.width;
        pdf.addImage(imgData, 'PNG', 10, 60, imageWidth, imageHeight);
        
        // Save the PDF
        pdf.save('cutting-diagrams.pdf');
    });
}
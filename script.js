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
        { id: generateId(), label: 'Cabinet Side', length: 28.35, width: 22.05, quantity: 2, material: 'plywood' },
        { id: generateId(), label: 'Cabinet Top', length: 31.5, width: 22.05, quantity: 1, material: 'plywood' },
        { id: generateId(), label: 'Cabinet Bottom', length: 31.5, width: 22.05, quantity: 1, material: 'plywood' },
        { id: generateId(), label: 'Cabinet Back', length: 31.5, width: 28.35, quantity: 1, material: 'plywood' },
        { id: generateId(), label: 'Cabinet Shelf', length: 30.24, width: 21.26, quantity: 2, material: 'plywood' },
        { id: generateId(), label: 'Door', length: 28.43, width: 15.63, quantity: 2, material: 'plywood' }
    ];
    
    // Add a standard stock sheet
    stockSheets = [
        { id: generateId(), material: 'plywood', length: 96, width: 48, quantity: 2 }
    ];
    
    // Render tables
    renderPartsTable();
    renderStockTable();
}

// Calculate the cutlist
function calculateCutlist() {
    // Prepare the cutting diagrams container
    const diagramsContainer = document.getElementById('cutting-diagrams');
    diagramsContainer.innerHTML = '';
    
    // First, create a list of all parts with their repetitions
    let allPartInstances = [];
    parts.forEach(part => {
        for (let i = 0; i < part.quantity; i++) {
            allPartInstances.push({
                ...part,
                instanceId: `${part.id}-${i}`
            });
        }
    });
    
    // Sort parts by area (largest first) for better packing
    allPartInstances.sort((a, b) => {
        const areaA = a.length * a.width;
        const areaB = b.length * b.width;
        return areaB - areaA;
    });
    
    // Group parts by material
    const partsByMaterial = {};
    allPartInstances.forEach(part => {
        if (!partsByMaterial[part.material]) {
            partsByMaterial[part.material] = [];
        }
        partsByMaterial[part.material].push(part);
    });
    
    // Initialize statistics
    let totalSheets = 0;
    let totalArea = 0;
    let usedArea = 0;
    let totalCuts = 0;
    
    // Process each material type
    Object.keys(partsByMaterial).forEach(material => {
        const materialParts = partsByMaterial[material];
        
        // Find matching stock sheets
        const availableSheets = stockSheets.filter(sheet => sheet.material === material);
        
        if (availableSheets.length === 0) {
            alert(`No stock sheets available for material: ${material}`);
            return;
        }
        
        // Use the largest sheet available for this material
        let sheetToUse = availableSheets.reduce((prev, current) => {
            return (prev.length * prev.width > current.length * current.width) ? prev : current;
        });
        
        // Clone the sheet for our calculations to avoid modifying the original
        const sheetProperties = { ...sheetToUse };
        
        // Simple bin packing algorithm (greedy)
        let sheetsUsed = 0;
        let remainingParts = [...materialParts];
        
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
            
            // The available area is represented as a list of free rectangles
            let freeRects = [{ 
                x: 0, 
                y: 0, 
                width: sheetProperties.width, 
                length: sheetProperties.length 
            }];
            
            // Try to place each part
            let partIndex = 0;
            while (partIndex < remainingParts.length) {
                const part = remainingParts[partIndex];
                
                // Try to place the part in any of the free rectangles
                let placed = false;
                let rectIndex = 0;
                
                while (rectIndex < freeRects.length && !placed) {
                    const rect = freeRects[rectIndex];
                    
                    // Can the part fit in this rectangle?
                    let fits = false;
                    let partLength = part.length;
                    let partWidth = part.width;
                    let rotated = false;
                    
                    if (partLength <= rect.length && partWidth <= rect.width) {
                        fits = true;
                    } else if (options.allowRotation && partWidth <= rect.length && partLength <= rect.width) {
                        // Try rotated if allowed
                        fits = true;
                        rotated = true;
                        [partLength, partWidth] = [partWidth, partLength];
                    }
                    
                    if (fits) {
                        // Place the part in the top-left corner of this rectangle
                        const placedPart = {
                            id: part.instanceId,
                            label: part.label,
                            x: rect.x,
                            y: rect.y,
                            width: partWidth,
                            length: partLength,
                            rotated
                        };
                        
                        sheetLayout.parts.push(placedPart);
                        
                        // Add cuts
                        if (placedPart.x > 0) {
                            sheetLayout.cuts.push({
                                type: 'vertical',
                                x: placedPart.x,
                                y: placedPart.y,
                                length: placedPart.length
                            });
                            totalCuts++;
                        }
                        
                        if (placedPart.y > 0) {
                            sheetLayout.cuts.push({
                                type: 'horizontal',
                                x: placedPart.x,
                                y: placedPart.y,
                                width: placedPart.width
                            });
                            totalCuts++;
                        }
                        
                        sheetLayout.cuts.push({
                            type: 'horizontal',
                            x: placedPart.x,
                            y: placedPart.y + placedPart.length,
                            width: placedPart.width
                        });
                        totalCuts++;
                        
                        sheetLayout.cuts.push({
                            type: 'vertical',
                            x: placedPart.x + placedPart.width,
                            y: placedPart.y,
                            length: placedPart.length
                        });
                        totalCuts++;
                        
                        // Update free rectangles by splitting the current one
                        // Remove current rectangle
                        freeRects.splice(rectIndex, 1);
                        
                        // Add new free rectangles - right of part
                        if (rect.x + rect.width > placedPart.x + placedPart.width) {
                            freeRects.push({
                                x: placedPart.x + placedPart.width,
                                y: rect.y,
                                width: rect.width - (placedPart.x + placedPart.width - rect.x),
                                length: rect.length
                            });
                        }
                        
                        // Add new free rectangles - below part
                        if (rect.y + rect.length > placedPart.y + placedPart.length) {
                            freeRects.push({
                                x: rect.x,
                                y: placedPart.y + placedPart.length,
                                width: rect.width,
                                length: rect.length - (placedPart.y + placedPart.length - rect.y)
                            });
                        }
                        
                        // Remove the part from remaining parts
                        remainingParts.splice(partIndex, 1);
                        
                        // Part was placed successfully
                        placed = true;
                        usedArea += partLength * partWidth;
                        
                    } else {
                        // Try next rectangle
                        rectIndex++;
                    }
                }
                
                if (!placed) {
                    // If the part couldn't be placed in any free rectangle, 
                    // move on to the next part
                    partIndex++;
                }
            }
            
            // Calculate statistics for this sheet
            const sheetArea = sheetProperties.length * sheetProperties.width;
            totalArea += sheetArea;
            
            // Calculate sheet material utilization
            const sheetUsedArea = sheetLayout.parts.reduce((sum, part) => sum + (part.length * part.width), 0);
            const utilization = (sheetUsedArea / sheetArea) * 100;
            
            // Render this sheet layout
            renderCuttingDiagram(sheetLayout, sheetsUsed, utilization);
        }
    });
    
    // Update statistics
    document.getElementById('total-sheets').textContent = totalSheets;
    document.getElementById('material-usage').textContent = Math.round((usedArea / totalArea) * 100) + '%';
    document.getElementById('waste-area').textContent = Math.round(totalArea - usedArea) + ' sq mm';
    document.getElementById('total-cuts').textContent = totalCuts;
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
        <div>Sheet ${sheetNumber}: ${sheetLayout.material} (${sheetLayout.length} × ${sheetLayout.width} mm)</div>
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
    
    // Set container dimensions
    sheetContainer.style.width = (sheetLayout.width * scale) + 'px';
    sheetContainer.style.height = (sheetLayout.length * scale) + 'px';
    
    // Render parts
    sheetLayout.parts.forEach(part => {
        const partElement = document.createElement('div');
        partElement.className = 'part';
        partElement.style.left = (part.x * scale) + 'px';
        partElement.style.top = (part.y * scale) + 'px';
        partElement.style.width = (part.width * scale) + 'px';
        partElement.style.height = (part.length * scale) + 'px';
        
        // Display part label
        partElement.innerText = part.label + (part.rotated ? ' (R)' : '');
        
        sheetContainer.appendChild(partElement);
    });
    
    // Render cut lines
    sheetLayout.cuts.forEach(cut => {
        const cutElement = document.createElement('div');
        cutElement.className = `cut-line ${cut.type}`;
        
        if (cut.type === 'horizontal') {
            cutElement.style.left = (cut.x * scale) + 'px';
            cutElement.style.top = (cut.y * scale) + 'px';
            cutElement.style.width = (cut.width * scale) + 'px';
        } else {
            cutElement.style.left = (cut.x * scale) + 'px';
            cutElement.style.top = (cut.y * scale) + 'px';
            cutElement.style.height = (cut.length * scale) + 'px';
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
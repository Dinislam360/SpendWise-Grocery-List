// Currency symbols map
const CURRENCY_SYMBOLS = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    JPY: '¥',
    INR: '₹'
};

// Exchange rates (simplified - in a real app you'd fetch these from an API)
const EXCHANGE_RATES = {
    USD: 1,
    EUR: 0.85,
    GBP: 0.73,
    JPY: 110.5,
    INR: 75.2
};

// App state
let state = {
    lists: [],
    currentListId: null,
    currency: 'USD',
    notificationsEnabled: true
};

// DOM elements
const elements = {
    listsMenu: document.getElementById('lists-menu'),
    currentListName: document.getElementById('current-list-name'),
    listNameInput: document.getElementById('list-name-input'),
    groceryList: document.getElementById('grocery-list'),
    itemName: document.getElementById('item-name'),
    itemPrice: document.getElementById('item-price'),
    addItemBtn: document.getElementById('add-item-btn'),
    totalAmount: document.getElementById('total-amount'),
    currencySymbol: document.getElementById('currency-symbol'),
    newListBtn: document.getElementById('new-list-btn'),
    renameListBtn: document.getElementById('rename-list-btn'),
    deleteListBtn: document.getElementById('delete-list-btn'),
    currencySelect: document.getElementById('currency-select'),
    maxBudget: document.getElementById('max-budget'),
    budgetCurrency: document.getElementById('budget-currency'),
    minPrice: document.getElementById('min-price'),
    maxPrice: document.getElementById('max-price'),
    budgetStatusText: document.getElementById('budget-status-text'),
    savePdfBtn: document.getElementById('save-pdf-btn'),
    saveAllPdfBtn: document.getElementById('save-all-pdf-btn'),
    notification: document.getElementById('notification'),
    notificationMessage: document.getElementById('notification-message'),
    closeNotification: document.getElementById('close-notification')
};

// Initialize the app
function init() {
    // Load saved data from localStorage
    loadData();
    
    // Set up event listeners
    setupEventListeners();
    
    // If no lists exist, create a default one
    if (state.lists.length === 0) {
        createNewList('My Grocery List');
    } else {
        // Display the first list
        switchList(state.lists[0].id);
    }
    
    // Update UI
    updateUI();
}

// Set up all event listeners
function setupEventListeners() {
    // Add item button
    elements.addItemBtn.addEventListener('click', addItem);
    
    // Add item on Enter key
    elements.itemName.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addItem();
    });
    elements.itemPrice.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') addItem();
    });
    
    // New list button
    elements.newListBtn.addEventListener('click', () => {
        const listName = prompt('Enter a name for the new list:', 'New Grocery List');
        if (listName) {
            createNewList(listName);
        }
    });
    
    // Rename list button
    elements.renameListBtn.addEventListener('click', renameCurrentList);
    
    // Delete list button
    elements.deleteListBtn.addEventListener('click', deleteCurrentList);
    
    // Currency change
    elements.currencySelect.addEventListener('change', (e) => {
        state.currency = e.target.value;
        updateUI();
        saveData();
    });
    
    // Budget inputs
    elements.maxBudget.addEventListener('change', updateBudgetStatus);
    elements.budgetCurrency.addEventListener('change', updateBudgetStatus);
    elements.minPrice.addEventListener('change', checkPriceRange);
    elements.maxPrice.addEventListener('change', checkPriceRange);
    
    // PDF buttons
    elements.savePdfBtn.addEventListener('click', saveCurrentListAsPdf);
    elements.saveAllPdfBtn.addEventListener('click', saveAllListsAsPdf);
    
    // Notification close button
    elements.closeNotification.addEventListener('click', () => {
        elements.notification.classList.add('hidden');
    });
}

// Load data from localStorage
function loadData() {
    const savedData = localStorage.getItem('groceryAppData');
    if (savedData) {
        const parsedData = JSON.parse(savedData);
        state.lists = parsedData.lists || [];
        state.currentListId = parsedData.currentListId;
        state.currency = parsedData.currency || 'USD';
        state.notificationsEnabled = parsedData.notificationsEnabled !== false;
        
        // Set currency select value
        elements.currencySelect.value = state.currency;
    }
}

// Save data to localStorage
function saveData() {
    const dataToSave = {
        lists: state.lists,
        currentListId: state.currentListId,
        currency: state.currency,
        notificationsEnabled: state.notificationsEnabled
    };
    localStorage.setItem('groceryAppData', JSON.stringify(dataToSave));
}

// Create a new list
function createNewList(name) {
    const newList = {
        id: Date.now().toString(),
        name: name,
        items: [],
        createdAt: new Date().toISOString(),
        maxBudget: 0,
        budgetCurrency: 'USD',
        minPrice: 0,
        maxPrice: 0
    };
    
    state.lists.push(newList);
    switchList(newList.id);
    updateListsMenu();
    saveData();
}

// Switch to a different list
function switchList(listId) {
    state.currentListId = listId;
    updateUI();
    saveData();
}

// Rename the current list
function renameCurrentList() {
    const newName = elements.listNameInput.value.trim();
    if (!newName) return;
    
    const currentList = getCurrentList();
    if (currentList) {
        currentList.name = newName;
        updateUI();
        updateListsMenu();
        saveData();
    }
}

// Delete the current list
function deleteCurrentList() {
    if (state.lists.length <= 1) {
        showNotification("You can't delete the last list");
        return;
    }
    
    if (confirm('Are you sure you want to delete this list?')) {
        const index = state.lists.findIndex(list => list.id === state.currentListId);
        if (index !== -1) {
            state.lists.splice(index, 1);
            // Switch to the first available list
            switchList(state.lists[0].id);
            updateListsMenu();
            saveData();
        }
    }
}

// Get the current list object
function getCurrentList() {
    return state.lists.find(list => list.id === state.currentListId);
}

// Add a new item to the current list
function addItem() {
    const name = elements.itemName.value.trim();
    const price = parseFloat(elements.itemPrice.value);
    
    if (!name || isNaN(price)) {
        showNotification('Please enter both item name and price');
        return;
    }
    
    const currentList = getCurrentList();
    if (currentList) {
        currentList.items.push({
            id: Date.now().toString(),
            name: name,
            price: price,
            checked: false
        });
        
        // Clear input fields
        elements.itemName.value = '';
        elements.itemPrice.value = '';
        
        // Focus back on name input
        elements.itemName.focus();
        
        // Update UI and save data
        updateUI();
        saveData();
        
        // Check price range
        checkPriceRange();
    }
}

// Toggle item checked status
function toggleItemChecked(itemId) {
    const currentList = getCurrentList();
    if (currentList) {
        const item = currentList.items.find(item => item.id === itemId);
        if (item) {
            item.checked = !item.checked;
            updateUI();
            saveData();
        }
    }
}

// Remove an item from the list
function removeItem(itemId) {
    const currentList = getCurrentList();
    if (currentList) {
        const index = currentList.items.findIndex(item => item.id === itemId);
        if (index !== -1) {
            currentList.items.splice(index, 1);
            updateUI();
            saveData();
            checkPriceRange();
        }
    }
}

// Update the lists menu in the sidebar
function updateListsMenu() {
    elements.listsMenu.innerHTML = '';
    
    state.lists.forEach(list => {
        const li = document.createElement('li');
        li.className = 'list-menu-item';
        if (list.id === state.currentListId) {
            li.classList.add('active');
        }
        
        li.innerHTML = `
            <span>${list.name}</span>
            <small>${new Date(list.createdAt).toLocaleDateString()}</small>
        `;
        
        li.addEventListener('click', () => switchList(list.id));
        elements.listsMenu.appendChild(li);
    });
}

// Update the main UI
function updateUI() {
    const currentList = getCurrentList();
    if (!currentList) return;
    
    // Update list name display
    elements.currentListName.textContent = currentList.name;
    elements.listNameInput.value = currentList.name;
    
    // Update budget inputs
    elements.maxBudget.value = currentList.maxBudget || '';
    elements.budgetCurrency.value = currentList.budgetCurrency || 'USD';
    elements.minPrice.value = currentList.minPrice || '';
    elements.maxPrice.value = currentList.maxPrice || '';
    
    // Update currency symbol
    elements.currencySymbol.textContent = CURRENCY_SYMBOLS[state.currency] || '$';
    
    // Clear and rebuild the grocery list
    elements.groceryList.innerHTML = '';
    
    // Calculate total and add items to the list
    let total = 0;
    currentList.items.forEach(item => {
        if (!item.checked) {
            // Convert price to selected currency if needed
            const convertedPrice = convertCurrency(item.price, 'USD', state.currency);
            total += convertedPrice;
        }
        
        const li = document.createElement('li');
        if (item.checked) {
            li.classList.add('checked');
        }
        
        li.innerHTML = `
            <div class="item-info">
                <input type="checkbox" class="item-checkbox" ${item.checked ? 'checked' : ''}>
                <span class="item-name">${item.name}</span>
                <span class="item-price">${formatPrice(item.price, state.currency)}</span>
            </div>
            <div class="item-actions">
                <button class="btn-danger" data-id="${item.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        // Add event listeners to the checkbox and delete button
        const checkbox = li.querySelector('.item-checkbox');
        checkbox.addEventListener('change', () => toggleItemChecked(item.id));
        
        const deleteBtn = li.querySelector('.btn-danger');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            removeItem(item.id);
        });
        
        elements.groceryList.appendChild(li);
    });
    
    // Update total amount
    elements.totalAmount.textContent = total.toFixed(2);
    
    // Update budget status
    updateBudgetStatus();
}

// Convert price between currencies
function convertCurrency(amount, fromCurrency, toCurrency) {
    if (fromCurrency === toCurrency) return amount;
    // First convert to USD, then to target currency
    const usdAmount = amount / EXCHANGE_RATES[fromCurrency];
    return usdAmount * EXCHANGE_RATES[toCurrency];
}

// Format price with currency symbol
function formatPrice(price, currency) {
    const symbol = CURRENCY_SYMBOLS[currency] || '$';
    return `${symbol}${price.toFixed(2)}`;
}

// Update budget status display
function updateBudgetStatus() {
    const currentList = getCurrentList();
    if (!currentList) return;
    
    // Update list budget settings
    currentList.maxBudget = parseFloat(elements.maxBudget.value) || 0;
    currentList.budgetCurrency = elements.budgetCurrency.value;
    
    // Calculate total in budget currency
    const total = calculateTotalInCurrency(currentList.budgetCurrency);
    const maxBudget = currentList.maxBudget;
    
    if (maxBudget > 0) {
        const percentage = (total / maxBudget) * 100;
        let statusText = '';
        let statusClass = '';
        
        if (total > maxBudget) {
            statusText = `Over budget by ${formatPrice(total - maxBudget, currentList.budgetCurrency)}!`;
            statusClass = 'over-budget';
            
            // Show notification if enabled
            if (state.notificationsEnabled) {
                showNotification("You've exceeded your budget!", true);
            }
        } else {
            statusText = `${percentage.toFixed(0)}% of budget used`;
            statusClass = percentage > 80 ? 'near-budget' : 'under-budget';
            
            // Show notification if near or at budget
            if (percentage >= 100 && state.notificationsEnabled) {
                showNotification("You've reached your budget limit!", true);
            } else if (percentage >= 90 && state.notificationsEnabled) {
                showNotification("You're approaching your budget limit", true);
            }
        }
        
        elements.budgetStatusText.textContent = statusText;
        elements.budgetStatusText.className = statusClass;
    } else {
        elements.budgetStatusText.textContent = '';
        elements.budgetStatusText.className = '';
    }
    
    saveData();
}

// Calculate total in a specific currency
function calculateTotalInCurrency(currency) {
    const currentList = getCurrentList();
    if (!currentList) return 0;
    
    let total = 0;
    currentList.items.forEach(item => {
        if (!item.checked) {
            // Convert each item's price to the target currency
            total += convertCurrency(item.price, 'USD', currency);
        }
    });
    
    return total;
}

// Check if any item is outside the price range
function checkPriceRange() {
    const currentList = getCurrentList();
    if (!currentList) return;
    
    // Update list price range settings
    currentList.minPrice = parseFloat(elements.minPrice.value) || 0;
    currentList.maxPrice = parseFloat(elements.maxPrice.value) || 0;
    
    // If no range is set, do nothing
    if (currentList.minPrice <= 0 && currentList.maxPrice <= 0) return;
    
    let itemsOutOfRange = [];
    
    currentList.items.forEach(item => {
        // Convert item price to current display currency for comparison
        const convertedPrice = convertCurrency(item.price, 'USD', state.currency);
        
        if ((currentList.minPrice > 0 && convertedPrice < currentList.minPrice) || 
            (currentList.maxPrice > 0 && convertedPrice > currentList.maxPrice)) {
            itemsOutOfRange.push(item.name);
        }
    });
    
    if (itemsOutOfRange.length > 0 && state.notificationsEnabled) {
        showNotification(`Price alert: ${itemsOutOfRange.join(', ')} outside your price range`, true);
    }
    
    saveData();
}

// Show a notification message
function showNotification(message, playSound = false) {
    elements.notificationMessage.textContent = message;
    elements.notification.classList.remove('hidden');
    
    if (playSound) {
        // In a real app, you would play a sound here
        // For web, you could use the Web Audio API
        // For Cordova/PhoneGap, you would use the native notification sound
        console.log('Notification sound would play here');
    }
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        elements.notification.classList.add('hidden');
    }, 5000);
}

// Save current list as PDF
async function saveCurrentListAsPdf() {
    const currentList = getCurrentList();
    if (!currentList) return;
    
    try {
        const { PDFDocument, rgb } = PDFLib;
        
        // Create a new PDF document
        const pdfDoc = await PDFDocument.create();
        const page = pdfDoc.addPage([550, 750]);
        
        const { width, height } = page.getSize();
        const margin = 50;
        
        // Add title
        page.drawText(currentList.name, {
            x: margin,
            y: height - margin - 30,
            size: 24,
            color: rgb(0, 0, 0)
        });
        
        // Add date
        page.drawText(`Created: ${new Date(currentList.createdAt).toLocaleDateString()}`, {
            x: margin,
            y: height - margin - 60,
            size: 12,
            color: rgb(0.5, 0.5, 0.5)
        });
        
        // Add budget info if set
        if (currentList.maxBudget > 0) {
            page.drawText(`Budget: ${formatPrice(currentList.maxBudget, currentList.budgetCurrency)}`, {
                x: margin,
                y: height - margin - 90,
                size: 12,
                color: rgb(0, 0, 0)
            });
        }
        
        // Add items
        let yPos = height - margin - 140;
        currentList.items.forEach((item, index) => {
            const itemText = `${index + 1}. ${item.name} - ${formatPrice(item.price, state.currency)}`;
            page.drawText(itemText, {
                x: margin,
                y: yPos,
                size: 14,
                color: item.checked ? rgb(0.7, 0.7, 0.7) : rgb(0, 0, 0)
            });
            yPos -= 25;
        });
        
        // Add total
        const total = calculateTotalInCurrency(state.currency);
        page.drawText(`Total: ${formatPrice(total, state.currency)}`, {
            x: margin,
            y: yPos - 40,
            size: 16,
            color: rgb(0, 0, 0)
        });
        
        // Save the PDF
        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        saveAs(blob, `${currentList.name}.pdf`);
        
        showNotification('PDF saved successfully');
    } catch (error) {
        console.error('Error generating PDF:', error);
        showNotification('Failed to generate PDF');
    }
}

// Save all lists as a single PDF
async function saveAllListsAsPdf() {
    if (state.lists.length === 0) return;
    
    try {
        const { PDFDocument, rgb } = PDFLib;
        
        // Create a new PDF document
        const pdfDoc = await PDFDocument.create();
        
        // Process each list
        for (const list of state.lists) {
            const page = pdfDoc.addPage([550, 750]);
            const { width, height } = page.getSize();
            const margin = 50;
            
            // Add list title
            page.drawText(list.name, {
                x: margin,
                y: height - margin - 30,
                size: 24,
                color: rgb(0, 0, 0)
            });
            
            // Add date
            page.drawText(`Created: ${new Date(list.createdAt).toLocaleDateString()}`, {
                x: margin,
                y: height - margin - 60,
                size: 12,
                color: rgb(0.5, 0.5, 0.5)
            });
            
            // Add budget info if set
            if (list.maxBudget > 0) {
                page.drawText(`Budget: ${formatPrice(list.maxBudget, list.budgetCurrency)}`, {
                    x: margin,
                    y: height - margin - 90,
                    size: 12,
                    color: rgb(0, 0, 0)
                });
            }
            
            // Add items
            let yPos = height - margin - 140;
            list.items.forEach((item, index) => {
                const itemText = `${index + 1}. ${item.name} - ${formatPrice(item.price, state.currency)}`;
                page.drawText(itemText, {
                    x: margin,
                    y: yPos,
                    size: 14,
                    color: item.checked ? rgb(0.7, 0.7, 0.7) : rgb(0, 0, 0)
                });
                yPos -= 25;
            });
            
            // Add total
            const total = list.items.reduce((sum, item) => {
                if (!item.checked) {
                    return sum + convertCurrency(item.price, 'USD', state.currency);
                }
                return sum;
            }, 0);
            
            page.drawText(`Total: ${formatPrice(total, state.currency)}`, {
                x: margin,
                y: yPos - 40,
                size: 16,
                color: rgb(0, 0, 0)
            });
        }
        
        // Save the PDF
        const pdfBytes = await pdfDoc.save();
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        saveAs(blob, 'All_Grocery_Lists.pdf');
        
        showNotification('All lists saved as PDF');
    } catch (error) {
        console.error('Error generating PDF:', error);
        showNotification('Failed to generate PDF');
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);
class Tab {
    constructor(id, name = 'Untitled') {
        this.id = id;
        this.name = name;
        this.content = '';
    }
}

const state = {
    tabs: [],
    activeTab: null,
    nextTabId: 1
};

const textarea = document.getElementById('notepad-content');
const wordCount = document.querySelector('.word-count');
const charCount = document.querySelector('.char-count');
const lineCount = document.querySelector('.line-count');
const colCount = document.querySelector('.col-count');
const saveStatus = document.querySelector('.save-status');
const lastModified = document.querySelector('.last-modified');
const lineNumbers = document.getElementById('line-numbers');
let saveTimeout;

// Theme toggle
const themeToggle = document.getElementById('theme-toggle');
themeToggle.addEventListener('click', () => {
    document.body.dataset.theme = document.body.dataset.theme === 'dark' ? 'light' : 'dark';
    themeToggle.textContent = document.body.dataset.theme === 'dark' ? '☀️ Light Mode' : '🌙 Dark Mode';
});

// Font size setup
const fontSizeSelect = document.getElementById('font-size');
fontSizeSelect.innerHTML = ''; // Clear existing options
for (let size = 8; size <= 32; size += 2) {
    const option = document.createElement('option');
    option.value = size;
    option.textContent = `${size}px`;
    option.selected = size === 14; // Default size
    fontSizeSelect.appendChild(option);
}

// Font size control
fontSizeSelect.addEventListener('change', (e) => {
    textarea.style.fontSize = `${e.target.value}px`;
});

// Export functionality
document.getElementById('export-txt').addEventListener('click', () => {
    const currentTab = state.tabs.find(t => t.id === state.activeTab);
    const fileName = `${currentTab.name}-${new Date().toISOString().slice(0,10)}.txt`;
    const blob = new Blob([textarea.value], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
});

// Tab management
function createTab() {
    const tab = new Tab(state.nextTabId++);
    state.tabs.push(tab);
    saveTabsToStorage();
    renderTabs();
    switchTab(tab.id);
}

function deleteTab(tabId) {
    const tab = state.tabs.find(t => t.id === tabId);
    if (!confirm(`Are you sure you want to delete the tab "${tab.name}"?`)) {
        return;
    }

    const index = state.tabs.findIndex(tab => tab.id === tabId);
    if (index !== -1) {
        state.tabs.splice(index, 1);
        if (state.activeTab === tabId) {
            state.activeTab = state.tabs[Math.max(0, index - 1)]?.id;
        }
        saveTabsToStorage();
        renderTabs();
        if (state.activeTab) {
            switchTab(state.activeTab);
        }
    }
}

function renameTab(tabId, newName) {
    const tab = state.tabs.find(t => t.id === tabId);
    if (tab) {
        tab.name = newName || 'Untitled';
        saveTabsToStorage();
        renderTabs();
    }
}

function switchTab(tabId) {
    saveCurrentTab();
    state.activeTab = tabId;
    const tab = state.tabs.find(t => t.id === tabId);
    if (tab) {
        textarea.value = tab.content;
        updateAllCounts();
        updateLineNumbers();
    }
    renderTabs();
}

function saveCurrentTab() {
    if (state.activeTab) {
        const tab = state.tabs.find(t => t.id === state.activeTab);
        if (tab) {
            tab.content = textarea.value;
            saveTabsToStorage();
        }
    }
}

function renderTabs() {
    const tabsContainer = document.getElementById('tabs');
    tabsContainer.innerHTML = '';
    state.tabs.forEach(tab => {
        const tabElement = document.createElement('div');
        tabElement.className = `tab ${tab.id === state.activeTab ? 'active' : ''}`;
        tabElement.innerHTML = `
            <span class="tab-name">${tab.name}</span>
            <span class="tab-close">×</span>
        `;
        
        const nameElement = tabElement.querySelector('.tab-name');
        nameElement.addEventListener('click', (e) => {
            if (tab.id === state.activeTab) {
                const input = document.createElement('input');
                input.className = 'tab-name-input';
                input.value = tab.name;
                nameElement.replaceWith(input);
                input.focus();
                input.select();

                const handleRename = () => {
                    renameTab(tab.id, input.value.trim());
                };

                input.addEventListener('blur', handleRename);
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        e.preventDefault();
                        input.blur();
                    }
                });
            } else {
                switchTab(tab.id);
            }
        });

        tabElement.querySelector('.tab-close').addEventListener('click', (e) => {
            e.stopPropagation();
            if (state.tabs.length > 1) {
                deleteTab(tab.id);
            }
        });
        tabsContainer.appendChild(tabElement);
    });
}

// Storage management
function saveTabsToStorage() {
    localStorage.setItem('notepadTabs', JSON.stringify(state.tabs));
    localStorage.setItem('notepadActiveTab', state.activeTab);
}

function loadTabsFromStorage() {
    const savedTabs = localStorage.getItem('notepadTabs');
    const savedActiveTab = localStorage.getItem('notepadActiveTab');
    if (savedTabs) {
        state.tabs = JSON.parse(savedTabs);
        state.nextTabId = Math.max(...state.tabs.map(t => t.id)) + 1;
        state.activeTab = parseInt(savedActiveTab);
    } else {
        createTab();
    }
    renderTabs();
    if (state.activeTab) {
        switchTab(state.activeTab);
    }
}

// Counts and updates
function updateWordCount() {
    const words = textarea.value.trim() ? textarea.value.trim().split(/\s+/).length : 0;
    wordCount.textContent = `${words} word${words !== 1 ? 's' : ''}`;
}

function updateCharCount() {
    const chars = textarea.value.length;
    charCount.textContent = `${chars} character${chars !== 1 ? 's' : ''}`;
}

function updateLineCount() {
    const lines = textarea.value.split('\n').length;
    lineCount.textContent = `${lines} line${lines !== 1 ? 's' : ''}`;
}

function updateColCount(e) {
    const pos = textarea.selectionStart;
    const lines = textarea.value.substr(0, pos).split('\n');
    const currentLine = lines[lines.length - 1];
    colCount.textContent = `Col: ${currentLine.length + 1}`;
}

function updateLineNumbers() {
    const lines = textarea.value.split('\n').length;
    lineNumbers.innerHTML = Array.from({ length: lines }, (_, i) => `<div>${i + 1}</div>`).join('');
}

function updateAllCounts() {
    updateWordCount();
    updateCharCount();
    updateLineCount();
    updateColCount();
    updateLineNumbers();
}

function updateLastModified() {
    const now = new Date();
    lastModified.textContent = `Last modified: ${now.toLocaleTimeString()}`;
}

// Event listeners
textarea.addEventListener('input', () => {
    clearTimeout(saveTimeout);
    saveStatus.textContent = 'Saving...';
    updateAllCounts();
    
    saveTimeout = setTimeout(() => {
        saveCurrentTab();
        updateLastModified();
        saveStatus.textContent = 'All changes saved';
    }, 1000);
});

textarea.addEventListener('keyup', updateColCount);
textarea.addEventListener('click', updateColCount);
document.getElementById('new-tab').addEventListener('click', createTab);

// Initialize
loadTabsFromStorage();
updateLastModified();
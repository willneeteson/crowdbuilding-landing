// Dynamic tab system functionality with accessibility and URL hash support
document.addEventListener('DOMContentLoaded', function() {
    // Cache DOM elements and create tab mapping
    const tabsWrapper = document.querySelector('.tabs__wrapper');
    if (!tabsWrapper) {
        console.error('Tabs wrapper not found');
        return;
    }

    // Find all tab buttons and panels
    const tabButtons = {};
    const tabPanels = {};
    
    // Map buttons to panels based on ID relationship
    document.querySelectorAll('.tabs__bar-link').forEach(btn => {
        const btnId = btn.id;
        // Extract tab key from button ID (e.g., 'tabBtnCommunity' -> 'Community')
        const tabKey = btnId.replace('tabBtn', '').toLowerCase();
        // Find corresponding panel (e.g., 'tabCommunity')
        const panel = document.getElementById('tab' + btnId.replace('tabBtn', ''));
        
        if (panel) {
            tabButtons[tabKey] = btn;
            tabPanels[tabKey] = panel;
        } else {
            console.warn(`No matching panel found for button: ${btnId}`);
        }
    });

    // Set initial ARIA attributes
    function initializeARIA() {
        const tabsList = document.querySelector('.tabs__bar');
        if (tabsList) {
            tabsList.setAttribute('role', 'tablist');
        }

        // Set roles and relationships for each tab pair
        Object.entries(tabButtons).forEach(([key, btn]) => {
            const panel = tabPanels[key];
            
            // Setup button attributes
            btn.setAttribute('role', 'tab');
            btn.setAttribute('aria-selected', 'false');
            btn.setAttribute('tabindex', '-1');
            btn.setAttribute('aria-controls', panel.id);
            
            // Setup panel attributes
            panel.setAttribute('role', 'tabpanel');
            panel.setAttribute('aria-hidden', 'true');
            panel.setAttribute('tabindex', '0');
            panel.setAttribute('aria-labelledby', btn.id);

            // Update href to use hash
            btn.href = `#${key}`;
        });
    }

    // Function to switch tabs with enhanced accessibility
    function switchTab(activeKey, updateHash = true) {
        if (!tabButtons[activeKey] || !tabPanels[activeKey]) {
            console.error(`Invalid tab key: ${activeKey}`);
            return;
        }

        // Deactivate all tabs first
        Object.entries(tabButtons).forEach(([key, btn]) => {
            const panel = tabPanels[key];
            btn.classList.remove('active');
            btn.setAttribute('aria-selected', 'false');
            btn.setAttribute('tabindex', '-1');
            panel.style.display = 'none';
            panel.setAttribute('aria-hidden', 'true');
        });

        // Activate the selected tab
        const activeBtn = tabButtons[activeKey];
        const activePanel = tabPanels[activeKey];

        activeBtn.classList.add('active');
        activeBtn.setAttribute('aria-selected', 'true');
        activeBtn.setAttribute('tabindex', '0');
        activeBtn.focus();

        activePanel.style.display = 'block';
        activePanel.setAttribute('aria-hidden', 'false');

        // Update URL hash if requested
        if (updateHash) {
            history.pushState(null, '', `#${activeKey}`);
        }
    }

    // Handle keyboard navigation
    function handleKeyPress(event) {
        const isTab = event.target.getAttribute('role') === 'tab';
        if (!isTab) return;

        const keys = Object.keys(tabButtons);
        const currentIndex = keys.findIndex(key => tabButtons[key] === event.target);

        switch (event.key) {
            case 'ArrowLeft':
            case 'ArrowUp':
                event.preventDefault();
                const prevIndex = currentIndex > 0 ? currentIndex - 1 : keys.length - 1;
                switchTab(keys[prevIndex]);
                break;
            case 'ArrowRight':
            case 'ArrowDown':
                event.preventDefault();
                const nextIndex = currentIndex < keys.length - 1 ? currentIndex + 1 : 0;
                switchTab(keys[nextIndex]);
                break;
            case 'Home':
                event.preventDefault();
                switchTab(keys[0]);
                break;
            case 'End':
                event.preventDefault();
                switchTab(keys[keys.length - 1]);
                break;
        }
    }

    // Handle URL hash changes
    function handleHashChange() {
        const hash = window.location.hash.slice(1).toLowerCase();
        if (hash && tabButtons[hash]) {
            switchTab(hash, false); // Don't update hash again
        }
    }

    // Event listeners
    function addEventListeners() {
        // Click events for all tab buttons
        Object.entries(tabButtons).forEach(([key, btn]) => {
            btn.addEventListener('click', e => {
                e.preventDefault();
                switchTab(key);
            });
            
            // Keyboard navigation
            btn.addEventListener('keydown', handleKeyPress);
        });

        // Listen for hash changes
        window.addEventListener('hashchange', handleHashChange);
    }

    // Initialize tabs
    function init() {
        const tabCount = Object.keys(tabButtons).length;
        if (tabCount === 0) {
            console.error('No tab pairs found. Check HTML structure and IDs.');
            return;
        }

        console.log(`Initialized ${tabCount} tabs`);
        initializeARIA();
        addEventListeners();

        // Check for hash in URL on load
        const initialHash = window.location.hash.slice(1).toLowerCase();
        if (initialHash && tabButtons[initialHash]) {
            // Use the hash from URL
            switchTab(initialHash, false);
        } else {
            // Activate first tab by default
            const firstTabKey = Object.keys(tabButtons)[0];
            switchTab(firstTabKey);
        }
    }

    init();
});
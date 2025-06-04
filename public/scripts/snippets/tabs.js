// Tab system functionality with accessibility and optimization
document.addEventListener('DOMContentLoaded', function() {
    // Cache DOM elements
    const tabButtons = {
        community: document.getElementById('tabBtnCommunity'),
        over: document.getElementById('tabBtnOver')
    };
    const tabPanels = {
        community: document.getElementById('tabCommunity'),
        over: document.getElementById('tabOver')
    };

    // Set initial ARIA attributes
    function initializeARIA() {
        // Set roles and relationships
        Object.values(tabButtons).forEach(btn => {
            btn.setAttribute('role', 'tab');
            btn.setAttribute('aria-selected', 'false');
            btn.setAttribute('tabindex', '-1');
        });

        Object.values(tabPanels).forEach(panel => {
            panel.setAttribute('role', 'tabpanel');
            panel.setAttribute('aria-hidden', 'true');
            panel.setAttribute('tabindex', '0');
        });

        // Set initial active tab
        tabButtons.community.setAttribute('aria-selected', 'true');
        tabButtons.community.setAttribute('tabindex', '0');
        tabPanels.community.setAttribute('aria-hidden', 'false');
    }

    // Function to switch tabs with enhanced accessibility
    function switchTab(activeKey, inactiveKey) {
        const activeBtn = tabButtons[activeKey];
        const inactiveBtn = tabButtons[inactiveKey];
        const activePanel = tabPanels[activeKey];
        const inactivePanel = tabPanels[inactiveKey];

        // Update button states
        activeBtn.classList.add('active');
        activeBtn.setAttribute('aria-selected', 'true');
        activeBtn.setAttribute('tabindex', '0');
        activeBtn.focus();

        inactiveBtn.classList.remove('active');
        inactiveBtn.setAttribute('aria-selected', 'false');
        inactiveBtn.setAttribute('tabindex', '-1');

        // Show/hide content
        activePanel.style.display = 'block';
        activePanel.setAttribute('aria-hidden', 'false');

        inactivePanel.style.display = 'none';
        inactivePanel.setAttribute('aria-hidden', 'true');
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
                switchTab(keys[prevIndex], keys[currentIndex]);
                break;
            case 'ArrowRight':
            case 'ArrowDown':
                event.preventDefault();
                const nextIndex = currentIndex < keys.length - 1 ? currentIndex + 1 : 0;
                switchTab(keys[nextIndex], keys[currentIndex]);
                break;
            case 'Home':
                event.preventDefault();
                switchTab(keys[0], keys[currentIndex]);
                break;
            case 'End':
                event.preventDefault();
                switchTab(keys[keys.length - 1], keys[currentIndex]);
                break;
        }
    }

    // Event listeners
    function addEventListeners() {
        // Click events
        tabButtons.community.addEventListener('click', e => {
            e.preventDefault();
            switchTab('community', 'over');
        });

        tabButtons.over.addEventListener('click', e => {
            e.preventDefault();
            switchTab('over', 'community');
        });

        // Keyboard navigation
        Object.values(tabButtons).forEach(btn => {
            btn.addEventListener('keydown', handleKeyPress);
        });
    }

    // Initialize tabs
    function init() {
        if (!Object.values(tabButtons).every(Boolean) || !Object.values(tabPanels).every(Boolean)) {
            console.error('Tab elements not found. Please check the HTML structure.');
            return;
        }

        initializeARIA();
        addEventListeners();
        switchTab('community', 'over'); // Set default tab
    }

    init();
});
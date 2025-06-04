// Tab system functionality
document.addEventListener('DOMContentLoaded', function() {
    // Get tab buttons and content elements
    const tabBtnCommunity = document.getElementById('tabBtnCommunity');
    const tabBtnOver = document.getElementById('tabBtnOver');
    const tabCommunity = document.getElementById('tabCommunity');
    const tabOver = document.getElementById('tabOver');

    // Function to switch tabs
    function switchTab(activeBtn, inactiveBtn, activeContent, inactiveContent) {
        // Update button states
        activeBtn.classList.add('active');
        inactiveBtn.classList.remove('active');

        // Show/hide content
        activeContent.style.display = 'block';
        inactiveContent.style.display = 'none';
    }

    // Event listeners for tab buttons
    tabBtnCommunity.addEventListener('click', function(e) {
        e.preventDefault();
        switchTab(tabBtnCommunity, tabBtnOver, tabCommunity, tabOver);
    });

    tabBtnOver.addEventListener('click', function(e) {
        e.preventDefault();
        switchTab(tabBtnOver, tabBtnCommunity, tabOver, tabCommunity);
    });

    // Initialize tabs (show Community tab by default)
    switchTab(tabBtnCommunity, tabBtnOver, tabCommunity, tabOver);
});
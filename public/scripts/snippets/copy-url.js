/**
 * Copy URL to Clipboard Module
 * Provides functionality to copy the current page URL to clipboard with visual feedback
 */

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        TOOLTIP_DURATION: 2000, // Duration to show tooltip in milliseconds
        TOOLTIP_TEXT: 'Copied!'
    };

    /**
     * Shows a tooltip on the element using the existing tooltip system
     * @param {HTMLElement} element - The element to show the tooltip on
     */
    function showTooltip(element) {
        console.log('Showing tooltip for element:', element);
        
        // Set the tooltip data attribute
        element.setAttribute('data-tooltip', CONFIG.TOOLTIP_TEXT);
        
        // Trigger mouseover to show tooltip
        const mouseoverEvent = new MouseEvent('mouseover', {
            bubbles: true,
            cancelable: true
        });
        element.dispatchEvent(mouseoverEvent);

        // Remove tooltip after duration
        setTimeout(() => {
            const mouseoutEvent = new MouseEvent('mouseout', {
                bubbles: true,
                cancelable: true
            });
            element.dispatchEvent(mouseoutEvent);
            element.removeAttribute('data-tooltip');
            console.log('Tooltip hidden');
        }, CONFIG.TOOLTIP_DURATION);
    }

    /**
     * Copies the current URL to clipboard
     * @param {Event} event - Click event
     */
    async function copyUrlToClipboard(event) {
        console.log('Copy button clicked');
        try {
            const url = window.location.href;
            await navigator.clipboard.writeText(url);
            console.log('URL copied to clipboard:', url);
            
            // Show tooltip at top center of the clicked element
            showTooltip(this);
        } catch (err) {
            console.error('Failed to copy URL:', err);
        }
    }

    /**
     * Initializes the copy URL functionality
     * @param {string|HTMLElement} trigger - Selector or element that triggers the copy
     */
    function initCopyUrl(trigger) {
        console.log('Initializing copy URL with trigger:', trigger);
        const element = typeof trigger === 'string' ? document.querySelector(trigger) : trigger;
        
        if (!element) {
            console.warn('Copy URL trigger element not found');
            return;
        }

        console.log('Found trigger element:', element);
        element.addEventListener('click', copyUrlToClipboard);
    }

    // Export the initialization function
    window.copyUrl = {
        init: initCopyUrl
    };
})();
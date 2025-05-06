/**
 * Copy URL to Clipboard Module
 * Provides functionality to copy the current page URL to clipboard with visual feedback
 */

(function() {
    'use strict';

    // Configuration
    const CONFIG = {
        TOOLTIP_DURATION: 2000, // Duration to show tooltip in milliseconds
        TOOLTIP_CLASS: 'copy-tooltip',
        TOOLTIP_TEXT: 'Copied!',
        TOOLTIP_STYLES: `
            .copy-tooltip {
                position: absolute;
                background: #090F3F;
                color: white;
                padding: 4px 8px;
                border-radius: 16px;
                font-size: 14px;
                font-weight: 700;
                pointer-events: none;
                z-index: 999999;
                opacity: 0;
                transition: opacity 0.2s ease-in-out;
                white-space: nowrap;
                transform: translateX(-50%);
            }
            .copy-tooltip.visible {
                opacity: 1;
            }
        `
    };

    /**
     * Creates and shows a tooltip at the top center of the element
     * @param {HTMLElement} element - The element to position the tooltip above
     */
    function showTooltip(element) {
        console.log('Showing tooltip for element:', element);
        
        // Create tooltip element if it doesn't exist
        let tooltip = document.querySelector(`.${CONFIG.TOOLTIP_CLASS}`);
        if (!tooltip) {
            console.log('Creating new tooltip element');
            // Add styles if not already added
            if (!document.querySelector(`#${CONFIG.TOOLTIP_CLASS}-styles`)) {
                const styleSheet = document.createElement('style');
                styleSheet.id = `${CONFIG.TOOLTIP_CLASS}-styles`;
                styleSheet.textContent = CONFIG.TOOLTIP_STYLES;
                document.head.appendChild(styleSheet);
            }

            tooltip = document.createElement('div');
            tooltip.className = CONFIG.TOOLTIP_CLASS;
            tooltip.textContent = CONFIG.TOOLTIP_TEXT;
            document.body.appendChild(tooltip);
        }

        // Get element position
        const rect = element.getBoundingClientRect();
        console.log('Element position:', rect);
        
        // Position tooltip at top center of element
        const tooltipLeft = rect.left + (rect.width / 2);
        const tooltipTop = rect.top - 40;
        
        console.log('Tooltip position:', { left: tooltipLeft, top: tooltipTop });
        
        tooltip.style.left = `${tooltipLeft}px`;
        tooltip.style.top = `${tooltipTop}px`;

        // Show tooltip
        tooltip.classList.add('visible');
        console.log('Tooltip should be visible now');

        // Hide tooltip after duration
        setTimeout(() => {
            tooltip.classList.remove('visible');
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
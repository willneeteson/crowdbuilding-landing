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
                position: fixed;
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 8px 16px;
                border-radius: 4px;
                font-size: 14px;
                pointer-events: none;
                z-index: 9999;
                opacity: 0;
                transition: opacity 0.2s ease-in-out;
            }
            .copy-tooltip.visible {
                opacity: 1;
            }
        `
    };

    /**
     * Creates and shows a tooltip at the specified position
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     */
    function showTooltip(x, y) {
        // Create tooltip element if it doesn't exist
        let tooltip = document.querySelector(`.${CONFIG.TOOLTIP_CLASS}`);
        if (!tooltip) {
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

        // Position tooltip
        tooltip.style.left = `${x}px`;
        tooltip.style.top = `${y - 40}px`; // Position above the click point

        // Show tooltip
        tooltip.classList.add('visible');

        // Hide tooltip after duration
        setTimeout(() => {
            tooltip.classList.remove('visible');
        }, CONFIG.TOOLTIP_DURATION);
    }

    /**
     * Copies the current URL to clipboard
     * @param {Event} event - Click event
     */
    async function copyUrlToClipboard(event) {
        try {
            const url = window.location.href;
            await navigator.clipboard.writeText(url);
            
            // Show tooltip at click position
            showTooltip(event.clientX, event.clientY);
        } catch (err) {
            console.error('Failed to copy URL:', err);
        }
    }

    /**
     * Initializes the copy URL functionality
     * @param {string|HTMLElement} trigger - Selector or element that triggers the copy
     */
    function initCopyUrl(trigger) {
        const element = typeof trigger === 'string' ? document.querySelector(trigger) : trigger;
        
        if (!element) {
            console.warn('Copy URL trigger element not found');
            return;
        }

        element.addEventListener('click', copyUrlToClipboard);
    }

    // Export the initialization function
    window.copyUrl = {
        init: initCopyUrl
    };
})(); 
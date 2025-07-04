// Tooltip Component
class Tooltip {
    constructor() {
        this.tooltip = null;
        this.init();
    }

    init() {
        // Create tooltip element
        this.tooltip = document.createElement('div');
        this.tooltip.className = 'tooltip';
        this.tooltip.setAttribute('role', 'tooltip');
        document.body.appendChild(this.tooltip);

        // Add event listeners to all elements with data-tooltip attribute
        document.addEventListener('mouseover', this.handleMouseOver.bind(this));
        document.addEventListener('mouseout', this.handleMouseOut.bind(this));
        document.addEventListener('focusin', this.handleFocusIn.bind(this));
        document.addEventListener('focusout', this.handleFocusOut.bind(this));
    }

    handleMouseOver(e) {
        const target = e.target.closest('[data-tooltip]');
        if (target) {
            this.showTooltip(target);
        }
    }

    handleMouseOut(e) {
        const target = e.target.closest('[data-tooltip]');
        if (target && !target.contains(e.relatedTarget)) {
            this.hideTooltip();
        }
    }

    handleFocusIn(e) {
        const target = e.target.closest('[data-tooltip]');
        if (target) {
            this.showTooltip(target);
        }
    }

    handleFocusOut(e) {
        const target = e.target.closest('[data-tooltip]');
        if (target && !target.contains(e.relatedTarget)) {
            this.hideTooltip();
        }
    }

    showTooltip(target) {
        const content = target.getAttribute('data-tooltip');
        const position = target.getAttribute('data-tooltip-position') || 'top';
        
        this.tooltip.textContent = content;
        this.tooltip.className = `tooltip tooltip-${position}`;
        
        const rect = target.getBoundingClientRect();
        const tooltipRect = this.tooltip.getBoundingClientRect();
        
        let top, left;
        
        switch(position) {
            case 'top':
                top = rect.top - tooltipRect.height - 8;
                left = rect.left + (rect.width - tooltipRect.width) / 2;
                break;
            case 'bottom':
                top = rect.bottom + 8;
                left = rect.left + (rect.width - tooltipRect.width) / 2;
                break;
            case 'left':
                top = rect.top + (rect.height - tooltipRect.height) / 2;
                left = rect.left - tooltipRect.width - 8;
                break;
            case 'right':
                top = rect.top + (rect.height - tooltipRect.height) / 2;
                left = rect.right + 8;
                break;
        }
        
        this.tooltip.style.top = `${top + window.scrollY}px`;
        this.tooltip.style.left = `${left + window.scrollX}px`;
        this.tooltip.style.display = 'block';
    }

    hideTooltip() {
        this.tooltip.style.display = 'none';
    }
}

// Add required CSS
const style = document.createElement('style');
style.textContent = `
    .tooltip {
        position: absolute;
        display: none;
        background: #090F3F;
        color: white;
        padding: 8px 12px;
        border-radius: 4px;
        font-size: 14px;
        z-index: 1000;
        pointer-events: none;
        max-width: 200px;
        text-align: center;
    }

    .tooltip::after {
        content: '';
        position: absolute;
        border: 6px solid transparent;
    }

    .tooltip-top::after {
        bottom: -12px;
        left: 50%;
        transform: translateX(-50%);
        border-top-color: #090F3F;
    }

    .tooltip-bottom::after {
        top: -12px;
        left: 50%;
        transform: translateX(-50%);
        border-bottom-color: #090F3F;
    }

    .tooltip-left::after {
        right: -12px;
        top: 50%;
        transform: translateY(-50%);
        border-left-color: #090F3F;
    }

    .tooltip-right::after {
        left: -12px;
        top: 50%;
        transform: translateY(-50%);
        border-right-color: #090F3F;
    }
`;
document.head.appendChild(style);

// Initialize tooltips when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new Tooltip();
});

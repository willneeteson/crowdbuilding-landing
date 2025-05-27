// Shared modal system
class ModalSystem {
    constructor() {
        this.addStyles();
        // Dispatch event when modal system is ready
        window.dispatchEvent(new Event('modalSystemReady'));
    }

    addStyles() {
        const modalStyles = `
            .cb-modal {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                justify-content: center;
                align-items: center;
                z-index: 1000;
                animation: cbFadeIn 0.3s ease-in-out;
            }

            .cb-modal-content {
                background: white;
                padding: 30px;
                border-radius: 12px;
                max-width: 600px;
                width: 90%;
                max-height: 90vh;
                overflow-y: auto;
                position: relative;
                animation: cbSlideIn 0.3s ease-in-out;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
            }

            .cb-modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding-bottom: 15px;
                border-bottom: 1px solid #eee;
            }

            .cb-modal-header h3 {
                margin: 0;
                font-size: 1.5em;
                color: #090F3F;
            }

            .cb-modal-close {
                cursor: pointer;
                font-size: 24px;
                color: #666;
                transition: color 0.2s;
                padding: 5px;
                line-height: 1;
            }

            .cb-modal-close:hover {
                color: #090F3F;
            }

            .cb-modal-body {
                color: #333;
            }

            .cb-details-grid {
                display: grid;
                gap: 15px;
            }

            .cb-detail-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 0.75rem 0;
                border-bottom: 1px solid #eee;
            }

            .cb-detail-item:last-child {
                border-bottom: none;
            }

            .cb-detail-item strong {
                color: #666;
                font-weight: 600;
                min-width: 140px;
            }

            .cb-members-list {
                display: grid;
                gap: 15px;
            }

            .cb-member-item {
                padding: 12px;
                border-radius: 8px;
                background: #f8f9fa;
                transition: background-color 0.2s;
            }

            .cb-member-item:hover {
                background: #f0f2f5;
            }

            .cb-member-link {
                display: flex;
                align-items: center;
                gap: 15px;
                text-decoration: none;
                color: inherit;
            }

            .cb-member-avatar {
                width: 50px;
                height: 50px;
                border-radius: 50%;
                overflow: hidden;
            }

            .cb-member-avatar img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }

            .cb-member-info {
                flex: 1;
            }

            .cb-member-name {
                font-weight: 600;
                color: #090F3F;
            }

            .cb-member-role {
                font-size: 0.9em;
                color: #666;
            }

            @keyframes cbFadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }

            @keyframes cbSlideIn {
                from { transform: translateY(-20px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
        `;

        const styleSheet = document.createElement('style');
        styleSheet.textContent = modalStyles;
        document.head.appendChild(styleSheet);
    }

    createModal(title, content, options = {}) {
        const modal = document.createElement('div');
        modal.className = 'cb-modal';
        modal.id = options.id || 'cb-modal-' + Date.now();

        const modalHTML = `
            <div class="cb-modal-content">
                <div class="cb-modal-header">
                    <h3>${title}</h3>
                    <span class="cb-modal-close">&times;</span>
                </div>
                <div class="cb-modal-body">
                    ${content}
                </div>
            </div>
        `;

        modal.innerHTML = modalHTML;

        // Add event listeners
        modal.querySelector('.cb-modal-close').addEventListener('click', () => this.closeModal(modal.id));
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                this.closeModal(modal.id);
            }
        });

        // Add escape key handler
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.style.display === 'flex') {
                this.closeModal(modal.id);
            }
        });

        document.body.appendChild(modal);
        return modal;
    }

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'none';
        }
    }

    updateModalContent(modalId, content) {
        const modal = document.getElementById(modalId);
        if (modal) {
            const modalBody = modal.querySelector('.cb-modal-body');
            if (modalBody) {
                modalBody.innerHTML = content;
            }
        }
    }
}

// Helper function to ensure modal system is ready
window.waitForModalSystem = () => {
    return new Promise((resolve) => {
        if (window.modalSystem) {
            resolve(window.modalSystem);
        } else {
            window.addEventListener('modalSystemReady', () => {
                resolve(window.modalSystem);
            });
        }
    });
};

// Create global instance
window.modalSystem = new ModalSystem(); 
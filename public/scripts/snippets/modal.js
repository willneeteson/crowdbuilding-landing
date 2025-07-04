// Shared modal system
class ModalSystem {
    constructor() {
        // Dispatch event when modal system is ready
        window.dispatchEvent(new Event('modalSystemReady'));
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
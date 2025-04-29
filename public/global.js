/**
 * Global JavaScript Module
 * Handles animations and authentication modal functionality
 */

(function() {
    // Configuration
    const CONFIG = {
        ANIMATION: {
            DURATION: 1,
            DELAY: 0.2,
            STAGGER: 0.2,
            EASE: 'power2.out',
            TRIGGER_OFFSET: '90%'
        },
        MODAL: {
            VIEWS: {
                SIGNUP: 'signup',
                SIGNIN: 'signin'
            }
        }
    };

    /**
     * Initialize GSAP animations for sections
     */
    function initAnimations() {
        gsap.utils.toArray('.section').forEach((section) => {
            const reveals = section.querySelectorAll('.reveal');
            if (!reveals.length) return;

            const staggerTimeline = gsap.timeline({
                scrollTrigger: {
                    trigger: section,
                    start: `top ${CONFIG.ANIMATION.TRIGGER_OFFSET}`,
                    toggleActions: 'play none none reverse',
                }
            });

            staggerTimeline.fromTo(
                reveals,
                {
                    opacity: 0,
                    y: 32
                },
                {
                    opacity: 1,
                    y: 0,
                    duration: CONFIG.ANIMATION.DURATION,
                    ease: CONFIG.ANIMATION.EASE,
                    delay: CONFIG.ANIMATION.DELAY,
                    stagger: CONFIG.ANIMATION.STAGGER
                }
            );
        });
    }

    /**
     * Authentication Modal Module
     */
    const AuthModal = {
        elements: {
            modal: document.getElementById('authModalWrapper'),
            overlay: document.querySelector('.auth__modal-overlay'),
            closeBtn: document.getElementById('authModalClose'),
            tabSignin: document.getElementById('modalTabSignin'),
            tabSignup: document.getElementById('modalTabSignup')
        },

        /**
         * Open the modal with specified view
         * @param {string} view - The view to show ('signup' or 'signin')
         */
        open: function(view = CONFIG.MODAL.VIEWS.SIGNUP) {
            if (!this.elements.modal) {
                console.warn('Auth modal element not found');
                return;
            }

            this.elements.modal.classList.remove('hidden');
            this.elements.modal.setAttribute('aria-hidden', 'false');
            document.body.classList.add('no-scroll');

            if (view === CONFIG.MODAL.VIEWS.SIGNUP && this.elements.tabSignup) {
                this.elements.tabSignup.click();
            } else if (view === CONFIG.MODAL.VIEWS.SIGNIN && this.elements.tabSignin) {
                this.elements.tabSignin.click();
            }
        },

        /**
         * Close the modal
         */
        close: function() {
            if (!this.elements.modal) return;

            this.elements.modal.classList.add('hidden');
            this.elements.modal.setAttribute('aria-hidden', 'true');
            document.body.classList.remove('no-scroll');
        },

        /**
         * Initialize event listeners
         */
        init: function() {
            // Signup triggers
            document.querySelectorAll('.authsignupbtn').forEach(el => {
                el.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.open(CONFIG.MODAL.VIEWS.SIGNUP);
                });
            });

            // Signin triggers
            document.querySelectorAll('.authsigninbtn').forEach(el => {
                el.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.open(CONFIG.MODAL.VIEWS.SIGNIN);
                });
            });

            // Close button
            if (this.elements.closeBtn) {
                this.elements.closeBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    this.close();
                });
            }

            // Overlay click
            if (this.elements.overlay) {
                this.elements.overlay.addEventListener('click', (e) => {
                    if (e.target === this.elements.overlay) this.close();
                });
            }

            // Escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') this.close();
            });
        }
    };

    // Initialize all functionality
    function init() {
        try {
            initAnimations();
            AuthModal.init();
        } catch (error) {
            console.error('Error initializing global functionality:', error);
        }
    }

    // Start the application
    init();
})();
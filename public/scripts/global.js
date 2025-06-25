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
        },
        API: {
            BASE_URL: 'https://api.crowdbuilding.com/api/v1',
            NOTIFICATIONS_ENDPOINT: '/profile/notifications/unread/count'
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
     * Notifications Module
     * Handles fetching and displaying unread notification counts
     */
    const Notifications = {
        elements: {
            container: document.getElementById('navUserNotifications'),
            avatar: document.getElementById('navUserAvatar')
        },

        /**
         * Fetch user profile data including avatar
         * @returns {Promise<Object|null>} User profile data or null if not available
         */
        async fetchUserProfile() {
            try {
                // Check if user is logged in
                if (!window.auth || !(await window.auth.isUserLoggedIn())) {
                    return null;
                }

                // Get API token
                const token = await window.auth.getApiToken();
                if (!token) {
                    console.warn('No API token available for profile request');
                    return null;
                }

                const response = await fetch(
                    `${CONFIG.API.BASE_URL}/profile`,
                    {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Accept': 'application/json',
                            'Content-Type': 'application/json'
                        }
                    }
                );

                if (!response.ok) {
                    console.error('Failed to fetch user profile:', response.status, response.statusText);
                    return null;
                }

                const data = await response.json();
                return data.data || null;

            } catch (error) {
                console.error('Error fetching user profile:', error);
                return null;
            }
        },

        /**
         * Update avatar display
         * @param {Object} profile - User profile data
         */
        updateAvatar(profile) {
            if (!this.elements.avatar) {
                console.warn('Avatar container #navUserAvatar not found');
                return;
            }

            if (profile && profile.avatar_url) {
                // Show avatar with user's image
                this.elements.avatar.style.display = 'block';
                this.elements.avatar.innerHTML = '';
                
                const img = document.createElement('img');
                img.src = profile.avatar_url;
                img.alt = profile.name || 'User Avatar';
                img.style.cssText = `
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    object-fit: cover;
                    border: 2px solid #ffffff;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                `;
                
                this.elements.avatar.appendChild(img);
            } else {
                // Show default avatar or hide
                this.elements.avatar.style.display = 'none';
            }
        },

        /**
         * Fetch unread notifications count from API
         * @returns {Promise<number>} Number of unread notifications
         */
        async fetchUnreadCount() {
            try {
                // Check if user is logged in
                if (!window.auth || !(await window.auth.isUserLoggedIn())) {
                    return 0;
                }

                // Get API token
                const token = await window.auth.getApiToken();
                if (!token) {
                    console.warn('No API token available for notifications request');
                    return 0;
                }

                const response = await fetch(
                    `${CONFIG.API.BASE_URL}${CONFIG.API.NOTIFICATIONS_ENDPOINT}`,
                    {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Accept': 'application/json',
                            'Content-Type': 'application/json'
                        }
                    }
                );

                if (!response.ok) {
                    console.error('Failed to fetch notifications:', response.status, response.statusText);
                    return 0;
                }

                const data = await response.json();
                return data.data || 0;

            } catch (error) {
                console.error('Error fetching unread notifications count:', error);
                return 0;
            }
        },

        /**
         * Update the notification count display
         * @param {number} count - Number of unread notifications
         */
        updateDisplay(count) {
            if (!this.elements.container) {
                console.warn('Notification container #navUserNotifications not found');
                return;
            }

            if (count > 0) {
                // Show the container and create notification badge
                this.elements.container.style.display = 'block';
                this.elements.container.innerHTML = '';
                
                const badge = document.createElement('span');
                badge.className = 'notification-badge';
                badge.textContent = count > 99 ? '99+' : count.toString();
                badge.style.cssText = `
                    background-color: #ff4444;
                    color: white;
                    border-radius: 50%;
                    padding: 2px 6px;
                    font-size: 12px;
                    font-weight: bold;
                    min-width: 18px;
                    text-align: center;
                    display: inline-block;
                    line-height: 1.2;
                `;
                
                this.elements.container.appendChild(badge);
            } else {
                // Hide the container when no notifications
                this.elements.container.style.display = 'none';
            }
        },

        /**
         * Refresh notifications count and avatar
         */
        async refresh() {
            const [count, profile] = await Promise.all([
                this.fetchUnreadCount(),
                this.fetchUserProfile()
            ]);
            
            this.updateDisplay(count);
            this.updateAvatar(profile);
        },

        /**
         * Initialize notifications functionality
         */
        async init() {
            // Initial load
            await this.refresh();

            // Set up periodic refresh (every 30 seconds)
            setInterval(() => {
                this.refresh();
            }, 30000);

            // Refresh on page focus (when user returns to tab)
            document.addEventListener('visibilitychange', () => {
                if (!document.hidden) {
                    this.refresh();
                }
            });
        }
    };

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
    async function init() {
        try {
            initAnimations();
            AuthModal.init();
            
            // Wait for auth module to be available before initializing notifications
            if (typeof window.auth !== 'undefined') {
                await Notifications.init();
            } else {
                // If auth module isn't loaded yet, wait for it
                const checkAuth = setInterval(() => {
                    if (typeof window.auth !== 'undefined') {
                        clearInterval(checkAuth);
                        Notifications.init();
                    }
                }, 100);
            }
        } catch (error) {
            console.error('Error initializing global functionality:', error);
        }
    }

    // Start the application
    init();
})();
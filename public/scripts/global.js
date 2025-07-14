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
     * Tooltips Module
     * Handles tooltip display and positioning
     */
    const Tooltips = {
        tooltip: null,

        /**
         * Initialize tooltip functionality
         */
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

            // Add required CSS
            this.addStyles();
        },

        /**
         * Add tooltip styles to the document
         */
        addStyles() {
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
        },

        handleMouseOver(e) {
            const target = e.target.closest('[data-tooltip]');
            if (target) {
                this.showTooltip(target);
            }
        },

        handleMouseOut(e) {
            const target = e.target.closest('[data-tooltip]');
            if (target && !target.contains(e.relatedTarget)) {
                this.hideTooltip();
            }
        },

        handleFocusIn(e) {
            const target = e.target.closest('[data-tooltip]');
            if (target) {
                this.showTooltip(target);
            }
        },

        handleFocusOut(e) {
            const target = e.target.closest('[data-tooltip]');
            if (target && !target.contains(e.relatedTarget)) {
                this.hideTooltip();
            }
        },

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
        },

        hideTooltip() {
            this.tooltip.style.display = 'none';
        }
    };

    /**
     * Notifications Module
     * Handles fetching and displaying unread notification counts
     */
    const Notifications = {
        elements: {
            container: document.getElementById('navUserNotifications'),
            avatar: document.getElementById('navUserAvatar')
        },

        // Cache for avatar data
        avatarCache: {
            url: null,
            name: null,
            lastUpdated: null
        },

        /**
         * Load avatar from cache
         */
        loadAvatarFromCache() {
            try {
                const cached = localStorage.getItem('userAvatar');
                if (cached) {
                    const data = JSON.parse(cached);
                    this.avatarCache = data;
                    return data;
                }
            } catch (error) {
                console.warn('Error loading avatar from cache:', error);
            }
            return null;
        },

        /**
         * Save avatar to cache
         */
        saveAvatarToCache(profile) {
            try {
                const cacheData = {
                    url: profile.avatar_url,
                    name: profile.name,
                    lastUpdated: Date.now()
                };
                this.avatarCache = cacheData;
                localStorage.setItem('userAvatar', JSON.stringify(cacheData));
            } catch (error) {
                console.warn('Error saving avatar to cache:', error);
            }
        },

        /**
         * Clear avatar cache
         */
        clearAvatarCache() {
            try {
                localStorage.removeItem('userAvatar');
                this.avatarCache = { url: null, name: null, lastUpdated: null };
            } catch (error) {
                console.warn('Error clearing avatar cache:', error);
            }
        },

        /**
         * Fetch user profile data including avatar
         * @returns {Promise<Object|null>} User profile data or null if not available
         */
        async fetchUserProfile() {
            try {
                // Check if user is logged in
                if (!window.auth || !(await window.auth.isUserLoggedIn())) {
                    this.clearAvatarCache();
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
                // Save to cache
                this.saveAvatarToCache(profile);
                
                // Show avatar with user's image
                this.elements.avatar.style.display = 'block';
                
                // Update the existing img element instead of replacing it
                this.elements.avatar.src = profile.avatar_url;
                this.elements.avatar.alt = profile.name || 'User Avatar';
            } else {
                // Hide the avatar when no profile/avatar is available
                this.elements.avatar.style.display = 'none';
                this.clearAvatarCache();
            }
        },

        /**
         * Display cached avatar immediately
         */
        displayCachedAvatar() {
            const cached = this.loadAvatarFromCache();
            if (cached && cached.url) {
                if (this.elements.avatar) {
                    this.elements.avatar.style.display = 'block';
                    this.elements.avatar.src = cached.url;
                    this.elements.avatar.alt = cached.name || 'User Avatar';
                }
                return true;
            }
            return false;
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
                this.elements.container.style.display = 'flex';
                this.elements.container.innerHTML = '';
                
                const badge = document.createElement('span');
                badge.className = 'notification-badge';
                badge.textContent = count > 99 ? '99+' : count.toString();
                
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
            // Display cached avatar immediately
            this.displayCachedAvatar();
            
            // Initial load (background refresh)
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

    /**
     * Mega Menu Module
     * Handles navigation flyout menus
     */
    const MegaMenu = {
        elements: {
            navLinks: null,
            flyouts: null,
            globalNav: null,
            navButtons: null
        },

        state: {
            currentFlyout: null,
            hideTimeout: null,
            isTouchDevice: window.matchMedia('(pointer: coarse)').matches
        },

        /**
         * Show a specific flyout menu
         */
        showFlyout(target) {
            if (this.state.currentFlyout === target) return;

            // If switching between flyouts, animate content only
            if (this.state.currentFlyout) {
                this.switchFlyoutContent(target);
            } else {
                // First time opening - animate the container
                this.elements.flyouts.forEach(f => f.classList.remove('active'));
                target.classList.add('active');
                this.state.currentFlyout = target;
            }
        },

        /**
         * Switch between flyout contents with smooth transitions
         */
        switchFlyoutContent(newFlyout) {
            const currentFlyout = this.state.currentFlyout;
            
            // Mark as switching to disable container animations
            currentFlyout.classList.add('switching');
            newFlyout.classList.add('switching');
            
            // Fade out current groups
            const currentGroups = currentFlyout.querySelectorAll('.global-nav__flyout-group');
            currentGroups.forEach(group => {
                group.classList.add('fade-out');
            });

            // After fade out, switch flyouts (reduced delay)
            setTimeout(() => {
                // Remove old flyout
                currentFlyout.classList.remove('active', 'switching');
                currentGroups.forEach(group => {
                    group.classList.remove('fade-out');
                });
                
                // Show new flyout
                newFlyout.classList.add('active');
                this.state.currentFlyout = newFlyout;

                // Fade in new groups
                const newGroups = newFlyout.querySelectorAll('.global-nav__flyout-group');
                newGroups.forEach(group => {
                    group.classList.remove('fade-out', 'fade-in');
                    group.classList.add('fade-in');
                });

                // Clean up after animation (reduced delay)
                setTimeout(() => {
                    newFlyout.classList.remove('switching');
                    newGroups.forEach(group => {
                        group.classList.remove('fade-in');
                    });
                }, 300);
            }, 300);
        },

        /**
         * Hide all flyout menus
         */
        hideAllFlyouts() {
            this.elements.flyouts.forEach(f => {
                f.classList.remove('active', 'switching');
                const groups = f.querySelectorAll('.global-nav__flyout-group');
                groups.forEach(group => {
                    group.classList.remove('fade-out', 'fade-in');
                });
            });
            this.state.currentFlyout = null;
        },

        /**
         * Handle touch device interactions
         */
        handleTouchInteraction(link, flyout) {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                if (this.state.currentFlyout === flyout) {
                    this.hideAllFlyouts();
                } else {
                    this.showFlyout(flyout);
                }
            });
        },

        /**
         * Handle desktop hover interactions
         */
        handleDesktopInteraction(link, flyout) {
            link.addEventListener('mouseenter', () => {
                clearTimeout(this.state.hideTimeout);
                this.showFlyout(flyout);
            });

            link.addEventListener('mouseleave', () => {
                this.state.hideTimeout = setTimeout(() => {
                    this.hideAllFlyouts();
                }, 300);
            });

            flyout.addEventListener('mouseenter', () => {
                clearTimeout(this.state.hideTimeout);
            });

            flyout.addEventListener('mouseleave', () => {
                this.state.hideTimeout = setTimeout(() => {
                    this.hideAllFlyouts();
                }, 300);
            });
        },

        /**
         * Handle navigation button clicks
         */
        handleNavButtons() {
            this.elements.navButtons.forEach(button => {
                button.addEventListener('click', () => {
                    const action = button.dataset.navBtn;
                    if (action === 'close' || action === 'back') {
                        this.hideAllFlyouts();
                        if (action === 'close') {
                            this.elements.globalNav?.classList.remove('open');
                        }
                    }
                });
            });
        },

        /**
         * Initialize mega menu functionality
         */
        init() {
            // Cache DOM elements
            this.elements.navLinks = document.querySelectorAll('[data-flyout]');
            this.elements.flyouts = document.querySelectorAll('.gobal-nav__flyout');
            this.elements.globalNav = document.querySelector('.global-nav');
            this.elements.navButtons = document.querySelectorAll('[data-nav-btn]');

            // Set up navigation link interactions
            this.elements.navLinks.forEach(link => {
                const flyoutId = link.dataset.flyout;
                const flyout = document.querySelector(`.gobal-nav__flyout[data-flyout-id="${flyoutId}"]`);

                if (!flyout) return;

                if (this.state.isTouchDevice) {
                    this.handleTouchInteraction(link, flyout);
                } else {
                    this.handleDesktopInteraction(link, flyout);
                }
            });

            // Set up navigation buttons
            this.handleNavButtons();
        }
    };

    // Initialize all functionality
    async function init() {
        try {
            initAnimations();
            AuthModal.init();
            Tooltips.init();
            MegaMenu.init();
            
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
/**
 * Profile Page Module
 * Handles user profile data fetching and display
 */
(function () {
    'use strict';
    
    // Configuration
    const CONFIG = {
        API_BASE_URL: 'https://api.crowdbuilding.com/api/v1',
        CHAT_BASE_URL: 'https://comms.crowdbuilding.com/direct/create',
        DEFAULT_AVATAR: 'https://cdn.prod.website-files.com/66dffceb975388322f140196/6810dfceaa06e55034a48587_cb_placeholder-avatar.svg',
        DEFAULT_MESSAGES: {
            NO_BIO: 'Geen bio beschikbaar.',
            NO_INTERESTS: 'Geen interesses',
            NO_REGIONS: 'Geen regio\'s gevonden.',
            NO_HOUSING_TYPE: 'Onbekend',
            NO_OWNERSHIP: 'Niet opgegeven',
            NO_REGION_AREA: 'Geen regio gebied opgegeven',
            LOAD_ERROR: 'Kon gebruiker niet laden.',
            NO_MEMBERSTACK_ID: 'Geen memberstack ID'
        },
        SELECTORS: {
            AVATAR: '.profile-avatar',
            NAME: '.profile-name',
            BIO: '.profile-bio',
            HOUSING_TYPE: '.profile-housing-type',
            OWNERSHIP: '.profile-ownership',
            INTERESTS: '.profile-interests',
            REGIONS_LIST: '.regions__list',
            REGION_AREA: '.profile-region-area',
            HOUSING_FORMS: '.housingForms__list',
            USER_PROFILE: '#user-profile',
            MEMBERSTACK_ID: '.profile-memberstack-id',
            CHAT_LINK: '.profile__chat-btn',
            CURRENT_USER: '#currentUser'
        },
        CACHE_TTL: 5 * 60 * 1000, // 5 minutes cache for user data
        API_TIMEOUT: 8000, // 8 seconds timeout for API requests
        RETRY_DELAY: 500,
        RETRY_ATTEMPTS: 2 // Number of retry attempts for API calls
    };

    // Cache for DOM elements and user data
    const cache = {
        elements: new Map(),
        userData: new Map(),
        set: function(userId, data) {
            this.userData.set(userId, {
                data: data,
                timestamp: Date.now()
            });
        },
        get: function(userId) {
            const cached = this.userData.get(userId);
            if (!cached) return null;
            
            // Check if cache is still valid
            if (Date.now() - cached.timestamp > CONFIG.CACHE_TTL) {
                this.userData.delete(userId);
                return null;
            }
            
            return cached.data;
        },
        getElement: function(selector) {
            if (!this.elements.has(selector)) {
                this.elements.set(selector, document.querySelector(selector));
            }
            return this.elements.get(selector);
        },
        clear: function() {
            this.elements.clear();
            this.userData.clear();
        }
    };

    /**
     * Gets user ID from URL query parameters
     * @returns {string|null} User ID or null if not found
     */
    function getUserIdFromUrl() {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get('id');
    }

    /**
     * Makes a fetch request with timeout and retry logic
     * @param {string} url - URL to fetch
     * @param {Object} options - Fetch options
     * @returns {Promise<Response>} Fetch response
     */
    async function fetchWithTimeout(url, options = {}) {
        let attempts = 0;
        
        const execute = async () => {
            attempts++;
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), CONFIG.API_TIMEOUT);
            
            try {
                const response = await fetch(url, {
                    ...options,
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                return response;
            } catch (error) {
                clearTimeout(timeoutId);
                
                if (error.name === 'AbortError') {
                    throw new Error('Request timeout');
                }
                
                if (attempts <= CONFIG.RETRY_ATTEMPTS) {
                    // Wait before retry
                    await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY));
                    return execute();
                }
                
                throw error;
            }
        };
        
        return execute();
    }

    /**
     * Updates a DOM element with content and removes shimmer effect
     * @param {string} selector - Class selector of the element to update
     * @param {string} content - Content to set
     * @param {string} [property='textContent'] - Property to update
     * @returns {Promise<boolean>} Whether the update was successful
     */
    async function updateElement(selector, content, property = 'textContent') {
        const element = cache.getElement(selector);
        
        if (!element) {
            return false;
        }

        try {
            if (selector === CONFIG.SELECTORS.AVATAR) {
                await updateAvatar(element, content);
            } else {
                element[property] = content;
                element.classList.remove("shimmer");
            }
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * Updates avatar image with preloading
     * @param {HTMLImageElement} element - Avatar image element
     * @param {string} content - Image URL
     * @returns {Promise<void>}
     */
    function updateAvatar(element, content) {
        return new Promise((resolve) => {
            const img = new Image();
            
            img.onload = () => {
                element.src = content;
                element.classList.remove("shimmer-shimmer--circle");
                element.loading = "eager";
                resolve();
            };
            
            img.onerror = () => {
                element.src = CONFIG.DEFAULT_AVATAR;
                element.classList.remove("shimmer-shimmer--circle");
                resolve();
            };
            
            img.src = content;
        });
    }

    /**
     * Creates DOM fragment for performance
     * @param {Array} items - Array of items
     * @param {Function} renderFn - Function to render each item
     * @returns {DocumentFragment} Document fragment
     */
    function createFragment(items, renderFn) {
        const fragment = document.createDocumentFragment();
        if (Array.isArray(items) && items.length > 0) {
            items.forEach(item => {
                const element = renderFn(item);
                if (element) {
                    fragment.appendChild(element);
                }
            });
        }
        return fragment;
    }

    /**
     * Renders user interests
     * @param {Array} interests - Array of interest objects
     * @param {HTMLElement} container - Container element
     */
    function renderInterests(interests, container) {
        if (!container) return;

        try {
            if (!interests?.length) {
                container.textContent = CONFIG.DEFAULT_MESSAGES.NO_INTERESTS;
                return;
            }

            const ul = document.createElement('ul');
            const fragment = createFragment(interests, interest => {
                const li = document.createElement('li');
                li.textContent = typeof interest === 'object' ? interest.name : interest;
                return li;
            });
            
            ul.appendChild(fragment);
            container.innerHTML = '';
            container.appendChild(ul);
            container.classList.remove("shimmer");
        } catch (error) {
            container.textContent = CONFIG.DEFAULT_MESSAGES.NO_INTERESTS;
        }
    }

    /**
     * Renders regions
     * @param {Array} regions - Array of region objects
     * @param {HTMLElement} container - Container element
     */
    function renderRegions(regions, container) {
        if (!container) return;

        try {
            if (!regions?.length) {
                container.textContent = CONFIG.DEFAULT_MESSAGES.NO_REGIONS;
                return;
            }

            const fragment = createFragment(regions, region => {
                const div = document.createElement('div');
                div.className = 'region-item';
                const p = document.createElement('p');
                p.textContent = region.name;
                div.appendChild(p);
                return div;
            });
            
            container.innerHTML = '';
            container.appendChild(fragment);
            container.classList.remove("shimmer");
        } catch (error) {
            container.textContent = CONFIG.DEFAULT_MESSAGES.NO_REGIONS;
        }
    }

    /**
     * Renders region area
     * @param {Object} regionArea - Region area object
     * @param {HTMLElement} container - Container element
     */
    function renderRegionArea(regionArea, container) {
        if (!container) return;

        try {
            container.textContent = regionArea?.name || CONFIG.DEFAULT_MESSAGES.NO_REGION_AREA;
            container.classList.remove("shimmer");
        } catch (error) {
            container.textContent = CONFIG.DEFAULT_MESSAGES.NO_REGION_AREA;
        }
    }

    /**
     * Renders housing forms
     * @param {Array} housingForms - Array of housing form objects
     * @param {HTMLElement} container - Container element
     */
    function renderHousingForms(housingForms, container) {
        if (!container) return;

        try {
            if (!housingForms?.length) {
                container.textContent = CONFIG.DEFAULT_MESSAGES.NO_HOUSING_TYPE;
                return;
            }

            const ul = document.createElement('ul');
            const fragment = createFragment(housingForms, form => {
                if (!form?.title || !form?.id) return null;
                
                const li = document.createElement('li');
                const a = document.createElement('a');
                a.href = `/woonvormen/${form.id}`;
                a.textContent = form.title;
                li.appendChild(a);
                return li;
            });
            
            ul.appendChild(fragment);
            
            if (!ul.children.length) {
                container.textContent = CONFIG.DEFAULT_MESSAGES.NO_HOUSING_TYPE;
            } else {
                container.innerHTML = '';
                container.appendChild(ul);
                container.classList.remove("shimmer");
            }
        } catch (error) {
            container.textContent = CONFIG.DEFAULT_MESSAGES.NO_HOUSING_TYPE;
        }
    }

    /**
     * Creates a chat link from memberstack_id
     * @param {string} memberstackId - The memberstack ID
     * @returns {string} The formatted chat link
     */
    function createChatLink(memberstackId) {
        if (!memberstackId) return '';
        return `${CONFIG.CHAT_BASE_URL}?userId=@${memberstackId}:chat.crowdbuilding.com&isDirect=true`;
    }

    /**
     * Updates chat link element
     * @param {string} memberstackId - The memberstack ID
     */
    function updateChatLink(memberstackId) {
        const chatLinkElement = cache.getElement(CONFIG.SELECTORS.CHAT_LINK);
        if (!chatLinkElement) return;

        const chatLink = createChatLink(memberstackId);
        if (chatLink) {
            chatLinkElement.href = chatLink;
            chatLinkElement.style.display = 'block';
        } else {
            chatLinkElement.style.display = 'none';
        }
    }

    /**
     * Fetches and displays user details
     * @param {string|null} apiToken - API token for authentication
     */
    async function fetchUserDetails(apiToken = null) {
        const userId = getUserIdFromUrl();
        if (!userId) {
            const userProfile = cache.getElement(CONFIG.SELECTORS.USER_PROFILE);
            if (userProfile) {
                userProfile.innerHTML = `<p style="color: red;">${CONFIG.DEFAULT_MESSAGES.LOAD_ERROR}</p>`;
            }
            return;
        }

        // Check if we have cached data
        const cachedData = cache.get(userId);
        if (cachedData) {
            displayUserData(cachedData);
            return;
        }

        try {
            const headers = apiToken ? { Authorization: `Bearer ${apiToken}` } : {};
            const response = await fetchWithTimeout(`${CONFIG.API_BASE_URL}/users/${userId}`, { headers });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const { data } = await response.json();
            
            // Cache the user data
            cache.set(userId, data);
            
            // Display the user data
            displayUserData(data);

        } catch (error) {
            const userProfile = cache.getElement(CONFIG.SELECTORS.USER_PROFILE);
            if (userProfile) {
                userProfile.innerHTML = `<p style="color: red;">${CONFIG.DEFAULT_MESSAGES.LOAD_ERROR}</p>`;
            }
        }
    }

    /**
     * Prefetch and cache API token for faster response
     */
    function prefetchApiToken() {
        // Check if auth module is available
        if (typeof window.auth === 'undefined') {
            console.warn('Auth module not loaded, skipping token prefetch');
            return null;
        }
        
        // Non-blocking token fetch
        return window.auth.getApiToken().catch(() => {});
    }

    /**
     * Gets API token - fallback implementation if auth module is not available
     * @returns {Promise<string|null>} API token or null if not available
     */
    async function getApiTokenFallback() {
        // First try to use auth module if available
        if (typeof window.auth !== 'undefined') {
            return window.auth.getApiToken();
        }
        
        // Fallback implementation
        if (typeof $memberstackDom === "undefined") {
            return null;
        }

        try {
            await $memberstackDom.onReady;
            const memberstackToken = $memberstackDom.getMemberCookie();

            if (!memberstackToken) {
                return null;
            }

            const response = await fetchWithTimeout(`${CONFIG.API_BASE_URL}/sanctum/token`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    memberstack_token: memberstackToken,
                    device_name: "default_device_name",
                }),
            });

            if (!response.ok) {
                throw new Error(`Token request failed: ${response.status}`);
            }

            const data = await response.json();
            return data.token;
        } catch (error) {
            return null;
        }
    }

    /**
     * Gets current user's memberstack ID - fallback implementation
     * @returns {Promise<string|null>} Memberstack ID or null if not available
     */
    async function getCurrentMemberstackIdFallback() {
        // First try to use auth module if available
        if (typeof window.auth !== 'undefined') {
            return window.auth.getCurrentMemberstackId();
        }
        
        // Fallback implementation
        if (typeof $memberstackDom === "undefined") {
            return null;
        }

        try {
            await $memberstackDom.onReady;
            const member = await $memberstackDom.getCurrentMember();
            return member?.id || null;
        } catch (error) {
            return null;
        }
    }

    /**
     * Displays user data in the DOM
     * @param {Object} data - User data
     */
    async function displayUserData(data) {
        try {
            // Batch DOM updates using Promise.all for better performance
            await Promise.all([
                updateElement(CONFIG.SELECTORS.AVATAR, data.avatar_url || CONFIG.DEFAULT_AVATAR, 'src'),
                updateElement(CONFIG.SELECTORS.NAME, data.name || `${data.first_name} ${data.last_name}`),
                updateElement(CONFIG.SELECTORS.BIO, data.bio || CONFIG.DEFAULT_MESSAGES.NO_BIO),
                updateElement(CONFIG.SELECTORS.HOUSING_TYPE, data.housing_form_type?.name || CONFIG.DEFAULT_MESSAGES.NO_HOUSING_TYPE),
                updateElement(CONFIG.SELECTORS.OWNERSHIP, data.ownership_situation?.name || CONFIG.DEFAULT_MESSAGES.NO_OWNERSHIP),
                updateElement(CONFIG.SELECTORS.MEMBERSTACK_ID, data.memberstack_id || CONFIG.DEFAULT_MESSAGES.NO_MEMBERSTACK_ID)
            ]);

            // Update complex components with requestAnimationFrame for smoother rendering
            window.requestAnimationFrame(() => {
                // Check if this is the current user's profile (non-blocking)
                getCurrentMemberstackIdFallback().then(currentMemberstackId => {
                    const currentUserDiv = cache.getElement(CONFIG.SELECTORS.CURRENT_USER);
                    if (currentUserDiv) {
                        currentUserDiv.style.display = currentMemberstackId === data.memberstack_id ? 'block' : 'none';
                    }
                });

                // Update chat link if memberstack_id is available
                if (data.memberstack_id) {
                    updateChatLink(data.memberstack_id);
                }

                // Render complex components
                const interestsContainer = cache.getElement(CONFIG.SELECTORS.INTERESTS);
                if (interestsContainer) {
                    renderInterests(data.interests, interestsContainer);
                }

                const regionsContainer = cache.getElement(CONFIG.SELECTORS.REGIONS_LIST);
                if (regionsContainer) {
                    renderRegions(data.regions, regionsContainer);
                }

                const regionAreaContainer = cache.getElement(CONFIG.SELECTORS.REGION_AREA);
                if (regionAreaContainer) {
                    renderRegionArea(data.region_area, regionAreaContainer);
                }

                const housingFormsContainer = cache.getElement(CONFIG.SELECTORS.HOUSING_FORMS);
                if (housingFormsContainer) {
                    renderHousingForms(data.housing_forms || [], housingFormsContainer);
                }
            });
        } catch (error) {
            const userProfile = cache.getElement(CONFIG.SELECTORS.USER_PROFILE);
            if (userProfile) {
                userProfile.innerHTML = `<p style="color: red;">${CONFIG.DEFAULT_MESSAGES.LOAD_ERROR}</p>`;
            }
        }
    }

    /**
     * Initialize the profile page
     */
    async function init() {
        try {
            // Prefetch API token in parallel
            const apiTokenPromise = getApiTokenFallback();
            
            // Start preloading avatar image
            const avatarElement = cache.getElement(CONFIG.SELECTORS.AVATAR);
            if (avatarElement && avatarElement.dataset.src) {
                avatarElement.src = avatarElement.dataset.src;
            }
            
            // Wait for API token
            const apiToken = await apiTokenPromise;
            
            // Fetch user details
            await fetchUserDetails(apiToken);
        } catch (error) {
            const userProfile = cache.getElement(CONFIG.SELECTORS.USER_PROFILE);
            if (userProfile) {
                userProfile.innerHTML = `<p style="color: red;">${CONFIG.DEFAULT_MESSAGES.LOAD_ERROR}</p>`;
            }
        }
    }

    // Only prefetch if auth module is available
    if (typeof window.auth !== 'undefined') {
        prefetchApiToken();
    }

    // Wait for DOM to be fully loaded before initializing
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        // Document already loaded, initialize immediately
        init();
    }
})();

/**
 * Profile Page Module
 * Handles user profile data fetching and display
 */
(function () {
    'use strict';
    
    // Configuration
    const CONFIG = {
        API_BASE_URL: 'https://api.crowdbuilding.com/api/v1',
        DEFAULT_AVATAR: 'https://cdn.prod.website-files.com/66dffceb975388322f140196/6810dfceaa06e55034a48587_cb_placeholder-avatar.svg',
        DEFAULT_MESSAGES: {
            NO_BIO: 'Geen bio beschikbaar.',
            NO_INTERESTS: 'Geen interesses',
            NO_REGIONS: 'Geen regio\'s gevonden.',
            NO_HOUSING_TYPE: 'Onbekend',
            NO_OWNERSHIP: 'Niet opgegeven',
            NO_REGION_AREA: 'Geen regio gebied opgegeven',
            LOAD_ERROR: 'Kon gebruiker niet laden.'
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
            USER_PROFILE: '#user-profile'
        },
        RETRY_DELAY: 500,
        INIT_DELAY: 1000
    };

    // Cache DOM elements
    const domCache = {
        elements: new Map(),
        get: function(selector) {
            if (!this.elements.has(selector)) {
                this.elements.set(selector, document.querySelector(selector));
            }
            return this.elements.get(selector);
        },
        clear: function() {
            this.elements.clear();
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
     * Fetches API token using Memberstack
     * @returns {Promise<string|null>} API token or null if not available
     */
    async function getApiToken() {
        if (typeof $memberstackDom === "undefined") {
            console.warn('Memberstack not available');
            return null;
        }

        try {
            await $memberstackDom.onReady;
            const memberstackToken = $memberstackDom.getMemberCookie();

            if (!memberstackToken) {
                console.warn('No Memberstack token found');
                return null;
            }

            const response = await fetch(`${CONFIG.API_BASE_URL}/sanctum/token`, {
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
            console.error("Error fetching token:", error);
            return null;
        }
    }

    /**
     * Updates a DOM element with content and removes shimmer effect
     * @param {string} selector - Class selector of the element to update
     * @param {string} content - Content to set
     * @param {string} [property='textContent'] - Property to update
     * @returns {Promise<boolean>} Whether the update was successful
     */
    async function updateElement(selector, content, property = 'textContent') {
        const element = domCache.get(selector);
        
        if (!element) {
            console.warn(`Element not found: ${selector}`);
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
            console.error(`Error updating element ${selector}:`, error);
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
        return new Promise((resolve, reject) => {
            const img = new Image();
            
            img.onload = () => {
                element.src = content;
                element.classList.remove("shimmer-shimmer--circle");
                element.loading = "eager";
                resolve();
            };
            
            img.onerror = () => {
                console.error('Failed to load avatar image, using default');
                element.src = CONFIG.DEFAULT_AVATAR;
                element.classList.remove("shimmer-shimmer--circle");
                resolve();
            };
            
            img.src = content;
        });
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

            const interestsList = interests
                .map(interest => `<li>${typeof interest === 'object' ? interest.name : interest}</li>`)
                .join('');

            container.innerHTML = `<ul>${interestsList}</ul>`;
            container.classList.remove("shimmer");
        } catch (error) {
            console.error('Error rendering interests:', error);
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

            container.innerHTML = regions
                .map(region => `<div class="region-item"><p>${region.name}</p></div>`)
                .join('');
            container.classList.remove("shimmer");
        } catch (error) {
            console.error('Error rendering regions:', error);
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
            console.error('Error rendering region area:', error);
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

            container.innerHTML = housingForms
                .map(form => `
                    <div class="housing-form">
                        <h3>${form.title}</h3>
                        ${form.subtitle ? `<p class="subtitle">${form.subtitle}</p>` : ''}
                        ${form.intro ? `<div class="intro">${form.intro}</div>` : ''}
                    </div>
                `)
                .join('');
            container.classList.remove("shimmer");
        } catch (error) {
            console.error('Error rendering housing forms:', error);
            container.textContent = CONFIG.DEFAULT_MESSAGES.NO_HOUSING_TYPE;
        }
    }

    /**
     * Fetches and displays user details
     * @param {string|null} apiToken - API token for authentication
     */
    async function fetchUserDetails(apiToken = null) {
        const userId = getUserIdFromUrl();
        if (!userId) {
            console.error('No user ID found in URL');
            const userProfile = domCache.get(CONFIG.SELECTORS.USER_PROFILE);
            if (userProfile) {
                userProfile.innerHTML = `<p style="color: red;">${CONFIG.DEFAULT_MESSAGES.LOAD_ERROR}</p>`;
            }
            return;
        }

        try {
            const headers = apiToken ? { Authorization: `Bearer ${apiToken}` } : {};
            const response = await fetch(`${CONFIG.API_BASE_URL}/users/${userId}`, { headers });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const { data } = await response.json();

            // Update basic profile information
            await Promise.all([
                updateElement(CONFIG.SELECTORS.AVATAR, data.avatar_url || CONFIG.DEFAULT_AVATAR, 'src'),
                updateElement(CONFIG.SELECTORS.NAME, data.name || `${data.first_name} ${data.last_name}`),
                updateElement(CONFIG.SELECTORS.BIO, data.bio || CONFIG.DEFAULT_MESSAGES.NO_BIO),
                updateElement(CONFIG.SELECTORS.HOUSING_TYPE, data.housing_form_type?.name || CONFIG.DEFAULT_MESSAGES.NO_HOUSING_TYPE),
                updateElement(CONFIG.SELECTORS.OWNERSHIP, data.ownership_situation?.name || CONFIG.DEFAULT_MESSAGES.NO_OWNERSHIP)
            ]);

            // Render complex components
            const interestsContainer = domCache.get(CONFIG.SELECTORS.INTERESTS);
            if (interestsContainer) {
                renderInterests(data.interests, interestsContainer);
            }

            const regionsContainer = domCache.get(CONFIG.SELECTORS.REGIONS_LIST);
            if (regionsContainer) {
                renderRegions(data.regions, regionsContainer);
            }

            const regionAreaContainer = domCache.get(CONFIG.SELECTORS.REGION_AREA);
            if (regionAreaContainer) {
                renderRegionArea(data.region_area, regionAreaContainer);
            }

            const housingFormsContainer = domCache.get(CONFIG.SELECTORS.HOUSING_FORMS);
            if (housingFormsContainer) {
                renderHousingForms(
                    data.housing_form_type?.housing_forms || [],
                    housingFormsContainer
                );
            }

        } catch (error) {
            console.error("Error loading user:", error);
            const userProfile = domCache.get(CONFIG.SELECTORS.USER_PROFILE);
            if (userProfile) {
                userProfile.innerHTML = `<p style="color: red;">${CONFIG.DEFAULT_MESSAGES.LOAD_ERROR}</p>`;
            }
        }
    }

    /**
     * Initialize the profile page
     */
    async function init() {
        console.log('Initializing profile page...');
        
        // Wait for DOM to be fully ready
        await new Promise(resolve => setTimeout(resolve, CONFIG.INIT_DELAY));
        
        try {
            const apiToken = await getApiToken();
            await fetchUserDetails(apiToken);
        } catch (error) {
            console.error("Initialization error:", error);
        }
    }

    // Wait for DOM to be fully loaded before initializing
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        setTimeout(init, CONFIG.INIT_DELAY);
    }
})();

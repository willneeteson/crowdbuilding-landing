/**
 * Profile Page Module
 * Handles user profile data fetching and display
 */
(function () {
    console.log('Profile script starting...');
    
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
            AVATAR: '#avatar',
            NAME: '#name',
            BIO: '#bio',
            HOUSING_TYPE: '#housingTypeName',
            OWNERSHIP: '#ownership',
            INTERESTS: '#interests',
            REGIONS_LIST: '.regions__list',
            REGION_AREA: '#regionArea',
            HOUSING_FORMS: '#housingForms .housingForms__list',
            USER_PROFILE: '#user-profile'
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
     * @param {string} elementId - ID of the element to update
     * @param {string} content - Content to set
     * @param {string} [property='textContent'] - Property to update
     * @returns {boolean} Whether the update was successful
     */
    function updateElement(elementId, content, property = 'textContent') {
        console.log(`Attempting to update element: ${elementId}`);
        // Try to find the element in the main document
        let element = document.getElementById(elementId);
        
        // If not found in main document, try to find it in any iframes
        if (!element) {
            const iframes = document.getElementsByTagName('iframe');
            for (let iframe of iframes) {
                try {
                    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                    element = iframeDoc.getElementById(elementId);
                    if (element) break;
                } catch (e) {
                    console.warn('Could not access iframe content:', e);
                }
            }
        }

        if (!element) {
            console.warn(`Element not found: ${elementId}`);
            // Log all elements with IDs for debugging
            const allElements = Array.from(document.querySelectorAll('[id]')).map(el => el.id);
            console.log('Available elements with IDs:', allElements);
            return false;
        }

        element[property] = content;
        element.classList.remove("shimmer");
        return true;
    }

    /**
     * Renders user interests
     * @param {Array} interests - Array of interest objects
     * @param {HTMLElement} container - Container element
     */
    function renderInterests(interests, container) {
        if (!container) {
            console.warn('Interests container not found');
            return;
        }

        if (!interests || !Array.isArray(interests) || interests.length === 0) {
            container.textContent = CONFIG.DEFAULT_MESSAGES.NO_INTERESTS;
            return;
        }

        try {
            const interestsList = interests.map(interest => {
                const interestName = typeof interest === 'object' ? interest.name : interest;
                return `<li>${interestName}</li>`;
            }).join('');

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
        if (!container) {
            console.warn('Regions container not found');
            return;
        }

        if (!regions || !Array.isArray(regions) || regions.length === 0) {
            container.textContent = CONFIG.DEFAULT_MESSAGES.NO_REGIONS;
            return;
        }

        try {
            container.innerHTML = regions.map(region => 
                `<div class="region-item"><p>${region.name}</p></div>`
            ).join('');
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
        if (!container) {
            console.warn('Region area container not found');
            return;
        }

        if (!regionArea || !regionArea.name) {
            container.textContent = CONFIG.DEFAULT_MESSAGES.NO_REGION_AREA;
            return;
        }

        try {
            container.textContent = regionArea.name;
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
        if (!container) {
            console.warn('Housing forms container not found');
            return;
        }

        if (!housingForms || !Array.isArray(housingForms) || housingForms.length === 0) {
            container.textContent = CONFIG.DEFAULT_MESSAGES.NO_HOUSING_TYPE;
            return;
        }

        try {
            container.innerHTML = housingForms.map(form => `
                <div class="housing-form">
                    <h3>${form.title}</h3>
                    ${form.subtitle ? `<p class="subtitle">${form.subtitle}</p>` : ''}
                    ${form.intro ? `<div class="intro">${form.intro}</div>` : ''}
                </div>
            `).join('');
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
            const userProfile = document.querySelector(CONFIG.SELECTORS.USER_PROFILE);
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
            updateElement(CONFIG.SELECTORS.AVATAR, data.avatar_url || CONFIG.DEFAULT_AVATAR, 'src');
            updateElement(CONFIG.SELECTORS.NAME, data.name || `${data.first_name} ${data.last_name}`);
            updateElement(CONFIG.SELECTORS.BIO, data.bio || CONFIG.DEFAULT_MESSAGES.NO_BIO);
            updateElement(CONFIG.SELECTORS.HOUSING_TYPE, data.housing_form_type?.name || CONFIG.DEFAULT_MESSAGES.NO_HOUSING_TYPE);
            updateElement(CONFIG.SELECTORS.OWNERSHIP, data.ownership_situation?.name || CONFIG.DEFAULT_MESSAGES.NO_OWNERSHIP);

            // Render complex components
            const interestsContainer = document.querySelector(CONFIG.SELECTORS.INTERESTS);
            if (interestsContainer) {
                renderInterests(data.interests, interestsContainer);
            }

            const regionsContainer = document.querySelector(CONFIG.SELECTORS.REGIONS_LIST);
            if (regionsContainer) {
                renderRegions(data.regions, regionsContainer);
            }

            const regionAreaContainer = document.querySelector(CONFIG.SELECTORS.REGION_AREA);
            if (regionAreaContainer) {
                renderRegionArea(data.region_area, regionAreaContainer);
            }

            const housingFormsContainer = document.querySelector(CONFIG.SELECTORS.HOUSING_FORMS);
            if (housingFormsContainer) {
                renderHousingForms(
                    data.housing_form_type?.housing_forms || [],
                    housingFormsContainer
                );
            }

        } catch (error) {
            console.error("Error loading user:", error);
            const userProfile = document.querySelector(CONFIG.SELECTORS.USER_PROFILE);
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
        console.log('Document ready state:', document.readyState);
        console.log('User profile element exists:', !!document.querySelector(CONFIG.SELECTORS.USER_PROFILE));
        
        try {
            const apiToken = await getApiToken();
            await fetchUserDetails(apiToken);
        } catch (error) {
            console.error("Initialization error:", error);
        }
    }

    // Wait for DOM to be fully loaded before initializing
    if (document.readyState === 'loading') {
        console.log('Document still loading, waiting for DOMContentLoaded...');
        document.addEventListener('DOMContentLoaded', init);
    } else {
        console.log('Document already loaded, initializing immediately...');
        // Add a small delay to ensure all scripts are loaded
        setTimeout(init, 100);
    }
})();

/**
 * Profile Page Module
 * Handles user profile data fetching and display
 */
(function () {
    // Configuration
    const CONFIG = {
        API_BASE_URL: 'https://api.crowdbuilding.com/api/v1',
        DEFAULT_AVATAR: 'https://via.placeholder.com/150',
        DEFAULT_MESSAGES: {
            NO_BIO: 'Geen bio beschikbaar.',
            NO_INTERESTS: 'Geen interesses',
            NO_REGIONS: 'Geen regio\'s gevonden.',
            NO_HOUSING_TYPE: 'Onbekend',
            NO_OWNERSHIP: 'Niet opgegeven',
            LOAD_ERROR: 'Kon gebruiker niet laden.'
        }
    };

    // User ID - Should be dynamically set
    const USER_ID = "9ea31097-018a-4f09-afcb-d5eb34ae81f9";

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
     */
    function updateElement(elementId, content, property = 'textContent') {
        const element = document.getElementById(elementId);
        if (!element) {
            console.warn(`Element not found: ${elementId}`);
            return;
        }
        element[property] = content;
        element.classList.remove("shimmer");
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

        console.log('Rendering interests:', interests); // Debug log

        if (!interests) {
            console.warn('No interests data provided');
            container.textContent = CONFIG.DEFAULT_MESSAGES.NO_INTERESTS;
            return;
        }

        if (!Array.isArray(interests)) {
            console.warn('Interests is not an array:', interests);
            container.textContent = CONFIG.DEFAULT_MESSAGES.NO_INTERESTS;
            return;
        }

        if (interests.length === 0) {
            console.log('Interests array is empty');
            container.textContent = CONFIG.DEFAULT_MESSAGES.NO_INTERESTS;
            return;
        }

        try {
            const interestsList = interests.map(interest => {
                // Handle both object and string formats
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
        container.innerHTML = "";
        
        if (!Array.isArray(regions) || regions.length === 0) {
            container.textContent = CONFIG.DEFAULT_MESSAGES.NO_REGIONS;
            return;
        }

        regions.forEach(region => {
            const el = document.createElement("div");
            el.classList.add("region-item");
            el.innerHTML = `<p>${region.name}</p>`;
            container.appendChild(el);
        });
    }

    /**
     * Renders housing forms and groups
     * @param {Array} housingForms - Array of housing form objects
     * @param {HTMLElement} container - Container element
     */
    function renderHousingForms(housingForms, container) {
        container.innerHTML = "";
        
        if (!Array.isArray(housingForms) || housingForms.length === 0) {
            container.textContent = CONFIG.DEFAULT_MESSAGES.NO_HOUSING_TYPE;
            return;
        }

        housingForms.forEach(form => {
            const wrapper = document.createElement("div");
            wrapper.classList.add("housing-form");
            wrapper.innerHTML = `<h3>${form.title}</h3>`;

            if (Array.isArray(form.groups) && form.groups.length > 0) {
                const groupList = document.createElement("div");
                groupList.classList.add("group-list");

                form.groups.forEach(group => {
                    const groupItem = document.createElement("div");
                    groupItem.classList.add("group-item");
                    groupItem.innerHTML = `
                        <strong>${group.title}</strong><br />
                        <small>${group.subtitle || ""}</small>
                        <p>${group.intro || ""}</p>
                    `;
                    groupList.appendChild(groupItem);
                });

                wrapper.appendChild(groupList);
            }

            container.appendChild(wrapper);
        });
    }

    /**
     * Fetches and displays user details
     * @param {string|null} apiToken - API token for authentication
     */
    async function fetchUserDetails(apiToken = null) {
        try {
            const headers = apiToken ? { Authorization: `Bearer ${apiToken}` } : {};
            const response = await fetch(`${CONFIG.API_BASE_URL}/users/${USER_ID}`, { headers });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const { data } = await response.json();
            console.log('Received user data:', data); // Debug log

            // Update basic profile information
            updateElement("avatar", data.avatar_url || CONFIG.DEFAULT_AVATAR, 'src');
            updateElement("name", data.name || `${data.first_name} ${data.last_name}`);
            updateElement("bio", data.bio || CONFIG.DEFAULT_MESSAGES.NO_BIO);
            updateElement("housingTypeName", data.housing_form_type?.name || CONFIG.DEFAULT_MESSAGES.NO_HOUSING_TYPE);
            updateElement("ownership", data.ownership_situation?.name || CONFIG.DEFAULT_MESSAGES.NO_OWNERSHIP);

            // Render complex components
            const interestsContainer = document.getElementById("interests");
            if (interestsContainer) {
                renderInterests(data.interests, interestsContainer);
            } else {
                console.warn('Interests container not found in DOM');
            }

            renderRegions(data.regions, document.querySelector(".regions__list"));
            renderHousingForms(
                data.housing_form_type?.housing_forms || [],
                document.querySelector(".housingForms__list")
            );

        } catch (error) {
            console.error("Error loading user:", error);
            const userProfile = document.getElementById("user-profile");
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
            const apiToken = await getApiToken();
            await fetchUserDetails(apiToken);
        } catch (error) {
            console.error("Initialization error:", error);
        }
    }

    // Start the application
    init();
})();

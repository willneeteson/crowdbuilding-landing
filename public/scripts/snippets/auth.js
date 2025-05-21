/**
 * Authentication Module
 * Handles Memberstack authentication and API token management
 */
(function () {
    'use strict';

    // Configuration
    const CONFIG = {
        API_BASE_URL: 'https://api.crowdbuilding.com/api/v1',
        DEVICE_NAME: 'kaartenbak-browser'
    };

    // Cache for tokens and user data
    const cache = {
        apiToken: null,
        memberstackId: null,
        userEmail: null
    };

    /**
     * Gets API token using Memberstack
     * @returns {Promise<string|null>} API token or null if not available
     */
    async function getApiToken() {
        console.log('getApiToken called');
        
        // Return cached token if available
        if (cache.apiToken) {
            console.log('Using cached API token');
            return cache.apiToken;
        }

        // If Memberstack is available, attempt to get a token
        if (typeof $memberstackDom !== "undefined") {
            console.log('Memberstack DOM is available');
            await $memberstackDom.onReady;
            console.log('Memberstack is ready');
            
            const memberstackToken = $memberstackDom.getMemberCookie();
            console.log('Memberstack token:', memberstackToken ? 'exists' : 'not found');

            if (!memberstackToken) {
                console.warn("User not signed in.");
                return null;
            }

            try {
                console.log('Attempting to exchange token with API');
                const response = await fetch(
                    `${CONFIG.API_BASE_URL}/sanctum/token`,
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Accept": "application/json"
                        },
                        body: JSON.stringify({
                            device_name: CONFIG.DEVICE_NAME,
                            memberstack_token: memberstackToken
                        }),
                        redirect: "follow"
                    }
                );

                console.log('API response status:', response.status);
                if (response.ok) {
                    const data = await response.json();
                    console.log('Successfully obtained API token');
                    cache.apiToken = data.token;

                    // Get member email if possible
                    try {
                        const memberResponse = await $memberstackDom.getCurrentMember();
                        const member = memberResponse?.data || memberResponse;
                        cache.userEmail = member?.email || null;
                    } catch (e) {
                        cache.userEmail = null;
                    }

                    return data.token;
                } else {
                    // Try to get detailed error information
                    const errorText = await response.text();
                    console.error('API token exchange failed:', {
                        status: response.status,
                        statusText: response.statusText,
                        error: errorText
                    });
                    
                    // If the error is a 500, it's likely a server issue
                    if (response.status === 500) {
                        console.error('Server error occurred. Please check the API server logs.');
                    }
                }
            } catch (error) {
                console.error("Error fetching token:", error.message);
            }
        } else {
            console.warn('Memberstack DOM is not available');
        }
        return null;
    }

    /**
     * Gets current user's memberstack ID
     * @returns {Promise<string|null>} Memberstack ID or null if not available
     */
    async function getCurrentMemberstackId() {
        // Return cached ID if available
        if (cache.memberstackId) {
            return cache.memberstackId;
        }

        if (typeof $memberstackDom === "undefined") {
            console.log('Memberstack not available');
            return null;
        }

        try {
            console.log('Waiting for Memberstack to be ready...');
            await $memberstackDom.onReady;
            console.log('Memberstack is ready');

            console.log('Getting current member...');
            const response = await $memberstackDom.getCurrentMember();
            console.log('Member data:', response);

            // Handle nested data structure
            const member = response?.data || response;
            console.log('Processed member data:', member);

            if (member && member.id) {
                console.log('Found member ID:', member.id);
                cache.memberstackId = member.id;
                return member.id;
            } else {
                console.log('No member ID found in member data');
                return null;
            }
        } catch (error) {
            console.error("Error getting current memberstack ID:", error);
            return null;
        }
    }

    /**
     * Checks if user is logged in
     * @returns {Promise<boolean>} True if user is logged in
     */
    async function isUserLoggedIn() {
        const memberstackId = await getCurrentMemberstackId();
        return memberstackId !== null;
    }

    /**
     * Clears the authentication cache
     */
    function clearAuthCache() {
        cache.apiToken = null;
        cache.memberstackId = null;
        cache.userEmail = null;
    }

    // Export functions to global scope
    window.auth = {
        getApiToken,
        getCurrentMemberstackId,
        isUserLoggedIn,
        clearAuthCache
    };
})(); 
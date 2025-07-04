/**
 * Authentication Module
 * Handles Memberstack authentication and API token management
 */
(function () {
    'use strict';

    // Configuration
    const CONFIG = {
        API_BASE_URL: 'https://api.crowdbuilding.com/api/v1',
        DEVICE_NAME: 'crowdbuilding-frontend',
        COOKIE_NAME: 'api_token'
    };

    // Cache for tokens and user data
    const cache = {
        apiToken: null,
        memberstackId: null,
        userEmail: null,
        tokenPromise: null // Cache promise to prevent multiple simultaneous requests
    };

    /**
     * Parse cookies once and cache the result
     * @returns {Object} Cookie key-value pairs
     */
    const getCookies = (() => {
        let cookieCache = null;
        
        return () => {
            if (!cookieCache) {
                cookieCache = document.cookie
                    .split('; ')
                    .reduce((acc, cookie) => {
                        const [key, value] = cookie.split('=');
                        acc[key] = value;
                        return acc;
                    }, {});
            }
            return cookieCache;
        };
    })();

    /**
     * Gets API token using Memberstack
     * @returns {Promise<string|null>} API token or null if not available
     */
    async function getApiToken() {
        // Return existing token request if one is in progress
        if (cache.tokenPromise) {
            return cache.tokenPromise;
        }

        // Create a new token request promise
        cache.tokenPromise = (async () => {
            try {
                // First check if token exists in cookie
                const cookieToken = getCookies()[CONFIG.COOKIE_NAME];
                if (cookieToken) {
                    cache.apiToken = cookieToken;
                    return cookieToken;
                }

                // Return cached token if available
                if (cache.apiToken) {
                    return cache.apiToken;
                }

                // If Memberstack is available, attempt to get a token
                if (typeof $memberstackDom === "undefined") {
                    console.warn('Memberstack DOM is not available');
                    return null;
                }

                await $memberstackDom.onReady;
                const memberstackToken = $memberstackDom.getMemberCookie();

                if (!memberstackToken) {
                    console.warn("User not signed in.");
                    return null;
                }

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

                if (response.ok) {
                    const data = await response.json();
                    cache.apiToken = data.token;

                    // Store token in cookie - expires in 24 hours
                    const expirationDate = new Date();
                    expirationDate.setTime(expirationDate.getTime() + (24 * 60 * 60 * 1000));
                    document.cookie = `${CONFIG.COOKIE_NAME}=${data.token}; expires=${expirationDate.toUTCString()}; path=/`;

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
            } finally {
                // Clear the promise cache after completion
                cache.tokenPromise = null;
            }
            return null;
        })();

        return cache.tokenPromise;
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
            return null;
        }

        try {
            await $memberstackDom.onReady;
            const response = await $memberstackDom.getCurrentMember();
            const member = response?.data || response;

            if (member && member.id) {
                cache.memberstackId = member.id;
                return member.id;
            }
            return null;
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
        cache.tokenPromise = null;
        getCookies(); // Reset cookie cache
    }

    // Export functions to global scope
    window.auth = {
        getApiToken,
        getCurrentMemberstackId,
        isUserLoggedIn,
        clearAuthCache
    };
})(); 
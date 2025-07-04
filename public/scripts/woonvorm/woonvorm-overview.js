(function () {
    const deviceName = "default_device_name";
    const id = "{{wf {&quot;path&quot;:&quot;api-id&quot;,&quot;type&quot;:&quot;PlainText&quot;\} }}";
    const followButton = document.getElementById("steunButton");
    let isFollowing = false;

    async function getApiToken() {
        // If Memberstack is available, attempt to get a token
        if (typeof $memberstackDom !== "undefined") {
            await $memberstackDom.onReady;
            const memberstackToken = $memberstackDom.getMemberCookie();

            if (!memberstackToken) {
                console.warn("User not signed in.");
                return null;
            }

            try {
                const response = await fetch(
                    "https://api.crowdbuilding.com/api/v1/sanctum/token",
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            memberstack_token: memberstackToken,
                            device_name: deviceName,
                        }),
                    }
                );

                if (response.ok) {
                    const data = await response.json();
                    return data.token;
                }
            } catch (error) {
                console.error("Error fetching token:", error.message);
            }
        }
        return null;
    }

    async function fetchHousingFormDetails(apiToken = null) {
        addPlaceholders();

        try {
            const headers = apiToken
                ? { Authorization: `Bearer ${apiToken}` }
                : {};

            const response = await fetch(
                `https://api.crowdbuilding.com/api/v1/housing-forms/${id}`,
                { headers }
            );

            if (response.ok) {
                const data = await response.json();

                // If authorised, check permissions
                if (apiToken) {
                    const permissions = data.data.permissions || {};
                    isFollowing = permissions.can_unfollow || false;
                    updateButtonText();
                }

                updateFollowerCount(data.data.followers_count);
                displayFollowerAvatars(data.data.followers);
                displayGroups(data.data.groups);
            }
        } catch (error) {
            console.error("Error fetching housing form details:", error.message);
        }
    }

    function displayGroups(groups) {
        const groupContainer = document.getElementById("group-cards");
        const emptyState = document.getElementById("landingProjectsEmpty");

        groupContainer.innerHTML = "";

        if (groups && Array.isArray(groups) && groups.length > 0) {
            // Hide empty state and show the group container
            emptyState.style.display = "none";
            groupContainer.style.display = "grid";

            // Limit to 3 groups
            groups.slice(0, 3).forEach((group) => {
                const card = document.createElement("div");
                card.classList.add("group-card");
                card.dataset.groupId = group.id;

const imageUrl =
                    (group.image?.conversions?.thumb?.url) ||
                    "https://cdn.prod.website-files.com/66dffceb975388322f140196/67bcaf8a62d1172be49c4000_e21844b19f5eee45e161d9c34c5fc437_cb_placeholder.jpg";

                card.innerHTML = `
                    <div class="card__item">
                        <div class="card__img-wrapper">
                            <img class="card__img" src="${imageUrl}" alt="${group.title}">
                        </div>
                        <div class="card__content-wrapper">
                            <p class="tag simple">${group.location || "?"}</p>
                            <div class="card__text-wrapper">
                                <h3>${group.title}</h3>
                                <p>${group.subtitle || "No subtitle available"}</p>
                                <p class="group-card__intro">${group.intro || ""}</p>
                            </div>
                        </div>
                        <a class="card__link" href="https://crowdbuilding.com/groups/${group.slug}" target="_blank"></a>
                    </div>
                `;

                groupContainer.appendChild(card);
            });
        } else {
            // Show empty state and hide the group container
            emptyState.style.display = "block";
            groupContainer.style.display = "none";
        }
    }

    function updateButtonText() {
        if (followButton) {
            followButton.textContent = isFollowing
                ? "Geen interesse meer"
                : "Blijf op de hoogte";
            followButton.disabled = false;
        }
    }

    function updateFollowerCount(count) {
        const countElement = document.getElementById("followerCount");
        if (countElement) {
            countElement.textContent = count || "0";
            countElement.classList.add("loaded");
        }
    }

    function displayFollowerAvatars(followers) {
        const avatarContainer = document.getElementById("followerAvatars");
        if (avatarContainer && Array.isArray(followers)) {
            avatarContainer.innerHTML = "";
            followers.forEach((follower) => {
                const img = document.createElement("img");
                img.src = follower.avatar_url;
                img.alt = "Follower Avatar";
                img.classList.add("avatar-style");
                avatarContainer.appendChild(img);
            });
        }
    }

    function addPlaceholders() {
        const countElement = document.getElementById("followerCount");
        const avatarContainer = document.getElementById("followerAvatars");
        const groupContainer = document.getElementById("group-cards");

        // Add placeholder for follower count
        if (countElement) {
            countElement.textContent = "";
            countElement.classList.add("placeholder", "placeholder__text");
        }

        // Add placeholders for avatars
        if (avatarContainer) {
            avatarContainer.innerHTML = "";
            for (let i = 0; i < 4; i++) {
                const div = document.createElement("div");
                div.classList.add("placeholder", "placeholder__avatar");
                avatarContainer.appendChild(div);
            }
        }

        // Add placeholder for groups
        if (groupContainer) {
            groupContainer.innerHTML = "<p>Loading groups...</p>";
        }
    }

    async function followAction(apiToken, action) {
        if (!apiToken) {
            alert("Log in om deze actie uit te voeren.");
            return;
        }

        const url = `https://api.crowdbuilding.com/api/v1/housing-forms/${id}/${action}`;
        try {
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${apiToken}`,
                },
                body: JSON.stringify({ device_name: deviceName }),
            });

            if (response.ok) {
                const result = await response.json();
                isFollowing = (action === "follow");
                updateButtonText();
                updateFollowerCount(result.data.followers_count);
                displayFollowerAvatars(result.data.followers);
                alert(isFollowing ? "Met succes gevolgd" : "Succesvol ontvolgd");
            } else {
                alert("Actie mislukt. Probeer opnieuw.");
            }
        } catch (error) {
            console.error("Error performing follow/unfollow:", error.message);
        }
    }

    async function init() {
        const apiToken = await getApiToken();
        await fetchHousingFormDetails(apiToken);

        // Set up follow button if logged in
        if (apiToken && followButton) {
            followButton.addEventListener("click", () => {
                const action = isFollowing ? "unfollow" : "follow";
                followAction(apiToken, action);
            });
        } else if (followButton) {
            followButton.disabled = true;
            followButton.textContent = "Inloggen om te volgen";
        }
    }

    init();
})();

let map;

document.addEventListener("DOMContentLoaded", async function () {
    const deviceName = "default_device_name";
    const id = "{{wf {&quot;path&quot;:&quot;api-id&quot;,&quot;type&quot;:&quot;PlainText&quot;\} }}";
    const apiUrl = `https://api.crowdbuilding.com/api/v1/housing-forms/${id}`;
    const container = document.getElementById("groupContainer");

    mapboxgl.accessToken = 'pk.eyJ1Ijoid2lsbG5lZXRlc29uIiwiYSI6ImNtMDJpZGM0eTAxbmkyanF1bTI2ZDByczQifQ.irtx4lkDC9cUXHtRIgBJVg';

    let markers = [];
    let markerMap = new Map();

    async function getApiToken() {
        // Similar to the first script, try retrieving a token
        if (typeof $memberstackDom !== "undefined") {
            await $memberstackDom.onReady;
            const memberstackToken = $memberstackDom.getMemberCookie();

            if (!memberstackToken) {
                console.warn("User not signed in.");
                return null;
            }

            try {
                const response = await fetch(
                    "https://api.crowdbuilding.com/api/v1/sanctum/token",
                    {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            memberstack_token: memberstackToken,
                            device_name: deviceName,
                        }),
                    }
                );

                if (response.ok) {
                    const data = await response.json();
                    return data.token;
                }
            } catch (error) {
                console.error("Error fetching token:", error.message);
            }
        }
        return null;
    }

    async function fetchGroups(apiToken = null) {
        try {
            const headers = apiToken ? { Authorization: `Bearer ${apiToken}` } : {};
            const response = await fetch(apiUrl, { headers });

            if (!response.ok) throw new Error("Failed to fetch groups");

            const data = await response.json();

            if (!data.data || data.data.groups.length === 0) {
                container.innerHTML = "<p>No groups found.</p>";
                return;
            }

            // Use the first group with valid coordinates to centre the map
            const firstGroup = data.data.groups.find(
                (group) => group.longitude && group.latitude
            );
            if (!firstGroup) {
                console.warn("No valid group found with coordinates. Using default centre.");
                initMap([4.9, 52.37]); // Default coordinates for fallback
            } else {
                initMap([firstGroup.longitude, firstGroup.latitude]);
            }

            populateMap(data.data.groups);
            displayGroups(data.data.groups);
        } catch (error) {
            console.error("Error fetching groups:", error);
            container.innerHTML = "<p>Failed to load groups. Please try again later.</p>";
        }
    }

    function initMap(centreCoordinates) {
        map = new mapboxgl.Map({
            container: "map",
            style: "mapbox://styles/willneeteson/cm02jz7we007b01r6d69f99cq",
            center: centreCoordinates,
            zoom: 8,
            minZoom: 6,
            maxZoom: 14,
            pitchWithRotate: false,
            dragRotate: false,
            touchZoomRotate: false,
        });

        map.setMaxBounds([[2, 50], [8, 53]]);
        map.scrollZoom.disable();
        map.addControl(new mapboxgl.NavigationControl());
    }

    function populateMap(groups) {
        // Clear any existing markers
        markers.forEach((marker) => marker.remove());
        markers = [];
        markerMap.clear();

        groups.forEach((group) => {
            if (!group.longitude || !group.latitude) return;

            const feature = {
                type: "Feature",
                geometry: {
                    type: "Point",
                    coordinates: [group.longitude, group.latitude],
                },
                properties: {
                    title: group.title,
                    description: group.subtitle || "No description available",
                    image: group.image?.responsive_images?.urls?.['320'] || "https://cdn.prod.website-files.com/66dffceb975388322f140196/67bcaf8a62d1172be49c4000_e21844b19f5eee45e161d9c34c5fc437_cb_placeholder.jpg",
                    link: `https://app.crowdbuilding.com/groups/${group.slug}`,
                },
            };

            const marker = createMarker(feature);
            markerMap.set(group.id, marker);
        });
    }

    function createMarker(feature) {
        const markerElement = document.createElement("div");
        markerElement.className = "custom-marker";

        const popup = new mapboxgl.Popup({ offset: 24 }).setHTML(`
            <img src="${feature.properties.image}" class="marker__popup-img" />
            <div class="marker__popup-content">
                <h4>${feature.properties.title}</h4>
                <p>${feature.properties.description}</p>
            </div>
            <a href="${feature.properties.link}" class="card__link" target="_blank"></a>
        `);

        const marker = new mapboxgl.Marker(markerElement)
            .setLngLat(feature.geometry.coordinates)
            .setPopup(popup)
            .addTo(map);

        markers.push(marker);
        return marker;
    }

    function displayGroups(groups) {
        container.innerHTML = "";

        groups.forEach((group) => {
            const card = document.createElement("div");
            card.classList.add("group-card");
            card.dataset.groupId = group.id;

            const imageUrl =
                (group.image?.conversions?.thumb?.url) ||
                "https://cdn.prod.website-files.com/66dffceb975388322f140196/67bcaf8a62d1172be49c4000_e21844b19f5eee45e161d9c34c5fc437_cb_placeholder.jpg";

            card.innerHTML = `
                <div class="card__item">
                    <div class="card__content-wrapper">
                        <p class="tag simple">${group.location || "?"}</p>
                        <div class="card__text-wrapper">
                            <h3>${group.title}</h3>
                            <p>${group.subtitle || "No subtitle available"}</p>
                            <p class="group-card__intro">${group.intro || ""}</p>
                        </div>
                    </div>
                    <div class="card__img-wrapper">
                        <img class="card__img" src="${imageUrl}" alt="${group.title}">
                    </div>
                    <a href="https://app.crowdbuilding.com/groups/${group.slug}" target="_blank" class="card__link"></a>
                </div>
            `;

            card.addEventListener("mouseenter", () => {
                const marker = markerMap.get(group.id);
                if (marker) {
                    marker.getElement().classList.add("highlight-marker");
                }
            });

            card.addEventListener("mouseleave", () => {
                const marker = markerMap.get(group.id);
                if (marker) {
                    marker.getElement().classList.remove("highlight-marker");
                }
            });

            container.appendChild(card);
        });
    }

    async function init() {
        const apiToken = await getApiToken();
        await fetchGroups(apiToken);
    }

    init();
});


document.addEventListener("DOMContentLoaded", function() {
    const tabs = document.querySelectorAll(".community__tab-link");

    function switchTab(tabName) {
        const targetTab = document.querySelector(`.community__tab-link[data-tab='${tabName}']`);
        const targetContent = document.getElementById(tabName);

        if (!targetTab || !targetContent) {
            console.error(`Tab or content with name '${tabName}' not found.`);
            return;
        }

        // Deactivate all tabs and contents
        document.querySelectorAll(".tab-wrapper").forEach((content) => {
            content.classList.remove("active-tab");
        });
        tabs.forEach((t) => t.classList.remove("active"));

        // Activate the chosen tab/content
        targetContent.classList.add("active-tab");
        targetTab.classList.add("active");

        // Resize map if switching to "Projecten" tab
        if (tabName === "Projecten" && typeof map !== "undefined" && typeof map.resize === "function") {
            setTimeout(() => {
                map.resize();
            }, 100);
        }
    }

    // Tab clicks
    tabs.forEach((tab) => {
        tab.addEventListener("click", function(event) {
            event.preventDefault();
            const tabName = tab.getAttribute("data-tab");
            switchTab(tabName);
        });
    });

    // Buttons that switch tabs (within tab content)
    document.querySelectorAll("[data-switch-tab]").forEach((button) => {
        button.addEventListener("click", function() {
            const tabName = this.getAttribute("data-switch-tab");
            switchTab(tabName);
        });
    });

    // Set the first tab active on load
    if (tabs.length > 0) {
        tabs[0].click();
    }
});
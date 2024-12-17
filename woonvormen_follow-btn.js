(function () {
    const deviceName = "default_device_name";
    const id = "{{wf {&quot;path&quot;:&quot;slug&quot;,&quot;type&quot;:&quot;PlainText&quot;\} }}";
    const followButton = document.getElementById("steunButton");
    let isFollowing = false;

    async function getApiToken() {
        if (typeof $memberstackDom !== "undefined") {
            await $memberstackDom.onReady;
            const memberstackToken = $memberstackDom.getMemberCookie();

            if (!memberstackToken) {
                console.warn("User not signed in.");
                return null;
            }

            try {
                const response = await fetch(`https://api.crowdbuilding.nl/api/v1/sanctum/token`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        memberstack_token: memberstackToken,
                        device_name: deviceName,
                    }),
                });

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
        try {
            const headers = apiToken
                ? { "Authorization": `Bearer ${apiToken}` }
                : {};

            const response = await fetch(`https://api.crowdbuilding.nl/api/v1/housing-forms/${id}`, {
                headers,
            });

            if (response.ok) {
                const data = await response.json();
                if (apiToken) {
                    const permissions = data.data.permissions || {};
                    isFollowing = permissions.can_unfollow || false;
                    updateButtonText();
                }
                updateFollowerCount(data.data.followers_count);
                displayFollowerAvatars(data.data.followers);
            }
        } catch (error) {
            console.error("Error fetching housing form details:", error.message);
        }
    }

    function updateButtonText() {
        if (followButton) {
            followButton.textContent = isFollowing
                ? "Nee, geen interesse meer"
                : "Ja, ik ben geïnteresseerd!";
            followButton.disabled = false;
        }
    }

    function updateFollowerCount(count) {
        const countElement = document.getElementById("followerCount");
        if (countElement) countElement.textContent = count || "0";
    }

    function displayFollowerAvatars(followers) {
        const avatarContainer = document.getElementById("followerAvatars");
        if (avatarContainer && Array.isArray(followers)) {
            avatarContainer.innerHTML = ""; // Clear existing avatars
            followers.forEach(follower => {
                const img = document.createElement("img");
                img.src = follower.avatar_url;
                img.alt = "Follower Avatar";
                img.style = "width: 32px; height: 32px; border-radius: 50%; margin-right: 5px;";
                avatarContainer.appendChild(img);
            });
        }
    }

    async function followAction(apiToken, action) {
        if (!apiToken) {
            alert("Log in om deze actie uit te voeren.");
            return;
        }

        const url = `https://api.crowdbuilding.nl/api/v1/housing-forms/${id}/${action}`;
        try {
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiToken}`,
                },
                body: JSON.stringify({ device_name: deviceName }),
            });

            if (response.ok) {
                const result = await response.json();
                isFollowing = action === "follow";
                updateButtonText();
                updateFollowerCount(result.data.followers_count);
                displayFollowerAvatars(result.data.followers);
                alert(isFollowing ? "Met succes gevolgd!" : "Succesvol ontvolgd!");
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

        if (apiToken && followButton) {
            followButton.addEventListener("click", () => {
                const action = isFollowing ? "unfollow" : "follow";
                followAction(apiToken, action);
            });
        } else if (followButton) {
            followButton.disabled = true;
            followButton.textContent = "Log in om te volgen";
        }
    }

    init();
})();
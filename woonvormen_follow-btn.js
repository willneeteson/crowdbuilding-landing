(function () {
    const deviceName = "default_device_name";
    const id = ""; // this is populated from Webflow with the page slug
    const followButton = document.getElementById("steunButton");
    let isFollowing = false;

    async function getApiToken() {
        if (typeof $memberstackDom !== "undefined") {
            await $memberstackDom.onReady;
            const memberstackToken = $memberstackDom.getMemberCookie();

            console.log("Retrieved MemberStack Token:", memberstackToken);

            if (!memberstackToken) {
                console.error("User not signed in or MemberStack Token missing.");
                return null;
            }

            try {
                const response = await fetch(`https://api.dev.crowdbuilding.com/api/v1/sanctum/token`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        memberstack_token: memberstackToken,
                        device_name: deviceName,
                    }),
                });

                if (!response.ok) {
                    console.error("Token exchange failed. Status:", response.status, response.statusText);
                    return null;
                }

                const data = await response.json();
                console.log("Successfully retrieved API Token:", data.token);
                return data.token;
            } catch (error) {
                console.error("Error fetching API token:", error.message);
                return null;
            }
        }
        console.error("MemberStack is not loaded.");
        return null;
    }

    async function checkFollowStatus(apiToken) {
        if (!apiToken) return;

        try {
            const response = await fetch(`https://api.dev.crowdbuilding.com/api/v1/housing-forms/${id}`, {
                headers: { "Authorization": `Bearer ${apiToken}` }
            });

            if (response.ok) {
                const data = await response.json();
                const permissions = data.data.permissions || {};
                isFollowing = permissions.can_unfollow || false;
                updateButtonText();
                updateFollowerCount(data.data.followers_count);
                displayFollowerAvatars(data.data.followers);
            }
        } catch (error) {
            console.error("Error checking follow status:", error);
        }
    }

    function updateButtonText() {
        if (followButton) {
            followButton.textContent = isFollowing ? "Nee, geen interesse meer" : "Ja, ik ben geïnteresseerd!";
            followButton.disabled = false;
        }
    }

    function updateFollowerCount(count) {
        const countElement = document.getElementById("followerCount");
        if (countElement) {
            countElement.textContent = count || "0";
        }
    }

    function displayFollowerAvatars(followers) {
        const avatarContainer = document.getElementById("followerAvatars");
        if (avatarContainer && Array.isArray(followers)) {
            avatarContainer.innerHTML = "";
            followers.forEach(follower => {
                const img = document.createElement("img");
                img.src = follower.avatar_url;
                img.alt = "Follower Avatar";
                img.style.width = "32px";
                img.style.height = "32px";
                img.style.borderRadius = "50%";
                img.style.marginRight = "5px";
                avatarContainer.appendChild(img);
            });
        }
    }

    async function followAction(apiToken, action) {
        if (!apiToken) {
            alert("Log in om deze actie uit te voeren.");
            return;
        }

        const url = `https://api.dev.crowdbuilding.com/api/v1/housing-forms/${id}/${action}`;
        try {
            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${apiToken}`,
                },
                body: JSON.stringify({ device_name: deviceName })
            });

            if (response.ok) {
                const result = await response.json();
                isFollowing = action === "follow";
                updateButtonText();
                updateFollowerCount(result.data.followers_count || "0");
                displayFollowerAvatars(result.data.followers || []);
                alert(isFollowing ? "Met succes gevolgd!" : "Succesvol ontvolgd!");
            } else {
                alert("Actie mislukt. Probeer opnieuw.");
            }
        } catch (error) {
            console.error("Error performing follow/unfollow:", error);
        }
    }

    async function init() {
        const apiToken = await getApiToken();
        if (!apiToken) {
            if (followButton) {
                followButton.disabled = true;
                followButton.textContent = "Log in om te volgen";
            }
            return;
        }

        if (followButton) {
            followButton.addEventListener("click", () => {
                const action = isFollowing ? "unfollow" : "follow";
                followAction(apiToken, action);
            });
        }

        await checkFollowStatus(apiToken);
    }

    function waitForMemberStack() {
        const interval = setInterval(() => {
            if (typeof $memberstackDom !== "undefined") {
                clearInterval(interval);
                init();
            }
        }, 100);
    }

    waitForMemberStack();
})();
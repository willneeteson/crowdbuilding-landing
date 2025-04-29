(function () {
    const id = "9ea31097-018a-4f09-afcb-d5eb34ae81f9";

    async function getApiToken() {
        if (typeof $memberstackDom !== "undefined") {
            await $memberstackDom.onReady;
            const memberstackToken = $memberstackDom.getMemberCookie();

            if (!memberstackToken) return null;

            try {
                const response = await fetch("https://api.crowdbuilding.com/api/v1/sanctum/token", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        memberstack_token: memberstackToken,
                        device_name: "default_device_name",
                    }),
                });

                if (response.ok) {
                    const data = await response.json();
                    return data.token;
                }
            } catch (error) {
                console.error("Error fetching token:", error);
            }
        }
        return null;
    }

    async function fetchUserDetails(apiToken = null) {
        try {
            const headers = apiToken ? { Authorization: `Bearer ${apiToken}` } : {};
            const res = await fetch(`https://api.crowdbuilding.com/api/v1/users/${id}`, { headers });

            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const { data } = await res.json();

            document.getElementById("avatar").src = data.avatar_url || "https://via.placeholder.com/150";
            document.getElementById("avatar").classList.remove("shimmer");

            document.getElementById("name").textContent = data.name || `${data.first_name} ${data.last_name}`;
            document.getElementById("name").classList.remove("shimmer");

            document.getElementById("bio").textContent = data.bio || "Geen bio beschikbaar.";
            document.getElementById("bio").classList.remove("shimmer");

            document.getElementById("housingTypeName").textContent =
                data.housing_form_type?.name || "Onbekend";
            document.getElementById("housingTypeName").classList.remove("shimmer");

            document.getElementById("ownership").textContent =
                data.ownership_situation?.name || "Niet opgegeven";
            document.getElementById("ownership").classList.remove("shimmer");

            const interestsElement = document.getElementById("interests");

if (Array.isArray(data.interests)) {
  interestsElement.innerHTML = "<ul>" + data.interests.map(i => `<li>${i.name}</li>`).join("") + "</ul>";
} else {
  interestsElement.textContent = "Geen interesses";
}

interestsElement.classList.remove("shimmer");
            // Regions
            const regionsList = document.querySelector(".regions__list");
            regionsList.innerHTML = "";
            if (Array.isArray(data.regions)) {
                data.regions.forEach(region => {
                    const el = document.createElement("div");
                    el.classList.add("region-item");
                    el.innerHTML = `
                        <p>${region.name}</p>
                    `;
                    regionsList.appendChild(el);
                });
            } else {
                regionsList.textContent = "Geen regio's gevonden.";
            }
            regionsList.classList.remove("shimmer");

            // Housing Forms & Groups
            const formsList = document.querySelector(".housingForms__list");
            formsList.innerHTML = "";
            const housingForms = data.housing_form_type?.housing_forms || [];

            housingForms.forEach(form => {
                const wrapper = document.createElement("div");
                wrapper.classList.add("housing-form");

                wrapper.innerHTML = `
                    <h3>${form.title}</h3>
                `;

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

                formsList.appendChild(wrapper);
            });
            formsList.classList.remove("shimmer");

        } catch (error) {
            console.error("Error loading user:", error.message);
            document.getElementById("user-profile").innerHTML = `<p style="color: red;">Kon gebruiker niet laden.</p>`;
        }
    }

    async function init() {
        const apiToken = await getApiToken();
        await fetchUserDetails(apiToken);
    }

    init();
})();

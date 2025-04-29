<script>
localStorage.setItem('locat', location.href);
</script>

<script>
(function () {
  const deviceName = "default_device_name";
  const id = "{{wf {&quot;path&quot;:&quot;slug&quot;,&quot;type&quot;:&quot;PlainText&quot;\} }}";
  const followButtons = [
    document.getElementById("steunButton"),
    document.getElementById("steunButtonModal")
  ];
  let isFollowing = false;

  const rawPartnerType = "{{wf {&quot;path&quot;:&quot;expert-type:name&quot;,&quot;type&quot;:&quot;PlainText&quot;\} }}";
  let partnerType;

  if (rawPartnerType === "Gemeente") {
    partnerType = "region-areas";
  } else if (rawPartnerType === "Provincie") {
    partnerType = "regions";
  } else {
    partnerType = "service-providers";
  }

  async function getApiToken() {
    if (typeof $memberstackDom !== "undefined") {
      await $memberstackDom.onReady;
      const memberstackToken = $memberstackDom.getMemberCookie();
      console.log("Retrieved MemberStack Token:", memberstackToken);

      if (!memberstackToken) {
        console.log("User not signed in.");
        return null;
      }

      // Exchange MemberStack token for API token
      try {
        const response = await fetch(`https://api.crowdbuilding.nl/api/v1/sanctum/token`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          body: JSON.stringify({
            memberstack_token: memberstackToken,
            device_name: deviceName,
          }),
        });

        if (!response.ok) {
          console.error("Failed to exchange token:", response.statusText);
          return null;
        }

        const data = await response.json();
        console.log("Retrieved API Token:", data.token);
        return data.token;
      } catch (error) {
        console.error("Error exchanging token:", error);
        return null;
      }
    }

    console.log("No MemberStack detected.");
    return null;
  }

  async function checkFollowStatus(apiToken) {
    if (!apiToken) {
      console.log("User not signed in, skipping follow status check.");
      return;
    }

    try {
      const response = await fetch(`https://api.crowdbuilding.nl/api/v1/${partnerType}/${id}`, {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "Authorization": `Bearer ${apiToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.data && data.data.permissions) {
          const permissions = data.data.permissions;
          isFollowing = permissions.can_unfollow || false;
          updateButtonText();
        }
      } else {
        console.error(`Failed to fetch follow status: ${response.statusText}`);
      }
    } catch (error) {
      console.error("Error checking follow status:", error);
    }
  }

  function updateButtonText() {
    followButtons.forEach(button => {
      if (button) {
        button.textContent = isFollowing ? "Nee, geen interesse meer" : "Ja, ik ben geïnteresseerd!";
        button.disabled = false;
      }
    });
  }

  async function followPartner(apiToken) {
    if (!apiToken) {
      alert("Log in om deze actie uit te voeren.");
      return;
    }

    const apiUrl = `https://api.crowdbuilding.nl/api/v1/${partnerType}/${id}/follow`;
    console.log("Follow API URL:", apiUrl);
    console.log("Authorization Token:", apiToken);

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${apiToken}`,
        },
        body: JSON.stringify({
          payload: {},
          device_name: deviceName,
        }),
      });

      if (response.ok) {
        alert("Met succes gevolgd!");
        isFollowing = true;
        updateButtonText();
        await displayFollowerCount();
      } else {
        const errorDetails = await response.json();
        console.error("Failed to follow partner:", errorDetails.message);
        alert(`Kan de actie niet voltooien: ${errorDetails.message}`);
      }
    } catch (error) {
      console.error("Error in followPartner:", error);
      alert("Er is een fout opgetreden bij het volgen.");
    }
  }

  async function unfollowPartner(apiToken) {
    if (!apiToken) {
      alert("Log in om deze actie uit te voeren.");
      return;
    }

    const apiUrl = `https://api.crowdbuilding.nl/api/v1/${partnerType}/${id}/unfollow`;
    console.log("Unfollow API URL:", apiUrl);
    console.log("Authorization Token:", apiToken);

    try {
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
          "Authorization": `Bearer ${apiToken}`,
        },
        body: JSON.stringify({
          payload: {},
          device_name: deviceName,
        }),
      });

      if (response.ok) {
        alert("Succesvol ontvolgd!");
        isFollowing = false;
        updateButtonText();
        await displayFollowerCount();
      } else {
        const errorDetails = await response.json();
        console.error("Failed to unfollow partner:", errorDetails.message);
        alert(`Kan de actie niet voltooien: ${errorDetails.message}`);
      }
    } catch (error) {
      console.error("Error in unfollowPartner:", error);
      alert("Er is een fout opgetreden bij het ontvolgen.");
    }
  }

  async function displayFollowerCount() {
    const apiUrl = `https://api.crowdbuilding.nl/api/v1/${partnerType}/${id}`;
    try {
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Accept": "application/json",
        },
      });

      if (!response.ok) throw new Error("Network response was not ok");

      const data = await response.json();
      const followersCount = data.data.followers_count;

      document.getElementById("followerCount").textContent = followersCount || "0";
      document.getElementById("followerCountModal").textContent = followersCount || "0";
    } catch (error) {
      console.error("Failed to fetch follower count:", error);
      document.getElementById("followerCount").textContent = "0";
      document.getElementById("followerCountModal").textContent = "0";
    }
  }

  async function init() {
    const validButtons = followButtons.filter(button => button !== null);
    if (validButtons.length === 0) return;

    try {
      const apiToken = await getApiToken();

      if (apiToken) {
        validButtons.forEach(button => {
          button.addEventListener("click", async function () {
            if (isFollowing) {
              await unfollowPartner(apiToken);
            } else {
              await followPartner(apiToken);
            }
          });
        });

        await checkFollowStatus(apiToken);
      } else {
        validButtons.forEach(button => {
          button.disabled = true;
          button.textContent = "Log in om te volgen";
        });
      }

      await displayFollowerCount();
    } catch (error) {
      console.error("Initialization error:", error);
    }
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
</script>

<script>
  mapboxgl.accessToken = 'pk.eyJ1Ijoid2lsbG5lZXRlc29uIiwiYSI6ImNtMDJpZGM0eTAxbmkyanF1bTI2ZDByczQifQ.irtx4lkDC9cUXHtRIgBJVg';

  const map = new mapboxgl.Map({
    container: 'mapExpert',
    style: 'mapbox://styles/willneeteson/cm02jz7we007b01r6d69f99cq',
    center: [5.2, 52.55],
    zoom: 7.5,
    minZoom: 6,
    maxZoom: 10,
    language: 'nl',
    localize: true,
    zoomAnimationOptions: { duration: 300 },
    pitchWithRotate: false,
    dragRotate: false,
    touchZoomRotate: false
  });
  
  const bounds = [
    [2, 50],
    [8, 53]
  ];

  map.setMaxBounds(bounds);
  map.scrollZoom.disable();

  let isPinching = false;
  map.getCanvas().addEventListener('wheel', (event) => {
    if (event.ctrlKey) {
      map.scrollZoom.enable();
    } else {
      map.scrollZoom.disable();
    }
  });

  map.getCanvas().addEventListener('touchstart', function (event) {
    if (event.touches.length === 2) {
      isPinching = true;
      map.scrollZoom.enable();
    }
  });

  map.getCanvas().addEventListener('touchend', function () {
    isPinching = false;
    map.scrollZoom.disable();
  });

  map.getCanvas().addEventListener('touchmove', function (event) {
    if (event.touches.length !== 2) {
      isPinching = false;
      map.scrollZoom.disable();
    }
  });

  let markers = [];

  // Function to retrieve dynamic markers from CMS
  function getDynamicMarkers() {
    const features = [];

    document.querySelectorAll('.marker__item').forEach(function (item) {
      const latElement = item.querySelector('.marker.lat');
      const longElement = item.querySelector('.marker.long');
      const titleElement = item.querySelector('.marker.title');
      const linkElement = item.querySelector('.marker.link');
      const descriptionElement = item.querySelector('.marker.short-description');
      const imageElement = item.querySelector('.marker.image');

      if (latElement && longElement && titleElement && descriptionElement && imageElement) {
        const lat = parseFloat(latElement.textContent);
        const long = parseFloat(longElement.textContent);
        const title = titleElement.textContent;
        const link = linkElement.textContent;
        const description = descriptionElement.textContent;
        const image = imageElement.src;

        if (!isNaN(lat) && !isNaN(long)) {
          features.push({
            "type": "Feature",
            "geometry": { "type": "Point", "coordinates": [long, lat] },
            "properties": {
              "title": title,
              "link": link,
              "description": description,
              "image": image
            }
          });
        }
      }
    });

    return {
      "type": "FeatureCollection",
      "features": features
    };
  }

  // Function to create individual markers
  function createMarker(feature) {
    const markerElement = document.createElement('div');
    markerElement.className = 'custom-marker';

    const marker = new mapboxgl.Marker(markerElement)
      .setLngLat(feature.geometry.coordinates)
      .setPopup(new mapboxgl.Popup({ offset: 24 })
        .setHTML(`
<img src="${feature.properties.image}" class="marker__popup-img"/>
<div class="marker__popup-content">
<h4>${feature.properties.title}</h4>
<p>${feature.properties.description}</p>
  </div>
<a href="${feature.properties.link}" class="marker__popup-link"></a>
`))
      .addTo(map);

    markers.push(marker);
  }

  map.on('load', function () {
    const geojsonData = getDynamicMarkers();

    map.addSource('markers', {
      type: 'geojson',
      data: geojsonData
    });
    markers.forEach(marker => marker.remove());
    markers = [];

    geojsonData.features.forEach(function (feature) {
      createMarker(feature);
    });
  });

</script>


<script>
document.getElementById('btnBack').addEventListener('click', function() {
    var referrer = document.referrer;
    var currentOrigin = window.location.origin;

    if (referrer && referrer.startsWith(currentOrigin)) {
        window.history.back();
    } else {
        window.location.href = '/';
    }
});
</script>



<script>
document.addEventListener("DOMContentLoaded", function() {
    const tabs = document.querySelectorAll(".community__tab-link");

    tabs.forEach(tab => {
        tab.addEventListener("click", function(event) {
            event.preventDefault();
            const tabName = tab.getAttribute("data-tab");
            const targetContent = document.getElementById(tabName);
            if (!targetContent) {
                console.error(`Element with ID '${tabName}' not found.`);
                return;
            }

            document.querySelectorAll(".tab-wrapper").forEach(content => content.classList.remove("active-tab"));
            tabs.forEach(t => t.classList.remove("active"));

            targetContent.classList.add("active-tab");
            tab.classList.add("active");

            if (tabName === 'Projecten') {
                setTimeout(() => {
                    map.resize();
                }, 10);
            }
        });
    });

    // Show the first tab by default
    if (tabs.length > 0) {
        tabs[0].click();
    }
});
</script>

<script>
document.addEventListener("DOMContentLoaded", function () {
    const readMoreBtn = document.getElementById("readmore1Btn");
    const content = document.getElementById("readmore1Content");
    
    const maxChars = 600;
    const fullText = content.innerHTML;
    const truncatedText = fullText.substring(0, maxChars) + "...";

    if (fullText.length > maxChars) {
        const span = document.createElement("span");
        span.innerHTML = truncatedText;
        span.classList.add("truncated");
        
        const fullSpan = document.createElement("span");
        fullSpan.innerHTML = fullText;
        fullSpan.style.display = "none";
        
        content.innerHTML = "";
        content.appendChild(span);
        content.appendChild(fullSpan);

        readMoreBtn.addEventListener("click", function (event) {
            event.preventDefault();
            if (fullSpan.style.display === "none") {
                span.style.display = "none";
                fullSpan.style.display = "inline";
                readMoreBtn.textContent = "Lees minder";
            } else {
                span.style.display = "inline";
                fullSpan.style.display = "none";
                readMoreBtn.textContent = "Lees meer";
            }
        });
    } else {
        readMoreBtn.style.display = "none";
    }
});
</script>
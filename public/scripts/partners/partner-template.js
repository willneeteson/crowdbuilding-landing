localStorage.setItem('locat', location.href);

(function () {
  const deviceName = "default_device_name";
  const id = window.location.pathname.split('/').filter(Boolean).pop();
  console.log('Partner ID (from URL):', id);
  const followButtons = [
    document.getElementById("steunButton"),
    document.getElementById("steunButtonModal")
  ];
  let isFollowing = false;

  const partnerType = document.body.getAttribute('partner-type');
  console.log('Partner Type:', partnerType);

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

  async function followPartner() {
    const apiToken = await window.auth.getApiToken();
    if (!apiToken) {
      alert("Log in om deze actie uit te voeren.");
      return;
    }

    const apiUrl = `https://api.crowdbuilding.nl/api/v1/${partnerType}/${id}/follow`;
    console.log("Follow API URL:", apiUrl);

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

  async function unfollowPartner() {
    const apiToken = await window.auth.getApiToken();
    if (!apiToken) {
      alert("Log in om deze actie uit te voeren.");
      return;
    }

    const apiUrl = `https://api.crowdbuilding.nl/api/v1/${partnerType}/${id}/unfollow`;
    console.log("Unfollow API URL:", apiUrl);

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
      const apiToken = await window.auth.getApiToken();

      if (apiToken) {
        validButtons.forEach(button => {
          button.addEventListener("click", async function () {
            if (isFollowing) {
              await unfollowPartner();
            } else {
              await followPartner();
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

  // Initialize when auth module is ready
  if (window.auth) {
    init();
  } else {
    window.addEventListener('load', () => {
      if (window.auth) {
        init();
      } else {
        console.error('Auth module not available');
      }
    });
  }
})();

// Map configuration
const MAP_CONFIG = {
  accessToken: 'pk.eyJ1Ijoid2lsbG5lZXRlc29uIiwiYSI6ImNtMDJpZGM0eTAxbmkyanF1bTI2ZDByczQifQ.irtx4lkDC9cUXHtRIgBJVg',
  style: 'mapbox://styles/willneeteson/cm02jz7we007b01r6d69f99cq',
  center: [5.2, 52.55],
  zoom: 7.5,
  minZoom: 6,
  maxZoom: 10,
  bounds: [[2, 50], [8, 53]]
};

class MapManager {
  constructor() {
    this.map = null;
    this.markers = new Map();
    this.markerCluster = null;
    this.init();
  }

  init() {
    mapboxgl.accessToken = MAP_CONFIG.accessToken;
    
    this.map = new mapboxgl.Map({
      container: 'mapExpert',
      style: MAP_CONFIG.style,
      center: MAP_CONFIG.center,
      zoom: MAP_CONFIG.zoom,
      minZoom: MAP_CONFIG.minZoom,
      maxZoom: MAP_CONFIG.maxZoom,
      language: 'nl',
      localize: true,
      zoomAnimationOptions: { duration: 300 },
      pitchWithRotate: false,
      dragRotate: false,
      touchZoomRotate: false
    });

    this.map.setMaxBounds(MAP_CONFIG.bounds);
    this.setupZoomControls();
    this.setupMarkers();
  }

  setupZoomControls() {
    this.map.scrollZoom.disable();

    let isPinching = false;
    const canvas = this.map.getCanvas();

    canvas.addEventListener('wheel', (event) => {
      if (event.ctrlKey) {
        this.map.scrollZoom.enable();
      } else {
        this.map.scrollZoom.disable();
      }
    });

    canvas.addEventListener('touchstart', (event) => {
      if (event.touches.length === 2) {
        isPinching = true;
        this.map.scrollZoom.enable();
      }
    });

    canvas.addEventListener('touchend', () => {
      isPinching = false;
      this.map.scrollZoom.disable();
    });

    canvas.addEventListener('touchmove', (event) => {
      if (event.touches.length !== 2) {
        isPinching = false;
        this.map.scrollZoom.disable();
      }
    });
  }

  setupMarkers() {
    this.map.on('load', () => {
      const geojsonData = this.getDynamicMarkers();
      
      // Remove existing markers
      this.clearMarkers();

      // Add new markers with clustering
      geojsonData.features.forEach(feature => {
        this.createMarker(feature);
      });
    });
  }

  getDynamicMarkers() {
    const features = [];
    document.querySelectorAll('.marker__item').forEach(item => {
      const lat = parseFloat(item.querySelector('.marker.lat')?.textContent);
      const long = parseFloat(item.querySelector('.marker.long')?.textContent);
      const title = item.querySelector('.marker.title')?.textContent;
      const link = item.querySelector('.marker.link')?.textContent;
      const description = item.querySelector('.marker.short-description')?.textContent;
      const image = item.querySelector('.marker.image')?.src;

      if (!isNaN(lat) && !isNaN(long) && title) {
        features.push({
          type: "Feature",
          geometry: { type: "Point", coordinates: [long, lat] },
          properties: { title, link, description, image }
        });
      }
    });

    return {
      type: "FeatureCollection",
      features
    };
  }

  createMarker(feature) {
    const { coordinates } = feature.geometry;
    const { title, link, description, image } = feature.properties;

    const markerElement = document.createElement('div');
    markerElement.className = 'custom-marker';

    const marker = new mapboxgl.Marker(markerElement)
      .setLngLat(coordinates)
      .setPopup(
        new mapboxgl.Popup({ offset: 24 })
          .setHTML(`
            <img src="${image}" class="marker__popup-img"/>
            <div class="marker__popup-content">
              <h4>${title}</h4>
              <p>${description}</p>
            </div>
            <a href="${link}" class="marker__popup-link"></a>
          `)
      )
      .addTo(this.map);

    this.markers.set(coordinates.join(','), marker);
  }

  clearMarkers() {
    this.markers.forEach(marker => marker.remove());
    this.markers.clear();
  }
}

// Initialize map when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new MapManager();
});

class TabManager {
  constructor() {
    this.tabs = document.querySelectorAll(".community__tab-link");
    this.init();
  }

  init() {
    // Event delegation for tab clicks
    document.addEventListener("click", (e) => {
      const tab = e.target.closest(".community__tab-link");
      if (tab) {
        e.preventDefault();
        this.switchTab(tab);
      }
    });

    // Show first tab by default
    if (this.tabs.length > 0) {
      this.switchTab(this.tabs[0]);
    }
  }

  switchTab(selectedTab) {
    const tabName = selectedTab.getAttribute("data-tab");
    const targetContent = document.getElementById(tabName);
    
    if (!targetContent) {
      console.error(`Tab content '${tabName}' not found`);
      return;
    }

    // Update tab states
    this.tabs.forEach(tab => tab.classList.remove("active"));
    document.querySelectorAll(".tab-wrapper").forEach(content => 
      content.classList.remove("active-tab")
    );

    // Activate selected tab
    targetContent.classList.add("active-tab");
    selectedTab.classList.add("active");

    // Handle map resize if needed
    if (tabName === 'Projecten') {
      requestAnimationFrame(() => {
        if (window.mapManager?.map) {
          window.mapManager.map.resize();
        }
      });
    }
  }
}

class ContentManager {
  constructor() {
    this.readMoreBtn = document.getElementById("readmore1Btn");
    this.content = document.getElementById("readmore1Content");
    this.maxChars = 600;
    this.init();
  }

  init() {
    if (!this.readMoreBtn || !this.content) return;

    const fullText = this.content.innerHTML;
    if (fullText.length <= this.maxChars) {
      this.readMoreBtn.style.display = "none";
      return;
    }

    this.setupExpandableContent(fullText);
  }

  setupExpandableContent(fullText) {
    const truncatedText = fullText.substring(0, this.maxChars) + "...";
    
    // Create truncated view
    const truncatedView = document.createElement("span");
    truncatedView.innerHTML = truncatedText;
    truncatedView.classList.add("truncated");

    // Create full view
    const fullView = document.createElement("span");
    fullView.innerHTML = fullText;
    fullView.style.display = "none";

    // Clear and update content
    this.content.innerHTML = "";
    this.content.appendChild(truncatedView);
    this.content.appendChild(fullView);

    // Setup toggle
    this.readMoreBtn.addEventListener("click", (e) => {
      e.preventDefault();
      const isExpanded = fullView.style.display !== "none";
      
      truncatedView.style.display = isExpanded ? "inline" : "none";
      fullView.style.display = isExpanded ? "none" : "inline";
      this.readMoreBtn.textContent = isExpanded ? "Lees meer" : "Lees minder";
    });
  }
}

class NavigationManager {
  constructor() {
    this.backButton = document.getElementById('btnBack');
    this.init();
  }

  init() {
    if (!this.backButton) return;

    this.backButton.addEventListener('click', () => {
      const referrer = document.referrer;
      const currentOrigin = window.location.origin;

      if (referrer && referrer.startsWith(currentOrigin)) {
        window.history.back();
      } else {
        window.location.href = '/';
      }
    });
  }
}

// Initialize managers when DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  new TabManager();
  new ContentManager();
  new NavigationManager();
});

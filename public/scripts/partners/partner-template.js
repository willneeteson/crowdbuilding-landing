localStorage.setItem('locat', location.href);

// Partner type detection
const rawPartnerType = document.body.getAttribute('partner-type');
let partnerType;

if (rawPartnerType === "Gemeente") {
  partnerType = "region-areas";
} else if (rawPartnerType === "Provincie") {
  partnerType = "regions";
} else {
  partnerType = "service-providers";
}

// Get partner ID from URL
const id = window.location.pathname.split('/').filter(Boolean).pop();
console.log('Partner Type:', partnerType, '(from:', rawPartnerType, ')');
console.log('Partner ID (from URL):', id);

(function () {
  const deviceName = "default_device_name";
  const followButtons = [
    document.getElementById("steunButton"),
    document.getElementById("steunButtonModal")
  ];
  let isFollowing = false;

  async function checkFollowStatus(apiToken) {
    if (!apiToken) {
      console.log("User not signed in, skipping follow status check.");
      return;
    }

    try {
      const response = await fetch(`https://api.crowdbuilding.com/api/v1/${partnerType}/${id}`, {
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

    const apiUrl = `https://api.crowdbuilding.com/api/v1/${partnerType}/${id}/follow`;
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

    const apiUrl = `https://api.crowdbuilding.com/api/v1/${partnerType}/${id}/unfollow`;
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
    const apiUrl = `https://api.crowdbuilding.com/api/v1/${partnerType}/${id}`;
    try {
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Accept": "application/json",
        },
      });

      if (!response.ok) throw new Error("Network response was not ok");

      const data = await response.json();
      const followersCount = data.data.followers_count || 0;
      const followers = data.data.followers || [];

      // Update follower count
      document.getElementById("followerCount").textContent = followersCount;
      
      // Update avatars
      const avatarContainers = document.querySelectorAll('.partner__followed-avatar:not(.number)');
      avatarContainers.forEach((container, index) => {
        const follower = followers[index];
        if (follower) {
          container.innerHTML = ''; // Clear existing content
          const img = document.createElement('img');
          img.src = follower.avatar_url?.startsWith('http') 
            ? follower.avatar_url 
            : `https://api.crowdbuilding.com${follower.avatar_url || '/storage/default-avatar.png'}`;
          img.alt = follower.name || 'Follower avatar';
          img.onerror = () => {
            img.src = 'https://api.crowdbuilding.com/storage/default-avatar.png';
          };
          container.appendChild(img);
          container.style.display = 'block';
        } else {
          container.style.display = 'none';
        }
      });

    } catch (error) {
      console.error("Failed to fetch follower count:", error);
      document.getElementById("followerCount").textContent = "0";
      document.querySelectorAll('.partner__followed-avatar:not(.number)').forEach(container => {
        container.style.display = 'none';
      });
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

class ExpertMapManager {
  constructor() {
    this.map = null;
    this.markers = new Map();
    this.init();
  }

  init() {
    const mapContainer = document.getElementById('mapSidebar');
    if (!mapContainer) return;

    mapboxgl.accessToken = MAP_CONFIG.accessToken;
    
    this.map = new mapboxgl.Map({
      container: 'mapSidebar',
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
    this.setupTouchControls(this.map);
  }

  setupTouchControls(map) {
    let isPinching = false;
    const canvas = map.getCanvas();

    canvas.addEventListener('wheel', (event) => {
      if (event.ctrlKey) {
        map.scrollZoom.enable();
      } else {
        map.scrollZoom.disable();
      }
    });

    canvas.addEventListener('touchstart', (event) => {
      if (event.touches.length === 2) {
        isPinching = true;
        map.scrollZoom.enable();
      }
    });

    canvas.addEventListener('touchend', () => {
      isPinching = false;
      map.scrollZoom.disable();
    });

    canvas.addEventListener('touchmove', (event) => {
      if (event.touches.length !== 2) {
        isPinching = false;
        map.scrollZoom.disable();
      }
    });
  }

  setupMarkers() {
    this.map.on('load', () => {
      const geojsonData = this.getDynamicMarkers();
      this.clearMarkers();
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

class ProjectMapManager {
  constructor() {
    this.map = null;
    this.markers = new Map();
    this.init();
  }

  init() {
    const mapContainer = document.getElementById('mapExpert');
    if (!mapContainer) return;

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
    this.loadPartnerProjects();
  }

  setupZoomControls() {
    this.map.scrollZoom.disable();
    this.setupTouchControls(this.map);
  }

  setupTouchControls(map) {
    let isPinching = false;
    const canvas = map.getCanvas();

    canvas.addEventListener('wheel', (event) => {
      if (event.ctrlKey) {
        map.scrollZoom.enable();
      } else {
        map.scrollZoom.disable();
      }
    });

    canvas.addEventListener('touchstart', (event) => {
      if (event.touches.length === 2) {
        isPinching = true;
        map.scrollZoom.enable();
      }
    });

    canvas.addEventListener('touchend', () => {
      isPinching = false;
      map.scrollZoom.disable();
    });

    canvas.addEventListener('touchmove', (event) => {
      if (event.touches.length !== 2) {
        isPinching = false;
        map.scrollZoom.disable();
      }
    });
  }

  async loadPartnerProjects() {
    try {
      const response = await fetch(`https://api.crowdbuilding.com/api/v1/${partnerType}/${id}/projects`);
      if (!response.ok) throw new Error('Failed to fetch projects');
      
      const data = await response.json();
      const projects = data.data || [];

      // Clear existing markers
      this.clearMarkers();

      // Add new markers
      projects.forEach(project => {
        if (project.latitude && project.longitude) {
          this.createProjectMarker(project);
        }
      });

      // Update project list in #groupContainer
      this.updateProjectList(projects);

    } catch (error) {
      console.error('Error loading partner projects:', error);
    }
  }

  createProjectMarker(project) {
    const markerElement = document.createElement('div');
    markerElement.className = 'custom-marker project-marker';

    const marker = new mapboxgl.Marker(markerElement)
      .setLngLat([project.longitude, project.latitude])
      .setPopup(
        new mapboxgl.Popup({ offset: 24 })
          .setHTML(`
            <div class="project__popup">
              <img src="${project.image_url || ''}" class="project__popup-img"/>
              <div class="project__popup-content">
                <h4>${project.name}</h4>
                <p>${project.description || ''}</p>
              </div>
              <a href="/projects/${project.slug}" class="project__popup-link"></a>
            </div>
          `)
      )
      .addTo(this.map);

    this.markers.set(project.id, marker);
  }

  updateProjectList(projects) {
    const container = document.getElementById('groupContainer');
    if (!container) return;

    container.innerHTML = projects.map(project => `
      <div class="project-card">
        <img src="${project.image_url || ''}" alt="${project.name}" class="project-card__image">
        <div class="project-card__content">
          <h3>${project.name}</h3>
          <p>${project.description || ''}</p>
          <a href="/projects/${project.slug}" class="project-card__link">Bekijk project</a>
        </div>
      </div>
    `).join('');
  }

  clearMarkers() {
    this.markers.forEach(marker => marker.remove());
    this.markers.clear();
  }
}

// Initialize maps when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const partnerType = document.body.getAttribute('partner-type');
  if (partnerType === 'expert') {
    new ExpertMapManager();
  }
  new ProjectMapManager();
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

// Add styles for avatars
const style = document.createElement('style');
style.textContent = `
  .partner__followed-avatar {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    overflow: hidden;
    background-color: #f5f5f5;
  }

  .partner__followed-avatar img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .partner__followed-avatar.number {
    background-color: #e74c3c;
    color: white;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    line-height: 1;
  }

  .partner__avatar-wrapper {
    display: flex;
    gap: 8px;
  }

  .partner__avatar-container {
    display: flex;
    align-items: center;
    gap: 16px;
  }
`;
document.head.appendChild(style);

// Add styles for project cards and markers
const projectStyles = document.createElement('style');
projectStyles.textContent = `
  .project-card {
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    margin-bottom: 16px;
    background: white;
  }

  .project-card__image {
    width: 100%;
    height: 200px;
    object-fit: cover;
  }

  .project-card__content {
    padding: 16px;
  }

  .project-card__content h3 {
    margin: 0 0 8px;
    font-size: 18px;
    color: #333;
  }

  .project-card__content p {
    margin: 0 0 16px;
    color: #666;
    font-size: 14px;
  }

  .project-card__link {
    display: inline-block;
    padding: 8px 16px;
    background: #e74c3c;
    color: white;
    text-decoration: none;
    border-radius: 4px;
    transition: background 0.3s;
  }

  .project-card__link:hover {
    background: #d44133;
  }

  .project-marker {
    width: 24px;
    height: 24px;
    background: #e74c3c;
    border: 2px solid white;
    border-radius: 50%;
    cursor: pointer;
    transition: transform 0.3s;
  }

  .project-marker:hover {
    transform: scale(1.1);
  }

  .project__popup {
    max-width: 300px;
  }

  .project__popup-img {
    width: 100%;
    height: 150px;
    object-fit: cover;
    border-radius: 4px 4px 0 0;
  }

  .project__popup-content {
    padding: 12px;
  }

  .project__popup-content h4 {
    margin: 0 0 8px;
    font-size: 16px;
    color: #333;
  }

  .project__popup-content p {
    margin: 0;
    font-size: 14px;
    color: #666;
  }

  #groupContainer {
    padding: 16px;
    max-height: 600px;
    overflow-y: auto;
  }
`;
document.head.appendChild(projectStyles);

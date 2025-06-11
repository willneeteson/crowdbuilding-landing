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
    this.boundHandleResize = this.handleResize.bind(this);
    this.init();
  }

  init() {
    const mapContainer = document.getElementById('mapExpert');
    if (!mapContainer) return;

    this.initializeMap(mapContainer);
    this.setupEventListeners();
  }

  initializeMap(container) {
    mapboxgl.accessToken = MAP_CONFIG.accessToken;
    
    this.map = new mapboxgl.Map({
      container: container,
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
      touchZoomRotate: false,
      clickTolerance: 3
    });

    this.map.setMaxBounds(MAP_CONFIG.bounds);
    this.map.scrollZoom.disable();
  }

  setupEventListeners() {
    // Map click handler to close popups
    this.map.on('click', this.closeAllPopups.bind(this));

    // Map load handler
    this.map.on('load', () => {
      this.loadPartnerProjects();
      this.map.resize();
    });

    // Touch and zoom controls
    this.setupTouchControls();

    // Resize handler
    window.addEventListener('resize', this.boundHandleResize);
  }

  setupTouchControls() {
    let isPinching = false;
    const canvas = this.map.getCanvas();

    const handleWheel = (event) => {
      this.map.scrollZoom[event.ctrlKey ? 'enable' : 'disable']();
    };

    const handleTouchStart = (event) => {
      if (event.touches.length === 2) {
        isPinching = true;
        this.map.scrollZoom.enable();
      }
    };

    const handleTouchEnd = () => {
      isPinching = false;
      this.map.scrollZoom.disable();
    };

    const handleTouchMove = (event) => {
      if (event.touches.length !== 2 && isPinching) {
        isPinching = false;
        this.map.scrollZoom.disable();
      }
    };

    canvas.addEventListener('wheel', handleWheel);
    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchend', handleTouchEnd);
    canvas.addEventListener('touchmove', handleTouchMove);

    // Store event listeners for cleanup
    this._touchListeners = {
      wheel: handleWheel,
      touchstart: handleTouchStart,
      touchend: handleTouchEnd,
      touchmove: handleTouchMove,
      canvas
    };
  }

  handleResize() {
    if (this.map) {
      this.map.resize();
    }
  }

  closeAllPopups() {
    this.markers.forEach(marker => {
      if (marker.getPopup().isOpen()) {
        marker.getPopup().remove();
      }
    });
  }

  createMarkerElement() {
    const wrapper = document.createElement('div');
    wrapper.className = 'project-marker-wrapper';

    const marker = document.createElement('div');
    marker.className = 'custom-marker project-marker';

    wrapper.appendChild(marker);
    return wrapper;
  }

  createPopup(project) {
    return new mapboxgl.Popup({
      offset: 25,
      closeButton: true,
      maxWidth: '300px',
      className: 'project-popup',
      closeOnClick: false,
      focusAfterOpen: false
    }).setHTML(`
      <div class="project__popup">
        ${project.image ? `<img src="${project.image.original_url}" alt="${project.title}" class="project__popup-img"/>` : ''}
        <div class="project__popup-content">
          <h4>${project.title}</h4>
          ${project.subtitle ? `<p>${project.subtitle}</p>` : ''}
          ${project.phase ? `<div class="project__popup-phase">${project.phase.name}</div>` : ''}
        </div>
        <a href="/groups/${project.slug}" class="project__popup-link"></a>
      </div>
    `);
  }

  createProjectMarker(project) {
    if (!project.latitude || !project.longitude) return;

    const markerElement = this.createMarkerElement();
    const popup = this.createPopup(project);

    const marker = new mapboxgl.Marker({
      element: markerElement,
      anchor: 'center'
    })
      .setLngLat([project.longitude, project.latitude])
      .setPopup(popup)
      .addTo(this.map);

    const handleClick = (e) => {
      e.stopPropagation();
      this.closeAllPopups();
      if (!popup.isOpen()) {
        popup.addTo(this.map);
      }
    };

    markerElement.addEventListener('click', handleClick);
    this.markers.set(project.id, { marker, handleClick });
  }

  async loadPartnerProjects() {
    try {
      const response = await fetch(`https://api.crowdbuilding.com/api/v1/${partnerType}/${id}/groups`);
      if (!response.ok) throw new Error('Failed to fetch projects');
      
      const { data: projects = [] } = await response.json();

      this.clearMarkers();
      projects.forEach(project => this.createProjectMarker(project));
      this.updateProjectList(projects);

    } catch (error) {
      console.error('Error loading partner projects:', error);
    }
  }

  clearMarkers() {
    this.markers.forEach(({ marker, handleClick }) => {
      marker.remove();
      marker.getElement().removeEventListener('click', handleClick);
    });
    this.markers.clear();
  }

  updateProjectList(projects) {
    const container = document.getElementById('groupContainer');
    if (!container) return;

    container.innerHTML = projects.map(project => `
      <a href="/groups/${project.slug}" class="project-card">
        <div class="project-card__content">
          <h3>${project.title}</h3>
          ${project.subtitle ? `<p class="project-card__subtitle">${project.subtitle}</p>` : ''}
          ${project.phase ? `<div class="project-card__phase">${project.phase.name}</div>` : ''}
          ${project.housing_forms?.length ? `
            <div class="project-card__tags">
              ${project.housing_forms.map(form => `<span class="tag">${form.title}</span>`).join('')}
            </div>
          ` : ''}
        </div>
        ${project.image ? `
          <div class="project-card__image-wrapper">
            <img src="${project.image.original_url}" alt="${project.title}" class="project-card__image">
          </div>
        ` : ''}
      </a>
    `).join('');
  }

  destroy() {
    // Remove event listeners
    window.removeEventListener('resize', this.boundHandleResize);
    
    if (this._touchListeners) {
      const { wheel, touchstart, touchend, touchmove, canvas } = this._touchListeners;
      canvas.removeEventListener('wheel', wheel);
      canvas.removeEventListener('touchstart', touchstart);
      canvas.removeEventListener('touchend', touchend);
      canvas.removeEventListener('touchmove', touchmove);
    }

    // Clear markers
    this.clearMarkers();

    // Remove map
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
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
    background-color: transparent;
    text-decoration: none;
    color: var(--_color---color-neutral-black-100);
    border-radius: 0px;
    position: relative;
    overflow: hidden;
    display: grid;
    grid-template-columns: 1fr 150px;
    gap: 24px;
    align-content: center;
    align-items: center;
    padding: 24px 0px;
    border-bottom: 1px solid var(--color--color-border-default);
}

  .project-card__image-wrapper {
    width: 150px;
    border-radius: 4px;
    position: relative;
    overflow: hidden;
    height: 110px;
  }

  .project-card__image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .project-card__content {
    min-width: 0px;
    padding: 0px;
  }

  .project-card__intro {
    display: -webkit-box;
    -webkit-line-clamp: 3;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
    margin: 8px 0;
  }

  .project-card__phase {
    display: inline-block;
    padding: 4px 8px;
    background: transparent;
    border: 1px solid var(--_color---color-neutral-black-100);
    border-radius: 99px;
    font-size: 14px;
    margin: 8px 0;
  }

  .project-card__tags {
    margin: 8px 0;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .project-card__tags .tag {
    padding: 4px 8px;
    background: transparent;
    border-radius: 99px;
    font-size: 14px;
    color: var(--_color---color-neutral-black-100);
  }

  .project-marker-wrapper {
    padding: 8px;
    cursor: pointer;
    border-radius: 50%;
    transition: transform 0.2s;
  }

  .project-marker {
    width: 24px;
    height: 24px;
    background: #e74c3c;
    border: 2px solid white;
    border-radius: 50%;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    transition: transform 0.2s;
    pointer-events: none;
  }

  .project-marker-wrapper:hover .project-marker {
    transform: scale(1.1);
  }

  .project-marker-wrapper:active .project-marker {
    transform: scale(0.95);
  }

  .project-popup .mapboxgl-popup-content {
    padding: 0;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    min-width: 250px;
  }

  .project-popup .mapboxgl-popup-close-button {
    padding: 8px;
    font-size: 16px;
    color: #666;
    background: white;
    border-radius: 50%;
    margin: 8px;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  }

  .project-popup .mapboxgl-popup-close-button:hover {
    background: #f5f5f5;
    color: #333;
  }

  .project__popup {
    position: relative;
  }

  .project__popup-img {
    width: 100%;
    height: 150px;
    object-fit: cover;
  }

  .project__popup-content {
    padding: 16px;
  }

  .project__popup-content h4 {
    margin: 0 0 8px 0;
    font-size: 16px;
    line-height: 1.4;
  }

  .project__popup-content p {
    margin: 0 0 8px 0;
    font-size: 14px;
    line-height: 1.5;
    color: #666;
  }

  .project__popup-phase {
    display: inline-block;
    padding: 4px 8px;
    background: #f5f5f5;
    border-radius: 99px;
    font-size: 12px;
    color: #333;
  }

  .project__popup-link {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 1;
  }

  #mapExpert {
    width: 100%;
    height: 100%;
    min-height: 400px;
  }
`;
document.head.appendChild(projectStyles);

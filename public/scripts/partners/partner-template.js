localStorage.setItem('locat', location.href);

// Partner type detection
const rawPartnerType = document.body.getAttribute('partner-type');
let partnerType;

if (rawPartnerType === "Gemeente") {
  partnerType = "region-areas";
} else if (rawPartnerType === "Provincie") {
  partnerType = "regions";
} else if (rawPartnerType === "Expert") {
  partnerType = "service-providers";
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
    const apiUrl = `https://api.crowdbuilding.com/api/v1/${partnerType}/${id}/followers`;
    try {
      const response = await fetch(apiUrl, {
        method: "GET",
        headers: {
          "Accept": "application/json",
        },
      });

      if (!response.ok) throw new Error("Network response was not ok");

      const data = await response.json();
      const followers = data.data || [];
      const followersCount = data.meta?.total || followers.length;

      // Update follower count
      document.getElementById("followerCount").textContent = followersCount;
      
      // Show/hide the avatar wrapper based on follower count
      const avatarWrapper = document.getElementById("followAvatarWrapper");
      if (avatarWrapper) {
        avatarWrapper.style.display = followersCount > 0 ? "block" : "none";
      }
      
      // Update avatars (still show only the first page of followers for avatars)
      const avatarContainers = document.querySelectorAll('.partner__followed-avatar:not(.number)');
      avatarContainers.forEach((container, index) => {
        const follower = followers[index];
        if (follower) {
          container.innerHTML = ''; // Clear existing content
          const img = document.createElement('img');
          img.src = follower.avatar_url || 'https://api.crowdbuilding.com/storage/default-avatar.png';
          img.alt = 'Follower avatar';
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
      
      // Hide avatar wrapper on error
      const avatarWrapper = document.getElementById("followAvatarWrapper");
      if (avatarWrapper) {
        avatarWrapper.style.display = "none";
      }
      
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

// Partner Map Manager using shared MapManager
class PartnerMapManager {
  constructor() {
    this.expertMap = null;
    this.projectMap = null;
    this.init();
  }

  async init() {
    // Load map.js dependency first using the same approach as plot-get-details.js
    await this.ensureMapManager();
    
    // Initialize ExpertMapManager (inner map) for all partner types
    this.initExpertMap();
    
    // Initialize ProjectMapManager (outer map) only for non-service-provider types
    const partnerType = document.body.getAttribute('partner-type');
    if (partnerType !== 'Expert') {
      this.initProjectMap();
    }
  }

  async ensureMapManager() {
    if (typeof MapManager !== 'undefined') {
      return Promise.resolve();
    }
    
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = '/scripts/snippets/map.js';
      script.onload = () => {
        console.log('MapManager loaded successfully for partner template');
        resolve();
      };
      script.onerror = () => {
        console.error('Failed to load MapManager for partner template');
        reject(new Error('Failed to load MapManager'));
      };
      document.head.appendChild(script);
    });
  }

  initExpertMap() {
    const mapContainer = document.getElementById('mapSidebar');
    if (!mapContainer) return;

    // Check if MapManager is available
    if (!window.MapManager) {
      console.error('MapManager not available');
      return;
    }

    this.expertMap = new MapManager('mapSidebar', {
      disableScrollZoom: true,
      enableTouchControls: true,
      enableResizeHandler: true,
      enableNavigationControl: false,
      autoCenterOnData: false,
      enableMarkerHighlighting: false
    });

    // Wait for map to be ready, then load markers
    mapContainer.addEventListener('mapReady', () => {
      this.loadExpertMarkers();
    });
  }

  initProjectMap() {
    const mapContainer = document.getElementById('mapExpert');
    if (!mapContainer) return;

    // Check if MapManager is available
    if (!window.MapManager) {
      console.error('MapManager not available');
      return;
    }

    this.projectMap = new MapManager('mapExpert', {
      disableScrollZoom: true,
      enableTouchControls: true,
      enableResizeHandler: true,
      enableNavigationControl: false,
      autoCenterOnData: false,
      enableMarkerHighlighting: false
    });

    // Wait for map to be ready, then load projects
    mapContainer.addEventListener('mapReady', () => {
      this.loadPartnerProjects();
    });
  }

  loadExpertMarkers() {
    const features = [];
    console.log('Loading expert markers...');
    
    const markerItems = document.querySelectorAll('.marker__item');
    console.log('Found marker items:', markerItems.length);
    
    markerItems.forEach((item, index) => {
      const lat = parseFloat(item.querySelector('.marker.lat')?.textContent);
      const long = parseFloat(item.querySelector('.marker.long')?.textContent);
      const title = item.querySelector('.marker.title')?.textContent;
      const link = item.querySelector('.marker.link')?.textContent;
      const description = item.querySelector('.marker.short-description')?.textContent;
      const image = item.querySelector('.marker.image')?.src;

      console.log(`Marker ${index + 1}:`, { lat, long, title, link, description, image });

      if (!isNaN(lat) && !isNaN(long) && title) {
        features.push({
          type: "Feature",
          geometry: { type: "Point", coordinates: [long, lat] },
          properties: { 
            title, 
            link, 
            description, 
            image,
            popupHTML: `
              <img src="${image}" class="marker__popup-img"/>
              <div class="marker__popup-content">
                <h4>${title}</h4>
                <p>${description}</p>
              </div>
              <a href="${link}" class="marker__popup-link"></a>
            `
          }
        });
      } else {
        console.log(`Skipping marker ${index + 1} - invalid data:`, { lat, long, title });
      }
    });

    console.log('Created features:', features.length);

    if (this.expertMap) {
      console.log('Adding markers to expert map...');
      this.expertMap.addMarkers(features, {
        className: 'custom-marker',
        popupClassName: 'custom-popup'
      });
    } else {
      console.error('Expert map not available');
    }
  }

  async loadPartnerProjects() {
    try {
      console.log('Loading partner projects...');
      console.log('Partner type:', partnerType, 'ID:', id);
      
      const response = await fetch(`https://api.crowdbuilding.com/api/v1/${partnerType}/${id}/groups`);
      if (!response.ok) throw new Error('Failed to fetch projects');
      
      const { data: projects = [] } = await response.json();
      console.log('Fetched projects:', projects.length);

      // Convert projects to GeoJSON features
      const features = projects
        .filter(project => {
          const hasCoords = project.latitude && project.longitude;
          if (!hasCoords) {
            console.log('Skipping project without coordinates:', project.title);
          }
          return hasCoords;
        })
        .map(project => {
          console.log('Processing project:', project.title, 'at', project.latitude, project.longitude);
          return {
            type: "Feature",
            geometry: {
              type: "Point",
              coordinates: [project.longitude, project.latitude],
            },
            properties: {
              id: project.id,
              title: project.title,
              description: project.subtitle || "No description available",
              image: project.image?.original_url || "https://cdn.prod.website-files.com/66dffceb975388322f140196/67bcaf8a62d1172be49c4000_e21844b19f5eee45e161d9c34c5fc437_cb_placeholder.jpg",
              link: `/groups/${project.slug}`,
              phase: project.phase,
              popupHTML: `
                <div class="project__popup">
                  ${project.image ? `<img src="${project.image.original_url}" alt="${project.title}" class="project__popup-img"/>` : ''}
                  <div class="project__popup-content">
                    <h4>${project.title}</h4>
                    ${project.subtitle ? `<p>${project.subtitle}</p>` : ''}
                    ${project.phase ? `<div class="project__popup-phase">${project.phase.name}</div>` : ''}
                  </div>
                  <a href="/groups/${project.slug}" class="project__popup-link"></a>
                </div>
              `
            },
          };
        });

      console.log('Created features:', features.length);

      if (this.projectMap) {
        console.log('Adding markers to project map...');
        this.projectMap.addMarkers(features, {
          className: 'project-marker',
          popupClassName: 'project-popup'
        });
      } else {
        console.error('Project map not available');
      }

      this.updateProjectList(projects);

    } catch (error) {
      console.error('Error loading partner projects:', error);
    }
  }

  updateProjectList(projects) {
    const container = document.getElementById('groupContainer');
    if (!container) return;

    container.innerHTML = projects.map(project => `
      <a href="/groups/${project.slug}" class="project-card">
        <div class="project-card__content">
          <h3>${project.title}</h3>
          ${project.subtitle ? `<p class="project-card__subtitle">${project.subtitle}</p>` : ''}
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
    if (this.expertMap) {
      this.expertMap.destroy();
      this.expertMap = null;
    }
    if (this.projectMap) {
      this.projectMap.destroy();
      this.projectMap = null;
    }
  }
}

// Initialize maps when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new PartnerMapManager();
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

// Add FAQ tab visibility management
function checkFAQContent() {
  const faqTab = document.getElementById('tabFAQ');
  const faqContent = document.getElementById('tabContentFAQ');
  
  if (faqTab && faqContent) {
    const hasContent = faqContent.innerHTML.trim() !== '';
    faqTab.style.display = hasContent ? 'inline-block' : 'none';
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
  checkFAQContent(); // Add FAQ content check
});

// Add styles for project cards
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

  .project-card__tags {
    margin: 8px 0;
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .project-card__tags .tag, .project-card__phase {
    padding: 0px 8px;
    background: transparent;
    border-radius: 99px;
    font-size: 14px;
    color: var(--_color---color-neutral-black-100);
    border: 1.5px solid var(--_color---color-neutral-black-100);
  }
`;
document.head.appendChild(projectStyles);

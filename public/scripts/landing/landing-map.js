function loadMapbox() {
  if (window.mapboxgl) {
    console.log("Mapbox already loaded");
    return initializeMap(); // If already loaded, initialize directly
  }

  console.log("Loading Mapbox...");
  
  // Load Mapbox Script
  const script = document.createElement("script");
  script.src = "https://api.mapbox.com/mapbox-gl-js/v3.10.0/mapbox-gl.js";
  script.onload = () => {
    console.log("Mapbox Loaded.");
    initializeMap();
  };
  document.body.appendChild(script);
}

function initializeMap() {
  if (!window.mapboxgl) {
    console.error("Mapbox GL JS is not loaded yet!");
    return;
  }

  mapboxgl.accessToken = "pk.eyJ1Ijoid2lsbG5lZXRlc29uIiwiYSI6ImNtMDJpZGM0eTAxbmkyanF1bTI2ZDByczQifQ.irtx4lkDC9cUXHtRIgBJVg";

  console.log("Initializing Mapbox...");
  const map = new mapboxgl.Map({
    container: "map",
    style: "mapbox://styles/willneeteson/cm02jz7we007b01r6d69f99cq",
    center: [5.2, 52.55],
    zoom: 7.5,
    minZoom: 6,
    maxZoom: 10,
    pitchWithRotate: false,
    dragRotate: false,
    touchZoomRotate: false,
  });

  map.setMaxBounds([[2, 50], [8, 53]]);
  map.scrollZoom.disable();

  let isPinching = false;
  map.getCanvas().addEventListener("wheel", (event) => {
    map.scrollZoom[event.ctrlKey ? "enable" : "disable"]();
  });

  map.getCanvas().addEventListener("touchstart", (event) => {
    if (event.touches.length === 2) {
      isPinching = true;
      map.scrollZoom.enable();
    }
  });

  map.getCanvas().addEventListener("touchend", () => {
    isPinching = false;
    map.scrollZoom.disable();
  });

  map.getCanvas().addEventListener("touchmove", (event) => {
    if (event.touches.length !== 2) {
      isPinching = false;
      map.scrollZoom.disable();
    }
  });

  // Ensure markers load after the map is fully initialized
  map.on("load", () => {
    console.log("Map is ready, loading markers...");
    setTimeout(() => {
      const geojsonData = getDynamicMarkers();
      geojsonData.features.forEach((feature) => createMarker(feature, map));
    }, 500); // Short delay to avoid race conditions
  });
}

// Lazy Load Mapbox When User Scrolls Near It
const mapObserver = new IntersectionObserver((entries) => {
  if (entries[0].isIntersecting) {
    loadMapbox();
    mapObserver.disconnect();
  }
});

const mapElement = document.getElementById("map");
if (mapElement) {
  console.log("Observing map for lazy load...");
  mapObserver.observe(mapElement);
}

// Load Markers After Map is Fully Initialized
function getDynamicMarkers() {
  return {
    type: "FeatureCollection",
    features: Array.from(document.querySelectorAll(".marker__item"))
      .map((item) => {
        const lat = parseFloat(item.querySelector(".marker.lat")?.textContent);
        const long = parseFloat(item.querySelector(".marker.long")?.textContent);
        const title = item.querySelector(".marker.title")?.textContent;
        const link = item.querySelector(".marker.link")?.textContent;
        const description = item.querySelector(".marker.short-description")?.textContent;
        const image = item.querySelector(".marker.image")?.src;

        return !isNaN(lat) && !isNaN(long)
          ? {
              type: "Feature",
              geometry: { type: "Point", coordinates: [long, lat] },
              properties: { title, link, description, image },
            }
          : null;
      })
      .filter(Boolean),
  };
}

function createMarker(feature, map) {
  console.log("Adding marker:", feature.properties.title);
  const markerElement = document.createElement("div");
  markerElement.className = "custom-marker";

  new mapboxgl.Marker(markerElement)
    .setLngLat(feature.geometry.coordinates)
    .setPopup(
      new mapboxgl.Popup({ offset: 24 }).setHTML(`
        <img src="${feature.properties.image}" class="marker__popup-img"/>
        <div class="marker__popup-content">
          <h4>${feature.properties.title}</h4>
          <p>${feature.properties.description}</p>
        </div>
        <a href="${feature.properties.link}" class="marker__popup-link"></a>
      `)
    )
    .addTo(map);
}

// Initialize search bar functionality
document.addEventListener("DOMContentLoaded", function () {
  if (typeof mapboxgl === "undefined" || typeof MapboxGeocoder === "undefined") {
    console.error("❌ Mapbox or Geocoder is not loaded.");
    return;
  }

  console.log("✅ Initializing standalone search bar...");

  // Set Mapbox Access Token
  mapboxgl.accessToken = "pk.eyJ1Ijoid2lsbG5lZXRlc29uIiwiYSI6ImNtMDJpZGM0eTAxbmkyanF1bTI2ZDByczQifQ.irtx4lkDC9cUXHtRIgBJVg";

  // Initialize Geocoder for the search bar
  try {
    const searchGeocoder = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      placeholder: "Zoek projecten op plaats/regio", // Placeholder text
      countries: "nl",
      types: "region, place",
      limit: 5, // More suggestions
      language: "nl",
      mapboxgl: mapboxgl,
    });

    const searchForm = document.getElementById("searchForm");
    const searchInput = document.getElementById("searchInput");

    if (!searchForm || !searchInput) {
      console.error("❌ Search form or input field is missing.");
      return;
    }

    // Attach Geocoder to search form (separate from the map)
    searchForm.appendChild(searchGeocoder.onAdd());

    // Update search input field when user selects a location
    searchGeocoder.on("result", (e) => {
      console.log("📍 Selected Location:", e.result.place_name);
      searchInput.value = e.result.place_name.split(",")[0];
    });

    // Redirect on form submission
    searchForm.addEventListener("submit", (event) => {
      event.preventDefault();
      const searchQuery = encodeURIComponent(searchInput.value);

      if (!searchQuery) {
        console.warn("⚠️ No search term entered.");
        return;
      }

      // Redirect to new page with the search query
      window.location.href = `https://app.crowdbuilding.com/discover?search=${searchQuery}&per_page=12#groups`;
    });

    console.log("✅ Search bar initialized successfully.");
  } catch (error) {
    console.error("❌ Error initializing search bar:", error);
  }
});
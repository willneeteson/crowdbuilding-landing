// Shared Mapbox functionality for Crowdbuilding
class MapManager {
    constructor(containerId, options = {}) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.map = null;
        this.markers = new Map();
        this.markerElements = []; // For cleanup
        this.options = {
            // Default configuration
            accessToken: 'pk.eyJ1Ijoid2lsbG5lZXRlc29uIiwiYSI6ImNtMDJpZGM0eTAxbmkyanF1bTI2ZDByczQifQ.irtx4lkDC9cUXHtRIgBJVg',
            style: 'mapbox://styles/willneeteson/cm02jz7we007b01r6d69f99cq',
            center: [5.2, 52.55],
            zoom: 7.5,
            minZoom: 6,
            maxZoom: 10,
            bounds: [[2, 50], [8, 53]],
            language: 'nl',
            localize: true,
            zoomAnimationOptions: { duration: 300 },
            pitchWithRotate: false,
            dragRotate: false,
            touchZoomRotate: false,
            clickTolerance: 3,
            // Custom options
            disableScrollZoom: true,
            enableTouchControls: true,
            enableResizeHandler: true,
            enableNavigationControl: false,
            autoCenterOnData: false, // Auto-center on first data point
            enableMarkerHighlighting: false, // Enable marker-card interaction
            ...options
        };
        
        this.boundHandleResize = this.handleResize.bind(this);
        this.boundHandleTabVisibility = this.handleTabVisibility.bind(this);
        
        // Track this map manager globally
        if (!window.mapManagers) {
            window.mapManagers = new Map();
        }
        window.mapManagers.set(containerId, this);
        
        this.init();
    }

    async init() {
        if (!this.container) {
            console.error(`Map container with id '${this.containerId}' not found`);
            return;
        }

        await this.loadMapbox();
        this.initializeMap();
        this.setupEventListeners();
    }

    async loadMapbox() {
        if (window.mapboxgl) {
            console.log("Mapbox already loaded");
            return;
        }

        console.log("Loading Mapbox...");
        
        return new Promise((resolve) => {
            const script = document.createElement("script");
            script.src = "https://api.mapbox.com/mapbox-gl-js/v3.10.0/mapbox-gl.js";
            script.onload = () => {
                console.log("Mapbox Loaded.");
                resolve();
            };
            document.body.appendChild(script);
        });
    }

    initializeMap() {
        if (!window.mapboxgl) {
            console.error("Mapbox GL JS is not loaded yet!");
            return;
        }

        mapboxgl.accessToken = this.options.accessToken;
        
        this.map = new mapboxgl.Map({
            container: this.containerId,
            style: this.options.style,
            center: this.options.center,
            zoom: this.options.zoom,
            minZoom: this.options.minZoom,
            maxZoom: this.options.maxZoom,
            language: this.options.language,
            localize: this.options.localize,
            zoomAnimationOptions: this.options.zoomAnimationOptions,
            pitchWithRotate: this.options.pitchWithRotate,
            dragRotate: this.options.dragRotate,
            touchZoomRotate: this.options.touchZoomRotate,
            clickTolerance: this.options.clickTolerance
        });

        this.map.setMaxBounds(this.options.bounds);
        
        if (this.options.disableScrollZoom) {
            this.map.scrollZoom.disable();
        }

        if (this.options.enableNavigationControl) {
            this.map.addControl(new mapboxgl.NavigationControl());
        }

        if (this.options.enableTouchControls) {
            this.setupTouchControls();
        }
    }

    setupEventListeners() {
        // Map click handler to close popups
        this.map.on('click', this.closeAllPopups.bind(this));

        // Resize handler
        if (this.options.enableResizeHandler) {
            window.addEventListener('resize', this.boundHandleResize);
        }

        // Set up Intersection Observer for tab visibility
        this.setupIntersectionObserver();

        // Dispatch ready event
        this.map.on('load', () => {
            this.map.resize();
            this.container.dispatchEvent(new CustomEvent('mapReady', { detail: { map: this.map, mapManager: this } }));
        });
    }

    setupIntersectionObserver() {
        if (!this.container) return;
        
        this.intersectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    console.log(`Map ${this.containerId} became visible`);
                    // Small delay to ensure the container is fully visible
                    setTimeout(() => {
                        if (this.map) {
                            this.map.resize();
                            console.log(`Map ${this.containerId} resized after becoming visible`);
                        }
                    }, 150);
                }
            });
        }, {
            threshold: 0.1 // Trigger when 10% of the map is visible
        });
        
        this.intersectionObserver.observe(this.container);
    }

    setupTouchControls() {
        let isPinching = false;
        const canvas = this.map.getCanvas();

        const wheelHandler = (event) => {
            this.map.scrollZoom[event.ctrlKey ? "enable" : "disable"]();
        };

        const touchStartHandler = (event) => {
            if (event.touches.length === 2) {
                isPinching = true;
                this.map.scrollZoom.enable();
            }
        };

        const touchEndHandler = () => {
            isPinching = false;
            this.map.scrollZoom.disable();
        };

        const touchMoveHandler = (event) => {
            if (event.touches.length !== 2) {
                isPinching = false;
                this.map.scrollZoom.disable();
            }
        };

        canvas.addEventListener('wheel', wheelHandler);
        canvas.addEventListener('touchstart', touchStartHandler);
        canvas.addEventListener('touchend', touchEndHandler);
        canvas.addEventListener('touchmove', touchMoveHandler);

        // Store listeners for cleanup
        this._touchListeners = {
            wheel: wheelHandler,
            touchstart: touchStartHandler,
            touchend: touchEndHandler,
            touchmove: touchMoveHandler,
            canvas: canvas
        };
    }

    createMarker(feature, options = {}) {
        console.log('Creating marker for:', feature.properties.title);
        console.log('Feature coordinates:', feature.geometry.coordinates);
        
        const markerOptions = {
            className: 'custom-marker',
            popupOffset: 24,
            popupClassName: 'custom-popup',
            ...options
        };
        
        console.log('Marker options:', markerOptions);

        const markerElement = document.createElement("div");
        markerElement.className = markerOptions.className;
        console.log('Created marker element with class:', markerElement.className);

        // Force apply the styles to ensure they're visible
        markerElement.style.width = '24px';
        markerElement.style.height = '24px';
        markerElement.style.background = '#e74c3c';
        markerElement.style.border = '2px solid white';
        markerElement.style.borderRadius = '50%';
        markerElement.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
        markerElement.style.cursor = 'pointer';
        markerElement.style.position = 'relative';
        markerElement.style.zIndex = '1';
        
        console.log('Applied inline styles to marker element');

        const popup = new mapboxgl.Popup({ 
            offset: markerOptions.popupOffset,
            className: markerOptions.popupClassName,
            closeButton: true,
            maxWidth: '300px',
            closeOnClick: false
        });

        if (feature.properties.popupHTML) {
            popup.setHTML(feature.properties.popupHTML);
        } else {
            popup.setHTML(this.generatePopupHTML(feature));
        }

        const marker = new mapboxgl.Marker({
            element: markerElement,
            anchor: 'center'
        })
            .setLngLat(feature.geometry.coordinates)
            .setPopup(popup)
            .addTo(this.map);

        console.log('Marker added to map. Element:', markerElement);
        console.log('Marker element computed styles:', {
            width: window.getComputedStyle(markerElement).width,
            height: window.getComputedStyle(markerElement).height,
            background: window.getComputedStyle(markerElement).background,
            display: window.getComputedStyle(markerElement).display,
            position: window.getComputedStyle(markerElement).position,
            opacity: window.getComputedStyle(markerElement).opacity,
            visibility: window.getComputedStyle(markerElement).visibility
        });

        // Add click functionality if link exists
        if (feature.properties.link) {
            popup.on('open', () => {
                const popupElement = popup.getElement();
                if (popupElement) {
                    const popupContent = popupElement.querySelector('.marker__popup, .popup-content');
                    if (popupContent) {
                        popupContent.style.cursor = 'pointer';
                        popupContent.addEventListener('click', (e) => {
                            if (!e.target.closest('.mapboxgl-popup-close-button')) {
                                window.location.href = feature.properties.link;
                            }
                        });
                    }
                }
            });
        }

        return marker;
    }

    generatePopupHTML(feature) {
        return `
            <img src="${feature.properties.image}" class="marker__popup-img" />
            <div class="marker__popup-content">
                <h4>${feature.properties.title}</h4>
                <p>${feature.properties.description}</p>
            </div>
            <a href="${feature.properties.link}" class="card__link" target="_blank"></a>
        `;
    }

    // Enhanced method to add markers with better data handling
    addMarkers(features, options = {}) {
        console.log('MapManager.addMarkers called with:', features.length, 'features');
        console.log('Options:', options);
        
        // Clear existing markers first
        this.clearMarkers();

        // Auto-center on first valid feature if enabled
        if (this.options.autoCenterOnData && features.length > 0) {
            const firstFeature = features.find(f => f.geometry?.coordinates);
            if (firstFeature) {
                this.map.setCenter(firstFeature.geometry.coordinates);
            }
        }

        // Add a simple test marker to see if markers work at all
        if (features.length === 0) {
            console.log('No features provided, adding test marker...');
            const testFeature = {
                type: "Feature",
                geometry: {
                    type: "Point",
                    coordinates: this.map.getCenter()
                },
                properties: {
                    title: "Test Marker",
                    description: "This is a test marker",
                    image: "https://cdn.prod.website-files.com/66dffceb975388322f140196/67bcaf8a62d1172be49c4000_e21844b19f5eee45e161d9c34c5fc437_cb_placeholder.jpg"
                }
            };
            features.push(testFeature);
        }

        features.forEach((feature, index) => {
            if (!feature.geometry?.coordinates) {
                console.log(`Skipping feature ${index} - no coordinates`);
                return;
            }
            
            console.log(`Creating marker ${index + 1}:`, feature.properties.title, 'at', feature.geometry.coordinates);
            const marker = this.createMarker(feature, options);
            const markerId = feature.properties.id || feature.properties.title || `marker-${Date.now()}-${Math.random()}`;
            
            this.markers.set(markerId, marker);
            this.markerElements.push(marker);
            console.log(`Marker ${index + 1} created successfully`);
        });
        
        console.log('Total markers added:', this.markers.size);
    }

    // Method to add markers from API data (like the preferred implementation)
    addMarkersFromData(data, options = {}) {
        if (!data || !Array.isArray(data)) {
            console.warn('Invalid data provided to addMarkersFromData');
            return;
        }

        const features = data.map(item => ({
            type: "Feature",
            geometry: {
                type: "Point",
                coordinates: [item.longitude, item.latitude],
            },
            properties: {
                id: item.id,
                title: item.title,
                description: item.subtitle || "No description available",
                image: item.image?.responsive_images?.urls?.['320'] || 
                       item.image?.conversions?.thumb?.url ||
                       "https://cdn.prod.website-files.com/66dffceb975388322f140196/67bcaf8a62d1172be49c4000_e21844b19f5eee45e161d9c34c5fc437_cb_placeholder.jpg",
                link: item.link || `https://app.crowdbuilding.com/groups/${item.id}`,
                ...item.properties // Allow additional properties
            },
        })).filter(feature => feature.geometry.coordinates[0] && feature.geometry.coordinates[1]);

        this.addMarkers(features, options);
        return features;
    }

    // Method to highlight a specific marker
    highlightMarker(markerId) {
        this.markers.forEach((marker, id) => {
            const element = marker.getElement();
            if (id === markerId) {
                element.classList.add("highlight-marker");
            } else {
                element.classList.remove("highlight-marker");
            }
        });
    }

    // Method to remove highlight from all markers
    removeHighlight() {
        this.markers.forEach(marker => {
            marker.getElement().classList.remove("highlight-marker");
        });
    }

    // Method to get marker by ID
    getMarker(markerId) {
        return this.markers.get(markerId);
    }

    clearMarkers() {
        this.markers.forEach(marker => marker.remove());
        this.markers.clear();
        this.markerElements = [];
    }

    closeAllPopups() {
        this.markers.forEach(marker => {
            if (marker.getPopup().isOpen()) {
                marker.getPopup().remove();
            }
        });
    }

    handleResize() {
        if (this.map) {
            console.log('Handling map resize...');
            this.map.resize();
        }
    }

    // Method to handle tab visibility changes
    handleTabVisibility() {
        if (this.map) {
            console.log('Handling tab visibility change...');
            // Small delay to ensure the tab is fully visible
            setTimeout(() => {
                this.map.resize();
                console.log('Map resized after tab visibility change');
            }, 100);
        }
    }

    // Method to set center and zoom
    setView(center, zoom = null) {
        if (zoom !== null) {
            this.map.setCenter(center);
            this.map.setZoom(zoom);
        } else {
            this.map.setCenter(center);
        }
    }

    // Method to fit bounds
    fitBounds(bounds, options = {}) {
        this.map.fitBounds(bounds, {
            padding: 50,
            ...options
        });
    }

    destroy() {
        // Remove event listeners
        if (this.options.enableResizeHandler) {
            window.removeEventListener('resize', this.boundHandleResize);
        }
        
        if (this._touchListeners) {
            const { wheel, touchstart, touchend, touchmove, canvas } = this._touchListeners;
            canvas.removeEventListener('wheel', wheel);
            canvas.removeEventListener('touchstart', touchstart);
            canvas.removeEventListener('touchend', touchend);
            canvas.removeEventListener('touchmove', touchmove);
        }

        // Clean up Intersection Observer
        if (this.intersectionObserver) {
            this.intersectionObserver.disconnect();
            this.intersectionObserver = null;
        }

        // Remove from global tracking
        if (window.mapManagers) {
            window.mapManagers.delete(this.containerId);
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

// Helper function to create map with common configurations
window.createMap = (containerId, options = {}) => {
    return new MapManager(containerId, options);
};

// Expose MapManager class globally
window.MapManager = MapManager;

// Global function to handle tab visibility changes
window.handleMapTabVisibility = (containerId) => {
    const mapManager = window.mapManagers?.get(containerId);
    if (mapManager) {
        mapManager.handleTabVisibility();
    }
};

// Global function to resize all maps (useful for tab switches)
window.resizeAllMaps = () => {
    if (window.mapManagers) {
        window.mapManagers.forEach((mapManager, containerId) => {
            console.log(`Resizing map: ${containerId}`);
            mapManager.handleTabVisibility();
        });
    }
};

// Helper function for API token management using the auth module
window.getApiToken = async () => {
    // Check if auth module is available
    if (typeof window.auth !== 'undefined' && window.auth.getApiToken) {
        return await window.auth.getApiToken();
    } else {
        console.warn('Auth module not available. Please include auth.js before using getApiToken.');
        return null;
    }
};

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MapManager;
} 
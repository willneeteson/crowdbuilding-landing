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

        // Dispatch ready event
        this.map.on('load', () => {
            this.map.resize();
            this.container.dispatchEvent(new CustomEvent('mapReady', { detail: { map: this.map, mapManager: this } }));
        });
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
        const markerOptions = {
            className: 'custom-marker',
            popupOffset: 24,
            popupClassName: 'custom-popup',
            ...options
        };

        const markerElement = document.createElement("div");
        markerElement.className = markerOptions.className;

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
        // Clear existing markers first
        this.clearMarkers();

        // Auto-center on first valid feature if enabled
        if (this.options.autoCenterOnData && features.length > 0) {
            const firstFeature = features.find(f => f.geometry?.coordinates);
            if (firstFeature) {
                this.map.setCenter(firstFeature.geometry.coordinates);
            }
        }

        features.forEach(feature => {
            if (!feature.geometry?.coordinates) return;
            
            const marker = this.createMarker(feature, options);
            const markerId = feature.properties.id || feature.properties.title || `marker-${Date.now()}-${Math.random()}`;
            
            this.markers.set(markerId, marker);
            this.markerElements.push(marker);
        });
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
            this.map.resize();
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

// Inject shared map styles
(function() {
    // Check if styles are already injected
    if (document.getElementById('map-styles')) {
        return;
    }

    const style = document.createElement('style');
    style.id = 'map-styles';
    style.textContent = `
/* Shared Map Styles for Crowdbuilding */

/* Base marker styles */
.custom-marker {
    width: 24px;
    height: 24px;
    background: #e74c3c;
    border: 2px solid white;
    border-radius: 50%;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    transition: transform 0.2s ease, box-shadow 0.2s ease;
    cursor: pointer;
}

.custom-marker:hover {
    transform: scale(1.1);
    box-shadow: 0 4px 8px rgba(0,0,0,0.3);
}

/* Highlighted marker state */
.custom-marker.highlight-marker {
    transform: scale(1.2);
    background: #f39c12;
    box-shadow: 0 6px 12px rgba(0,0,0,0.4);
    border-color: #fff;
    z-index: 1000;
}

/* Popup styles */
.custom-popup .mapboxgl-popup-content {
    padding: 0;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    min-width: 250px;
    max-width: 300px;
}

.custom-popup .mapboxgl-popup-close-button {
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
    transition: background-color 0.2s ease;
}

.custom-popup .mapboxgl-popup-close-button:hover {
    background: #f5f5f5;
    color: #333;
}

/* Popup content styles */
.marker__popup {
    position: relative;
}

.marker__popup-img {
    width: 100%;
    height: 150px;
    object-fit: cover;
}

.marker__popup-content {
    padding: 16px;
}

.marker__popup-content h4 {
    margin: 0 0 8px 0;
    font-size: 16px;
    font-weight: 600;
    line-height: 1.4;
    color: #333;
}

.marker__popup-content p {
    margin: 0 0 8px 0;
    font-size: 14px;
    line-height: 1.5;
    color: #666;
}

.marker__popup-address {
    font-size: 14px;
    line-height: 1.5;
    color: #888;
    margin-top: 8px;
}

/* Card link overlay for clickable popups */
.card__link {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 1;
}

/* Map container styles */
#map {
    width: 100%;
    height: 100%;
    min-height: 400px;
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .custom-marker {
        width: 20px;
        height: 20px;
    }
    
    .custom-marker.highlight-marker {
        transform: scale(1.15);
    }
    
    .custom-popup .mapboxgl-popup-content {
        min-width: 200px;
        max-width: 250px;
    }
    
    .marker__popup-img {
        height: 120px;
    }
    
    .marker__popup-content {
        padding: 12px;
    }
    
    .marker__popup-content h4 {
        font-size: 14px;
    }
    
    .marker__popup-content p {
        font-size: 13px;
    }
}

/* Animation for marker appearance */
@keyframes markerAppear {
    from {
        opacity: 0;
        transform: scale(0.5);
    }
    to {
        opacity: 1;
        transform: scale(1);
    }
}

.custom-marker {
    animation: markerAppear 0.3s ease-out;
}

/* Different marker types */
.custom-marker.project-marker {
    background: #3498db;
}

.custom-marker.plot-marker {
    background: #e74c3c;
}

.custom-marker.partner-marker {
    background: #9b59b6;
}

.custom-marker.woonvorm-marker {
    background: #f39c12;
}

/* Loading state for map */
.map-loading {
    position: relative;
}

.map-loading::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 40px;
    height: 40px;
    margin: -20px 0 0 -20px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #3498db;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

/* Project-specific popup styles */
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

.marker__popup-link {
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
    
    document.head.appendChild(style);
})(); 
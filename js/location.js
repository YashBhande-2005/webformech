// Location and Mechanic Finder functionality for Urban Mechanic

class MechanicFinder {
    constructor() {
        this.map = null;
        this.userMarker = null;
        this.mechanicMarkers = [];
        this.infoWindow = null;
        this.mapContainer = null;
        this.mechanics = [
            {
                id: 1,
                name: "Raj Sharma",
                specialization: "Engine Specialist",
                rating: 4.8,
                reviews: 124,
                location: { lat: 19.0760, lng: 72.8777 }, // Mumbai
                distance: 0, // Will be calculated
                eta: 0, // Will be calculated
                available: true,
                services: ["Engine Trouble", "Battery Jump", "Diagnostics"],
                image: "mechanic-avatar.svg"
            },
            {
                id: 2,
                name: "Priya Patel",
                specialization: "Tire Expert",
                rating: 4.9,
                reviews: 89,
                location: { lat: 19.0825, lng: 72.8900 }, // Mumbai
                distance: 0,
                eta: 0,
                available: true,
                services: ["Flat Tyre", "Wheel Alignment", "Tire Replacement"],
                image: "mechanic-avatar.svg"
            },
            {
                id: 3,
                name: "Vikram Singh",
                specialization: "Towing Specialist",
                rating: 4.7,
                reviews: 56,
                location: { lat: 19.0650, lng: 72.8350 }, // Mumbai
                distance: 0,
                eta: 0,
                available: true,
                services: ["Emergency Tow", "Jump Start", "Fuel Delivery"],
                image: "mechanic-avatar.svg"
            },
            {
                id: 4,
                name: "Ananya Desai",
                specialization: "General Mechanic",
                rating: 4.6,
                reviews: 102,
                location: { lat: 19.1000, lng: 72.8600 }, // Mumbai
                distance: 0,
                eta: 0,
                available: true,
                services: ["Engine Trouble", "Battery Jump", "Flat Tyre", "Emergency Tow"],
                image: "mechanic-avatar.svg"
            },
            {
                id: 5,
                name: "Farhan Khan",
                specialization: "Electrical Expert",
                rating: 4.9,
                reviews: 78,
                location: { lat: 19.0720, lng: 72.8550 }, // Mumbai
                distance: 0,
                eta: 0,
                available: true,
                services: ["Battery Jump", "Electrical Issues", "Diagnostics"],
                image: "mechanic-avatar.svg"
            }
        ];
    }

    // Initialize the map and location services
    init(mapContainerId) {
        this.mapContainer = document.getElementById(mapContainerId);
        
        if (!this.mapContainer) {
            console.error('Map container not found');
            return;
        }

        // Check if Google Maps API is loaded
        if (typeof google === 'undefined') {
            this.loadGoogleMapsAPI().then(() => {
                this.initMap();
            }).catch(error => {
                console.error('Error loading Google Maps API:', error);
                this.showError('Failed to load maps. Please try again later.');
            });
        } else {
            this.initMap();
        }
    }

    // Load Google Maps API dynamically
    loadGoogleMapsAPI() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places';
            script.async = true;
            script.defer = true;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    // Initialize the map
    initMap() {
        // Create a map centered on Mumbai
        this.map = new google.maps.Map(this.mapContainer, {
            center: { lat: 19.0760, lng: 72.8777 }, // Mumbai
            zoom: 12,
            styles: [
                {
                    "featureType": "poi",
                    "elementType": "labels",
                    "stylers": [{ "visibility": "off" }]
                }
            ],
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: false
        });

        this.infoWindow = new google.maps.InfoWindow();

        // Try to get user's current location
        this.getUserLocation();
    }

    // Get user's current location with high accuracy
    getUserLocation() {
        if (navigator.geolocation) {
            // High accuracy geolocation options
            const options = {
                enableHighAccuracy: true,    // Use GPS when available
                timeout: 10000,             // 10 second timeout
                maximumAge: 300000          // Cache location for 5 minutes
            };
            
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const userLocation = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    
                    const accuracy = position.coords.accuracy;
                    console.log(`Location found: ${userLocation.lat}, ${userLocation.lng} (accuracy: ${accuracy}m)`);

                    // Center map on user location with accuracy-based zoom
                    if (accuracy && accuracy < 100) {
                        this.map.setZoom(16);  // Higher zoom for accurate locations
                    }
                    this.map.setCenter(userLocation);

                    // Add marker for user location with accuracy
                    this.addUserMarker(userLocation, accuracy);

                    // Find nearby mechanics
                    this.findNearbyMechanics(userLocation);
                },
                (error) => {
                    console.error("High accuracy location failed:", error);
                    
                    // Try again with lower accuracy requirements
                    const fallbackOptions = {
                        enableHighAccuracy: false,
                        timeout: 5000,
                        maximumAge: 600000    // Cache for 10 minutes
                    };
                    
                    navigator.geolocation.getCurrentPosition(
                        (position) => {
                            const userLocation = {
                                lat: position.coords.latitude,
                                lng: position.coords.longitude
                            };
                            
                            const accuracy = position.coords.accuracy;
                            console.log(`Fallback location found: ${userLocation.lat}, ${userLocation.lng} (accuracy: ${accuracy}m)`);
                            
                            this.map.setCenter(userLocation);
                            this.addUserMarker(userLocation, accuracy);
                            this.findNearbyMechanics(userLocation);
                        },
                        (fallbackError) => {
                            this.handleLocationError(true, fallbackError);
                        },
                        fallbackOptions
                    );
                },
                options
            );
        } else {
            // Browser doesn't support Geolocation
            this.handleLocationError(false);
        }
    }

    // Handle location error with detailed messages
    handleLocationError(browserHasGeolocation, error = null) {
        let errorMessage;
        
        if (error) {
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    errorMessage = 'Location access denied. Please allow location access and refresh the page for accurate results.';
                    break;
                case error.POSITION_UNAVAILABLE:
                    errorMessage = 'Location information is unavailable. Using default Mumbai location.';
                    break;
                case error.TIMEOUT:
                    errorMessage = 'Location request timed out. Using default Mumbai location.';
                    break;
                default:
                    errorMessage = 'Unable to retrieve location. Using default Mumbai location.';
                    break;
            }
        } else {
            errorMessage = browserHasGeolocation
                ? 'Error: The Geolocation service failed. Using default Mumbai location.'
                : 'Error: Your browser doesn\'t support geolocation. Using default Mumbai location.';
        }
        
        this.showError(errorMessage);
        
        // Use default location (Mumbai)
        const defaultLocation = { lat: 19.0760, lng: 72.8777 };
        this.addUserMarker(defaultLocation, null);
        this.findNearbyMechanics(defaultLocation);
    }

    // Show error message
    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'map-error';
        errorDiv.textContent = message;
        this.mapContainer.appendChild(errorDiv);
    }

    // Add marker for user location with accuracy information
    addUserMarker(location, accuracy = null) {
        if (this.userMarker) {
            this.userMarker.setMap(null);
        }

        this.userMarker = new google.maps.Marker({
            position: location,
            map: this.map,
            icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 10,
                fillColor: '#4285F4',
                fillOpacity: 1,
                strokeColor: '#FFFFFF',
                strokeWeight: 2
            },
            title: 'Your Location'
        });

        // Add accuracy circle if available
        if (accuracy && accuracy > 0) {
            const accuracyCircle = new google.maps.Circle({
                strokeColor: '#4285F4',
                strokeOpacity: 0.8,
                strokeWeight: 2,
                fillColor: '#4285F4',
                fillOpacity: 0.15,
                map: this.map,
                center: location,
                radius: accuracy
            });
        }

        // Add info window for user marker with accuracy info
        google.maps.event.addListener(this.userMarker, 'click', () => {
            const content = accuracy 
                ? `<div class="info-window"><strong>Your Location</strong><br><small>Accuracy: ±${Math.round(accuracy)}m</small></div>`
                : '<div class="info-window"><strong>Your Location</strong><br><small>(Default: Mumbai)</small></div>';
            
            this.infoWindow.setContent(content);
            this.infoWindow.open(this.map, this.userMarker);
        });
    }

    // Find nearby mechanics
    findNearbyMechanics(userLocation) {
        // Clear existing mechanic markers
        this.clearMechanicMarkers();

        // Calculate distance and ETA for each mechanic
        this.mechanics.forEach(mechanic => {
            // Calculate distance (simplified version - in a real app, use Distance Matrix API)
            mechanic.distance = this.calculateDistance(
                userLocation.lat, userLocation.lng,
                mechanic.location.lat, mechanic.location.lng
            );

            // Calculate ETA (simplified - approximately 2 mins per km)
            mechanic.eta = Math.round(mechanic.distance * 2);

            // Add marker for this mechanic
            this.addMechanicMarker(mechanic);
        });

        // Sort mechanics by distance
        const sortedMechanics = [...this.mechanics].sort((a, b) => a.distance - b.distance);

        // Display mechanics list
        this.displayMechanicsList(sortedMechanics);
    }

    // Calculate distance between two points using Haversine formula
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Radius of the earth in km
        const dLat = this.deg2rad(lat2 - lat1);
        const dLon = this.deg2rad(lon2 - lon1);
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c; // Distance in km
        return Math.round(distance * 10) / 10; // Round to 1 decimal place
    }

    // Convert degrees to radians
    deg2rad(deg) {
        return deg * (Math.PI/180);
    }

    // Add marker for mechanic
    addMechanicMarker(mechanic) {
        const marker = new google.maps.Marker({
            position: mechanic.location,
            map: this.map,
            icon: {
                url: 'https://maps.google.com/mapfiles/ms/icons/yellow-dot.png'
            },
            title: mechanic.name
        });

        // Add info window for mechanic marker
        google.maps.event.addListener(marker, 'click', () => {
            const content = `
                <div class="info-window mechanic-info">
                    <h3>${mechanic.name}</h3>
                    <p>${mechanic.specialization}</p>
                    <div class="mechanic-rating">
                        <span class="stars">${this.getStarRating(mechanic.rating)}</span>
                        <span class="rating-value">${mechanic.rating}</span>
                        <span class="reviews">(${mechanic.reviews} reviews)</span>
                    </div>
                    <div class="mechanic-distance">
                        <strong>${mechanic.distance} km away</strong> • ETA: ${mechanic.eta} mins
                    </div>
                    <div class="mechanic-services">
                        <strong>Services:</strong> ${mechanic.services.join(', ')}
                    </div>
                    <button class="btn-primary book-mechanic" data-id="${mechanic.id}">Book Now</button>
                </div>
            `;
            this.infoWindow.setContent(content);
            this.infoWindow.open(this.map, marker);

            // Add event listener to the Book Now button
            setTimeout(() => {
                const bookButton = document.querySelector(`.book-mechanic[data-id="${mechanic.id}"]`);
                if (bookButton) {
                    bookButton.addEventListener('click', () => {
                        this.bookMechanic(mechanic);
                    });
                }
            }, 100);
        });

        this.mechanicMarkers.push(marker);
    }

    // Clear all mechanic markers from the map
    clearMechanicMarkers() {
        this.mechanicMarkers.forEach(marker => {
            marker.setMap(null);
        });
        this.mechanicMarkers = [];
    }

    // Generate star rating HTML
    getStarRating(rating) {
        const fullStars = Math.floor(rating);
        const halfStar = rating % 1 >= 0.5;
        const emptyStars = 5 - fullStars - (halfStar ? 1 : 0);
        
        let starsHtml = '';
        
        // Add full stars
        for (let i = 0; i < fullStars; i++) {
            starsHtml += '<i class="fas fa-star"></i>';
        }
        
        // Add half star if needed
        if (halfStar) {
            starsHtml += '<i class="fas fa-star-half-alt"></i>';
        }
        
        // Add empty stars
        for (let i = 0; i < emptyStars; i++) {
            starsHtml += '<i class="far fa-star"></i>';
        }
        
        return starsHtml;
    }

    // Display list of mechanics
    displayMechanicsList(mechanics) {
        const mechanicsListContainer = document.getElementById('mechanics-list');
        if (!mechanicsListContainer) return;

        mechanicsListContainer.innerHTML = '';

        mechanics.forEach(mechanic => {
            const mechanicCard = document.createElement('div');
            mechanicCard.className = 'mechanic-card';
            mechanicCard.innerHTML = `
                <div class="mechanic-card-inner">
                    <div class="mechanic-avatar">
                        <img src="${mechanic.image}" alt="${mechanic.name}">
                        <div class="mechanic-status ${mechanic.available ? 'available' : 'busy'}"></div>
                    </div>
                    <div class="mechanic-details">
                        <h3>${mechanic.name}</h3>
                        <p>${mechanic.specialization}</p>
                        <div class="mechanic-rating">
                            <span class="stars">${this.getStarRating(mechanic.rating)}</span>
                            <span class="rating-value">${mechanic.rating}</span>
                            <span class="reviews">(${mechanic.reviews})</span>
                        </div>
                        <div class="mechanic-distance">
                            <strong>${mechanic.distance} km away</strong> • ETA: ${mechanic.eta} mins
                        </div>
                    </div>
                </div>
                <div class="mechanic-services">
                    <strong>Services:</strong> ${mechanic.services.join(', ')}
                </div>
                <button class="btn-primary book-mechanic" data-id="${mechanic.id}">Book Now</button>
            `;

            mechanicCard.querySelector('.book-mechanic').addEventListener('click', () => {
                this.bookMechanic(mechanic);
            });

            mechanicsListContainer.appendChild(mechanicCard);
        });
    }

    // Book a mechanic
    bookMechanic(mechanic) {
        // In a real app, this would open a booking form or process the booking
        alert(`Booking ${mechanic.name} for service. ETA: ${mechanic.eta} minutes.`);
        // Here you would typically open a modal with booking details or redirect to a booking page
    }
}

// Export the MechanicFinder class
window.MechanicFinder = MechanicFinder;
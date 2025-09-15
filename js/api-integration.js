// API Integration for Urban Mechanic
class UrbanMechanicAPI {
    constructor() {
        this.baseURL = window.location.origin + '/api/v1';
        this.token = localStorage.getItem('token');
    }

    // Set authentication token
    setToken(token) {
        this.token = token;
        localStorage.setItem('token', token);
    }

    // Get authentication headers
    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        
        return headers;
    }

    // Generic API request method
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: this.getHeaders(),
            ...options
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // Find nearby mechanics by coordinates
    async findNearbyMechanics(latitude, longitude, radius = 10, serviceType = null) {
        const body = { latitude, longitude, radius, serviceType };
        const res = await this.request('/mechanics/nearby', {
            method: 'POST',
            body: JSON.stringify(body)
        });
        // Normalize to expected shape for find-mechanic page
        const mapped = (res.data || []).map(m => {
            const coords = m.location && Array.isArray(m.location.coordinates) ? m.location.coordinates : [0,0];
            const user = m.user || {};
            return {
                _id: m._id,
                name: user.name || 'Mechanic',
                email: user.email,
                rating: m.rating || 0,
                reviewCount: m.reviewCount || 0,
                services: m.services || [],
                isAvailable: m.isAvailable !== false,
                location: { coordinates: coords }
            };
        });
        return { success: true, data: mapped };
    }

    // Create service request and notify nearby mechanics
    async requestHelp(serviceData) {
        return await this.request('/service-requests/request-help', {
            method: 'POST',
            body: JSON.stringify(serviceData)
        });
    }

    // Get mechanic notifications (for mechanic dashboard)
    async getMechanicNotifications(mechanicId) {
        return await this.request(`/mechanics/${mechanicId}/notifications`);
    }

    // Accept service request (for mechanics)
    async acceptServiceRequest(requestId, estimatedCost = 0) {
        return await this.request(`/service-requests/${requestId}/accept`, {
            method: 'PUT',
            body: JSON.stringify({ estimatedCost })
        });
    }

    // Update mechanic availability
    async updateMechanicAvailability(mechanicId, availability, isAvailable) {
        return await this.request(`/mechanics/${mechanicId}/availability`, {
            method: 'PUT',
            body: JSON.stringify({ availability, isAvailable })
        });
    }

    // Get all mechanics
    async getAllMechanics() {
        return await this.request('/mechanics');
    }

    // Get single mechanic
    async getMechanic(mechanicId) {
        return await this.request(`/mechanics/${mechanicId}`);
    }

    // Create mechanic profile
    async createMechanic(mechanicData) {
        return await this.request('/mechanics', {
            method: 'POST',
            body: JSON.stringify(mechanicData)
        });
    }

    // User authentication
    async login(credentials) {
        const response = await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        });

        if (response.token) {
            this.setToken(response.token);
        }

        return response;
    }

    async register(userData) {
        const response = await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });

        if (response.token) {
            this.setToken(response.token);
        }

        return response;
    }

    async forgotPassword(email) {
        return await this.request('/auth/forgotpassword', {
            method: 'POST',
            body: JSON.stringify({ email })
        });
    }

    async getCurrentUser() {
        return await this.request('/auth/me');
    }

    // Logout
    logout() {
        this.token = null;
        localStorage.removeItem('token');
    }

    // Check if user is authenticated
    isAuthenticated() {
        return !!this.token;
    }
}

// Global API instance
window.urbanMechanicAPI = new UrbanMechanicAPI();

// Utility functions for the frontend
class MechanicFinder {
    constructor() {
        this.api = window.urbanMechanicAPI;
        this.currentLocation = null;
        this.nearbyMechanics = [];
    }

    // Find and display nearby mechanics
    async findNearbyMechanics(latitude, longitude, serviceType = null) {
        try {
            const response = await this.api.findNearbyMechanics(latitude, longitude, 10, serviceType);
            this.nearbyMechanics = response.data;
            return response.data;
        } catch (error) {
            console.error('Failed to find nearby mechanics:', error);
            throw error;
        }
    }

    // Request help and notify nearby mechanics
    async requestHelp(serviceData) {
        try {
            const response = await this.api.requestHelp(serviceData);
            return response;
        } catch (error) {
            console.error('Failed to request help:', error);
            throw error;
        }
    }

    // Format mechanic data for display
    formatMechanicForDisplay(mechanic) {
        const user = mechanic.user;
        const location = mechanic.location;
        
        return {
            id: mechanic._id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            rating: mechanic.rating,
            reviewCount: mechanic.reviewCount,
            services: mechanic.servicesOffered,
            specializations: mechanic.specializations,
            experience: mechanic.experience,
            hourlyRate: mechanic.hourlyRate,
            isAvailable: mechanic.isAvailable,
            location: {
                coordinates: location.coordinates,
                formattedAddress: location.formattedAddress
            }
        };
    }

    // Calculate distance between two coordinates
    calculateDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // Radius of the Earth in kilometers
        const dLat = this.deg2rad(lat2 - lat1);
        const dLon = this.deg2rad(lon2 - lon1);
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c; // Distance in kilometers
        return distance;
    }

    deg2rad(deg) {
        return deg * (Math.PI/180);
    }

    // Generate ETA based on distance
    calculateETA(distance) {
        // Rough calculation: 4 minutes per km + 5 minutes base time
        return Math.round(distance * 4 + 5);
    }
}

// Global mechanic finder instance
window.mechanicFinder = new MechanicFinder();

// Notification system for real-time updates
class NotificationSystem {
    constructor() {
        this.notifications = [];
        this.isPolling = false;
        this.pollInterval = null;
    }

    // Start polling for notifications (for mechanics)
    startPolling(mechanicId, interval = 30000) { // 30 seconds
        if (this.isPolling) {
            this.stopPolling();
        }

        this.isPolling = true;
        this.pollInterval = setInterval(async () => {
            try {
                const response = await window.urbanMechanicAPI.getMechanicNotifications(mechanicId);
                if (response.data && response.data.length > 0) {
                    this.handleNewNotifications(response.data);
                }
            } catch (error) {
                console.error('Failed to fetch notifications:', error);
            }
        }, interval);
    }

    // Stop polling for notifications
    stopPolling() {
        if (this.pollInterval) {
            clearInterval(this.pollInterval);
            this.pollInterval = null;
        }
        this.isPolling = false;
    }

    // Handle new notifications
    handleNewNotifications(notifications) {
        notifications.forEach(notification => {
            this.showNotification(notification);
        });
    }

    // Show notification to user
    showNotification(notification) {
        // Create notification element
        const notificationEl = document.createElement('div');
        notificationEl.className = 'notification-popup';
        notificationEl.innerHTML = `
            <div class="notification-content">
                <div class="notification-header">
                    <h4>New Service Request</h4>
                    <button class="close-notification">&times;</button>
                </div>
                <div class="notification-body">
                    <p><strong>Service:</strong> ${notification.serviceType}</p>
                    <p><strong>Description:</strong> ${notification.description}</p>
                    <p><strong>Customer:</strong> ${notification.customer.name}</p>
                    <p><strong>Location:</strong> ${notification.location.formattedAddress || 'Near your area'}</p>
                </div>
                <div class="notification-actions">
                    <button class="btn-accept" data-request-id="${notification._id}">Accept Request</button>
                    <button class="btn-dismiss">Dismiss</button>
                </div>
            </div>
        `;

        // Add styles
        notificationEl.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: white;
            border-radius: 10px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.2);
            z-index: 10000;
            max-width: 400px;
            animation: slideInRight 0.3s ease-out;
        `;

        // Add to page
        document.body.appendChild(notificationEl);

        // Add event listeners
        notificationEl.querySelector('.close-notification').addEventListener('click', () => {
            notificationEl.remove();
        });

        notificationEl.querySelector('.btn-dismiss').addEventListener('click', () => {
            notificationEl.remove();
        });

        notificationEl.querySelector('.btn-accept').addEventListener('click', async (e) => {
            const requestId = e.target.getAttribute('data-request-id');
            try {
                await window.urbanMechanicAPI.acceptServiceRequest(requestId);
                notificationEl.remove();
                this.showSuccessMessage('Service request accepted successfully!');
            } catch (error) {
                this.showErrorMessage('Failed to accept service request');
            }
        });

        // Auto remove after 30 seconds
        setTimeout(() => {
            if (notificationEl.parentNode) {
                notificationEl.remove();
            }
        }, 30000);
    }

    // Show success message
    showSuccessMessage(message) {
        this.showMessage(message, 'success');
    }

    // Show error message
    showErrorMessage(message) {
        this.showMessage(message, 'error');
    }

    // Show generic message
    showMessage(message, type = 'info') {
        const messageEl = document.createElement('div');
        messageEl.className = `message-popup ${type}`;
        messageEl.textContent = message;
        messageEl.style.cssText = `
            position: fixed;
            top: 20px;
            left: 50%;
            transform: translateX(-50%);
            background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
            color: white;
            padding: 15px 25px;
            border-radius: 5px;
            z-index: 10001;
            animation: slideInDown 0.3s ease-out;
        `;

        document.body.appendChild(messageEl);

        setTimeout(() => {
            messageEl.remove();
        }, 3000);
    }
}

// Global notification system
window.notificationSystem = new NotificationSystem();

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideInDown {
        from {
            transform: translateX(-50%) translateY(-100%);
            opacity: 0;
        }
        to {
            transform: translateX(-50%) translateY(0);
            opacity: 1;
        }
    }

    .notification-content {
        padding: 20px;
    }

    .notification-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 15px;
    }

    .notification-header h4 {
        margin: 0;
        color: #333;
    }

    .close-notification {
        background: none;
        border: none;
        font-size: 20px;
        cursor: pointer;
        color: #666;
    }

    .notification-body p {
        margin: 5px 0;
        font-size: 14px;
        color: #666;
    }

    .notification-actions {
        display: flex;
        gap: 10px;
        margin-top: 15px;
    }

    .btn-accept, .btn-dismiss {
        padding: 8px 16px;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        font-size: 14px;
    }

    .btn-accept {
        background: #4CAF50;
        color: white;
    }

    .btn-dismiss {
        background: #f44336;
        color: white;
    }
`;
document.head.appendChild(style);


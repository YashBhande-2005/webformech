// DOM Elements
document.addEventListener('DOMContentLoaded', function() {
    // Registration Form Handling
    const registrationForm = document.getElementById('registrationForm');
    if (registrationForm) {
        registrationForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const formData = new FormData(registrationForm);
            const mechanicData = {};
            
            for (const [key, value] of formData.entries()) {
                mechanicData[key] = value;
            }
            
            // Validate passwords match
            if (mechanicData.password !== mechanicData.confirmPassword) {
                alert('Passwords do not match!');
                return;
            }
            
            // In a real application, you would send this data to a server
            console.log('Registration data:', mechanicData);
            
            // For demo purposes, save to localStorage
            localStorage.setItem('mechanicData', JSON.stringify(mechanicData));
            
            // Show success message and redirect
            alert('Registration successful! You can now log in.');
            window.location.href = 'login.html';
        });
    }
    
    // Login Form Handling (legacy demo only). Skip if real API is available.
    const loginForm = document.getElementById('loginForm');
    if (loginForm && !(window.API && window.API.auth && typeof window.API.auth.login === 'function')) {
        loginForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            
            // Demo-only local validation
            const storedData = localStorage.getItem('mechanicData');
            
            if (storedData) {
                const mechanicData = JSON.parse(storedData);
                
                if (email === mechanicData.email && password === mechanicData.password) {
                    localStorage.setItem('isLoggedIn', 'true');
                    window.location.href = 'dashboard.html';
                } else {
                    alert('Invalid email or password!');
                }
            } else {
                alert('No registered user found. Please register first.');
                window.location.href = 'register.html';
            }
        });
    }
    
    // Dashboard Initialization
    if (window.location.pathname.includes('dashboard.html')) {
        // Check if user is logged in
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = 'login.html';
            return;
        }
        
        // Load mechanic data
        const storedData = localStorage.getItem('mechanicData');
        if (storedData) {
            const mechanicData = JSON.parse(storedData);
            document.getElementById('mechanic-name').textContent = mechanicData.fullName;
        }
        
        // Show notification after a delay
        setTimeout(showNotification, 5000);
    }
    
    // Logout functionality
    const logoutButton = document.getElementById('logout');
    if (logoutButton) {
        logoutButton.addEventListener('click', function(e) {
            e.preventDefault();
            localStorage.removeItem('token');
            window.location.href = 'index.html';
        });
    }
    
    // Contact Form Handling
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            // Get form data
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const message = document.getElementById('message').value;
            
            // In a real application, you would send this data to a server
            console.log('Contact form data:', { name, email, message });
            
            // Show success message
            alert('Thank you for your message! We will get back to you soon.');
            contactForm.reset();
        });
    }
    
    // Notification handling
    const liveNotification = document.getElementById('live-notification');
    if (liveNotification) {
        const closeButton = liveNotification.querySelector('.notification-close');
        closeButton.addEventListener('click', function() {
            liveNotification.classList.remove('show');
        });
    }
});

// Function to show notification
function showNotification() {
    const notification = document.getElementById('live-notification');
    if (notification) {
        notification.classList.add('show');
        
        // Auto-hide after 10 seconds
        setTimeout(function() {
            notification.classList.remove('show');
        }, 10000);
    }
}

// Function to simulate receiving a new notification
function receiveNewNotification(title, message) {
    const notification = document.getElementById('live-notification');
    if (notification) {
        const notificationTitle = notification.querySelector('h4');
        const notificationMessage = notification.querySelector('p');
        
        notificationTitle.textContent = title;
        notificationMessage.textContent = message;
        
        notification.classList.add('show');
        
        // Auto-hide after 10 seconds
        setTimeout(function() {
            notification.classList.remove('show');
        }, 10000);
    }
}

// Simulate receiving notifications from external source (e.g., WebSocket)
// In a real application, this would be connected to a backend service
function simulateIncomingNotifications() {
    // Only run on dashboard page
    if (!window.location.pathname.includes('dashboard.html')) return;
    
    const notifications = [
        { title: 'New Service Request', message: 'Customer Alex Thompson is looking for a mechanic for transmission repair.' },
        { title: 'Appointment Reminder', message: 'You have an appointment with Lisa Johnson tomorrow at 3:00 PM.' },
        { title: 'New Review', message: 'Customer Michael Brown has left a new review for your services.' }
    ];
    
    // Show random notification every 30-60 seconds
    setInterval(function() {
        const randomIndex = Math.floor(Math.random() * notifications.length);
        const notification = notifications[randomIndex];
        receiveNewNotification(notification.title, notification.message);
    }, Math.random() * 30000 + 30000); // Random time between 30-60 seconds
}

// Start notification simulation after page load
window.addEventListener('load', function() {
    // Simulate WebSocket connection for real-time notifications
    setTimeout(simulateIncomingNotifications, 10000);
});

// Function to handle nearby mechanic finder integration
function findNearbyMechanics(latitude, longitude, radius) {
    // In a real application, this would make an API call to a backend service
    // that would query a database for mechanics within the specified radius
    console.log(`Finding mechanics near: ${latitude}, ${longitude} within ${radius}km`);
    
    // Simulate API response
    return new Promise((resolve) => {
        setTimeout(() => {
            // Mock data for demonstration
            const nearbyMechanics = [
                {
                    id: 1,
                    name: 'John Doe',
                    specialization: 'General Auto Repair',
                    rating: 4.8,
                    distance: 2.3, // km
                    available: true
                },
                {
                    id: 2,
                    name: 'Jane Smith',
                    specialization: 'Engine Specialist',
                    rating: 4.9,
                    distance: 3.7, // km
                    available: true
                },
                {
                    id: 3,
                    name: 'Robert Johnson',
                    specialization: 'Electrical Systems',
                    rating: 4.6,
                    distance: 4.1, // km
                    available: false
                }
            ];
            
            resolve(nearbyMechanics);
        }, 1000);
    });
}

// Function to handle notification when user clicks "Find my nearby mechanic"
function notifyMechanics(userLocation, serviceNeeded) {
    // In a real application, this would send notifications to mechanics in the area
    console.log(`Notifying mechanics near ${userLocation} for ${serviceNeeded}`);
    
    // Simulate sending notifications
    return new Promise((resolve) => {
        setTimeout(() => {
            // Mock response
            resolve({
                success: true,
                notifiedMechanics: 5,
                estimatedResponseTime: '5-10 minutes'
            });
        }, 1500);
    });
}

// Export functions for external use
window.MechConnect = {
    findNearbyMechanics,
    notifyMechanics
};
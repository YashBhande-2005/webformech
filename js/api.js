/**
 * Urban Mechanic Partners API Integration
 * This file handles all API calls to the backend
 */

const API_URL = 'http://localhost:3000/api/v1';

// Auth API calls
const auth = {
  // Register a new user
  register: async (userData) => {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });
      return await response.json();
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  },

  // Login user
  login: async (credentials) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      });
      const raw = await response.text();
      let data = {};
      try {
        data = raw ? JSON.parse(raw) : {};
      } catch (e) {
        // Non-JSON response body
        if (!response.ok) {
          throw new Error(raw || `HTTP ${response.status}`);
        }
        throw e;
      }
      if (!response.ok) {
        const msg = data.message || data.error || `HTTP ${response.status}`;
        throw new Error(msg);
      }
      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  // Logout user
  logout: async () => {
    try {
      const response = await fetch(`${API_URL}/auth/logout`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      localStorage.removeItem('token');
      return await response.json();
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  },

  // Get current user
  getMe: async () => {
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      return await response.json();
    } catch (error) {
      console.error('Get current user error:', error);
      throw error;
    }
  },

  // Update user details
  updateUserDetails: async (userData) => {
    try {
      const response = await fetch(`${API_URL}/auth/updatedetails`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(userData)
      });
      return await response.json();
    } catch (error) {
      console.error('Update user details error:', error);
      throw error;
    }
  },

  // Update password
  updatePassword: async (passwordData) => {
    try {
      const response = await fetch(`${API_URL}/auth/updatepassword`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(passwordData)
      });
      return await response.json();
    } catch (error) {
      console.error('Update password error:', error);
      throw error;
    }
  },

  // Forgot password
  forgotPassword: async (email) => {
    try {
      const response = await fetch(`${API_URL}/auth/forgotpassword`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });
      return await response.json();
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    }
  },

  // Reset password
  resetPassword: async (resetToken, password) => {
    try {
      const response = await fetch(`${API_URL}/auth/resetpassword/${resetToken}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password })
      });
      return await response.json();
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  }
};

// Mechanic API calls
const mechanics = {
  // Get all mechanics
  getAllMechanics: async (query = '') => {
    try {
      const response = await fetch(`${API_URL}/mechanics${query}`);
      return await response.json();
    } catch (error) {
      console.error('Get all mechanics error:', error);
      throw error;
    }
  },

  // Get single mechanic
  getMechanic: async (id) => {
    try {
      const response = await fetch(`${API_URL}/mechanics/${id}`);
      return await response.json();
    } catch (error) {
      console.error('Get mechanic error:', error);
      throw error;
    }
  },

  // Create mechanic profile
  createMechanicProfile: async (mechanicData) => {
    try {
      const response = await fetch(`${API_URL}/mechanics`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(mechanicData)
      });
      return await response.json();
    } catch (error) {
      console.error('Create mechanic profile error:', error);
      throw error;
    }
  },

  // Update mechanic profile
  updateMechanicProfile: async (id, mechanicData) => {
    try {
      const response = await fetch(`${API_URL}/mechanics/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(mechanicData)
      });
      return await response.json();
    } catch (error) {
      console.error('Update mechanic profile error:', error);
      throw error;
    }
  },

  // Delete mechanic profile
  deleteMechanicProfile: async (id) => {
    try {
      const response = await fetch(`${API_URL}/mechanics/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      return await response.json();
    } catch (error) {
      console.error('Delete mechanic profile error:', error);
      throw error;
    }
  },

  // Update mechanic availability
  updateAvailability: async (id, availabilityData) => {
    try {
      const response = await fetch(`${API_URL}/mechanics/${id}/availability`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(availabilityData)
      });
      return await response.json();
    } catch (error) {
      console.error('Update availability error:', error);
      throw error;
    }
  },

  // Get mechanics within radius
  getMechanicsInRadius: async (zipcode, distance) => {
    try {
      const response = await fetch(`${API_URL}/mechanics/radius/${zipcode}/${distance}`);
      return await response.json();
    } catch (error) {
      console.error('Get mechanics in radius error:', error);
      throw error;
    }
  }
};

// Service Request API calls
const serviceRequests = {
  // Get all service requests
  getAll: async (query = '') => {
    try {
      const response = await fetch(`${API_URL}/service-requests${query}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      return await response.json();
    } catch (error) {
      console.error('Get all service requests error:', error);
      throw error;
    }
  },

  // Get mechanic service requests
  getMechanicRequests: async (mechanicId, query = '') => {
    try {
      const response = await fetch(`${API_URL}/mechanics/${mechanicId}/service-requests${query}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      return await response.json();
    } catch (error) {
      console.error('Get mechanic service requests error:', error);
      throw error;
    }
  },

  // Get customer's service requests
  getMyRequests: async (query = '') => {
    try {
      const response = await fetch(`${API_URL}/service-requests/my-requests${query}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      return await response.json();
    } catch (error) {
      console.error('Get my service requests error:', error);
      throw error;
    }
  },

  // Get single service request
  getRequest: async (id) => {
    try {
      const response = await fetch(`${API_URL}/service-requests/${id}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      return await response.json();
    } catch (error) {
      console.error('Get service request error:', error);
      throw error;
    }
  },

  // Create service request
  createRequest: async (serviceRequestData) => {
    try {
      const response = await fetch(`${API_URL}/service-requests`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(serviceRequestData)
      });
      return await response.json();
    } catch (error) {
      console.error('Create service request error:', error);
      throw error;
    }
  },

  // Update service request
  updateServiceRequest: async (id, serviceRequestData) => {
    try {
      const response = await fetch(`${API_URL}/service-requests/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(serviceRequestData)
      });
      return await response.json();
    } catch (error) {
      console.error('Update service request error:', error);
      throw error;
    }
  },

  // Delete service request
  deleteServiceRequest: async (id) => {
    try {
      const response = await fetch(`${API_URL}/service-requests/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      return await response.json();
    } catch (error) {
      console.error('Delete service request error:', error);
      throw error;
    }
  },

  // Accept service request (for mechanics)
  acceptRequest: async (id, estimatedCost) => {
    try {
      const response = await fetch(`${API_URL}/service-requests/${id}/accept`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ estimatedCost })
      });
      return await response.json();
    } catch (error) {
      console.error('Accept service request error:', error);
      throw error;
    }
  }
};

// Review API calls
const reviews = {
  // Get all reviews
  getAll: async (query = '') => {
    try {
      const response = await fetch(`${API_URL}/reviews${query}`);
      return await response.json();
    } catch (error) {
      console.error('Get all reviews error:', error);
      throw error;
    }
  },

  // Get mechanic reviews
  getMechanicReviews: async (mechanicId, query = '') => {
    try {
      const response = await fetch(`${API_URL}/mechanics/${mechanicId}/reviews${query}`);
      return await response.json();
    } catch (error) {
      console.error('Get mechanic reviews error:', error);
      throw error;
    }
  },

  // Get single review
  getReview: async (id) => {
    try {
      const response = await fetch(`${API_URL}/reviews/${id}`);
      return await response.json();
    } catch (error) {
      console.error('Get review error:', error);
      throw error;
    }
  },

  // Add review
  createReview: async (reviewData) => {
    try {
      const response = await fetch(`${API_URL}/mechanics/${reviewData.mechanic}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(reviewData)
      });
      return await response.json();
    } catch (error) {
      console.error('Add review error:', error);
      throw error;
    }
  },

  // Update review
  updateReview: async (id, reviewData) => {
    try {
      const response = await fetch(`${API_URL}/reviews/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(reviewData)
      });
      return await response.json();
    } catch (error) {
      console.error('Update review error:', error);
      throw error;
    }
  },

  // Delete review
  deleteReview: async (id) => {
    try {
      const response = await fetch(`${API_URL}/reviews/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      return await response.json();
    } catch (error) {
      console.error('Delete review error:', error);
      throw error;
    }
  }
};

// Export all API modules
const API = {
  auth,
  mechanics,
  serviceRequests,
  reviews
};

// Make API available globally
window.API = API;

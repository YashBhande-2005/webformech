// API integration for other website
const API_URL = 'http://localhost:3000/api/v1';

const auth = {
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
  }
};

window.API = { auth };

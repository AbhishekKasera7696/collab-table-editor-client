export const API_BASE_URL = (() => {
  // For production
  if (window.location.hostname.includes('vercel.app')) {
    return 'https://collab-table-editor-production.up.railway.app/api';
  }
  
  // For local development
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:3001/api';
  }
  
  // Fallback to production
  return 'https://collab-table-editor-production.up.railway.app/api';
})();

export const login = async (username) => {
  try {
    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      mode: 'cors', // Explicitly set CORS mode
      credentials: 'include', // Include credentials if needed
      body: JSON.stringify({ username }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
  } catch (error) {
    console.error("API Login failed:", error);
    throw error;
  }
};
    

export const getDocument = async () => {
  const response = await fetch(`${API_BASE_URL}/document`, {
    mode: 'cors',
    credentials: 'include'
  });
  return response.json();
};

export const updateDocument = async (document) => {
  const response = await fetch(`${API_BASE_URL}/document`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    mode: 'cors',
    credentials: 'include',
    body: JSON.stringify({ content: document }),
  });
  return response.json();
};

export const logout = async (username) => {
  const response = await fetch(`${API_BASE_URL}/logout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    mode: 'cors',
    credentials: 'include',
    body: JSON.stringify({ username }),
  });
  return response.json();
};
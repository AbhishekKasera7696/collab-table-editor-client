export const API_BASE_URL = 
  window.location.hostname === 'localhost'
    ? 'http://localhost:3001/api'
    : 'https://collab-table-editor-production.up.railway.app/api';

    export const login = async (username) => {
      try {
        const response = await fetch(`${API_BASE_URL}/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
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
  const response = await fetch(`${API_BASE_URL}/document`);
  return response.json();
};

export const updateDocument = async (document) => {
  const response = await fetch(`${API_BASE_URL}/document`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content: document }),
  });
  return response.json();
};
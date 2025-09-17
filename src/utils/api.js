export const API_BASE_URL = 'http://localhost:3001/api';

export const login = async (username) => {
  const response = await fetch(`${API_BASE_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username }),
  });
  return response.json();
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
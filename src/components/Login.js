import React, { useState } from 'react';
import { login } from '../utils/api';
import { initializeSocket, joinRoom } from '../utils/socket';

const Login = ({ onLogin }) => {
  const [username, setUsername] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (username.trim()) {
      try {
        const response = await login(username);
        if (response.success) {
          initializeSocket();
          joinRoom(username);
          onLogin(username);
        }
      } catch (error) {
        console.error('Login error:', error);
      }
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h2>Login to Table Editor</h2>
        <input
          type="text"
          placeholder="Enter your username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <button type="submit">Login</button>
      </form>
    </div>
  );
};

export default Login;
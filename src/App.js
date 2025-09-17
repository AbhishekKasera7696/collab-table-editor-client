import React, { useState } from 'react';
import Login from './components/Login';
import TableEditor from './components/TableEditor';
import './App.css';

function App() {
  const [username, setUsername] = useState(null);

  const handleLogin = (user) => {
    setUsername(user);
  };

  const handleLogout = () => {
    setUsername(null);
  };

  return (
    <div className="App">
      {!username ? (
        <Login onLogin={handleLogin} />
      ) : (
        <TableEditor username={username} onLogout={handleLogout} />
      )}
    </div>
  );
}

export default App;
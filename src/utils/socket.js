import io from 'socket.io-client';

let socket = null;

export const initializeSocket = () => {
  const backendUrl =
    window.location.hostname === 'localhost'
      ? 'http://localhost:3001'
      : 'https://collab-table-editor-production.up.railway.app';

  socket = io(backendUrl);
  return socket;
};
export const getSocket = () => {
  return socket;
};

export const joinRoom = (username) => {
  if (socket) {
    socket.emit('join', username);
  }
};

export const sendCursorPosition = (position) => {
  if (socket) {
    socket.emit('cursor_move', position);
  }
};

export const sendTableUpdate = (data) => {
  if (socket) {
    socket.emit('table_update', data);
  }
};

export const onUserJoined = (callback) => {
  if (socket) {
    socket.on('user_joined', callback);
  }
};

export const onUserLeft = (callback) => {
  if (socket) {
    socket.on('user_left', callback);
  }
};

export const onOnlineUsers = (callback) => {
  if (socket) {
    socket.on('online_users', callback);
  }
};

export const onUserCursor = (callback) => {
  if (socket) {
    socket.on('user_cursor', callback);
  }
};

export const onTableUpdated = (callback) => {
  if (socket) {
    socket.on('table_updated', callback);
  }
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
  }
};

export const onLogout = (callback) => {
  const socket = getSocket();
  if (socket) {
    socket.on('logout', callback);
  }
};

export const emitLogout = (username) => {
  const socket = getSocket();
  if (socket) {
    socket.emit('logout', username);
  }
};
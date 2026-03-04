import { io } from 'socket.io-client';

// Aponte diretamente para o backend em desenvolvimento
export const API_URL = 'http://localhost:3001/api';

// URL para a conexão do Socket.IO (sem /api)
const SOCKET_URL = 'http://localhost:3001';

console.log(`Connecting Socket.IO to: ${SOCKET_URL}`);

export const socket = io(SOCKET_URL, {
  transports: ['websocket', 'polling']
});

// Função helper para construir URLs de fetch
export const getApiUrl = (path: string) => {
  // Garante que o path comece com uma barra
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_URL}${cleanPath}`;
};

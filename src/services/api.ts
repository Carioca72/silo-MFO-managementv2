import { io } from 'socket.io-client';

// Use a variável de ambiente para a URL da API, com um fallback para desenvolvimento
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Remove /api ou outras sub-rotas para a conexão do socket
const SOCKET_URL = API_URL.replace('/api', '');

console.log(`Connecting Socket.IO to: ${SOCKET_URL}`);

export const socket = io(SOCKET_URL, {
  transports: ['websocket', 'polling']
});

// Função helper para construir URLs de fetch
export const getApiUrl = (path: string) => {
  // Garante que o path não comece com / para evitar URLs duplicadas
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  return `${API_URL}/${cleanPath}`;
};

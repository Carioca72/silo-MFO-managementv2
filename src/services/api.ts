// src/services/api.ts
// Em produção (Firebase Hosting), chamadas /api/** são reescritas para a Cloud Function.
// Em desenvolvimento com o proxy Vite configurado, /api/** vai para localhost:3001.
// Usar path relativo é correto para AMBOS os ambientes.

export const API_URL = '/api';

export const getApiUrl = (path: string): string => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_URL}${cleanPath}`;
};

// Socket.IO: lazy connection para evitar erros em ambientes sem backend
import { io, Socket } from 'socket.io-client';
let _socket: Socket | null = null;
export const getSocket = (): Socket => {
  if (!_socket) {
    _socket = io('/', { transports: ['websocket', 'polling'], autoConnect: false });
    _socket.connect();
  }
  return _socket;
};

// Manter export 'socket' para compatibilidade com código existente
export const socket = {
  on: (event: string, cb: (...args: any[]) => void) => getSocket().on(event, cb),
  off: (event: string, cb: (...args: any[]) => void) => getSocket().off(event, cb),
  emit: (event: string, ...args: any[]) => getSocket().emit(event, ...args),
};

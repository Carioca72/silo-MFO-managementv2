import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { ToastContainer, ToastMessage } from '../ui/Toast';
import { Bell } from 'lucide-react';

export const CRMUpdates: React.FC = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const newSocket = io('/', {
      path: '/socket.io',
      transports: ['websocket', 'polling'] // Force websocket first
    });

    newSocket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    newSocket.on('crm:stage_change', (data: { clientId: string, oldStage: string, newStage: string }) => {
      console.log('CRM Update received:', data);
      
      // Add toast
      const newToast: ToastMessage = {
        id: Date.now().toString(),
        type: 'info',
        title: 'Atualização CRM',
        message: `Cliente ${data.clientId} mudou de ${data.oldStage} para ${data.newStage}`,
        duration: 8000
      };
      
      setToasts(prev => [...prev, newToast]);
      
      // Add to notification history
      setNotifications(prev => [{
        id: Date.now(),
        timestamp: new Date(),
        ...data
      }, ...prev]);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
      
      {/* Notification Bell in Header (Portal logic or absolute positioning if simpler) */}
      <div className="fixed top-4 right-20 z-40">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
        >
          <Bell size={20} />
          {notifications.length > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
          )}
        </button>

        {isOpen && (
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden">
            <div className="p-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
              <h3 className="font-semibold text-sm text-gray-700">Notificações CRM</h3>
              <button onClick={() => setNotifications([])} className="text-xs text-blue-600 hover:underline">
                Limpar
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-gray-500 text-sm">
                  Nenhuma notificação recente
                </div>
              ) : (
                notifications.map((notif) => (
                  <div key={notif.id} className="p-3 border-b border-gray-50 hover:bg-gray-50 transition-colors">
                    <p className="text-sm text-gray-800">
                      <span className="font-medium">Cliente {notif.clientId}</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {notif.oldStage} <span className="text-gray-400">→</span> <span className="text-green-600 font-medium">{notif.newStage}</span>
                    </p>
                    <p className="text-[10px] text-gray-400 mt-1 text-right">
                      {notif.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

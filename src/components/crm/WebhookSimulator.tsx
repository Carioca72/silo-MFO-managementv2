import React, { useState } from 'react';
import { Send } from 'lucide-react';

export const WebhookSimulator: React.FC = () => {
  const [clientId, setClientId] = useState('CLI-12345');
  const [oldStage, setOldStage] = useState('lead');
  const [newStage, setNewStage] = useState('qualificado');
  const [loading, setLoading] = useState(false);

  const triggerWebhook = async () => {
    setLoading(true);
    try {
      await fetch('/api/crm/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'stage_change',
          data: { clientId, oldStage, newStage }
        })
      });
    } catch (error) {
      console.error('Error triggering webhook:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 max-w-md">
      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
        <Send size={20} className="text-indigo-600" />
        Simulador de Webhook CRM
      </h3>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Client ID</label>
          <input 
            type="text" 
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded-md text-sm"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estágio Anterior</label>
            <select 
              value={oldStage}
              onChange={(e) => setOldStage(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="lead">Lead</option>
              <option value="qualificado">Qualificado</option>
              <option value="estudo">Estudo</option>
              <option value="aporte">Aporte</option>
              <option value="cliente_ativo">Cliente Ativo</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Novo Estágio</label>
            <select 
              value={newStage}
              onChange={(e) => setNewStage(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="lead">Lead</option>
              <option value="qualificado">Qualificado</option>
              <option value="estudo">Estudo</option>
              <option value="aporte">Aporte</option>
              <option value="cliente_ativo">Cliente Ativo</option>
            </select>
          </div>
        </div>

        <button
          onClick={triggerWebhook}
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-2 rounded-md hover:bg-indigo-700 transition disabled:opacity-50"
        >
          {loading ? 'Enviando...' : 'Simular Evento'}
        </button>
      </div>
    </div>
  );
};

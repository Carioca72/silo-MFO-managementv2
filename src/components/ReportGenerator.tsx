import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Interfaces
interface Tool {
  id: string;
  name: string;
  description: string;
}

interface Client {
  id: string;
  name: string;
}

const ReportGenerator: React.FC = () => {
  const [tools, setTools] = useState<Tool[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [reportName, setReportName] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string>('');
  
  // Hook de navegação
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch tools and clients from the backend API
    const fetchData = async () => {
      try {
        const [toolsResponse, clientsResponse] = await Promise.all([
          fetch('/api/tools'),
          fetch('/api/clients'),
        ]);
        const toolsData = await toolsResponse.json();
        const clientsData = await clientsResponse.json();
        setTools(toolsData);
        setClients(clientsData);
      } catch (error) {
        console.error("Failed to fetch initial data:", error);
      }
    };
    fetchData();
  }, []);

  const handleToolToggle = (toolId: string) => {
    setSelectedTools(prev =>
      prev.includes(toolId) ? prev.filter(id => id !== toolId) : [...prev, toolId]
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    setFeedback('');

    try {
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          clientId: selectedClient,
          tools: selectedTools,
          reportName 
        }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.message || 'Falha ao gerar o relatório.');
      }
      
      console.log('Resultado da Geração:', result);

      // Se a geração foi bem-sucedida e recebemos um reportId...
      if (result.reportId) {
        setFeedback(`Relatório gerado com sucesso! Redirecionando para a página de detalhes...`);
        // Navega para a página de detalhes do relatório
        setTimeout(() => navigate(`/report/${result.reportId}`), 1500);
      } else {
        setFeedback(result.message);
      }

    } catch (error) {
      setFeedback((error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: 'auto', padding: '20px' }}>
      <h2>Gerador de Relatórios com IA</h2>
      <form onSubmit={handleSubmit}>
        {/* ... (o resto do JSX permanece o mesmo) ... */}
         <div style={{ marginBottom: '20px' }}>
          <h3>1. Selecione o Cliente</h3>
          <select 
            value={selectedClient} 
            onChange={e => setSelectedClient(e.target.value)} 
            required
            style={{ width: '100%', padding: '8px' }}
          >
            <option value="" disabled>Selecione um cliente</option>
            {clients.map(client => (
              <option key={client.id} value={client.id}>{client.name}</option>
            ))}
          </select>
        </div>

        <div style={{ marginBottom: '20px' }}>
            <h3>2. Nome do Relatório</h3>
            <input 
                type="text"
                value={reportName}
                onChange={(e) => setReportName(e.target.value)}
                placeholder="Ex: Análise de Carteira - Abril 2024"
                required
                style={{ width: 'calc(100% - 16px)', padding: '8px' }}
            />
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h3>3. Ferramentas de Análise</h3>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {tools.map(tool => (
              <label key={tool.id} style={{ marginBottom: '10px', padding: '10px', border: '1px solid #ccc', borderRadius: '4px' }}>
                <input 
                  type="checkbox" 
                  checked={selectedTools.includes(tool.id)} 
                  onChange={() => handleToolToggle(tool.id)} 
                  style={{ marginRight: '10px' }}
                />
                <strong>{tool.name}</strong>: {tool.description}
              </label>
            ))}
          </div>
        </div>

        <button type="submit" disabled={isLoading || selectedTools.length === 0 || !selectedClient} style={{ width: '100%', padding: '10px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          {isLoading ? 'Gerando Relatório...' : 'Gerar com IA'}
        </button>
      </form>
      {feedback && <div style={{ marginTop: '20px', padding: '10px', background: '#e0e0e0', borderRadius: '4px' }}>{feedback}</div>}
    </div>
  );
};

export default ReportGenerator;

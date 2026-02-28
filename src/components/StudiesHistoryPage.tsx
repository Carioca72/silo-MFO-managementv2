import React, { useState, useEffect } from 'react';

// Interfaces para tipar os dados que virão da API
// Espelham as interfaces do backend
interface AnalysisResult {
  original_filename: string;
  // Adicionar outros campos se necessário para a UI
}

interface Study {
  id: string;
  name: string;
  clientName: string;
  type: 'Estudo de Carteira' | 'Relatório de Resultados';
  status: 'Concluído' | 'Em Andamento' | 'Erro';
  createdAt: string; // A data virá como string no JSON
  analysisResult: AnalysisResult;
}

const StudiesHistoryPage: React.FC = () => {
  const [studies, setStudies] = useState<Study[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Função para buscar os dados da API
    const fetchStudies = async () => {
      try {
        setLoading(true);
        // O fetch é feito para a nossa API backend (que roda na porta 3000)
        // O NestJS controller expõe a rota /api/studies
        const response = await fetch('/api/studies');
        if (!response.ok) {
          throw new Error('Falha ao buscar os dados dos estudos.');
        }
        const data: Study[] = await response.json();
        setStudies(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchStudies();
  }, []); // O array vazio assegura que o efeito rode apenas uma vez, no mount do componente

  // Handlers para os botões de ação (por enquanto, apenas logs)
  const handleDetails = (id: string) => {
    console.log(`Navegar para os detalhes do estudo: ${id}`);
    // Futuramente: navigate(`/studies/${id}`);
  };

  const handleRename = (id: string) => {
    const newName = prompt('Digite o novo nome para o estudo:');
    if (newName) {
      console.log(`Renomeando estudo ${id} para ${newName}`);
      // Futuramente: fazer a chamada PATCH para /api/studies/${id}/rename
    }
  };

  const handleReanalyze = (id: string) => {
    console.log(`Disparando reanálise para o estudo: ${id}`);
    // Futuramente: fazer a chamada POST para /api/studies/${id}/reanalyze
  };


  if (loading) {
    return <div>Carregando histórico...</div>;
  }

  if (error) {
    return <div>Erro: {error}</div>;
  }

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>Histórico de Relatórios e Estudos</h1>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid black' }}>
            <th style={{ textAlign: 'left', padding: '8px' }}>Nome do Estudo</th>
            <th style={{ textAlign: 'left', padding: '8px' }}>Cliente</th>
            <th style={{ textAlign: 'left', padding: '8px' }}>Tipo</th>
            <th style={{ textAlign: 'left', padding: '8px' }}>Data</th>
            <th style={{ textAlign: 'left', padding: '8px' }}>Status</th>
            <th style={{ textAlign: 'left', padding: '8px' }}>Ações</th>
          </tr>
        </thead>
        <tbody>
          {studies.length > 0 ? (
            studies.map((study) => (
              <tr key={study.id} style={{ borderBottom: '1px solid #ccc' }}>
                <td style={{ padding: '8px' }}>{study.name}</td>
                <td style={{ padding: '8px' }}>{study.clientName}</td>
                <td style={{ padding: '8px' }}>{study.type}</td>
                <td style={{ padding: '8px' }}>{new Date(study.createdAt).toLocaleDateString('pt-BR')}</td>
                <td style={{ padding: '8px' }}>{study.status}</td>
                <td style={{ padding: '8px' }}>
                  <button onClick={() => handleDetails(study.id)} style={{ marginRight: '5px' }}>Detalhes</button>
                  <button onClick={() => handleRename(study.id)} style={{ marginRight: '5px' }}>Renomear</button>
                  <button onClick={() => handleReanalyze(study.id)}>Reanalisar</button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6} style={{ textAlign: 'center', padding: '20px' }}>
                Nenhum estudo encontrado. Faça um novo upload para começar.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default StudiesHistoryPage;

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// Interfaces
interface AnalysisResult { original_filename: string; }
interface Study {
  id: string;
  name: string;
  clientName: string;
  type: 'Estudo de Carteira' | 'Relatório de Resultados';
  status: 'Concluído' | 'Em Andamento' | 'Erro';
  createdAt: string;
  analysisResult: AnalysisResult;
}

const StudiesHistoryPage: React.FC = () => {
  const [studies, setStudies] = useState<Study[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchStudies = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/studies');
        if (!response.ok) throw new Error('Falha ao buscar os dados.');
        const data: Study[] = await response.json();
        setStudies(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    fetchStudies();
  }, []);

  const handleDetails = (id: string) => navigate(`/study/${id}`);

  const handleRename = async (id: string) => {
    const study = studies.find(s => s.id === id);
    const newName = prompt('Digite o novo nome para o estudo:', study?.name || '');
    if (newName && newName !== study?.name) {
      try {
        const response = await fetch(`/api/studies/${id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: newName }),
        });
        if (!response.ok) throw new Error('Falha ao renomear o estudo.');
        const updatedStudy = await response.json();
        setStudies(prev => prev.map(s => (s.id === id ? updatedStudy : s)));
      } catch (err) { alert((err as Error).message); }
    }
  };

  const handleReanalyze = async (id: string) => {
    // Impede múltiplas reanálises simultâneas
    const study = studies.find(s => s.id === id);
    if (study?.status === 'Em Andamento') return;

    // 1. Feedback imediato na UI
    setStudies(prev => prev.map(s => s.id === id ? { ...s, status: 'Em Andamento' } : s));

    try {
      // 2. Chama a API
      const response = await fetch(`/api/studies/${id}/reanalyze`, { method: 'POST' });
      if (response.status !== 202) throw new Error('Falha ao iniciar a reanálise.');

      // 3. Simula a espera (o backend está fazendo o mesmo)
      setTimeout(() => {
        // 4. Atualiza para "Concluído" após o tempo
        setStudies(prev => prev.map(s => s.id === id ? { ...s, status: 'Concluído' } : s));
      }, 4000);

    } catch (err) {
      alert((err as Error).message);
      // Reverte em caso de erro
      setStudies(prev => prev.map(s => s.id === id ? { ...s, status: study?.status || 'Erro' } : s));
    }
  };

  if (loading) return <div>Carregando histórico...</div>;
  if (error) return <div>Erro: {error}</div>;

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
          {studies.map((study) => (
            <tr key={study.id} style={{ borderBottom: '1px solid #ccc' }}>
              <td style={{ padding: '8px' }}>{study.name}</td>
              <td style={{ padding: '8px' }}>{study.clientName}</td>
              <td style={{ padding: '8px' }}>{study.type}</td>
              <td style={{ padding: '8px' }}>{new Date(study.createdAt).toLocaleDateString('pt-BR')}</td>
              <td style={{ padding: '8px' }}>
                <span style={{
                  padding: '4px 8px',
                  borderRadius: '12px',
                  fontSize: '12px',
                  color: 'white',
                  backgroundColor: study.status === 'Concluído' ? '#28a745' : study.status === 'Em Andamento' ? '#ffc107' : '#dc3545'
                }}>
                  {study.status}
                </span>
              </td>
              <td style={{ padding: '8px' }}>
                <button onClick={() => handleDetails(study.id)} style={{ marginRight: '5px' }}>Detalhes</button>
                <button onClick={() => handleRename(study.id)} style={{ marginRight: '5px' }}>Renomear</button>
                <button onClick={() => handleReanalyze(study.id)} disabled={study.status === 'Em Andamento'}>
                  {study.status === 'Em Andamento' ? 'Analisando...' : 'Reanalisar'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default StudiesHistoryPage;

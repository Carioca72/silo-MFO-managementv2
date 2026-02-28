import React, { useState, useEffect } from 'react';
import CumulativeReturnChart from './charts/CumulativeReturnChart';
import AllocationChart from './charts/AllocationChart';
import StrategyExposureChart from './charts/StrategyExposureChart';
import SharpeRatioGauge from './charts/SharpeRatioGauge'; // Importa o velocímetro

// Tipagem completa
interface AggregatedIndicators {
  volatilidade_anual: number;
  retorno_anual: number;
  sharpe: number;
}
interface Scenario {
  portfolio: any[];
  aggregated_indicators: AggregatedIndicators;
  projections: any[];
}
interface Study {
  id: string;
  name: string;
  clientName: string;
  type: 'Estudo de Carteira' | 'Relatório de Resultados';
  createdAt: string;
  analysisResult: {
    diagnostics: string[];
    current_scenario: Scenario;
    new_scenario: Scenario;
    comparison_summary: any;
  };
}

// Props
interface StudyDetailPageProps {
  studyId: string;
}

const StudyDetailPage: React.FC<StudyDetailPageProps> = ({ studyId }) => {
  const [study, setStudy] = useState<Study | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStudyDetails = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/studies/${studyId}`);
        if (!response.ok) {
          throw new Error(`Falha ao buscar detalhes do estudo ${studyId}.`);
        }
        const data: Study = await response.json();
        setStudy(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchStudyDetails();
  }, [studyId]);

  if (loading) {
    return <div>Carregando detalhes do estudo...</div>;
  }

  if (error) {
    return <div>Erro: {error}</div>;
  }

  if (!study) {
    return <div>Estudo não encontrado.</div>;
  }

  const { current_scenario, new_scenario } = study.analysisResult;

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <header style={{ marginBottom: '30px' }}>
        <h1>{study.name}</h1>
        <p><strong>Cliente:</strong> {study.clientName}</p>
        <p><strong>Tipo:</strong> {study.type}</p>
        <p><strong>Data da Análise:</strong> {new Date(study.createdAt).toLocaleDateString('pt-BR')}</p>
      </header>

      <div className="dashboard-grid">
        <div className="diagnostics-section" style={{ marginBottom: '30px', border: '1px solid #eee', padding: '15px', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
          <h2>Diagnóstico Rápido da Carteira</h2>
          <ul style={{ paddingLeft: '20px'}}>
            {study.analysisResult.diagnostics.map((diag, index) => (
              <li key={index} style={{ marginBottom: '5px'}}>{diag}</li>
            ))}
          </ul>
        </div>

        <div className="charts-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className="chart-container" style={{ border: '1px solid #ccc', padding: '10px', borderRadius: '8px' }}>
            <CumulativeReturnChart 
              currentScenarioProjections={current_scenario.projections}
              newScenarioProjections={new_scenario.projections}
            />
          </div>
          <div className="chart-container" style={{ border: '1px solid #ccc', padding: '10px', borderRadius: '8px' }}>
            <AllocationChart portfolio={current_scenario.portfolio} />
          </div>
          <div className="chart-container" style={{ border: '1px solid #ccc', padding: '10px', borderRadius: '8px' }}>
            <StrategyExposureChart portfolio={current_scenario.portfolio} />
          </div>
          <div className="chart-container" style={{ border: '1px solid #ccc', padding: '10px', borderRadius: '8px' }}>
             {/* Substitui o placeholder pelo velocímetro */}
            <SharpeRatioGauge 
                currentSharpe={current_scenario.aggregated_indicators.sharpe}
                newSharpe={new_scenario.aggregated_indicators.sharpe}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudyDetailPage;

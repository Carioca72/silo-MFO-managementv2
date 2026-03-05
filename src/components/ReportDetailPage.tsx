import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// --- Interfaces --- //
interface Allocation {
  asset: string;
  ticker: string;
  weight: number;
}

interface EfficientFrontierPoint {
  risk: number;
  return: number;
  label: string;
}

interface ReportResult {
  analysisType: string;
  efficientFrontier: EfficientFrontierPoint[];
  optimalPortfolio: {
    risk: number;
    return: number;
    sharpe: number;
    allocation: Allocation[];
  };
  summary: string;
}

interface Report {
  message: string;
  reportId: string;
  status: string;
  result: ReportResult;
}

const ReportDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchReportDetails = async () => {
      if (!id) return;
      try {
        setLoading(true);
        // Este endpoint será criado no backend a seguir
        const response = await fetch(`/api/reports/${id}`);
        if (!response.ok) {
          throw new Error(`Falha ao buscar detalhes do relatório ${id}.`);
        }
        const data: Report = await response.json();
        setReport(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchReportDetails();
  }, [id]);

  if (loading) return <div>Carregando detalhes do relatório...</div>;
  if (error) return <div>Erro: {error}</div>;
  if (!report) return <div>Relatório não encontrado.</div>;

  const { optimalPortfolio, summary } = report.result;

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <header style={{ marginBottom: '30px' }}>
        <h1>Detalhes do Relatório de Otimização</h1>
        <p><strong>ID do Relatório:</strong> {id}</p>
        <p><strong>Tipo de Análise:</strong> {report.result.analysisType}</p>
      </header>

      <div className="report-summary" style={{ marginBottom: '30px', border: '1px solid #eee', padding: '15px', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
          <h2>Resumo da Otimização</h2>
          <p>{summary}</p>
          <ul>
            <li><strong>Risco (Volatilidade Anual):</strong> {(optimalPortfolio.risk * 100).toFixed(2)}%</li>
            <li><strong>Retorno Anual Esperado:</strong> {(optimalPortfolio.return * 100).toFixed(2)}%</li>
            <li><strong>Índice de Sharpe:</strong> {optimalPortfolio.sharpe.toFixed(2)}</li>
          </ul>
        </div>

      <div className="allocation-chart" style={{ width: '100%', height: 400 }}>
        <h3 style={{ textAlign: 'center' }}>Alocação da Carteira Otimizada</h3>
        <ResponsiveContainer>
          <BarChart data={optimalPortfolio.allocation} layout="vertical" margin={{ top: 20, right: 30, left: 40, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" tickFormatter={(tick) => `${tick * 100}%`} />
            <YAxis type="category" dataKey="asset" width={150} />
            <Tooltip formatter={(value: number) => `${(value * 100).toFixed(2)}%`} />
            <Legend />
            <Bar dataKey="weight" name="Peso" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ReportDetailPage;

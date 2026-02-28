import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Registra os componentes necessários do Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Tipagem para os dados de projeção que o gráfico espera receber
interface ProjectionData {
  mes: number;
  saldo_final: number;
}

interface CumulativeReturnChartProps {
  currentScenarioProjections: ProjectionData[];
  newScenarioProjections: ProjectionData[];
}

const CumulativeReturnChart: React.FC<CumulativeReturnChartProps> = ({ currentScenarioProjections, newScenarioProjections }) => {
  
  // Extrai os labels (meses) e os dados de saldo final para cada cenário
  const labels = currentScenarioProjections.map(p => `Mês ${p.mes}`);
  const currentData = currentScenarioProjections.map(p => p.saldo_final);
  const newData = newScenarioProjections.map(p => p.saldo_final);

  const data = {
    labels,
    datasets: [
      {
        label: 'Carteira Atual',
        data: currentData,
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.5)',
        tension: 0.1, // Suaviza a linha
      },
      {
        label: 'Carteira Otimizada',
        data: newData,
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
        tension: 0.1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false, // Permite que o gráfico preencha o container
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Projeção de Retorno Acumulado (12 Meses)',
      },
      tooltip: {
        callbacks: {
            label: function(context) {
                let label = context.dataset.label || '';
                if (label) {
                    label += ': ';
                }
                if (context.parsed.y !== null) {
                    label += new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(context.parsed.y);
                }
                return label;
            }
        }
      }
    },
    scales: {
        y: {
            ticks: {
                // Formata o eixo Y como moeda
                callback: function(value, index, ticks) {
                    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value as number);
                }
            }
        }
    }
  };

  return <div style={{ height: '400px' }}><Line options={options} data={data} /></div>;
};

export default CumulativeReturnChart;

import React from 'react';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  Title,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, Title);

// Tipagem para os ativos individuais na carteira
interface Asset {
  classe_ativo: string;
  valor_total: number;
}

interface AllocationChartProps {
  portfolio: Asset[];
}

const AllocationChart: React.FC<AllocationChartProps> = ({ portfolio }) => {
  // 1. Agrupar e somar os valores por classe de ativo
  const allocation = portfolio.reduce((acc, asset) => {
    const { classe_ativo, valor_total } = asset;
    if (!acc[classe_ativo]) {
      acc[classe_ativo] = 0;
    }
    acc[classe_ativo] += valor_total;
    return acc;
  }, {} as { [key: string]: number });

  const labels = Object.keys(allocation);
  const dataValues = Object.values(allocation);

  const data = {
    labels,
    datasets: [
      {
        label: 'Valor (R$)',
        data: dataValues,
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',
          'rgba(54, 162, 235, 0.7)',
          'rgba(255, 206, 86, 0.7)',
          'rgba(75, 192, 192, 0.7)',
          'rgba(153, 102, 255, 0.7)',
          'rgba(255, 159, 64, 0.7)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
        ],
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: 'Alocação por Classe de Ativo',
      },
      tooltip: {
        callbacks: {
            label: function(context) {
                let label = context.label || '';
                if (label) {
                    label += ': ';
                }
                if (context.raw !== null) {
                    const total = context.chart.getDatasetMeta(0).total;
                    const value = context.raw as number;
                    const percentage = ((value / total) * 100).toFixed(2);
                    label += `${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)} (${percentage}%)`;
                }
                return label;
            }
        }
      }
    },
  };

  return <div style={{ height: '400px' }}><Pie data={data} options={options} /></div>;
};

export default AllocationChart;

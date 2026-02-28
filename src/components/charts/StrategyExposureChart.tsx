import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

// Tipagem para os ativos
interface Asset {
  estrategia_investimento: string;
  valor_total: number;
}

interface StrategyExposureChartProps {
  portfolio: Asset[];
}

const StrategyExposureChart: React.FC<StrategyExposureChartProps> = ({ portfolio }) => {
  // 1. Agrupar e somar os valores por estratégia de investimento
  const exposure = portfolio.reduce((acc, asset) => {
    // Usa 'Sem Estratégia' se o campo estiver vazio ou nulo
    const strategy = asset.estrategia_investimento || 'Não Especificada';
    if (!acc[strategy]) {
      acc[strategy] = 0;
    }
    acc[strategy] += asset.valor_total;
    return acc;
  }, {} as { [key: string]: number });

  const labels = Object.keys(exposure);
  const dataValues = Object.values(exposure);

  const data = {
    labels,
    datasets: [
      {
        label: 'Valor Exposto (R$)',
        data: dataValues,
        backgroundColor: 'rgba(75, 192, 192, 0.7)',
        borderColor: 'rgba(75, 192, 192, 1)',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    indexAxis: 'y' as const, // Torna o gráfico de barras horizontal para melhor leitura dos labels
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // O label do dataset já é suficiente
      },
      title: {
        display: true,
        text: 'Exposição por Estratégia de Investimento',
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.x !== null) {
              label += new Intl.NumberFormat('pt-BR', {
                style: 'currency',
                currency: 'BRL',
              }).format(context.parsed.x);
            }
            return label;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          // Formata o eixo X como moeda
          callback: function (value, index, ticks) {
            return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value as number);
          },
        },
      },
    },
  };

  return <div style={{ height: '400px' }}><Bar options={options} data={data} /></div>;
};

export default StrategyExposureChart;

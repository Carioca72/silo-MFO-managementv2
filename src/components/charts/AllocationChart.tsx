import React from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// Interface para os dados do portfólio, garantindo a tipagem
interface PortfolioData {
  name: string;
  value: number;
  category: string;
}

// Interface para as props do componente
interface AllocationChartProps {
  portfolio: PortfolioData[];
}

// Cores consistentes para as categorias
const COLORS: { [key: string]: string } = {
  'RF': '#0088FE',
  'FII': '#00C49F',
  'RV': '#FFBB28',
  'RV Int': '#FF8042',
  'Caixa': '#A9A9A9',
  'RF Int': '#8884d8',
};

const AllocationChart: React.FC<AllocationChartProps> = ({ portfolio }) => {
  // O componente agora é "puro". Ele recebe os dados e os renderiza.
  // Não há mais dados mockados ou hardcoded aqui dentro.

  if (!portfolio || portfolio.length === 0) {
    return <div>Dados de alocação não disponíveis.</div>;
  }

  const chartData = portfolio.map(item => ({
    name: item.name,
    value: item.value,
  }));

  return (
    <div style={{ width: '100%', height: 300 }}>
      <h3 style={{ textAlign: 'center' }}>Alocação da Carteira Atual</h3>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
            nameKey="name"
            label={({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
              const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
              const x = cx + radius * Math.cos(-midAngle * (Math.PI / 180));
              const y = cy + radius * Math.sin(-midAngle * (Math.PI / 180));
              return (
                <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
                  {`${(percent * 100).toFixed(0)}%`}
                </text>
              );
            }}
          >
            {portfolio.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[entry.category] || '#82ca9d'} />
            ))}
          </Pie>
          <Tooltip formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR')}`} />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default AllocationChart;

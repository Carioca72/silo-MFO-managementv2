import React from 'react';
import GaugeChart from 'react-gauge-chart';

interface SharpeRatioGaugeProps {
  currentSharpe: number;
  newSharpe: number;
}

// Mapeia o valor do índice de Sharpe (que pode ser negativo ou > 1) para uma porcentagem de 0 a 1
const normalizeSharpe = (sharpe: number): number => {
  // Define uma faixa razoável para o Sharpe. Ex: -1 a 3
  const minSharpe = -1.0;
  const maxSharpe = 3.0;
  
  if (sharpe < minSharpe) return 0;
  if (sharpe > maxSharpe) return 1;
  
  const normalized = (sharpe - minSharpe) / (maxSharpe - minSharpe);
  return normalized;
};

const SharpeRatioGauge: React.FC<SharpeRatioGaugeProps> = ({ currentSharpe, newSharpe }) => {
  const chartStyle = {
    height: '120px',
  };

  return (
    <div>
        <h3 style={{textAlign: 'center'}}>Índice de Sharpe</h3>
        <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
            <div style={{ textAlign: 'center' }}>
                <h4>Atual</h4>
                <GaugeChart
                id="gauge-chart-current"
                style={chartStyle}
                nrOfLevels={20}
                colors={['#FF5F6D', '#FFC371', '#4CAF50']}
                arcWidth={0.3}
                percent={normalizeSharpe(currentSharpe)}
                textColor="#333"
                formatTextValue={() => currentSharpe.toFixed(2)}
                />
            </div>
            <div style={{ textAlign: 'center' }}>
                <h4>Otimizado</h4>
                <GaugeChart
                id="gauge-chart-new"
                style={chartStyle}
                nrOfLevels={20}
                colors={['#FF5F6D', '#FFC371', '#4CAF50']}
                arcWidth={0.3}
                percent={normalizeSharpe(newSharpe)}
                textColor="#333"
                formatTextValue={() => newSharpe.toFixed(2)}
                />
            </div>
        </div>
    </div>
  );
};

export default SharpeRatioGauge;

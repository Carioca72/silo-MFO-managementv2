import React, { useState } from 'react';

export type Benchmark = 'CDI' | 'IBOVESPA';

interface BenchmarkSelectorProps {
  onBenchmarkChange: (benchmark: Benchmark) => void;
}

export const BenchmarkSelector: React.FC<BenchmarkSelectorProps> = ({ onBenchmarkChange }) => {
  const [selected, setSelected] = useState<Benchmark>('CDI');

  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value as Benchmark;
    setSelected(value);
    onBenchmarkChange(value);
  };

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="benchmark-selector" className="text-sm font-medium text-gray-700">Benchmark:</label>
      <select 
        id="benchmark-selector" 
        value={selected} 
        onChange={handleChange}
        className="block w-32 pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
      >
        <option value="CDI">CDI</option>
        <option value="IBOVESPA">IBOVESPA</option>
      </select>
    </div>
  );
};

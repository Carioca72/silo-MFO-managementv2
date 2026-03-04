import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Upload, Search, BarChart2, FileText, ArrowRight, RefreshCw, Download, CheckCircle, AlertTriangle, TrendingUp, PieChart as PieIcon } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ScatterChart, Scatter, ZAxis, LineChart, Line } from 'recharts';
import { BenchmarkSelector, Benchmark } from '../market/BenchmarkSelector';
import { pdf } from '@react-pdf/renderer';
import { SiloReportPDF } from './SiloReportPDF';
import { generateExcelReport } from '../../services/reports/exportService';
import { financialEngine, DetailedAsset } from '../../services/analysis/financialEngine';
import { DiagnosisEngine } from '../../services/analysis/diagnosisEngine';
import { Asset } from '../../types/asset';
import { importService, DataQualityLog } from '../../services/import/importService';
import { getApiUrl } from '../../services/api';
import { toast } from "sonner";

interface MarketData {
  ticker: string;
  price: number;
  ret_12m: number;
  volatility_12m: number;
}

export default function PortfolioStudy() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [dataLogs, setDataLogs] = useState<DataQualityLog[]>([]);
  const [totalImportValue, setTotalImportValue] = useState<number>(0);
  const [marketData, setMarketData] = useState<Record<string, MarketData>>({});
  const [optimizationResult, setOptimizationResult] = useState<any>(null);
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [models, setModels] = useState<any[]>([]);
  const [benchmark, setBenchmark] = useState<Benchmark>('CDI');

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setDataLogs([]);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(getApiUrl('/study/upload-pdf'), {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Erro no upload do arquivo PDF.' }));
        throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      setAssets(result.assets);
      setDataLogs(result.logs);
      setTotalImportValue(result.totalValue);
      setStep(2);
      toast.success("Arquivo PDF processado com sucesso!");
      
    } catch (error: any) {
      console.error('Error uploading PDF file:', error);
      toast.error(error.message || 'Erro ao processar o arquivo PDF.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Fetch Market Data
  const fetchMarketData = async () => {
    setLoading(true);
    try {
      const tickers = assets.map(a => a.ticker);
      const res = await fetch(getApiUrl(`/study/market-data?tickers=${tickers.join(',')}`));
      const data = await res.json();
      
      const dataMap: Record<string, MarketData> = {};
      data.forEach((d: MarketData) => {
        dataMap[d.ticker] = d;
      });
      setMarketData(dataMap);
      
      setAssets(prev => prev.map(a => ({
        ...a,
        ret12m: dataMap[a.ticker]?.ret_12m || 0,
        vol12m: dataMap[a.ticker]?.volatility_12m || 0,
        price: dataMap[a.ticker]?.price || 0
      })));
      
      setStep(3);
    } catch (err) {
      console.error(err);
      toast.error('Erro ao buscar dados de mercado');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Load Models
  useEffect(() => {
    fetch(getApiUrl('/study/models'))
      .then(res => res.json())
      .then(data => setModels(data))
      .catch(console.error);
  }, []);

  // Step 4: Optimize
  const runOptimization = async () => {
    setLoading(true);
    try {
      const payload = {
        tickers: assets.map(a => a.ticker),
        targetReturn: 0.15, // Default target
        benchmark: benchmark // Pass selected benchmark
      };

      const res = await fetch(getApiUrl('/portfolio/analyze'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const result = await res.json();
      setOptimizationResult(result);
      setStep(4);
    } catch (err) {
      console.error(err);
      toast.error('Erro na otimização');
    } finally {
      setLoading(false);
    }
  };

  // Step 5: Generate Reports
  const handleDownloadReport = async (type: 'pdf' | 'csv') => {
    if (!optimizationResult?.scenarios?.length) {
      toast.error('Dados de otimização indisponíveis.');
      return;
    }
    const scenario = optimizationResult.scenarios[0];
    if (!scenario?.weights) {
      toast.error('Pesos do portfólio não encontrados.');
      return;
    }
    
    const currentDetailedAssets: DetailedAsset[] = assets.map(a => ({
        ...a,
        institution: 'Banco Exemplo',
        liquidity: 1,
        strategy: 'Crescimento',
        taxRate: 0.15,
        adminFee: 0.01,
        returnRate: (a.ret12m || 10) / 100, // Assuming ret12m is %
        volatility: (a.vol12m || 10) / 100,
        titulo: a.name
    }));

    const suggestedDetailedAssets: DetailedAsset[] = scenario.weights ? 
        Object.keys(scenario.weights).map(ticker => {
            const weight = scenario.weights[ticker];
            const original = assets.find(a => a.ticker === ticker);
            return {
                id: ticker,
                ticker,
                name: original?.name || ticker,
                class: original?.class || 'Ação',
                value: 10000 * weight, // Normalized to 10k or total value
                pct: weight,
                institution: 'Banco Exemplo',
                liquidity: 1,
                strategy: 'Crescimento',
                taxRate: 0.15,
                adminFee: 0.01,
                returnRate: (original?.ret12m || 10) / 100,
                volatility: (original?.vol12m || 10) / 100,
                titulo: original?.name || ticker
            };
        }) : [];

    const cdiRate = 0.105; // 10.5%
    const currentProjection = financialEngine.calculateProjection(currentDetailedAssets, cdiRate, 10000);
    const suggestedProjection = financialEngine.calculateProjection(suggestedDetailedAssets, cdiRate, 10000);
    
    const diagnosisEngine = new DiagnosisEngine();
    const concentrationResult = diagnosisEngine.checkForConcentration(currentDetailedAssets);
    const liquidityResult = diagnosisEngine.checkForLiquidityDrag(currentDetailedAssets);

    const diagnoses: {title: string, text: string}[] = [];
    if (concentrationResult.hasConcentration) {
        diagnoses.push({ title: 'Concentração de Ativos', text: concentrationResult.text });
    }
    if (liquidityResult.hasLiquidityDrag) {
        diagnoses.push({ title: 'Arrasto de Liquidez', text: liquidityResult.text });
    }

    if (type === 'pdf') {
        const blob = await pdf(
            <SiloReportPDF 
                clientName="Cliente Silo"
                currentAssets={currentDetailedAssets}
                suggestedAssets={suggestedDetailedAssets}
                diagnoses={diagnoses}
                currentProjection={currentProjection}
                suggestedProjection={suggestedProjection}
            />
        ).toBlob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'Relatorio_Silo.pdf';
        link.click();
    } else {
        generateExcelReport(currentDetailedAssets, suggestedDetailedAssets, currentProjection, suggestedProjection);
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  const steps = [
    { id: 1, label: 'Importação', icon: Upload },
    { id: 2, label: 'Mercado', icon: Search },
    { id: 3, label: 'Modelagem', icon: PieIcon },
    { id: 4, label: 'Resultados', icon: TrendingUp },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8 pb-20">
      {/* Header & Stepper */}
      <header className="bg-card p-6 rounded-xl shadow-sm border border-border">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Estudo de Carteira</h1>
            <p className="text-muted-foreground">Análise, Otimização e Rebalanceamento</p>
          </div>
          
          <div className="flex items-center w-full md:w-auto overflow-x-auto">
            {steps.map((s, idx) => {
              const Icon = s.icon;
              const isActive = step === s.id;
              const isCompleted = step > s.id;
              
              return (
                <div key={s.id} className="flex items-center">
                  <div className={`flex flex-col items-center gap-2 px-4 ${isActive ? 'text-primary' : isCompleted ? 'text-green-400' : 'text-muted-foreground'}`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                      isActive ? 'border-primary bg-primary/10' : 
                      isCompleted ? 'border-green-500/30 bg-green-500/10' : 
                      'border-border bg-secondary'
                    }`}>
                      {isCompleted ? <CheckCircle size={20} /> : <Icon size={20} />}
                    </div>
                    <span className="text-xs font-medium whitespace-nowrap">{s.label}</span>
                  </div>
                  {idx < steps.length - 1 && (
                    <div className={`h-0.5 w-12 mb-6 ${isCompleted ? 'bg-green-500/30' : 'bg-border'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </header>

      {/* STEP 1: IMPORT */}
      {step === 1 && (
        <motion.div initial={{opacity:0, y: 20}} animate={{opacity:1, y: 0}} className="bg-card p-12 rounded-xl shadow-sm border border-border text-center max-w-3xl mx-auto">
            <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                <Upload className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold mb-3 text-foreground">Importar Carteira Atual</h2>
            <p className="text-muted-foreground mb-8 max-w-md mx-auto">Carregue o extrato (PDF/XLS) da custódia ou insira os dados manualmente para iniciar a análise.</p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4">
                <label className="cursor-pointer bg-primary text-primary-foreground px-8 py-4 rounded-xl hover:bg-primary/90 transition flex items-center justify-center gap-3 shadow-lg shadow-indigo-500/10">
                    <Upload size={20} />
                    <span className="font-medium">Upload Arquivo</span>
                    <input type="file" className="hidden" onChange={handleFileUpload} />
                </label>
                <button className="bg-secondary border border-border text-secondary-foreground px-8 py-4 rounded-xl hover:bg-secondary/80 flex items-center justify-center gap-3 transition">
                    <FileText size={20} />
                    <span className="font-medium">Entrada Manual</span>
                </button>
            </div>
            {loading && (
              <div className="mt-8 flex flex-col items-center gap-3">
                <RefreshCw className="animate-spin text-primary" size={24} />
                <p className="text-sm text-muted-foreground">Processando arquivo e identificando ativos...</p>
              </div>
            )}
        </motion.div>
      )}

      {/* STEP 2: ENRICHMENT */}
      {step === 2 && (
        <motion.div initial={{opacity:0}} animate={{opacity:1}} className="space-y-6">
            
            {/* Data Quality Logs */}
            {dataLogs.length > 0 && (
                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4">
                    <h3 className="text-yellow-300 font-semibold flex items-center gap-2 mb-2">
                        <AlertTriangle size={18} />
                        Relatório de Qualidade de Dados (Data Quality)
                    </h3>
                    <div className="max-h-40 overflow-y-auto text-sm space-y-1">
                        {dataLogs.map((log, i) => (
                            <div key={i} className="flex gap-2 text-yellow-200">
                                <span className="font-medium min-w-[120px]">{log.asset}:</span>
                                <span className="text-yellow-400">{log.message}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
                <div className="flex justify-between items-center mb-6">
                    <div>
                      <h2 className="text-lg font-semibold text-foreground">Carteira Importada</h2>
                      <p className="text-sm text-muted-foreground">Valor Total Importado: <span className="font-mono font-medium text-foreground">R$ {totalImportValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></p>
                    </div>
                    <button 
                        onClick={fetchMarketData}
                        disabled={loading}
                        className="bg-primary text-primary-foreground px-6 py-3 rounded-xl hover:bg-primary/90 flex items-center gap-2 disabled:opacity-50 shadow-md transition-all hover:shadow-lg"
                    >
                        {loading ? <RefreshCw className="animate-spin" size={18} /> : <Search size={18} />}
                        Buscar Dados de Mercado
                    </button>
                </div>
                
                <div className="overflow-hidden rounded-lg border border-border">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-secondary text-muted-foreground uppercase text-xs font-semibold tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Ativo</th>
                                <th className="px-6 py-4">Classe</th>
                                <th className="px-6 py-4 text-right">Valor (R$)</th>
                                <th className="px-6 py-4 text-right">% Carteira</th>
                                <th className="px-6 py-4 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {assets.map((asset) => (
                                <tr key={asset.id} className="hover:bg-secondary transition-colors">
                                    <td className="px-6 py-4">
                                      <div className="font-medium text-foreground">{asset.ticker}</div>
                                      <div className="text-xs text-muted-foreground">{asset.name}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                      <span className="px-2.5 py-1 bg-secondary rounded-full text-xs font-medium text-muted-foreground">{asset.class}</span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono">{asset.value.toLocaleString('pt-BR')}</td>
                                    <td className="px-6 py-4 text-right font-mono">{(asset.pct * 100).toFixed(1)}%</td>
                                    <td className="px-6 py-4 text-right">
                                      <span className="text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded text-xs flex items-center justify-end gap-1 w-fit ml-auto">
                                        <AlertTriangle size={12} /> Pendente
                                      </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </motion.div>
      )}

      {/* STEP 3: MODEL SELECTION & OPTIMIZATION */}
      {step === 3 && (
        <motion.div initial={{opacity:0}} animate={{opacity:1}} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
                <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
                    <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <CheckCircle className="text-green-400" size={20} />
                      Dados de Mercado Enriquecidos
                    </h2>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-secondary text-xs uppercase text-muted-foreground">
                                <tr>
                                    <th className="px-4 py-3 text-left">Ativo</th>
                                    <th className="px-4 py-3 text-right">Preço</th>
                                    <th className="px-4 py-3 text-right">Retorno 12m</th>
                                    <th className="px-4 py-3 text-right">Volatilidade</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border">
                                {assets.map(a => (
                                    <tr key={a.id}>
                                        <td className="px-4 py-3 font-medium">{a.ticker}</td>
                                        <td className="px-4 py-3 text-right text-muted-foreground">R$ {a.price?.toFixed(2)}</td>
                                        <td className={`px-4 py-3 text-right font-medium ${(a.ret12m||0) >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                            {(a.ret12m||0).toFixed(2)}%
                                        </td>
                                        <td className="px-4 py-3 text-right text-muted-foreground">{(a.vol12m||0).toFixed(2)}%</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold text-foreground">Otimização de Portfólio</h2>
                        <BenchmarkSelector onBenchmarkChange={setBenchmark} />
                    </div>
                    <p className="text-muted-foreground text-sm mb-6">
                        O algoritmo de Markowitz irá sugerir a alocação ótima para maximizar o Sharpe Ratio, 
                        considerando o benchmark <span className="font-semibold text-primary">{benchmark}</span>.
                    </p>
                    
                    <button 
                        onClick={runOptimization}
                        disabled={loading}
                        className="w-full bg-primary text-primary-foreground px-6 py-3 rounded-lg hover:bg-primary/90 flex items-center justify-center gap-2 font-semibold transition-all shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {loading ? <RefreshCw className="animate-spin" size={20} /> : <BarChart2 size={20} />}
                        {loading ? 'Otimizando...' : 'Executar Otimização'}
                    </button>
                </div>
            </div>

            <div className="space-y-6">
                <div className="bg-card p-6 rounded-xl shadow-sm border border-border h-full">
                    <h3 className="font-semibold mb-4 text-foreground">Modelos de Alocação</h3>
                    <div className="space-y-3">
                        {models.map((model: any) => (
                            <div 
                                key={model.id}
                                onClick={() => setSelectedModel(model.id)}
                                className={`p-4 rounded-xl border cursor-pointer transition-all ${selectedModel === model.id ? 'border-primary bg-primary/10 ring-1 ring-primary' : 'border-border hover:border-primary/70 hover:bg-secondary'}`}
                            >
                                <div className="flex justify-between items-start mb-1">
                                  <div className="font-semibold text-foreground">{model.name}</div>
                                  {selectedModel === model.id && <CheckCircle size={16} className="text-primary" />}
                                </div>
                                <div className="text-xs text-muted-foreground leading-relaxed">{model.description}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </motion.div>
      )}

      {/* STEP 4: RESULTS */}
      {step === 4 && optimizationResult && (
        <motion.div initial={{opacity:0}} animate={{opacity:1}} className="space-y-8">
            {/* Top Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: 'Retorno Esperado', value: `${(optimizationResult.scenarios[0].performance.expectedReturn * 100).toFixed(2)}%`, color: 'text-green-400', bg: 'bg-green-500/10' },
                { label: 'Volatilidade (Risco)', value: `${(optimizationResult.scenarios[0].performance.volatility * 100).toFixed(2)}%`, color: 'text-orange-400', bg: 'bg-orange-500/10' },
                { label: 'Sharpe Ratio', value: optimizationResult.scenarios[0].performance.sharpeRatio.toFixed(2), color: 'text-primary', bg: 'bg-primary/10' }
              ].map((stat, i) => (
                <div key={i} className="bg-card p-6 rounded-xl shadow-sm border border-border flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground font-medium">{stat.label}</p>
                    <p className={`text-2xl font-bold mt-1 ${stat.color}`}>{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${stat.bg}`}>
                    <TrendingUp className={stat.color} size={24} />
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Efficient Frontier Scatter Plot */}
                <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
                    <h3 className="font-semibold mb-6 text-foreground">Fronteira Eficiente</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                                <XAxis type="number" dataKey="x" name="Volatilidade" unit="%" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                                <YAxis type="number" dataKey="y" name="Retorno" unit="%" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                                <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ borderRadius: '8px', border: 'none', background: 'hsl(var(--card))', color: 'hsl(var(--card-foreground))', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                                <Scatter name="Portfólios Simulados" data={optimizationResult.frontier} fill="#8884d8" fillOpacity={0.6} shape="circle" />
                                {/* Highlight Optimal Point */}
                                <Scatter name="Max Sharpe" data={[{ 
                                  x: optimizationResult.scenarios[0].performance.volatility * 100, 
                                  y: optimizationResult.scenarios[0].performance.expectedReturn * 100 
                                }]} fill="hsl(var(--primary))" shape="star" />
                            </ScatterChart>
                        </ResponsiveContainer>
                    </div>
                    <p className="text-xs text-muted-foreground mt-4 text-center">
                      <span className="inline-block w-3 h-3 bg-[#8884d8] rounded-full mr-2"></span> Simulações
                      <span className="inline-block w-3 h-3 bg-primary ml-4 mr-2" style={{clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)'}}></span> Max Sharpe
                    </p>
                </div>

                {/* Allocation Comparison */}
                <div className="bg-card p-6 rounded-xl shadow-sm border border-border">
                    <h3 className="font-semibold mb-6 text-foreground">Alocação: Atual vs. Sugerida</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={Object.keys(optimizationResult.scenarios[0].weights).map(k => ({
                                name: k,
                                Atual: (assets.find(a => a.ticker === k)?.pct || 0) * 100,
                                Sugerido: optimizationResult.scenarios[0].weights[k] * 100
                            }))} barGap={8}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                                <YAxis unit="%" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', background: 'hsl(var(--card))', color: 'hsl(var(--card-foreground))', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} />
                                <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                <Bar dataKey="Atual" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} />
                                <Bar dataKey="Sugerido" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Backtest Section */}
            {optimizationResult.backtest && (
            <div className="bg-card p-6 rounded-xl shadow-sm border border-border mt-8">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="font-semibold text-foreground">Performance Histórica Simulada</h3>
                        <p className="text-sm text-muted-foreground">Backtest dos últimos 24 meses (R$ 10.000 iniciais)</p>
                    </div>
                    <div className="flex gap-4 text-sm">
                        <div className="px-3 py-1 bg-green-500/10 text-green-400 rounded-full font-medium">
                            Retorno: {(optimizationResult.backtest.metrics.totalReturn * 100).toFixed(2)}%
                        </div>
                        <div className="px-3 py-1 bg-red-500/10 text-red-400 rounded-full font-medium">
                            Max Drawdown: {(optimizationResult.backtest.metrics.maxDrawdown * 100).toFixed(2)}%
                        </div>
                    </div>
                </div>
                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={optimizationResult.backtest.dates.map((date: string, i: number) => ({
                            date,
                            Portfolio: optimizationResult.backtest.portfolioValues[i],
                            Benchmark: optimizationResult.backtest.benchmarkValues[i]
                        }))}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                            <XAxis 
                                dataKey="date" 
                                stroke="hsl(var(--muted-foreground))" 
                                fontSize={12} 
                                tickFormatter={(val) => val.split('-').slice(0,2).reverse().join('/')}
                                minTickGap={30}
                            />
                            <YAxis 
                                stroke="hsl(var(--muted-foreground))" 
                                fontSize={12} 
                                tickFormatter={(val) => `R$ ${(val/1000).toFixed(0)}k`}
                                domain={['auto', 'auto']}
                            />
                            <Tooltip 
                                contentStyle={{ borderRadius: '8px', border: 'none', background: 'hsl(var(--card))', color: 'hsl(var(--card-foreground))', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                formatter={(val: number) => [`R$ ${val.toFixed(2)}`, '']}
                            />
                            <Legend />
                            <Line type="monotone" dataKey="Portfolio" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                            <Line type="monotone" dataKey="Benchmark" stroke="hsl(var(--muted-foreground))" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
            )}

            <div className="flex justify-end gap-4 pt-4 border-t border-border">
                <button 
                    onClick={() => setStep(1)}
                    className="text-muted-foreground hover:text-foreground font-medium px-4 py-2"
                >
                    Reiniciar
                </button>
                <button 
                    onClick={() => handleDownloadReport('csv')}
                    className="border border-border text-foreground px-6 py-2 rounded-lg hover:bg-secondary flex items-center gap-2 font-medium"
                >
                    <FileText size={18} />
                    Exportar Planilha
                </button>
                <button 
                    onClick={() => handleDownloadReport('pdf')}
                    className="bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 flex items-center gap-2 font-medium shadow-sm"
                >
                    <Download size={18} />
                    Baixar PDF
                </button>
            </div>
        </motion.div>
      )}
    </div>
  );
}

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import ReportGenerator from './components/ReportGenerator';
import StudiesHistoryPage from './components/StudiesHistoryPage';
import StudyDetailPage from './components/StudyDetailPage';
import ReportDetailPage from './components/ReportDetailPage'; // Importa a nova página

const App: React.FC = () => {
  return (
    <Router>
      <div>
        <nav style={{ padding: '10px', background: '#f0f0f0', marginBottom: '20px' }}>
          <Link to="/" style={{ marginRight: '15px' }}>Gerar Relatório</Link>
          <Link to="/history">Histórico de Estudos</Link>
        </nav>

        <Routes>
          <Route path="/" element={<ReportGenerator />} />
          <Route path="/history" element={<StudiesHistoryPage />} />
          <Route path="/study/:id" element={<StudyDetailPage />} />
          {/* Adiciona a nova rota para a página de detalhes do relatório */}
          <Route path="/report/:id" element={<ReportDetailPage />} /> 
        </Routes>
      </div>
    </Router>
  );
};

export default App;

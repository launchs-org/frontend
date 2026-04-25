import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import ContainerDetail from './pages/ContainerDetail';
import History from './pages/History';
import Monitoring from './pages/Monitoring';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/containers/:id" element={<ContainerDetail />} />
          <Route path="/history" element={<History />} />
          <Route path="/monitoring" element={<Monitoring />} />
          {/* Add more routes here as they are created */}
          <Route path="*" element={
            <div className="flex flex-col items-center justify-center h-full space-y-4">
              <h1 className="text-9xl font-black italic tracking-tighter">404</h1>
              <p className="text-sm font-bold uppercase tracking-[0.5em] text-gray-400">Page not found</p>
              <button onClick={() => window.history.back()} className="mt-8 px-8 py-3 bg-black text-white font-bold hover:bg-gray-800 transition-colors uppercase tracking-widest text-xs border border-black">
                GO BACK
              </button>
            </div>
          } />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
};

export default App;

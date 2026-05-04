import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { User, Loader2 } from 'lucide-react';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import ContainerDetail from './pages/ContainerDetail';
import History from './pages/History';
import Monitoring from './pages/Monitoring';
import { api } from './lib/api';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = React.useState(!!sessionStorage.getItem('access_token'));
  const [isVerifying, setIsVerifying] = React.useState(!!localStorage.getItem('token'));

  React.useEffect(() => {
    const checkAuth = async () => {
      const refreshToken = localStorage.getItem('token');
      if (!refreshToken) {
        setIsAuthenticated(false);
        setIsVerifying(false);
        return;
      }

      try {
        // Use absolute path and specify useRefreshToken option
        await api.get(import.meta.env.VITE_API_AUTH_ME_PATH || '/auth/me', { useRefreshToken: true });
        setIsAuthenticated(true);
      } catch (error: any) {

        if (error.response?.status === 401) {
          setIsAuthenticated(false);
        }
      } finally {
        setIsVerifying(false);
      }
    };

    checkAuth();
  }, []);


  if (isVerifying) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-4 font-sans">
        <Loader2 className="w-8 h-8 text-[#0ea5e9] animate-spin mb-4" />
        <p className="text-[#cbd5e1] font-medium">認証中...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center p-4 font-sans">
        <div className="card p-12 text-center w-full max-w-md">
          <div className="w-16 h-16 bg-[#0ea5e9]/10 text-[#0ea5e9] rounded-lg flex items-center justify-center mx-auto mb-8">
            <User size={32} />
          </div>
          <h1 className="text-2xl font-bold text-[#f1f5f9] mb-4">認証が必要です</h1>
          <p className="text-[#94a3b8] mb-8 leading-relaxed">
            Launchs を使用するには AuthBase での認証が必要です。
          </p>
          
          <a 
            href="/auth/login" 
            className="inline-block w-full bg-[#0ea5e9] hover:bg-[#0284c7] text-white font-semibold py-3 px-6 rounded-lg transition-all"
          >
            ログイン
          </a>
          
          <p className="mt-6 text-xs text-[#475569]">
            ログイン後に自動的にダッシュボードへ移動します
          </p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter basename="/ui/">
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

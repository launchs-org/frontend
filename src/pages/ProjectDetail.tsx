import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { api } from '../lib/api';
import { 
  Plus,
  ArrowLeft,
  X,
  Loader2,
  Grid3X3,
  ZoomIn,
  ZoomOut,
  Maximize2
} from 'lucide-react';
import DependencyGraph from '../components/DependencyGraph';
import ContainerConfigTabs from '../components/ContainerConfigTabs';

interface Container {
  id: string;
  name: string;
  repository_url: string;
  branch: string;
  status: string;
  version: string;
  replicas: number;
  directory: string;
}

interface Project {
  id: string;
  name: string;
  namespace: string;
  k8s_resource_name?: string;
}

const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [project, setProject] = useState<Project | null>(null);
  const [containers, setContainers] = useState<Container[]>([]);
  const [selectedContainerId, setSelectedContainerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);

  // New container form state
  const [formData, setFormData] = useState({
    name: '',
    repository_url: '',
    branch: 'main',
    directory: '.',
    replicas: 1,
    env_vars: '{}',
    resources: '{}'
  });

  const fetchData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const projRes = await api.get(`/app/v1/projects/${id}`);

      setProject(projRes.data.data);
      setContainers(projRes.data.data.containers || []);
    } catch (error) {
      console.error('Failed to fetch project data:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id, location]);

  // Poll containers if any is building or deploying
  useEffect(() => {
    let interval: any;
    const hasTransitional = containers.some(c => c.status === 'Building' || c.status === 'Deploying');
    
    if (hasTransitional) {
      interval = setInterval(() => {
        fetchData(true);
      }, 3000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [containers]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateContainer = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post(`/app/v1/projects/${id}/containers`, formData);
      setShowModal(false);
      setFormData({
        name: '',
        repository_url: '',
        branch: 'main',
        directory: '.',
        replicas: 1,
        env_vars: '{}',
        resources: '{}'
      });
      fetchData();
    } catch (error) {
      console.error('Failed to create container:', error);
      alert('コンテナ作成に失敗しました。');
    } finally {
      setCreating(false);
    }
  };

  if (loading && !project) {
    return (
      <div className="flex flex-col items-center justify-center h-screen space-y-4">
        <Loader2 className="w-8 h-8 text-[#6366f1] animate-spin" />
      </div>
    );
  }

  const selectedContainer = containers.find(c => c.id === selectedContainerId) || null;

  return (
    <div className="h-screen flex flex-col bg-[#1a1b2e]">
      {/* Top Navigation */}
      <div className="h-16 bg-[#252742] border-b border-[#404556] px-6 flex items-center justify-between z-20">
        <div className="flex items-center space-x-4">
          <Link to="/projects" className="flex items-center space-x-2 text-[#9ca3af] hover:text-[#e5e7eb] transition-colors">
            <ArrowLeft size={18} />
            <span className="text-sm">プロジェクト一覧</span>
          </Link>
          <span className="text-[#404556]">/</span>
          <h1 className="text-lg font-semibold text-[#e5e7eb]">{project?.name}</h1>
        </div>

        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-[#6366f1] hover:bg-[#4f46e5] text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Plus size={16} />
          <span>コンテナ追加</span>
        </button>
      </div>

      {/* Main Layout: Left Control Panel | Center Graph | Right Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Control Panel */}
        <div className="w-20 bg-[#252742] border-r border-[#404556] flex flex-col items-center py-4 space-y-4">
          <button className="p-3 bg-[#3a3d52] hover:bg-[#404556] text-[#e5e7eb] rounded-lg transition-colors" title="グリッド">
            <Grid3X3 size={20} />
          </button>
          <button className="p-3 bg-[#3a3d52] hover:bg-[#404556] text-[#e5e7eb] rounded-lg transition-colors" title="ズームイン">
            <ZoomIn size={20} />
          </button>
          <button className="p-3 bg-[#3a3d52] hover:bg-[#404556] text-[#e5e7eb] rounded-lg transition-colors" title="ズームアウト">
            <ZoomOut size={20} />
          </button>
          <button className="p-3 bg-[#3a3d52] hover:bg-[#404556] text-[#e5e7eb] rounded-lg transition-colors" title="フィット">
            <Maximize2 size={20} />
          </button>
        </div>

        {/* Center: Dependency Graph */}
        <div className="flex-1 bg-gradient-to-br from-[#1a1b2e] to-[#252742]">
          <DependencyGraph 
            containers={containers}
            selectedContainerId={selectedContainerId}
            onSelectContainer={setSelectedContainerId}
          />
        </div>

        {/* Right Sidebar: Container Config */}
        <div className="w-80 bg-[#252742] border-l border-[#404556] flex flex-col overflow-hidden">
          {selectedContainer ? (
            <>
              {/* Sidebar Header */}
              <div className="h-16 border-b border-[#404556] px-6 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-[#e5e7eb]">{selectedContainer.name}</h2>
                <button 
                  onClick={() => setSelectedContainerId(null)}
                  className="text-[#9ca3af] hover:text-[#e5e7eb] transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Sidebar Content: Config Tabs */}
              <div className="flex-1 overflow-hidden">
                <ContainerConfigTabs container={selectedContainer} />
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-[#9ca3af] p-6">
              <div className="text-center">
                <p className="text-sm mb-2">コンテナを選択して</p>
                <p className="text-sm">設定を編集</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Container Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#252742] rounded-xl border border-[#404556] w-full max-w-lg animate-in zoom-in duration-300 overflow-hidden">
            <div className="px-6 py-4 border-b border-[#404556] flex justify-between items-center bg-[#1a1b2e]">
              <h3 className="text-lg font-semibold text-[#e5e7eb]">コンテナを新規追加</h3>
              <button onClick={() => setShowModal(false)} className="text-[#9ca3af] hover:text-[#e5e7eb] transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateContainer} className="p-8 space-y-6 max-h-96 overflow-y-auto">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#e5e7eb]">コンテナ名</label>
                <input 
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="例: frontend-api"
                  className="input"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#e5e7eb]">リポジトリ URL</label>
                <input 
                  type="url" 
                  name="repository_url"
                  value={formData.repository_url}
                  onChange={handleInputChange}
                  required
                  placeholder="https://github.com/username/repository"
                  className="input"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#e5e7eb]">ブランチ</label>
                <input 
                  type="text" 
                  name="branch"
                  value={formData.branch}
                  onChange={handleInputChange}
                  placeholder="main"
                  className="input"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#e5e7eb]">ディレクトリ</label>
                <input 
                  type="text" 
                  name="directory"
                  value={formData.directory}
                  onChange={handleInputChange}
                  placeholder="/"
                  className="input"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#e5e7eb]">レプリカ数</label>
                <input 
                  type="number" 
                  name="replicas"
                  value={formData.replicas}
                  onChange={handleInputChange}
                  min="1"
                  max="10"
                  className="input"
                />
              </div>

              <div className="pt-4 flex space-x-3">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-[#404556] text-[#e5e7eb] rounded-lg hover:bg-[#3a3d52] font-medium transition-colors"
                >
                  キャンセル
                </button>
                <button 
                  type="submit" 
                  disabled={creating}
                  className="flex-1 px-4 py-2 bg-[#6366f1] text-white rounded-lg hover:bg-[#4f46e5] font-medium transition-colors flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {creating ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      <span>作成中...</span>
                    </>
                  ) : (
                    <span>作成</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;

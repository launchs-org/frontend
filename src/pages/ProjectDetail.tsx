import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { api } from '../lib/api';
import { 
  Database,
  Plus,
  GitBranch,
  ArrowLeft,
  X,
  Loader2,
  FolderOpen,
  Network,
  ChevronRight
} from 'lucide-react';
import { cn } from '../lib/utils';

interface Container {
  id: string;
  name: string;
  repository_url: string;
  branch: string;
  status: string;
  version: string;
  replicas: number;
}

interface Project {
  id: string;
  name: string;
  namespace: string;
}

const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const [project, setProject] = useState<Project | null>(null);
  const [containers, setContainers] = useState<Container[]>([]);
  const [activeTab, setActiveTab] = useState<'list' | 'graph'>('list');
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
      alert('コンテナの作成に失敗しました。');
    } finally {
      setCreating(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'replicas' ? parseInt(value) : value
    }));
  };

  if (loading && !project) return (
    <div className="flex flex-col items-center justify-center h-64 space-y-4">
      <Loader2 className="w-8 h-8 text-[#1a73e8] animate-spin" />
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col space-y-4">
        <Link to="/projects" className="flex items-center space-x-2 text-sm text-[#5f6368] hover:text-[#1a73e8] transition-colors w-fit">
          <ArrowLeft size={16} />
          <span>プロジェクト一覧へ戻る</span>
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[#dadce0]">
          <div className="space-y-2">
            <h2 className="text-3xl font-normal text-[#202124]">{project?.name}</h2>
            <div className="flex items-center space-x-4 text-sm text-[#5f6368]">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-[#1e8e3e] rounded-full" />
                <span className="font-medium">ネームスペース: {project?.namespace}</span>
              </div>
              <span>•</span>
              <span>ID: {project?.id?.slice(0, 8)}</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setShowModal(true)}
              className="flex items-center space-x-2 px-6 py-2 bg-[#1a73e8] text-white text-sm font-medium rounded-md hover:shadow-md transition-all"
            >
              <Plus size={18} />
              <span>コンテナを追加</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#dadce0] -mx-8 px-8">
        <button
          onClick={() => setActiveTab('list')}
          className={cn(
            "px-6 py-4 text-sm font-medium flex items-center space-x-2 transition-all border-b-2",
            activeTab === 'list' 
              ? "border-[#1a73e8] text-[#1a73e8]" 
              : "border-transparent text-[#5f6368] hover:text-[#202124] hover:bg-[#f8f9fa]"
          )}
        >
          <FolderOpen size={18} />
          <span>リスト</span>
        </button>
        <button
          onClick={() => setActiveTab('graph')}
          className={cn(
            "px-6 py-4 text-sm font-medium flex items-center space-x-2 transition-all border-b-2",
            activeTab === 'graph' 
              ? "border-[#1a73e8] text-[#1a73e8]" 
              : "border-transparent text-[#5f6368] hover:text-[#202124] hover:bg-[#f8f9fa]"
          )}
        >
          <Network size={18} />
          <span>グラフ</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="py-2">
        {activeTab === 'list' ? (
          <div className="card overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="table-header">
                <tr>
                  <th className="px-6 py-4 font-medium text-[#5f6368]">コンテナ名</th>
                  <th className="px-6 py-4 font-medium text-[#5f6368]">リポジトリ</th>
                  <th className="px-6 py-4 font-medium text-[#5f6368]">ブランチ</th>
                  <th className="px-6 py-4 font-medium text-[#5f6368]">ステータス</th>
                  <th className="px-6 py-4 font-medium text-[#5f6368]">レプリカ</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody>
                {containers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-[#5f6368]">
                      コンテナがまだありません。
                    </td>
                  </tr>
                ) : (
                  containers.map((container) => (
                    <tr key={container.id} className="table-row hover:bg-[#f8f9fa] group">
                      <td className="px-6 py-4">
                        <Link 
                          to={`/containers/${container.id}`}
                          className="font-medium text-[#1a73e8] hover:underline"
                        >
                          {container.name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-xs text-[#5f6368] font-mono truncate max-w-[200px]">
                        {container.repository_url}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-1 text-[#5f6368]">
                          <GitBranch size={14} />
                          <span className="text-xs">{container.branch}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={cn(
                          "px-2 py-1 rounded text-xs font-medium inline-flex items-center space-x-1",
                          container.status === 'Running' ? "bg-[#e6f4ea] text-[#1e8e3e]" : "bg-[#f3f3f3] text-[#5f6368]"
                        )}>
                          <div className={cn(
                            "w-2 h-2 rounded-full",
                            container.status === 'Running' ? "bg-[#1e8e3e]" : "bg-[#dadce0]"
                          )} />
                          <span>{container.status}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[#5f6368]">{container.replicas}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Link 
                          to={`/containers/${container.id}`}
                          className="p-2 hover:bg-[#e8f0fe] rounded text-[#1a73e8] transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <ChevronRight size={18} />
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="card p-8 bg-[#f8f9fa]">
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Network size={48} className="text-[#dadce0]" />
              <div className="text-center">
                <h3 className="text-lg font-medium text-[#202124] mb-2">グラフビュー</h3>
                <p className="text-sm text-[#5f6368]">
                  {containers.length > 0 
                    ? `${containers.length} 個のコンテナの依存関係を表示します`
                    : 'グラフを表示するにはコンテナを追加してください'}
                </p>
              </div>
              {containers.length > 0 && (
                <div className="mt-6 w-full bg-white rounded-lg p-6 border border-[#dadce0]">
                  <div className="flex flex-wrap gap-4">
                    {containers.map((container, idx) => (
                      <div 
                        key={container.id}
                        className="flex items-center space-x-2"
                      >
                        <div className="p-3 bg-[#e8f0fe] text-[#1a73e8] rounded-lg">
                          <Database size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#202124]">{container.name}</p>
                          <p className="text-xs text-[#5f6368]">{container.branch}</p>
                        </div>
                        {idx < containers.length - 1 && (
                          <ChevronRight size={20} className="text-[#dadce0] mx-2" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* New Container Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg animate-in zoom-in duration-300 overflow-hidden">
            <div className="px-6 py-4 border-b border-[#dadce0] flex justify-between items-center bg-[#f8f9fa]">
              <h3 className="text-lg font-medium text-[#202124]">コンテナを新規追加</h3>
              <button onClick={() => setShowModal(false)} className="text-[#5f6368] hover:text-[#202124] transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateContainer} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-[#202124]">コンテナ名</label>
                <input 
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="例: frontend-api"
                  className="input" 
                />
                <p className="text-[10px] text-[#5f6368]">一意の名称を指定してください。</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[#202124]">リポジトリ URL (GitHub)</label>
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
                <label className="text-sm font-medium text-[#202124]">ブランチ</label>
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
                <label className="text-sm font-medium text-[#202124]">サブディレクトリ</label>
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
                <label className="text-sm font-medium text-[#202124]">レプリカ数</label>
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
                  className="flex-1 px-4 py-2 border border-[#dadce0] text-[#3c4043] rounded-md hover:bg-[#f1f3f4] font-medium transition-colors"
                >
                  キャンセル
                </button>
                <button 
                  type="submit" 
                  disabled={creating}
                  className="flex-1 px-4 py-2 bg-[#1a73e8] text-white rounded-md hover:shadow-lg font-medium transition-all flex items-center justify-center space-x-2"
                >
                  {creating ? <Loader2 className="animate-spin" size={18} /> : <Plus size={18} />}
                  <span>{creating ? '作成中...' : '作成する'}</span>
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

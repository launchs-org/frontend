import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { api } from '../lib/api';
import { 
  Database,
  Plus,
  RotateCcw,
  GitBranch,
  ArrowLeft,
  X,
  Loader2,
  FolderOpen,
  History,
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
  const [activeTab, setActiveTab] = useState<'containers' | 'history'>('containers');
  const [histories, setHistories] = useState<any[]>([]);
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

  const fetchData = async () => {
    try {
      setLoading(true);
      const [projRes, histRes] = await Promise.all([
        api.get(`/app/v1/projects/${id}`),
        api.get(`/app/v1/projects/${id}/histories`)
      ]);

      setProject(projRes.data.data);
      setContainers(projRes.data.data.containers || []);
      setHistories(histRes.data.data.items || []);
    } catch (error) {
      console.error('Failed to fetch project data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id, location]);

  const handleRollback = async (historyId: string) => {
    if (!confirm('このスナップショットの状態にロールバックしますか？')) return;
    try {
      await api.post(`/app/v1/projects/${id}/rollback/${historyId}`);
      alert('ロールバックを開始しました。');
      fetchData();
    } catch (error) {
      console.error('Rollback failed:', error);
      alert('ロールバックに失敗しました。');
    }
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
      <Loader2 className="w-8 h-8 text-google-blue animate-spin" />
    </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col space-y-4">
        <Link to="/projects" className="flex items-center space-x-2 text-sm text-[#5f6368] hover:text-google-blue transition-colors w-fit">
          <ArrowLeft size={16} />
          <span>プロジェクト一覧へ戻る</span>
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-[#dadce0]">
          <div className="space-y-1">
            <h2 className="text-3xl font-normal text-[#202124]">{project?.name}</h2>
            <div className="flex items-center space-x-4 text-sm text-[#5f6368]">
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-google-green rounded-full" />
                <span className="font-medium">ネームスペース: {project?.namespace}</span>
              </div>
              <span>•</span>
              <span>ID: {project?.id?.slice(0, 8)}</span>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setShowModal(true)}
              className="flex items-center space-x-2 px-6 py-2 bg-google-blue text-white text-sm font-medium rounded-md hover:shadow-md transition-all"
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
          onClick={() => setActiveTab('containers')}
          className={cn(
            "px-6 py-4 text-sm font-medium flex items-center space-x-2 transition-all border-b-2",
            activeTab === 'containers' 
              ? "border-google-blue text-google-blue" 
              : "border-transparent text-[#5f6368] hover:text-[#202124] hover:bg-gray-50"
          )}
        >
          <FolderOpen size={18} />
          <span>コンテナ</span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={cn(
            "px-6 py-4 text-sm font-medium flex items-center space-x-2 transition-all border-b-2",
            activeTab === 'history' 
              ? "border-google-blue text-google-blue" 
              : "border-transparent text-[#5f6368] hover:text-[#202124] hover:bg-gray-50"
          )}
        >
          <History size={18} />
          <span>構成履歴・復元</span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="py-2">
        {activeTab === 'containers' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {containers.map((container) => (
              <Link 
                key={container.id} 
                to={`/containers/${container.id}`}
                className="google-card p-6 hover:shadow-lg transition-all group border-transparent hover:border-google-blue/20"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="p-3 bg-blue-50 text-google-blue rounded-xl group-hover:bg-google-blue group-hover:text-white transition-colors">
                    <Database size={24} />
                  </div>
                  <div className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                    container.status === 'Running' ? "bg-green-100 text-green-700" : "bg-gray-100 text-[#5f6368]"
                  )}>
                    {container.status}
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-lg font-medium text-[#202124] group-hover:text-google-blue transition-colors">{container.name}</h4>
                    <p className="text-xs text-[#5f6368] mt-1 font-mono truncate">{container.repository_url}</p>
                  </div>
                  <div className="flex items-center justify-between pt-4 border-t border-[#f1f3f4]">
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-1 text-[#5f6368]">
                        <GitBranch size={14} />
                        <span className="text-xs font-medium">{container.branch}</span>
                      </div>
                      <span className="text-gray-300">|</span>
                      <div className="flex items-center space-x-1 text-[#5f6368]">
                        <RotateCcw size={14} />
                        <span className="text-xs font-medium">{container.replicas}</span>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-gray-300 group-hover:text-google-blue transition-all" />
                  </div>
                </div>
              </Link>
            ))}
            {containers.length === 0 && (
              <div className="col-span-full py-20 text-center google-card border-dashed">
                <Database size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-[#5f6368]">コンテナがまだありません。新しいコンテナを追加してください。</p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {histories.map((history) => (
              <div key={history.id} className="google-card p-5 flex items-center justify-between group hover:border-google-blue transition-all">
                <div className="flex items-center space-x-6">
                  <div className="p-2.5 bg-gray-50 text-gray-400 group-hover:bg-blue-50 group-hover:text-google-blue rounded-lg transition-all">
                    <History size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#202124]">構成スナップショット: {history.version_name}</p>
                    <p className="text-[11px] text-[#5f6368] mt-0.5">
                      保存日: {new Date(history.created_at).toLocaleString('ja-JP')}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => handleRollback(history.id)}
                  className="px-4 py-1.5 border border-[#dadce0] rounded text-xs font-medium text-[#202124] hover:bg-gray-50 hover:border-[#bdc1c6] transition-all flex items-center space-x-1"
                >
                  <RotateCcw size={14} />
                  <span>この時点に復元</span>
                </button>
              </div>
            ))}
            {histories.length === 0 && (
              <div className="py-20 text-center google-card border-dashed">
                <History size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-[#5f6368]">履歴がまだありません。構成を変更すると自動的に保存されます。</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* New Container Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg animate-in zoom-in duration-300 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-lg font-medium text-[#202124]">コンテナを新規追加</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
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
                  className="google-input" 
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
                  className="google-input" 
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
                  className="google-input" 
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
                  className="google-input" 
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
                  className="google-input" 
                />
              </div>

              <div className="pt-4 flex space-x-3">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium transition-colors"
                >
                  キャンセル
                </button>
                <button 
                  type="submit" 
                  disabled={creating}
                  className="flex-1 px-4 py-2 bg-google-blue text-white rounded-md hover:shadow-lg font-medium transition-all flex items-center justify-center space-x-2"
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

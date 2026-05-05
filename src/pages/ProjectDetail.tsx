import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { 
  Plus,
  ArrowLeft,
  X,
  Loader2,
  RotateCcw,
  Play,
  Trash2
} from 'lucide-react';
import DependencyGraph from '../components/DependencyGraph';
import ContainerConfigTabs from '../components/ContainerConfigTabs';
import { useToast } from '../context/ToastContext';

interface Container {
  id: string;
  name: string;
  repository_url: string;
  branch: string;
  status: string;
  version: string;
  replicas: number;
  directory: string;
  project_id: string;
}

interface Project {
  id: string;
  name: string;
  namespace: string;
  k8s_resource_name?: string;
}

const ProjectDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { addToast } = useToast();
  const [project, setProject] = useState<Project | null>(null);
  const [containers, setContainers] = useState<Container[]>([]);
  const [selectedContainerId, setSelectedContainerId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [performingAction, setPerformingAction] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

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
      addToast('プロジェクトデータの読み込みに失敗しました', 'error');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

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
      addToast('コンテナを作成しました', 'success');
      fetchData();
    } catch (error) {
      console.error('Failed to create container:', error);
      addToast('コンテナ作成に失敗しました', 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleRebuild = async (containerId: string) => {
    setPerformingAction(containerId);
    try {
      await api.post(`/app/v1/containers/${containerId}/rebuild`);
      addToast('再ビルドを開始しました', 'success');
      fetchData(true);
    } catch (error) {
      console.error('Failed to rebuild:', error);
      addToast('再ビルドに失敗しました', 'error');
    } finally {
      setPerformingAction(null);
    }
  };

  const handleRedeploy = async (containerId: string) => {
    setPerformingAction(containerId);
    try {
      await api.post(`/app/v1/containers/${containerId}/redeploy`);
      addToast('再デプロイを開始しました', 'success');
      fetchData(true);
    } catch (error) {
      console.error('Failed to redeploy:', error);
      addToast('再デプロイに失敗しました', 'error');
    } finally {
      setPerformingAction(null);
    }
  };

  const handleDeleteContainer = async (containerId: string) => {
    setPerformingAction(containerId);
    try {
      await api.delete(`/app/v1/containers/${containerId}`);
      addToast('コンテナを削除しました', 'success');
      setShowDeleteConfirm(null);
      setSelectedContainerId(null);
      fetchData(true);
    } catch (error) {
      console.error('Failed to delete container:', error);
      addToast('コンテナ削除に失敗しました', 'error');
    } finally {
      setPerformingAction(null);
    }
  };

  if (loading && !project) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center space-y-4 bg-[#1a1b2e]">
        <Loader2 className="w-8 h-8 text-[#6366f1] animate-spin" />
        <p className="text-[#9ca3af]">プロジェクトを読み込み中...</p>
      </div>
    );
  }

  const selectedContainer = containers.find(c => c.id === selectedContainerId) || null;

  return (
    <div className="w-full h-full flex flex-col bg-[#1a1b2e] overflow-hidden">

      {/* Top Navigation */}
      <div className="h-16 bg-[#252742] border-b border-[#404556] px-6 flex items-center justify-between z-20 flex-shrink-0">
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

      {/* Main Content - Full Width */}
      <div className="flex-1 flex overflow-hidden">
        {/* Center: Dependency Graph */}
        <div className="flex-1 flex flex-col border-r border-[#404556]">
          <DependencyGraph 
            containers={containers} 
            selectedContainerId={selectedContainerId}
            onSelectContainer={setSelectedContainerId}
          />
        </div>

        {/* Right: Container Details Sidebar */}
        {selectedContainer && (
          <div className="w-80 bg-[#252742] border-l border-[#404556] flex flex-col overflow-hidden">
            {/* Sidebar Header */}
            <div className="h-14 border-b border-[#404556] px-6 flex items-center justify-between flex-shrink-0">
              <h3 className="font-semibold text-[#e5e7eb]">{selectedContainer.name}</h3>
              <button 
                onClick={() => setSelectedContainerId(null)}
                className="text-[#9ca3af] hover:text-[#e5e7eb] transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Sidebar Actions */}
            <div className="px-6 py-4 border-b border-[#404556] space-y-2 flex-shrink-0">
              <div className="flex items-center space-x-2 text-xs text-[#9ca3af] mb-3">
                <span className={`inline-block w-2 h-2 rounded-full ${
                  selectedContainer.status === 'Running' ? 'bg-[#10b981]' : 'bg-[#f59e0b]'
                }`} />
                <span>{selectedContainer.status}</span>
              </div>
              
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleRebuild(selectedContainer.id)}
                  disabled={performingAction === selectedContainer.id}
                  className="flex items-center justify-center space-x-1 px-3 py-2 bg-[#3a3d52] hover:bg-[#404556] text-[#e5e7eb] text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {performingAction === selectedContainer.id ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <>
                      <RotateCcw size={14} />
                      <span>ビルド</span>
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => handleRedeploy(selectedContainer.id)}
                  disabled={performingAction === selectedContainer.id}
                  className="flex items-center justify-center space-x-1 px-3 py-2 bg-[#3a3d52] hover:bg-[#404556] text-[#e5e7eb] text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  {performingAction === selectedContainer.id ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <>
                      <Play size={14} />
                      <span>デプロイ</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => setShowDeleteConfirm(selectedContainer.id)}
                  disabled={performingAction === selectedContainer.id}
                  className="flex items-center justify-center space-x-1 px-3 py-2 bg-[#ef4444]/10 hover:bg-[#ef4444]/20 text-[#ef4444] text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                >
                  <Trash2 size={14} />
                  <span>削除</span>
                </button>
              </div>
            </div>

            {/* Delete Confirmation */}
            {showDeleteConfirm === selectedContainer.id && (
              <div className="px-6 py-3 bg-[#ef4444]/10 border-b border-[#ef4444]/20 flex items-center justify-between flex-shrink-0">
                <p className="text-xs text-[#ef4444]">削除確認</p>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowDeleteConfirm(null)}
                    className="px-2 py-1 text-xs bg-[#3a3d52] hover:bg-[#404556] rounded transition-colors"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={() => handleDeleteContainer(selectedContainer.id)}
                    disabled={performingAction === selectedContainer.id}
                    className="px-2 py-1 text-xs bg-[#ef4444] hover:bg-[#dc2626] text-white rounded transition-colors disabled:opacity-50"
                  >
                    削除
                  </button>
                </div>
              </div>
            )}

            {/* Sidebar Content - Scrollable */}
            <div className="flex-1 overflow-y-auto">
              <ContainerConfigTabs container={selectedContainer} />
            </div>
          </div>
        )}
      </div>

      {/* New Container Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto animate-in zoom-in duration-300 border border-[#404556]">
            <div className="sticky top-0 px-6 py-4 border-b border-[#404556] flex justify-between items-center bg-[#1a1b2e] z-10">
              <h3 className="text-lg font-semibold text-[#e5e7eb]">コンテナを追加</h3>
              <button onClick={() => setShowModal(false)} className="text-[#9ca3af] hover:text-[#e5e7eb] transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateContainer} className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">コンテナ名</label>
                <input 
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  placeholder="例: frontend"
                  className="input"
                />
                <p className="text-[10px] text-[#9ca3af]">一意の名称を指定してください。</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">リポジトリ URL</label>
                <input 
                  type="url" 
                  name="repository_url"
                  value={formData.repository_url}
                  onChange={handleInputChange}
                  required
                  placeholder="https://github.com/username/repo"
                  className="input"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">ブランチ</label>
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
                  <label className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">レプリカ数</label>
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
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">ディレクトリ</label>
                <input 
                  type="text" 
                  name="directory"
                  value={formData.directory}
                  onChange={handleInputChange}
                  placeholder="/"
                  className="input"
                />
              </div>

              <div className="pt-4 flex space-x-3">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border border-[#404556] text-[#e5e7eb] rounded-lg hover:bg-[#3a3d52] font-medium transition-colors text-sm"
                >
                  キャンセル
                </button>
                <button 
                  type="submit" 
                  disabled={creating}
                  className="flex-1 px-4 py-2.5 bg-[#6366f1] hover:bg-[#4f46e5] text-white rounded-lg font-medium transition-all flex items-center justify-center space-x-2 text-sm disabled:opacity-50"
                >
                  {creating ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
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

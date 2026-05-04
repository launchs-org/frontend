import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { 
  Plus, 
  Folder, 
  X,
  Loader2,
  Trash2,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface Project {
  id: string;
  name: string;
  namespace: string;
  k8s_resource_name: string;
}

const Projects: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  
  // New project form state
  const [formData, setFormData] = useState({
    name: ''
  });

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await api.get('/app/v1/projects');
      setProjects(response.data.data.items || []);
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post('/app/v1/projects', formData);
      setShowModal(false);
      setFormData({ name: '' });
      fetchProjects();
    } catch (error) {
      console.error('Failed to create project:', error);
      alert('プロジェクトの作成に失敗しました。プロジェクト名は英小文字、数字、ハイフンのみ使用可能です。');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteProject = async (e: React.MouseEvent, id: string, name: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!confirm(`プロジェクト "${name}" を削除しますか？\nこの操作は取り消せません。`)) return;

    try {
      await api.delete(`/app/v1/projects/${id}`);
      fetchProjects();
    } catch (error) {
      console.error('Failed to delete project:', error);
      alert('プロジェクトの削除に失敗しました。');
    } finally {
      setOpenMenuId(null);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-[#f1f5f9]">プロジェクト</h2>
          <p className="text-sm text-[#94a3b8] mt-2">デプロイ環境とサービスグループを管理</p>
        </div>
        
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-[#0ea5e9] text-white text-sm font-medium rounded-lg hover:bg-[#0284c7] transition-all active:scale-95"
        >
          <Plus size={18} />
          <span>新規プロジェクト</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          [1, 2, 3].map((i) => (
            <div key={i} className="card p-6 h-48 animate-pulse bg-[#1e293b]" />
          ))
        ) : projects.length === 0 ? (
          <div className="col-span-full py-20 text-center card border-dashed">
            <Folder size={48} className="mx-auto text-[#475569] mb-4" />
            <p className="text-[#94a3b8]">プロジェクトがまだありません。新しいプロジェクトを作成してください。</p>
          </div>
        ) : (
          projects.map((project) => (
            <Link 
              key={project.id} 
              to={`/projects/${project.id}`}
              className="card p-6 hover:border-[#0ea5e9] transition-all group hover:shadow-lg relative"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="p-3 bg-[#0ea5e9]/10 text-[#0ea5e9] rounded-lg group-hover:bg-[#0ea5e9] group-hover:text-white transition-colors">
                  <Folder size={24} />
                </div>
                <div className="relative">
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setOpenMenuId(openMenuId === project.id ? null : project.id);
                    }}
                    className="p-2 text-[#94a3b8] hover:bg-[#334155] rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Trash2 size={18} />
                  </button>
                  {openMenuId === project.id && (
                    <div className="absolute right-0 mt-2 w-48 bg-[#1e293b] rounded-lg shadow-xl border border-[#334155] z-10 py-1 animate-in fade-in zoom-in duration-200">
                      <button
                        onClick={(e) => handleDeleteProject(e, project.id, project.name)}
                        className="w-full text-left px-4 py-2 text-sm text-[#ef4444] hover:bg-[#ef4444]/10 flex items-center space-x-2 transition-colors"
                      >
                        <Trash2 size={16} />
                        <span>削除</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="space-y-3">
                <div>
                  <h3 className="text-lg font-semibold text-[#f1f5f9] group-hover:text-[#0ea5e9] transition-colors">{project.name}</h3>
                  <p className="text-xs text-[#94a3b8] mt-1">ns: {project.namespace}</p>
                </div>
                <div className="pt-4 border-t border-[#334155] flex items-center justify-between">
                  <code className="text-[10px] text-[#0ea5e9] font-mono">{project.k8s_resource_name}</code>
                  <ArrowRight size={16} className="text-[#475569] group-hover:text-[#0ea5e9] transition-all" />
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      {/* New Project Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card rounded-lg w-full max-w-md animate-in zoom-in duration-300 overflow-hidden">
            <div className="px-6 py-4 border-b border-[#334155] flex justify-between items-center">
              <h3 className="text-lg font-semibold text-[#f1f5f9]">プロジェクトを作成</h3>
              <button onClick={() => setShowModal(false)} className="text-[#94a3b8] hover:text-[#f1f5f9] transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateProject} className="p-6 space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#cbd5e1] uppercase tracking-wide">プロジェクト名</label>
                <input 
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  pattern="^[a-z0-9-]+$"
                  placeholder="英小文字、数字、ハイフン"
                  className="input"
                />
                <p className="text-[10px] text-[#94a3b8]">
                  Kubernetes のネームスペース名として使用されます
                </p>
              </div>

              <div className="flex space-x-3 pt-2">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2.5 border border-[#334155] text-[#cbd5e1] rounded-lg hover:bg-[#334155] font-medium transition-colors text-sm"
                >
                  キャンセル
                </button>
                <button 
                  type="submit" 
                  disabled={creating}
                  className="flex-1 px-4 py-2.5 bg-[#0ea5e9] text-white rounded-lg hover:bg-[#0284c7] font-medium transition-all flex items-center justify-center space-x-2 text-sm disabled:opacity-50"
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

export default Projects;


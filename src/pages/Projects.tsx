import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { 
  Plus, 
  Folder, 
  X,
  Loader2,
  Trash2,
  ChevronRight
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
          <h2 className="text-2xl font-semibold text-[#e5e7eb]">プロジェクト</h2>
          <p className="text-sm text-[#9ca3af] mt-1">デプロイ環境とサービスグループを管理します。</p>
        </div>
        
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 px-6 py-2 bg-[#6366f1] hover:bg-[#4f46e5] text-white text-sm font-medium rounded-lg transition-all shadow-lg shadow-[#6366f1]/20 hover:shadow-[#6366f1]/30 active:scale-95"
        >
          <Plus size={18} />
          <span>新規プロジェクト</span>
        </button>
      </div>

      {loading ? (
        <div className="card p-6">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-[#3a3d52] animate-pulse rounded" />
            ))}
          </div>
        </div>
      ) : projects.length === 0 ? (
        <div className="card py-20 text-center">
          <Folder size={48} className="mx-auto text-[#404556] mb-4" />
          <p className="text-[#9ca3af]">プロジェクトがまだありません。新しいプロジェクトを作成してください。</p>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="table-header">
              <tr>
                <th className="px-6 py-4 font-medium text-[#9ca3af]">プロジェクト名</th>
                <th className="px-6 py-4 font-medium text-[#9ca3af]">ネームスペース</th>
                <th className="px-6 py-4 font-medium text-[#9ca3af]">リソース名</th>
                <th className="px-6 py-4"></th>
              </tr>
            </thead>
            <tbody>
              {projects.map((project) => (
                <tr key={project.id} className="table-row group">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <Folder size={18} className="text-[#6366f1]" />
                      <Link 
                        to={`/projects/${project.id}`}
                        className="font-medium text-[#6366f1] hover:text-[#8b5cf6] transition-colors"
                      >
                        {project.name}
                      </Link>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-[#9ca3af]">{project.namespace}</td>
                  <td className="px-6 py-4">
                    <code className="bg-[#1a1b2e] px-2 py-1 rounded text-xs text-[#6366f1] font-mono">
                      {project.k8s_resource_name}
                    </code>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link 
                        to={`/projects/${project.id}`}
                        className="p-2 hover:bg-[#6366f1]/10 rounded text-[#6366f1] transition-colors"
                      >
                        <ChevronRight size={18} />
                      </Link>
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setOpenMenuId(openMenuId === project.id ? null : project.id);
                        }}
                        className="p-2 hover:bg-[#3a3d52] rounded text-[#9ca3af] transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                      {openMenuId === project.id && (
                        <div className="absolute right-8 mt-10 w-48 bg-[#252742] rounded-lg shadow-xl border border-[#404556] z-10 py-1 animate-in fade-in zoom-in duration-200">
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
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* New Project Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card rounded-lg w-full max-w-md animate-in zoom-in duration-300 overflow-hidden border border-[#404556]">
            <div className="px-6 py-4 border-b border-[#404556] flex justify-between items-center bg-[#1a1b2e]">
              <h3 className="text-lg font-semibold text-[#e5e7eb]">プロジェクトを新規作成</h3>
              <button onClick={() => setShowModal(false)} className="text-[#9ca3af] hover:text-[#e5e7eb] transition-colors">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleCreateProject} className="p-6 space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wider">プロジェクト名</label>
                <input 
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  pattern="^[a-z0-9-]+$"
                  placeholder="英小文字、数字、ハイフンのみ"
                  className="input"
                />
                <p className="text-[10px] text-[#9ca3af]">
                  ※ プロジェクト名は Kubernetes のネームスペース名としても使用されます。
                </p>
              </div>

              <div className="pt-2 flex space-x-3">
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

export default Projects;


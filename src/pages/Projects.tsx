import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { 
  Plus, 
  Search, 
  Folder, 
  MoreVertical, 
  ExternalLink,
  ChevronRight,
  Filter
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

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await api.get('/app/v1/projects');
        setProjects(response.data || []);

      } catch (error) {
        console.error('Failed to fetch projects:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-normal text-[#202124]">プロジェクト</h2>
          <p className="text-sm text-[#5f6368] mt-1">デプロイ環境とサービスグループを管理します。</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
            <input 
              type="text" 
              placeholder="プロジェクトを検索" 
              className="pl-10 pr-4 py-2 bg-white border border-[#dadce0] rounded-md focus:outline-none focus:ring-1 focus:ring-google-blue focus:border-google-blue text-sm w-72"
            />
          </div>
          <button className="flex items-center space-x-2 px-6 py-2 bg-google-blue text-white text-sm font-medium rounded-md hover:shadow-md transition-all">
            <Plus size={18} />
            <span>新規プロジェクト</span>
          </button>
        </div>
      </div>

      <div className="flex items-center space-x-2 py-2 border-b border-[#dadce0]">
        <button className="flex items-center space-x-2 px-3 py-1 hover:bg-gray-100 rounded text-sm text-[#5f6368] font-medium">
          <Filter size={16} />
          <span>フィルタを追加</span>
        </button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="w-8 h-8 border-4 border-google-blue border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[#5f6368]">プロジェクトを読み込み中...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="google-card p-20 text-center space-y-6 bg-white">
          <div className="w-20 h-20 bg-gray-50 flex items-center justify-center mx-auto rounded-full">
            <Folder size={32} className="text-gray-300" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-medium text-[#202124]">プロジェクトがありません</h3>
            <p className="text-[#5f6368] max-w-xs mx-auto text-sm">
              最初のプロジェクトを作成して、コンテナのデプロイを開始しましょう。
            </p>
          </div>
          <button className="px-6 py-2 bg-google-blue text-white text-sm font-medium rounded-md">
            最初のプロジェクトを作成
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Link 
              key={project.id}
              to={`/projects/${project.id}`}
              className="google-card p-6 bg-white hover:border-google-blue transition-all"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="w-10 h-10 bg-blue-50 text-google-blue rounded-lg flex items-center justify-center">
                  <Folder size={20} />
                </div>
                <button className="p-2 hover:bg-gray-100 rounded-full text-gray-400"><MoreVertical size={18} /></button>
              </div>

              <div>
                <h3 className="text-lg font-medium text-[#202124] truncate">{project.name}</h3>
                <div className="mt-4 space-y-1">
                  <div className="flex items-center text-xs text-[#5f6368]">
                    <span className="w-24 font-medium">ネームスペース:</span>
                    <span className="bg-gray-100 px-2 py-0.5 rounded text-[#202124]">{project.namespace}</span>
                  </div>
                  <div className="flex items-center text-xs text-[#5f6368]">
                    <span className="w-24 font-medium">リソース名:</span>
                    <span>{project.k8s_resource_name}</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-[#f1f3f4] flex items-center justify-between">
                <div className="flex -space-x-1.5">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-6 h-6 rounded-full border-2 border-white bg-gray-200" />
                  ))}
                  <div className="w-6 h-6 rounded-full border-2 border-white bg-[#5f6368] text-[9px] flex items-center justify-center text-white font-bold">+2</div>
                </div>
                <div className="flex items-center space-x-1 text-sm text-google-blue font-medium">
                  <span>詳細を表示</span>
                  <ChevronRight size={16} />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Projects;

import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { 
  Server, 
  Settings, 
  Terminal, 
  Activity, 
  Cpu, 
  Database,
  ExternalLink,
  Plus,
  Play,
  RotateCcw,
  StopCircle,
  Clock,
  GitBranch,
  ArrowLeft
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
  const [project, setProject] = useState<Project | null>(null);
  const [containers, setContainers] = useState<Container[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projRes, contRes] = await Promise.all([
          api.get(`/v1/projects/${id}`),
          api.get(`/v1/projects/${id}/containers`)
        ]);
        setProject(projRes.data);
        setContainers(contRes.data || []);
      } catch (error) {
        console.error('Failed to fetch project data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 space-y-4">
      <div className="w-8 h-8 border-4 border-google-blue border-t-transparent rounded-full animate-spin" />
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
            <button className="px-4 py-2 border border-[#dadce0] bg-white rounded-md text-sm font-medium text-[#3c4043] hover:bg-gray-50">
              プロジェクトを編集
            </button>
            <button className="flex items-center space-x-2 px-6 py-2 bg-google-blue text-white text-sm font-medium rounded-md hover:shadow-md transition-all">
              <Plus size={18} />
              <span>コンテナを追加</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: '合計レプリカ数', value: containers.reduce((acc, c) => acc + c.replicas, 0), icon: Server, color: 'text-blue-600' },
          { label: '稼働スコア', value: '98%', icon: Activity, color: 'text-green-600' },
          { label: 'リソース割当', value: '4.2 CPU / 8GB', icon: Cpu, color: 'text-yellow-600' },
        ].map((stat, i) => (
          <div key={i} className="google-card p-5 flex items-center space-x-4">
            <div className={cn("p-2 rounded-lg bg-gray-50", stat.color)}>
              <stat.icon size={24} />
            </div>
            <div>
              <p className="text-xs text-[#5f6368] font-medium uppercase tracking-wider">{stat.label}</p>
              <p className="text-2xl font-medium text-[#202124]">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Containers Grid */}
      <div className="space-y-6">
        <h3 className="text-xl font-medium text-[#202124]">コンテナ一覧</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {containers.map((container) => (
            <div 
              key={container.id}
              className="google-card bg-white flex flex-col group hover:border-google-blue transition-all"
            >
              <div className="p-6 flex-1 space-y-6">
                <div className="flex justify-between items-start">
                  <div className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium",
                    container.status === 'Running' ? "bg-green-100 text-green-700" : "bg-gray-100 text-[#5f6368]"
                  )}>
                    {container.status === 'Running' ? '稼働中' : container.status}
                  </div>
                  <div className="flex items-center space-x-1 text-gray-400">
                    <Database size={16} />
                    <span className="text-xs font-mono">v{container.version || '0.0.1'}</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-xl font-medium text-[#202124] group-hover:text-google-blue cursor-pointer transition-colors">
                    {container.name}
                  </h4>
                  <div className="mt-2 flex items-center space-x-2 text-xs text-[#5f6368]">
                    <GitBranch size={14} />
                    <span className="truncate">{container.repository_url.split('/').pop()}</span>
                    <span>•</span>
                    <span>{container.branch}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-[#f1f3f4]">
                  <div>
                    <p className="text-[10px] text-[#5f6368] font-medium uppercase">レプリカ</p>
                    <p className="text-sm font-medium text-[#202124]">{container.replicas} インスタンス</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[#5f6368] font-medium uppercase">最終ビルド</p>
                    <p className="text-sm font-medium text-[#202124] flex items-center space-x-1">
                      <Clock size={14} className="text-gray-400" />
                      <span>2時間前</span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-[#f8f9fa] p-3 flex items-center justify-between border-t border-[#dadce0] rounded-b-lg">
                <div className="flex items-center space-x-1">
                  <button className="p-2 hover:bg-white rounded-full text-[#5f6368] hover:text-[#202124] transition-all" title="再起動">
                    <RotateCcw size={16} />
                  </button>
                  <button className="p-2 hover:bg-white rounded-full text-google-red transition-all" title="停止">
                    <StopCircle size={16} />
                  </button>
                </div>
                <Link 
                  to={`/containers/${container.id}`}
                  className="px-4 py-1.5 bg-white border border-[#dadce0] text-xs font-medium text-[#1a73e8] rounded hover:bg-blue-50 transition-all flex items-center space-x-1"
                >
                  <span>管理</span>
                  <ExternalLink size={14} />
                </Link>
              </div>
            </div>
          ))}

          {/* Empty Add Card */}
          <button className="border-2 border-dashed border-[#dadce0] rounded-lg p-6 flex flex-col items-center justify-center space-y-4 hover:border-google-blue hover:bg-blue-50/30 transition-all group min-h-[250px]">
            <div className="p-4 bg-gray-100 rounded-full group-hover:bg-google-blue group-hover:text-white transition-all">
              <Plus size={32} />
            </div>
            <p className="text-sm font-medium text-[#5f6368]">コンテナを新規作成</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;

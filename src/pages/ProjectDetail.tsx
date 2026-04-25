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
  GitBranch
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
          api.get(`/v1/projects/${id}/containers`) // Assuming this endpoint exists or filter all
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

  if (loading) return <div className="animate-pulse space-y-8">
    <div className="h-20 bg-gray-100 border border-black" />
    <div className="grid grid-cols-3 gap-6">
      {[1, 2, 3].map(i => <div key={i} className="h-64 bg-gray-50 border border-black" />)}
    </div>
  </div>;

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-10 border-b border-black">
        <div className="space-y-4">
          <div className="flex items-center space-x-3 text-xs font-bold uppercase tracking-[0.3em] text-gray-400">
            <Link to="/projects" className="hover:text-black transition-colors">Projects</Link>
            <span>/</span>
            <span className="text-black">Detail</span>
          </div>
          <h2 className="text-6xl font-black tracking-tighter uppercase">{project?.name}</h2>
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full" />
              <span className="text-xs font-bold uppercase tracking-widest">Namespace: {project?.namespace}</span>
            </div>
            <div className="h-4 w-[1px] bg-gray-200" />
            <span className="text-xs font-bold uppercase tracking-widest text-gray-400">ID: {project?.id?.slice(0, 8)}</span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button className="px-6 py-3 border border-black font-bold text-xs uppercase tracking-widest hover:bg-gray-50 transition-colors">
            Edit Project
          </button>
          <button className="px-6 py-3 bg-black text-white border border-black font-bold text-xs uppercase tracking-widest hover:bg-gray-800 transition-colors flex items-center space-x-2">
            <Plus size={16} />
            <span>Add Container</span>
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Total Replicas', value: containers.reduce((acc, c) => acc + c.replicas, 0), icon: Server },
          { label: 'Health Score', value: '98%', icon: Activity },
          { label: 'Resources', value: '4.2 CPU / 8GB', icon: Cpu },
        ].map((stat, i) => (
          <div key={i} className="p-4 border border-black flex items-center space-x-4 bg-gray-50/50">
            <div className="p-2 bg-white border border-black">
              <stat.icon size={20} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{stat.label}</p>
              <p className="text-xl font-black uppercase">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Containers Grid */}
      <div className="space-y-6">
        <h3 className="text-2xl font-black uppercase tracking-tight">Containers</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {containers.map((container) => (
            <div 
              key={container.id}
              className="border border-black bg-white mono-shadow flex flex-col group"
            >
              <div className="p-6 flex-1 space-y-6">
                <div className="flex justify-between items-start">
                  <div className={cn(
                    "px-2 py-1 text-[9px] font-black uppercase tracking-widest",
                    container.status === 'Running' ? "bg-green-100 text-green-700" : "bg-black text-white"
                  )}>
                    {container.status}
                  </div>
                  <div className="flex items-center space-x-1 text-gray-300">
                    <Database size={14} />
                    <span className="text-[10px] font-mono">v{container.version || '0.0.1'}</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-2xl font-black uppercase tracking-tight group-hover:underline cursor-pointer">
                    {container.name}
                  </h4>
                  <div className="mt-2 flex items-center space-x-2 text-xs text-gray-400 font-medium">
                    <GitBranch size={14} />
                    <span className="truncate">{container.repository_url.split('/').pop()}</span>
                    <span>•</span>
                    <span>{container.branch}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                  <div>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Replicas</p>
                    <p className="text-sm font-black">{container.replicas} Active</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Last Build</p>
                    <p className="text-sm font-black flex items-center space-x-1">
                      <Clock size={12} />
                      <span>2h ago</span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-black p-2 flex items-center justify-between bg-gray-50">
                <div className="flex items-center space-x-1">
                  <button className="p-2 hover:bg-white border border-transparent hover:border-black transition-all" title="Restart">
                    <RotateCcw size={14} />
                  </button>
                  <button className="p-2 hover:bg-white border border-transparent hover:border-black transition-all text-red-500" title="Stop">
                    <StopCircle size={14} />
                  </button>
                </div>
                <Link 
                  to={`/containers/${container.id}`}
                  className="px-4 py-2 bg-black text-white text-[10px] font-black uppercase tracking-widest flex items-center space-x-2 hover:bg-gray-800 transition-all"
                >
                  <span>MANAGE</span>
                  <ExternalLink size={12} />
                </Link>
              </div>
            </div>
          ))}

          {/* Empty Add Card */}
          <button className="border-2 border-dashed border-gray-200 p-6 flex flex-col items-center justify-center space-y-4 hover:border-black hover:bg-gray-50 transition-all group min-h-[300px]">
            <div className="p-4 bg-gray-100 rounded-full group-hover:bg-black group-hover:text-white transition-all">
              <Plus size={32} />
            </div>
            <p className="text-xs font-black uppercase tracking-widest">New Container</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetail;

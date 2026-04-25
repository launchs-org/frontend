import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { 
  Plus, 
  Search, 
  Folder, 
  MoreVertical, 
  ExternalLink,
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

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await api.get('/v1/projects');
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
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-4xl font-black tracking-tighter uppercase">Projects</h2>
          <p className="text-gray-500 mt-1">Manage your service groups and environments.</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-black transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Search projects..." 
              className="pl-10 pr-4 py-2 border border-black focus:outline-none focus:ring-0 focus:border-black placeholder:text-gray-300 text-sm w-64 transition-all"
            />
          </div>
          <button className="flex items-center space-x-2 px-4 py-2 bg-black text-white text-sm font-bold border border-black hover:bg-white hover:text-black transition-all">
            <Plus size={18} />
            <span>NEW PROJECT</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64 space-y-4">
          <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">Loading your universe...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 p-20 text-center space-y-6">
          <div className="w-20 h-20 bg-gray-50 flex items-center justify-center mx-auto border border-gray-100">
            <Folder size={32} className="text-gray-200" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-bold uppercase">No projects found</h3>
            <p className="text-gray-400 max-w-xs mx-auto text-sm">
              Get started by creating your first project to deploy containers.
            </p>
          </div>
          <button className="px-6 py-2 bg-black text-white text-xs font-bold uppercase tracking-widest border border-black hover:bg-white hover:text-black transition-all">
            Create First Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Link 
              key={project.id}
              to={`/projects/${project.id}`}
              className="group block p-6 border border-black mono-shadow hover:translate-x-[-4px] hover:translate-y-[-4px] transition-all bg-white relative overflow-hidden"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="w-12 h-12 border border-black flex items-center justify-center bg-gray-50 group-hover:bg-black group-hover:text-white transition-colors">
                  <Folder size={24} />
                </div>
                <button className="p-1 hover:bg-gray-100 rounded-sm"><MoreVertical size={18} /></button>
              </div>

              <div>
                <h3 className="text-2xl font-black truncate uppercase tracking-tight">{project.name}</h3>
                <div className="mt-4 flex items-center space-x-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                  <span>NS: {project.namespace}</span>
                  <span className="w-1 h-1 bg-gray-300 rounded-full" />
                  <span>K8S: {project.k8s_resource_name}</span>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-between">
                <div className="flex -space-x-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="w-6 h-6 rounded-full border border-white bg-gray-200" />
                  ))}
                  <div className="w-6 h-6 rounded-full border border-white bg-black text-[8px] flex items-center justify-center text-white font-bold">+5</div>
                </div>
                <div className="flex items-center space-x-1 text-xs font-bold group-hover:underline">
                  <span>Enter</span>
                  <ChevronRight size={14} />
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

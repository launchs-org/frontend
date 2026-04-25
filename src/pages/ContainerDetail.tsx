import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { 
  Terminal, 
  Settings, 
  History, 
  Globe, 
  GitBranch, 
  Play, 
  RotateCcw,
  ExternalLink,
  ChevronRight,
  Shield,
  Zap,
  Clock,
  Server
} from 'lucide-react';
import { cn } from '../lib/utils';

interface BuildJob {
  id: string;
  status: string;
  created_at: string;
  finished_at?: string;
  version?: string;
}

const ContainerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<'overview' | 'builds' | 'logs' | 'networking' | 'history'>('overview');
  const [container, setContainer] = useState<any>(null);
  const [buildJobs, setBuildJobs] = useState<BuildJob[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [streaming, setStreaming] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchContainer = async () => {
      try {
        const res = await api.get(`/v1/containers/${id}`);
        setContainer(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchContainer();
  }, [id]);

  useEffect(() => {
    if (activeTab === 'builds') {
      api.get(`/v1/containers/${id}/build-jobs`).then(res => setBuildJobs(res.data || []));
    }
  }, [id, activeTab]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const startLogStream = (jobId: string) => {
    setLogs([]);
    setStreaming(true);
    const eventSource = new EventSource(`${api.defaults.baseURL}/stream/build-jobs/${jobId}`);
    
    eventSource.onmessage = (event) => {
      setLogs(prev => [...prev, event.data]);
    };

    eventSource.onerror = (err) => {
      console.error("SSE Error:", err);
      eventSource.close();
      setStreaming(false);
    };

    return () => {
      eventSource.close();
    };
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Zap },
    { id: 'builds', label: 'Builds', icon: RotateCcw },
    { id: 'logs', label: 'Logs', icon: Terminal },
    { id: 'networking', label: 'Networking', icon: Globe },
    { id: 'history', label: 'History', icon: History },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
        <div className="space-y-4">
          <div className="flex items-center space-x-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
            <Link to="/projects" className="hover:text-black">Projects</Link>
            <ChevronRight size={10} />
            <Link to={`/projects/${container?.project_id}`} className="hover:text-black">Project</Link>
            <ChevronRight size={10} />
            <span className="text-black">Container</span>
          </div>
          <div className="flex items-center space-x-4">
            <h2 className="text-5xl font-black tracking-tighter uppercase">{container?.name}</h2>
            <div className="px-3 py-1 bg-black text-white text-[10px] font-black tracking-widest uppercase">
              {container?.status}
            </div>
          </div>
          <div className="flex items-center space-x-4 text-xs font-bold text-gray-400">
            <div className="flex items-center space-x-1">
              <GitBranch size={14} />
              <span>{container?.branch}</span>
            </div>
            <span>•</span>
            <span>{container?.repository_url}</span>
          </div>
        </div>

        <div className="flex space-x-2">
          <button className="px-4 py-2 border border-black font-bold text-[10px] uppercase tracking-widest hover:bg-gray-50 transition-all flex items-center space-x-2">
            <Play size={12} />
            <span>REDEPLOY</span>
          </button>
          <button className="px-4 py-2 bg-black text-white border border-black font-bold text-[10px] uppercase tracking-widest hover:bg-gray-800 transition-all">
            SETTINGS
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-black">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "px-8 py-4 text-xs font-black uppercase tracking-widest flex items-center space-x-2 transition-all border-b-2 border-transparent",
              activeTab === tab.id 
                ? "border-black bg-gray-50" 
                : "text-gray-400 hover:text-black hover:bg-gray-50/50"
            )}
          >
            <tab.icon size={14} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="py-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="p-8 border border-black bg-white space-y-6">
                <h3 className="text-xl font-black uppercase">Deployment Configuration</h3>
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Image Source</p>
                    <p className="font-bold text-sm truncate">{container?.repository_url}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Target Branch</p>
                    <p className="font-bold text-sm">{container?.branch}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Replicas</p>
                    <p className="font-bold text-sm">{container?.replicas} instances</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Environment</p>
                    <p className="font-bold text-sm uppercase">Production</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="p-6 border border-black bg-gray-50 space-y-4">
                  <h4 className="text-sm font-black uppercase flex items-center space-x-2">
                    <Shield size={16} />
                    <span>Security Scan</span>
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="font-bold">Vulnerabilities</span>
                      <span className="text-green-600 font-bold">0 Found</span>
                    </div>
                    <div className="w-full h-1 bg-gray-200">
                      <div className="w-full h-full bg-green-500" />
                    </div>
                  </div>
                </div>
                <div className="p-6 border border-black bg-gray-50 space-y-4">
                  <h4 className="text-sm font-black uppercase flex items-center space-x-2">
                    <Activity size={16} />
                    <span>Health Status</span>
                  </h4>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span className="text-xs font-bold uppercase">All systems nominal</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="p-6 border border-black bg-white space-y-4">
                <h3 className="text-sm font-black uppercase">Recent Events</h3>
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-start space-x-3 pb-4 border-b border-gray-100 last:border-0">
                      <div className="mt-1 w-2 h-2 rounded-full bg-black" />
                      <div className="space-y-1">
                        <p className="text-xs font-bold">Deployment Success</p>
                        <p className="text-[10px] text-gray-400">Successfully deployed v1.0.{i}</p>
                        <p className="text-[9px] text-gray-300 uppercase">2 hours ago</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'logs' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black uppercase">Build Output</h3>
              <div className="flex items-center space-x-2">
                <div className={cn("w-2 h-2 rounded-full", streaming ? "bg-green-500 animate-pulse" : "bg-gray-300")} />
                <span className="text-[10px] font-bold uppercase tracking-widest">{streaming ? 'Streaming' : 'Idle'}</span>
              </div>
            </div>
            <div className="bg-black text-white p-6 font-mono text-xs leading-relaxed min-h-[500px] border border-black mono-shadow max-h-[600px] overflow-y-auto">
              {logs.length === 0 ? (
                <div className="h-full flex items-center justify-center text-gray-600">
                  <p>Select a build job to view logs</p>
                </div>
              ) : (
                <>
                  {logs.map((line, i) => (
                    <div key={i} className="py-0.5"><span className="text-gray-500 mr-4 select-none">{(i+1).toString().padStart(3, '0')}</span>{line}</div>
                  ))}
                  <div ref={logEndRef} />
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === 'builds' && (
          <div className="border border-black bg-white overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-black">
                <tr>
                  <th className="p-4 font-black uppercase tracking-widest text-[10px]">Job ID</th>
                  <th className="p-4 font-black uppercase tracking-widest text-[10px]">Status</th>
                  <th className="p-4 font-black uppercase tracking-widest text-[10px]">Version</th>
                  <th className="p-4 font-black uppercase tracking-widest text-[10px]">Date</th>
                  <th className="p-4 font-black uppercase tracking-widest text-[10px]">Logs</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {buildJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 font-mono text-xs font-bold">{job.id.slice(0, 12)}...</td>
                    <td className="p-4">
                      <span className={cn(
                        "px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest",
                        job.status === 'Success' ? "bg-black text-white" : "bg-gray-100 text-gray-500"
                      )}>{job.status}</span>
                    </td>
                    <td className="p-4 font-bold">{job.version || '---'}</td>
                    <td className="p-4 text-xs text-gray-500">{new Date(job.created_at).toLocaleString()}</td>
                    <td className="p-4">
                      <button 
                        onClick={() => { setActiveTab('logs'); startLogStream(job.id); }}
                        className="p-1 hover:bg-black hover:text-white border border-transparent hover:border-black transition-all"
                      >
                        <Terminal size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'networking' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-8 border border-black space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-black uppercase">Service Configuration</h3>
                <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-black uppercase">Active</span>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Service Type</label>
                  <select className="w-full p-2 border border-black bg-white text-sm font-bold focus:outline-none">
                    <option>ClusterIP</option>
                    <option>NodePort</option>
                    <option>LoadBalancer</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Internal Port Mapping</label>
                  <div className="flex items-center space-x-4">
                    <input type="text" value="80" className="w-full p-2 border border-black text-sm font-bold" />
                    <ChevronRight size={20} />
                    <input type="text" value="3000" className="w-full p-2 border border-black text-sm font-bold" />
                  </div>
                </div>
                <button className="w-full py-3 bg-black text-white font-black text-xs uppercase tracking-widest hover:bg-gray-800 transition-all mt-4">
                  Update Service
                </button>
              </div>
            </div>

            <div className="p-8 border border-black space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-black uppercase">Ingress Settings</h3>
                <div className="flex items-center space-x-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Enabled</span>
                  <div className="w-8 h-4 bg-black rounded-full relative">
                    <div className="absolute right-1 top-1 w-2 h-2 bg-white rounded-full" />
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Public Domain</label>
                  <div className="flex border border-black">
                    <input type="text" value="my-service.launchs.org" className="flex-1 p-2 text-sm font-bold focus:outline-none" readOnly />
                    <button className="p-2 border-l border-black hover:bg-gray-50"><ExternalLink size={14} /></button>
                  </div>
                </div>
                <div className="p-4 bg-gray-50 border border-black border-dashed">
                  <p className="text-[10px] text-gray-500 font-medium">SSL Certificate is automatically managed via Let's Encrypt.</p>
                </div>
              </div>
            </div>
          </div>
        {activeTab === 'history' && (
          <div className="space-y-6">
            <h3 className="text-xl font-black uppercase">Configuration Snapshots</h3>
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="p-6 border border-black bg-white flex items-center justify-between group hover:bg-gray-50 transition-all">
                  <div className="flex items-center space-x-6">
                    <div className="p-3 bg-gray-100 border border-black group-hover:bg-black group-hover:text-white transition-all">
                      <History size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-black uppercase tracking-tight">Version Snapshot v1.0.{10-i}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">
                        Captured: 2026-04-{26-i} 14:30:00 • by admin
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right hidden md:block">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Containers</p>
                      <p className="text-xs font-black">3 Services</p>
                    </div>
                    <button className="px-6 py-2 border border-black text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all">
                      ROLLBACK
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContainerDetail;

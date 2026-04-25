import React from 'react';
import { 
  Zap, 
  Layers, 
  Globe, 
  ArrowUpRight, 
  MoreHorizontal,
  Server,
  Cloud
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const stats = [
    { name: 'Active Projects', value: '12', icon: Box, change: '+2 this month' },
    { name: 'Total Containers', value: '48', icon: Layers, change: '+5% from peak' },
    { name: 'Average Latency', value: '24ms', icon: Zap, change: '-4ms decrease' },
    { name: 'Network Ingress', value: '1.2TB', icon: Globe, change: 'Stable' },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-4xl font-black tracking-tighter uppercase">Overview</h2>
          <p className="text-gray-500 mt-1">Platform performance and system health.</p>
        </div>
        <div className="text-right">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Server Status</p>
          <div className="flex items-center space-x-2 text-green-500 font-bold">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>Operational</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="p-6 border border-black mono-shadow bg-white hover:translate-x-[-2px] hover:translate-y-[-2px] transition-all">
            <div className="flex justify-between items-start">
              <div className="p-2 bg-black text-white">
                <stat.icon size={18} />
              </div>
              <ArrowUpRight size={16} className="text-gray-300" />
            </div>
            <div className="mt-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{stat.name}</p>
              <h3 className="text-3xl font-black mt-1">{stat.value}</h3>
              <p className="text-[10px] font-bold text-gray-400 mt-2">{stat.change}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Projects */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-black uppercase tracking-tight">Active Deployments</h3>
            <button className="text-xs font-bold underline">View all</button>
          </div>
          <div className="border border-black bg-white overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 border-b border-black">
                <tr>
                  <th className="p-4 font-black uppercase tracking-widest text-[10px]">Service Name</th>
                  <th className="p-4 font-black uppercase tracking-widest text-[10px]">Status</th>
                  <th className="p-4 font-black uppercase tracking-widest text-[10px]">URL</th>
                  <th className="p-4 font-black uppercase tracking-widest text-[10px]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[1, 2, 3, 4].map((i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="p-4 flex items-center space-x-3">
                      <div className="w-8 h-8 border border-black flex items-center justify-center">
                        <Server size={14} />
                      </div>
                      <div>
                        <p className="font-bold">production-api-{i}</p>
                        <p className="text-[10px] text-gray-400">v1.2.{i} • git:8f2d3a</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="px-2 py-1 bg-black text-white text-[10px] font-bold uppercase tracking-widest">Running</span>
                    </td>
                    <td className="p-4 font-mono text-xs text-gray-500">api-{i}.launchs.io</td>
                    <td className="p-4">
                      <button className="p-1 hover:bg-gray-100"><MoreHorizontal size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* System Logs / Small card */}
        <div className="space-y-4">
          <h3 className="text-xl font-black uppercase tracking-tight">Realtime Activity</h3>
          <div className="border border-black bg-black text-white p-4 h-[400px] font-mono text-[11px] overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full p-2 bg-white/10 backdrop-blur-sm border-b border-white/10 flex justify-between">
              <span>system.log</span>
              <div className="flex space-x-1">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <div className="w-2 h-2 rounded-full bg-yellow-500" />
                <div className="w-2 h-2 rounded-full bg-green-500" />
              </div>
            </div>
            <div className="mt-8 space-y-1 opacity-80">
              <p><span className="text-green-400">[OK]</span> Connection to k8s cluster established</p>
              <p><span className="text-blue-400">[INFO]</span> Container 'auth-service' scaling up...</p>
              <p><span className="text-gray-400">[DEBUG]</span> Request received: GET /v1/health</p>
              <p><span className="text-yellow-400">[WARN]</span> High memory usage detected in node-3</p>
              <p><span className="text-green-400">[OK]</span> Deployment 'web-frontend' successful</p>
              <p><span className="text-blue-400">[INFO]</span> New project created: 'market-data'</p>
              <p className="animate-pulse">_</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Import workaround for icon assignment in loop
import { Box } from 'lucide-react';

export default Dashboard;

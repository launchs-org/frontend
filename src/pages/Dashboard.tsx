import React, { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { 
  Layers, 
  Server,
  Box,
  Loader2,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface Stats {
  active_projects: number;
  total_containers: number;
  running_instances: number;
}

interface Container {
  id: string;
  name: string;
  project_id: string;
  status: string;
  version: string;
  repository_url: string;
}

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats>({ active_projects: 0, total_containers: 0, running_instances: 0 });
  const [containers, setContainers] = useState<Container[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [statsRes, contRes] = await Promise.all([
          api.get('/app/v1/stats'),
          api.get('/app/v1/containers')
        ]);

        setStats(statsRes.data.data);
        setContainers(contRes.data.data.items || []);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const statCards = [
    { name: 'プロジェクト', value: stats.active_projects.toString(), icon: Box, color: '#0ea5e9' },
    { name: 'コンテナ', value: stats.total_containers.toString(), icon: Layers, color: '#10b981' },
    { name: 'インスタンス', value: stats.running_instances.toString(), icon: Server, color: '#f59e0b' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((stat) => (
          <div key={stat.name} className="card p-6 hover:shadow-lg transition-all">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wide">{stat.name}</p>
                <p className="text-3xl font-bold text-[#f1f5f9] mt-3">{stat.value}</p>
              </div>
              <div 
                className="p-3 rounded-lg opacity-80"
                style={{ backgroundColor: `${stat.color}20` }}
              >
                <stat.icon size={24} style={{ color: stat.color }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        {/* Recent Containers */}
        <div className="flex items-center justify-between px-2">
          <h3 className="text-base font-semibold text-[#f1f5f9]">最近のコンテナ</h3>
          <Link to="/projects" className="text-xs text-[#0ea5e9] font-semibold hover:text-[#0284c7] transition-colors flex items-center space-x-1">
            <span>全て表示</span>
            <ArrowRight size={14} />
          </Link>
        </div>
        
        {loading ? (
          <div className="card flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="w-8 h-8 text-[#0ea5e9] animate-spin" />
            <p className="text-sm text-[#94a3b8]">データを読み込み中...</p>
          </div>
        ) : containers.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-20 space-y-4">
            <Server size={32} className="text-[#475569]" />
            <p className="text-sm text-[#94a3b8]">デプロイされたコンテナはありません</p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#0f172a] border-b border-[#334155]">
                <tr>
                  <th className="px-6 py-4 font-semibold text-[#cbd5e1] text-xs uppercase tracking-wide">名前</th>
                  <th className="px-6 py-4 font-semibold text-[#cbd5e1] text-xs uppercase tracking-wide">ステータス</th>
                  <th className="px-6 py-4 font-semibold text-[#cbd5e1] text-xs uppercase tracking-wide">バージョン</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#334155]">
                {containers.slice(0, 5).map((container) => (
                  <tr key={container.id} className="hover:bg-[#0f172a] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 rounded bg-[#0ea5e9]/10">
                          <Server size={16} className="text-[#0ea5e9]" />
                        </div>
                        <div>
                          <p className="font-medium text-[#f1f5f9]">{container.name}</p>
                          <p className="text-xs text-[#94a3b8] truncate max-w-[300px]">{container.repository_url}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {container.status === 'Running' ? (
                          <>
                            <div className="w-2 h-2 rounded-full bg-[#10b981]"></div>
                            <span className="text-[#cbd5e1]">稼働中</span>
                          </>
                        ) : (
                          <>
                            <div className="w-2 h-2 rounded-full bg-[#f59e0b]"></div>
                            <span className="text-[#cbd5e1]">{container.status}</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <code className="bg-[#0f172a] px-2 py-1 rounded text-xs text-[#0ea5e9] font-mono">
                        {container.version ? container.version.slice(0, 8) : '---'}
                      </code>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;


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
    { name: 'プロジェクト', value: stats.active_projects.toString(), icon: Box, color: '#6366f1' },
    { name: 'コンテナ', value: stats.total_containers.toString(), icon: Layers, color: '#10b981' },
    { name: 'インスタンス', value: stats.running_instances.toString(), icon: Server, color: '#f59e0b' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((stat) => (
          <div key={stat.name} className="card p-6 hover:bg-[#2a2d42]">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-[#9ca3af] uppercase tracking-wide">{stat.name}</p>
                <p className="text-3xl font-bold text-[#e5e7eb] mt-2">{stat.value}</p>
              </div>
              <div style={{ color: stat.color }}>
                <stat.icon size={24} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-4">
        {/* Recent Containers */}
        <div className="flex items-center justify-between px-2">
          <h3 className="text-lg font-semibold text-[#e5e7eb]">最近のコンテナ</h3>
          <Link to="/projects" className="text-sm text-[#6366f1] font-medium hover:text-[#8b5cf6] flex items-center space-x-1 transition-colors">
            <span>プロジェクト一覧</span>
            <ArrowRight size={14} />
          </Link>
        </div>
        
        {loading ? (
          <div className="card flex flex-col items-center justify-center py-20 space-y-4">
            <Loader2 className="w-8 h-8 text-[#6366f1] animate-spin" />
            <p className="text-sm text-[#9ca3af]">データを読み込み中...</p>
          </div>
        ) : containers.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-20 space-y-4">
            <Server size={32} className="text-[#404556]" />
            <p className="text-sm text-[#9ca3af]">デプロイされたコンテナはありません</p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="table-header">
                <tr>
                  <th className="px-6 py-4 font-medium text-[#9ca3af]">コンテナ名</th>
                  <th className="px-6 py-4 font-medium text-[#9ca3af]">ステータス</th>
                  <th className="px-6 py-4 font-medium text-[#9ca3af]">バージョン</th>
                </tr>
              </thead>
              <tbody>
                {containers.slice(0, 5).map((container) => (
                  <tr key={container.id} className="table-row">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <Server size={18} className="text-[#6366f1]" />
                        <div>
                          <p className="font-medium text-[#e5e7eb]">{container.name}</p>
                          <p className="text-xs text-[#9ca3af] truncate max-w-[300px]">{container.repository_url}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        {container.status === 'Running' ? (
                          <>
                            <div className="w-2 h-2 rounded-full bg-[#10b981]"></div>
                            <span className="text-[#e5e7eb]">稼働中</span>
                          </>
                        ) : (
                          <>
                            <div className="w-2 h-2 rounded-full bg-[#f59e0b]"></div>
                            <span className="text-[#e5e7eb]">{container.status}</span>
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <code className="bg-[#1a1b2e] px-2 py-1 rounded text-xs text-[#6366f1] font-mono">
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


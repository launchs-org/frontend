import React from 'react';
import { 
  Zap, 
  Layers, 
  Globe, 
  ArrowUpRight, 
  MoreHorizontal,
  Server,
  Cloud,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';

const Dashboard: React.FC = () => {
  const stats = [
    { name: '稼働中のプロジェクト', value: '12', icon: Box, color: 'text-google-blue' },
    { name: '総コンテナ数', value: '48', icon: Layers, color: 'text-google-green' },
    { name: '平均レイテンシ', value: '24ms', icon: Zap, color: 'text-google-yellow' },
    { name: 'ネットワーク通信量', value: '1.2TB', icon: Globe, color: 'text-google-red' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-normal text-[#202124]">ダッシュボード</h2>
          <p className="text-sm text-[#5f6368] mt-1">システム全体の稼働状況とリソースの使用率を確認できます。</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="google-card p-6">
            <div className="flex justify-between items-start">
              <div className={stat.color}>
                <stat.icon size={24} />
              </div>
              <ArrowUpRight size={18} className="text-gray-300" />
            </div>
            <div className="mt-4">
              <p className="text-sm font-medium text-[#5f6368]">{stat.name}</p>
              <h3 className="text-3xl font-medium text-[#202124] mt-1">{stat.value}</h3>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Active Deployments */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-lg font-medium text-[#202124]">アクティブなデプロイ</h3>
            <button className="text-sm text-google-blue font-medium hover:underline">すべて表示</button>
          </div>
          <div className="google-card overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#f8f9fa] border-b border-[#dadce0]">
                <tr>
                  <th className="px-6 py-4 font-medium text-[#5f6368]">サービス名</th>
                  <th className="px-6 py-4 font-medium text-[#5f6368]">ステータス</th>
                  <th className="px-6 py-4 font-medium text-[#5f6368]">エンドポイント</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#dadce0]">
                {[1, 2, 3, 4].map((i) => (
                  <tr key={i} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <Server size={18} className="text-google-blue" />
                        <div>
                          <p className="font-medium text-[#202124]">production-api-{i}</p>
                          <p className="text-xs text-[#5f6368]">v1.2.{i} • git:8f2d3a</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2 text-google-green">
                        <CheckCircle2 size={16} />
                        <span className="font-medium">稼働中</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[#1a73e8] hover:underline cursor-pointer font-medium">
                      api-{i}.launchs.io
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
                        <MoreHorizontal size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Realtime Activity */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-[#202124] px-2">リアルタイムのアクティビティ</h3>
          <div className="google-card bg-[#202124] text-[#e8eaed] p-5 h-[400px] font-mono text-[12px] overflow-hidden relative">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#3c4043]">
              <span className="text-[#9aa0a6]">system.log</span>
              <div className="flex space-x-2">
                <div className="w-3 h-3 rounded-full bg-[#3c4043]" />
                <div className="w-3 h-3 rounded-full bg-[#3c4043]" />
              </div>
            </div>
            <div className="space-y-2 opacity-90 overflow-y-auto h-full pr-2">
              <p><span className="text-google-green">[OK]</span> Kubernetes クラスター接続完了</p>
              <p><span className="text-google-blue">[INFO]</span> コンテナ 'auth-service' スケールアップ中...</p>
              <p><span className="text-[#9aa0a6]">[DEBUG]</span> リクエスト受信: GET /v1/health</p>
              <p><span className="text-google-yellow">[WARN]</span> node-3 のメモリ使用率が高騰しています</p>
              <p><span className="text-google-green">[OK]</span> デプロイ 'web-frontend' が成功しました</p>
              <p><span className="text-google-blue">[INFO]</span> 新規プロジェクト作成: 'market-data'</p>
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

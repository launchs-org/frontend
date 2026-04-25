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
  Server,
  ArrowLeft,
  Activity,
  CheckCircle2,
  AlertTriangle
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
    { id: 'overview', label: '概要', icon: Zap },
    { id: 'builds', label: 'ビルド履歴', icon: RotateCcw },
    { id: 'logs', label: 'ビルドログ', icon: Terminal },
    { id: 'networking', label: 'ネットワーキング', icon: Globe },
    { id: 'history', label: '履歴・復元', icon: History },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col space-y-4">
        <Link to={`/projects/${container?.project_id}`} className="flex items-center space-x-2 text-sm text-[#5f6368] hover:text-google-blue transition-colors w-fit">
          <ArrowLeft size={16} />
          <span>プロジェクト詳細へ戻る</span>
        </Link>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <h2 className="text-3xl font-normal text-[#202124]">{container?.name}</h2>
              <div className={cn(
                "px-3 py-0.5 rounded-full text-xs font-medium",
                container?.status === 'Running' ? "bg-green-100 text-green-700" : "bg-gray-100 text-[#5f6368]"
              )}>
                {container?.status === 'Running' ? '稼働中' : container?.status}
              </div>
            </div>
            <div className="flex items-center space-x-4 text-sm text-[#5f6368]">
              <div className="flex items-center space-x-1.5">
                <GitBranch size={16} className="text-gray-400" />
                <span className="font-medium">{container?.branch}</span>
              </div>
              <span>•</span>
              <span className="truncate max-w-xs">{container?.repository_url}</span>
            </div>
          </div>

          <div className="flex space-x-2">
            <button className="px-4 py-2 border border-[#dadce0] bg-white rounded-md text-sm font-medium text-[#3c4043] hover:bg-gray-50 flex items-center space-x-2">
              <RotateCcw size={16} />
              <span>再デプロイ</span>
            </button>
            <button className="px-6 py-2 bg-google-blue text-white text-sm font-medium rounded-md hover:shadow-md transition-all">
              設定
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#dadce0] -mx-8 px-8">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "px-6 py-4 text-sm font-medium flex items-center space-x-2 transition-all border-b-2",
              activeTab === tab.id 
                ? "border-google-blue text-google-blue" 
                : "border-transparent text-[#5f6368] hover:text-[#202124] hover:bg-gray-50"
            )}
          >
            <tab.icon size={18} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="py-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="google-card p-8 space-y-6">
                <h3 className="text-lg font-medium text-[#202124]">デプロイ構成</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
                  <div className="space-y-1">
                    <p className="text-xs text-[#5f6368] font-medium uppercase tracking-wider">イメージソース</p>
                    <p className="text-sm font-medium text-[#202124] break-all">{container?.repository_url}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-[#5f6368] font-medium uppercase tracking-wider">ターゲットブランチ</p>
                    <p className="text-sm font-medium text-[#202124]">{container?.branch}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-[#5f6368] font-medium uppercase tracking-wider">レプリカ数</p>
                    <p className="text-sm font-medium text-[#202124]">{container?.replicas} インスタンス</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-[#5f6368] font-medium uppercase tracking-wider">環境</p>
                    <p className="text-sm font-medium text-[#202124]">Production (本番環境)</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="google-card p-6 space-y-4">
                  <h4 className="text-sm font-medium text-[#202124] flex items-center space-x-2">
                    <Shield size={18} className="text-google-blue" />
                    <span>セキュリティスキャン</span>
                  </h4>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-[#5f6368]">脆弱性診断</span>
                      <span className="text-google-green font-medium">問題なし</span>
                    </div>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="w-full h-full bg-google-green" />
                    </div>
                  </div>
                </div>
                <div className="google-card p-6 space-y-4">
                  <h4 className="text-sm font-medium text-[#202124] flex items-center space-x-2">
                    <Activity size={18} className="text-google-blue" />
                    <span>ヘルスステータス</span>
                  </h4>
                  <div className="flex items-center space-x-2 text-google-green">
                    <CheckCircle2 size={16} />
                    <span className="text-xs font-medium">正常に稼働中</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="google-card p-6 space-y-4">
                <h3 className="text-sm font-medium text-[#202124]">最近のイベント</h3>
                <div className="space-y-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-start space-x-3 pb-4 border-b border-[#f1f3f4] last:border-0">
                      <div className="mt-1 w-2 h-2 rounded-full bg-google-blue" />
                      <div className="space-y-0.5">
                        <p className="text-sm font-medium text-[#202124]">デプロイ完了</p>
                        <p className="text-xs text-[#5f6368]">v1.0.{i} が正常にデプロイされました</p>
                        <p className="text-[10px] text-gray-400 font-medium">2時間前</p>
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
            <div className="flex justify-between items-center px-2">
              <h3 className="text-lg font-medium text-[#202124]">ビルド出力</h3>
              <div className="flex items-center space-x-2">
                <div className={cn("w-2.5 h-2.5 rounded-full", streaming ? "bg-google-green animate-pulse" : "bg-gray-300")} />
                <span className="text-xs font-medium text-[#5f6368]">{streaming ? 'ストリーミング中' : 'アイドル'}</span>
              </div>
            </div>
            <div className="bg-[#202124] text-[#e8eaed] p-6 font-mono text-[13px] leading-relaxed min-h-[500px] rounded-lg shadow-inner max-h-[600px] overflow-y-auto">
              {logs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-[#9aa0a6] space-y-2">
                  <Terminal size={32} opacity={0.3} />
                  <p>ビルドジョブを選択するとログが表示されます</p>
                </div>
              ) : (
                <>
                  {logs.map((line, i) => (
                    <div key={i} className="py-0.5 group">
                      <span className="text-[#5f6368] mr-4 select-none opacity-50">{(i+1).toString().padStart(3, '0')}</span>
                      <span className="group-hover:text-white transition-colors">{line}</span>
                    </div>
                  ))}
                  <div ref={logEndRef} />
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === 'builds' && (
          <div className="google-card overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-[#f8f9fa] border-b border-[#dadce0]">
                <tr>
                  <th className="px-6 py-4 font-medium text-[#5f6368]">ジョブ ID</th>
                  <th className="px-6 py-4 font-medium text-[#5f6368]">ステータス</th>
                  <th className="px-6 py-4 font-medium text-[#5f6368]">バージョン</th>
                  <th className="px-6 py-4 font-medium text-[#5f6368]">日時</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#dadce0]">
                {buildJobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-mono text-xs text-google-blue font-medium">{job.id.slice(0, 12)}...</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                        job.status === 'Success' ? "bg-green-100 text-green-700" : "bg-gray-100 text-[#5f6368]"
                      )}>{job.status === 'Success' ? '成功' : job.status}</span>
                    </td>
                    <td className="px-6 py-4 font-medium text-[#202124]">{job.version || '---'}</td>
                    <td className="px-6 py-4 text-xs text-[#5f6368]">{new Date(job.created_at).toLocaleString('ja-JP')}</td>
                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => { setActiveTab('logs'); startLogStream(job.id); }}
                        className="px-3 py-1.5 text-xs font-medium text-google-blue hover:bg-blue-50 rounded transition-all flex items-center space-x-1 ml-auto"
                      >
                        <Terminal size={14} />
                        <span>ログを表示</span>
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
            <div className="google-card p-8 space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-[#202124]">サービス設定</h3>
                <span className="px-2 py-1 bg-green-100 text-green-700 text-[10px] font-bold rounded">有効</span>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[#5f6368]">サービスタイプ</label>
                  <select className="w-full p-2 border border-[#dadce0] bg-white rounded text-sm focus:outline-none focus:ring-1 focus:ring-google-blue">
                    <option>ClusterIP</option>
                    <option>NodePort</option>
                    <option>LoadBalancer</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[#5f6368]">内部ポートマッピング</label>
                  <div className="flex items-center space-x-4">
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">外部</span>
                      <input type="text" value="80" className="w-full pl-10 p-2 border border-[#dadce0] rounded text-sm font-medium" />
                    </div>
                    <ChevronRight size={16} className="text-gray-300" />
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">内部</span>
                      <input type="text" value="3000" className="w-full pl-10 p-2 border border-[#dadce0] rounded text-sm font-medium" />
                    </div>
                  </div>
                </div>
                <button className="w-full py-2 bg-google-blue text-white font-medium text-sm rounded hover:shadow-md transition-all mt-4">
                  サービス設定を更新
                </button>
              </div>
            </div>

            <div className="google-card p-8 space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium text-[#202124]">イングレス設定</h3>
                <div className="flex items-center space-x-3">
                  <span className="text-xs text-[#5f6368]">有効化</span>
                  <div className="w-10 h-5 bg-google-blue rounded-full relative cursor-pointer">
                    <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full shadow-sm" />
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-[#5f6368]">公開ドメイン</label>
                  <div className="flex border border-[#dadce0] rounded overflow-hidden">
                    <input type="text" value="my-service.launchs.org" className="flex-1 p-2 text-sm font-medium bg-[#f8f9fa] outline-none" readOnly />
                    <button className="p-2 bg-white hover:bg-gray-50 border-l border-[#dadce0] text-google-blue"><ExternalLink size={16} /></button>
                  </div>
                </div>
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-md flex items-start space-x-3">
                  <Shield size={18} className="text-google-blue mt-0.5" />
                  <p className="text-xs text-[#1a73e8] leading-relaxed">
                    SSL 証明書は Let's Encrypt によって自動的に管理および更新されています。
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center px-2">
              <h3 className="text-lg font-medium text-[#202124]">構成スナップショット</h3>
              <button className="text-sm text-google-blue font-medium hover:underline">新規保存</button>
            </div>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="google-card p-5 bg-white flex items-center justify-between group hover:border-google-blue transition-all">
                  <div className="flex items-center space-x-6">
                    <div className="p-2.5 bg-gray-50 text-gray-400 group-hover:bg-blue-50 group-hover:text-google-blue rounded-lg transition-all">
                      <History size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#202124]">バージョン・スナップショット v1.0.{10-i}</p>
                      <p className="text-[11px] text-[#5f6368] mt-0.5">
                        保存日: 2026年4月{26-i}日 14:30 • 作成者: 管理者
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right hidden md:block">
                      <p className="text-[10px] text-[#5f6368] font-medium uppercase tracking-wider">コンテナ構成</p>
                      <p className="text-xs font-medium text-[#202124]">3 サービス統合</p>
                    </div>
                    <button className="px-4 py-1.5 border border-[#dadce0] rounded text-xs font-medium text-[#202124] hover:bg-gray-50 hover:border-[#bdc1c6] transition-all flex items-center space-x-1">
                      <RotateCcw size={14} />
                      <span>復元</span>
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

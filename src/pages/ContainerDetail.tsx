import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../lib/api';
import { 
  Terminal, 
  History, 
  Globe, 
  GitBranch, 
  RotateCcw,
  ExternalLink,
  Zap,
  ArrowLeft,
  Activity,
  CheckCircle2,
  Loader2,
  FileText,
  Clock,
  X
} from 'lucide-react';
import { cn } from '../lib/utils';

interface BuildJob {
  id: string;
  status: string;
  created_at: string;
  finished_at?: string;
  version?: string;
  build_log?: string;
}

interface LogEntry {
  pod_name: string;
  timestamp: string;
  message: string;
}

const ContainerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<'overview' | 'builds' | 'build-logs' | 'exec-logs' | 'networking' | 'history'>('overview');
  const [container, setContainer] = useState<any>(null);
  const [buildJobs, setBuildJobs] = useState<BuildJob[]>([]);
  const [buildLogs, setBuildLogs] = useState<string[]>([]);
  const [execLogs, setExecLogs] = useState<LogEntry[]>([]);
  const [streamingBuild, setStreamingBuild] = useState(false);
  const [streamingExec, setStreamingExec] = useState(false);
  const [selectedBuildJobId, setSelectedBuildJobId] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const execWsRef = useRef<WebSocket | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);
  const execLogEndRef = useRef<HTMLDivElement>(null);
  const buildSseRef = useRef<AbortController | null>(null);
  const execSseRef = useRef<AbortController | null>(null);

  const fetchContainer = async () => {
    try {
      const res = await api.get(`/app/v1/containers/${id}`);
      setContainer(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBuildJobs = async () => {
    try {
      const res = await api.get(`/app/v1/containers/${id}/build-jobs`);
      const jobs = res.data.data.items || [];
      setBuildJobs(jobs);
      if (!selectedBuildJobId && jobs.length > 0) {
        setSelectedBuildJobId(jobs[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchContainer();
  }, [id]);

  useEffect(() => {
    if (activeTab === 'builds' || activeTab === 'build-logs') {
      fetchBuildJobs();
    }
  }, [id, activeTab]);

  // Poll build jobs if any is in progress
  useEffect(() => {
    let interval: any;
    const hasActiveJob = buildJobs.some(j => j.status === 'Queued' || j.status === 'Running');
    
    if (hasActiveJob) {
      interval = setInterval(() => {
        fetchBuildJobs();
      }, 3000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [buildJobs, activeTab]);

  useEffect(() => {
    if (selectedBuildJobId && activeTab === 'build-logs') {
      startBuildLogStream(selectedBuildJobId);
    }
    return () => {
      buildSseRef.current?.abort();
      wsRef.current?.close();
    };
  }, [selectedBuildJobId, activeTab]);

  useEffect(() => {
    if (activeTab === 'exec-logs') {
      startExecLogStream();
    }
    return () => {
      execSseRef.current?.abort();
      execWsRef.current?.close();
    };
  }, [id, activeTab]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [buildLogs]);

  useEffect(() => {
    execLogEndRef.current?.scrollIntoView({ behavior: 'auto' });
  }, [execLogs]);


  // Build Logs Stream with Auto-Reconnect
  const startBuildLogStream = async (jobId: string) => {
    const selectedJob = buildJobs.find(j => j.id === jobId);
    if (selectedJob && (selectedJob.status === 'Success' || selectedJob.status === 'Failed' || selectedJob.status === 'Cancelled')) {
      if (selectedJob.build_log) {
        setBuildLogs(selectedJob.build_log.split('\n'));
      } else {
        setBuildLogs(['ログが保存されていません。']);
      }
      setStreamingBuild(false);
      return;
    }

    buildSseRef.current?.abort();
    const controller = new AbortController();
    buildSseRef.current = controller;

    setBuildLogs([]);
    setStreamingBuild(true);
    
    const token = sessionStorage.getItem('access_token');

    while (!controller.signal.aborted && activeTab === 'build-logs') {
      try {
        const response = await fetch(`/app/v1/stream/build-jobs/${jobId}`, {
          headers: { 'Authorization': token || '' },
          signal: controller.signal
        });

        if (!response.ok) throw new Error('Stream disconnected');

        const reader = response.body?.getReader();
        if (!reader) break;

        const decoder = new TextDecoder();
        let buffer = '';
        let currentEvent = 'message';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            if (trimmed.startsWith('event: ')) {
              currentEvent = trimmed.substring(7);
            } else if (trimmed.startsWith('data: ')) {
              const data = trimmed.substring(6);
              try {
                const json = JSON.parse(data);
                
                if (currentEvent === 'done') {
                  setStreamingBuild(false);
                  fetchBuildJobs(); // Refresh to get final logs
                  return; 
                }

                if (json.log) {
                  setBuildLogs(prev => [...prev, json.log]);
                } else if (json.status) {
                  // Handle status updates if needed
                }
              } catch (e) { }
              currentEvent = 'message'; // Reset for next event
            }
          }
        }
        // If it finished normally but build is still in progress, it might restart.
        // If build status is 'Success' or 'Failed', we might stop, but the user wants to reconnect.
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (err: any) {
        if (err.name === 'AbortError') break;
        console.error("Build stream error, reconnecting...", err);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    setStreamingBuild(false);
  };

  // Execution Logs Stream with Auto-Reconnect
  const startExecLogStream = async () => {
    execSseRef.current?.abort();
    const controller = new AbortController();
    execSseRef.current = controller;

    setExecLogs([]);
    setStreamingExec(true);

    const token = sessionStorage.getItem('access_token');

    while (!controller.signal.aborted && activeTab === 'exec-logs') {
      try {
        const response = await fetch(`/app/v1/stream/containers/${id}/logs`, {
          headers: { 'Authorization': token || '' },
          signal: controller.signal
        });

        if (!response.ok) throw new Error('Stream disconnected');

        const reader = response.body?.getReader();
        if (!reader) break;

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const json = JSON.parse(line.substring(6));
                if (json.logs) {
                  setExecLogs(json.logs);
                } else {
                  setExecLogs(prev => [...prev, json]);
                }
              } catch (e) { }
            }
          }
        }
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (err: any) {
        if (err.name === 'AbortError') break;
        console.error("Exec stream error, reconnecting...", err);
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
    setStreamingExec(false);
  };


  const handleRedeploy = async () => {
    if (!confirm('現在の設定で再デプロイを実行しますか？')) return;
    try {
      await api.patch(`/app/v1/containers/${id}`, {
        repository_url: container.repository_url,
        branch: container.branch,
        directory: container.directory,
        env_vars: container.env_vars,
        replicas: container.replicas,
        resources: container.resources
      });
      alert('再デプロイを開始しました');
      fetchContainer();
      fetchBuildJobs();
      setActiveTab('build-logs');
      setSelectedBuildJobId(null); // Force newest selection in fetchBuildJobs
    } catch (err) {
      console.error(err);
      alert('再デプロイの開始に失敗しました。');
    }
  };

  const tabs = [
    { id: 'overview', label: '概要', icon: Zap },
    { id: 'builds', label: 'ビルド履歴', icon: RotateCcw },
    { id: 'build-logs', label: 'ビルドログ', icon: Terminal },
    { id: 'exec-logs', label: '実行ログ', icon: FileText },
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
                container?.status === 'Running' ? "bg-green-100 text-green-700" : 
                container?.status === 'Building' ? "bg-yellow-100 text-yellow-700" :
                "bg-gray-100 text-[#5f6368]"
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
            <button 
              onClick={handleRedeploy}
              className="px-4 py-2 border border-[#dadce0] bg-white rounded-md text-sm font-medium text-[#3c4043] hover:bg-gray-50 flex items-center space-x-2"
            >
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
      <div className="flex border-b border-[#dadce0] -mx-8 px-8 overflow-x-auto scrollbar-hide">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "px-6 py-4 text-sm font-medium flex items-center space-x-2 transition-all border-b-2 whitespace-nowrap",
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
                    <p className="text-xs text-[#5f6368] font-medium uppercase tracking-wider">ディレクトリ</p>
                    <p className="text-sm font-medium text-[#202124] font-mono">{container?.directory}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-[#5f6368] font-medium uppercase tracking-wider">レプリカ数</p>
                    <p className="text-sm font-medium text-[#202124]">{container?.replicas} インスタンス</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-[#5f6368] font-medium uppercase tracking-wider">最新バージョン</p>
                    <p className="text-sm font-medium text-[#202124] font-mono">{container?.version || '---'}</p>
                  </div>
                </div>
              </div>

              <div className="google-card p-6 space-y-4">
                <h4 className="text-sm font-medium text-[#202124] flex items-center space-x-2">
                  <Activity size={18} className="text-google-blue" />
                  <span>ヘルスステータス</span>
                </h4>
                <div className={cn(
                  "flex items-center space-x-2",
                  container?.status === 'Running' ? "text-google-green" : "text-gray-400"
                )}>
                  {container?.status === 'Running' ? <CheckCircle2 size={16} /> : <Clock size={16} />}
                  <span className="text-xs font-medium">{container?.status === 'Running' ? '正常に稼働中' : container?.status}</span>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="google-card p-6 space-y-4">
                <h3 className="text-sm font-medium text-[#202124]">コンテナリソース</h3>
                <div className="space-y-4">
                  <div className="flex justify-between text-xs">
                    <span className="text-[#5f6368]">CPU 制限</span>
                    <span className="font-medium">{container?.resources?.limits?.cpu || '500m'}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-[#5f6368]">メモリ制限</span>
                    <span className="font-medium">{container?.resources?.limits?.memory || '512Mi'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'build-logs' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
              <div className="flex items-center space-x-4">
                <div className="p-2.5 bg-blue-50 text-google-blue rounded-xl">
                  <Terminal size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-medium text-[#202124]">ビルド出力ログ</h3>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className={cn("w-2 h-2 rounded-full", streamingBuild ? "bg-google-green animate-pulse" : "bg-gray-300")} />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#5f6368]">{streamingBuild ? 'ストリーミング中' : 'ログ表示中'}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <label className="text-xs font-bold text-[#5f6368] uppercase tracking-wider">ジョブ選択:</label>
                <select 
                  value={selectedBuildJobId || ''} 
                  onChange={(e) => setSelectedBuildJobId(e.target.value)}
                  className="google-input !py-1.5 !pr-10 text-sm font-mono min-w-[240px]"
                >
                  {buildJobs.map(job => (
                    <option key={job.id} value={job.id}>
                      {job.id.split('-').pop()} ({job.status}) - {new Date(job.created_at).toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="bg-[#1e1e1e] text-[#d4d4d4] p-6 font-mono text-[13px] leading-relaxed min-h-[600px] rounded-2xl shadow-2xl border border-[#333] max-h-[75vh] overflow-y-auto custom-scrollbar relative">
              <div className="sticky top-0 right-0 flex justify-end pointer-events-none mb-4">
                 <div className="bg-white/5 backdrop-blur px-3 py-1 rounded-full text-[10px] text-white/40 border border-white/10 uppercase tracking-tighter">
                   Console Output
                 </div>
              </div>
              {buildLogs.length === 0 ? (
                <div className="h-[500px] flex flex-col items-center justify-center text-[#9aa0a6] space-y-4">
                  <div className="p-4 bg-white/5 rounded-full animate-pulse">
                    <Terminal size={40} className="opacity-20" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-white/60">ログを読み込み中...</p>
                    <p className="text-xs opacity-50 mt-1">ジョブを選択してログを表示してください。</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-0.5">
                  {buildLogs.map((line, i) => (
                    <div key={i} className="flex group hover:bg-white/5 px-2 -mx-2 transition-colors">
                      <span className="text-[#858585] w-12 shrink-0 select-none opacity-40 text-right pr-4 italic font-light">{(i+1)}</span>
                      <span className="break-all whitespace-pre-wrap group-hover:text-white transition-colors">{line || ' '}</span>
                    </div>
                  ))}
                  <div ref={logEndRef} />
                </div>
              )}
            </div>
          </div>
        )}


        {activeTab === 'exec-logs' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center px-2">
              <h3 className="text-lg font-medium text-[#202124]">実行ログ (Stdout/Stderr)</h3>
              <div className="flex items-center space-x-2">
                <div className={cn("w-2.5 h-2.5 rounded-full", streamingExec ? "bg-google-green animate-pulse" : "bg-gray-300")} />
                <span className="text-xs font-medium text-[#5f6368]">{streamingExec ? 'ストリーミング中' : '切断済み'}</span>
              </div>
            </div>
            <div className="bg-[#202124] text-[#e8eaed] p-6 font-mono text-[13px] leading-relaxed min-h-[500px] rounded-lg shadow-inner max-h-[600px] overflow-y-auto">
              {execLogs.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-[#9aa0a6] py-20 space-y-2">
                  <Loader2 className="animate-spin" size={32} opacity={0.3} />
                  <p>ログを収集中...</p>
                </div>
              ) : (
                <>
                  {execLogs.map((entry, i) => (
                    <div key={i} className="py-1 border-b border-white/5 last:border-0 group">
                      <div className="flex items-center space-x-2 text-[10px] text-[#5f6368] mb-0.5">
                        <span className="bg-white/10 px-1.5 py-0.5 rounded text-white/60">{entry.pod_name.split('-').pop()}</span>
                        <span>{new Date(entry.timestamp).toLocaleString()}</span>
                      </div>
                      <div className="group-hover:text-white transition-colors pl-2 border-l border-white/10">{entry.message}</div>
                    </div>
                  ))}
                  <div ref={execLogEndRef} />
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
                {buildJobs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-[#5f6368]">ビルド履歴がありません</td>
                  </tr>
                ) : (
                  buildJobs.map((job) => (
                    <tr key={job.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-google-blue font-medium">{job.id.slice(0, 12)}...</td>
                      <td className="px-6 py-4">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-bold uppercase",
                          job.status === 'Success' ? "bg-green-100 text-green-700" : 
                          job.status === 'Failed' ? "bg-red-100 text-red-700" :
                          job.status === 'Running' ? "bg-blue-100 text-blue-700" :
                          "bg-gray-100 text-[#5f6368]"
                        )}>{job.status}</span>
                      </td>
                      <td className="px-6 py-4 font-medium text-[#202124]">{job.version || '---'}</td>
                      <td className="px-6 py-4 text-xs text-[#5f6368]">{new Date(job.created_at).toLocaleString('ja-JP')}</td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => {
                            setSelectedBuildJobId(job.id);
                            setActiveTab('build-logs');
                          }}
                          className="px-3 py-1.5 text-xs font-medium text-google-blue hover:bg-blue-50 rounded transition-all flex items-center space-x-1 ml-auto"
                        >
                          <Terminal size={14} />
                          <span>ログを表示</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'networking' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-in fade-in duration-300">
            {/* Service Settings */}
            <div className="google-card p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-50 text-google-blue rounded-lg">
                    <Activity size={20} />
                  </div>
                  <h3 className="text-lg font-medium text-[#202124]">内部サービス設定</h3>
                </div>
                <button 
                  onClick={async () => {
                    const newActive = !container?.service?.is_active;
                    const res = await api.patch(`/app/v1/containers/${id}/service`, {
                      is_active: newActive,
                      ports: JSON.parse(container?.service?.ports || '[]')
                    });
                    setContainer({...container, service: res.data.data});
                  }}
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
                    container?.service?.is_active ? "bg-google-blue" : "bg-gray-200"
                  )}
                >
                  <span className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                    container?.service?.is_active ? "translate-x-6" : "translate-x-1"
                  )} />
                </button>
              </div>

              {container?.service?.is_active ? (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="p-3 bg-gray-50 rounded border border-gray-100 space-y-1">
                      <p className="text-[10px] font-bold text-[#5f6368] uppercase tracking-wider">内部 DNS 名</p>
                      <p className="text-sm font-mono text-[#202124] break-all">{container.name}.ns-{container.project_id}.svc.cluster.local</p>
                    </div>
                    <div className="p-3 bg-gray-50 rounded border border-gray-100 space-y-1">
                      <p className="text-[10px] font-bold text-[#5f6368] uppercase tracking-wider">クラスター IP</p>
                      <p className="text-sm font-mono text-[#202124]">{container.service.internal_ip || '自動割り当て'}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-[#5f6368] uppercase tracking-wider">ポートマッピング</h4>
                      <button 
                        onClick={() => {
                          const currentPorts = JSON.parse(container.service.ports || '[]');
                          const newPorts = [...currentPorts, { name: `port-${currentPorts.length + 1}`, protocol: 'TCP', port: 80, target: 80 }];
                          setContainer({...container, service: {...container.service, ports: JSON.stringify(newPorts)}});
                        }}
                        className="text-[10px] font-bold text-google-blue hover:underline uppercase"
                      >
                        ポートを追加
                      </button>
                    </div>
                    <div className="space-y-3">
                      {JSON.parse(container.service.ports || '[]').map((p: any, idx: number) => (
                        <div key={idx} className="flex items-end space-x-2 animate-in slide-in-from-left-2 duration-200">

                          <div className="w-20 space-y-1">
                            <label className="text-[9px] text-gray-500 font-bold uppercase">Proto</label>
                            <select 
                              value={p.protocol}
                              onChange={(e) => {
                                const ports = JSON.parse(container.service.ports);
                                ports[idx].protocol = e.target.value;
                                setContainer({...container, service: {...container.service, ports: JSON.stringify(ports)}});
                              }}
                              className="google-input !py-1 text-xs"
                            >
                              <option>TCP</option>
                              <option>UDP</option>
                            </select>
                          </div>
                          <div className="w-16 space-y-1">
                            <label className="text-[9px] text-gray-500 font-bold uppercase">Port</label>
                            <input 
                              type="number" 
                              value={p.port}
                              onChange={(e) => {
                                const ports = JSON.parse(container.service.ports);
                                ports[idx].port = parseInt(e.target.value);
                                setContainer({...container, service: {...container.service, ports: JSON.stringify(ports)}});
                              }}
                              className="google-input !py-1 text-xs" 
                            />
                          </div>
                          <button 
                            onClick={() => {
                              const ports = JSON.parse(container.service.ports).filter((_: any, i: number) => i !== idx);
                              setContainer({...container, service: {...container.service, ports: JSON.stringify(ports)}});
                            }}
                            className="p-1.5 text-gray-300 hover:text-google-red transition-colors"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                    <button 
                      onClick={async () => {
                        const res = await api.patch(`/app/v1/containers/${id}/service`, {
                          is_active: true,
                          ports: JSON.parse(container.service.ports)
                        });
                        setContainer({...container, service: res.data.data});
                        alert('ネットワーク設定を更新しました。');
                      }}
                      className="w-full py-2 bg-google-blue text-white rounded text-sm font-medium hover:shadow-md transition-all"
                    >
                      設定を保存して適用
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center space-y-4">
                  <Activity size={48} className="mx-auto text-gray-200" />
                  <p className="text-sm text-[#5f6368]">
                    内部サービスを有効にすると、プロジェクト内の他のコンテナからこのコンテナへ通信できるようになります。
                  </p>
                  <button 
                    onClick={async () => {
                      const res = await api.patch(`/app/v1/containers/${id}/service`, {
                        is_active: true,
                        ports: [{ name: 'http', protocol: 'TCP', port: 80, target: 80 }]
                      });
                      setContainer({...container, service: res.data.data});
                    }}
                    className="px-6 py-2 bg-google-blue text-white rounded text-sm font-medium hover:shadow-md transition-all"
                  >
                    サービスを有効化
                  </button>
                </div>
              )}
            </div>

            {/* Ingress Settings */}
            <div className="google-card p-8 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-green-50 text-google-green rounded-lg">
                    <Globe size={20} />
                  </div>
                  <h3 className="text-lg font-medium text-[#202124]">外部公開 (Ingress)</h3>
                </div>
                <div className={cn(
                  "px-3 py-1 rounded-full text-[10px] font-bold uppercase",
                  container?.ingress ? "bg-green-100 text-green-700" : "bg-gray-100 text-[#5f6368]"
                )}>
                  {container?.ingress ? '公開中' : '非公開'}
                </div>
              </div>

              <div className="space-y-6">
                {container?.ingress ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#5f6368] uppercase tracking-wider">公開URL</label>
                      <div className="flex items-center space-x-2 bg-[#f8f9fa] p-3 rounded-lg border border-[#dadce0] group">
                        <Globe size={16} className="text-[#5f6368]" />
                        <span className="text-sm font-medium text-google-blue flex-1 truncate">{container.ingress.subdomain}</span>
                        <a 
                          href={`https://${container.ingress.subdomain}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="p-1 hover:bg-white rounded transition-colors"
                        >
                          <ExternalLink size={14} className="text-[#5f6368]" />
                        </a>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#5f6368] uppercase tracking-wider">ターゲットポート</label>
                      <div className="p-3 bg-white border border-gray-100 rounded text-sm font-medium text-[#202124]">
                        Port {container.ingress.http_port} (HTTP)
                      </div>
                    </div>
                    <button 
                      onClick={async () => {
                        if(!confirm('外部公開を停止しますか？')) return;
                        await api.delete(`/app/v1/containers/${id}/ingress`);
                        setContainer({...container, ingress: null});
                      }}
                      className="w-full py-2 border border-google-red text-google-red rounded text-sm font-medium hover:bg-red-50 transition-colors"
                    >
                      公開を停止する
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-sm text-[#5f6368] leading-relaxed">
                      外部公開を有効にすると、インターネットからコンテナへアクセス可能なランダムなサブドメインが発行されます。
                    </p>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#5f6368] uppercase tracking-wider">公開する内部ポート</label>
                      <select 
                        id="ingress-target-port"
                        className="google-input"
                      >
                        {JSON.parse(container?.service?.ports || '[{"port":80}]').map((p: any) => (
                          <option key={p.port} value={p.port}>{p.name} ({p.port})</option>
                        ))}
                      </select>
                    </div>
                    <button 
                      onClick={async () => {
                        const port = (document.getElementById('ingress-target-port') as HTMLSelectElement).value;
                        const res = await api.post(`/app/v1/containers/${id}/ingress`, { http_port: parseInt(port) });
                        setContainer({...container, ingress: res.data.data});
                      }}
                      className="w-full py-2 bg-google-blue text-white rounded text-sm font-medium hover:shadow-md transition-all flex items-center justify-center space-x-2"
                    >
                      <Globe size={16} />
                      <span>外部公開を有効にする</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}



        {activeTab === 'history' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center px-2">
              <h3 className="text-lg font-medium text-[#202124]">プロジェクト構成スナップショット</h3>
            </div>
            <div className="p-10 text-center google-card space-y-4">
              <History size={48} className="mx-auto text-gray-300" />
              <p className="text-sm text-[#5f6368]">
                このプロジェクトの履歴管理はプロジェクト詳細ページから一括で行われます。
              </p>
              <Link 
                to={`/projects/${container?.project_id}`}
                className="inline-block text-google-blue text-sm font-medium hover:underline"
              >
                プロジェクト詳細へ移動
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContainerDetail;


import React, { useState, useEffect, useRef } from 'react';
import {
    X, Loader2, RotateCcw, RotateCw, Zap, Terminal,
    FileText, Globe, Database, ShieldCheck, Clock,
    ExternalLink, Plus, Trash2, Info, Save, Activity,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { containerService } from '../../services/containerService';
import { logStreamService } from '../../services/logStreamService';

interface ContainerSidePanelProps {
    containerId: string;
    onClose: () => void;
}

type SidebarTab = 'overview' | 'builds' | 'build-logs' | 'exec-logs' | 'networking' | 'volumes' | 'env-vars';

export const ContainerSidePanel: React.FC<ContainerSidePanelProps> = ({ containerId, onClose }) => {
    const [activeTab, setActiveTab] = useState<SidebarTab>('overview');
    const [container, setContainer] = useState<any>(null);
    const [buildJobs, setBuildJobs] = useState<any[]>([]);
    const [buildLogs, setBuildLogs] = useState<string[]>([]);
    const [execLogs, setExecLogs] = useState<any[]>([]);
    const [project, setProject] = useState<any>(null);
    const [envVars, setEnvVars] = useState<{ key: string; value: string }[]>([]);
    const [isSavingEnv, setIsSavingEnv] = useState(false);
    const [customDomain, setCustomDomain] = useState('');
    const [customDomainEnabled, setCustomDomainEnabled] = useState(true);
    const [streamingBuild, setStreamingBuild] = useState(false);
    const [streamingExec, setStreamingExec] = useState(false);
    const [selectedBuildJobId, setSelectedBuildJobId] = useState<string | null>(null);
    const [volumes, setVolumes] = useState<any[]>([]);
    const [newVolume, setNewVolume] = useState({ name: '', size_mb: 128, mount_path: '/data' });
    const [isCreatingVolume, setIsCreatingVolume] = useState(false);

    const wsRef = useRef<WebSocket | null>(null);
    const execWsRef = useRef<WebSocket | null>(null);
    const buildLogEndRef = useRef<HTMLDivElement>(null);
    const execLogEndRef = useRef<HTMLDivElement>(null);

    // --- API Fetch Logic ---
    const fetchData = async () => {
        try {
            const res = await containerService.getContainer(containerId);
            const data = res.data.data;
            setContainer(data);
            if (data.ingress) {
                setCustomDomain(data.ingress.custom_domain || '');
                setCustomDomainEnabled(data.ingress.custom_domain_enabled);
            }
            const projRes = await containerService.getProject(data.project_id);
            const projData = projRes.data.data;
            setProject(projData);
            try {
                const vars = JSON.parse(projData.env_vars || '{}');
                setEnvVars(Object.entries(vars).map(([key, value]) => ({ key, value: String(value) })));
            } catch { setEnvVars([]); }
        } catch (err) { console.error(err); }
    };

    const fetchBuildJobs = async () => {
        try {
            const res = await containerService.getBuildJobs(containerId);
            const jobs = res.data.data.items || [];
            setBuildJobs(jobs);
            if (!selectedBuildJobId && jobs.length > 0) setSelectedBuildJobId(jobs[0].id);
        } catch (err) { console.error(err); }
    };

    const fetchVolumes = async () => {
        try {
            const res = await containerService.getVolumes(containerId);
            setVolumes(res.data.data.items || []);
        } catch (err) { console.error(err); }
    };

    useEffect(() => { fetchData(); }, [containerId]);
    useEffect(() => {
        if (activeTab === 'builds' || activeTab === 'build-logs') fetchBuildJobs();
        if (activeTab === 'volumes') fetchVolumes();
    }, [containerId, activeTab]);

    // Auto-scroll for logs
    useEffect(() => {
        if (activeTab === 'build-logs') buildLogEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [buildLogs, activeTab]);

    useEffect(() => {
        if (activeTab === 'exec-logs') execLogEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [execLogs, activeTab]);

    // Build Logs Streaming Logic
    useEffect(() => {
        if (selectedBuildJobId && activeTab === 'build-logs') {
            wsRef.current?.close();
            setBuildLogs([]);
            const selectedJob = buildJobs.find(j => j.id === selectedBuildJobId);
            const isFinished = ['Success', 'Failed', 'Cancelled', 'Succeeded', 'Complete'].includes(selectedJob?.status);

            if (isFinished) {
                setStreamingBuild(false);
                containerService.getBuildLogs(selectedBuildJobId)
                    .then(res => setBuildLogs(res.data.data.log?.split('\n') || []));
            } else {
                setStreamingBuild(true);
                wsRef.current = logStreamService.startBuildLogStream(
                    selectedBuildJobId,
                    (log) => setBuildLogs(prev => [...prev, ...log.split('\n')]),
                    () => { setStreamingBuild(false); fetchBuildJobs(); },
                    setStreamingBuild
                );
            }
        }
        return () => wsRef.current?.close();
    }, [selectedBuildJobId, activeTab]);

    // Exec Logs Streaming Logic
    useEffect(() => {
        if (activeTab === 'exec-logs') {
            execWsRef.current?.close();
            setExecLogs([]);
            setStreamingExec(true);
            execWsRef.current = logStreamService.startExecLogStream(
                containerId,
                (entry) => setExecLogs(prev => [...prev, entry]),
                setStreamingExec
            );
        }
        return () => execWsRef.current?.close();
    }, [containerId, activeTab]);

    const handleSaveEnvVars = async () => {
        if (!project) return;
        setIsSavingEnv(true);
        try {
            const envObj = envVars.reduce((acc, { key, value }) => {
                if (key.trim()) acc[key.trim()] = value;
                return acc;
            }, {} as Record<string, string>);
            await containerService.updateProjectEnvVars(project.id, JSON.stringify(envObj));
            alert('環境変数を保存しました。反映には再ビルドが必要です。');
            fetchData();
        } catch (err) { alert('保存に失敗しました。'); }
        finally { setIsSavingEnv(false); }
    };

    const tabs: { id: SidebarTab; label: string; icon: React.ElementType }[] = [
        { id: 'overview', label: '概要', icon: Zap },
        { id: 'builds', label: '履歴', icon: Clock },
        { id: 'build-logs', label: 'ビルド', icon: Terminal },
        { id: 'exec-logs', label: '実行', icon: FileText },
        { id: 'networking', label: 'ネット', icon: Globe },
        { id: 'volumes', label: 'Vol', icon: Database },
        { id: 'env-vars', label: 'ENV', icon: ShieldCheck },
    ];

    if (!container) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-blue-500" /></div>;

    return (
        <div className="flex flex-col h-full bg-white text-gray-900">
            {/* Header */}
            <div className="flex-shrink-0 p-4 border-b bg-gray-50/50">
                <div className="flex items-start justify-between mb-3">
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <h2 className="text-sm font-bold truncate">{container.name}</h2>
                            <span className={cn(
                                "px-1.5 py-0.5 rounded-full text-[12px] font-bold uppercase",
                                container.status === 'Running' ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700 animate-pulse"
                            )}>{container.status}</span>
                        </div>
                        <p className="text-[10px] text-gray-400 font-mono mt-0.5 truncate">{container.id}</p>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded transition-colors"><X size={16} className="text-gray-400" /></button>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => confirm('再デプロイしますか？') && containerService.redeployContainer(containerId).then(fetchData)} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-bold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shadow-sm transition-all"><RotateCcw size={12} /><span>再デプロイ</span></button>
                    <button onClick={() => confirm('再ビルドしますか？') && containerService.rebuildContainer(containerId).then(() => { setActiveTab('build-logs'); fetchData(); })} className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 rounded-lg hover:bg-blue-100 shadow-sm transition-all"><RotateCw size={12} /><span>再ビルド</span></button>
                </div>
            </div>

            {/* Tabs */}
            <div className="flex-shrink-0 flex overflow-x-auto scrollbar-hide border-b bg-white">
                {tabs.map(tab => (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={cn(
                        "flex flex-col items-center gap-1 px-3 py-2 text-[12px] font-bold transition-all whitespace-nowrap border-b-2 min-w-[56px]",
                        activeTab === tab.id ? "border-blue-500 text-blue-600 bg-blue-50/30" : "border-transparent text-gray-400 hover:text-gray-600"
                    )}>
                        <tab.icon size={14} />
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto">
                {activeTab === 'overview' && (
                    <div className="p-4 space-y-4">
                        <div className="space-y-3 bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                            {[
                                { label: 'リポジトリ', value: container.repository_url },
                                { label: 'ブランチ', value: container.branch },
                                { label: 'パス', value: container.directory || '/' },
                                { label: 'レプリカ', value: container.replicas },
                                // { label: 'ビルドVer', value: container.version || '---' }
                            ].map(item => (
                                <div key={item.label} className="flex justify-between items-start gap-4 text-[11px]">
                                    <span className="text-gray-400 font-medium shrink-0">{item.label}</span>
                                    <span className="text-gray-700 font-mono text-right break-all">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Networking - Port Maps & Ingress */}
                {activeTab === 'networking' && (
                    <div className="p-4 space-y-5">
                        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                            <div className="px-3 py-2 bg-gray-50 border-b flex justify-between items-center">
                                <div className="flex items-center gap-2 text-[11px] font-bold text-gray-700"><Activity size={14} className="text-blue-500" /><span>内部ポート設定</span></div>
                                <button onClick={async () => {
                                    const res = await containerService.updateService(containerId, { is_active: !container?.service?.is_active, ports: JSON.parse(container?.service?.ports || '[]') });
                                    setContainer({ ...container, service: res.data.data });
                                }} className={cn("w-8 h-4 rounded-full relative transition-colors", container?.service?.is_active ? "bg-blue-500" : "bg-gray-200")}><span className={cn("absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all", container?.service?.is_active ? "right-0.5" : "left-0.5")} /></button>
                            </div>
                            {container?.service?.is_active && (
                                <div className="p-3 space-y-3">
                                    <div className="p-2 bg-gray-50 rounded text-[10px] font-mono text-gray-500 border border-gray-100">{container.name}.ns-{container.project_id}.svc.cluster.local</div>
                                    <div className="space-y-2">
                                        {JSON.parse(container?.service?.ports || '[]').map((p: any, idx: number) => (
                                            <div key={idx} className="flex items-center gap-2 p-2 border rounded-lg bg-white">
                                                <div className="flex-1"><p className="text-[18px] text-gray-400 font-bold uppercase">Port</p><input type="number" value={p.port} onChange={e => { const ports = JSON.parse(container.service.ports); ports[idx].port = parseInt(e.target.value); setContainer({ ...container, service: { ...container.service, ports: JSON.stringify(ports) } }); }} className="w-full text-xs font-mono border-none p-0 focus:ring-0" /></div>
                                                <div className="flex-1"><p className="text-[18px] text-gray-400 font-bold uppercase">Target</p><input type="number" value={p.target} onChange={e => { const ports = JSON.parse(container.service.ports); ports[idx].target = parseInt(e.target.value); setContainer({ ...container, service: { ...container.service, ports: JSON.stringify(ports) } }); }} className="w-full text-xs font-mono border-none p-0 focus:ring-0" /></div>
                                                <button onClick={() => { const ports = JSON.parse(container.service.ports).filter((_: any, i: number) => i !== idx); setContainer({ ...container, service: { ...container.service, ports: JSON.stringify(ports) } }); }} className="text-gray-300 hover:text-red-500"><Trash2 size={12} /></button>
                                            </div>
                                        ))}
                                        <button onClick={() => { const ports = JSON.parse(container?.service?.ports || '[]'); ports.push({ name: 'http', protocol: 'TCP', port: 80, target: 80 }); setContainer({ ...container, service: { ...container.service, ports: JSON.stringify(ports) } }); }} className="w-full py-1 border border-dashed rounded text-[10px] text-gray-400 font-bold hover:bg-gray-50">+ 追加</button>
                                        <button onClick={async () => { await containerService.updateService(containerId, { is_active: true, ports: JSON.parse(container.service.ports) }); alert('保存しました'); }} className="w-full py-2 bg-gray-900 text-white rounded-lg text-[10px] font-bold">適用</button>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                            <div className="px-3 py-2 bg-gray-50 border-b flex justify-between items-center">
                                <div className="flex items-center gap-2 text-[11px] font-bold text-gray-700"><Globe size={14} className="text-green-500" /><span>外部公開 (Ingress)</span></div>
                                <span className="text-[12px] font-bold text-gray-400">{container.ingress ? 'ACTIVE' : 'INACTIVE'}</span>
                            </div>
                            <div className="p-3 space-y-4">
                                {container.ingress ? (
                                    <>
                                        <div className="space-y-1">
                                            <p className="text-[12px] font-bold text-gray-400">DEFAULT DOMAIN</p>
                                            <div className="flex items-center justify-between p-2 bg-gray-50 border rounded-lg"><span className="text-[10px] font-mono truncate">{container.ingress.subdomain}</span><a href={`https://${container.ingress.subdomain}`} target="_blank" rel="noreferrer"><ExternalLink size={12} className="text-blue-500" /></a></div>
                                        </div>
                                        <div className="space-y-1">
                                            <p className="text-[12px] font-bold text-gray-400">CUSTOM DOMAIN</p>
                                            <div className="flex items-center gap-2">
                                                <input value={customDomain} onChange={e => setCustomDomain(e.target.value)} placeholder="example.com" className="flex-1 px-2.5 py-1.5 text-xs border rounded-lg focus:ring-1 focus:ring-blue-500 outline-none" />
                                                <button onClick={() => setCustomDomainEnabled(!customDomainEnabled)} className={cn("w-8 h-4 rounded-full relative transition-colors", customDomainEnabled ? "bg-blue-500" : "bg-gray-200")}><span className={cn("absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all", customDomainEnabled ? "right-0.5" : "left-0.5")} /></button>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 pt-1">
                                            <button onClick={() => containerService.updateIngress(containerId, { http_port: container.ingress.http_port, custom_domain: customDomain, custom_domain_enabled: customDomainEnabled }).then(() => alert('更新完了'))} className="flex-1 py-1.5 bg-blue-500 text-white rounded-lg text-[10px] font-bold">保存</button>
                                            <button onClick={() => confirm('削除しますか？') && containerService.deleteIngress(containerId).then(fetchData)} className="px-3 py-1.5 border border-red-100 text-red-500 rounded-lg text-[10px] font-bold">停止</button>
                                        </div>
                                    </>
                                ) : (
                                    <div className="space-y-3">
                                        <div className="space-y-1"><p className="text-[12px] font-bold text-gray-400">公開ポート</p><select id="ing-port" className="w-full p-2 text-xs border rounded-lg">{JSON.parse(container?.service?.ports || '[{"port":80}]').map((p: any) => <option key={p.port} value={p.port}>Port {p.port}</option>)}</select></div>
                                        <button onClick={() => { const p = (document.getElementById('ing-port') as HTMLSelectElement).value; containerService.createIngress(containerId, { http_port: parseInt(p), custom_domain: customDomain, custom_domain_enabled: customDomainEnabled }).then(fetchData); }} className="w-full py-2 bg-blue-500 text-white rounded-lg text-[10px] font-bold">外部公開を有効化</button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Volumes */}
                {activeTab === 'volumes' && (
                    <div className="p-4 space-y-4">
                        <div className="space-y-3">
                            {volumes.map(vol => (
                                <div key={vol.id} className="p-3 border rounded-xl bg-white shadow-sm flex items-center justify-between">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2"><Database size={12} className="text-gray-400" /><p className="text-xs font-bold truncate">{vol.name}</p></div>
                                        <p className="text-[10px] text-blue-500 font-mono mt-1">{vol.mount_path} <span className="text-gray-300 mx-1">|</span> {vol.size_mb}MB</p>
                                    </div>
                                    <button onClick={() => confirm('削除しますか？') && containerService.deleteVolume(vol.id).then(fetchVolumes)} className="p-1.5 text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                                </div>
                            ))}
                        </div>
                        <div className="p-4 border border-dashed rounded-2xl bg-gray-50/50 space-y-3">
                            <p className="text-[10px] font-bold text-gray-500 uppercase">新規ボリューム</p>
                            <input value={newVolume.name} onChange={e => setNewVolume({ ...newVolume, name: e.target.value })} placeholder="名称" className="w-full p-2 text-xs border rounded-lg" />
                            <input value={newVolume.mount_path} onChange={e => setNewVolume({ ...newVolume, mount_path: e.target.value })} placeholder="マウントパス (/data)" className="w-full p-2 text-xs border rounded-lg font-mono" />
                            <div className="space-y-1">
                                <div className="flex justify-between text-[12px] font-bold text-gray-400"><span>サイズ</span><span>{newVolume.size_mb}MB</span></div>
                                <input type="range" min="128" max="5120" step="128" value={newVolume.size_mb} onChange={e => setNewVolume({ ...newVolume, size_mb: parseInt(e.target.value) })} className="w-full accent-blue-500" />
                            </div>
                            <button onClick={async () => { setIsCreatingVolume(true); try { await containerService.createVolume(containerId, newVolume); setNewVolume({ name: '', size_mb: 128, mount_path: '/data' }); fetchVolumes(); alert('作成しました。再デプロイが必要です。'); } finally { setIsCreatingVolume(false); } }} disabled={!newVolume.name || isCreatingVolume} className="w-full py-2 bg-gray-900 text-white text-[10px] font-bold rounded-lg disabled:opacity-50">作成</button>
                        </div>
                    </div>
                )}

                {/* Env Vars */}
                {activeTab === 'env-vars' && (
                    <div className="p-4 space-y-4">
                        <div className="flex justify-between items-center"><div className="text-[11px] font-bold text-gray-700">プロジェクト環境変数</div><button onClick={() => setEnvVars([...envVars, { key: '', value: '' }])} className="p-1 text-blue-500 hover:bg-blue-50 rounded"><Plus size={16} /></button></div>
                        <div className="space-y-2">
                            {envVars.map((ev, i) => (
                                <div key={i} className="flex gap-2 group">
                                    <input className="flex-1 px-2 py-1.5 text-[10px] font-mono border rounded-lg bg-gray-50 focus:bg-white outline-none" placeholder="KEY" value={ev.key} onChange={e => { const n = [...envVars]; n[i].key = e.target.value; setEnvVars(n); }} />
                                    <input className="flex-1 px-2 py-1.5 text-[10px] font-mono border rounded-lg bg-gray-50 focus:bg-white outline-none" placeholder="VALUE" value={ev.value} onChange={e => { const n = [...envVars]; n[i].value = e.target.value; setEnvVars(n); }} />
                                    <button onClick={() => setEnvVars(envVars.filter((_, idx) => idx !== i))} className="p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={14} /></button>
                                </div>
                            ))}
                        </div>
                        <div className="pt-2">
                            <button onClick={handleSaveEnvVars} disabled={isSavingEnv} className="w-full py-2 bg-blue-500 text-white text-[10px] font-bold rounded-xl flex justify-center items-center gap-2">{isSavingEnv ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} {isSavingEnv ? '保存中...' : '変更を保存'}</button>
                            <div className="mt-3 p-2 bg-blue-50 border border-blue-100 rounded text-[12px] text-blue-600 flex gap-2"><Info size={12} className="shrink-0" /><span>保存後、再ビルドを実行してください。</span></div>
                        </div>
                    </div>
                )}

                {/* Logs Sections */}
                {(activeTab === 'build-logs' || activeTab === 'exec-logs') && (
                    <div className="flex flex-col h-[500px]">
                        {activeTab === 'build-logs' && (
                            <div className="p-2 border-b bg-gray-50/50">
                                <select value={selectedBuildJobId || ''} onChange={e => setSelectedBuildJobId(e.target.value)} className="w-full p-1.5 text-[10px] font-bold border rounded-lg bg-white">
                                    {buildJobs.map(job => <option key={job.id} value={job.id}>Job: {job.id.slice(0, 8)} ({job.status})</option>)}
                                </select>
                            </div>
                        )}
                        <div className="flex-1 bg-[#1a1a1a] p-3 overflow-y-auto font-mono text-[10px] leading-relaxed">
                            {(activeTab === 'build-logs' ? buildLogs : execLogs.map(l => l.message)).map((line, i) => (
                                <div key={i} className="flex gap-3 text-gray-400 group"><span className="w-6 text-right text-gray-600 select-none group-hover:text-gray-500">{i + 1}</span><span className="text-gray-200 break-all">{line}</span></div>
                            ))}
                            <div ref={activeTab === 'build-logs' ? buildLogEndRef : execLogEndRef} />
                        </div>
                    </div>
                )}

                {/* Build History */}
                {activeTab === 'builds' && (
                    <div className="p-4 space-y-3">
                        {buildJobs.map(job => (
                            <div key={job.id} className="p-3 border rounded-xl bg-white shadow-sm flex items-center justify-between">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2"><span className={cn("w-1.5 h-1.5 rounded-full", job.status === 'Success' ? 'bg-green-500' : 'bg-yellow-500')} /><p className="text-[11px] font-bold">{job.id.slice(0, 8)}</p></div>
                                    <p className="text-[12px] text-gray-400">{new Date(job.created_at).toLocaleString()}</p>
                                </div>
                                <button onClick={() => { setSelectedBuildJobId(job.id); setActiveTab('build-logs'); }} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"><Terminal size={14} /></button>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
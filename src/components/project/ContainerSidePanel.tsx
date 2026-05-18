import React, { useState, useEffect, useRef } from 'react';
import {
    X, Loader2, RotateCcw, RotateCw, Zap, Terminal,
    FileText, Globe, Database, ShieldCheck, Clock, Trash2,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { containerService } from '../../services/containerService';
import { api } from '../../lib/api';

// Tab Components
import { OverviewTab } from './container-side-panel/OverviewTab';
import { BuildHistoryTab } from './container-side-panel/BuildHistoryTab';
import { BuildLogsTab } from './container-side-panel/BuildLogsTab';
import { ExecLogsTab } from './container-side-panel/ExecLogsTab';
import { NetworkingTab } from './container-side-panel/NetworkingTab';
import { VolumesTab } from './container-side-panel/VolumesTab';
import { EnvVarsTab } from './container-side-panel/EnvVarsTab';
import { DeleteTab } from './container-side-panel/DeleteTab';

interface ContainerSidePanelProps {
    containerId: string;
    containerData?: any;
    onClose: () => void;
    initialTab?: SidebarTab;
}

type SidebarTab = 'overview' | 'builds' | 'build-logs' | 'exec-logs' | 'networking' | 'volumes' | 'env-vars' | 'delete';

export const ContainerSidePanel: React.FC<ContainerSidePanelProps> = ({ containerId, containerData, onClose, initialTab }) => {
    const [activeTab, setActiveTab] = useState<SidebarTab>(initialTab || 'overview');

    // Update activeTab when initialTab changes (e.g. from clicking another node)
    useEffect(() => {
        if (initialTab) setActiveTab(initialTab);
    }, [initialTab]);
    const [container, setContainer] = useState<any>(containerData ?? null);
    const [pods, setPods] = useState<any[]>([]);
    const [buildJobs, setBuildJobs] = useState<any[]>([]);
    const [buildLogs, setBuildLogs] = useState<string[]>([]);
    const [execLogs, setExecLogs] = useState<any[]>([]);
    const [envVars, setEnvVars] = useState<{ key: string; value: string }[]>([]);
    const [isSavingEnv, setIsSavingEnv] = useState(false);
    const [customDomain, setCustomDomain] = useState('');
    const [customDomainEnabled, setCustomDomainEnabled] = useState(true);
    const [selectedBuildJobId, setSelectedBuildJobId] = useState<string | null>(null);
    const [volumes, setVolumes] = useState<any[]>([]);

    const [loadingBuildLogs, setLoadingBuildLogs] = useState(false);
    const [execLogConnected, setExecLogConnected] = useState(false);
    const buildJobsRef = useRef<any[]>([]);

    // 選択されたコンテナの情報を取得する
    const fetchData = async () => {
        try {
            // コンテナ情報
            const res = await containerService.getContainer(containerId);

            const { container: data, pods: podList } = res.data.data;

            setContainer(data);
            setPods(podList ?? []);

            if (data.ingress) {
                setCustomDomain(data.ingress.custom_domain || '');
                setCustomDomainEnabled(data.ingress.custom_domain_enabled);
            }

            try {
                const vars = JSON.parse(data.env_vars || '{}');
                setEnvVars(Object.entries(vars).map(([key, value]) => ({ key, value: String(value) })));
            } catch { setEnvVars([]); }
        } catch (err) { console.error(err); }
    };

    // ビルドジョブを取得する
    const fetchBuildJobs = async () => {
        try {
            const res = await containerService.getBuildJobs(containerId);
            const jobs = res.data.data.items || [];
            setBuildJobs(jobs);
            buildJobsRef.current = jobs;
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

    // ProjectDetail のポーリングデータを常に反映する
    useEffect(() => {
        if (!containerData) return;
        setContainer(containerData);
        setPods(containerData.pods ?? []);
    }, [containerData]);

    // Polling for builds when builds tab is active
    useEffect(() => {
        if (activeTab === 'builds' || activeTab === 'build-logs') {
            fetchBuildJobs();
            const interval = setInterval(fetchBuildJobs, 5000); // 5 seconds polling
            return () => clearInterval(interval);
        }
    }, [containerId, activeTab]);

    useEffect(() => {
        if (activeTab === 'volumes') fetchVolumes();
    }, [containerId, activeTab]);

    const fetchBuildLogs = (jobId: string) => {
        setLoadingBuildLogs(true);
        containerService.getBuildLogs(jobId)
            .then(res => {
                const log = res.data.data.log;
                setBuildLogs(log ? log.split('\n').filter((l: string) => l.trim() !== '') : []);
            })
            .catch(err => console.error('Failed to fetch build logs', err))
            .finally(() => setLoadingBuildLogs(false));
    };

    // Build Logs Polling Logic
    useEffect(() => {
        if (!selectedBuildJobId || activeTab !== 'build-logs') return;

        setBuildLogs([]);
        fetchBuildLogs(selectedBuildJobId);

        const interval = setInterval(() => {
            const job = buildJobsRef.current.find(j => j.id === selectedBuildJobId);
            if (job && (job.status === 'Queued' || job.status === 'Running' || job.status === 'Building')) {
                fetchBuildLogs(selectedBuildJobId);
            }
        }, 3000);
        return () => clearInterval(interval);
    }, [selectedBuildJobId, activeTab]);

    // 実行ログポーリング
    useEffect(() => {
        if (activeTab !== 'exec-logs') return;

        const fetchExecLogs = () => {
            setExecLogConnected(true);
            api.get(`/app/v1/containers/${containerId}/logs`)
                .then(res => {
                    const logs: { line: string }[] = res.data.data.logs || [];
                    setExecLogs(logs.map(l => ({ pod_name: '', timestamp: '', message: l.line })));
                })
                .catch(err => console.error("Failed to fetch exec logs", err))
                .finally(() => setExecLogConnected(false));
        };

        fetchExecLogs();

        const isActive = container?.status === 'Running' || container?.status === 'Deploying' || container?.status === 'Redeploying';
        if (!isActive) return;

        const interval = setInterval(fetchExecLogs, 3000);
        return () => clearInterval(interval);
    }, [containerId, activeTab, container?.status]);

    const handleSaveEnvVars = async () => {
        setIsSavingEnv(true);
        try {
            const envObj = envVars.reduce((acc, { key, value }) => {
                if (key.trim()) acc[key.trim()] = value;
                return acc;
            }, {} as Record<string, string>);
            await containerService.updateContainerEnvVars(containerId, JSON.stringify(envObj));
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
        { id: 'delete', label: '削除', icon: Trash2 },
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
                        activeTab === tab.id 
                            ? (tab.id === 'delete' ? "border-red-500 text-red-600 bg-red-50/30" : "border-blue-500 text-blue-600 bg-blue-50/30") 
                            : "border-transparent text-gray-400 hover:text-gray-600"
                    )}>
                        <tab.icon size={14} />
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto">
                {activeTab === 'overview' && <OverviewTab container={container} pods={pods} onScaled={fetchData} />}

                {activeTab === 'networking' && (
                    <NetworkingTab
                        containerId={containerId}
                        container={container}
                        setContainer={setContainer}
                        customDomain={customDomain}
                        setCustomDomain={setCustomDomain}
                        customDomainEnabled={customDomainEnabled}
                        setCustomDomainEnabled={setCustomDomainEnabled}
                        fetchData={fetchData}
                    />
                )}

                {activeTab === 'volumes' && (
                    <VolumesTab
                        containerId={containerId}
                        volumes={volumes}
                        fetchVolumes={fetchVolumes}
                    />
                )}

                {activeTab === 'env-vars' && (
                    <EnvVarsTab
                        envVars={envVars}
                        setEnvVars={setEnvVars}
                        handleSaveEnvVars={handleSaveEnvVars}
                        isSavingEnv={isSavingEnv}
                    />
                )}

                {activeTab === 'build-logs' && (
                    <BuildLogsTab
                        buildJobs={buildJobs}
                        selectedBuildJobId={selectedBuildJobId}
                        setSelectedBuildJobId={setSelectedBuildJobId}
                        buildLogs={buildLogs}
                        loadingBuildLogs={loadingBuildLogs}
                    />
                )}

                {activeTab === 'exec-logs' && (
                    <ExecLogsTab
                        execLogs={execLogs}
                        connected={execLogConnected}
                    />
                )}

                {activeTab === 'builds' && (
                    <BuildHistoryTab
                        buildJobs={buildJobs}
                        onSelectJob={(jobId) => {
                            setSelectedBuildJobId(jobId);
                            setActiveTab('build-logs');
                        }}
                    />
                )}

                {activeTab === 'delete' && (
                    <DeleteTab
                        containerId={containerId}
                        containerName={container.name}
                        onClose={onClose}
                    />
                )}
            </div>
        </div>
    );
};
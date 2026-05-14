import React, { useState, useEffect } from 'react';
import { Activity, Globe, Trash2, ExternalLink, Loader2 } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { containerService } from '../../../services/containerService';

interface NetworkingTabProps {
    containerId: string;
    container: any;
    setContainer: (container: any) => void;
    customDomain: string;
    setCustomDomain: (domain: string) => void;
    customDomainEnabled: boolean;
    setCustomDomainEnabled: (enabled: boolean) => void;
    fetchData: () => void;
}

export const NetworkingTab: React.FC<NetworkingTabProps> = ({
    containerId,
    container,
    setContainer,
    customDomain,
    setCustomDomain,
    customDomainEnabled,
    setCustomDomainEnabled,
    fetchData
}) => {
    const svc = container?.service;

    // ポートはローカル state で管理する
    const [localPorts, setLocalPorts] = useState<any[]>(() => {
        try { return JSON.parse(svc?.ports || '[]'); } catch { return []; }
    });
    // ローカル編集があるかどうか (ポーリング更新の上書き防止に使う)
    const [portsDirty, setPortsDirty] = useState(false);

    // ポーリング更新が来たとき、未編集なら同期する
    useEffect(() => {
        if (portsDirty) return;
        try { setLocalPorts(JSON.parse(svc?.ports || '[]')); } catch { setLocalPorts([]); }
    }, [svc?.ports]);

    const isServicePending  = svc?.status === 'pending' && svc?.is_active === true;
    const isServiceDeleting = svc?.status === 'pending' && svc?.is_active === false;
    const isIngressPending  = container?.ingress?.status === 'pending';

    return (
        <div className="p-4 space-y-5">
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="px-3 py-2 bg-gray-50 border-b flex justify-between items-center">
                    <div className="flex items-center gap-2 text-[11px] font-bold text-gray-700">
                        <Activity size={14} className="text-blue-500" />
                        <span>内部ポート設定</span>
                        {isServicePending && (
                            <span className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-50 border border-amber-200 rounded text-[9px] text-amber-600 font-bold">
                                <Loader2 size={9} className="animate-spin" />
                                作成中
                            </span>
                        )}
                        {isServiceDeleting && (
                            <span className="flex items-center gap-1 px-1.5 py-0.5 bg-red-50 border border-red-200 rounded text-[9px] text-red-600 font-bold">
                                <Loader2 size={9} className="animate-spin" />
                                削除中
                            </span>
                        )}
                    </div>
                    <button
                        onClick={async () => {
                            const res = await containerService.updateService(containerId, {
                                is_active: !svc?.is_active,
                                ports: localPorts,
                            });
                            setContainer({ ...container, service: res.data.data });
                        }}
                        className={cn(
                            "w-8 h-4 rounded-full relative transition-colors",
                            svc?.is_active ? "bg-blue-500" : "bg-gray-200"
                        )}
                    >
                        <span className={cn(
                            "absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all",
                            svc?.is_active ? "right-0.5" : "left-0.5"
                        )} />
                    </button>
                </div>
                {svc?.is_active && (
                    <div className="p-3 space-y-3">
                        <div className="p-2 bg-gray-50 rounded text-[10px] font-mono text-gray-500 border border-gray-100">
                            {container.name}.ns-{container.project_id}.svc.cluster.local
                        </div>
                        <div className="space-y-2">
                            {svc?.external_ip && (
                                <div className="space-y-1">
                                    <p className="text-[12px] font-bold text-gray-400">LOAD BALANCER IP</p>
                                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-mono border border-blue-100">
                                        {svc.external_ip}
                                    </div>
                                </div>
                            )}
                            {localPorts.map((p: any, idx: number) => (
                                <div key={idx} className="flex items-center gap-2 p-2 border rounded-lg bg-white">
                                    <div className="flex-1">
                                        <p className="text-[10px] text-gray-400 font-bold uppercase">PORT(外から見た時)</p>
                                        <input
                                            type="number"
                                            value={p.port}
                                            onChange={e => {
                                                const next = [...localPorts];
                                                next[idx] = { ...next[idx], port: parseInt(e.target.value) };
                                                setLocalPorts(next);
                                                setPortsDirty(true);
                                            }}
                                            className="w-full text-xs font-mono border-none p-0 focus:ring-0"
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[10px] text-gray-400 font-bold uppercase">TARGET(待ち受けているポート)</p>
                                        <input
                                            type="number"
                                            value={p.target}
                                            onChange={e => {
                                                const next = [...localPorts];
                                                next[idx] = { ...next[idx], target: parseInt(e.target.value) };
                                                setLocalPorts(next);
                                                setPortsDirty(true);
                                            }}
                                            className="w-full text-xs font-mono border-none p-0 focus:ring-0"
                                        />
                                    </div>
                                    <button
                                        onClick={() => { setLocalPorts(localPorts.filter((_: any, i: number) => i !== idx)); setPortsDirty(true); }}
                                        className="text-gray-300 hover:text-red-500"
                                    >
                                        <Trash2 size={12} />
                                    </button>
                                </div>
                            ))}
                            <button
                                onClick={() => { setLocalPorts([...localPorts, { name: 'http', protocol: 'TCP', port: 80, target: 80 }]); setPortsDirty(true); }}
                                className="w-full py-1 border border-dashed rounded text-[10px] text-gray-400 font-bold hover:bg-gray-50"
                            >
                                + 追加
                            </button>
                            <button
                                onClick={async () => {
                                    const res = await containerService.updateService(containerId, {
                                        is_active: true,
                                        ports: localPorts,
                                    });
                                    setContainer({ ...container, service: res.data.data });
                                    setPortsDirty(false);
                                }}
                                className="w-full py-2 bg-gray-900 text-white rounded-lg text-[10px] font-bold"
                            >
                                適用
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div className="px-3 py-2 bg-gray-50 border-b flex justify-between items-center">
                    <div className="flex items-center gap-2 text-[11px] font-bold text-gray-700">
                        <Globe size={14} className="text-green-500" />
                        <span>外部公開 (Ingress)</span>
                        {isIngressPending && (
                            <span className="flex items-center gap-1 px-1.5 py-0.5 bg-amber-50 border border-amber-200 rounded text-[9px] text-amber-600 font-bold">
                                <Loader2 size={9} className="animate-spin" />
                                作成中
                            </span>
                        )}
                    </div>
                    <span className="text-[12px] font-bold text-gray-400">
                        {container.ingress ? (isIngressPending ? 'PENDING' : 'ACTIVE') : 'INACTIVE'}
                    </span>
                </div>
                <div className="p-3 space-y-4">
                    {container.ingress ? (
                        <>
                            <div className="space-y-1">
                                <p className="text-[12px] font-bold text-gray-400">DEFAULT DOMAIN</p>
                                <div className="flex items-center justify-between p-2 bg-gray-50 border rounded-lg">
                                    <span className="text-[10px] font-mono truncate">{container.ingress.subdomain}</span>
                                    <a href={`https://${container.ingress.subdomain}`} target="_blank" rel="noreferrer">
                                        <ExternalLink size={12} className="text-blue-500" />
                                    </a>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <p className="text-[12px] font-bold text-gray-400">CUSTOM DOMAIN</p>
                                <div className="flex items-center gap-2">
                                    <input
                                        value={customDomain}
                                        onChange={e => setCustomDomain(e.target.value)}
                                        placeholder="example.com"
                                        className="flex-1 px-2.5 py-1.5 text-xs border rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
                                    />
                                    <button
                                        onClick={() => setCustomDomainEnabled(!customDomainEnabled)}
                                        className={cn(
                                            "w-8 h-4 rounded-full relative transition-colors",
                                            customDomainEnabled ? "bg-blue-500" : "bg-gray-200"
                                        )}
                                    >
                                        <span className={cn(
                                            "absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all",
                                            customDomainEnabled ? "right-0.5" : "left-0.5"
                                        )} />
                                    </button>
                                </div>
                            </div>
                            <div className="flex gap-2 pt-1">
                                <button
                                    onClick={() => containerService.updateIngress(containerId, {
                                        http_port: container.ingress.http_port,
                                        custom_domain: customDomain,
                                        custom_domain_enabled: customDomainEnabled,
                                    }).then(fetchData)}
                                    className="flex-1 py-1.5 bg-blue-500 text-white rounded-lg text-[10px] font-bold"
                                >
                                    保存
                                </button>
                                <button
                                    onClick={() => confirm('削除しますか？') && containerService.deleteIngress(containerId).then(fetchData)}
                                    className="px-3 py-1.5 border border-red-100 text-red-500 rounded-lg text-[10px] font-bold"
                                >
                                    停止
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="space-y-3">
                            <div className="space-y-1">
                                <p className="text-[12px] font-bold text-gray-400">公開ポート</p>
                                <select id="ing-port" className="w-full p-2 text-xs border rounded-lg">
                                    {localPorts.map((p: any) => (
                                        <option key={p.port} value={p.port}>Port {p.port}</option>
                                    ))}
                                </select>
                            </div>
                            <button
                                onClick={() => {
                                    const p = (document.getElementById('ing-port') as HTMLSelectElement).value;
                                    containerService.createIngress(containerId, {
                                        http_port: parseInt(p),
                                        custom_domain: customDomain,
                                        custom_domain_enabled: customDomainEnabled,
                                    }).then(fetchData);
                                }}
                                className="w-full py-2 bg-blue-500 text-white rounded-lg text-[10px] font-bold"
                            >
                                外部公開を有効化
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Panel as ResizablePanel, Group, Separator } from 'react-resizable-panels';
import { Plus, ArrowLeft, Loader2, Box } from 'lucide-react';

import { containerService, type CreateContainerFiles } from '../services/containerService';
import { ContainerSidePanel } from '../components/project/ContainerSidePanel';
import { DeployModal } from '../components/project/DeployModal';
import { TreeLayout } from '../components/TreeLayout';

const DEFAULT_FORM: CreateContainerFiles = {
    name: '', repository_url: '', branch: '', directory: '',
};

const ProjectDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();

    const [project, setProject] = useState<any>(null);
    const [containers, setContainers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [creating, setCreating] = useState(false);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [selectedTab, setSelectedTab] = useState<any>(undefined);
    const [formData, setFormData] = useState<CreateContainerFiles>(DEFAULT_FORM);

    const fetchData = useCallback(async (silent = false) => {
        if (!id) return;
        try {
            if (!silent) setLoading(true);
            const res = await containerService.getProject(id);
            setProject(res.data.data);
            setContainers(res.data.data.containers ?? []);
        } catch (err) {
            console.error('Failed to fetch project:', err);
        } finally {
            if (!silent) setLoading(false);
        }
    }, [id]);

    useEffect(() => { fetchData(); }, [fetchData]);
    useEffect(() => {
        const t = setInterval(() => fetchData(true), 3000);
        return () => clearInterval(t);
    }, [fetchData]);

    const handleContainerSelect = useCallback((cid: string, tab?: any) => {
        if (selectedId === cid && !tab) {
            setSelectedId(null);
            setSelectedTab(undefined);
        } else {
            setSelectedId(cid);
            setSelectedTab(tab);
        }
    }, [selectedId]);

    const handleCreateContainer = async (evt: React.FormEvent) => {
        evt.preventDefault();
        if (!id) return;
        setCreating(true);
        try {
            await containerService.createContainer(id, formData);
            setShowModal(false);
            setFormData(DEFAULT_FORM);
            fetchData();
        } catch {
            alert('デプロイの開始に失敗しました。');
        } finally {
            setCreating(false);
        }
    };

    if (loading && !project) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-4">
                <Loader2 className="w-9 h-9 text-blue-500 animate-spin" />
                <p className="text-sm text-gray-400 font-mono">読み込み中…</p>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-50px)] flex flex-col gap-4 animate-in fade-in duration-400">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
                <div className="flex flex-col gap-1">
                    <Link to="/projects" className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-500 transition-colors w-fit">
                        <ArrowLeft size={13} /> プロジェクト一覧
                    </Link>
                    <div className="flex items-center gap-3">
                        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">{project?.name}</h2>
                        <span className="px-2 py-0.5 bg-gray-100 text-gray-400 text-[10px] font-mono rounded-md">
                            {project?.id?.slice(0, 8)}
                        </span>
                    </div>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 text-white text-sm font-semibold rounded-xl hover:bg-blue-600 hover:shadow-lg hover:-translate-y-0.5 transition-all active:scale-95"
                >
                    <Plus size={16} /> コンテナを追加
                </button>
            </div>

            <div className="flex-1 overflow-hidden rounded-2xl border border-gray-100 shadow-sm bg-white">
                <Group className="h-full">
                    <ResizablePanel defaultSize={selectedId ? 70 : 100} minSize={30} className="h-full">
                        {containers.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full gap-3 bg-gray-50 text-gray-300">
                                <Box size={36} strokeWidth={1} />
                                <p className="text-sm font-mono">コンテナがありません</p>
                            </div>
                        ) : (
                            <TreeLayout
                                containers={containers}
                                selectedContainerId={selectedId}
                                onContainerSelect={handleContainerSelect}
                            />
                        )}
                    </ResizablePanel>

                    {selectedId && (
                        <>
                            <Separator className="w-1 bg-gray-100 hover:bg-blue-500/20 active:bg-blue-500/30 transition-colors cursor-col-resize" />
                            <ResizablePanel
                                defaultSize={30}
                                minSize={20}
                                maxSize={500}
                                className="h-full bg-white"
                            >
                                <div className="h-full border-l border-gray-50 overflow-hidden w-full">
                                    <ContainerSidePanel
                                        containerId={selectedId}
                                        containerData={containers.find(c => c.id === selectedId) ?? null}
                                        initialTab={selectedTab}
                                        onClose={() => {
                                            setSelectedId(null);
                                            setSelectedTab(undefined);
                                        }}
                                    />
                                </div>
                            </ResizablePanel>
                        </>
                    )}
                </Group>
            </div>

            {showModal && (
                <DeployModal
                    formData={formData}
                    setFormData={setFormData}
                    onSubmit={handleCreateContainer}
                    onClose={() => setShowModal(false)}
                    creating={creating}
                />
            )}
        </div>
    );
};

export default ProjectDetail;

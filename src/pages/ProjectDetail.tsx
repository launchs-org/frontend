import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ReactFlow, Background, Controls, Panel, type Node, type Edge } from '@xyflow/react';;
import '@xyflow/react/dist/style.css';

import { Plus, ArrowLeft, Loader2 } from 'lucide-react';
import { Group, Panel as ResizablePanel,Separator } from "react-resizable-panels";

import { containerService, type CreateContainerFiles } from '../services/containerService';

// コンポーネントのインポート
import { ProjectNode, ContainerNode } from '../components/nodes/CustomNodes';
import { ContainerSidePanel } from '../components/project/ContainerSidePanel';
import { DeployModal } from '../components/project/DeployModal';

const nodeTypes = { projectNode: ProjectNode, containerNode: ContainerNode };

const ProjectDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();

    const [project, setProject] = useState<any>(null);
    const [containers, setContainers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [creating, setCreating] = useState(false);
    const [selectedContainerId, setSelectedContainerId] = useState<string | null>(null);

    const [formData, setFormData] = useState<CreateContainerFiles>({
        name: '', repository_url: '', branch: 'main', directory: '.', replicas: 1
    });

    // データの取得
    const fetchData = useCallback(async (silent = false) => {
        if (!id) return;
        try {
            if (!silent) setLoading(true);
            const res = await containerService.getProject(id);
            setProject(res.data.data);
            setContainers(res.data.data.containers || []);
        } catch (err) {
            console.error('Failed to fetch project:', err);
        } finally {
            if (!silent) setLoading(false);
        }
    }, [id]);

    useEffect(() => { fetchData(); }, [fetchData]);

    // ポーリング
    useEffect(() => {
        const interval = setInterval(() => fetchData(true), 1500);
        return () => clearInterval(interval);
    }, [fetchData]);

    // ReactFlow 用のデータ変換
    const { nodes, edges } = useMemo(() => {
        if (!project) return { nodes: [], edges: [] };

        const containerNodes: Node[] = containers.map((container, index) => ({
            id: container.id,
            type: 'containerNode',
            data: {
                id: container.id,
                name: container.name,
                status: container.status,
                repo: container.repository_url,
                branch: container.branch,
                version: container.version,
                isSelected: container.id === selectedContainerId,
                onSelect: (cid: string) => setSelectedContainerId(prev => prev === cid ? null : cid),
            },
            position: { x: 450, y: index * 220 - ((containers.length - 1) * 110) + 100 },
        }));

        const edges: Edge[] = containers.map((container) => ({
            id: `e-project-${container.id}`,
            source: 'project-root',
            target: container.id,
            animated: ['Building', 'Deploying', 'Queued'].includes(container.status),
            style: {
                stroke: container.id === selectedContainerId ? '#4285f4' : container.status === 'Running' ? '#34a853' : '#dadce0',
                strokeWidth: container.id === selectedContainerId ? 2.5 : 2,
            },
        }));

        return { nodes: [...containerNodes], edges };
    }, [project, containers, selectedContainerId]);

    const handleCreateContainer = async (evt: React.FormEvent) => {
        evt.preventDefault();
        if (!id) return;
        setCreating(true);
        try {
            await containerService.createContainer(id, formData);
            setShowModal(false);
            setFormData({ name: '', repository_url: '', branch: 'main', directory: '.', replicas: 1 });
            fetchData();
        } catch {
            alert('デプロイの開始に失敗しました。');
        } finally {
            setCreating(false);
        }
    };

    if (loading && !project) {
        return (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
                <p className="text-sm text-gray-500 font-medium">読み込み中...</p>
            </div>
        );
    }

    return (
        <div className="h-[calc(100vh-50px)] flex flex-col space-y-4 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-2">
                <div className="space-y-1">
                    <Link to="/projects" className="flex items-center text-xs text-gray-500 hover:text-blue-500 transition-colors mb-2 w-fit">
                        <ArrowLeft size={14} className="mr-1" /> プロジェクト一覧
                    </Link>
                    <div className="flex items-center space-x-3">
                        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">{project?.name}</h2>
                        <span className="px-2 py-1 bg-gray-100 text-gray-500 text-[10px] font-mono rounded">
                            {project?.id?.slice(0, 8)}
                        </span>
                    </div>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center justify-center space-x-2 px-6 py-3 bg-blue-500 text-white text-sm font-bold rounded-xl hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95"
                >
                    <Plus size={18} />
                    <span>コンテナを追加</span>
                </button>
            </div>

            {/* Main Content Area (Resizable) */}
            <div className="flex-1 overflow-hidden rounded-3xl border border-gray-100 shadow-inner bg-white h-full">
                <Group>
                    {/* 左側: ReactFlow エリア */}
                    <ResizablePanel>
                        <div className="h-full w-full relative">
                            <ReactFlow
                                nodes={nodes}
                                edges={edges}
                                nodeTypes={nodeTypes}
                                fitView
                                maxZoom={1.5}
                                minZoom={0.5}
                            >
                                <Background color="#f1f3f4" gap={25} size={1} />
                                <Controls className="!bg-white !shadow-lg !border-none !rounded-lg" />
                                <Panel position="top-right" className="bg-white/90 backdrop-blur-md p-3 rounded-xl border border-gray-100 shadow-sm text-[10px] text-gray-500 font-medium">
                                    <div className="flex items-center space-x-2">
                                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                                        <span>リアルタイム同期中</span>
                                    </div>
                                </Panel>
                            </ReactFlow>
                        </div>
                    </ResizablePanel>

                    {/* 区切り線 */}
                                       {/* 中央: リサイズハンドル (境界線) */}
                    {selectedContainerId && (
                        <Separator className="w-3 transition-colors hover:bg-blue-500/30 active:bg-blue-500/50 relative">
                            {/* 見た目上の線 */}
                            <div className="absolute inset-y-0 left-1/2 w-px bg-gray-100" />
                        </Separator>
                    )}

                     {/* 右側: サイドパネル */}
                    {selectedContainerId && (
                        <ResizablePanel 
                            className="bg-white"
                        >
                            <div className="h-full border-l border-gray-50 overflow-hidden">
                                <ContainerSidePanel
                                    containerId={selectedContainerId}
                                    onClose={() => setSelectedContainerId(null)}
                                />
                            </div>
                        </ResizablePanel>
                    )}
                </Group>
            </div>

            {/* Deploy Modal Component */}
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
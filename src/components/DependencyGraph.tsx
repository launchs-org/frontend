import React, { useCallback, useEffect } from 'react';
import ReactFlow, {
  type Node,
  type Edge,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  MarkerType,
} from 'reactflow';
import ContainerNode from './ContainerNode';
import { Database } from 'lucide-react';

interface Container {
  id: string;
  name: string;
  repository_url: string;
  branch: string;
  status: string;
  replicas: number;
}

interface DependencyGraphProps {
  containers: Container[];
  selectedContainerId: string | null;
  onSelectContainer: (id: string) => void;
}

const nodeTypes = {
  containerNode: ContainerNode,
};

const DependencyGraph: React.FC<DependencyGraphProps> = ({
  containers,
  selectedContainerId,
  onSelectContainer,
}) => {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  // ノードとエッジを生成
  useEffect(() => {
    if (!containers || containers.length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }

    // ノードを作成
    const newNodes: Node[] = containers.map((container, index) => {
      // グリッド状に配置（3列）
      const col = index % 3;
      const row = Math.floor(index / 3);
      const x = col * 350;
      const y = row * 300;

      return {
        id: container.id,
        data: {
          label: container.name,
          repository: container.repository_url,
          branch: container.branch,
          status: container.status,
        },
        position: { x, y },
        type: 'containerNode',
        selected: container.id === selectedContainerId,
      };
    });

    // エッジを作成（簡略版：最初のコンテナから他のコンテナへ）
    const newEdges: Edge[] = [];
    if (containers.length > 1) {
      for (let i = 1; i < containers.length; i++) {
        newEdges.push({
          id: `${containers[0].id}->${containers[i].id}`,
          source: containers[0].id,
          target: containers[i].id,
          markerEnd: { type: MarkerType.ArrowClosed },
          style: {
            stroke: '#404556',
            strokeWidth: 2,
          },
          animated: false,
        });
      }
    }

    setNodes(newNodes);
    setEdges(newEdges);
  }, [containers, selectedContainerId, setNodes, setEdges]);

  const handleNodeClick = useCallback((_event: any, node: Node) => {
    onSelectContainer(node.id);
  }, [onSelectContainer]);

  if (!containers || containers.length === 0) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#1a1b2e] to-[#252742]">
        <Database size={48} className="text-[#404556] mb-4" />
        <p className="text-[#9ca3af]">コンテナを追加するとグラフが表示されます</p>
      </div>
    );
  }

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={handleNodeClick}
      nodeTypes={nodeTypes}
      fitView
    >
      <Background color="#404556" gap={16} />
      <Controls />
    </ReactFlow>
  );
};

export default DependencyGraph;

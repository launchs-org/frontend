import React from 'react';
import { Handle, Position } from 'reactflow';
import { Database, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface ContainerNodeProps {
  data: {
    label: string;
    repository: string;
    branch: string;
    status: string;
  };
  isConnectable: boolean;
  selected: boolean;
}

const ContainerNode: React.FC<ContainerNodeProps> = ({
  data,
  isConnectable,
  selected,
}) => {
  const isRunning = data.status === 'Running';

  return (
    <div
      className={cn(
        'px-4 py-3 rounded-lg border-2 transition-all',
        selected
          ? 'bg-[#6366f1]/20 border-[#6366f1] shadow-lg shadow-[#6366f1]/20'
          : 'bg-[#252742] border-[#404556] hover:border-[#505668]'
      )}
    >
      <Handle type="target" position={Position.Top} isConnectable={isConnectable} />

      <div className="w-48 space-y-2">
        {/* Header with icon and status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={cn(
              'p-2 rounded-lg',
              selected ? 'bg-[#6366f1] text-white' : 'bg-[#3a3d52] text-[#9ca3af]'
            )}>
              <Database size={16} />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-[#e5e7eb] truncate">
                {data.label}
              </h3>
            </div>
          </div>

          {/* Status indicator */}
          <div className={cn(
            'w-2.5 h-2.5 rounded-full',
            isRunning ? 'bg-[#10b981]' : 'bg-[#f59e0b]'
          )} />
        </div>

        {/* Details */}
        <div className="space-y-1 text-xs text-[#9ca3af]">
          <p className="truncate font-mono text-[11px]">{data.repository.split('/').pop()}</p>
          <p className="flex items-center space-x-1">
            <span>Branch:</span>
            <span className="text-[#6366f1]">{data.branch}</span>
          </p>
        </div>

        {/* Status label */}
        <div className="flex items-center space-x-1 text-xs mt-2">
          <CheckCircle2 size={12} className={isRunning ? 'text-[#10b981]' : 'text-[#f59e0b]'} />
          <span className={isRunning ? 'text-[#10b981]' : 'text-[#f59e0b]'}>
            {isRunning ? 'Deployed' : data.status}
          </span>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} />
    </div>
  );
};

export default ContainerNode;

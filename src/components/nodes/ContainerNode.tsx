import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Database, Folder, GitBranch, RefreshCw, ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils';

interface Props {
    data: {
        id: string;
        name: string;
        status?: string;
        repo?: string;
        branch?: string;
        version?: string;
        replicas?: number;
        isSelected?: boolean;
        onSelect?: (id: string) => void;
    };
}

export const ContainerNode: React.FC<Props> = ({ data }) => {
    const isRunning = data.status === 'Running';
    const isTransitional = ['Building', 'Deploying', 'Queued'].includes(data.status || '');
    const isSelected = data.isSelected;

    return (
        <div
            className={cn(
                "px-4 py-4 shadow-md rounded-xl bg-white border-2 transition-all hover:shadow-2xl w-[260px] cursor-pointer",
                isSelected
                    ? "border-blue-500 ring-4 ring-blue-500/20 shadow-xl"
                    : isRunning ? "border-green-100" : isTransitional ? "border-blue-100" : "border-gray-100"
            )}
            onClick={() => data.onSelect?.(data.id)}
        >
            <Handle type="target" position={Position.Left}  className="w-2.5 h-2.5 bg-gray-300 border-2 border-white !opacity-100" />
            <Handle type="source" position={Position.Right} className="w-2.5 h-2.5 bg-gray-300 border-2 border-white !opacity-100" />

            <div className="flex justify-between items-start mb-4">
                <div className={cn(
                    "p-2 rounded-lg",
                    isRunning ? "bg-green-50 text-green-600" : isTransitional ? "bg-blue-50 text-blue-600" : "bg-gray-50 text-gray-400"
                )}>
                    <Database size={20} />
                </div>
                <div className={cn(
                    "flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                    isRunning ? "bg-green-100 text-green-700" : isTransitional ? "bg-blue-100 text-blue-700 animate-pulse" : "bg-gray-100 text-gray-500"
                )}>
                    {isTransitional && <RefreshCw size={10} className="animate-spin" />}
                    <span>{data.status || 'Unknown'}</span>
                </div>
            </div>

            <div className="space-y-1 mb-4">
                <div className="flex items-center justify-between">
                    <div className="text-sm font-bold text-gray-900 truncate">{data.name}</div>
                    <div className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md font-bold">
                        {data.replicas || 1} pods
                    </div>
                </div>
                <div className="flex items-center text-[10px] text-gray-400 font-mono bg-gray-50 p-1 rounded">
                    <Folder size={10} className="mr-1 shrink-0" />
                    <span className="truncate">{data.repo}</span>
                </div>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-gray-50 text-[10px]">
                <div className="flex items-center space-x-3 text-gray-500">
                    <div className="flex items-center space-x-1">
                        <GitBranch size={12} />
                        <span className="font-medium">{data.branch || 'main'}</span>
                    </div>
                    <span className="text-gray-200">|</span>
                    <div className="font-medium">v{(data.version || '').slice(0, 7) || '---'}</div>
                </div>
                <ChevronRight size={14} className={cn("transition-transform", isSelected ? "rotate-90 text-blue-500" : "text-gray-300")} />
            </div>
        </div>
    );
};

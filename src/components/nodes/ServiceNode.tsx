import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Server } from 'lucide-react';

interface Props {
    data: { type?: string; ports?: any; onSelect?: () => void };
}

export const ServiceNode: React.FC<Props> = ({ data }) => {
    let ports = [];
    try {
        if (data.ports) {
            ports = typeof data.ports === 'string' ? JSON.parse(data.ports) : data.ports;
        }
    } catch (e) {
        console.error("Failed to parse ports", e);
    }

    return (
        <div 
            className="px-4 py-3 shadow-md rounded-xl bg-white border border-blue-100 min-w-[180px] h-[80px] cursor-pointer hover:border-blue-300 transition-colors flex flex-col justify-center"
            onClick={() => data.onSelect?.()}
        >
            <div className="flex items-center space-x-3 shrink-0">
                <div className="p-1.5 bg-blue-50 text-blue-500 rounded-lg">
                    <Server size={14} />
                </div>
                <div className="min-w-0">
                    <div className="text-[8px] uppercase tracking-wider text-blue-400 font-bold">Service</div>
                    <div className="text-[10px] font-bold text-gray-700 truncate">{data.type}</div>
                </div>
            </div>
            
            <div className="mt-1.5 flex items-center gap-2 overflow-x-auto scrollbar-hide">
                <div className="text-[8px] font-bold text-gray-400 shrink-0">公開ポート</div>
                {ports.length > 0 ? (
                    <div className="flex gap-1">
                        {ports.map((p: any, i: number) => (
                            <div key={i} className="text-[8px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-mono border border-blue-100/50 whitespace-nowrap">
                                {p.port}:{p.target}
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-[8px] text-gray-300 italic">No ports</div>
                )}
            </div>
            
            <Handle type="target" position={Position.Left}  className="w-2 h-2 bg-blue-400 border-2 border-white !opacity-100" />
            <Handle type="source" position={Position.Right} className="w-2 h-2 bg-blue-400 border-2 border-white !opacity-100" />
        </div>
    );
};

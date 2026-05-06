import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Server } from 'lucide-react';

interface Props {
    data: { type?: string; ports?: any };
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
        <div className="px-4 py-3 shadow-md rounded-xl bg-white border border-blue-100 min-w-[180px]">
            <div className="flex items-center space-x-3 mb-2">
                <div className="p-2 bg-blue-50 text-blue-500 rounded-lg">
                    <Server size={18} />
                </div>
                <div>
                    <div className="text-[9px] uppercase tracking-wider text-blue-400 font-bold">Service</div>
                    <div className="text-xs font-bold text-gray-700 truncate">{data.type}</div>
                </div>
            </div>
            
            {ports.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2 border-t border-blue-50/50 pt-2">
                    {ports.map((p: any, i: number) => (
                        <div key={i} className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-mono border border-blue-100/50">
                            {p.port}:{p.target}
                        </div>
                    ))}
                </div>
            )}
            
            <Handle type="target" position={Position.Left}  className="w-2 h-2 bg-blue-400 border-2 border-white !opacity-100" />
            <Handle type="source" position={Position.Right} className="w-2 h-2 bg-blue-400 border-2 border-white !opacity-100" />
        </div>
    );
};

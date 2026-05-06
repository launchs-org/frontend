import { Handle, Position } from '@xyflow/react';
import { RefreshCw } from 'lucide-react';

export const IngressNode = () => (
    <div className="px-4 py-3 shadow-md rounded-xl bg-white border border-purple-100 min-w-[140px]">
        <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-50 text-purple-500 rounded-lg">
                <RefreshCw size={18} />
            </div>
            <div>
                <div className="text-[9px] uppercase tracking-wider text-purple-400 font-bold">Ingress</div>
                <div className="text-[10px] font-bold text-gray-700">Traefik</div>
            </div>
        </div>
        <Handle type="target" position={Position.Left}  className="w-2 h-2 bg-purple-400 border-2 border-white !opacity-100" />
        <Handle type="source" position={Position.Right} className="w-2 h-2 bg-purple-400 border-2 border-white !opacity-100" />
    </div>
);

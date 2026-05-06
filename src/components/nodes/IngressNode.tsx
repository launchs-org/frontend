import { Handle, Position } from '@xyflow/react';
import { RefreshCw } from 'lucide-react';

interface Props {
    data: { subdomain?: string; onSelect?: () => void };
}

export const IngressNode: React.FC<Props> = ({ data }) => (
    <div 
        className="px-4 py-3 shadow-md rounded-xl bg-white border border-purple-100 min-w-[140px] h-[80px] cursor-pointer hover:border-purple-300 transition-colors flex items-center"
        onClick={() => data.onSelect?.()}
    >
        <div className="flex items-center space-x-3 w-full">
            <div className="p-2 bg-purple-50 text-purple-500 rounded-lg">
                <RefreshCw size={18} />
            </div>
            <div className="flex-1 min-w-0">
                <div className="text-[9px] uppercase tracking-wider text-purple-400 font-bold">Ingress</div>
                <div className="text-[10px] font-bold text-gray-700 truncate flex items-center gap-1">
                    {data.subdomain ? (
                        <a 
                            href={`https://${data.subdomain}`} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="hover:text-blue-500 underline decoration-purple-200"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {data.subdomain.slice(0, 12)}{data.subdomain.length > 12 ? '...' : ''}
                        </a>
                    ) : (
                        'Traefik'
                    )}
                </div>
            </div>
        </div>
        <Handle type="target" position={Position.Left}  className="w-2 h-2 bg-purple-400 border-2 border-white !opacity-100" />
        <Handle type="source" position={Position.Right} className="w-2 h-2 bg-purple-400 border-2 border-white !opacity-100" />
    </div>
);

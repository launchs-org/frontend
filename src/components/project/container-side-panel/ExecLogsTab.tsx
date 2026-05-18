import React from 'react';
import { Loader2 } from 'lucide-react';

interface ExecLogsTabProps {
    execLogs: any[];
    execLogEndRef: React.RefObject<HTMLDivElement | null>;
    connected: boolean;
}

export const ExecLogsTab: React.FC<ExecLogsTabProps> = ({ execLogs, execLogEndRef, connected }) => {
    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 bg-[#1a1a1a] p-3 overflow-y-auto font-mono text-[10px] leading-relaxed h-full relative">
                <div className="sticky top-0 right-0 flex justify-end pb-2">
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-black/50 backdrop-blur-sm rounded border border-white/10">
                        {connected ? (
                            <>
                                <span className="w-1 h-1 bg-yellow-400 rounded-full animate-pulse" />
                                <span className="text-[8px] text-gray-400">ポーリング中 (3秒)</span>
                            </>
                        ) : (
                            <>
                                <span className="w-1 h-1 bg-gray-500 rounded-full" />
                                <span className="text-[8px] text-gray-500">ログ表示中</span>
                            </>
                        )}
                    </div>
                </div>

                {execLogs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-2 text-gray-600">
                        <Loader2 size={16} className="animate-spin" />
                        <span className="text-[10px]">ログを待機中...</span>
                    </div>
                ) : (
                    execLogs.map((l, i) => (
                        <div key={i} className="flex gap-3 text-gray-400 group">
                            <span className="w-6 text-right text-gray-600 select-none group-hover:text-gray-500 shrink-0">{i + 1}</span>
                            <span className="text-gray-200 break-all">{l.message}</span>
                        </div>
                    ))
                )}
                <div ref={execLogEndRef} />
            </div>
        </div>
    );
};

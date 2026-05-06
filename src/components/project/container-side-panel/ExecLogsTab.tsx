import React from 'react';

interface ExecLogsTabProps {
    execLogs: any[];
    execLogEndRef: React.RefObject<HTMLDivElement | null>;
}

export const ExecLogsTab: React.FC<ExecLogsTabProps> = ({ execLogs, execLogEndRef }) => {
    return (
        <div className="flex flex-col h-full">
            <div className="flex-1 bg-[#1a1a1a] p-3 overflow-y-auto font-mono text-[10px] leading-relaxed h-full">
                {execLogs.map((l, i) => (
                    <div key={i} className="flex gap-3 text-gray-400 group">
                        <span className="w-6 text-right text-gray-600 select-none group-hover:text-gray-500">{i + 1}</span>
                        <span className="text-gray-200 break-all">{l.message}</span>
                    </div>
                ))}
                <div ref={execLogEndRef} />
            </div>
        </div>
    );
};

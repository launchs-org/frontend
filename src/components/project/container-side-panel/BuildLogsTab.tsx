import React from 'react';

interface BuildLogsTabProps {
    buildJobs: any[];
    selectedBuildJobId: string | null;
    setSelectedBuildJobId: (id: string) => void;
    buildLogs: string[];
    loadingBuildLogs: boolean;
    buildLogEndRef: React.RefObject<HTMLDivElement | null>;
}

export const BuildLogsTab: React.FC<BuildLogsTabProps> = ({
    buildJobs,
    selectedBuildJobId,
    setSelectedBuildJobId,
    buildLogs,
    loadingBuildLogs,
    buildLogEndRef
}) => {
    const selectedJob = buildJobs.find(j => j.id === selectedBuildJobId);
    const isActive = selectedJob && (selectedJob.status === 'Queued' || selectedJob.status === 'Running');

    return (
        <div className="flex flex-col h-full">
            <div className="p-2 border-b bg-gray-50/50 space-y-1">
                <p className="text-[9px] font-bold text-gray-400 ml-1 uppercase">ジョブを選択</p>
                <select
                    value={selectedBuildJobId || ''}
                    onChange={e => setSelectedBuildJobId(e.target.value)}
                    className="w-full p-1.5 text-[10px] font-bold border rounded-lg bg-white"
                >
                    {buildJobs.length === 0 ? <option>ジョブがありません</option> : buildJobs.map(job => (
                        <option key={job.id} value={job.id}>
                            Job: {job.id.slice(0, 8)} ({job.status})
                        </option>
                    ))}
                </select>
            </div>
            <div className="flex-1 bg-[#1a1a1a] p-3 overflow-y-auto font-mono text-[10px] leading-relaxed h-full relative">
                <div className="sticky top-0 right-0 flex justify-end pb-2">
                    <div className="flex items-center gap-1.5 px-2 py-0.5 bg-black/50 backdrop-blur-sm rounded border border-white/10">
                        <span className={`w-1 h-1 rounded-full ${isActive ? 'bg-yellow-400 animate-pulse' : 'bg-gray-500'}`} />
                        <span className="text-[8px] text-gray-400">
                            {isActive ? 'ポーリング中 (3秒ごと)' : 'ログ表示中'}
                        </span>
                    </div>
                </div>
                {buildLogs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-32 text-gray-500 text-[10px]">
                        {loadingBuildLogs ? '読み込み中...' : 'ログがありません'}
                    </div>
                ) : (
                    buildLogs.map((line, i) => (
                        <div key={i} className="flex gap-3 text-gray-400 group">
                            <span className="w-6 text-right text-gray-600 select-none group-hover:text-gray-500">{i + 1}</span>
                            <span className="text-gray-200 break-all">{line}</span>
                        </div>
                    ))
                )}
                <div ref={buildLogEndRef} />
            </div>
        </div>
    );
};

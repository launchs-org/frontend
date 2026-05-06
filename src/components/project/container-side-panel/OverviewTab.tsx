import React from 'react';

interface OverviewTabProps {
    container: any;
}

export const OverviewTab: React.FC<OverviewTabProps> = ({ container }) => {
    return (
        <div className="p-4 space-y-4">
            <div className="space-y-3 bg-gray-50/50 p-3 rounded-xl border border-gray-100">
                {[
                    { label: 'リポジトリ', value: container.repository_url },
                    { label: 'ブランチ', value: container.branch },
                    { label: 'パス', value: container.directory || '/' },
                    { label: 'レプリカ', value: container.replicas },
                ].map(item => (
                    <div key={item.label} className="flex justify-between items-start gap-4 text-[11px]">
                        <span className="text-gray-400 font-medium shrink-0">{item.label}</span>
                        <span className="text-gray-700 font-mono text-right break-all">{item.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

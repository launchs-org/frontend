import React, { useState } from 'react';
import { Settings, GitBranch, Database, RotateCcw } from 'lucide-react';
import { cn } from '../lib/utils';

interface Container {
  id: string;
  name: string;
  repository_url: string;
  branch: string;
  directory: string;
  replicas: number;
  status: string;
}

interface ContainerConfigTabsProps {
  container: Container | null;
}

type TabType = 'general' | 'deployment' | 'volumes' | 'advanced';

const ContainerConfigTabs: React.FC<ContainerConfigTabsProps> = ({ container }) => {
  const [activeTab, setActiveTab] = useState<TabType>('general');

  if (!container) {
    return (
      <div className="h-full flex items-center justify-center text-[#9ca3af]">
        コンテナを選択してください
      </div>
    );
  }

  const tabs = [
    { id: 'general', name: '基本情報', icon: Settings },
    { id: 'deployment', name: 'デプロイ', icon: Database },
    { id: 'volumes', name: 'ボリューム', icon: RotateCcw },
    { id: 'advanced', name: '詳細設定', icon: GitBranch },
  ] as const;

  return (
    <div className="h-full flex flex-col">
      {/* Tab Navigation */}
      <div className="flex border-b border-[#404556] overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={cn(
                "flex items-center space-x-2 px-4 py-3 text-sm font-medium transition-colors border-b-2 whitespace-nowrap",
                activeTab === tab.id
                  ? "border-[#6366f1] text-[#6366f1]"
                  : "border-transparent text-[#9ca3af] hover:text-[#e5e7eb]"
              )}
            >
              <Icon size={16} />
              <span>{tab.name}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === 'general' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#9ca3af] uppercase mb-2">
                コンテナ名
              </label>
              <div className="text-[#e5e7eb] bg-[#1a1b2e] px-3 py-2 rounded-lg border border-[#404556]">
                {container.name}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#9ca3af] uppercase mb-2">
                リポジトリ
              </label>
              <div className="text-[#e5e7eb] bg-[#1a1b2e] px-3 py-2 rounded-lg border border-[#404556] text-xs font-mono truncate">
                {container.repository_url}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#9ca3af] uppercase mb-2">
                ステータス
              </label>
              <div className="flex items-center space-x-2">
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  container.status === 'Running' ? 'bg-[#10b981]' : 'bg-[#f59e0b]'
                )} />
                <span className="text-[#e5e7eb]">{container.status}</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'deployment' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#9ca3af] uppercase mb-2">
                ブランチ
              </label>
              <div className="text-[#e5e7eb] bg-[#1a1b2e] px-3 py-2 rounded-lg border border-[#404556]">
                {container.branch}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#9ca3af] uppercase mb-2">
                ディレクトリ
              </label>
              <div className="text-[#e5e7eb] bg-[#1a1b2e] px-3 py-2 rounded-lg border border-[#404556]">
                {container.directory}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#9ca3af] uppercase mb-2">
                レプリカ数
              </label>
              <div className="text-[#e5e7eb] bg-[#1a1b2e] px-3 py-2 rounded-lg border border-[#404556]">
                {container.replicas}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'volumes' && (
          <div className="text-[#9ca3af] text-sm">
            <p className="mb-4">ボリューム設定はまだ利用できません。</p>
            <div className="bg-[#1a1b2e] p-3 rounded-lg border border-[#404556]">
              <p className="text-xs">/bitnami</p>
            </div>
          </div>
        )}

        {activeTab === 'advanced' && (
          <div className="text-[#9ca3af] text-sm">
            <p className="mb-4">詳細設定オプション</p>
            <button className="w-full bg-[#ef4444]/10 hover:bg-[#ef4444]/20 text-[#ef4444] px-3 py-2 rounded-lg text-sm font-medium transition-colors">
              削除
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ContainerConfigTabs;

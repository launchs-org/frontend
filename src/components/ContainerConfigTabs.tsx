import React, { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api';
import { 
  Settings, 
  RotateCcw,
  HardDrive,
  Code,
  FileText,
  Terminal as TerminalIcon,
  Plus,
  Trash2,
  Loader2,
  Save,
  X
} from 'lucide-react';
import { useToast } from '../context/ToastContext';

type TabType = 'general' | 'deployment' | 'volumes' | 'env-vars' | 'build-logs' | 'exec-logs';

interface Container {
  id: string;
  name: string;
  repository_url: string;
  branch: string;
  status: string;
  version: string;
  replicas: number;
  directory: string;
}

interface ContainerConfigTabsProps {
  container: Container;
}

const ContainerConfigTabs: React.FC<ContainerConfigTabsProps> = ({ container }) => {
  const [activeTab, setActiveTab] = useState<TabType>('general');
  const { addToast } = useToast();

  const [envVars, setEnvVars] = useState<{key: string, value: string}[]>([]);
  const [isSavingEnv, setIsSavingEnv] = useState(false);

  const [volumes, setVolumes] = useState<any[]>([]);
  const [newVolume, setNewVolume] = useState({ name: '', size_mb: 128, mount_path: '/data' });
  const [isCreatingVolume, setIsCreatingVolume] = useState(false);

  const [buildLogs, setBuildLogs] = useState<string[]>([]);
  const [execLogs, setExecLogs] = useState<any[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  const buildLogContainerRef = useRef<HTMLDivElement>(null);
  const execLogContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeTab === 'env-vars') {
      fetchEnvVars();
    } else if (activeTab === 'volumes') {
      fetchVolumes();
    } else if (activeTab === 'build-logs') {
      fetchBuildLogs();
    } else if (activeTab === 'exec-logs') {
      fetchExecLogs();
    }
  }, [activeTab, container.id]);

  const fetchEnvVars = async () => {
    try {
      const res = await api.get(`/app/v1/containers/${container.id}`);
      const vars = JSON.parse(res.data.data.env_vars || '{}');
      const varArray = Object.entries(vars).map(([key, value]) => ({ key, value: value as string }));
      setEnvVars(varArray);
    } catch (error) {
      console.error('Failed to fetch env vars:', error);
      addToast('環境変数の取得に失敗しました', 'error');
    }
  };

  const fetchVolumes = async () => {
    try {
      const res = await api.get(`/app/v1/containers/${container.id}/volumes`);
      setVolumes(res.data.data || []);
    } catch (error) {
      console.error('Failed to fetch volumes:', error);
      addToast('ボリュームの取得に失敗しました', 'error');
    }
  };

  const fetchBuildLogs = async () => {
    setLogsLoading(true);
    try {
      const res = await api.get(`/app/v1/containers/${container.id}/build-logs`);
      setBuildLogs(res.data.data || []);
      setTimeout(() => {
        if (buildLogContainerRef.current) {
          buildLogContainerRef.current.scrollTop = buildLogContainerRef.current.scrollHeight;
        }
      }, 0);
    } catch (error) {
      console.error('Failed to fetch build logs:', error);
      addToast('ビルドログの取得に失敗しました', 'error');
    } finally {
      setLogsLoading(false);
    }
  };

  const fetchExecLogs = async () => {
    setLogsLoading(true);
    try {
      const res = await api.get(`/app/v1/containers/${container.id}/exec-logs`);
      setExecLogs(res.data.data || []);
      setTimeout(() => {
        if (execLogContainerRef.current) {
          execLogContainerRef.current.scrollTop = execLogContainerRef.current.scrollHeight;
        }
      }, 0);
    } catch (error) {
      console.error('Failed to fetch exec logs:', error);
      addToast('実行ログの取得に失敗しました', 'error');
    } finally {
      setLogsLoading(false);
    }
  };

  const handleAddEnvVar = () => {
    setEnvVars([...envVars, { key: '', value: '' }]);
  };

  const handleEnvVarChange = (index: number, field: 'key' | 'value', value: string) => {
    const updated = [...envVars];
    updated[index] = { ...updated[index], [field]: value };
    setEnvVars(updated);
  };

  const handleRemoveEnvVar = (index: number) => {
    setEnvVars(envVars.filter((_, i) => i !== index));
  };

  const handleSaveEnvVars = async () => {
    setIsSavingEnv(true);
    try {
      const envObj = envVars.reduce((acc, { key, value }) => {
        if (key) acc[key] = value;
        return acc;
      }, {} as Record<string, string>);

      await api.patch(`/app/v1/containers/${container.id}`, {
        env_vars: JSON.stringify(envObj)
      });
      addToast('環境変数を保存しました', 'success');
    } catch (error) {
      console.error('Failed to save env vars:', error);
      addToast('環境変数の保存に失敗しました', 'error');
    } finally {
      setIsSavingEnv(false);
    }
  };

  const handleAddVolume = async () => {
    if (!newVolume.name || !newVolume.mount_path) {
      addToast('ボリューム名とマウントパスを入力してください', 'warning');
      return;
    }
    
    setIsCreatingVolume(true);
    try {
      await api.post(`/app/v1/containers/${container.id}/volumes`, newVolume);
      addToast('ボリュームを作成しました', 'success');
      setNewVolume({ name: '', size_mb: 128, mount_path: '/data' });
      fetchVolumes();
    } catch (error) {
      console.error('Failed to create volume:', error);
      addToast('ボリュームの作成に失敗しました', 'error');
    } finally {
      setIsCreatingVolume(false);
    }
  };

  const handleDeleteVolume = async (volumeId: string) => {
    try {
      await api.delete(`/app/v1/containers/${container.id}/volumes/${volumeId}`);
      addToast('ボリュームを削除しました', 'success');
      fetchVolumes();
    } catch (error) {
      console.error('Failed to delete volume:', error);
      addToast('ボリュームの削除に失敗しました', 'error');
    }
  };

  const tabs = [
    { id: 'general', name: '基本', icon: Settings },
    { id: 'deployment', name: 'デプロイ', icon: RotateCcw },
    { id: 'env-vars', name: '環境変数', icon: Code },
    { id: 'volumes', name: 'ボリューム', icon: HardDrive },
    { id: 'build-logs', name: 'ビルドログ', icon: FileText },
    { id: 'exec-logs', name: '実行ログ', icon: TerminalIcon },
  ] as const;

  return (
    <div className="flex flex-col h-full">
      {/* Tab Navigation */}
      <div className="border-b border-[#404556] px-4 py-3 overflow-x-auto flex-shrink-0">
        <div className="flex space-x-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`px-3 py-1.5 rounded text-xs font-medium whitespace-nowrap transition-colors flex items-center space-x-1.5 ${
                activeTab === tab.id
                  ? 'bg-[#6366f1]/10 text-[#6366f1]'
                  : 'text-[#9ca3af] hover:bg-[#3a3d52]'
              }`}
            >
              <tab.icon size={14} />
              <span>{tab.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {activeTab === 'general' && (
          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold text-[#9ca3af] uppercase mb-1">コンテナ名</p>
              <p className="text-sm text-[#e5e7eb]">{container.name}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-[#9ca3af] uppercase mb-1">リポジトリ</p>
              <p className="text-xs text-[#6366f1] break-all font-mono">{container.repository_url}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-[#9ca3af] uppercase mb-1">ブランチ</p>
              <p className="text-sm text-[#e5e7eb]">{container.branch}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-[#9ca3af] uppercase mb-1">バージョン</p>
              <p className="text-xs text-[#6366f1] font-mono">{container.version}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-[#9ca3af] uppercase mb-1">レプリカ数</p>
              <p className="text-sm text-[#e5e7eb]">{container.replicas}</p>
            </div>
          </div>
        )}

        {activeTab === 'deployment' && (
          <div className="space-y-3">
            <div>
              <p className="text-xs font-semibold text-[#9ca3af] uppercase mb-1">ステータス</p>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${
                  container.status === 'Running' ? 'bg-[#10b981]' : 'bg-[#f59e0b]'
                }`} />
                <span className="text-sm text-[#e5e7eb]">{container.status}</span>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-[#9ca3af] uppercase mb-1">ディレクトリ</p>
              <p className="text-sm text-[#e5e7eb] font-mono">{container.directory}</p>
            </div>
          </div>
        )}

        {activeTab === 'env-vars' && (
          <div className="space-y-3">
            <div className="space-y-2">
              {envVars.map((envVar, idx) => (
                <div key={idx} className="flex items-center space-x-2 bg-[#1a1b2e] rounded p-2">
                  <input
                    type="text"
                    placeholder="KEY"
                    value={envVar.key}
                    onChange={(e) => handleEnvVarChange(idx, 'key', e.target.value)}
                    className="input text-xs flex-1"
                  />
                  <span className="text-[#9ca3af]">=</span>
                  <input
                    type="text"
                    placeholder="VALUE"
                    value={envVar.value}
                    onChange={(e) => handleEnvVarChange(idx, 'value', e.target.value)}
                    className="input text-xs flex-1"
                  />
                  <button
                    onClick={() => handleRemoveEnvVar(idx)}
                    className="p-1 hover:bg-[#ef4444]/20 text-[#ef4444] rounded transition-colors flex-shrink-0"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={handleAddEnvVar}
              className="w-full flex items-center justify-center space-x-1 px-3 py-2 border border-dashed border-[#404556] hover:border-[#6366f1] text-[#9ca3af] hover:text-[#6366f1] rounded text-xs font-medium transition-colors"
            >
              <Plus size={14} />
              <span>変数を追加</span>
            </button>

            <button
              onClick={handleSaveEnvVars}
              disabled={isSavingEnv}
              className="w-full flex items-center justify-center space-x-1 px-3 py-2 bg-[#6366f1] hover:bg-[#4f46e5] text-white rounded text-xs font-medium transition-colors disabled:opacity-50"
            >
              {isSavingEnv ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  <span>保存中...</span>
                </>
              ) : (
                <>
                  <Save size={14} />
                  <span>保存</span>
                </>
              )}
            </button>
          </div>
        )}

        {activeTab === 'volumes' && (
          <div className="space-y-3">
            <div className="space-y-2">
              {volumes.map((volume) => (
                <div key={volume.id} className="bg-[#1a1b2e] rounded p-3 border border-[#404556]">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-semibold text-[#9ca3af] uppercase">{volume.name}</p>
                      <p className="text-xs text-[#6366f1] font-mono mt-1">{volume.mount_path}</p>
                      <p className="text-[10px] text-[#9ca3af] mt-1">{volume.size_mb} MB</p>
                    </div>
                    <button
                      onClick={() => handleDeleteVolume(volume.id)}
                      className="p-1 hover:bg-[#ef4444]/20 text-[#ef4444] rounded transition-colors flex-shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-[#1a1b2e] rounded p-3 border border-[#404556] space-y-2">
              <input
                type="text"
                placeholder="ボリューム名"
                value={newVolume.name}
                onChange={(e) => setNewVolume({...newVolume, name: e.target.value})}
                className="input text-xs"
              />
              <input
                type="text"
                placeholder="マウントパス"
                value={newVolume.mount_path}
                onChange={(e) => setNewVolume({...newVolume, mount_path: e.target.value})}
                className="input text-xs"
              />
              <input
                type="number"
                placeholder="サイズ (MB)"
                value={newVolume.size_mb}
                onChange={(e) => setNewVolume({...newVolume, size_mb: parseInt(e.target.value)})}
                className="input text-xs"
              />
              <button
                onClick={handleAddVolume}
                disabled={isCreatingVolume || !newVolume.name}
                className="w-full flex items-center justify-center space-x-1 px-3 py-2 bg-[#6366f1] hover:bg-[#4f46e5] text-white rounded text-xs font-medium transition-colors disabled:opacity-50"
              >
                {isCreatingVolume ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    <span>作成中...</span>
                  </>
                ) : (
                  <>
                    <Plus size={14} />
                    <span>作成</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {activeTab === 'build-logs' && (
          <div className="space-y-2">
            {logsLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 size={16} className="animate-spin text-[#6366f1]" />
              </div>
            ) : (
              <div
                ref={buildLogContainerRef}
                className="bg-[#1a1b2e] rounded p-3 border border-[#404556] h-48 overflow-y-auto font-mono text-[10px] text-[#10b981] space-y-0.5"
              >
                {buildLogs.length === 0 ? (
                  <p className="text-[#9ca3af]">ログがありません</p>
                ) : (
                  buildLogs.map((log, idx) => (
                    <div key={idx}>{log}</div>
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'exec-logs' && (
          <div className="space-y-2">
            {logsLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 size={16} className="animate-spin text-[#6366f1]" />
              </div>
            ) : (
              <div
                ref={execLogContainerRef}
                className="bg-[#1a1b2e] rounded p-3 border border-[#404556] h-48 overflow-y-auto font-mono text-[10px] text-[#10b981] space-y-0.5"
              >
                {execLogs.length === 0 ? (
                  <p className="text-[#9ca3af]">ログがありません</p>
                ) : (
                  execLogs.map((log, idx) => (
                    <div key={idx}>
                      <span className="text-[#6366f1]">[{log.pod_name}]</span> {log.message}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ContainerConfigTabs;

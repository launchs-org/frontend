import React from 'react';
import { X, Loader2, Plus } from 'lucide-react';

interface DeployModalProps {
    formData: any;
    setFormData: (data: any) => void;
    onSubmit: (e: React.FormEvent) => void;
    onClose: () => void;
    creating: boolean;
}

export const DeployModal: React.FC<DeployModalProps> = ({
    formData, setFormData, onSubmit, onClose, creating
}) => {
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in duration-200">
                <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">新規デプロイ</h3>
                        <p className="text-xs text-gray-500 mt-1">GitHubリポジトリからコンテナを作成します</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <X size={20} className="text-gray-400" />
                    </button>
                </div>

                <form onSubmit={onSubmit} className="p-8 space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">コンテナ名</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                            placeholder="my-awesome-api"
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:border-blue-500 transition-all"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">GitHub Repository URL</label>
                        <input
                            type="url"
                            value={formData.repository_url}
                            onChange={(e) => setFormData({ ...formData, repository_url: e.target.value })}
                            required
                            placeholder="https://github.com/user/repo"
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:outline-none focus:border-blue-500 transition-all"
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">ブランチ</label>
                            <input
                                type="text"
                                value={formData.branch}
                                onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                                placeholder="main"
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">ディレクトリ</label>
                            <input
                                type="text"
                                value={formData.directory}
                                onChange={(e) => setFormData({ ...formData, directory: e.target.value })}
                                placeholder="."
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">レプリカ数</label>
                        <input
                            type="number"
                            value={formData.replicas}
                            onChange={(e) => setFormData({ ...formData, replicas: parseInt(e.target.value) })}
                            min="1"
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={creating}
                        className="w-full py-4 bg-blue-500 text-white rounded-xl font-bold shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 flex items-center justify-center space-x-3"
                    >
                        {creating ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
                        <span>{creating ? '準備中...' : 'デプロイを開始する'}</span>
                    </button>
                </form>
            </div>
        </div>
    );
};
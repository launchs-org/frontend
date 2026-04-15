import { useState } from 'react';
import { useProjects } from '../hooks/useProjects';

export const ProjectCreator = () => {
  const [name, setName] = useState('');
  const { addProject, loading } = useProjects();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await addProject(name);
    setName('');
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 bg-white shadow rounded">
      <h2 className="text-xl font-bold mb-4">新しいプロジェクトを作成</h2>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="プロジェクト名"
        className="w-full p-2 border border-gray-300 rounded mb-4"
        required
      />
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
      >
        {loading ? '作成中...' : '作成'}
      </button>
    </form>
  );
};

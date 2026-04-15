import { useState } from 'react';
import { createProject } from '../services/project';

export const useProjects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(false);

  const addProject = async (name: string) => {
    setLoading(true);
    try {
      const newProject = await createProject(name);
      setProjects([...projects, newProject]);
    } finally {
      setLoading(false);
    }
  };

  return { projects, loading, addProject };
};

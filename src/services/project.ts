import axios from 'axios';

const api = axios.create({
  baseURL: '/v1',
});

export const createProject = async (name: string) => {
  const response = await api.post('/projects', { name });
  return response.data.data;
};

export const getProjects = async () => {
  const response = await api.get('/projects');
  return response.data.data;
};

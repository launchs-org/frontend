import { api } from '../lib/api';

export interface CreateContainerFiles {
    name: string;
    repository_url: string;
    branch: string;
    directory: string;
    replicas: number;
}

export const containerService = {
    // プロジェクト関連
    getProject: (projectId: string) =>
        api.get(`/app/v1/projects/${projectId}`),

    updateProjectEnvVars: (projectId: string, envVars: string) =>
        api.patch(`/app/v1/projects/${projectId}/env-vars`, { env_vars: envVars }),

    // コンテナ関連
    getContainer: (containerId: string) =>
        api.get(`/app/v1/containers/${containerId}`),

    createContainer: (projectId: string, data: CreateContainerFiles) =>
        api.post(`/app/v1/projects/${projectId}/containers`, data),

    rebuildContainer: (containerId: string) =>
        api.post(`/app/v1/containers/${containerId}/rebuild`),

    redeployContainer: (containerId: string) =>
        api.post(`/app/v1/containers/${containerId}/redeploy`),

    // ビルドジョブ関連
    getBuildJobs: (containerId: string) =>
        api.get(`/app/v1/containers/${containerId}/build-jobs`),

    getBuildLogs: (jobId: string) =>
        api.get(`/app/v1/build-jobs/${jobId}/logs`),

    // ネットワーク（Ingress/Service）関連
    updateIngress: (containerId: string, data: any) =>
        api.patch(`/app/v1/containers/${containerId}/ingress`, data),

    deleteIngress: (containerId: string) =>
        api.delete(`/app/v1/containers/${containerId}/ingress`),

    createIngress: (containerId: string, data: any) =>
        api.post(`/app/v1/containers/${containerId}/ingress`, data),

    updateService: (containerId: string, data: any) =>
        api.patch(`/app/v1/containers/${containerId}/service`, data),

    // ボリューム関連
    getVolumes: (containerId: string) =>
        api.get(`/app/v1/containers/${containerId}/volumes`),

    createVolume: (containerId: string, data: any) =>
        api.post(`/app/v1/containers/${containerId}/volumes`, data),

    deleteVolume: (volumeId: string) =>
        api.delete(`/app/v1/volumes/${volumeId}`),
};

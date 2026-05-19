import { api } from '../lib/api';

export interface CreateContainerFiles {
    name: string;
    repository_url: string;
    branch: string;
    directory: string;
}

export const containerService = {
    // プロジェクト関連
    getProject: (projectId: string) =>
        api.get(`/app/v1/projects/${projectId}`),

    updateContainerEnvVars: (containerId: string, envVars: string) =>
        api.patch(`/app/v1/containers/${containerId}/env-vars`, { env_vars: envVars }),

    // コンテナ関連
    getContainer: (containerId: string) =>
        api.get(`/app/v1/containers/${containerId}`),

    createContainer: (projectId: string, data: CreateContainerFiles) =>
        api.post(`/app/v1/projects/${projectId}/containers`, data),

    rebuildContainer: (containerId: string) =>
        api.post(`/app/v1/containers/${containerId}/rebuild`),

    redeployContainer: (containerId: string) =>
        api.post(`/app/v1/containers/${containerId}/redeploy`),

    deleteContainer: (containerId: string) =>
        api.delete(`/app/v1/containers/${containerId}`),

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

    getProjectVolumes: (projectId: string) =>
        api.get(`/app/v1/projects/${projectId}/volumes`),

    createProjectVolume: (projectId: string, data: { name: string; size_mb: number; mount_path: string; container_id?: string }) =>
        api.post(`/app/v1/projects/${projectId}/volumes`, data),

    scaleContainer: (containerId: string, replicas: number) =>
        api.post(`/app/v1/containers/${containerId}/scale`, { replicas }),

    // テンプレート関連
    getTemplates: () =>
        api.get('/app/v1/templates'),

    deployFromTemplate: (projectId: string, data: {
        name: string;
        template_name: string;
        env_vars: Record<string, string>;
        create_service: boolean;
        volume_size_mb?: number;
        enable_ingress?: boolean;
        command?: string;
        args?: string;
    }) =>
        api.post(`/app/v1/projects/${projectId}/containers/from-template`, data),
};

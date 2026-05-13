
type LogCallback = (data: any) => void;
type StatusCallback = (active: boolean) => void;

export const logStreamService = {
    createWebSocket: (path: string) => {
        const token = sessionStorage.getItem('access_token');
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        // 実際の実装に合わせて host などのパスを調整してください
        return new WebSocket(`${protocol}//${window.location.host}${path}`, token || '');
    },

    startBuildLogStream: (jobId: string, onLog: LogCallback, onDone: () => void, onError: StatusCallback) => {
        const ws = logStreamService.createWebSocket(`/app/v1/ws/build-jobs/${jobId}`);

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.event === 'log' && data.log) {
                    onLog(data.log);
                } else if (data.event === 'done') {
                    onDone();
                    ws.close();
                }
            } catch (e) {
                console.error("Failed to parse build log", e);
            }
        };

        ws.onclose = () => onError(false);
        ws.onerror = () => onError(false);

        return ws;
    },

    startExecLogStream: (containerId: string, onLog: (entry: any) => void, onError: StatusCallback) => {
        const ws = logStreamService.createWebSocket(`/app/v1/containers/${containerId}/logs`);

        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                if (data.event === 'log') {
                    onLog({
                        pod_name: data.pod || 'unknown',
                        timestamp: data.timestamp || new Date().toISOString(),
                        message: data.log || ''
                    });
                }
            } catch (e) {
                console.error("Failed to parse exec log", e);
            }
        };

        ws.onclose = () => onError(false);
        ws.onerror = () => onError(false);

        return ws;
    }
};
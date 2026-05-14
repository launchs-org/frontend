import type { Node, Edge } from '@xyflow/react';

export const STATUS_STYLES = {
    Running:   { dot: '#22c55e', bg: '#f0fdf4', text: '#15803d', border: '#86efac', label: '実行中' },
    Pending:   { dot: '#f59e0b', bg: '#fffbeb', text: '#92400e', border: '#fcd34d', label: '準備中' },
    Failed:    { dot: '#ef4444', bg: '#fef2f2', text: '#991b1b', border: '#fca5a5', label: '失敗' },
    Deploying:   { dot: '#3b82f6', bg: '#eff6ff', text: '#1e40af', border: '#93c5fd', label: 'デプロイ中' },
    Redeploying: { dot: '#3b82f6', bg: '#eff6ff', text: '#1e40af', border: '#93c5fd', label: '再デプロイ中' },
    Building:  { dot: '#8b5cf6', bg: '#f5f3ff', text: '#5b21b6', border: '#ddd6fe', label: 'ビルド中' },
    Queued:    { dot: '#64748b', bg: '#f8fafc', text: '#334155', border: '#e2e8f0', label: '待機中' },
    Unknown:   { dot: '#9ca3af', bg: '#f9fafb', text: '#4b5563', border: '#d1d5db', label: '不明' },
} as const;

export const getStatus = (s?: string) =>
    STATUS_STYLES[s as keyof typeof STATUS_STYLES] ?? STATUS_STYLES.Unknown;

export interface ContainerItem {
    id: string;
    name: string;
    status?: string;
    repository_url?: string;
    branch?: string;
    version?: string;
    replicas?: number;
    ingress?: { subdomain?: string; status?: string };
    service?: { type?: string; ports?: any; is_active?: boolean; internal_ip?: string; external_ip?: string; status?: string };
    volumes?: { id: string; name?: string; mount_path?: string; size_mb?: number }[];
}

// ─── Layout ────────────────────────────────────────────────────────────────
const COL_WORLD     =   0;
const COL_TUNNEL    = 180;
const COL_INGRESS   = 400; // Increased gap from Tunnel (360 -> 400)
const COL_SERVICE   = 620; // Shifted accordingly (580 -> 620)
const COL_CONTAINER = 880; // Shifted accordingly (840 -> 880)
const COL_VOLUME    = 1200; // Shifted accordingly (1160 -> 1200)
const ROW_GAP       = 250; 

export function buildFlow(containers: ContainerItem[]): { nodes: Node[]; edges: Edge[] } {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    const totalH = Math.max(0, (containers.length - 1) * ROW_GAP);
    const globalCenter = (totalH / 2) + 80; // The horizontal center line for the whole view

    nodes.push({
        id: 'world',
        type: 'worldNode',
        position: { x: COL_WORLD, y: globalCenter - 40 },
        data: {},
    });

    nodes.push({
        id: 'cf-tunnel',
        type: 'cloudflareTunnelNode',
        position: { x: COL_TUNNEL, y: globalCenter - 40 },
        data: {},
    });
    edges.push(edge('e-world-cf', 'world', 'cf-tunnel'));

    containers.forEach((c, idx) => {
        const cy = idx * ROW_GAP;
        const cyCenter = cy + 80; // The horizontal center line for this specific container row
        let prevId: string | undefined = undefined;

        const hasActiveService = c.service && c.service.is_active;

        if (c.ingress && hasActiveService) {
            const nid = `ingress-${c.id}`;
            nodes.push({
                id: nid, type: 'ingressNode',
                position: { x: COL_INGRESS, y: cyCenter - 40 },
                data: { subdomain: c.ingress.subdomain, status: c.ingress.status },
            });
            edges.push(edge(`e-cf-${nid}`, 'cf-tunnel', nid, false, c.id));
            prevId = nid;
        }

        if (c.service && c.service.is_active) {
            const nid = `service-${c.id}`;
            nodes.push({
                id: nid, type: 'serviceNode',
                position: { x: COL_SERVICE, y: cyCenter - 40 },
                data: { type: c.service.type, ports: c.service.ports, internal_ip: c.service.internal_ip, external_ip: c.service.external_ip, status: c.service.status, is_active: c.service.is_active },
            });
            if (prevId) {
                edges.push(edge(`e-${prevId}-${nid}`, prevId, nid, false, c.id));
            }
            prevId = nid;
        }

        nodes.push({
            id: c.id, type: 'containerNode',
            // Container height ~160px -> top at cy (center is cy + 80 = cyCenter)
            position: { x: COL_CONTAINER, y: cy },
            data: { 
                id: c.id, 
                name: c.name, 
                status: c.status, 
                branch: c.branch, 
                replicas: c.replicas,
                repo: c.repository_url,
                version: c.version
            },
        });
        if (prevId) {
            edges.push(edge(`e-${prevId}-${c.id}`, prevId, c.id, false, c.id));
        }

        (c.volumes ?? []).forEach((vol, vi) => {
            const nid = `vol-${vol.id}`;
            // Spread volumes around the center line
            const vOffset = (vi - (c.volumes!.length - 1) / 2) * 90;
            nodes.push({
                id: nid, type: 'volumeNode',
                position: { x: COL_VOLUME, y: cyCenter - 40 + vOffset },
                data: { name: vol.name, mountPath: vol.mount_path, size: vol.size_mb },
            });
            edges.push(edge(`e-${c.id}-${nid}`, c.id, nid, true, c.id));
        });
    });

    return { nodes, edges };
}

function edge(id: string, source: string, target: string, dashed = false, containerId?: string): Edge {
    return {
        id, source, target,
        type: 'smoothstep',
        animated: !dashed,
        data: { containerId },
        style: {
            stroke: dashed ? '#fed7aa' : '#cbd5e1',
            strokeWidth: 2,
            strokeDasharray: dashed ? '5 3' : undefined,
        },
    };
}

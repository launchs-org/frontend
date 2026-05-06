import type { Node, Edge } from '@xyflow/react';

export const STATUS_STYLES = {
    Running:   { dot: '#22c55e', bg: '#f0fdf4', text: '#15803d', border: '#86efac' },
    Pending:   { dot: '#f59e0b', bg: '#fffbeb', text: '#92400e', border: '#fcd34d' },
    Failed:    { dot: '#ef4444', bg: '#fef2f2', text: '#991b1b', border: '#fca5a5' },
    Deploying: { dot: '#3b82f6', bg: '#eff6ff', text: '#1e40af', border: '#93c5fd' },
    Unknown:   { dot: '#9ca3af', bg: '#f9fafb', text: '#4b5563', border: '#d1d5db' },
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
    ingress?: { subdomain?: string };
    service?: { type?: string; ports?: any };
    volumes?: { id: string; name?: string; mount_path?: string; size_mb?: number }[];
}

// ─── Layout ────────────────────────────────────────────────────────────────
const COL_WORLD     =   0;
const COL_INGRESS   = 220;
const COL_SERVICE   = 440;
const COL_CONTAINER = 700;
const COL_VOLUME    = 1020;
const ROW_GAP       = 250; // Increased for better vertical separation

export function buildFlow(containers: ContainerItem[]): { nodes: Node[]; edges: Edge[] } {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Container height is approx 160px. Center is at cy + 80.
    // We want other nodes (height ~60-80px) to be centered at the same line.
    
    const totalH = Math.max(0, (containers.length - 1) * ROW_GAP);
    const worldY = (totalH / 2) + 40; // Center of the entire diagram

    nodes.push({
        id: 'world',
        type: 'worldNode',
        position: { x: COL_WORLD, y: worldY },
        data: {},
    });

    containers.forEach((c, idx) => {
        const cy = idx * ROW_GAP;
        let prevId = 'world';

        if (c.ingress) {
            const nid = `ingress-${c.id}`;
            nodes.push({
                id: nid, type: 'ingressNode',
                // Ingress height ~60px -> top at centerY + 80 - 30 = cy + 50
                position: { x: COL_INGRESS, y: cy + 50 },
                data: { subdomain: c.ingress.subdomain },
            });
            edges.push(edge(`e-world-${nid}`, prevId, nid, false, c.id));
            prevId = nid;
        }

        if (c.service) {
            const nid = `service-${c.id}`;
            nodes.push({
                id: nid, type: 'serviceNode',
                // Service height ~80px -> top at centerY + 80 - 40 = cy + 40
                position: { x: COL_SERVICE, y: cy + 40 },
                data: { type: c.service.type, ports: c.service.ports },
            });
            edges.push(edge(`e-${prevId}-${nid}`, prevId, nid, false, c.id));
            prevId = nid;
        }

        nodes.push({
            id: c.id, type: 'containerNode',
            // Container height ~160px -> top at cy
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
        edges.push(edge(`e-${prevId}-${c.id}`, prevId, c.id, false, c.id));

        (c.volumes ?? []).forEach((vol, vi) => {
            const nid = `vol-${vol.id}`;
            // Spread volumes around the center line
            const vOffset = (vi - (c.volumes!.length - 1) / 2) * 90;
            nodes.push({
                id: nid, type: 'volumeNode',
                // Volume height ~70px -> center at centerY + 80 + vOffset
                position: { x: COL_VOLUME, y: cy + 45 + vOffset },
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
        data: { containerId },
        style: {
            stroke: dashed ? '#fed7aa' : '#cbd5e1',
            strokeWidth: 2,
            strokeDasharray: dashed ? '5 3' : undefined,
        },
    };
}

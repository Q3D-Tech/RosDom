import type { Server } from 'socket.io';
export interface RealtimeEnvelope {
    eventId: string;
    schemaVersion: number;
    homeId: string;
    topic: string;
    offset: number;
    occurredAt: string;
    correlationId: string;
    data: Record<string, unknown>;
}
export declare class RealtimeService {
    private server;
    bindServer(server: Server): void;
    publish(payload: RealtimeEnvelope): void;
}

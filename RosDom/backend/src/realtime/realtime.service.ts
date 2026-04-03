import { Injectable } from '@nestjs/common';
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

@Injectable()
export class RealtimeService {
  private server: Server | null = null;

  bindServer(server: Server) {
    this.server = server;
  }

  publish(payload: RealtimeEnvelope) {
    if (!this.server) {
      return;
    }

    this.server.to(`home:${payload.homeId}`).emit(payload.topic, payload);
    if (typeof payload.data.deviceId === 'string') {
      this.server
        .to(`device:${payload.data.deviceId}`)
        .emit(payload.topic, payload);
    }
  }
}

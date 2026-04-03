import { OnGatewayConnection, OnGatewayInit } from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { Server, Socket } from 'socket.io';
import { PlatformService } from '../platform/platform.service';
import { RealtimeEnvelope, RealtimeService } from './realtime.service';
export declare class RealtimeGateway implements OnGatewayInit, OnGatewayConnection {
    private readonly realtimeService;
    private readonly jwtService;
    private readonly configService;
    private readonly platformService;
    server: Server;
    private readonly logger;
    constructor(realtimeService: RealtimeService, jwtService: JwtService, configService: ConfigService, platformService: PlatformService);
    afterInit(): void;
    handleConnection(client: Socket): Promise<void>;
    subscribeHome(client: Socket, body: {
        homeId: string;
    }): Promise<{
        ok: boolean;
        topic?: undefined;
    } | {
        ok: boolean;
        topic: string;
    }>;
    subscribeDevice(client: Socket, body: {
        deviceId: string;
    }): Promise<{
        ok: boolean;
        topic?: undefined;
    } | {
        ok: boolean;
        topic: string;
    }>;
    emitHomeScopedEvent(payload: RealtimeEnvelope): void;
}

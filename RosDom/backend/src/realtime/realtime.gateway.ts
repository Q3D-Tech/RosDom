import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { Server, Socket } from 'socket.io';
import {
  AccessTokenPayload,
  isAccessTokenPayload,
} from '../common/auth/access-token';
import { PlatformService } from '../platform/platform.service';
import { RealtimeEnvelope, RealtimeService } from './realtime.service';

@WebSocketGateway({
  namespace: '/v1/realtime',
  cors: true,
})
export class RealtimeGateway implements OnGatewayInit, OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(RealtimeGateway.name);

  constructor(
    private readonly realtimeService: RealtimeService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly platformService: PlatformService,
  ) {}

  afterInit() {
    this.realtimeService.bindServer(this.server);
  }

  async handleConnection(client: Socket) {
    const authToken = (
      client.handshake.auth as Record<string, unknown> | undefined
    )?.token;
    const headerToken =
      typeof client.handshake.headers.authorization === 'string'
        ? client.handshake.headers.authorization.replace(/^Bearer\s+/u, '')
        : undefined;
    const token = typeof authToken === 'string' ? authToken : headerToken;

    if (!token) {
      client.disconnect(true);
      return;
    }

    try {
      const decoded: unknown = this.jwtService.verify(token, {
        secret:
          this.configService.get<string>('JWT_ACCESS_SECRET') ??
          'rosdom-access',
      });
      if (!isAccessTokenPayload(decoded)) {
        throw new Error('Invalid access token payload');
      }
      const payload: AccessTokenPayload = decoded;
      const user = await this.platformService.authenticateSession(
        payload.sessionId,
        payload.sub,
      );
      (client.data as { user?: typeof user }).user = user;
    } catch {
      this.logger.warn('Rejected realtime client with invalid token');
      client.disconnect(true);
    }
  }

  @SubscribeMessage('subscribe-home')
  async subscribeHome(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { homeId: string },
  ) {
    const user = (client.data as { user?: { id: string } }).user;
    if (!user) {
      client.disconnect(true);
      return { ok: false };
    }
    await this.platformService.ensureHomeAccess(user.id, body.homeId);
    void client.join(`home:${body.homeId}`);
    return { ok: true, topic: `home:${body.homeId}` };
  }

  @SubscribeMessage('subscribe-device')
  async subscribeDevice(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { deviceId: string },
  ) {
    const user = (client.data as { user?: { id: string } }).user;
    if (!user) {
      client.disconnect(true);
      return { ok: false };
    }
    const details = await this.platformService.getDeviceDetails(
      user.id,
      body.deviceId,
    );
    void client.join(`device:${details.device.id}`);
    return { ok: true, topic: `device:${details.device.id}` };
  }

  emitHomeScopedEvent(payload: RealtimeEnvelope) {
    this.server.to(`home:${payload.homeId}`).emit(payload.topic, payload);
    if (
      payload.data &&
      typeof payload.data === 'object' &&
      'deviceId' in payload.data
    ) {
      const deviceId = String(payload.data.deviceId);
      this.server.to(`device:${deviceId}`).emit(payload.topic, payload);
    }
  }
}

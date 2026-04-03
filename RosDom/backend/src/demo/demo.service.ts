import { createHash, randomUUID } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  CompletePairingSessionDto,
  CreateHomeDto,
  CreatePairingSessionDto,
  CreateRoomDto,
  CreateScenarioDto,
  InviteMemberDto,
  PatchLayoutDto,
  PutLayoutDto,
  SelectCandidateDto,
  SubmitCommandDto,
  UpdateHomeStateDto,
  UpdateMemberDto,
  UpdateRoomDto,
  UpdateScenarioDto,
} from '../common/types/dtos';
import {
  AuthenticatedUser,
  AuditLog,
  CommandLog,
  Device,
  DeviceCapability,
  DeviceDetails,
  DeviceRoomAnchor,
  DeviceStateSnapshot,
  EventRecord,
  EventSeverity,
  FirmwareRecord,
  Home,
  HomeMember,
  HomeSnapshot,
  IntegrationAccount,
  LayoutItem,
  NotificationRecord,
  PairingCandidate,
  PairingSession,
  Room,
  RoomLayoutBlock,
  Scenario,
  SyncResponse,
  User,
  UserSession,
} from '../common/types/contracts';
import {
  conflict,
  forbidden,
  notFound,
  unauthorized,
} from '../common/http/http-errors';
import { uuidv7 } from '../common/platform/id';
import { RealtimeService } from '../realtime/realtime.service';

const DEMO_EMAIL = 'alexey@rosdom.local';
const DEMO_PASSWORD = 'rosdom-demo';

function nowIso() {
  return new Date().toISOString();
}

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function intersects(a: RoomLayoutBlock, b: RoomLayoutBlock) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

@Injectable()
export class DemoService {
  private readonly users = new Map<string, User>();
  private readonly sessions = new Map<string, UserSession>();
  private readonly homes = new Map<string, Home>();
  private readonly members = new Map<string, HomeMember>();
  private readonly rooms = new Map<string, Room>();
  private readonly layoutBlocks = new Map<string, RoomLayoutBlock>();
  private readonly deviceAnchors = new Map<string, DeviceRoomAnchor>();
  private readonly devices = new Map<string, Device>();
  private readonly capabilities = new Map<string, DeviceCapability>();
  private readonly snapshots = new Map<string, DeviceStateSnapshot>();
  private readonly firmwareRecords = new Map<string, FirmwareRecord>();
  private readonly commands = new Map<string, CommandLog>();
  private readonly scenarios = new Map<string, Scenario>();
  private readonly events = new Map<string, EventRecord>();
  private readonly notifications = new Map<string, NotificationRecord>();
  private readonly integrations = new Map<string, IntegrationAccount>();
  private readonly pairingSessions = new Map<string, PairingSession>();
  private readonly auditLogs = new Map<string, AuditLog>();
  private eventOffset = 0;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly realtimeService: RealtimeService,
  ) {
    this.seed();
  }

  authenticateSession(sessionId: string, userId: string): AuthenticatedUser {
    const session = this.sessions.get(sessionId);
    if (!session || session.userId !== userId || session.revokedAt) {
      throw unauthorized('session_invalid', 'Session is no longer active');
    }

    const user = this.getUser(userId);
    return {
      id: user.id,
      email: user.email,
      loginIdentifier: user.loginIdentifier,
      identifierType: user.identifierType,
      displayName: user.displayName,
      accountMode: user.accountMode,
      sessionId: session.id,
    };
  }

  login(email: string, password: string, deviceName?: string) {
    if (email !== DEMO_EMAIL || password !== DEMO_PASSWORD) {
      throw unauthorized(
        'invalid_credentials',
        'Email or password is incorrect',
      );
    }

    const user = this.findUserByEmail(email);
    const refreshToken = randomUUID();
    const sessionId = uuidv7();
    const issuedAt = nowIso();
    const expiresAt = new Date(
      Date.now() + 1000 * 60 * 60 * 24 * 30,
    ).toISOString();

    this.sessions.set(sessionId, {
      id: sessionId,
      userId: user.id,
      refreshTokenHash: hashToken(refreshToken),
      deviceName: deviceName ?? 'Android demo device',
      createdAt: issuedAt,
      expiresAt,
      revokedAt: null,
    });

    const accessToken = this.jwtService.sign(
      { sub: user.id, email: user.email, sessionId },
      {
        secret:
          this.configService.get<string>('JWT_ACCESS_SECRET') ??
          'rosdom-access',
        expiresIn: '1h',
      },
    );

    return {
      accessToken,
      refreshToken,
      sessionId,
      expiresAt,
      user,
    };
  }

  refresh(refreshToken: string) {
    const refreshHash = hashToken(refreshToken);
    const session = [...this.sessions.values()].find(
      (candidate) =>
        candidate.refreshTokenHash === refreshHash && !candidate.revokedAt,
    );

    if (!session) {
      throw unauthorized('invalid_refresh_token', 'Refresh token is invalid');
    }

    const rotatedToken = randomUUID();
    session.refreshTokenHash = hashToken(rotatedToken);
    const user = this.getUser(session.userId);

    const accessToken = this.jwtService.sign(
      { sub: user.id, email: user.email, sessionId: session.id },
      {
        secret:
          this.configService.get<string>('JWT_ACCESS_SECRET') ??
          'rosdom-access',
        expiresIn: '1h',
      },
    );

    return {
      accessToken,
      refreshToken: rotatedToken,
      sessionId: session.id,
      expiresAt: session.expiresAt,
      user,
    };
  }

  logout(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.revokedAt = nowIso();
    }
  }

  getUser(userId: string) {
    const user = this.users.get(userId);
    if (!user) {
      throw notFound('user_not_found', 'User was not found');
    }
    return user;
  }

  findUserByEmail(email: string) {
    const user = [...this.users.values()].find(
      (candidate) => candidate.email === email,
    );
    if (!user) {
      throw notFound('user_not_found', 'User was not found');
    }
    return user;
  }

  getHomesForUser(userId: string) {
    const membershipHomeIds = [...this.members.values()]
      .filter(
        (member) => member.userId === userId && member.status !== 'revoked',
      )
      .map((member) => member.homeId);

    return membershipHomeIds.map((homeId) => this.getHome(homeId));
  }

  createHome(userId: string, dto: CreateHomeDto) {
    const home: Home = {
      id: uuidv7(),
      title: dto.title,
      addressLabel: dto.addressLabel,
      timezone: dto.timezone,
      ownerUserId: userId,
      currentMode: 'home',
      securityMode: 'disarmed',
      updatedAt: nowIso(),
      layoutRevision: 0,
    };
    this.homes.set(home.id, home);

    const member: HomeMember = {
      id: uuidv7(),
      homeId: home.id,
      userId,
      role: 'owner',
      status: 'active',
      createdAt: nowIso(),
    };
    this.members.set(member.id, member);
    this.appendEvent(
      home.id,
      'home.state.updated',
      'info',
      { homeId: home.id },
      userId,
    );
    return home;
  }

  getHome(homeId: string) {
    const home = this.homes.get(homeId);
    if (!home) {
      throw notFound('home_not_found', 'Home was not found');
    }
    return home;
  }

  ensureHomeAccess(userId: string, homeId: string) {
    const membership = [...this.members.values()].find(
      (member) =>
        member.homeId === homeId &&
        member.userId === userId &&
        member.status !== 'revoked',
    );
    if (!membership) {
      throw forbidden(
        'home_access_denied',
        'User does not belong to this home',
      );
    }
    return membership;
  }

  updateHomeState(userId: string, homeId: string, dto: UpdateHomeStateDto) {
    this.ensureHomeAccess(userId, homeId);
    const home = this.getHome(homeId);
    if (dto.currentMode) {
      home.currentMode = dto.currentMode;
    }
    if (dto.securityMode) {
      home.securityMode = dto.securityMode;
    }
    home.updatedAt = nowIso();
    this.appendEvent(home.id, 'home.state.updated', 'info', dto, userId);
    return home;
  }

  getMembers(homeId: string, userId: string) {
    this.ensureHomeAccess(userId, homeId);
    return [...this.members.values()].filter(
      (member) => member.homeId === homeId,
    );
  }

  inviteMember(actorUserId: string, dto: InviteMemberDto) {
    const membership = this.ensureHomeAccess(actorUserId, dto.homeId);
    if (membership.role === 'guest') {
      throw forbidden('member_invite_denied', 'Guests cannot invite members');
    }

    const user = this.users.get(dto.userId);
    if (!user) {
      throw notFound(
        'invitee_not_found',
        'Invitee user is not present in demo directory',
      );
    }

    const existing = [...this.members.values()].find(
      (member) => member.homeId === dto.homeId && member.userId === user.id,
    );
    if (existing) {
      throw conflict('member_exists', 'Member already belongs to this home');
    }

    const member: HomeMember = {
      id: uuidv7(),
      homeId: dto.homeId,
      userId: user.id,
      role: dto.role,
      status: 'invited',
      createdAt: nowIso(),
    };
    this.members.set(member.id, member);
    this.appendEvent(
      dto.homeId,
      'member.access.changed',
      'info',
      member,
      actorUserId,
    );
    return member;
  }

  updateMember(actorUserId: string, memberId: string, dto: UpdateMemberDto) {
    const member = this.members.get(memberId);
    if (!member) {
      throw notFound('member_not_found', 'Member was not found');
    }
    const actorMembership = this.ensureHomeAccess(actorUserId, member.homeId);
    if (actorMembership.role !== 'owner') {
      throw forbidden('member_update_denied', 'Only owners can update members');
    }

    if (dto.role) {
      member.role = dto.role;
    }
    if (dto.status) {
      member.status = dto.status;
    }
    this.appendEvent(
      member.homeId,
      'member.access.changed',
      'info',
      member,
      actorUserId,
    );
    return member;
  }

  getRooms(homeId: string, userId: string) {
    this.ensureHomeAccess(userId, homeId);
    return [...this.rooms.values()]
      .filter((room) => room.homeId === homeId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  createRoom(userId: string, homeId: string, dto: CreateRoomDto) {
    this.ensureHomeAccess(userId, homeId);
    const room: Room = {
      id: uuidv7(),
      homeId,
      title: dto.title,
      type: dto.type,
      sortOrder: dto.sortOrder ?? this.getRooms(homeId, userId).length,
      updatedAt: nowIso(),
    };
    this.rooms.set(room.id, room);
    this.appendEvent(homeId, 'room.state.updated', 'info', room, userId);
    return room;
  }

  updateRoom(userId: string, roomId: string, dto: UpdateRoomDto) {
    const room = this.rooms.get(roomId);
    if (!room) {
      throw notFound('room_not_found', 'Room was not found');
    }
    this.ensureHomeAccess(userId, room.homeId);
    Object.assign(room, {
      ...(dto.title ? { title: dto.title } : {}),
      ...(dto.type ? { type: dto.type } : {}),
      ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
      updatedAt: nowIso(),
    });
    this.appendEvent(room.homeId, 'room.state.updated', 'info', room, userId);
    return room;
  }

  getLayout(homeId: string, userId: string) {
    this.ensureHomeAccess(userId, homeId);
    const home = this.getHome(homeId);
    const items = [...this.deviceAnchors.values()]
      .filter((anchor) => this.devices.get(anchor.deviceId)?.homeId === homeId)
      .map((anchor) => this.mapAnchorToLayoutItem(homeId, anchor));
    return {
      homeId,
      revision: home.layoutRevision,
      blocks: [...this.layoutBlocks.values()].filter(
        (block) => this.rooms.get(block.roomId)?.homeId === homeId,
      ),
      items,
    };
  }

  replaceLayout(
    userId: string,
    homeId: string,
    dto: PutLayoutDto | PatchLayoutDto,
  ) {
    this.ensureHomeAccess(userId, homeId);
    const home = this.getHome(homeId);
    if (dto.revision !== home.layoutRevision) {
      throw conflict('layout_revision_mismatch', 'Layout revision is stale');
    }

    this.validateLayout(homeId, dto.blocks, dto.items, userId);

    for (const [id, block] of this.layoutBlocks.entries()) {
      if (this.rooms.get(block.roomId)?.homeId === homeId) {
        this.layoutBlocks.delete(id);
      }
    }
    for (const [id, anchor] of this.deviceAnchors.entries()) {
      if (this.devices.get(anchor.deviceId)?.homeId === homeId) {
        this.deviceAnchors.delete(id);
      }
    }

    for (const block of dto.blocks) {
      const storedBlock: RoomLayoutBlock = { id: uuidv7(), ...block };
      this.layoutBlocks.set(storedBlock.id, storedBlock);
    }
    for (const item of dto.items.filter(
      (candidate) => candidate.kind === 'device',
    )) {
      const deviceId =
        typeof item.metadata?.deviceId === 'string'
          ? item.metadata.deviceId
          : (item.id ?? uuidv7());
      const storedAnchor: DeviceRoomAnchor = {
        id: uuidv7(),
        deviceId,
        roomId: item.roomId,
        x: item.x,
        y: item.y,
        anchorType: item.subtype,
      };
      this.deviceAnchors.set(storedAnchor.id, storedAnchor);
    }

    home.layoutRevision += 1;
    home.updatedAt = nowIso();
    this.appendEvent(
      homeId,
      'room.state.updated',
      'info',
      { layoutRevision: home.layoutRevision },
      userId,
    );
    this.writeAudit(
      userId,
      homeId,
      'layout',
      homeId,
      'layout.replace',
      'Updated home layout',
    );
    return this.getLayout(homeId, userId);
  }

  getDevices(homeId: string, userId: string) {
    this.ensureHomeAccess(userId, homeId);
    return [...this.devices.values()].filter(
      (device) => device.homeId === homeId,
    );
  }

  getDeviceDetails(userId: string, deviceId: string): DeviceDetails {
    const device = this.devices.get(deviceId);
    if (!device) {
      throw notFound('device_not_found', 'Device was not found');
    }
    this.ensureHomeAccess(userId, device.homeId);
    return {
      device,
      capabilities: this.getCapabilities(deviceId),
      latestState: this.getLatestState(deviceId),
      commands: [...this.commands.values()].filter(
        (command) => command.deviceId === deviceId,
      ),
      firmware: [...this.firmwareRecords.values()].filter(
        (record) => record.deviceId === deviceId,
      ),
    };
  }

  getCapabilities(deviceId: string) {
    return [...this.capabilities.values()].filter(
      (capability) => capability.deviceId === deviceId,
    );
  }

  getLatestState(deviceId: string) {
    return (
      [...this.snapshots.values()]
        .filter((snapshot) => snapshot.deviceId === deviceId)
        .sort((a, b) => b.observedAt.localeCompare(a.observedAt))[0] ?? null
    );
  }

  submitCommand(
    user: AuthenticatedUser,
    deviceId: string,
    idempotencyKey: string,
    dto: SubmitCommandDto,
  ) {
    const device = this.devices.get(deviceId);
    if (!device) {
      throw notFound('device_not_found', 'Device was not found');
    }
    this.ensureHomeAccess(user.id, device.homeId);
    const capability = this.getCapabilities(deviceId).find(
      (candidate) => candidate.key === dto.capabilityKey,
    );
    if (!capability || !capability.writable) {
      throw forbidden('capability_not_writable', 'Capability is not writable');
    }
    this.validateCommandValue(capability, dto.requestedValue);

    const existing = [...this.commands.values()].find(
      (command) =>
        command.homeId === device.homeId &&
        command.idempotencyKey === idempotencyKey,
    );
    if (existing) {
      if (
        existing.deviceId !== deviceId ||
        existing.capabilityKey !== dto.capabilityKey ||
        JSON.stringify(existing.requestedValue) !==
          JSON.stringify(dto.requestedValue)
      ) {
        throw conflict(
          'idempotency_conflict',
          'Idempotency key already exists with a different payload',
        );
      }
      return existing;
    }

    const command: CommandLog = {
      id: uuidv7(),
      homeId: device.homeId,
      deviceId,
      capabilityKey: dto.capabilityKey,
      requestedValue: dto.requestedValue,
      requestedAt: nowIso(),
      actorUserId: user.id,
      idempotencyKey,
      deliveryStatus: 'queued',
      failureReason: null,
      externalCommandRef: `demo-${uuidv7()}`,
      acknowledgedAt: null,
      reconciledAt: null,
    };
    this.commands.set(command.id, command);
    this.appendEvent(
      device.homeId,
      'device.command.submitted',
      'info',
      command,
      user.id,
    );

    setTimeout(() => this.dispatchCommand(command.id), 25);
    return command;
  }

  getCommandStatus(
    userId: string,
    homeId: string,
    deviceId: string,
    commandId: string,
  ) {
    this.ensureHomeAccess(userId, homeId);
    const command = this.commands.get(commandId);
    if (
      !command ||
      command.homeId !== homeId ||
      command.deviceId !== deviceId
    ) {
      throw notFound('command_not_found', 'Command was not found');
    }
    return command;
  }

  getScenarios(homeId: string, userId: string) {
    this.ensureHomeAccess(userId, homeId);
    return [...this.scenarios.values()].filter(
      (scenario) => scenario.homeId === homeId,
    );
  }

  createScenario(userId: string, dto: CreateScenarioDto) {
    this.ensureHomeAccess(userId, dto.homeId);
    const scenario: Scenario = {
      id: uuidv7(),
      homeId: dto.homeId,
      title: dto.title,
      description: dto.description,
      iconKey: dto.iconKey,
      enabled: true,
      executionMode: dto.executionMode,
      updatedAt: nowIso(),
    };
    this.scenarios.set(scenario.id, scenario);
    this.appendEvent(
      dto.homeId,
      'automation.run.updated',
      'info',
      { scenarioId: scenario.id },
      userId,
    );
    return scenario;
  }

  updateScenario(userId: string, scenarioId: string, dto: UpdateScenarioDto) {
    const scenario = this.scenarios.get(scenarioId);
    if (!scenario) {
      throw notFound('scenario_not_found', 'Scenario was not found');
    }
    this.ensureHomeAccess(userId, scenario.homeId);
    Object.assign(scenario, {
      ...(dto.title ? { title: dto.title } : {}),
      ...(dto.description ? { description: dto.description } : {}),
      ...(dto.iconKey ? { iconKey: dto.iconKey } : {}),
      ...(dto.enabled !== undefined ? { enabled: dto.enabled } : {}),
      ...(dto.executionMode ? { executionMode: dto.executionMode } : {}),
      updatedAt: nowIso(),
    });
    this.appendEvent(
      scenario.homeId,
      'automation.run.updated',
      'info',
      scenario,
      userId,
    );
    return scenario;
  }

  runScenario(userId: string, scenarioId: string) {
    const scenario = this.scenarios.get(scenarioId);
    if (!scenario) {
      throw notFound('scenario_not_found', 'Scenario was not found');
    }
    this.ensureHomeAccess(userId, scenario.homeId);
    this.appendEvent(
      scenario.homeId,
      'automation.run.updated',
      'info',
      { scenarioId: scenario.id, status: 'completed' },
      userId,
    );
    return {
      scenarioId: scenario.id,
      status: 'completed',
      executedAt: nowIso(),
    };
  }

  getAutomations(homeId: string, userId: string) {
    this.ensureHomeAccess(userId, homeId);
    return this.getScenarios(homeId, userId).map((scenario) => ({
      id: uuidv7(),
      scenarioId: scenario.id,
      homeId,
      status: scenario.enabled ? 'completed' : 'queued',
      startedAt: nowIso(),
      finishedAt: nowIso(),
    }));
  }

  getEvents(homeId: string, userId: string, afterOffset = 0) {
    this.ensureHomeAccess(userId, homeId);
    return [...this.events.values()]
      .filter((event) => event.homeId === homeId && event.offset > afterOffset)
      .sort((a, b) => a.offset - b.offset);
  }

  getEvent(homeId: string, eventId: string, userId: string) {
    this.ensureHomeAccess(userId, homeId);
    const event = this.events.get(eventId);
    if (!event || event.homeId !== homeId) {
      throw notFound('event_not_found', 'Event was not found');
    }
    return event;
  }

  getNotifications(homeId: string, userId: string) {
    this.ensureHomeAccess(userId, homeId);
    return [...this.notifications.values()]
      .filter(
        (notification) =>
          notification.homeId === homeId && notification.userId === userId,
      )
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  markNotificationRead(userId: string, notificationId: string) {
    const notification = this.notifications.get(notificationId);
    if (!notification || notification.userId !== userId) {
      throw notFound('notification_not_found', 'Notification was not found');
    }
    notification.readAt = nowIso();
    return notification;
  }

  getIntegrations(homeId: string, userId: string) {
    this.ensureHomeAccess(userId, homeId);
    return [...this.integrations.values()].filter(
      (integration) => integration.homeId === homeId,
    );
  }

  createPairingSession(userId: string, dto: CreatePairingSessionDto) {
    this.ensureHomeAccess(userId, dto.homeId);
    const pairing: PairingSession = {
      id: uuidv7(),
      publicToken: uuidv7(),
      homeId: dto.homeId,
      actorUserId: userId,
      deviceType: dto.deviceType,
      discoveryMethod: dto.discoveryMethod,
      status: 'created',
      expiresAt: new Date(Date.now() + 1000 * 60 * 10).toISOString(),
      createdAt: nowIso(),
      completedAt: null,
      selectedCandidateId: null,
      candidateListHash: null,
      candidates: [],
    };
    this.pairingSessions.set(pairing.id, pairing);
    this.writeAudit(
      userId,
      dto.homeId,
      'pairing_session',
      pairing.id,
      'pairing.create',
      'Created pairing session',
    );
    return pairing;
  }

  getPairingSession(userId: string, pairingSessionId: string) {
    const pairing = this.getPairingSessionOrThrow(pairingSessionId);
    this.ensureHomeAccess(userId, pairing.homeId);
    return pairing;
  }

  discoverPairingCandidates(userId: string, pairingSessionId: string) {
    const pairing = this.getPairingSessionOrThrow(pairingSessionId);
    this.ensureHomeAccess(userId, pairing.homeId);
    pairing.status = 'discovering';
    const candidates = this.buildCandidates(pairing.discoveryMethod);
    pairing.candidates = candidates;
    pairing.candidateListHash = hashToken(JSON.stringify(candidates));
    return pairing;
  }

  selectPairingCandidate(
    userId: string,
    pairingSessionId: string,
    dto: SelectCandidateDto,
  ) {
    const pairing = this.getPairingSessionOrThrow(pairingSessionId);
    this.ensureHomeAccess(userId, pairing.homeId);
    const candidate = pairing.candidates.find(
      (item) => item.id === dto.candidateId,
    );
    if (!candidate) {
      throw notFound('candidate_not_found', 'Pairing candidate was not found');
    }
    pairing.selectedCandidateId = candidate.id;
    pairing.status = 'candidate_selected';
    return pairing;
  }

  completePairingSession(
    userId: string,
    pairingSessionId: string,
    dto: CompletePairingSessionDto,
  ) {
    const pairing = this.getPairingSessionOrThrow(pairingSessionId);
    this.ensureHomeAccess(userId, pairing.homeId);
    const candidate = pairing.candidates.find(
      (item) => item.id === pairing.selectedCandidateId,
    );
    if (!candidate) {
      throw conflict(
        'candidate_missing',
        'Select a pairing candidate before completion',
      );
    }

    const roomId = dto.roomId ?? this.getRooms(pairing.homeId, userId)[0]?.id;
    if (!roomId) {
      throw conflict(
        'room_required',
        'At least one room is required before pairing',
      );
    }

    const device: Device = {
      id: uuidv7(),
      homeId: pairing.homeId,
      roomId,
      name: dto.deviceName ?? candidate.label,
      category: 'light',
      vendor: candidate.vendor,
      model: candidate.model,
      connectionType: candidate.connectionType,
      transportMode:
        candidate.connectionType === 'cloud' ? 'cloud' : 'mobile_edge',
      externalDeviceRef: `${candidate.vendor.toLowerCase()}-${candidate.id}`,
      availabilityStatus: 'online',
      lastSeenAt: nowIso(),
      updatedAt: nowIso(),
    };
    this.devices.set(device.id, device);
    for (const capability of this.buildLightCapabilities(device.id)) {
      this.capabilities.set(capability.id, capability);
    }
    const snapshot: DeviceStateSnapshot = {
      id: uuidv7(),
      deviceId: device.id,
      observedAt: nowIso(),
      source: 'pairing',
      values: {
        power: false,
        brightness: 45,
        colorTemperature: 3800,
        onlineState: 'online',
      },
    };
    this.snapshots.set(snapshot.id, snapshot);
    const anchor: DeviceRoomAnchor = {
      id: uuidv7(),
      deviceId: device.id,
      roomId,
      x: 1,
      y: 1,
      anchorType: 'device',
    };
    this.deviceAnchors.set(anchor.id, anchor);
    pairing.status = 'completed';
    pairing.completedAt = nowIso();
    this.appendEvent(
      pairing.homeId,
      'device.state.changed',
      'info',
      { deviceId: device.id },
      userId,
    );
    this.writeAudit(
      userId,
      pairing.homeId,
      'pairing_session',
      pairing.id,
      'pairing.complete',
      'Completed smart bulb pairing',
    );
    return {
      pairingSession: pairing,
      device,
    };
  }

  cancelPairingSession(userId: string, pairingSessionId: string) {
    const pairing = this.getPairingSessionOrThrow(pairingSessionId);
    this.ensureHomeAccess(userId, pairing.homeId);
    pairing.status = 'cancelled';
    this.writeAudit(
      userId,
      pairing.homeId,
      'pairing_session',
      pairing.id,
      'pairing.cancel',
      'Cancelled pairing session',
    );
    return pairing;
  }

  getSnapshot(homeId: string, userId: string): HomeSnapshot {
    this.ensureHomeAccess(userId, homeId);
    const notifications = this.getNotifications(homeId, userId);
    const events = this.getEvents(homeId, userId, 0);
    const devices = this.getDevices(homeId, userId);
    const rooms = this.getRooms(homeId, userId);
    const home = this.getHome(homeId);
    const tasks: HomeSnapshot['tasks'] = [];
    const layout = this.getLayout(homeId, userId);
    const floors: HomeSnapshot['floors'] = [
      {
        id: `${homeId}-default-floor`,
        homeId,
        title: 'Основной этаж',
        sortOrder: 0,
        createdAt: nowIso(),
        updatedAt: nowIso(),
      },
    ];
    const preferences: HomeSnapshot['preferences'] = {
      userId,
      favoriteDeviceIds: devices.slice(0, 4).map((device) => device.id),
      allowedDeviceIds: devices
        .filter((device) =>
          ['light', 'climate', 'curtain', 'media'].includes(device.category),
        )
        .map((device) => device.id),
      pinnedSections: ['home', 'rooms', 'devices'],
      preferredHomeTab: 'home',
      themeMode: 'system',
      motionMode: 'standard',
      uiDensity: 'comfortable',
      activeFloorId: floors[0].id,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    return {
      home,
      family: null,
      members: this.getMembers(homeId, userId),
      floors,
      preferences,
      rooms,
      layoutBlocks: layout.blocks,
      layoutItems: layout.items,
      devices,
      capabilities: devices.flatMap((device) =>
        this.getCapabilities(device.id),
      ),
      latestStates: devices
        .map((device) => this.getLatestState(device.id))
        .filter(
          (snapshot): snapshot is DeviceStateSnapshot => snapshot !== null,
        ),
      tasks,
      notifications,
      favoriteDevices: devices.slice(0, 4),
      roomSummaries: rooms.map((room) => ({
        roomId: room.id,
        floorId: floors[0].id,
        title: room.title,
        type: room.type,
        deviceCount: devices.filter((device) => device.roomId === room.id)
          .length,
        taskCount: 0,
      })),
      securitySummary: {
        securityMode: home.securityMode,
        activeAlerts: events.filter((item) => item.severity === 'critical')
          .length,
        openEntries: 0,
        cameraCount: devices.filter((item) => item.category === 'camera')
          .length,
        lockCount: devices.filter((item) => item.category === 'lock').length,
      },
      familySummary: {
        totalMembers: this.getMembers(homeId, userId).length,
        adults: 1,
        children: 1,
        elderly: 0,
      },
      alerts: events.filter((item) => item.severity !== 'info').slice(0, 8),
      activityFeed: events.slice(-12).reverse(),
      integrationSummary: {
        connected: this.getIntegrations(homeId, userId).filter(
          (item) => item.status === 'connected',
        ).length,
        attentionNeeded: this.getIntegrations(homeId, userId).filter(
          (item) => item.status === 'attention_needed',
        ).length,
        providers: this.getIntegrations(homeId, userId).map(
          (item) => item.provider,
        ),
      },
      allowedDevicesForChild: devices.filter((device) =>
        preferences.allowedDeviceIds.includes(device.id),
      ),
      summary: {
        unreadNotifications: notifications.filter((item) => !item.readAt)
          .length,
        pendingTasks: tasks.filter((item) => item.status !== 'approved').length,
        onlineDevices: devices.filter(
          (item) => item.availabilityStatus === 'online',
        ).length,
        lastOffset: events.at(-1)?.offset ?? 0,
      },
      snapshotGeneratedAt: nowIso(),
    };
  }

  getSync(homeId: string, userId: string, afterOffset: number): SyncResponse {
    const events = this.getEvents(homeId, userId, afterOffset);
    return {
      homeId,
      afterOffset,
      latestOffset: events.at(-1)?.offset ?? afterOffset,
      events,
    };
  }

  getAuditLogs(homeId: string, userId: string) {
    const membership = this.ensureHomeAccess(userId, homeId);
    if (membership.role === 'guest') {
      throw forbidden(
        'audit_access_denied',
        'Guests cannot inspect audit logs',
      );
    }
    return [...this.auditLogs.values()].filter((log) => log.homeId === homeId);
  }

  private dispatchCommand(commandId: string) {
    const command = this.commands.get(commandId);
    if (!command || command.deliveryStatus !== 'queued') {
      return;
    }

    command.deliveryStatus = 'dispatched';
    this.appendEvent(
      command.homeId,
      'device.command.dispatched',
      'info',
      command,
      command.actorUserId,
    );

    setTimeout(() => {
      const current = this.commands.get(commandId);
      if (
        !current ||
        current.deliveryStatus === 'rejected' ||
        current.deliveryStatus === 'timed_out'
      ) {
        return;
      }
      current.deliveryStatus = 'acknowledged';
      current.acknowledgedAt = nowIso();
      this.appendEvent(
        current.homeId,
        'device.command.acknowledged',
        'info',
        current,
        current.actorUserId,
      );
      this.applySnapshotForCommand(current);
    }, 60);
  }

  private applySnapshotForCommand(command: CommandLog) {
    const snapshot: DeviceStateSnapshot = {
      id: uuidv7(),
      deviceId: command.deviceId,
      observedAt: nowIso(),
      source: 'demo-adapter',
      values: {
        ...(this.getLatestState(command.deviceId)?.values ?? {}),
        [command.capabilityKey]: command.requestedValue,
        onlineState: 'online',
      },
    };
    this.snapshots.set(snapshot.id, snapshot);
    command.deliveryStatus = 'reconciled';
    command.reconciledAt = snapshot.observedAt;

    const device = this.devices.get(command.deviceId);
    if (device) {
      device.lastSeenAt = snapshot.observedAt;
      device.availabilityStatus = 'online';
      device.updatedAt = snapshot.observedAt;
    }

    this.appendEvent(
      command.homeId,
      'device.state.changed',
      'info',
      snapshot.values,
      command.actorUserId,
    );
  }

  private buildCandidates(
    connectionType: PairingSession['discoveryMethod'],
  ): PairingCandidate[] {
    if (connectionType === 'matter') {
      return [
        {
          id: 'matter-bulb-1',
          label: 'Matter Bulb A19',
          vendor: 'Matter Labs',
          model: 'ML-A19',
          connectionType,
          signalStrength: 87,
        },
      ];
    }

    return [
      {
        id: 'lan-bulb-1',
        label: 'LAN Smart Bulb',
        vendor: 'LanLux',
        model: 'LL-100',
        connectionType,
        signalStrength: 74,
      },
    ];
  }

  private validateLayout(
    homeId: string,
    blocks: PutLayoutDto['blocks'],
    items: PutLayoutDto['items'],
    userId: string,
  ) {
    const roomIds = new Set(
      this.getRooms(homeId, userId).map((room) => room.id),
    );
    for (const block of blocks) {
      if (!roomIds.has(block.roomId)) {
        throw conflict(
          'layout_room_scope_invalid',
          'Layout block references a room outside the home',
        );
      }
    }

    const normalized = blocks.map((block, index) => ({
      id: `candidate-${index}`,
      ...block,
    }));
    for (let index = 0; index < normalized.length; index += 1) {
      for (
        let otherIndex = index + 1;
        otherIndex < normalized.length;
        otherIndex += 1
      ) {
        if (intersects(normalized[index], normalized[otherIndex])) {
          throw conflict('layout_overlap', 'Layout blocks cannot overlap');
        }
      }
    }

    for (const item of items) {
      if (item.kind !== 'device') {
        continue;
      }
      const blocksForRoom = normalized.filter(
        (block) => block.roomId === item.roomId,
      );
      const inside = blocksForRoom.some(
        (block) =>
          item.x >= block.x &&
          item.x < block.x + block.width &&
          item.y >= block.y &&
          item.y < block.y + block.height,
      );
      if (!inside) {
        throw conflict(
          'anchor_outside_room',
          'Device anchor must be inside the owning room',
        );
      }
    }
  }

  private validateCommandValue(capability: DeviceCapability, value: unknown) {
    if (
      typeof value === 'number' &&
      capability.rangeMin !== null &&
      capability.rangeMin !== undefined &&
      value < capability.rangeMin
    ) {
      throw conflict(
        'capability_range',
        'Requested value is below the minimum range',
      );
    }

    if (
      typeof value === 'number' &&
      capability.rangeMax !== null &&
      capability.rangeMax !== undefined &&
      value > capability.rangeMax
    ) {
      throw conflict(
        'capability_range',
        'Requested value is above the maximum range',
      );
    }

    if (
      capability.allowedOptions &&
      !capability.allowedOptions.includes(String(value))
    ) {
      throw conflict(
        'capability_option',
        'Requested value is not part of the allowed options',
      );
    }
  }

  private appendEvent(
    homeId: string,
    topic: string,
    severity: EventSeverity,
    payload: object,
    userId?: string | null,
  ) {
    const payloadRecord = payload as Record<string, unknown>;
    const event: EventRecord = {
      id: uuidv7(),
      homeId,
      roomId: null,
      deviceId:
        typeof payloadRecord.deviceId === 'string'
          ? payloadRecord.deviceId
          : null,
      userId: userId ?? null,
      topic,
      severity,
      payload: payloadRecord,
      createdAt: nowIso(),
      offset: ++this.eventOffset,
    };
    this.events.set(event.id, event);
    this.realtimeService.publish({
      eventId: event.id,
      schemaVersion: 1,
      homeId,
      topic,
      offset: event.offset,
      occurredAt: event.createdAt,
      correlationId:
        typeof payloadRecord.correlationId === 'string' ||
        typeof payloadRecord.correlationId === 'number'
          ? String(payloadRecord.correlationId)
          : event.id,
      data: payloadRecord,
    });
    return event;
  }

  private writeAudit(
    actorUserId: string,
    homeId: string,
    targetType: string,
    targetId: string,
    action: string,
    reason: string,
  ) {
    const log: AuditLog = {
      id: uuidv7(),
      actorUserId,
      homeId,
      targetType,
      targetId,
      action,
      reason,
      payloadHash: hashToken(
        `${actorUserId}:${targetType}:${targetId}:${action}:${reason}`,
      ),
      createdAt: nowIso(),
    };
    this.auditLogs.set(log.id, log);
    return log;
  }

  private getPairingSessionOrThrow(pairingSessionId: string) {
    const pairing = this.pairingSessions.get(pairingSessionId);
    if (!pairing) {
      throw notFound(
        'pairing_session_not_found',
        'Pairing session was not found',
      );
    }
    if (
      new Date(pairing.expiresAt).getTime() < Date.now() &&
      pairing.status !== 'completed'
    ) {
      pairing.status = 'expired';
      throw conflict('pairing_session_expired', 'Pairing session has expired');
    }
    return pairing;
  }

  private buildLightCapabilities(deviceId: string): DeviceCapability[] {
    const createdAt = nowIso();
    return [
      {
        id: uuidv7(),
        deviceId,
        key: 'power',
        type: 'boolean',
        readable: true,
        writable: true,
        unit: null,
        rangeMin: null,
        rangeMax: null,
        step: null,
        allowedOptions: null,
        validationRules: {},
        source: 'adapter',
        lastSyncAt: createdAt,
        freshness: 'fresh',
        quality: 'good',
      },
      {
        id: uuidv7(),
        deviceId,
        key: 'brightness',
        type: 'integer',
        readable: true,
        writable: true,
        unit: '%',
        rangeMin: 1,
        rangeMax: 100,
        step: 1,
        allowedOptions: null,
        validationRules: {},
        source: 'adapter',
        lastSyncAt: createdAt,
        freshness: 'fresh',
        quality: 'good',
      },
      {
        id: uuidv7(),
        deviceId,
        key: 'colorTemperature',
        type: 'integer',
        readable: true,
        writable: true,
        unit: 'K',
        rangeMin: 2700,
        rangeMax: 6500,
        step: 100,
        allowedOptions: null,
        validationRules: {},
        source: 'adapter',
        lastSyncAt: createdAt,
        freshness: 'fresh',
        quality: 'good',
      },
      {
        id: uuidv7(),
        deviceId,
        key: 'onlineState',
        type: 'enum',
        readable: true,
        writable: false,
        unit: null,
        rangeMin: null,
        rangeMax: null,
        step: null,
        allowedOptions: ['online', 'degraded', 'offline'],
        validationRules: {},
        source: 'derived',
        lastSyncAt: createdAt,
        freshness: 'fresh',
        quality: 'good',
      },
    ];
  }

  private createSnapshot(
    deviceId: string,
    source: string,
    values: Record<string, unknown>,
  ): DeviceStateSnapshot {
    return {
      id: uuidv7(),
      deviceId,
      observedAt: nowIso(),
      source,
      values,
    };
  }

  private seed() {
    if (this.users.size > 0) {
      return;
    }

    const now = nowIso();
    const user: User = {
      id: uuidv7(),
      email: DEMO_EMAIL,
      loginIdentifier: DEMO_EMAIL,
      identifierType: 'email',
      birthYear: 1990,
      accountMode: 'adult',
      displayName: 'Алексей Орлов',
      locale: 'ru-RU',
      createdAt: now,
      updatedAt: now,
    };
    const guest: User = {
      id: uuidv7(),
      email: 'guest@rosdom.local',
      loginIdentifier: 'guest@rosdom.local',
      identifierType: 'email',
      birthYear: 2015,
      accountMode: 'child',
      displayName: 'Гость',
      locale: 'ru-RU',
      createdAt: now,
      updatedAt: now,
    };
    this.users.set(user.id, user);
    this.users.set(guest.id, guest);

    const home: Home = {
      id: uuidv7(),
      title: 'Квартира на Ленина',
      addressLabel: 'Якутск, ул. Ленина, 8',
      timezone: 'Asia/Yakutsk',
      ownerUserId: user.id,
      currentMode: 'home',
      securityMode: 'disarmed',
      updatedAt: now,
      layoutRevision: 1,
    };
    this.homes.set(home.id, home);

    const ownerMember: HomeMember = {
      id: uuidv7(),
      homeId: home.id,
      userId: user.id,
      role: 'owner',
      status: 'active',
      createdAt: now,
    };
    const guestMember: HomeMember = {
      id: uuidv7(),
      homeId: home.id,
      userId: guest.id,
      role: 'guest',
      status: 'active',
      createdAt: now,
    };
    this.members.set(ownerMember.id, ownerMember);
    this.members.set(guestMember.id, guestMember);

    const livingRoom: Room = {
      id: uuidv7(),
      homeId: home.id,
      title: 'Гостиная',
      type: 'living_room',
      sortOrder: 0,
      updatedAt: now,
    };
    const bedroom: Room = {
      id: uuidv7(),
      homeId: home.id,
      title: 'Спальня',
      type: 'bedroom',
      sortOrder: 1,
      updatedAt: now,
    };
    const hallway: Room = {
      id: uuidv7(),
      homeId: home.id,
      title: 'Прихожая',
      type: 'hallway',
      sortOrder: 2,
      updatedAt: now,
    };
    [livingRoom, bedroom, hallway].forEach((room) =>
      this.rooms.set(room.id, room),
    );

    const blocks: RoomLayoutBlock[] = [
      {
        id: uuidv7(),
        roomId: livingRoom.id,
        x: 0,
        y: 0,
        width: 4,
        height: 3,
        zIndex: 0,
      },
      {
        id: uuidv7(),
        roomId: bedroom.id,
        x: 4,
        y: 0,
        width: 3,
        height: 3,
        zIndex: 0,
      },
      {
        id: uuidv7(),
        roomId: hallway.id,
        x: 0,
        y: 3,
        width: 7,
        height: 1,
        zIndex: 0,
      },
    ];
    blocks.forEach((block) => this.layoutBlocks.set(block.id, block));

    const devices = this.seedDevices(
      home.id,
      livingRoom.id,
      bedroom.id,
      hallway.id,
    );
    devices.forEach((device) => this.devices.set(device.id, device));

    const anchors: DeviceRoomAnchor[] = [
      {
        id: uuidv7(),
        deviceId: devices[0].id,
        roomId: livingRoom.id,
        x: 1,
        y: 1,
        anchorType: 'light',
      },
      {
        id: uuidv7(),
        deviceId: devices[1].id,
        roomId: bedroom.id,
        x: 5,
        y: 1,
        anchorType: 'climate',
      },
      {
        id: uuidv7(),
        deviceId: devices[2].id,
        roomId: hallway.id,
        x: 1,
        y: 3,
        anchorType: 'sensor',
      },
    ];
    anchors.forEach((anchor) => this.deviceAnchors.set(anchor.id, anchor));

    devices.forEach((device) => {
      const capabilities =
        device.category === 'light'
          ? this.buildLightCapabilities(device.id)
          : [
              {
                id: uuidv7(),
                deviceId: device.id,
                key: 'onlineState',
                type: 'enum',
                readable: true,
                writable: false,
                unit: null,
                rangeMin: null,
                rangeMax: null,
                step: null,
                allowedOptions: ['online', 'degraded', 'offline'],
                validationRules: {},
                source: 'derived',
                lastSyncAt: now,
                freshness: 'fresh',
                quality: 'good',
              } as DeviceCapability,
            ];
      capabilities.forEach((capability) =>
        this.capabilities.set(capability.id, capability),
      );
    });

    const lightSnapshot = this.createSnapshot(devices[0].id, 'seed', {
      power: true,
      brightness: 72,
      colorTemperature: 4000,
      onlineState: 'online',
    });
    const climateSnapshot = this.createSnapshot(devices[1].id, 'seed', {
      temperature: 22.4,
      humidity: 41,
      onlineState: 'online',
    });
    const sensorSnapshot = this.createSnapshot(devices[2].id, 'seed', {
      motion: false,
      onlineState: 'online',
    });
    [lightSnapshot, climateSnapshot, sensorSnapshot].forEach((snapshot) =>
      this.snapshots.set(snapshot.id, snapshot),
    );

    const firmware: FirmwareRecord = {
      id: uuidv7(),
      deviceId: devices[0].id,
      version: '1.2.4',
      channel: 'stable',
      recordedAt: now,
    };
    this.firmwareRecords.set(firmware.id, firmware);

    const scenario: Scenario = {
      id: uuidv7(),
      homeId: home.id,
      title: 'Доброй ночи',
      description: 'Выключает свет и переводит квартиру в ночной режим.',
      iconKey: 'moon',
      enabled: true,
      executionMode: 'manual',
      updatedAt: now,
    };
    this.scenarios.set(scenario.id, scenario);

    const event = this.appendEvent(
      home.id,
      'security.alert.created',
      'warning',
      {
        title: 'Движение у входа',
        deviceId: devices[2].id,
      },
      user.id,
    );
    const notification: NotificationRecord = {
      id: uuidv7(),
      userId: user.id,
      homeId: home.id,
      eventId: event.id,
      type: 'security',
      title: 'Движение у входа',
      body: 'Датчик в прихожей зафиксировал движение 2 минуты назад.',
      readAt: null,
      createdAt: now,
    };
    this.notifications.set(notification.id, notification);

    const integration: IntegrationAccount = {
      id: uuidv7(),
      homeId: home.id,
      provider: 'matter',
      status: 'connected',
      createdAt: now,
      updatedAt: now,
    };
    this.integrations.set(integration.id, integration);
  }

  private seedDevices(
    homeId: string,
    livingRoomId: string,
    bedroomId: string,
    hallwayId: string,
  ): Device[] {
    const createdAt = nowIso();
    return [
      {
        id: uuidv7(),
        homeId,
        roomId: livingRoomId,
        name: 'Свет в гостиной',
        category: 'light',
        vendor: 'Matter Labs',
        model: 'ML-A19',
        connectionType: 'matter',
        transportMode: 'mobile_edge',
        externalDeviceRef: 'matter-ml-a19',
        availabilityStatus: 'online',
        lastSeenAt: createdAt,
        updatedAt: createdAt,
      },
      {
        id: uuidv7(),
        homeId,
        roomId: bedroomId,
        name: 'Увлажнитель',
        category: 'humidifier',
        vendor: 'RosDom Demo',
        model: 'AIR-02',
        connectionType: 'cloud',
        transportMode: 'cloud',
        externalDeviceRef: 'humidifier-air-02',
        availabilityStatus: 'online',
        lastSeenAt: createdAt,
        updatedAt: createdAt,
      },
      {
        id: uuidv7(),
        homeId,
        roomId: hallwayId,
        name: 'Датчик движения',
        category: 'sensor',
        vendor: 'LanLux',
        model: 'LL-MOTION',
        connectionType: 'lan',
        transportMode: 'mobile_edge',
        externalDeviceRef: 'll-motion-1',
        availabilityStatus: 'online',
        lastSeenAt: createdAt,
        updatedAt: createdAt,
      },
    ];
  }

  private mapAnchorToLayoutItem(
    homeId: string,
    anchor: DeviceRoomAnchor,
  ): LayoutItem {
    return {
      id: anchor.id,
      homeId,
      roomId: anchor.roomId,
      kind: 'device',
      subtype: anchor.anchorType,
      title: this.devices.get(anchor.deviceId)?.name ?? null,
      x: anchor.x,
      y: anchor.y,
      width: 1,
      height: 1,
      rotation: 0,
      metadata: {
        deviceId: anchor.deviceId,
      },
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
  }
}

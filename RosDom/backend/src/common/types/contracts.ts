export type Role = 'owner' | 'member' | 'guest';
export type AccountMode = 'child' | 'adult' | 'elderly';
export type IdentifierType = 'email' | 'phone';
export type MemberStatus = 'active' | 'invited' | 'revoked';
export type FamilyInviteStatus = 'active' | 'claimed' | 'expired' | 'revoked';
export type HomeMode = 'home' | 'away' | 'night';
export type SecurityMode = 'armed' | 'disarmed' | 'night';
export type DeviceCategory =
  | 'light'
  | 'switch'
  | 'camera'
  | 'sensor'
  | 'climate'
  | 'curtain'
  | 'plug'
  | 'lock'
  | 'humidifier'
  | 'media'
  | 'other';
export type AvailabilityStatus = 'online' | 'degraded' | 'offline';
export type ConnectionType = 'matter' | 'lan' | 'cloud' | 'bridge';
export type TransportMode = 'mobile_edge' | 'cloud' | 'bridge';
export type CapabilityKey =
  | 'power'
  | 'brightness'
  | 'colorTemperature'
  | 'rgb'
  | 'temperature'
  | 'humidity'
  | 'motion'
  | 'contact'
  | 'lock'
  | 'airQuality'
  | 'curtainPosition'
  | 'onlineState';
export type CapabilityType =
  | 'boolean'
  | 'integer'
  | 'decimal'
  | 'enum'
  | 'color'
  | 'string';
export type CommandStatus =
  | 'queued'
  | 'dispatched'
  | 'acknowledged'
  | 'rejected'
  | 'timed_out'
  | 'reconciled';
export type PairingStatus =
  | 'created'
  | 'discovering'
  | 'candidate_selected'
  | 'completed'
  | 'cancelled'
  | 'expired';
export type ScenarioExecutionMode =
  | 'manual'
  | 'scheduled'
  | 'sensor'
  | 'geofence';
export type EventSeverity = 'info' | 'warning' | 'critical';
export type NotificationType = 'security' | 'device' | 'automation' | 'system';
export type LayoutItemKind =
  | 'furniture'
  | 'door'
  | 'window'
  | 'device'
  | 'task';
export type TaskStatus = 'pending' | 'submitted' | 'approved' | 'rejected';
export type RewardType = 'money' | 'time' | 'event';
export type UiDensity = 'compact' | 'comfortable' | 'large';
export type ThemeMode = 'system' | 'light' | 'dark';
export type MotionMode = 'standard' | 'reduced';
export type TuyaLinkSessionStatus = 'pending' | 'linked' | 'expired' | 'failed';

export interface AuthenticatedUser {
  id: string;
  email: string | null;
  loginIdentifier: string;
  identifierType: IdentifierType;
  displayName: string;
  accountMode: AccountMode;
  sessionId: string;
}

export interface User {
  id: string;
  email: string | null;
  loginIdentifier: string;
  identifierType: IdentifierType;
  displayName: string;
  birthYear: number;
  accountMode: AccountMode;
  locale: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserSession {
  id: string;
  userId: string;
  refreshTokenHash: string;
  deviceName: string;
  createdAt: string;
  expiresAt: string;
  revokedAt?: string | null;
}

export interface Family {
  id: string;
  title: string;
  ownerUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface FamilyMember {
  id: string;
  familyId: string;
  userId: string;
  guardianUserId?: string | null;
  status: MemberStatus;
  createdAt: string;
}

export interface FamilyInvite {
  id: string;
  familyId: string;
  code: string;
  targetAccountMode: AccountMode;
  createdByUserId: string;
  claimedByUserId?: string | null;
  status: FamilyInviteStatus;
  expiresAt: string;
  claimedAt?: string | null;
  createdAt: string;
}

export interface Home {
  id: string;
  familyId?: string | null;
  title: string;
  addressLabel: string;
  timezone: string;
  ownerUserId: string;
  currentMode: HomeMode;
  securityMode: SecurityMode;
  updatedAt: string;
  layoutRevision: number;
}

export interface HomeMember {
  id: string;
  homeId: string;
  userId: string;
  role: Role;
  status: MemberStatus;
  createdAt: string;
}

export interface Floor {
  id: string;
  homeId: string;
  title: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface Room {
  id: string;
  homeId: string;
  floorId?: string | null;
  title: string;
  type: string;
  sortOrder: number;
  updatedAt: string;
}

export interface RoomLayoutBlock {
  id: string;
  roomId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  zIndex: number;
}

export interface LayoutItem {
  id: string;
  homeId: string;
  roomId: string;
  floorId?: string | null;
  kind: LayoutItemKind;
  subtype: string;
  title?: string | null;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface DeviceRoomAnchor {
  id: string;
  deviceId: string;
  roomId: string;
  x: number;
  y: number;
  anchorType: string;
}

export interface Device {
  id: string;
  homeId: string;
  roomId: string;
  name: string;
  category: DeviceCategory;
  vendor: string;
  model: string;
  connectionType: ConnectionType;
  transportMode: TransportMode;
  externalDeviceRef: string;
  availabilityStatus: AvailabilityStatus;
  lastSeenAt: string;
  updatedAt: string;
}

export interface DeviceCapability {
  id: string;
  deviceId: string;
  key: CapabilityKey;
  type: CapabilityType;
  readable: boolean;
  writable: boolean;
  unit?: string | null;
  rangeMin?: number | null;
  rangeMax?: number | null;
  step?: number | null;
  allowedOptions?: string[] | null;
  validationRules?: Record<string, unknown>;
  source: string;
  lastSyncAt: string;
  freshness: 'fresh' | 'stale';
  quality: 'good' | 'uncertain';
}

export interface DeviceStateSnapshot {
  id: string;
  deviceId: string;
  observedAt: string;
  source: string;
  values: Record<string, unknown>;
}

export interface FirmwareRecord {
  id: string;
  deviceId: string;
  version: string;
  channel: string;
  recordedAt: string;
}

export interface DeviceMediaAsset {
  id: string;
  vendor: string;
  model: string;
  sourceUrl: string;
  imageUrl: string;
  licenseNote: string;
  createdAt: string;
}

export interface CommandLog {
  id: string;
  homeId: string;
  deviceId: string;
  capabilityKey: CapabilityKey;
  requestedValue: unknown;
  requestedAt: string;
  actorUserId: string;
  idempotencyKey: string;
  deliveryStatus: CommandStatus;
  failureReason?: string | null;
  externalCommandRef?: string | null;
  acknowledgedAt?: string | null;
  reconciledAt?: string | null;
}

export interface Scenario {
  id: string;
  homeId: string;
  title: string;
  description: string;
  iconKey: string;
  enabled: boolean;
  executionMode: ScenarioExecutionMode;
  updatedAt: string;
}

export interface ScenarioTrigger {
  id: string;
  scenarioId: string;
  type: string;
  config: Record<string, unknown>;
}

export interface ScenarioCondition {
  id: string;
  scenarioId: string;
  operator: string;
  subject: string;
  value: unknown;
  logicalGroup: string;
}

export interface ScenarioAction {
  id: string;
  scenarioId: string;
  targetType: string;
  targetId: string;
  capabilityKey: CapabilityKey;
  actionType: string;
  payload: Record<string, unknown>;
  delayMs: number;
}

export interface AutomationRun {
  id: string;
  scenarioId: string;
  homeId: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  startedAt: string;
  finishedAt?: string | null;
}

export interface TaskRecord {
  id: string;
  homeId: string;
  familyId?: string | null;
  floorId?: string | null;
  roomId?: string | null;
  assigneeUserId: string;
  createdByUserId: string;
  approvedByUserId?: string | null;
  title: string;
  description: string;
  rewardType: RewardType;
  rewardValue: number;
  rewardDescription: string;
  targetX?: number | null;
  targetY?: number | null;
  status: TaskStatus;
  deadlineAt?: string | null;
  submittedAt?: string | null;
  approvedAt?: string | null;
  rejectedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TaskSubmission {
  id: string;
  taskId: string;
  submittedByUserId: string;
  note?: string | null;
  status: TaskStatus;
  createdAt: string;
}

export interface RewardBalance {
  userId: string;
  homeId: string;
  balance: number;
  updatedAt: string;
}

export interface RewardLedgerEntry {
  id: string;
  userId: string;
  homeId: string;
  taskId?: string | null;
  delta: number;
  entryType: RewardType;
  description: string;
  createdAt: string;
}

export interface UserPreferences {
  userId: string;
  favoriteDeviceIds: string[];
  allowedDeviceIds: string[];
  pinnedSections: string[];
  preferredHomeTab: string;
  uiDensity: UiDensity;
  themeMode: ThemeMode;
  motionMode: MotionMode;
  activeFloorId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RoomSummary {
  roomId: string;
  floorId?: string | null;
  title: string;
  type: string;
  deviceCount: number;
  taskCount: number;
}

export interface SecuritySummary {
  securityMode: SecurityMode;
  activeAlerts: number;
  openEntries: number;
  cameraCount: number;
  lockCount: number;
}

export interface FamilySummary {
  totalMembers: number;
  adults: number;
  children: number;
  elderly: number;
}

export interface IntegrationSummary {
  connected: number;
  attentionNeeded: number;
  providers: string[];
}

export interface EventRecord {
  id: string;
  homeId: string;
  roomId?: string | null;
  deviceId?: string | null;
  userId?: string | null;
  topic: string;
  severity: EventSeverity;
  payload: Record<string, unknown>;
  createdAt: string;
  offset: number;
}

export interface NotificationRecord {
  id: string;
  userId: string;
  homeId: string;
  eventId?: string | null;
  type: NotificationType;
  title: string;
  body: string;
  readAt?: string | null;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  actorUserId: string;
  homeId?: string | null;
  targetType: string;
  targetId: string;
  action: string;
  reason: string;
  payloadHash: string;
  createdAt: string;
}

export interface IntegrationAccount {
  id: string;
  homeId: string;
  provider: string;
  status: 'connected' | 'attention_needed';
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface IntegrationSyncResult {
  provider: string;
  homeId: string;
  status: 'connected' | 'attention_needed';
  syncedDevices: number;
  syncedAt: string;
}

export interface TuyaLinkSession {
  id: string;
  homeId: string;
  provider: 'tuya';
  status: TuyaLinkSessionStatus;
  accountLabel: string;
  region: string;
  userCode: string;
  authorizationUrl: string;
  verificationUri: string;
  expiresAt: string;
  integrationId?: string | null;
  failureCode?: string | null;
  failureMessage?: string | null;
  linkedAt?: string | null;
  createdByUserId: string;
  createdAt: string;
  updatedAt: string;
}

export interface PairingCandidate {
  id: string;
  label: string;
  vendor: string;
  model: string;
  connectionType: ConnectionType;
  signalStrength: number;
}

export interface PairingSession {
  id: string;
  publicToken: string;
  homeId: string;
  actorUserId: string;
  deviceType: string;
  discoveryMethod: ConnectionType;
  status: PairingStatus;
  expiresAt: string;
  createdAt: string;
  completedAt?: string | null;
  selectedCandidateId?: string | null;
  candidateListHash?: string | null;
  candidates: PairingCandidate[];
}

export interface DeviceDetails {
  device: Device;
  capabilities: DeviceCapability[];
  latestState: DeviceStateSnapshot | null;
  commands: CommandLog[];
  firmware: FirmwareRecord[];
  mediaAsset?: DeviceMediaAsset | null;
}

export interface HomeSnapshot {
  home: Home;
  family: Family | null;
  members: HomeMember[];
  floors: Floor[];
  preferences: UserPreferences;
  rooms: Room[];
  layoutBlocks: RoomLayoutBlock[];
  layoutItems: LayoutItem[];
  devices: Device[];
  capabilities: DeviceCapability[];
  latestStates: DeviceStateSnapshot[];
  tasks: TaskRecord[];
  notifications: NotificationRecord[];
  favoriteDevices: Device[];
  roomSummaries: RoomSummary[];
  securitySummary: SecuritySummary;
  familySummary: FamilySummary;
  alerts: EventRecord[];
  activityFeed: EventRecord[];
  integrationSummary: IntegrationSummary;
  allowedDevicesForChild: Device[];
  summary: {
    unreadNotifications: number;
    pendingTasks: number;
    onlineDevices: number;
    lastOffset: number;
  };
  snapshotGeneratedAt: string;
}

export interface SyncResponse {
  homeId: string;
  afterOffset: number;
  latestOffset: number;
  events: EventRecord[];
}

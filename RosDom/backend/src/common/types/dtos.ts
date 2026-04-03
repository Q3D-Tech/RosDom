import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  type AccountMode,
  type CapabilityKey,
  type CommandStatus,
  type ConnectionType,
  type HomeMode,
  type IdentifierType,
  type RewardType,
  type Role,
  type ScenarioExecutionMode,
  type SecurityMode,
  type TaskStatus,
  type ThemeMode,
  type MotionMode,
  type UiDensity,
} from './contracts';

const HOME_MODES: HomeMode[] = ['home', 'away', 'night'];
const SECURITY_MODES: SecurityMode[] = ['armed', 'disarmed', 'night'];
const CONNECTION_TYPES: ConnectionType[] = ['matter', 'lan', 'cloud', 'bridge'];
const SCENARIO_EXECUTION_MODES: ScenarioExecutionMode[] = [
  'manual',
  'scheduled',
  'sensor',
  'geofence',
];
const ROLES: Role[] = ['owner', 'member', 'guest'];
const COMMAND_STATUSES: CommandStatus[] = [
  'queued',
  'dispatched',
  'acknowledged',
  'rejected',
  'timed_out',
  'reconciled',
];
const CAPABILITY_KEYS: CapabilityKey[] = [
  'power',
  'brightness',
  'colorTemperature',
  'rgb',
  'temperature',
  'humidity',
  'motion',
  'contact',
  'lock',
  'airQuality',
  'curtainPosition',
  'onlineState',
];
const IDENTIFIER_TYPES: IdentifierType[] = ['email', 'phone'];
const ACCOUNT_MODES: AccountMode[] = ['child', 'adult', 'elderly'];
const REWARD_TYPES: RewardType[] = ['money', 'time', 'event'];
const TASK_STATUSES: TaskStatus[] = [
  'pending',
  'submitted',
  'approved',
  'rejected',
];
const UI_DENSITIES: UiDensity[] = ['compact', 'comfortable', 'large'];
const THEME_MODES: ThemeMode[] = ['system', 'light', 'dark'];
const MOTION_MODES: MotionMode[] = ['standard', 'reduced'];

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  loginIdentifier!: string;

  @IsIn(IDENTIFIER_TYPES)
  identifierType!: IdentifierType;

  @IsString()
  @IsNotEmpty()
  password!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsInt()
  @Min(1916)
  @Max(2026)
  birthYear!: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  familyInviteCode?: string;

  @IsOptional()
  @IsString()
  deviceName?: string;
}

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  loginIdentifier!: string;

  @IsString()
  @IsNotEmpty()
  password!: string;

  @IsOptional()
  @IsString()
  deviceName?: string;
}

export class RefreshDto {
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  displayName?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  locale?: string;
}

export class UpdateUserPreferencesDto {
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  favoriteDeviceIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  allowedDeviceIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  pinnedSections?: string[];

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  preferredHomeTab?: string;

  @IsOptional()
  @IsIn(UI_DENSITIES)
  uiDensity?: UiDensity;

  @IsOptional()
  @IsIn(THEME_MODES)
  themeMode?: ThemeMode;

  @IsOptional()
  @IsIn(MOTION_MODES)
  motionMode?: MotionMode;

  @IsOptional()
  @IsUUID()
  activeFloorId?: string;
}

export class UpdateBirthYearDto {
  @IsInt()
  @Min(1916)
  @Max(2026)
  birthYear!: number;
}

export class CreateFamilyDto {
  @IsString()
  @IsNotEmpty()
  title!: string;
}

export class CreateFamilyInviteDto {
  @IsIn(ACCOUNT_MODES)
  targetAccountMode!: AccountMode;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  expiresInHours?: number;
}

export class JoinFamilyDto {
  @IsString()
  @IsNotEmpty()
  code!: string;
}

export class ConnectTuyaIntegrationDto {
  @IsUUID()
  homeId!: string;

  @IsString()
  @IsNotEmpty()
  accountLabel!: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  region?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  loginIdentifier?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  password?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  countryCode?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  appSchema?: string;

  @IsOptional()
  @IsString()
  accessToken?: string;

  @IsOptional()
  @IsString()
  refreshToken?: string;
}

export class TuyaOAuthCallbackQueryDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  state?: string;

  @IsOptional()
  @IsString()
  error?: string;

  @IsOptional()
  @IsString()
  errorCode?: string;

  @IsOptional()
  @IsString()
  errorMessage?: string;
}

export class CreateTuyaLinkSessionDto {
  @IsUUID()
  homeId!: string;

  @IsString()
  @IsNotEmpty()
  accountLabel!: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  region?: string;
}

export class SyncIntegrationDto {
  @IsUUID()
  homeId!: string;
}

export class CreateHomeDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  addressLabel!: string;

  @IsString()
  @IsNotEmpty()
  timezone!: string;
}

export class CreateFloorDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class UpdateFloorDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class UpdateHomeStateDto {
  @IsOptional()
  @IsIn(HOME_MODES)
  currentMode?: HomeMode;

  @IsOptional()
  @IsIn(SECURITY_MODES)
  securityMode?: SecurityMode;
}

export class CreateRoomDto {
  @IsOptional()
  @IsUUID()
  floorId?: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  type!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class UpdateRoomDto {
  @IsOptional()
  @IsUUID()
  floorId?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  type?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

export class LayoutBlockDto {
  @IsUUID()
  roomId!: string;

  @IsInt()
  x!: number;

  @IsInt()
  y!: number;

  @IsInt()
  @Min(1)
  width!: number;

  @IsInt()
  @Min(1)
  height!: number;

  @IsInt()
  zIndex!: number;
}

export class LayoutItemDto {
  @IsOptional()
  @IsUUID()
  id?: string;

  @IsOptional()
  @IsUUID()
  floorId?: string;

  @IsUUID()
  roomId!: string;

  @IsIn(['furniture', 'door', 'window', 'device', 'task'])
  kind!: 'furniture' | 'door' | 'window' | 'device' | 'task';

  @IsString()
  @IsNotEmpty()
  subtype!: string;

  @IsOptional()
  @IsString()
  title?: string;

  @IsInt()
  x!: number;

  @IsInt()
  y!: number;

  @IsInt()
  @Min(1)
  width!: number;

  @IsInt()
  @Min(1)
  height!: number;

  @IsOptional()
  @IsInt()
  rotation?: number;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class PutLayoutDto {
  @IsInt()
  @Min(0)
  revision!: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => LayoutBlockDto)
  blocks!: LayoutBlockDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => LayoutItemDto)
  items!: LayoutItemDto[];
}

export class PatchLayoutDto extends PutLayoutDto {}

export class LayoutQueryDto {
  @IsOptional()
  @IsUUID()
  floorId?: string;
}

export class SubmitCommandDto {
  @IsIn(CAPABILITY_KEYS)
  capabilityKey!: CapabilityKey;

  @IsNotEmpty()
  requestedValue!: unknown;
}

export class UpdateDevicePlacementDto {
  @IsUUID()
  roomId!: string;

  @IsOptional()
  @IsUUID()
  floorId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  markerX?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  markerY?: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  markerTitle?: string;
}

export class CreatePairingSessionDto {
  @IsUUID()
  homeId!: string;

  @IsString()
  @IsNotEmpty()
  deviceType!: string;

  @IsIn(CONNECTION_TYPES)
  discoveryMethod!: ConnectionType;
}

export class SelectCandidateDto {
  @IsString()
  @IsNotEmpty()
  candidateId!: string;
}

export class CompletePairingSessionDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  deviceName?: string;

  @IsOptional()
  @IsUUID()
  roomId?: string;
}

export class CreateScenarioDto {
  @IsUUID()
  homeId!: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsString()
  @IsNotEmpty()
  iconKey!: string;

  @IsIn(SCENARIO_EXECUTION_MODES)
  executionMode!: ScenarioExecutionMode;
}

export class UpdateScenarioDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  iconKey?: string;

  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsIn(SCENARIO_EXECUTION_MODES)
  executionMode?: ScenarioExecutionMode;
}

export class InviteMemberDto {
  @IsUUID()
  homeId!: string;

  @IsString()
  @IsNotEmpty()
  userId!: string;

  @IsIn(ROLES)
  role!: Role;
}

export class UpdateMemberDto {
  @IsOptional()
  @IsIn(ROLES)
  role?: Role;

  @IsOptional()
  @IsIn(['active', 'invited', 'revoked'])
  status?: 'active' | 'invited' | 'revoked';
}

export class CreateTaskDto {
  @IsUUID()
  homeId!: string;

  @IsOptional()
  @IsUUID()
  floorId?: string;

  @IsUUID()
  assigneeUserId!: string;

  @IsOptional()
  @IsUUID()
  roomId?: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsString()
  @IsNotEmpty()
  description!: string;

  @IsIn(REWARD_TYPES)
  rewardType!: RewardType;

  @IsInt()
  @Min(1)
  rewardValue!: number;

  @IsString()
  @IsNotEmpty()
  rewardDescription!: string;

  @IsOptional()
  @IsInt()
  targetX?: number;

  @IsOptional()
  @IsInt()
  targetY?: number;

  @IsOptional()
  @IsString()
  deadlineAt?: string;
}

export class UpdateTaskDto {
  @IsOptional()
  @IsUUID()
  floorId?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  description?: string;

  @IsOptional()
  @IsIn(REWARD_TYPES)
  rewardType?: RewardType;

  @IsOptional()
  @IsInt()
  @Min(1)
  rewardValue?: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  rewardDescription?: string;

  @IsOptional()
  @IsUUID()
  roomId?: string;

  @IsOptional()
  @IsInt()
  targetX?: number;

  @IsOptional()
  @IsInt()
  targetY?: number;

  @IsOptional()
  @IsIn(TASK_STATUSES)
  status?: TaskStatus;

  @IsOptional()
  @IsString()
  deadlineAt?: string;
}

export class SubmitTaskCompletionDto {
  @IsOptional()
  @IsString()
  note?: string;
}

export class ReviewTaskDto {
  @IsOptional()
  @IsBoolean()
  approved!: boolean;

  @IsOptional()
  @IsString()
  note?: string;
}

export class MarkNotificationReadDto {
  @IsOptional()
  @IsString()
  reason?: string;
}

export class CommandStatusQueryDto {
  @IsOptional()
  @IsIn(COMMAND_STATUSES)
  expectedStatus?: CommandStatus;
}

export class SyncQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(0)
  afterOffset!: number;
}

export class EventQueryDto {
  @IsOptional()
  @IsUUID()
  homeId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  afterOffset?: number;
}

export class DiscoverCandidatesDto {
  @IsOptional()
  @IsObject()
  hints?: Record<string, unknown>;
}

import { type AccountMode, type CapabilityKey, type CommandStatus, type ConnectionType, type HomeMode, type IdentifierType, type RewardType, type Role, type ScenarioExecutionMode, type SecurityMode, type TaskStatus, type ThemeMode, type MotionMode, type UiDensity } from './contracts';
export declare class RegisterDto {
    loginIdentifier: string;
    identifierType: IdentifierType;
    password: string;
    name: string;
    birthYear: number;
    familyInviteCode?: string;
    deviceName?: string;
}
export declare class LoginDto {
    loginIdentifier: string;
    password: string;
    deviceName?: string;
}
export declare class RefreshDto {
    refreshToken: string;
}
export declare class UpdateProfileDto {
    displayName?: string;
    locale?: string;
}
export declare class UpdateUserPreferencesDto {
    favoriteDeviceIds?: string[];
    allowedDeviceIds?: string[];
    pinnedSections?: string[];
    preferredHomeTab?: string;
    uiDensity?: UiDensity;
    themeMode?: ThemeMode;
    motionMode?: MotionMode;
    activeFloorId?: string;
}
export declare class UpdateBirthYearDto {
    birthYear: number;
}
export declare class CreateFamilyDto {
    title: string;
}
export declare class CreateFamilyInviteDto {
    targetAccountMode: AccountMode;
    expiresInHours?: number;
}
export declare class JoinFamilyDto {
    code: string;
}
export declare class ConnectTuyaIntegrationDto {
    homeId: string;
    accountLabel: string;
    region?: string;
    loginIdentifier?: string;
    password?: string;
    countryCode?: string;
    appSchema?: string;
    accessToken?: string;
    refreshToken?: string;
}
export declare class TuyaOAuthCallbackQueryDto {
    code?: string;
    state?: string;
    error?: string;
    errorCode?: string;
    errorMessage?: string;
}
export declare class CreateTuyaLinkSessionDto {
    homeId: string;
    accountLabel: string;
    region?: string;
}
export declare class SyncIntegrationDto {
    homeId: string;
}
export declare class CreateHomeDto {
    title: string;
    addressLabel: string;
    timezone: string;
}
export declare class CreateFloorDto {
    title: string;
    sortOrder?: number;
}
export declare class UpdateFloorDto {
    title?: string;
    sortOrder?: number;
}
export declare class UpdateHomeStateDto {
    currentMode?: HomeMode;
    securityMode?: SecurityMode;
}
export declare class CreateRoomDto {
    floorId?: string;
    title: string;
    type: string;
    sortOrder?: number;
}
export declare class UpdateRoomDto {
    floorId?: string;
    title?: string;
    type?: string;
    sortOrder?: number;
}
export declare class LayoutBlockDto {
    roomId: string;
    x: number;
    y: number;
    width: number;
    height: number;
    zIndex: number;
}
export declare class LayoutItemDto {
    id?: string;
    floorId?: string;
    roomId: string;
    kind: 'furniture' | 'door' | 'window' | 'device' | 'task';
    subtype: string;
    title?: string;
    x: number;
    y: number;
    width: number;
    height: number;
    rotation?: number;
    metadata?: Record<string, unknown>;
}
export declare class PutLayoutDto {
    revision: number;
    blocks: LayoutBlockDto[];
    items: LayoutItemDto[];
}
export declare class PatchLayoutDto extends PutLayoutDto {
}
export declare class LayoutQueryDto {
    floorId?: string;
}
export declare class SubmitCommandDto {
    capabilityKey: CapabilityKey;
    requestedValue: unknown;
}
export declare class UpdateDevicePlacementDto {
    roomId: string;
    floorId?: string;
    markerX?: number;
    markerY?: number;
    markerTitle?: string;
}
export declare class CreatePairingSessionDto {
    homeId: string;
    deviceType: string;
    discoveryMethod: ConnectionType;
}
export declare class SelectCandidateDto {
    candidateId: string;
}
export declare class CompletePairingSessionDto {
    deviceName?: string;
    roomId?: string;
}
export declare class CreateScenarioDto {
    homeId: string;
    title: string;
    description: string;
    iconKey: string;
    executionMode: ScenarioExecutionMode;
}
export declare class UpdateScenarioDto {
    title?: string;
    description?: string;
    iconKey?: string;
    enabled?: boolean;
    executionMode?: ScenarioExecutionMode;
}
export declare class InviteMemberDto {
    homeId: string;
    userId: string;
    role: Role;
}
export declare class UpdateMemberDto {
    role?: Role;
    status?: 'active' | 'invited' | 'revoked';
}
export declare class CreateTaskDto {
    homeId: string;
    floorId?: string;
    assigneeUserId: string;
    roomId?: string;
    title: string;
    description: string;
    rewardType: RewardType;
    rewardValue: number;
    rewardDescription: string;
    targetX?: number;
    targetY?: number;
    deadlineAt?: string;
}
export declare class UpdateTaskDto {
    floorId?: string;
    title?: string;
    description?: string;
    rewardType?: RewardType;
    rewardValue?: number;
    rewardDescription?: string;
    roomId?: string;
    targetX?: number;
    targetY?: number;
    status?: TaskStatus;
    deadlineAt?: string;
}
export declare class SubmitTaskCompletionDto {
    note?: string;
}
export declare class ReviewTaskDto {
    approved: boolean;
    note?: string;
}
export declare class MarkNotificationReadDto {
    reason?: string;
}
export declare class CommandStatusQueryDto {
    expectedStatus?: CommandStatus;
}
export declare class SyncQueryDto {
    afterOffset: number;
}
export declare class EventQueryDto {
    homeId?: string;
    afterOffset?: number;
}
export declare class DiscoverCandidatesDto {
    hints?: Record<string, unknown>;
}

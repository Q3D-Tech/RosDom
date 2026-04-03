"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DiscoverCandidatesDto = exports.EventQueryDto = exports.SyncQueryDto = exports.CommandStatusQueryDto = exports.MarkNotificationReadDto = exports.ReviewTaskDto = exports.SubmitTaskCompletionDto = exports.UpdateTaskDto = exports.CreateTaskDto = exports.UpdateMemberDto = exports.InviteMemberDto = exports.UpdateScenarioDto = exports.CreateScenarioDto = exports.CompletePairingSessionDto = exports.SelectCandidateDto = exports.CreatePairingSessionDto = exports.UpdateDevicePlacementDto = exports.SubmitCommandDto = exports.LayoutQueryDto = exports.PatchLayoutDto = exports.PutLayoutDto = exports.LayoutItemDto = exports.LayoutBlockDto = exports.UpdateRoomDto = exports.CreateRoomDto = exports.UpdateHomeStateDto = exports.UpdateFloorDto = exports.CreateFloorDto = exports.CreateHomeDto = exports.SyncIntegrationDto = exports.CreateTuyaLinkSessionDto = exports.TuyaOAuthCallbackQueryDto = exports.ConnectTuyaIntegrationDto = exports.JoinFamilyDto = exports.CreateFamilyInviteDto = exports.CreateFamilyDto = exports.UpdateBirthYearDto = exports.UpdateUserPreferencesDto = exports.UpdateProfileDto = exports.RefreshDto = exports.LoginDto = exports.RegisterDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const HOME_MODES = ['home', 'away', 'night'];
const SECURITY_MODES = ['armed', 'disarmed', 'night'];
const CONNECTION_TYPES = ['matter', 'lan', 'cloud', 'bridge'];
const SCENARIO_EXECUTION_MODES = [
    'manual',
    'scheduled',
    'sensor',
    'geofence',
];
const ROLES = ['owner', 'member', 'guest'];
const COMMAND_STATUSES = [
    'queued',
    'dispatched',
    'acknowledged',
    'rejected',
    'timed_out',
    'reconciled',
];
const CAPABILITY_KEYS = [
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
const IDENTIFIER_TYPES = ['email', 'phone'];
const ACCOUNT_MODES = ['child', 'adult', 'elderly'];
const REWARD_TYPES = ['money', 'time', 'event'];
const TASK_STATUSES = [
    'pending',
    'submitted',
    'approved',
    'rejected',
];
const UI_DENSITIES = ['compact', 'comfortable', 'large'];
const THEME_MODES = ['system', 'light', 'dark'];
const MOTION_MODES = ['standard', 'reduced'];
class RegisterDto {
    loginIdentifier;
    identifierType;
    password;
    name;
    birthYear;
    familyInviteCode;
    deviceName;
}
exports.RegisterDto = RegisterDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], RegisterDto.prototype, "loginIdentifier", void 0);
__decorate([
    (0, class_validator_1.IsIn)(IDENTIFIER_TYPES),
    __metadata("design:type", String)
], RegisterDto.prototype, "identifierType", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], RegisterDto.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], RegisterDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1916),
    (0, class_validator_1.Max)(2026),
    __metadata("design:type", Number)
], RegisterDto.prototype, "birthYear", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], RegisterDto.prototype, "familyInviteCode", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RegisterDto.prototype, "deviceName", void 0);
class LoginDto {
    loginIdentifier;
    password;
    deviceName;
}
exports.LoginDto = LoginDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], LoginDto.prototype, "loginIdentifier", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], LoginDto.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], LoginDto.prototype, "deviceName", void 0);
class RefreshDto {
    refreshToken;
}
exports.RefreshDto = RefreshDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], RefreshDto.prototype, "refreshToken", void 0);
class UpdateProfileDto {
    displayName;
    locale;
}
exports.UpdateProfileDto = UpdateProfileDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "displayName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UpdateProfileDto.prototype, "locale", void 0);
class UpdateUserPreferencesDto {
    favoriteDeviceIds;
    allowedDeviceIds;
    pinnedSections;
    preferredHomeTab;
    uiDensity;
    themeMode;
    motionMode;
    activeFloorId;
}
exports.UpdateUserPreferencesDto = UpdateUserPreferencesDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], UpdateUserPreferencesDto.prototype, "favoriteDeviceIds", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], UpdateUserPreferencesDto.prototype, "allowedDeviceIds", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], UpdateUserPreferencesDto.prototype, "pinnedSections", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UpdateUserPreferencesDto.prototype, "preferredHomeTab", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(UI_DENSITIES),
    __metadata("design:type", String)
], UpdateUserPreferencesDto.prototype, "uiDensity", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(THEME_MODES),
    __metadata("design:type", String)
], UpdateUserPreferencesDto.prototype, "themeMode", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(MOTION_MODES),
    __metadata("design:type", String)
], UpdateUserPreferencesDto.prototype, "motionMode", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], UpdateUserPreferencesDto.prototype, "activeFloorId", void 0);
class UpdateBirthYearDto {
    birthYear;
}
exports.UpdateBirthYearDto = UpdateBirthYearDto;
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1916),
    (0, class_validator_1.Max)(2026),
    __metadata("design:type", Number)
], UpdateBirthYearDto.prototype, "birthYear", void 0);
class CreateFamilyDto {
    title;
}
exports.CreateFamilyDto = CreateFamilyDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateFamilyDto.prototype, "title", void 0);
class CreateFamilyInviteDto {
    targetAccountMode;
    expiresInHours;
}
exports.CreateFamilyInviteDto = CreateFamilyInviteDto;
__decorate([
    (0, class_validator_1.IsIn)(ACCOUNT_MODES),
    __metadata("design:type", String)
], CreateFamilyInviteDto.prototype, "targetAccountMode", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateFamilyInviteDto.prototype, "expiresInHours", void 0);
class JoinFamilyDto {
    code;
}
exports.JoinFamilyDto = JoinFamilyDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], JoinFamilyDto.prototype, "code", void 0);
class ConnectTuyaIntegrationDto {
    homeId;
    accountLabel;
    region;
    loginIdentifier;
    password;
    countryCode;
    appSchema;
    accessToken;
    refreshToken;
}
exports.ConnectTuyaIntegrationDto = ConnectTuyaIntegrationDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ConnectTuyaIntegrationDto.prototype, "homeId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ConnectTuyaIntegrationDto.prototype, "accountLabel", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ConnectTuyaIntegrationDto.prototype, "region", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ConnectTuyaIntegrationDto.prototype, "loginIdentifier", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ConnectTuyaIntegrationDto.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ConnectTuyaIntegrationDto.prototype, "countryCode", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], ConnectTuyaIntegrationDto.prototype, "appSchema", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConnectTuyaIntegrationDto.prototype, "accessToken", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ConnectTuyaIntegrationDto.prototype, "refreshToken", void 0);
class TuyaOAuthCallbackQueryDto {
    code;
    state;
    error;
    errorCode;
    errorMessage;
}
exports.TuyaOAuthCallbackQueryDto = TuyaOAuthCallbackQueryDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TuyaOAuthCallbackQueryDto.prototype, "code", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TuyaOAuthCallbackQueryDto.prototype, "state", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TuyaOAuthCallbackQueryDto.prototype, "error", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TuyaOAuthCallbackQueryDto.prototype, "errorCode", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TuyaOAuthCallbackQueryDto.prototype, "errorMessage", void 0);
class CreateTuyaLinkSessionDto {
    homeId;
    accountLabel;
    region;
}
exports.CreateTuyaLinkSessionDto = CreateTuyaLinkSessionDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateTuyaLinkSessionDto.prototype, "homeId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateTuyaLinkSessionDto.prototype, "accountLabel", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateTuyaLinkSessionDto.prototype, "region", void 0);
class SyncIntegrationDto {
    homeId;
}
exports.SyncIntegrationDto = SyncIntegrationDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], SyncIntegrationDto.prototype, "homeId", void 0);
class CreateHomeDto {
    title;
    addressLabel;
    timezone;
}
exports.CreateHomeDto = CreateHomeDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateHomeDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateHomeDto.prototype, "addressLabel", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateHomeDto.prototype, "timezone", void 0);
class CreateFloorDto {
    title;
    sortOrder;
}
exports.CreateFloorDto = CreateFloorDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateFloorDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateFloorDto.prototype, "sortOrder", void 0);
class UpdateFloorDto {
    title;
    sortOrder;
}
exports.UpdateFloorDto = UpdateFloorDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UpdateFloorDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdateFloorDto.prototype, "sortOrder", void 0);
class UpdateHomeStateDto {
    currentMode;
    securityMode;
}
exports.UpdateHomeStateDto = UpdateHomeStateDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(HOME_MODES),
    __metadata("design:type", String)
], UpdateHomeStateDto.prototype, "currentMode", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(SECURITY_MODES),
    __metadata("design:type", String)
], UpdateHomeStateDto.prototype, "securityMode", void 0);
class CreateRoomDto {
    floorId;
    title;
    type;
    sortOrder;
}
exports.CreateRoomDto = CreateRoomDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateRoomDto.prototype, "floorId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateRoomDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateRoomDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateRoomDto.prototype, "sortOrder", void 0);
class UpdateRoomDto {
    floorId;
    title;
    type;
    sortOrder;
}
exports.UpdateRoomDto = UpdateRoomDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], UpdateRoomDto.prototype, "floorId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UpdateRoomDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UpdateRoomDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], UpdateRoomDto.prototype, "sortOrder", void 0);
class LayoutBlockDto {
    roomId;
    x;
    y;
    width;
    height;
    zIndex;
}
exports.LayoutBlockDto = LayoutBlockDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], LayoutBlockDto.prototype, "roomId", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], LayoutBlockDto.prototype, "x", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], LayoutBlockDto.prototype, "y", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], LayoutBlockDto.prototype, "width", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], LayoutBlockDto.prototype, "height", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], LayoutBlockDto.prototype, "zIndex", void 0);
class LayoutItemDto {
    id;
    floorId;
    roomId;
    kind;
    subtype;
    title;
    x;
    y;
    width;
    height;
    rotation;
    metadata;
}
exports.LayoutItemDto = LayoutItemDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], LayoutItemDto.prototype, "id", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], LayoutItemDto.prototype, "floorId", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], LayoutItemDto.prototype, "roomId", void 0);
__decorate([
    (0, class_validator_1.IsIn)(['furniture', 'door', 'window', 'device', 'task']),
    __metadata("design:type", String)
], LayoutItemDto.prototype, "kind", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], LayoutItemDto.prototype, "subtype", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], LayoutItemDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], LayoutItemDto.prototype, "x", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], LayoutItemDto.prototype, "y", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], LayoutItemDto.prototype, "width", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], LayoutItemDto.prototype, "height", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], LayoutItemDto.prototype, "rotation", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], LayoutItemDto.prototype, "metadata", void 0);
class PutLayoutDto {
    revision;
    blocks;
    items;
}
exports.PutLayoutDto = PutLayoutDto;
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], PutLayoutDto.prototype, "revision", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => LayoutBlockDto),
    __metadata("design:type", Array)
], PutLayoutDto.prototype, "blocks", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => LayoutItemDto),
    __metadata("design:type", Array)
], PutLayoutDto.prototype, "items", void 0);
class PatchLayoutDto extends PutLayoutDto {
}
exports.PatchLayoutDto = PatchLayoutDto;
class LayoutQueryDto {
    floorId;
}
exports.LayoutQueryDto = LayoutQueryDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], LayoutQueryDto.prototype, "floorId", void 0);
class SubmitCommandDto {
    capabilityKey;
    requestedValue;
}
exports.SubmitCommandDto = SubmitCommandDto;
__decorate([
    (0, class_validator_1.IsIn)(CAPABILITY_KEYS),
    __metadata("design:type", String)
], SubmitCommandDto.prototype, "capabilityKey", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", Object)
], SubmitCommandDto.prototype, "requestedValue", void 0);
class UpdateDevicePlacementDto {
    roomId;
    floorId;
    markerX;
    markerY;
    markerTitle;
}
exports.UpdateDevicePlacementDto = UpdateDevicePlacementDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], UpdateDevicePlacementDto.prototype, "roomId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], UpdateDevicePlacementDto.prototype, "floorId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], UpdateDevicePlacementDto.prototype, "markerX", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], UpdateDevicePlacementDto.prototype, "markerY", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UpdateDevicePlacementDto.prototype, "markerTitle", void 0);
class CreatePairingSessionDto {
    homeId;
    deviceType;
    discoveryMethod;
}
exports.CreatePairingSessionDto = CreatePairingSessionDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreatePairingSessionDto.prototype, "homeId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreatePairingSessionDto.prototype, "deviceType", void 0);
__decorate([
    (0, class_validator_1.IsIn)(CONNECTION_TYPES),
    __metadata("design:type", String)
], CreatePairingSessionDto.prototype, "discoveryMethod", void 0);
class SelectCandidateDto {
    candidateId;
}
exports.SelectCandidateDto = SelectCandidateDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], SelectCandidateDto.prototype, "candidateId", void 0);
class CompletePairingSessionDto {
    deviceName;
    roomId;
}
exports.CompletePairingSessionDto = CompletePairingSessionDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CompletePairingSessionDto.prototype, "deviceName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CompletePairingSessionDto.prototype, "roomId", void 0);
class CreateScenarioDto {
    homeId;
    title;
    description;
    iconKey;
    executionMode;
}
exports.CreateScenarioDto = CreateScenarioDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateScenarioDto.prototype, "homeId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateScenarioDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateScenarioDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateScenarioDto.prototype, "iconKey", void 0);
__decorate([
    (0, class_validator_1.IsIn)(SCENARIO_EXECUTION_MODES),
    __metadata("design:type", String)
], CreateScenarioDto.prototype, "executionMode", void 0);
class UpdateScenarioDto {
    title;
    description;
    iconKey;
    enabled;
    executionMode;
}
exports.UpdateScenarioDto = UpdateScenarioDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UpdateScenarioDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UpdateScenarioDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UpdateScenarioDto.prototype, "iconKey", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateScenarioDto.prototype, "enabled", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(SCENARIO_EXECUTION_MODES),
    __metadata("design:type", String)
], UpdateScenarioDto.prototype, "executionMode", void 0);
class InviteMemberDto {
    homeId;
    userId;
    role;
}
exports.InviteMemberDto = InviteMemberDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], InviteMemberDto.prototype, "homeId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], InviteMemberDto.prototype, "userId", void 0);
__decorate([
    (0, class_validator_1.IsIn)(ROLES),
    __metadata("design:type", String)
], InviteMemberDto.prototype, "role", void 0);
class UpdateMemberDto {
    role;
    status;
}
exports.UpdateMemberDto = UpdateMemberDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(ROLES),
    __metadata("design:type", String)
], UpdateMemberDto.prototype, "role", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(['active', 'invited', 'revoked']),
    __metadata("design:type", String)
], UpdateMemberDto.prototype, "status", void 0);
class CreateTaskDto {
    homeId;
    floorId;
    assigneeUserId;
    roomId;
    title;
    description;
    rewardType;
    rewardValue;
    rewardDescription;
    targetX;
    targetY;
    deadlineAt;
}
exports.CreateTaskDto = CreateTaskDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateTaskDto.prototype, "homeId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateTaskDto.prototype, "floorId", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateTaskDto.prototype, "assigneeUserId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateTaskDto.prototype, "roomId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateTaskDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateTaskDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsIn)(REWARD_TYPES),
    __metadata("design:type", String)
], CreateTaskDto.prototype, "rewardType", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], CreateTaskDto.prototype, "rewardValue", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateTaskDto.prototype, "rewardDescription", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreateTaskDto.prototype, "targetX", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], CreateTaskDto.prototype, "targetY", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateTaskDto.prototype, "deadlineAt", void 0);
class UpdateTaskDto {
    floorId;
    title;
    description;
    rewardType;
    rewardValue;
    rewardDescription;
    roomId;
    targetX;
    targetY;
    status;
    deadlineAt;
}
exports.UpdateTaskDto = UpdateTaskDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], UpdateTaskDto.prototype, "floorId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UpdateTaskDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UpdateTaskDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(REWARD_TYPES),
    __metadata("design:type", String)
], UpdateTaskDto.prototype, "rewardType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], UpdateTaskDto.prototype, "rewardValue", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], UpdateTaskDto.prototype, "rewardDescription", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], UpdateTaskDto.prototype, "roomId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], UpdateTaskDto.prototype, "targetX", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    __metadata("design:type", Number)
], UpdateTaskDto.prototype, "targetY", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(TASK_STATUSES),
    __metadata("design:type", String)
], UpdateTaskDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateTaskDto.prototype, "deadlineAt", void 0);
class SubmitTaskCompletionDto {
    note;
}
exports.SubmitTaskCompletionDto = SubmitTaskCompletionDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SubmitTaskCompletionDto.prototype, "note", void 0);
class ReviewTaskDto {
    approved;
    note;
}
exports.ReviewTaskDto = ReviewTaskDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ReviewTaskDto.prototype, "approved", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ReviewTaskDto.prototype, "note", void 0);
class MarkNotificationReadDto {
    reason;
}
exports.MarkNotificationReadDto = MarkNotificationReadDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MarkNotificationReadDto.prototype, "reason", void 0);
class CommandStatusQueryDto {
    expectedStatus;
}
exports.CommandStatusQueryDto = CommandStatusQueryDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(COMMAND_STATUSES),
    __metadata("design:type", String)
], CommandStatusQueryDto.prototype, "expectedStatus", void 0);
class SyncQueryDto {
    afterOffset;
}
exports.SyncQueryDto = SyncQueryDto;
__decorate([
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], SyncQueryDto.prototype, "afterOffset", void 0);
class EventQueryDto {
    homeId;
    afterOffset;
}
exports.EventQueryDto = EventQueryDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], EventQueryDto.prototype, "homeId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], EventQueryDto.prototype, "afterOffset", void 0);
class DiscoverCandidatesDto {
    hints;
}
exports.DiscoverCandidatesDto = DiscoverCandidatesDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], DiscoverCandidatesDto.prototype, "hints", void 0);
//# sourceMappingURL=dtos.js.map
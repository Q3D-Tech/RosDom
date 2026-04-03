package ru.rosdom.data.network

data class ApiEnvelope<T>(
    val data: T,
    val meta: ApiMeta? = null,
)

data class ApiMeta(
    val serverTime: String? = null,
)

data class RegisterRequest(
    val loginIdentifier: String,
    val identifierType: String,
    val password: String,
    val name: String,
    val birthYear: Int,
    val familyInviteCode: String? = null,
    val deviceName: String? = null,
)

data class LoginRequest(
    val loginIdentifier: String,
    val password: String,
    val deviceName: String? = null,
)

data class RefreshRequest(
    val refreshToken: String,
)

data class AuthPayload(
    val accessToken: String,
    val refreshToken: String,
    val sessionId: String,
    val expiresAt: String,
    val user: ApiUser,
)

data class ApiUser(
    val id: String,
    val email: String?,
    val loginIdentifier: String,
    val identifierType: String,
    val displayName: String,
    val birthYear: Int,
    val accountMode: String,
    val locale: String,
    val createdAt: String,
    val updatedAt: String,
)

data class CreateFamilyRequest(
    val title: String,
)

data class JoinFamilyRequest(
    val code: String,
)

data class CreateFamilyInviteRequest(
    val targetAccountMode: String,
    val expiresInHours: Int? = null,
)

data class ApiFamily(
    val id: String,
    val title: String,
    val ownerUserId: String,
    val createdAt: String,
    val updatedAt: String,
)

data class ApiFamilyMember(
    val id: String,
    val familyId: String,
    val userId: String,
    val guardianUserId: String?,
    val status: String,
    val createdAt: String,
)

data class ApiFamilyInvite(
    val id: String,
    val familyId: String,
    val code: String,
    val targetAccountMode: String,
    val createdByUserId: String,
    val claimedByUserId: String?,
    val status: String,
    val expiresAt: String,
    val claimedAt: String?,
    val createdAt: String,
)

data class CreateHomeRequest(
    val title: String,
    val addressLabel: String,
    val timezone: String,
)

data class UpdateHomeStateRequest(
    val currentMode: String? = null,
    val securityMode: String? = null,
)

data class ApiHome(
    val id: String,
    val familyId: String?,
    val title: String,
    val addressLabel: String,
    val timezone: String,
    val ownerUserId: String,
    val currentMode: String,
    val securityMode: String,
    val updatedAt: String,
    val layoutRevision: Int,
)

data class ApiHomeMember(
    val id: String,
    val homeId: String,
    val userId: String,
    val role: String,
    val status: String,
    val createdAt: String,
)

data class ApiFloor(
    val id: String,
    val homeId: String,
    val title: String,
    val sortOrder: Int,
    val createdAt: String,
    val updatedAt: String,
)

data class ApiUserPreferences(
    val userId: String,
    val favoriteDeviceIds: List<String>,
    val allowedDeviceIds: List<String>,
    val pinnedSections: List<String>,
    val preferredHomeTab: String,
    val uiDensity: String,
    val themeMode: String,
    val motionMode: String,
    val activeFloorId: String?,
    val createdAt: String,
    val updatedAt: String,
)

data class UpdateUserPreferencesRequest(
    val favoriteDeviceIds: List<String>? = null,
    val allowedDeviceIds: List<String>? = null,
    val pinnedSections: List<String>? = null,
    val preferredHomeTab: String? = null,
    val uiDensity: String? = null,
    val themeMode: String? = null,
    val motionMode: String? = null,
    val activeFloorId: String? = null,
)

data class ApiRoom(
    val id: String,
    val homeId: String,
    val floorId: String?,
    val title: String,
    val type: String,
    val sortOrder: Int,
    val updatedAt: String,
)

data class CreateRoomRequest(
    val floorId: String? = null,
    val title: String,
    val type: String,
    val sortOrder: Int? = null,
)

data class UpdateRoomRequest(
    val floorId: String? = null,
    val title: String? = null,
    val type: String? = null,
    val sortOrder: Int? = null,
)

data class CreateFloorRequest(
    val title: String,
    val sortOrder: Int? = null,
)

data class UpdateFloorRequest(
    val title: String? = null,
    val sortOrder: Int? = null,
)

data class ApiLayoutBlock(
    val id: String,
    val roomId: String,
    val x: Int,
    val y: Int,
    val width: Int,
    val height: Int,
    val zIndex: Int,
)

data class ApiLayoutItem(
    val id: String,
    val homeId: String,
    val roomId: String,
    val floorId: String?,
    val kind: String,
    val subtype: String,
    val title: String?,
    val x: Int,
    val y: Int,
    val width: Int,
    val height: Int,
    val rotation: Int,
    val metadata: Map<String, Any?> = emptyMap(),
    val createdAt: String,
    val updatedAt: String,
)

data class ApiLayout(
    val homeId: String,
    val floorId: String?,
    val revision: Int,
    val blocks: List<ApiLayoutBlock>,
    val items: List<ApiLayoutItem>,
)

data class PutLayoutBlockRequest(
    val roomId: String,
    val x: Int,
    val y: Int,
    val width: Int,
    val height: Int,
    val zIndex: Int,
)

data class PutLayoutItemRequest(
    val id: String? = null,
    val floorId: String? = null,
    val roomId: String,
    val kind: String,
    val subtype: String,
    val title: String? = null,
    val x: Int,
    val y: Int,
    val width: Int,
    val height: Int,
    val rotation: Int = 0,
    val metadata: Map<String, Any?> = emptyMap(),
)

data class PutLayoutRequest(
    val revision: Int,
    val blocks: List<PutLayoutBlockRequest>,
    val items: List<PutLayoutItemRequest>,
)

data class ApiDevice(
    val id: String,
    val homeId: String,
    val roomId: String,
    val name: String,
    val category: String,
    val vendor: String,
    val model: String,
    val connectionType: String,
    val transportMode: String,
    val externalDeviceRef: String,
    val availabilityStatus: String,
    val lastSeenAt: String,
    val updatedAt: String,
)

data class ApiCapability(
    val id: String,
    val deviceId: String,
    val key: String,
    val type: String,
    val readable: Boolean,
    val writable: Boolean,
    val unit: String?,
    val rangeMin: Double?,
    val rangeMax: Double?,
    val step: Double?,
    val allowedOptions: List<String>?,
    val validationRules: Map<String, Any?> = emptyMap(),
    val source: String,
    val lastSyncAt: String,
    val freshness: String,
    val quality: String,
)

data class ApiDeviceStateSnapshot(
    val id: String,
    val deviceId: String,
    val observedAt: String,
    val source: String,
    val values: Map<String, Any?> = emptyMap(),
)

data class ApiCommandLog(
    val id: String,
    val homeId: String,
    val deviceId: String,
    val capabilityKey: String,
    val requestedValue: Any?,
    val requestedAt: String,
    val actorUserId: String,
    val idempotencyKey: String,
    val deliveryStatus: String,
    val failureReason: String?,
    val externalCommandRef: String?,
    val acknowledgedAt: String?,
    val reconciledAt: String?,
)

data class ApiFirmwareRecord(
    val id: String,
    val deviceId: String,
    val version: String,
    val channel: String,
    val recordedAt: String,
)

data class ApiDeviceMediaAsset(
    val id: String,
    val vendor: String,
    val model: String,
    val sourceUrl: String,
    val imageUrl: String,
    val licenseNote: String,
    val createdAt: String,
)

data class ApiDeviceDetailsEnvelope(
    val device: ApiDevice,
    val capabilities: List<ApiCapability>,
    val latestState: ApiDeviceStateSnapshot?,
    val commands: List<ApiCommandLog>,
    val firmware: List<ApiFirmwareRecord>,
    val mediaAsset: ApiDeviceMediaAsset?,
)

data class ApiEvent(
    val id: String,
    val homeId: String,
    val roomId: String?,
    val deviceId: String?,
    val userId: String?,
    val topic: String,
    val severity: String,
    val payload: Map<String, Any?> = emptyMap(),
    val createdAt: String,
    val offset: Int,
)

data class ApiTask(
    val id: String,
    val homeId: String,
    val familyId: String?,
    val floorId: String?,
    val roomId: String?,
    val assigneeUserId: String,
    val createdByUserId: String,
    val approvedByUserId: String?,
    val title: String,
    val description: String,
    val rewardType: String,
    val rewardValue: Int,
    val rewardDescription: String,
    val targetX: Int?,
    val targetY: Int?,
    val status: String,
    val deadlineAt: String?,
    val submittedAt: String?,
    val approvedAt: String?,
    val rejectedAt: String?,
    val createdAt: String,
    val updatedAt: String,
)

data class ApiRewardBalance(
    val userId: String,
    val homeId: String,
    val balance: Int,
    val updatedAt: String,
)

data class ApiRewardLedgerEntry(
    val id: String,
    val userId: String,
    val homeId: String,
    val taskId: String?,
    val delta: Int,
    val entryType: String,
    val description: String,
    val createdAt: String,
)

data class SubmitDeviceCommandRequest(
    val capabilityKey: String,
    val requestedValue: Any?,
)

data class SubmitTaskRequest(
    val note: String? = null,
)

data class ReviewTaskRequest(
    val note: String? = null,
)

data class ApiNotification(
    val id: String,
    val userId: String,
    val homeId: String,
    val eventId: String?,
    val type: String,
    val title: String,
    val body: String,
    val readAt: String?,
    val createdAt: String,
)

data class ApiIntegrationAccount(
    val id: String,
    val homeId: String,
    val provider: String,
    val status: String,
    val metadata: Map<String, Any?> = emptyMap(),
    val createdAt: String,
    val updatedAt: String,
)

data class ConnectTuyaIntegrationRequest(
    val homeId: String,
    val accountLabel: String,
    val region: String? = null,
    val loginIdentifier: String? = null,
    val password: String? = null,
    val countryCode: String? = null,
    val appSchema: String? = null,
    val accessToken: String? = null,
    val refreshToken: String? = null,
)

data class CreateTuyaLinkSessionRequest(
    val homeId: String,
    val accountLabel: String,
    val region: String? = null,
)

data class ApiTuyaLinkSession(
    val id: String,
    val homeId: String,
    val provider: String,
    val status: String,
    val accountLabel: String,
    val region: String,
    val userCode: String,
    val authorizationUrl: String? = null,
    val verificationUri: String,
    val expiresAt: String,
    val integrationId: String? = null,
    val failureCode: String? = null,
    val failureMessage: String? = null,
    val linkedAt: String?,
    val createdByUserId: String,
    val createdAt: String,
    val updatedAt: String,
)

data class SyncIntegrationRequest(
    val homeId: String,
)

data class ApiIntegrationSyncResult(
    val provider: String,
    val homeId: String,
    val status: String,
    val syncedDevices: Int,
    val syncedAt: String,
)

data class UpdateDevicePlacementRequest(
    val roomId: String,
    val floorId: String? = null,
    val markerX: Int? = null,
    val markerY: Int? = null,
    val markerTitle: String? = null,
)

data class ApiRoomSummary(
    val roomId: String,
    val floorId: String?,
    val title: String,
    val type: String,
    val deviceCount: Int,
    val taskCount: Int,
)

data class ApiSecuritySummary(
    val securityMode: String,
    val activeAlerts: Int,
    val openEntries: Int,
    val cameraCount: Int,
    val lockCount: Int,
)

data class ApiFamilySummary(
    val totalMembers: Int,
    val adults: Int,
    val children: Int,
    val elderly: Int,
)

data class ApiIntegrationSummary(
    val connected: Int,
    val attentionNeeded: Int,
    val providers: List<String>,
)

data class ApiSnapshotSummary(
    val unreadNotifications: Int,
    val pendingTasks: Int,
    val onlineDevices: Int,
    val lastOffset: Int,
)

data class ApiHomeSnapshot(
    val home: ApiHome,
    val family: ApiFamily?,
    val members: List<ApiHomeMember>,
    val floors: List<ApiFloor>,
    val preferences: ApiUserPreferences,
    val rooms: List<ApiRoom>,
    val layoutBlocks: List<ApiLayoutBlock>,
    val layoutItems: List<ApiLayoutItem>,
    val devices: List<ApiDevice>,
    val capabilities: List<ApiCapability>,
    val latestStates: List<ApiDeviceStateSnapshot>,
    val tasks: List<ApiTask>,
    val notifications: List<ApiNotification>,
    val favoriteDevices: List<ApiDevice>,
    val roomSummaries: List<ApiRoomSummary>,
    val securitySummary: ApiSecuritySummary,
    val familySummary: ApiFamilySummary,
    val alerts: List<ApiEvent>,
    val activityFeed: List<ApiEvent>,
    val integrationSummary: ApiIntegrationSummary,
    val allowedDevicesForChild: List<ApiDevice>,
    val summary: ApiSnapshotSummary,
    val snapshotGeneratedAt: String,
)

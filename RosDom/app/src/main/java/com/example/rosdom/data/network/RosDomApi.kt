package ru.rosdom.data.network

import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.PATCH
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Path
import retrofit2.http.Query

interface RosDomApi {
    @POST("v1/auth/register")
    suspend fun register(@Body request: RegisterRequest): ApiEnvelope<AuthPayload>

    @POST("v1/auth/login")
    suspend fun login(@Body request: LoginRequest): ApiEnvelope<AuthPayload>

    @POST("v1/auth/refresh")
    suspend fun refresh(@Body request: RefreshRequest): ApiEnvelope<AuthPayload>

    @POST("v1/auth/logout")
    suspend fun logout(): ApiEnvelope<Map<String, Boolean>>

    @GET("v1/auth/me")
    suspend fun me(): ApiEnvelope<ApiUser>

    @PATCH("v1/users/me")
    suspend fun updateProfile(@Body request: Map<String, String>): ApiEnvelope<ApiUser>

    @GET("v1/users/me/preferences")
    suspend fun getUserPreferences(): ApiEnvelope<ApiUserPreferences>

    @PATCH("v1/users/me/preferences")
    suspend fun updateUserPreferences(@Body request: UpdateUserPreferencesRequest): ApiEnvelope<ApiUserPreferences>

    @GET("v1/families/current")
    suspend fun getCurrentFamily(): ApiEnvelope<ApiFamily?>

    @GET("v1/families/members")
    suspend fun getFamilyMembers(): ApiEnvelope<List<ApiFamilyMember>>

    @POST("v1/families")
    suspend fun createFamily(@Body request: CreateFamilyRequest): ApiEnvelope<ApiFamily>

    @POST("v1/families/invites")
    suspend fun createFamilyInvite(@Body request: CreateFamilyInviteRequest): ApiEnvelope<ApiFamilyInvite>

    @POST("v1/families/join")
    suspend fun joinFamily(@Body request: JoinFamilyRequest): ApiEnvelope<ApiFamily>

    @GET("v1/homes")
    suspend fun getHomes(): ApiEnvelope<List<ApiHome>>

    @POST("v1/homes")
    suspend fun createHome(@Body request: CreateHomeRequest): ApiEnvelope<ApiHome>

    @GET("v1/homes/{homeId}/floors")
    suspend fun getFloors(@Path("homeId") homeId: String): ApiEnvelope<List<ApiFloor>>

    @POST("v1/homes/{homeId}/floors")
    suspend fun createFloor(
        @Path("homeId") homeId: String,
        @Body request: CreateFloorRequest,
    ): ApiEnvelope<ApiFloor>

    @PATCH("v1/floors/{floorId}")
    suspend fun updateFloor(
        @Path("floorId") floorId: String,
        @Body request: UpdateFloorRequest,
    ): ApiEnvelope<ApiFloor>

    @PATCH("v1/homes/{homeId}/state")
    suspend fun updateHomeState(
        @Path("homeId") homeId: String,
        @Body request: UpdateHomeStateRequest,
    ): ApiEnvelope<ApiHome>

    @POST("v1/homes/{homeId}/rooms")
    suspend fun createRoom(
        @Path("homeId") homeId: String,
        @Body request: CreateRoomRequest,
    ): ApiEnvelope<ApiRoom>

    @PATCH("v1/rooms/{roomId}")
    suspend fun updateRoom(
        @Path("roomId") roomId: String,
        @Body request: UpdateRoomRequest,
    ): ApiEnvelope<ApiRoom>

    @GET("v1/homes/{homeId}/layouts")
    suspend fun getLayout(
        @Path("homeId") homeId: String,
        @Query("floorId") floorId: String? = null,
    ): ApiEnvelope<ApiLayout>

    @PUT("v1/homes/{homeId}/layouts")
    suspend fun putLayout(
        @Path("homeId") homeId: String,
        @Body request: PutLayoutRequest,
    ): ApiEnvelope<ApiLayout>

    @POST("v1/homes/{homeId}/layouts/validate")
    suspend fun validateLayout(
        @Path("homeId") homeId: String,
        @Body request: PutLayoutRequest,
    ): ApiEnvelope<Map<String, Boolean>>

    @GET("v1/homes/{homeId}/snapshot")
    suspend fun getSnapshot(@Path("homeId") homeId: String): ApiEnvelope<ApiHomeSnapshot>

    @GET("v1/devices")
    suspend fun getDevices(@Query("homeId") homeId: String): ApiEnvelope<List<ApiDevice>>

    @GET("v1/devices/{deviceId}")
    suspend fun getDevice(@Path("deviceId") deviceId: String): ApiEnvelope<ApiDeviceDetailsEnvelope>

    @PATCH("v1/devices/{deviceId}")
    suspend fun updateDevicePlacement(
        @Path("deviceId") deviceId: String,
        @Body request: UpdateDevicePlacementRequest,
    ): ApiEnvelope<ApiDeviceDetailsEnvelope>

    @POST("v1/devices/{deviceId}/commands")
    suspend fun submitDeviceCommand(
        @Path("deviceId") deviceId: String,
        @Header("Idempotency-Key") idempotencyKey: String,
        @Body request: SubmitDeviceCommandRequest,
    ): ApiEnvelope<Map<String, Any?>>

    @GET("v1/tasks")
    suspend fun getTasks(@Query("homeId") homeId: String): ApiEnvelope<List<ApiTask>>

    @POST("v1/tasks/{taskId}/submit")
    suspend fun submitTask(
        @Path("taskId") taskId: String,
        @Body request: SubmitTaskRequest = SubmitTaskRequest(),
    ): ApiEnvelope<ApiTask>

    @GET("v1/rewards/balance")
    suspend fun getRewardBalance(@Query("homeId") homeId: String): ApiEnvelope<ApiRewardBalance>

    @GET("v1/rewards/ledger")
    suspend fun getRewardLedger(@Query("homeId") homeId: String): ApiEnvelope<List<ApiRewardLedgerEntry>>

    @GET("v1/events")
    suspend fun getEvents(
        @Query("homeId") homeId: String,
        @Query("afterOffset") afterOffset: Int = 0,
    ): ApiEnvelope<List<ApiEvent>>

    @GET("v1/notifications")
    suspend fun getNotifications(@Query("homeId") homeId: String): ApiEnvelope<List<ApiNotification>>

    @POST("v1/notifications/{notificationId}/read")
    suspend fun markNotificationRead(
        @Path("notificationId") notificationId: String,
        @Query("homeId") homeId: String,
    ): ApiEnvelope<ApiNotification>

    @GET("v1/integrations")
    suspend fun getIntegrations(@Query("homeId") homeId: String): ApiEnvelope<List<ApiIntegrationAccount>>

    @POST("v1/integrations/tuya/connect")
    suspend fun connectTuyaIntegration(
        @Body request: ConnectTuyaIntegrationRequest,
    ): ApiEnvelope<ApiIntegrationAccount>

    @POST("v1/integrations/tuya/link-sessions")
    suspend fun createTuyaLinkSession(
        @Body request: CreateTuyaLinkSessionRequest,
    ): ApiEnvelope<ApiTuyaLinkSession>

    @GET("v1/integrations/tuya/link-sessions/{sessionId}")
    suspend fun getTuyaLinkSession(
        @Path("sessionId") sessionId: String,
    ): ApiEnvelope<ApiTuyaLinkSession?>

    @POST("v1/integrations/tuya/sync")
    suspend fun syncTuyaIntegration(
        @Body request: SyncIntegrationRequest,
    ): ApiEnvelope<ApiIntegrationSyncResult>
}

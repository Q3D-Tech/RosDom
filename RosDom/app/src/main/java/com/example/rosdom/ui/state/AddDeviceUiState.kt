package ru.rosdom.ui.state

data class IntegrationCardState(
    val id: String,
    val provider: String,
    val status: String,
    val accountLabel: String,
    val region: String,
    val updatedAt: String,
)

data class TuyaLinkSessionState(
    val id: String,
    val status: String,
    val accountLabel: String,
    val region: String,
    val userCode: String,
    val authorizationUrl: String,
    val verificationUri: String,
    val expiresAt: String,
    val integrationId: String? = null,
    val failureCode: String? = null,
    val failureMessage: String? = null,
)

data class PlacementRoomOption(
    val id: String,
    val floorId: String?,
    val title: String,
)

data class PlacementFloorOption(
    val id: String,
    val title: String,
)

data class PlacementDeviceCardState(
    val id: String,
    val name: String,
    val vendor: String,
    val model: String,
    val category: String,
    val status: String,
    val roomId: String?,
    val selectedRoomId: String,
    val markerX: String = "",
    val markerY: String = "",
    val isSaving: Boolean = false,
    val message: String? = null,
)

data class AddDeviceUiState(
    val isLoading: Boolean = true,
    val isSubmitting: Boolean = false,
    val isSyncing: Boolean = false,
    val isWaitingForProviderCallback: Boolean = false,
    val accountLabel: String = "",
    val region: String = "eu",
    val loginIdentifier: String = "",
    val password: String = "",
    val countryCode: String = "7",
    val appSchema: String = "tuyaSmart",
    val connectedDevices: Int = 0,
    val integrations: List<IntegrationCardState> = emptyList(),
    val linkSession: TuyaLinkSessionState? = null,
    val syncMessage: String? = null,
    val floors: List<PlacementFloorOption> = emptyList(),
    val rooms: List<PlacementRoomOption> = emptyList(),
    val devices: List<PlacementDeviceCardState> = emptyList(),
    val error: String? = null,
)

package ru.rosdom.ui.screens.device

import org.json.JSONObject
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.ViewModelProvider.AndroidViewModelFactory.Companion.APPLICATION_KEY
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.CreationExtras
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import ru.rosdom.RosDomApplication
import ru.rosdom.data.network.ApiRoom
import ru.rosdom.data.repository.PlatformRepository
import ru.rosdom.domain.session.SessionManager
import ru.rosdom.ui.state.AddDeviceUiState
import ru.rosdom.ui.state.IntegrationCardState
import ru.rosdom.ui.state.PlacementDeviceCardState
import ru.rosdom.ui.state.PlacementFloorOption
import ru.rosdom.ui.state.PlacementRoomOption
import retrofit2.HttpException

class AddDeviceViewModel(
    private val platformRepository: PlatformRepository,
) : ViewModel() {
    private val _uiState = MutableStateFlow(AddDeviceUiState())
    val uiState: StateFlow<AddDeviceUiState> = _uiState.asStateFlow()

    init {
        refresh()
    }

    fun updateAccountLabel(value: String) {
        _uiState.update { it.copy(accountLabel = value, error = null) }
    }

    fun updateRegion(value: String) {
        _uiState.update { it.copy(region = value, error = null) }
    }

    fun updateLoginIdentifier(value: String) {
        _uiState.update { it.copy(loginIdentifier = value, error = null) }
    }

    fun updatePassword(value: String) {
        _uiState.update { it.copy(password = value, error = null) }
    }

    fun updateCountryCode(value: String) {
        _uiState.update { it.copy(countryCode = value, error = null) }
    }

    fun updateAppSchema(value: String) {
        _uiState.update { it.copy(appSchema = value, error = null) }
    }

    fun refresh() {
        viewModelScope.launch {
            loadState(showLoading = true)
        }
    }

    fun connectSmartLife() {
        viewModelScope.launch {
            val homeId = SessionManager.currentHomeId.value
            if (homeId == null) {
                _uiState.update { it.copy(error = "Сначала выберите дом.") }
                return@launch
            }

            val state = _uiState.value
            val loginIdentifier = state.loginIdentifier.trim()
            val password = state.password
            if (loginIdentifier.isBlank()) {
                _uiState.update { it.copy(error = "Введите e-mail или номер телефона Smart Life.") }
                return@launch
            }
            if (password.isBlank()) {
                _uiState.update { it.copy(error = "Введите пароль Smart Life.") }
                return@launch
            }

            _uiState.update {
                it.copy(
                    isSubmitting = true,
                    error = null,
                    syncMessage = "Подключаем Smart Life аккаунт…",
                )
            }

            try {
                platformRepository.connectTuya(
                    homeId = homeId,
                    accountLabel = resolvedAccountLabel(state),
                    region = resolvedRegion(state),
                    loginIdentifier = loginIdentifier,
                    password = password,
                    countryCode = resolvedCountryCode(state),
                    appSchema = resolvedAppSchema(state),
                )

                _uiState.update {
                    it.copy(
                        isSubmitting = false,
                        password = "",
                        syncMessage = "Аккаунт Smart Life подключён. Загружаем устройства…",
                    )
                }
                syncTuyaInternal(homeId)
            } catch (error: Exception) {
                _uiState.update {
                    it.copy(
                        isSubmitting = false,
                        error = error.toSmartLifeUserMessage(),
                    )
                }
            }
        }
    }

    fun syncTuya() {
        viewModelScope.launch {
            val homeId = SessionManager.currentHomeId.value
            if (homeId == null) {
                _uiState.update { it.copy(error = "Сначала выберите дом.") }
                return@launch
            }
            syncTuyaInternal(homeId)
        }
    }

    fun updateRoomSelection(deviceId: String, roomId: String) {
        _uiState.update { state ->
            state.copy(
                devices = state.devices.map { device ->
                    if (device.id == deviceId) {
                        device.copy(selectedRoomId = roomId, message = null)
                    } else {
                        device
                    }
                },
                error = null,
            )
        }
    }

    fun updateMarkerX(deviceId: String, value: String) {
        _uiState.update { state ->
            state.copy(
                devices = state.devices.map { device ->
                    if (device.id == deviceId) {
                        device.copy(markerX = value, message = null)
                    } else {
                        device
                    }
                },
                error = null,
            )
        }
    }

    fun updateMarkerY(deviceId: String, value: String) {
        _uiState.update { state ->
            state.copy(
                devices = state.devices.map { device ->
                    if (device.id == deviceId) {
                        device.copy(markerY = value, message = null)
                    } else {
                        device
                    }
                },
                error = null,
            )
        }
    }

    fun savePlacement(deviceId: String) {
        viewModelScope.launch {
            val state = _uiState.value
            val device = state.devices.firstOrNull { it.id == deviceId } ?: return@launch
            val selectedRoomId = device.selectedRoomId.ifBlank {
                _uiState.update { it.copy(error = "Выберите комнату для устройства ${device.name}.") }
                return@launch
            }
            val room = state.rooms.firstOrNull { it.id == selectedRoomId }
            if (room == null) {
                _uiState.update { it.copy(error = "Выбранная комната не найдена.") }
                return@launch
            }

            val markerX = device.markerX.trim().takeIf { it.isNotBlank() }?.toIntOrNull()
            val markerY = device.markerY.trim().takeIf { it.isNotBlank() }?.toIntOrNull()
            if ((device.markerX.isNotBlank() && markerX == null) ||
                (device.markerY.isNotBlank() && markerY == null)
            ) {
                _uiState.update { it.copy(error = "Координаты маркера должны быть целыми числами.") }
                return@launch
            }

            _uiState.update { current ->
                current.copy(
                    devices = current.devices.map { currentDevice ->
                        if (currentDevice.id == deviceId) {
                            currentDevice.copy(isSaving = true, message = null)
                        } else {
                            currentDevice
                        }
                    },
                    error = null,
                )
            }

            try {
                platformRepository.updateDevicePlacement(
                    deviceId = deviceId,
                    roomId = selectedRoomId,
                    floorId = room.floorId,
                    markerX = markerX,
                    markerY = markerY,
                    markerTitle = device.name,
                )
                _uiState.update { current ->
                    current.copy(
                        devices = current.devices.map { currentDevice ->
                            if (currentDevice.id == deviceId) {
                                currentDevice.copy(
                                    roomId = selectedRoomId,
                                    isSaving = false,
                                    message = "Размещение сохранено.",
                                )
                            } else {
                                currentDevice
                            }
                        },
                    )
                }
            } catch (error: Exception) {
                _uiState.update { current ->
                    current.copy(
                        devices = current.devices.map { currentDevice ->
                            if (currentDevice.id == deviceId) {
                                currentDevice.copy(
                                    isSaving = false,
                                    message = error.message ?: "Не удалось сохранить размещение.",
                                )
                            } else {
                                currentDevice
                            }
                        },
                        error = error.message ?: "Не удалось сохранить размещение.",
                    )
                }
            }
        }
    }

    private suspend fun syncTuyaInternal(homeId: String) {
        _uiState.update {
            it.copy(
                isSyncing = true,
                isSubmitting = false,
                isWaitingForProviderCallback = false,
                error = null,
                syncMessage = "Синхронизируем устройства Smart Life…",
            )
        }

        try {
            val result = platformRepository.syncTuya(homeId)
            loadState(showLoading = false)
            val summary = if (result.syncedDevices == 0) {
                "Синхронизация завершена, но устройств пока не найдено. Если они уже есть в Smart Life, привяжите app-account к cloud project в Tuya Console и повторите sync."
            } else {
                "Синхронизация ${result.provider.uppercase()} завершена: найдено ${result.syncedDevices} устройств."
            }
            _uiState.update {
                it.copy(
                    isSyncing = false,
                    syncMessage = summary,
                )
            }
        } catch (error: Exception) {
            _uiState.update {
                it.copy(
                    isSyncing = false,
                    error = error.message ?: "Не удалось синхронизировать устройства.",
                )
            }
        }
    }

    private suspend fun loadState(showLoading: Boolean) {
        val homeId = SessionManager.currentHomeId.value
        if (homeId == null) {
            _uiState.update {
                it.copy(
                    isLoading = false,
                    error = "Сначала выберите дом.",
                )
            }
            return
        }

        _uiState.update {
            it.copy(
                isLoading = showLoading,
                error = null,
            )
        }

        try {
            val snapshot = platformRepository.getSnapshot(homeId)
            val integrations = platformRepository.getIntegrations(homeId)
            val tuyaIntegration = integrations.firstOrNull { it.provider == "tuya" }
            val floors = safeList(snapshot.floors).sortedBy { it.sortOrder }
            val rooms = safeList(snapshot.rooms).sortedWith(
                compareBy<ApiRoom>({ it.floorId ?: "" }, { it.sortOrder }, { it.title }),
            )

            _uiState.update { current ->
                current.copy(
                    isLoading = false,
                    connectedDevices = safeList(snapshot.devices).size,
                    integrations = integrations.map { integration ->
                        IntegrationCardState(
                            id = integration.id,
                            provider = integration.provider,
                            status = integration.status,
                            accountLabel = integration.metadata["accountLabel"] as? String ?: "",
                            region = integration.metadata["region"] as? String ?: "eu",
                            updatedAt = integration.updatedAt,
                        )
                    },
                    accountLabel = current.accountLabel.ifBlank {
                        tuyaIntegration?.metadata?.get("accountLabel") as? String ?: "Smart Life"
                    },
                    region = tuyaIntegration?.metadata?.get("region") as? String ?: current.region,
                    loginIdentifier = current.loginIdentifier,
                    countryCode = (tuyaIntegration?.metadata?.get("countryCode") as? String)
                        ?: current.countryCode,
                    appSchema = "tuyaSmart",
                    floors = floors.map { floor ->
                        PlacementFloorOption(
                            id = floor.id,
                            title = floor.title,
                        )
                    },
                    rooms = rooms.map { room ->
                        PlacementRoomOption(
                            id = room.id,
                            floorId = room.floorId,
                            title = room.title,
                        )
                    },
                    devices = safeList(snapshot.devices).map { device ->
                        val previous = current.devices.firstOrNull { it.id == device.id }
                        PlacementDeviceCardState(
                            id = device.id,
                            name = device.name,
                            vendor = device.vendor,
                            model = device.model,
                            category = device.category,
                            status = device.availabilityStatus,
                            roomId = device.roomId,
                            selectedRoomId = previous?.selectedRoomId?.takeIf { it.isNotBlank() } ?: device.roomId.orEmpty(),
                            markerX = previous?.markerX.orEmpty(),
                            markerY = previous?.markerY.orEmpty(),
                            isSaving = false,
                            message = previous?.message,
                        )
                    },
                    isWaitingForProviderCallback = false,
                    linkSession = null,
                )
            }
        } catch (error: Exception) {
            _uiState.update {
                it.copy(
                    isLoading = false,
                    error = error.message ?: "Не удалось загрузить подключение устройств.",
                )
            }
        }
    }

    private fun resolvedAccountLabel(state: AddDeviceUiState): String =
        state.accountLabel.trim().ifBlank { "Smart Life" }

    private fun resolvedRegion(state: AddDeviceUiState): String =
        state.region.trim().ifBlank { "eu" }

    private fun resolvedCountryCode(state: AddDeviceUiState): String =
        state.countryCode.trim().ifBlank { "7" }

    private fun resolvedAppSchema(state: AddDeviceUiState): String = "tuyaSmart"

    companion object {
        val Factory: ViewModelProvider.Factory = object : ViewModelProvider.Factory {
            @Suppress("UNCHECKED_CAST")
            override fun <T : ViewModel> create(modelClass: Class<T>, extras: CreationExtras): T {
                val application = checkNotNull(extras[APPLICATION_KEY]) as RosDomApplication
                return AddDeviceViewModel(application.platformRepository) as T
            }
        }
    }
}

private fun <T> safeList(value: List<T>?): List<T> = value ?: emptyList()

private fun Throwable.toSmartLifeUserMessage(): String {
    return when (this) {
        is HttpException -> normalizeSmartLifeBackendMessage(extractBackendMessage())
            ?: when (code()) {
                400 -> "Smart Life rejected the request. Check login, password, and country code."
                401 -> "Smart Life login or password is incorrect."
                403 -> "Tuya project does not have permission for this Smart Life action."
                404 -> "Smart Life integration route was not found on the RosDom server."
                409 -> "Smart Life login failed. Check that the Smart Life account is linked in Tuya Console under Devices -> Link Tuya App Account."
                else -> "RosDom server returned HTTP ${code()} while connecting Smart Life."
            }

        else -> message ?: "Could not connect the Smart Life account."
    }
}

private fun HttpException.extractBackendMessage(): String? {
    val raw = response()?.errorBody()?.string()?.trim().orEmpty()
    if (raw.isBlank()) {
        return null
    }

    return try {
        val root = JSONObject(raw)
        val error = root.optJSONObject("error")
        val message = error?.optString("message")?.trim().orEmpty()
        if (message.isNotBlank()) {
            message
        } else {
            root.optString("message").trim().ifBlank { null }
        }
    } catch (_: Exception) {
        null
    }
}

private fun normalizeSmartLifeBackendMessage(message: String?): String? {
    val value = message?.trim().orEmpty()
    if (value.isBlank()) {
        return null
    }

    val lowered = value.lowercase()
    return when {
        lowered.contains("1004") && lowered.contains("sign invalid") ->
            "Tuya rejected the project signature. Check TUYA_CLIENT_ID and TUYA_CLIENT_SECRET from Cloud Project Overview and use app schema tuyaSmart."

        else -> value
    }
}

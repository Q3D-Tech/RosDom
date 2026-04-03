package ru.rosdom.ui.screens.device

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
import ru.rosdom.data.network.RosDomWebSocket
import ru.rosdom.data.repository.PlatformRepository
import ru.rosdom.domain.model.Capability
import ru.rosdom.domain.model.Device
import ru.rosdom.domain.model.DeviceStatus
import ru.rosdom.domain.session.SessionManager
import ru.rosdom.ui.state.DeviceState

class DeviceViewModel(
    private val platformRepository: PlatformRepository,
    private val realtimeSocket: RosDomWebSocket,
) : ViewModel() {

    private val _uiState = MutableStateFlow(DeviceState(isLoading = true))
    val uiState: StateFlow<DeviceState> = _uiState.asStateFlow()
    private var activeDeviceId: String? = null

    init {
        observeRealtime()
    }

    private fun observeRealtime() {
        viewModelScope.launch {
            realtimeSocket.events.collect { event ->
                val deviceId = activeDeviceId ?: return@collect
                if (event.homeId == SessionManager.currentHomeId.value && event.topic.startsWith("device.")) {
                    loadDevice(deviceId)
                }
            }
        }
    }

    fun loadDevice(deviceId: String) {
        activeDeviceId = deviceId
        viewModelScope.launch {
            val homeId = SessionManager.currentHomeId.value
            if (homeId == null) {
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        currentError = "Сначала выберите дом.",
                    )
                }
                return@launch
            }

            _uiState.update { it.copy(isLoading = true, currentError = null) }
            try {
                val snapshot = platformRepository.getSnapshot(homeId)
                val deviceDetails = platformRepository.getDeviceDetails(deviceId)
                val device = platformRepository.mapDevices(snapshot).firstOrNull { it.id == deviceId }
                val roomTitle = safeList(snapshot.rooms).firstOrNull { it.id == deviceDetails.device.roomId }?.title.orEmpty()
                _uiState.update {
                    it.copy(
                        device = device,
                        roomTitle = roomTitle,
                        providerLabel = "${deviceDetails.device.vendor} • ${deviceDetails.device.model}",
                        statusSummary = deviceDetails.device.availabilityStatus,
                        commandHistoryCount = safeList(deviceDetails.commands).size,
                        mediaSource = deviceDetails.mediaAsset?.imageUrl,
                        isLoading = false,
                        isUpdating = false,
                    )
                }
            } catch (error: Exception) {
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        currentError = error.message ?: "Не удалось загрузить устройство.",
                    )
                }
            }
        }
    }

    fun updateCapability(newCapability: Capability) {
        val currentDevice = _uiState.value.device ?: return
        val updatedCapabilities = currentDevice.capabilities.map {
            if (it::class == newCapability::class) newCapability else it
        }.ifEmpty { listOf(newCapability) }
        val optimisticDevice = currentDevice.copy(
            capabilities = updatedCapabilities,
            status = DeviceStatus.PENDING,
        )

        _uiState.update {
            it.copy(
                device = optimisticDevice,
                isUpdating = true,
                currentError = null,
            )
        }

        viewModelScope.launch {
            try {
                platformRepository.sendCommand(currentDevice.id, newCapability)
                loadDevice(currentDevice.id)
            } catch (error: Exception) {
                _uiState.update {
                    it.copy(
                        device = currentDevice,
                        isUpdating = false,
                        currentError = error.message ?: "Не удалось отправить команду.",
                    )
                }
            }
        }
    }

    fun onWebSocketUpdate(serverDevice: Device) {
        if (serverDevice.id == _uiState.value.device?.id) {
            _uiState.update {
                it.copy(
                    device = serverDevice,
                    isUpdating = false,
                )
            }
        }
    }

    companion object {
        val Factory: ViewModelProvider.Factory = object : ViewModelProvider.Factory {
            @Suppress("UNCHECKED_CAST")
            override fun <T : ViewModel> create(modelClass: Class<T>, extras: CreationExtras): T {
                val application = checkNotNull(extras[APPLICATION_KEY]) as RosDomApplication
                return DeviceViewModel(
                    application.platformRepository,
                    application.realtimeSocket,
                ) as T
            }
        }
    }
}

private fun <T> safeList(value: List<T>?): List<T> = value ?: emptyList()

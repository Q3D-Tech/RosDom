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
import ru.rosdom.domain.model.DeviceStatus
import ru.rosdom.domain.session.SessionManager
import ru.rosdom.ui.state.DeviceListItem
import ru.rosdom.ui.state.DevicesUiState

class DevicesViewModel(
    private val platformRepository: PlatformRepository,
    private val realtimeSocket: RosDomWebSocket,
) : ViewModel() {
    private val _uiState = MutableStateFlow(DevicesUiState())
    val uiState: StateFlow<DevicesUiState> = _uiState.asStateFlow()

    private var allDevices: List<DeviceListItem> = emptyList()
    private var favoriteDeviceIds: List<String> = emptyList()

    init {
        observeRealtime()
        refresh()
    }

    private fun observeRealtime() {
        viewModelScope.launch {
            realtimeSocket.events.collect { event ->
                val currentHomeId = SessionManager.currentHomeId.value
                if (event.homeId == currentHomeId) {
                    when (event.topic) {
                        "device.state.changed",
                        "device.command.acknowledged",
                        "device.command.failed",
                        "home.state.updated",
                        "integration.account.updated",
                        "integration.sync.completed",
                        "layout.updated" -> refresh()
                    }
                }
            }
        }
    }

    fun refresh() {
        viewModelScope.launch {
            val homeId = SessionManager.currentHomeId.value
            if (homeId == null) {
                _uiState.update {
                    it.copy(isLoading = false, error = "Сначала создайте или выберите дом.")
                }
                return@launch
            }

            _uiState.update { it.copy(isLoading = true, error = null) }
            try {
                val snapshot = platformRepository.getSnapshot(homeId)
                val floors = platformRepository.mapFloors(snapshot)
                val roomById = safeList(snapshot.rooms).associateBy { room -> room.id }
                favoriteDeviceIds = safeList(snapshot.favoriteDevices).map { it.id }
                val preferredFloorId = _uiState.value.activeFloorId
                    ?: snapshot.preferences.activeFloorId
                    ?: floors.firstOrNull()?.id

                allDevices = safeList(snapshot.devices).map { device ->
                    val room = roomById[device.roomId]
                    DeviceListItem(
                        id = device.id,
                        name = device.name,
                        floorId = room?.floorId,
                        roomName = room?.title ?: "Без комнаты",
                        category = device.category,
                        vendor = device.vendor,
                        status = when (device.availabilityStatus) {
                            "online" -> DeviceStatus.ONLINE
                            "degraded" -> DeviceStatus.PENDING
                            "offline" -> DeviceStatus.OFFLINE
                            else -> DeviceStatus.ERROR
                        },
                    )
                }

                val selectedType = _uiState.value.selectedTypeFilter.ifBlank { defaultTypeFilter() }
                _uiState.update { current ->
                    val activeFloorId = preferredFloorId
                    val roomFilters = availableRoomFilters(activeFloorId)
                    val providerFilters = availableProviderFilters(activeFloorId)
                    val normalizedRoom = current.selectedRoomFilter.takeIf { it in roomFilters } ?: "Все комнаты"
                    val normalizedType = current.selectedTypeFilter.takeIf { it in deviceTypeFilters } ?: selectedType
                    val normalizedProvider = current.selectedProviderFilter.takeIf { it in providerFilters } ?: "Все источники"
                    current.copy(
                        isLoading = false,
                        floors = floors,
                        activeFloorId = activeFloorId,
                        devices = applyFilters(
                            roomFilter = normalizedRoom,
                            typeFilter = normalizedType,
                            providerFilter = normalizedProvider,
                            floorId = activeFloorId,
                        ),
                        roomFilters = roomFilters,
                        typeFilters = deviceTypeFilters,
                        providerFilters = providerFilters,
                        selectedRoomFilter = normalizedRoom,
                        selectedTypeFilter = normalizedType,
                        selectedProviderFilter = normalizedProvider,
                        integrationsSummary = if (safeList(snapshot.integrationSummary.providers).isEmpty()) {
                            "Интеграции пока не подключены"
                        } else {
                            "Подключено ${snapshot.integrationSummary.connected}, требуют внимания ${snapshot.integrationSummary.attentionNeeded}"
                        },
                        onlineDevices = allDevices.count { item -> item.status == DeviceStatus.ONLINE },
                        totalDevices = allDevices.size,
                        error = null,
                    )
                }
            } catch (error: Exception) {
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        error = error.message ?: "Не удалось загрузить устройства.",
                    )
                }
            }
        }
    }

    fun setActiveFloor(floorId: String?) {
        _uiState.update { current ->
            val roomFilters = availableRoomFilters(floorId)
            val providerFilters = availableProviderFilters(floorId)
            val selectedRoom = current.selectedRoomFilter.takeIf { it in roomFilters } ?: "Все комнаты"
            val selectedProvider = current.selectedProviderFilter.takeIf { it in providerFilters } ?: "Все источники"
            current.copy(
                activeFloorId = floorId,
                roomFilters = roomFilters,
                providerFilters = providerFilters,
                selectedRoomFilter = selectedRoom,
                selectedProviderFilter = selectedProvider,
                devices = applyFilters(
                    roomFilter = selectedRoom,
                    typeFilter = current.selectedTypeFilter,
                    providerFilter = selectedProvider,
                    floorId = floorId,
                ),
            )
        }
        viewModelScope.launch {
            runCatching {
                platformRepository.updateUserPreferences(activeFloorId = floorId)
            }
        }
    }

    fun setRoomFilter(filter: String) {
        _uiState.update { current ->
            current.copy(
                selectedRoomFilter = filter,
                devices = applyFilters(filter, current.selectedTypeFilter, current.selectedProviderFilter, current.activeFloorId),
            )
        }
    }

    fun setTypeFilter(filter: String) {
        _uiState.update { current ->
            current.copy(
                selectedTypeFilter = filter,
                devices = applyFilters(current.selectedRoomFilter, filter, current.selectedProviderFilter, current.activeFloorId),
            )
        }
    }

    fun setProviderFilter(filter: String) {
        _uiState.update { current ->
            current.copy(
                selectedProviderFilter = filter,
                devices = applyFilters(current.selectedRoomFilter, current.selectedTypeFilter, filter, current.activeFloorId),
            )
        }
    }

    private fun availableRoomFilters(floorId: String?): List<String> =
        listOf("Все комнаты") + allDevices
            .filter { floorId == null || it.floorId == floorId }
            .map { it.roomName }
            .distinct()
            .sorted()

    private fun availableProviderFilters(floorId: String?): List<String> =
        listOf("Все источники") + allDevices
            .filter { floorId == null || it.floorId == floorId }
            .map { it.vendor }
            .distinct()
            .sorted()

    private fun defaultTypeFilter(): String = if (favoriteDeviceIds.isEmpty()) "Все" else "Избранное"

    private fun applyFilters(
        roomFilter: String,
        typeFilter: String,
        providerFilter: String,
        floorId: String?,
    ): List<DeviceListItem> {
        return allDevices.filter { device ->
            val floorMatches = floorId == null || device.floorId == floorId
            val roomMatches = roomFilter == "Все комнаты" || device.roomName == roomFilter
            val providerMatches = providerFilter == "Все источники" || device.vendor == providerFilter
            val typeMatches = when (typeFilter) {
                "Все" -> true
                "Избранное" -> favoriteDeviceIds.contains(device.id)
                "Освещение" -> device.category in setOf("light", "switch", "plug")
                "Климат" -> device.category in setOf("climate", "humidifier", "curtain")
                "Безопасность" -> device.category in setOf("lock", "camera")
                "Датчики" -> device.category == "sensor"
                else -> true
            }
            floorMatches && roomMatches && providerMatches && typeMatches
        }
    }

    companion object {
        private val deviceTypeFilters = listOf("Избранное", "Освещение", "Климат", "Безопасность", "Датчики", "Все")

        val Factory: ViewModelProvider.Factory = object : ViewModelProvider.Factory {
            @Suppress("UNCHECKED_CAST")
            override fun <T : ViewModel> create(modelClass: Class<T>, extras: CreationExtras): T {
                val application = checkNotNull(extras[APPLICATION_KEY]) as RosDomApplication
                return DevicesViewModel(
                    application.platformRepository,
                    application.realtimeSocket,
                ) as T
            }
        }
    }
}

private fun <T> safeList(value: List<T>?): List<T> = value ?: emptyList()

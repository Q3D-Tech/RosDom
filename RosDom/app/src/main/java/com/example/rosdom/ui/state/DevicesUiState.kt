package ru.rosdom.ui.state

import ru.rosdom.domain.model.DeviceStatus
import ru.rosdom.domain.model.Floor

data class DeviceListItem(
    val id: String,
    val name: String,
    val floorId: String?,
    val roomName: String,
    val category: String,
    val vendor: String,
    val status: DeviceStatus,
)

data class DevicesUiState(
    val isLoading: Boolean = true,
    val floors: List<Floor> = emptyList(),
    val activeFloorId: String? = null,
    val devices: List<DeviceListItem> = emptyList(),
    val roomFilters: List<String> = listOf("Все комнаты"),
    val selectedRoomFilter: String = "Все комнаты",
    val typeFilters: List<String> = listOf("Избранное", "Освещение", "Климат", "Безопасность", "Датчики", "Все"),
    val selectedTypeFilter: String = "Избранное",
    val providerFilters: List<String> = listOf("Все источники"),
    val selectedProviderFilter: String = "Все источники",
    val integrationsSummary: String = "",
    val onlineDevices: Int = 0,
    val totalDevices: Int = 0,
    val error: String? = null,
)

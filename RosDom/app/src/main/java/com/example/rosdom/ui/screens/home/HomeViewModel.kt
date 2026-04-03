package ru.rosdom.ui.screens.home

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
import ru.rosdom.data.network.RosDomWebSocket
import ru.rosdom.data.repository.PlatformRepository
import ru.rosdom.domain.model.Device
import ru.rosdom.domain.model.UserMode
import ru.rosdom.domain.session.SessionManager
import ru.rosdom.ui.state.FamilyMemberPreview
import ru.rosdom.ui.state.HomeAlertPreview
import ru.rosdom.ui.state.HomeRoomSummary
import ru.rosdom.ui.state.HomeUiState

class HomeViewModel(
    private val platformRepository: PlatformRepository,
    private val realtimeSocket: RosDomWebSocket,
) : ViewModel() {

    private val _uiState = MutableStateFlow(HomeUiState(isLoading = true))
    val uiState: StateFlow<HomeUiState> = _uiState.asStateFlow()

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
                        "home.state.updated",
                        "layout.updated",
                        "device.state.changed",
                        "device.command.acknowledged",
                        "device.command.failed",
                        "notification.created",
                        "security.alert.created",
                        "security.alert.resolved",
                        "task.updated",
                        "reward.balance.updated",
                        "integration.account.updated",
                        "integration.sync.completed" -> refresh()
                    }
                }
            }
        }
    }

    fun setActiveFloor(floorId: String?) {
        _uiState.update { current -> current.copy(activeFloorId = floorId) }
        viewModelScope.launch {
            runCatching {
                platformRepository.updateUserPreferences(activeFloorId = floorId)
            }
            refresh()
        }
    }

    fun setHomeMode(mode: String) {
        viewModelScope.launch {
            val homeId = SessionManager.currentHomeId.value ?: return@launch
            runCatching {
                platformRepository.updateHomeState(homeId, currentMode = mode)
            }.onFailure { error ->
                _uiState.update {
                    it.copy(error = error.message ?: "Не удалось изменить режим дома.")
                }
            }
        }
    }

    fun refresh() {
        viewModelScope.launch {
            val homeId = SessionManager.currentHomeId.value
            val user = SessionManager.currentUser.value
            if (homeId == null || user == null) {
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        error = "Сначала настройте дом и войдите в аккаунт.",
                    )
                }
                return@launch
            }

            _uiState.update { it.copy(isLoading = true, error = null) }
            try {
                val snapshot = platformRepository.getSnapshot(homeId)
                val userMode = user.mode
                val floors = platformRepository.mapFloors(snapshot)
                val activeFloorId = _uiState.value.activeFloorId
                    ?: snapshot.preferences.activeFloorId
                    ?: floors.firstOrNull()?.id
                val roomById = safeList(snapshot.rooms).associateBy { it.id }

                val favoriteDevices = when (userMode) {
                    UserMode.KIDS -> safeList(snapshot.allowedDevicesForChild)
                    else -> safeList(snapshot.favoriteDevices)
                }

                val allMappedDevices = platformRepository.mapDevices(snapshot)
                val quickAccessDevices = if (favoriteDevices.isEmpty()) {
                    allMappedDevices.filterByFloor(roomById, activeFloorId).take(4)
                } else {
                    favoriteDevices
                        .mapNotNull { favorite -> allMappedDevices.firstOrNull { it.id == favorite.id } }
                        .filterByFloor(roomById, activeFloorId)
                }

                val roomSummaries = safeList(snapshot.roomSummaries)
                    .filter { summary -> activeFloorId == null || summary.floorId == activeFloorId }
                    .map { summary ->
                        HomeRoomSummary(
                            id = summary.roomId,
                            floorId = summary.floorId,
                            title = summary.title,
                            deviceCount = summary.deviceCount,
                            taskCount = summary.taskCount,
                        )
                    }

                val climateValues = safeList(snapshot.latestStates).flatMap { it.values.entries }
                val temperature = (climateValues.firstOrNull { it.key == "temperature" }?.value as? Number)?.toFloat()
                val humidity = (climateValues.firstOrNull { it.key == "humidity" }?.value as? Number)?.toFloat()

                val familyMembers = buildList {
                    add(FamilyMemberPreview("Взрослые", "${snapshot.familySummary.adults} в семье"))
                    add(FamilyMemberPreview("Дети", "${snapshot.familySummary.children} профиля"))
                    add(FamilyMemberPreview("Пожилые", "${snapshot.familySummary.elderly} профиля"))
                }

                _uiState.update {
                    it.copy(
                        isLoading = false,
                        homeName = snapshot.home.title,
                        currentModeLabel = currentModeLabel(snapshot.home.currentMode),
                        userName = user.name,
                        userMode = userMode,
                        temperature = temperature?.let { value -> "${value.toInt()}°C" } ?: "—",
                        humidity = humidity?.let { value -> "${value.toInt()}%" } ?: "—",
                        securityStatus = securityStatusLabel(snapshot.securitySummary.securityMode, snapshot.securitySummary.activeAlerts),
                        securityArmed = snapshot.securitySummary.securityMode != "disarmed",
                        onlineDevices = snapshot.summary.onlineDevices,
                        totalDevices = safeList(snapshot.devices).size,
                        pendingTasks = snapshot.summary.pendingTasks,
                        rewardBalance = if (userMode == UserMode.KIDS) {
                            platformRepository.getRewardBalance(homeId)
                        } else {
                            0
                        },
                        integrationCount = snapshot.integrationSummary.connected,
                        activeFloorId = activeFloorId,
                        floors = floors,
                        familyMembers = familyMembers,
                        quickAccessDevices = quickAccessDevices,
                        rooms = roomSummaries,
                        alerts = safeList(snapshot.alerts).take(4).map { item ->
                            HomeAlertPreview(
                                id = item.id,
                                title = eventTitle(item.topic),
                                subtitle = item.payload["status"]?.toString()
                                    ?: item.payload["securityMode"]?.toString()
                                    ?: item.createdAt,
                                severity = item.severity,
                            )
                        },
                        error = null,
                    )
                }
            } catch (error: Exception) {
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        error = error.message ?: "Не удалось загрузить состояние дома.",
                    )
                }
            }
        }
    }

    companion object {
        val Factory: ViewModelProvider.Factory = object : ViewModelProvider.Factory {
            @Suppress("UNCHECKED_CAST")
            override fun <T : ViewModel> create(modelClass: Class<T>, extras: CreationExtras): T {
                val application = checkNotNull(extras[APPLICATION_KEY]) as RosDomApplication
                return HomeViewModel(
                    application.platformRepository,
                    application.realtimeSocket,
                ) as T
            }
        }
    }
}

private fun currentModeLabel(mode: String): String = when (mode) {
    "away" -> "Вне дома"
    "night" -> "Ночной контур"
    "armed" -> "Охрана"
    else -> "Я дома"
}

private fun securityStatusLabel(mode: String, alerts: Int): String {
    val modeLabel = when (mode) {
        "armed" -> "Охрана включена"
        "night" -> "Активен ночной контур"
        else -> "Охрана снята"
    }
    return if (alerts > 0) {
        "$modeLabel • тревог $alerts"
    } else {
        modeLabel
    }
}

private fun eventTitle(topic: String): String = when (topic) {
    "home.state.updated" -> "Изменился режим дома"
    "security.alert.created" -> "Новая тревога"
    "security.alert.resolved" -> "Тревога закрыта"
    "device.state.changed" -> "Изменилось устройство"
    "task.updated" -> "Обновилась задача"
    else -> topic.replace('.', ' ')
}

private fun List<Device>.filterByFloor(
    roomById: Map<String, ApiRoom>,
    floorId: String?,
): List<Device> = filter { device ->
    floorId == null || roomById[device.roomId]?.floorId == floorId
}

private fun <T> safeList(value: List<T>?): List<T> = value ?: emptyList()

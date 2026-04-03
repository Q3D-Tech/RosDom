package ru.rosdom.ui.screens.security

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
import ru.rosdom.domain.session.SessionManager
import ru.rosdom.ui.state.SecurityAlertItem
import ru.rosdom.ui.state.SecurityEventItem
import ru.rosdom.ui.state.SecurityUiState

class SecurityViewModel(
    private val platformRepository: PlatformRepository,
    private val realtimeSocket: RosDomWebSocket,
) : ViewModel() {
    private val _uiState = MutableStateFlow(SecurityUiState())
    val uiState: StateFlow<SecurityUiState> = _uiState.asStateFlow()

    init {
        observeRealtime()
        refresh()
    }

    private fun observeRealtime() {
        viewModelScope.launch {
            realtimeSocket.events.collect { event ->
                if (event.homeId == SessionManager.currentHomeId.value) {
                    when (event.topic) {
                        "home.state.updated",
                        "device.state.changed",
                        "notification.created",
                        "security.alert.created",
                        "security.alert.resolved" -> refresh()
                    }
                }
            }
        }
    }

    fun refresh() {
        viewModelScope.launch {
            val homeId = SessionManager.currentHomeId.value
            if (homeId == null) {
                _uiState.update { it.copy(isLoading = false, error = "Сначала создайте дом.") }
                return@launch
            }

            _uiState.update { it.copy(isLoading = true, error = null) }
            try {
                val snapshot = platformRepository.getSnapshot(homeId)
                val events = platformRepository.getEvents(homeId)
                val notifications = platformRepository.getNotifications(homeId)
                val statesByDevice = safeList(snapshot.latestStates).associateBy { it.deviceId }
                val sensorIds = safeList(snapshot.devices).filter { it.category == "sensor" }.map { it.id }
                val lockIds = safeList(snapshot.devices).filter { it.category == "lock" }.map { it.id }

                _uiState.update {
                    it.copy(
                        isLoading = false,
                        homeName = snapshot.home.title,
                        securityMode = snapshot.home.securityMode,
                        camerasOnline = safeList(snapshot.devices).count { device -> device.category == "camera" && device.availabilityStatus == "online" },
                        locksOnline = safeList(snapshot.devices).count { device -> device.category == "lock" && device.availabilityStatus == "online" },
                        openEntries = sensorIds.count { id -> statesByDevice[id]?.values?.get("contact") == true } +
                            lockIds.count { id -> statesByDevice[id]?.values?.get("contact") == true },
                        motionAlerts = sensorIds.count { id -> statesByDevice[id]?.values?.get("motion") == true },
                        alerts = notifications.take(6).map { notification ->
                            SecurityAlertItem(
                                id = notification.id,
                                title = notification.title,
                                body = notification.body,
                                type = notification.type,
                                read = notification.readAt != null,
                                createdAt = notification.createdAt,
                            )
                        },
                        events = events.takeLast(10).reversed().map { event ->
                            SecurityEventItem(
                                id = event.id,
                                title = eventTitle(event.topic),
                                subtitle = eventSubtitle(event.payload, event.roomId),
                                severity = event.severity,
                                createdAt = event.createdAt,
                            )
                        },
                        error = null,
                    )
                }
            } catch (error: Exception) {
                _uiState.update {
                    it.copy(isLoading = false, error = error.message ?: "Не удалось загрузить охрану.")
                }
            }
        }
    }

    fun setSecurityMode(mode: String) {
        viewModelScope.launch {
            val homeId = SessionManager.currentHomeId.value
            if (homeId == null) {
                _uiState.update { it.copy(error = "Дом не выбран.") }
                return@launch
            }
            _uiState.update { it.copy(isUpdating = true, error = null) }
            try {
                platformRepository.updateHomeState(homeId, securityMode = mode)
                refresh()
            } catch (error: Exception) {
                _uiState.update {
                    it.copy(isUpdating = false, error = error.message ?: "Не удалось изменить режим охраны.")
                }
            }
        }
    }

    fun markAlertRead(notificationId: String) {
        viewModelScope.launch {
            val homeId = SessionManager.currentHomeId.value ?: return@launch
            try {
                platformRepository.markNotificationRead(homeId, notificationId)
                refresh()
            } catch (error: Exception) {
                _uiState.update {
                    it.copy(error = error.message ?: "Не удалось отметить уведомление как прочитанное.")
                }
            }
        }
    }

    companion object {
        val Factory: ViewModelProvider.Factory = object : ViewModelProvider.Factory {
            @Suppress("UNCHECKED_CAST")
            override fun <T : ViewModel> create(modelClass: Class<T>, extras: CreationExtras): T {
                val application = checkNotNull(extras[APPLICATION_KEY]) as RosDomApplication
                return SecurityViewModel(application.platformRepository, application.realtimeSocket) as T
            }
        }
    }
}

private fun <T> safeList(value: List<T>?): List<T> = value ?: emptyList()

private fun eventTitle(topic: String): String = when (topic) {
    "home.state.updated" -> "Изменён режим дома"
    "device.state.changed" -> "Изменилось состояние устройства"
    "security.alert.created" -> "Создано тревожное уведомление"
    "security.alert.resolved" -> "Тревога закрыта"
    else -> topic
}

private fun eventSubtitle(payload: Map<String, Any?>, roomId: String?): String {
    val securityMode = payload["securityMode"]?.toString()
    val provider = payload["provider"]?.toString()
    return buildString {
        if (!securityMode.isNullOrBlank()) append("режим: ").append(securityMode)
        if (!provider.isNullOrBlank()) {
            if (isNotBlank()) append(" • ")
            append("источник: ").append(provider)
        }
        if (!roomId.isNullOrBlank()) {
            if (isNotBlank()) append(" • ")
            append("комната: ").append(roomId)
        }
        if (isBlank()) append("Событие дома")
    }
}

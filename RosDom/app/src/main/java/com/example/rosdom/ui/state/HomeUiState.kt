package ru.rosdom.ui.state

import ru.rosdom.domain.model.Device
import ru.rosdom.domain.model.Floor
import ru.rosdom.domain.model.UserMode

data class HomeRoomSummary(
    val id: String,
    val floorId: String?,
    val title: String,
    val deviceCount: Int,
    val taskCount: Int,
)

data class HomeAlertPreview(
    val id: String,
    val title: String,
    val subtitle: String,
    val severity: String = "info",
)

data class FamilyMemberPreview(
    val title: String,
    val subtitle: String,
)

data class HomeUiState(
    val isLoading: Boolean = true,
    val homeName: String = "",
    val currentModeLabel: String = "Я дома",
    val userName: String = "",
    val userMode: UserMode = UserMode.ADULT,
    val temperature: String = "—",
    val humidity: String = "—",
    val securityStatus: String = "",
    val securityArmed: Boolean = false,
    val onlineDevices: Int = 0,
    val totalDevices: Int = 0,
    val pendingTasks: Int = 0,
    val rewardBalance: Int = 0,
    val integrationCount: Int = 0,
    val activeFloorId: String? = null,
    val floors: List<Floor> = emptyList(),
    val familyMembers: List<FamilyMemberPreview> = emptyList(),
    val quickAccessDevices: List<Device> = emptyList(),
    val rooms: List<HomeRoomSummary> = emptyList(),
    val alerts: List<HomeAlertPreview> = emptyList(),
    val error: String? = null,
)

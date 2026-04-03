package ru.rosdom.ui.state

data class SecurityEventItem(
    val id: String,
    val title: String,
    val subtitle: String,
    val severity: String,
    val createdAt: String,
)

data class SecurityAlertItem(
    val id: String,
    val title: String,
    val body: String,
    val type: String,
    val read: Boolean,
    val createdAt: String,
)

data class SecurityUiState(
    val isLoading: Boolean = true,
    val isUpdating: Boolean = false,
    val homeName: String = "",
    val securityMode: String = "disarmed",
    val camerasOnline: Int = 0,
    val openEntries: Int = 0,
    val motionAlerts: Int = 0,
    val locksOnline: Int = 0,
    val alerts: List<SecurityAlertItem> = emptyList(),
    val events: List<SecurityEventItem> = emptyList(),
    val error: String? = null,
)

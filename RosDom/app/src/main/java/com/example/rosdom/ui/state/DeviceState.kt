package ru.rosdom.ui.state

import ru.rosdom.domain.model.Device

data class DeviceState(
    val device: Device? = null,
    val roomTitle: String = "",
    val providerLabel: String = "",
    val statusSummary: String = "",
    val commandHistoryCount: Int = 0,
    val mediaSource: String? = null,
    val isLoading: Boolean = false,
    val isUpdating: Boolean = false,
    val currentError: String? = null,
)

data class DeviceListUiState(
    val isLoading: Boolean = true,
    val deviceStates: List<DeviceState> = emptyList(),
    val filterCategory: String = "All",
    val error: String? = null,
)

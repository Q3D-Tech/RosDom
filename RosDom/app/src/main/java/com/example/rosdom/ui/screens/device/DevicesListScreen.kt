package ru.rosdom.ui.screens.device

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Add
import androidx.compose.material.icons.filled.Devices
import androidx.compose.material.icons.filled.Lightbulb
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Router
import androidx.compose.material.icons.filled.Sensors
import androidx.compose.material.icons.filled.Thermostat
import androidx.compose.material.icons.filled.Videocam
import androidx.compose.material3.ExtendedFloatingActionButton
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import ru.rosdom.domain.model.DeviceStatus
import ru.rosdom.ui.components.RosDomActionTile
import ru.rosdom.ui.components.RosDomEmptyCard
import ru.rosdom.ui.components.RosDomFloorSwitcher
import ru.rosdom.ui.components.RosDomHeroCard
import ru.rosdom.ui.components.RosDomInfoBanner
import ru.rosdom.ui.components.RosDomMetricTile
import ru.rosdom.ui.components.RosDomPageBackground
import ru.rosdom.ui.components.RosDomScreenHeader
import ru.rosdom.ui.components.RosDomSectionHeader
import ru.rosdom.ui.state.DeviceListItem
import ru.rosdom.ui.theme.RosDomAmber
import ru.rosdom.ui.theme.RosDomCritical
import ru.rosdom.ui.theme.RosDomCyan
import ru.rosdom.ui.theme.RosDomMint
import ru.rosdom.ui.theme.RosDomPurple

@Composable
fun DevicesListScreen(
    viewModel: DevicesViewModel = androidx.lifecycle.viewmodel.compose.viewModel(factory = DevicesViewModel.Factory),
    onNavigateToDevice: (String) -> Unit = {},
    onNavigateToAddDevice: () -> Unit = {},
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()

    Scaffold(
        containerColor = Color.Transparent,
        floatingActionButton = {
            ExtendedFloatingActionButton(
                onClick = onNavigateToAddDevice,
                icon = { Icon(Icons.Filled.Add, contentDescription = null) },
                text = { Text("Подключить устройство") },
            )
        },
    ) { padding ->
        RosDomPageBackground(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding),
        ) {
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                verticalArrangement = Arrangement.spacedBy(18.dp),
                contentPadding = PaddingValues(horizontal = 20.dp, vertical = 16.dp),
            ) {
                item {
                    RosDomScreenHeader(
                        title = "Устройства",
                        subtitle = "Избранное, освещение, климат и безопасность собраны в одном каталоге по этажам и комнатам.",
                    )
                }

                item {
                    RosDomHeroCard(
                        eyebrow = "Каталог дома",
                        title = "${state.onlineDevices}/${state.totalDevices}",
                        subtitle = if (state.totalDevices == 0) {
                            "Подключите Tuya или Smart Life, затем синхронизируйте устройства и назначьте их комнатам."
                        } else {
                            "${state.integrationsSummary}. Фильтруйте устройства по этажам, комнатам и категориям."
                        },
                        icon = Icons.Filled.Devices,
                        actionLabel = "Подключить",
                        onAction = onNavigateToAddDevice,
                    )
                }

                if (!state.error.isNullOrBlank()) {
                    item {
                        RosDomInfoBanner(
                            message = state.error.orEmpty(),
                            accent = RosDomCritical,
                        )
                    }
                }

                if (state.floors.isNotEmpty()) {
                    item {
                        RosDomSectionHeader(title = "Этажи")
                    }
                    item {
                        RosDomFloorSwitcher(
                            floors = state.floors,
                            activeFloorId = state.activeFloorId,
                            includeAll = true,
                            onSelect = viewModel::setActiveFloor,
                        )
                    }
                }

                item {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(12.dp),
                    ) {
                        RosDomMetricTile(
                            title = "Онлайн",
                            value = state.onlineDevices.toString(),
                            subtitle = "из ${state.totalDevices} устройств",
                            icon = Icons.Filled.Devices,
                            accent = RosDomMint,
                            modifier = Modifier.weight(1f),
                        )
                        RosDomMetricTile(
                            title = "Интеграции",
                            value = (state.providerFilters.size - 1).coerceAtLeast(0).toString(),
                            subtitle = "активных источников",
                            icon = Icons.Filled.Router,
                            accent = RosDomCyan,
                            modifier = Modifier.weight(1f),
                        )
                    }
                }

                item {
                    RosDomSectionHeader(title = "Быстрые категории")
                }

                item {
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        items(deviceCategories, key = { it.filter }) { category ->
                            RosDomActionTile(
                                title = category.title,
                                subtitle = category.subtitle,
                                icon = category.icon,
                                accent = category.accent,
                                modifier = Modifier.fillParentMaxWidth(0.62f),
                                onClick = { viewModel.setTypeFilter(category.filter) },
                            )
                        }
                    }
                }

                item {
                    RosDomSectionHeader(title = "Фильтры")
                }

                item {
                    FilterRow(
                        title = "Комнаты",
                        values = state.roomFilters,
                        selected = state.selectedRoomFilter,
                        onSelect = viewModel::setRoomFilter,
                    )
                }

                item {
                    FilterRow(
                        title = "Категории",
                        values = state.typeFilters,
                        selected = state.selectedTypeFilter,
                        onSelect = viewModel::setTypeFilter,
                    )
                }

                item {
                    FilterRow(
                        title = "Источники",
                        values = state.providerFilters,
                        selected = state.selectedProviderFilter,
                        onSelect = viewModel::setProviderFilter,
                    )
                }

                item {
                    RosDomSectionHeader(title = "Список устройств")
                }

                if (state.devices.isEmpty() && !state.isLoading && state.error == null) {
                    item {
                        RosDomEmptyCard(
                            title = "Подходящих устройств пока нет",
                            body = "Измените фильтры или подключите новую интеграцию, чтобы наполнить каталог умного дома.",
                        )
                    }
                } else {
                    items(state.devices, key = { it.id }) { device ->
                        DeviceRow(device = device, onClick = { onNavigateToDevice(device.id) })
                    }
                }
            }
        }
    }
}

private data class DeviceCategoryCard(
    val title: String,
    val subtitle: String,
    val filter: String,
    val icon: ImageVector,
    val accent: Color,
)

private val deviceCategories = listOf(
    DeviceCategoryCard("Избранное", "Самые важные устройства дома", "Избранное", Icons.Filled.Devices, RosDomPurple),
    DeviceCategoryCard("Освещение", "Лампы, выключатели и розетки", "Освещение", Icons.Filled.Lightbulb, RosDomAmber),
    DeviceCategoryCard("Климат", "Температура и среда", "Климат", Icons.Filled.Thermostat, RosDomCyan),
    DeviceCategoryCard("Безопасность", "Замки и камеры", "Безопасность", Icons.Filled.Lock, RosDomCritical),
    DeviceCategoryCard("Датчики", "Сенсоры движения и контакта", "Датчики", Icons.Filled.Sensors, RosDomMint),
)

@Composable
private fun FilterRow(
    title: String,
    values: List<String>,
    selected: String,
    onSelect: (String) -> Unit,
) {
    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
        Text(
            text = title,
            style = MaterialTheme.typography.titleMedium,
            color = MaterialTheme.colorScheme.onBackground,
        )
        LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            items(values, key = { it }) { filter ->
                FilterChip(
                    selected = selected == filter,
                    onClick = { onSelect(filter) },
                    label = { Text(filter) },
                )
            }
        }
    }
}

@Composable
private fun DeviceRow(
    device: DeviceListItem,
    onClick: () -> Unit,
) {
    Surface(
        shape = MaterialTheme.shapes.large,
        color = MaterialTheme.colorScheme.surface,
        onClick = onClick,
        modifier = Modifier
            .fillMaxWidth()
            .height(110.dp),
    ) {
        Row(
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 18.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Row(
                modifier = Modifier.weight(1f),
                horizontalArrangement = Arrangement.spacedBy(14.dp),
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Surface(
                    shape = MaterialTheme.shapes.medium,
                    color = MaterialTheme.colorScheme.surfaceVariant,
                ) {
                    Icon(
                        imageVector = categoryIcon(device.category),
                        contentDescription = null,
                        tint = categoryAccent(device.category),
                        modifier = Modifier.padding(14.dp),
                    )
                }
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    Text(
                        text = device.name,
                        color = MaterialTheme.colorScheme.onSurface,
                        style = MaterialTheme.typography.titleMedium,
                    )
                    Text(
                        text = "${device.roomName} • ${device.vendor} • ${categoryLabel(device.category)}",
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        style = MaterialTheme.typography.bodySmall,
                    )
                }
            }
            StatusPill(status = device.status)
        }
    }
}

@Composable
private fun StatusPill(status: DeviceStatus) {
    val (text, background, content) = when (status) {
        DeviceStatus.ONLINE -> Triple("Онлайн", RosDomMint.copy(alpha = 0.18f), RosDomMint)
        DeviceStatus.PENDING -> Triple("Обновляется", RosDomAmber.copy(alpha = 0.18f), RosDomAmber)
        DeviceStatus.OFFLINE -> Triple("Офлайн", MaterialTheme.colorScheme.surfaceVariant, MaterialTheme.colorScheme.onSurfaceVariant)
        DeviceStatus.ERROR -> Triple("Ошибка", RosDomCritical.copy(alpha = 0.18f), RosDomCritical)
    }
    Surface(color = background, shape = MaterialTheme.shapes.medium) {
        Text(
            text = text,
            color = content,
            modifier = Modifier.padding(horizontal = 12.dp, vertical = 8.dp),
            style = MaterialTheme.typography.labelMedium,
        )
    }
}

private fun categoryLabel(category: String): String = when (category) {
    "light" -> "освещение"
    "camera" -> "камера"
    "sensor" -> "датчик"
    "lock" -> "замок"
    "plug" -> "розетка"
    "switch" -> "выключатель"
    "climate" -> "климат"
    else -> category
}

private fun categoryIcon(category: String): ImageVector = when (category) {
    "light" -> Icons.Filled.Lightbulb
    "camera" -> Icons.Filled.Videocam
    "sensor" -> Icons.Filled.Sensors
    "lock" -> Icons.Filled.Lock
    "climate" -> Icons.Filled.Thermostat
    else -> Icons.Filled.Router
}

private fun categoryAccent(category: String): Color = when (category) {
    "light" -> RosDomAmber
    "camera" -> RosDomPurple
    "sensor" -> RosDomMint
    "lock" -> RosDomCritical
    "climate" -> RosDomCyan
    else -> RosDomPurple
}

package ru.rosdom.ui.screens.home

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.GridView
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Lightbulb
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Notifications
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material.icons.filled.TaskAlt
import androidx.compose.material.icons.filled.Thermostat
import androidx.compose.material.icons.filled.Wallet
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import ru.rosdom.domain.model.Device
import ru.rosdom.domain.model.DeviceStatus
import ru.rosdom.domain.model.UserMode
import ru.rosdom.ui.components.RosDomActionTile
import ru.rosdom.ui.components.RosDomEmptyCard
import ru.rosdom.ui.components.RosDomFloorSwitcher
import ru.rosdom.ui.components.RosDomHeroCard
import ru.rosdom.ui.components.RosDomInfoBanner
import ru.rosdom.ui.components.RosDomMetricTile
import ru.rosdom.ui.components.RosDomPageBackground
import ru.rosdom.ui.components.RosDomScreenHeader
import ru.rosdom.ui.components.RosDomSectionHeader
import ru.rosdom.ui.components.RosDomStatChip
import ru.rosdom.ui.state.FamilyMemberPreview
import ru.rosdom.ui.state.HomeAlertPreview
import ru.rosdom.ui.state.HomeRoomSummary
import ru.rosdom.ui.theme.RosDomAmber
import ru.rosdom.ui.theme.RosDomCritical
import ru.rosdom.ui.theme.RosDomCyan
import ru.rosdom.ui.theme.RosDomMint
import ru.rosdom.ui.theme.RosDomPurple

@Composable
fun HomeScreen(
    viewModel: HomeViewModel = androidx.lifecycle.viewmodel.compose.viewModel(factory = HomeViewModel.Factory),
    onNavigateToDevice: (String) -> Unit = {},
    onNavigateToProfile: () -> Unit = {},
    onNavigateToRooms: () -> Unit = {},
    onNavigateToDevices: () -> Unit = {},
    onNavigateToSecurity: () -> Unit = {},
    onNavigateToTasks: () -> Unit = {},
    onNavigateToRewards: () -> Unit = {},
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()

    RosDomPageBackground {
        if (state.isLoading) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = RosDomPurple)
            }
            return@RosDomPageBackground
        }

        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(horizontal = 20.dp, vertical = 16.dp),
            verticalArrangement = Arrangement.spacedBy(18.dp),
        ) {
            item {
                RosDomScreenHeader(
                    title = "Мой дом",
                    subtitle = if (state.userName.isBlank()) {
                        "Управляйте устройствами, безопасностью и семьёй из одного центра."
                    } else {
                        "Здравствуйте, ${state.userName}. Дом готов к управлению."
                    },
                    trailing = {
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            HeaderIconButton(Icons.Filled.Notifications, "Уведомления") {}
                            HeaderIconButton(Icons.Filled.Person, "Профиль", onNavigateToProfile)
                        }
                    },
                )
            }

            item {
                RosDomHeroCard(
                    eyebrow = "Premium Guardian",
                    title = state.currentModeLabel,
                    subtitle = buildString {
                        append(state.homeName.ifBlank { "Главный дом семьи" })
                        if (state.securityStatus.isNotBlank()) {
                            append(" • ").append(state.securityStatus)
                        }
                    },
                    icon = Icons.Filled.Home,
                    footer = {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                        ) {
                            RosDomStatChip(
                                icon = Icons.Filled.Thermostat,
                                label = "${state.temperature} • ${state.humidity}",
                                accent = RosDomAmber,
                            )
                            RosDomStatChip(
                                icon = Icons.Filled.Lightbulb,
                                label = "${state.onlineDevices}/${state.totalDevices} онлайн",
                                accent = RosDomMint,
                            )
                        }
                    },
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
                        onSelect = viewModel::setActiveFloor,
                    )
                }
            }

            item {
                RosDomSectionHeader(title = "Сцены дома")
            }

            item {
                LazyRow(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    items(homeModes) { mode ->
                        RosDomActionTile(
                            title = mode.title,
                            subtitle = mode.subtitle,
                            icon = mode.icon,
                            accent = mode.accent,
                            modifier = Modifier.width(176.dp),
                            onClick = { viewModel.setHomeMode(mode.serverValue) },
                        )
                    }
                }
            }

            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    RosDomMetricTile(
                        title = "Комнаты",
                        value = state.rooms.size.toString(),
                        subtitle = "на активном этаже",
                        icon = Icons.Filled.GridView,
                        accent = RosDomCyan,
                        modifier = Modifier.weight(1f),
                        onClick = onNavigateToRooms,
                    )
                    RosDomMetricTile(
                        title = if (state.userMode == UserMode.KIDS) "Награды" else "Охрана",
                        value = if (state.userMode == UserMode.KIDS) "${state.rewardBalance} ₽" else if (state.securityArmed) "ON" else "OFF",
                        subtitle = if (state.userMode == UserMode.KIDS) "детский баланс" else state.securityStatus,
                        icon = if (state.userMode == UserMode.KIDS) Icons.Filled.Wallet else Icons.Filled.Shield,
                        accent = if (state.userMode == UserMode.KIDS) RosDomAmber else RosDomCritical,
                        modifier = Modifier.weight(1f),
                        onClick = if (state.userMode == UserMode.KIDS) onNavigateToRewards else onNavigateToSecurity,
                    )
                }
            }

            item {
                RosDomSectionHeader(
                    title = when (state.userMode) {
                        UserMode.KIDS -> "Мой быстрый доступ"
                        UserMode.ELDERLY -> "Главные действия"
                        UserMode.ADULT -> "Центр управления"
                    },
                )
            }

            item {
                LazyRow(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    items(homeActionsForMode(state.userMode), key = { it.title }) { action ->
                        RosDomActionTile(
                            title = action.title,
                            subtitle = action.subtitle,
                            icon = action.icon,
                            accent = action.accent,
                            modifier = Modifier.width(196.dp),
                            onClick = action.onClick(
                                onNavigateToDevices,
                                onNavigateToRooms,
                                onNavigateToSecurity,
                                onNavigateToTasks,
                                onNavigateToRewards,
                                onNavigateToProfile,
                            ),
                        )
                    }
                }
            }

            item {
                RosDomSectionHeader(
                    title = if (state.userMode == UserMode.KIDS) "Разрешённые устройства" else "Избранные устройства",
                    actionLabel = "Все",
                    onAction = onNavigateToDevices,
                )
            }

            if (state.quickAccessDevices.isEmpty()) {
                item {
                    RosDomEmptyCard(
                        title = "Пока нет устройств",
                        body = "Подключите Tuya или Smart Life, и здесь появятся устройства для быстрого управления.",
                    )
                }
            } else {
                item {
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        items(state.quickAccessDevices, key = { it.id }) { device ->
                            HomeDeviceCard(
                                device = device,
                                onClick = { onNavigateToDevice(device.id) },
                            )
                        }
                    }
                }
            }

            if (state.familyMembers.isNotEmpty()) {
                item {
                    RosDomSectionHeader(title = "Семья")
                }
                item {
                    LazyRow(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        items(state.familyMembers, key = { it.title }) { member ->
                            FamilyCard(member = member)
                        }
                    }
                }
            }

            item {
                RosDomSectionHeader(title = "Комнаты и зоны", actionLabel = "Открыть", onAction = onNavigateToRooms)
            }

            if (state.rooms.isEmpty()) {
                item {
                    RosDomEmptyCard(
                        title = "Планировка ещё пустая",
                        body = "Добавьте комнаты на активном этаже и соберите план дома в блочном редакторе.",
                    )
                }
            } else {
                items(state.rooms, key = { it.id }) { room ->
                    RoomSummaryCard(room = room, onClick = onNavigateToRooms)
                }
            }

            item {
                RosDomSectionHeader(title = "Тревоги и события", actionLabel = "Охрана", onAction = onNavigateToSecurity)
            }

            if (state.alerts.isEmpty()) {
                item {
                    RosDomEmptyCard(
                        title = "Дом спокоен",
                        body = "Новых тревог или критичных событий сейчас нет.",
                    )
                }
            } else {
                items(state.alerts, key = { it.id }) { alert ->
                    AlertPreviewCard(alert = alert)
                }
            }
        }
    }
}

@Composable
private fun HeaderIconButton(
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    contentDescription: String,
    onClick: () -> Unit,
) {
    Surface(
        shape = MaterialTheme.shapes.medium,
        color = MaterialTheme.colorScheme.surface,
    ) {
        IconButton(onClick = onClick) {
            Icon(
                imageVector = icon,
                contentDescription = contentDescription,
                tint = MaterialTheme.colorScheme.onSurface,
            )
        }
    }
}

private data class ModeAction(
    val title: String,
    val subtitle: String,
    val serverValue: String,
    val icon: androidx.compose.ui.graphics.vector.ImageVector,
    val accent: Color,
)

private val homeModes = listOf(
    ModeAction("Я дома", "Комфортный режим для семьи", "home", Icons.Filled.Home, RosDomMint),
    ModeAction("Ночь", "Свет и охрана для ночного сценария", "night", Icons.Filled.Shield, RosDomPurple),
    ModeAction("Вне дома", "Экономия и удалённый контроль", "away", Icons.Filled.Lock, RosDomAmber),
    ModeAction("Охрана", "Контур безопасности и тревоги", "armed", Icons.Filled.Shield, RosDomCritical),
)

private data class ScreenAction(
    val title: String,
    val subtitle: String,
    val icon: androidx.compose.ui.graphics.vector.ImageVector,
    val accent: Color,
    val onClick: (
        devices: () -> Unit,
        rooms: () -> Unit,
        security: () -> Unit,
        tasks: () -> Unit,
        rewards: () -> Unit,
        profile: () -> Unit,
    ) -> () -> Unit,
)

private fun homeActionsForMode(mode: UserMode): List<ScreenAction> = when (mode) {
    UserMode.KIDS -> listOf(
        ScreenAction("Мои задания", "Что нужно сделать сегодня", Icons.Filled.TaskAlt, RosDomPurple) { _, _, _, tasks, _, _ -> tasks },
        ScreenAction("Награды", "Баланс и история достижений", Icons.Filled.Wallet, RosDomAmber) { _, _, _, _, rewards, _ -> rewards },
        ScreenAction("Комнаты", "Где расположены вещи дома", Icons.Filled.GridView, RosDomCyan) { _, rooms, _, _, _, _ -> rooms },
    )

    UserMode.ELDERLY -> listOf(
        ScreenAction("Свет и устройства", "Крупные элементы управления домом", Icons.Filled.Lightbulb, RosDomAmber) { devices, _, _, _, _, _ -> devices },
        ScreenAction("Комнаты", "Этажи и расположение зон", Icons.Filled.GridView, RosDomCyan) { _, rooms, _, _, _, _ -> rooms },
        ScreenAction("Охрана", "Замки, камеры и тревоги", Icons.Filled.Lock, RosDomCritical) { _, _, security, _, _, _ -> security },
        ScreenAction("Семья", "Профиль и домашние роли", Icons.Filled.Person, RosDomMint) { _, _, _, _, _, profile -> profile },
    )

    UserMode.ADULT -> listOf(
        ScreenAction("Устройства", "Избранное, климат и безопасность", Icons.Filled.Lightbulb, RosDomAmber) { devices, _, _, _, _, _ -> devices },
        ScreenAction("Комнаты", "Этажи, редактор и маркеры", Icons.Filled.GridView, RosDomCyan) { _, rooms, _, _, _, _ -> rooms },
        ScreenAction("Охрана", "Контуры, тревоги и входы", Icons.Filled.Lock, RosDomCritical) { _, _, security, _, _, _ -> security },
        ScreenAction("Семейные задачи", "Задачи детям и подтверждения", Icons.Filled.TaskAlt, RosDomMint) { _, _, _, tasks, _, _ -> tasks },
    )
}

@Composable
private fun HomeDeviceCard(
    device: Device,
    onClick: () -> Unit,
) {
    Surface(
        modifier = Modifier.width(228.dp),
        shape = MaterialTheme.shapes.large,
        color = MaterialTheme.colorScheme.surface,
        onClick = onClick,
    ) {
        Column(
            modifier = Modifier.fillMaxWidth(),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Column(
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp),
            ) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    RosDomStatChip(
                        icon = Icons.Filled.Lightbulb,
                        label = statusLabel(device.status),
                        accent = statusAccent(device.status),
                    )
                    Text(
                        text = "${device.capabilities.size} функций",
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
                Text(
                    text = device.name,
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.onSurface,
                    fontWeight = FontWeight.SemiBold,
                )
                Text(
                    text = if (device.capabilities.isEmpty()) {
                        "Устройство подключено, но ещё не синхронизировало доступные возможности."
                    } else {
                        "Управление и статусы обновляются в реальном времени."
                    },
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
    }
}

@Composable
private fun FamilyCard(member: FamilyMemberPreview) {
    Surface(
        modifier = Modifier.width(168.dp),
        shape = MaterialTheme.shapes.large,
        color = MaterialTheme.colorScheme.surface,
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Text(
                text = member.title,
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.onSurface,
                fontWeight = FontWeight.SemiBold,
            )
            Text(
                text = member.subtitle,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}

@Composable
private fun RoomSummaryCard(
    room: HomeRoomSummary,
    onClick: () -> Unit,
) {
    Surface(
        shape = MaterialTheme.shapes.large,
        color = MaterialTheme.colorScheme.surface,
        onClick = onClick,
        modifier = Modifier.fillMaxWidth(),
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(18.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(6.dp),
            ) {
                Text(
                    text = room.title,
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.onSurface,
                    fontWeight = FontWeight.SemiBold,
                )
                Text(
                    text = "${room.deviceCount} устройств • ${room.taskCount} задач",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            Icon(
                imageVector = Icons.Filled.GridView,
                contentDescription = null,
                tint = RosDomCyan,
            )
        }
    }
}

@Composable
private fun AlertPreviewCard(alert: HomeAlertPreview) {
    val accent = when (alert.severity) {
        "critical" -> RosDomCritical
        "warning" -> RosDomAmber
        else -> RosDomMint
    }
    Surface(
        shape = MaterialTheme.shapes.large,
        color = MaterialTheme.colorScheme.surface,
        modifier = Modifier.fillMaxWidth(),
    ) {
        Column(
            modifier = Modifier.padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp),
        ) {
            Text(
                text = alert.title,
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.onSurface,
                fontWeight = FontWeight.SemiBold,
            )
            Text(
                text = alert.subtitle,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Text(
                text = severityLabel(alert.severity),
                style = MaterialTheme.typography.labelMedium,
                color = accent,
            )
        }
    }
}

private fun statusLabel(status: DeviceStatus): String = when (status) {
    DeviceStatus.ONLINE -> "Онлайн"
    DeviceStatus.PENDING -> "Обновляется"
    DeviceStatus.OFFLINE -> "Офлайн"
    DeviceStatus.ERROR -> "Ошибка"
}

private fun statusAccent(status: DeviceStatus): Color = when (status) {
    DeviceStatus.ONLINE -> RosDomMint
    DeviceStatus.PENDING -> RosDomAmber
    DeviceStatus.OFFLINE -> RosDomPurple
    DeviceStatus.ERROR -> RosDomCritical
}

private fun severityLabel(value: String): String = when (value) {
    "critical" -> "Критично"
    "warning" -> "Внимание"
    else -> "Норма"
}

package ru.rosdom.ui.screens.security

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CameraAlt
import androidx.compose.material.icons.filled.DoorFront
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.MotionPhotosOn
import androidx.compose.material.icons.filled.Shield
import androidx.compose.material.icons.filled.Warning
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import ru.rosdom.ui.components.RosDomEmptyCard
import ru.rosdom.ui.components.RosDomHeroCard
import ru.rosdom.ui.components.RosDomInfoBanner
import ru.rosdom.ui.components.RosDomMetricTile
import ru.rosdom.ui.components.RosDomPageBackground
import ru.rosdom.ui.components.RosDomScreenHeader
import ru.rosdom.ui.components.RosDomSectionHeader
import ru.rosdom.ui.state.SecurityAlertItem
import ru.rosdom.ui.state.SecurityEventItem
import ru.rosdom.ui.theme.RosDomAmber
import ru.rosdom.ui.theme.RosDomCritical
import ru.rosdom.ui.theme.RosDomCyan
import ru.rosdom.ui.theme.RosDomMint
import ru.rosdom.ui.theme.RosDomPurple

@Composable
fun SecurityScreen(
    viewModel: SecurityViewModel = androidx.lifecycle.viewmodel.compose.viewModel(factory = SecurityViewModel.Factory),
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
                    title = "Охрана и входы",
                    subtitle = "Замки, камеры, тревоги и журнал событий семьи в одном защищённом контуре.",
                )
            }

            item {
                RosDomHeroCard(
                    eyebrow = "Контур безопасности",
                    title = when (state.securityMode) {
                        "armed" -> "Дом под охраной"
                        "night" -> "Ночной режим"
                        else -> "Охрана снята"
                    },
                    subtitle = "${state.homeName.ifBlank { "Дом" }} • управляйте замками, камерами и тревогами отсюда",
                    icon = Icons.Filled.Shield,
                    footer = {
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            ModeButton("Снять", enabled = !state.isUpdating) { viewModel.setSecurityMode("disarmed") }
                            ModeButton("Ночь", enabled = !state.isUpdating) { viewModel.setSecurityMode("night") }
                            ModeButton("Охрана", enabled = !state.isUpdating) { viewModel.setSecurityMode("armed") }
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

            item {
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    RosDomMetricTile(
                        title = "Камеры",
                        value = state.camerasOnline.toString(),
                        subtitle = "онлайн",
                        accent = RosDomCyan,
                        icon = Icons.Filled.CameraAlt,
                        modifier = Modifier.weight(1f),
                    )
                    RosDomMetricTile(
                        title = "Замки",
                        value = state.locksOnline.toString(),
                        subtitle = "доступны",
                        accent = RosDomMint,
                        icon = Icons.Filled.Lock,
                        modifier = Modifier.weight(1f),
                    )
                }
            }

            item {
                Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                    RosDomMetricTile(
                        title = "Точки входа",
                        value = state.openEntries.toString(),
                        subtitle = "открыто",
                        accent = RosDomAmber,
                        icon = Icons.Filled.DoorFront,
                        modifier = Modifier.weight(1f),
                    )
                    RosDomMetricTile(
                        title = "Срабатывания",
                        value = state.motionAlerts.toString(),
                        subtitle = "датчики движения",
                        accent = RosDomCritical,
                        icon = Icons.Filled.MotionPhotosOn,
                        modifier = Modifier.weight(1f),
                    )
                }
            }

            item {
                RosDomSectionHeader(title = "Тревоги")
            }

            if (state.alerts.isEmpty()) {
                item {
                    RosDomEmptyCard(
                        title = "Тревог нет",
                        body = "Новые уведомления по охране здесь появятся автоматически.",
                    )
                }
            } else {
                items(state.alerts, key = { it.id }) { alert ->
                    AlertRow(alert = alert, onMarkRead = { viewModel.markAlertRead(alert.id) })
                }
            }

            item {
                RosDomSectionHeader(title = "Журнал событий")
            }

            if (state.events.isEmpty()) {
                item {
                    RosDomEmptyCard(
                        title = "Журнал пока пуст",
                        body = "События охраны начнут появляться после работы замков, камер и датчиков.",
                    )
                }
            } else {
                items(state.events, key = { it.id }) { event ->
                    EventRow(event = event)
                }
            }
        }
    }
}

@Composable
private fun ModeButton(
    label: String,
    enabled: Boolean,
    onClick: () -> Unit,
) {
    Button(onClick = onClick, enabled = enabled) {
        Text(label)
    }
}

@Composable
private fun AlertRow(
    alert: SecurityAlertItem,
    onMarkRead: () -> Unit,
) {
    Surface(
        color = MaterialTheme.colorScheme.surface,
        shape = MaterialTheme.shapes.large,
        modifier = Modifier.fillMaxWidth(),
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    imageVector = when (alert.type) {
                        "security" -> Icons.Filled.Warning
                        "device" -> Icons.Filled.CameraAlt
                        else -> Icons.Filled.Lock
                    },
                    contentDescription = null,
                    tint = if (alert.read) MaterialTheme.colorScheme.onSurfaceVariant else RosDomAmber,
                )
                Text(
                    text = alert.title,
                    color = MaterialTheme.colorScheme.onSurface,
                    style = MaterialTheme.typography.titleMedium,
                    modifier = Modifier.padding(start = 12.dp),
                )
            }
            Text(
                text = alert.body,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                style = MaterialTheme.typography.bodyMedium,
                modifier = Modifier.padding(top = 8.dp),
            )
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 10.dp),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Text(
                    text = alert.createdAt,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    style = MaterialTheme.typography.bodySmall,
                )
                if (!alert.read) {
                    Button(onClick = onMarkRead) {
                        Text("Прочитано")
                    }
                }
            }
        }
    }
}

@Composable
private fun EventRow(event: SecurityEventItem) {
    Surface(
        color = MaterialTheme.colorScheme.surface,
        shape = MaterialTheme.shapes.large,
        modifier = Modifier.fillMaxWidth(),
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(
                text = event.title,
                color = MaterialTheme.colorScheme.onSurface,
                style = MaterialTheme.typography.titleMedium,
            )
            Text(
                text = event.subtitle,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                style = MaterialTheme.typography.bodyMedium,
                modifier = Modifier.padding(top = 6.dp),
            )
            Text(
                text = "${severityLabel(event.severity)} • ${event.createdAt}",
                color = when (event.severity) {
                    "critical" -> RosDomCritical
                    "warning" -> RosDomAmber
                    else -> RosDomMint
                },
                style = MaterialTheme.typography.bodySmall,
                modifier = Modifier.padding(top = 8.dp),
            )
        }
    }
}

private fun severityLabel(value: String): String = when (value) {
    "critical" -> "Критично"
    "warning" -> "Внимание"
    else -> "Норма"
}

package ru.rosdom.ui.screens.device

import androidx.compose.animation.animateContentSize
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.Bolt
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Memory
import androidx.compose.material.icons.filled.PowerSettingsNew
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import ru.rosdom.domain.model.Capability
import ru.rosdom.domain.model.DeviceStatus
import ru.rosdom.ui.components.RosDomEmptyCard
import ru.rosdom.ui.components.RosDomHeroCard
import ru.rosdom.ui.components.RosDomInfoBanner
import ru.rosdom.ui.components.RosDomMetricTile
import ru.rosdom.ui.components.RosDomPageBackground
import ru.rosdom.ui.components.RosDomScreenHeader
import ru.rosdom.ui.components.RosDomSectionHeader
import ru.rosdom.ui.components.RosDomStatChip
import ru.rosdom.ui.core.DeviceCapabilityRenderer
import ru.rosdom.ui.theme.RosDomAmber
import ru.rosdom.ui.theme.RosDomCritical
import ru.rosdom.ui.theme.RosDomMint
import ru.rosdom.ui.theme.RosDomPurple

@Composable
fun DeviceDetailScreen(
    deviceId: String,
    viewModel: DeviceViewModel = androidx.lifecycle.viewmodel.compose.viewModel(factory = DeviceViewModel.Factory),
    onBack: () -> Unit,
) {
    val state = viewModel.uiState.collectAsStateWithLifecycle().value
    val device = state.device

    LaunchedEffect(deviceId) {
        viewModel.loadDevice(deviceId)
    }

    RosDomPageBackground {
        when {
            state.isLoading -> {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = RosDomPurple)
                }
            }

            device == null -> {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    RosDomEmptyCard(
                        title = "Устройство не найдено",
                        body = state.currentError ?: "Не удалось загрузить выбранное устройство.",
                    )
                }
            }

            else -> {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(horizontal = 20.dp, vertical = 16.dp),
                    verticalArrangement = Arrangement.spacedBy(18.dp),
                ) {
                    item {
                        RosDomScreenHeader(
                            title = "Устройство",
                            subtitle = "Подробный экран управления, статуса и истории команд.",
                            trailing = {
                                IconButton(onClick = onBack) {
                                    Icon(
                                        imageVector = Icons.AutoMirrored.Filled.ArrowBack,
                                        contentDescription = "Назад",
                                        tint = MaterialTheme.colorScheme.onBackground,
                                    )
                                }
                            },
                        )
                    }

                    item {
                        RosDomHeroCard(
                            eyebrow = statusLabel(device.status),
                            title = device.name,
                            subtitle = buildString {
                                append(if (state.roomTitle.isBlank()) "Комната не назначена" else state.roomTitle)
                                if (state.providerLabel.isNotBlank()) {
                                    append(" • ").append(state.providerLabel)
                                }
                            },
                            icon = Icons.Filled.PowerSettingsNew,
                            footer = {
                                Spacer(modifier = Modifier.height(8.dp))
                                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                                    RosDomStatChip(
                                        icon = Icons.Filled.Bolt,
                                        label = statusLabel(device.status),
                                        accent = statusAccent(device.status),
                                    )
                                    RosDomStatChip(
                                        icon = Icons.Filled.Memory,
                                        label = "${device.capabilities.size} возможностей",
                                        accent = RosDomAmber,
                                    )
                                }
                            },
                        )
                    }

                    state.currentError?.let { message ->
                        item {
                            RosDomInfoBanner(
                                message = message,
                                accent = RosDomCritical,
                            )
                        }
                    }

                    item {
                        Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                            RosDomMetricTile(
                                title = "Комната",
                                value = state.roomTitle.ifBlank { "—" },
                                subtitle = "текущее размещение",
                                icon = Icons.Filled.Home,
                                accent = RosDomMint,
                                modifier = Modifier.weight(1f),
                            )
                            RosDomMetricTile(
                                title = "Команды",
                                value = state.commandHistoryCount.toString(),
                                subtitle = "в журнале устройства",
                                icon = Icons.Filled.Memory,
                                accent = RosDomPurple,
                                modifier = Modifier.weight(1f),
                            )
                        }
                    }

                    item {
                        RosDomSectionHeader(title = "Управление")
                    }

                    item {
                        Surface(
                            color = MaterialTheme.colorScheme.surface,
                            shape = MaterialTheme.shapes.extraLarge,
                            modifier = Modifier
                                .fillMaxWidth()
                                .animateContentSize(),
                        ) {
                            DeviceCapabilityRenderer(
                                device = device,
                                isPending = state.isUpdating,
                                onCapabilityChange = viewModel::updateCapability,
                            )
                        }
                    }

                    if (device.capabilities.none { it is Capability.Power }) {
                        item {
                            RosDomEmptyCard(
                                title = "Ограниченный набор возможностей",
                                body = "Это устройство не прислало стандартную power-capability. Управление доступно только через синхронизированные возможности провайдера.",
                            )
                        }
                    }

                    state.mediaSource?.let { mediaSource ->
                        item {
                            Surface(
                                color = MaterialTheme.colorScheme.surface,
                                shape = MaterialTheme.shapes.extraLarge,
                                modifier = Modifier.fillMaxWidth(),
                            ) {
                                Column(
                                    modifier = Modifier.padding(18.dp),
                                    verticalArrangement = Arrangement.spacedBy(8.dp),
                                ) {
                                    Text(
                                        text = "Источник официального изображения",
                                        style = MaterialTheme.typography.titleMedium,
                                        color = MaterialTheme.colorScheme.onSurface,
                                        fontWeight = FontWeight.SemiBold,
                                    )
                                    Text(
                                        text = mediaSource,
                                        style = MaterialTheme.typography.bodySmall,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

private fun statusLabel(status: DeviceStatus): String = when (status) {
    DeviceStatus.ONLINE -> "Онлайн"
    DeviceStatus.PENDING -> "Обновляется"
    DeviceStatus.OFFLINE -> "Офлайн"
    DeviceStatus.ERROR -> "Ошибка"
}

private fun statusAccent(status: DeviceStatus) = when (status) {
    DeviceStatus.ONLINE -> RosDomMint
    DeviceStatus.PENDING -> RosDomAmber
    DeviceStatus.OFFLINE -> RosDomPurple
    DeviceStatus.ERROR -> RosDomCritical
}

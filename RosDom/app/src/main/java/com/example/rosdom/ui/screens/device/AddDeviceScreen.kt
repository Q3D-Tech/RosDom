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
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material.icons.filled.CloudSync
import androidx.compose.material.icons.filled.Room
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import ru.rosdom.ui.components.RosDomEmptyCard
import ru.rosdom.ui.components.RosDomInfoBanner
import ru.rosdom.ui.components.RosDomPageBackground
import ru.rosdom.ui.components.RosDomScreenHeader
import ru.rosdom.ui.components.RosDomSectionHeader
import ru.rosdom.ui.state.AddDeviceUiState
import ru.rosdom.ui.state.IntegrationCardState
import ru.rosdom.ui.state.PlacementDeviceCardState
import ru.rosdom.ui.state.PlacementRoomOption
import ru.rosdom.ui.theme.RosDomAmber
import ru.rosdom.ui.theme.RosDomMint
import ru.rosdom.ui.theme.RosDomPurple

@Composable
fun AddDeviceScreen(
    viewModel: AddDeviceViewModel = androidx.lifecycle.viewmodel.compose.viewModel(factory = AddDeviceViewModel.Factory),
    onBack: () -> Unit,
) {
    val state = viewModel.uiState.collectAsStateWithLifecycle().value
    val hasTuyaIntegration = remember(state.integrations) {
        state.integrations.any { it.provider == "tuya" && it.status == "connected" }
    }
    val floorTitles = remember(state.floors) {
        state.floors.associate { it.id to it.title }
    }
    val roomLabels = remember(state.rooms, floorTitles) {
        state.rooms.associate { room ->
            room.id to buildRoomLabel(room, floorTitles)
        }
    }

    RosDomPageBackground {
        if (state.isLoading) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center,
            ) {
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
                    title = "Подключить устройства",
                    subtitle = "Войдите в Smart Life, синхронизируйте каталог и назначьте лампы или розетки этажам и комнатам.",
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

            state.error?.let { message ->
                item {
                    RosDomInfoBanner(
                        message = message,
                        accent = MaterialTheme.colorScheme.error,
                    )
                }
            }

            state.syncMessage?.let { message ->
                item {
                    RosDomInfoBanner(
                        message = message,
                        accent = RosDomMint,
                    )
                }
            }

            item {
                RosDomSectionHeader(title = "1. Вход в Smart Life")
            }

            item {
                SmartLifeAccountCard(
                    state = state,
                    onAccountLabelChange = viewModel::updateAccountLabel,
                    onRegionChange = viewModel::updateRegion,
                    onLoginIdentifierChange = viewModel::updateLoginIdentifier,
                    onPasswordChange = viewModel::updatePassword,
                    onCountryCodeChange = viewModel::updateCountryCode,
                    onAppSchemaChange = viewModel::updateAppSchema,
                    onConnect = viewModel::connectSmartLife,
                )
            }

            item {
                RosDomSectionHeader(title = "2. Синхронизация каталога")
            }

            item {
                SyncDevicesCard(
                    canSync = hasTuyaIntegration,
                    isSyncing = state.isSyncing,
                    onSync = viewModel::syncTuya,
                )
            }

            item {
                RosDomSectionHeader(title = "3. Размещение по комнатам")
            }

            if (state.devices.isEmpty()) {
                item {
                    RosDomEmptyCard(
                        title = "Каталог пока пуст",
                        body = "Если после входа устройства не появились, привяжите свой Smart Life app-account к cloud project в Tuya Console через Devices -> Link Tuya App Account и повторите синхронизацию.",
                    )
                }
            } else {
                items(state.devices, key = { it.id }) { device ->
                    DevicePlacementCard(
                        device = device,
                        roomLabels = roomLabels,
                        availableRooms = state.rooms,
                        onRoomSelected = { roomId ->
                            viewModel.updateRoomSelection(device.id, roomId)
                        },
                        onMarkerXChange = { viewModel.updateMarkerX(device.id, it) },
                        onMarkerYChange = { viewModel.updateMarkerY(device.id, it) },
                        onSave = { viewModel.savePlacement(device.id) },
                    )
                }
            }

            if (state.integrations.isNotEmpty()) {
                item {
                    RosDomSectionHeader(title = "Активные интеграции")
                }
                items(state.integrations, key = { it.id }) { integration ->
                    IntegrationCard(integration = integration)
                }
            }
        }
    }
}

@Composable
private fun SmartLifeAccountCard(
    state: AddDeviceUiState,
    onAccountLabelChange: (String) -> Unit,
    onRegionChange: (String) -> Unit,
    onLoginIdentifierChange: (String) -> Unit,
    onPasswordChange: (String) -> Unit,
    onCountryCodeChange: (String) -> Unit,
    onAppSchemaChange: (String) -> Unit,
    onConnect: () -> Unit,
) {
    Surface(
        color = MaterialTheme.colorScheme.surface,
        shape = MaterialTheme.shapes.extraLarge,
        modifier = Modifier
            .fillMaxWidth()
            .animateContentSize(),
    ) {
        Column(
            modifier = Modifier.padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
        ) {
            RosDomInfoBanner(
                message = "РосДом не хранит пароль в открытом виде. Backend получает provider token и использует его для синхронизации и управления устройствами.",
                accent = RosDomMint,
            )
            RosDomInfoBanner(
                message = "Для существующего Smart Life аккаунта один раз привяжите app-account к cloud project в Tuya Console: Devices -> Link Tuya App Account.",
                accent = RosDomAmber,
            )

            OutlinedTextField(
                value = state.accountLabel,
                onValueChange = onAccountLabelChange,
                label = { Text("Название подключения") },
                supportingText = { Text("Можно оставить Smart Life.") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
            )
            OutlinedTextField(
                value = state.loginIdentifier,
                onValueChange = onLoginIdentifierChange,
                label = { Text("E-mail или телефон Smart Life") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
            )
            OutlinedTextField(
                value = state.password,
                onValueChange = onPasswordChange,
                label = { Text("Пароль Smart Life") },
                singleLine = true,
                visualTransformation = PasswordVisualTransformation(),
                modifier = Modifier.fillMaxWidth(),
            )

            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                OutlinedTextField(
                    value = state.countryCode,
                    onValueChange = onCountryCodeChange,
                    label = { Text("Код страны") },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Phone),
                    modifier = Modifier.weight(1f),
                )
                OutlinedTextField(
                    value = state.region,
                    onValueChange = onRegionChange,
                    label = { Text("Регион Tuya") },
                    singleLine = true,
                    modifier = Modifier.weight(1f),
                )
            }

            OutlinedTextField(
                value = state.appSchema,
                onValueChange = onAppSchemaChange,
                label = { Text("App schema") },
                supportingText = { Text("Для Smart Life обычно tuyaSmart.") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth(),
            )

            Button(
                onClick = onConnect,
                modifier = Modifier.fillMaxWidth(),
                enabled = !state.isSubmitting && !state.isSyncing,
            ) {
                Text(if (state.isSubmitting) "Подключаем…" else "Войти и подключить Smart Life")
            }
        }
    }
}

@Composable
private fun SyncDevicesCard(
    canSync: Boolean,
    isSyncing: Boolean,
    onSync: () -> Unit,
) {
    Surface(
        color = MaterialTheme.colorScheme.surface,
        shape = MaterialTheme.shapes.extraLarge,
        modifier = Modifier.fillMaxWidth(),
    ) {
        Column(
            modifier = Modifier.padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Text(
                text = if (canSync) {
                    "После успешного входа обновите каталог устройств Smart Life. Сюда загрузятся лампы, розетки и другие совместимые устройства."
                } else {
                    "Сначала войдите в Smart Life аккаунт. После появления активной интеграции синхронизация станет доступной."
                },
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Button(
                onClick = onSync,
                modifier = Modifier.fillMaxWidth(),
                enabled = canSync && !isSyncing,
            ) {
                Icon(Icons.Filled.CloudSync, contentDescription = null)
                Spacer(modifier = Modifier.width(8.dp))
                Text(if (isSyncing) "Синхронизация…" else "Синхронизировать устройства")
            }
        }
    }
}

@Composable
private fun DevicePlacementCard(
    device: PlacementDeviceCardState,
    roomLabels: Map<String, String>,
    availableRooms: List<PlacementRoomOption>,
    onRoomSelected: (String) -> Unit,
    onMarkerXChange: (String) -> Unit,
    onMarkerYChange: (String) -> Unit,
    onSave: () -> Unit,
) {
    Surface(
        color = MaterialTheme.colorScheme.surface,
        shape = MaterialTheme.shapes.extraLarge,
        modifier = Modifier.fillMaxWidth(),
    ) {
        Column(
            modifier = Modifier.padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Text(
                text = device.name,
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.onSurface,
                fontWeight = FontWeight.SemiBold,
            )
            Text(
                text = "${device.vendor} • ${device.model} • ${device.category}",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Text(
                text = "Текущая комната: ${roomLabels[device.roomId] ?: "не назначена"}",
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )

            LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                items(availableRooms, key = { it.id }) { room ->
                    FilterChip(
                        selected = room.id == device.selectedRoomId,
                        onClick = { onRoomSelected(room.id) },
                        label = {
                            Text(roomLabels[room.id] ?: room.title)
                        },
                        leadingIcon = {
                            Icon(Icons.Filled.Room, contentDescription = null)
                        },
                    )
                }
            }

            Row(horizontalArrangement = Arrangement.spacedBy(10.dp)) {
                OutlinedTextField(
                    value = device.markerX,
                    onValueChange = onMarkerXChange,
                    label = { Text("X") },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    modifier = Modifier.weight(1f),
                )
                OutlinedTextField(
                    value = device.markerY,
                    onValueChange = onMarkerYChange,
                    label = { Text("Y") },
                    singleLine = true,
                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                    modifier = Modifier.weight(1f),
                )
            }

            device.message?.let { message ->
                RosDomInfoBanner(
                    message = message,
                    accent = if (device.isSaving) RosDomAmber else RosDomMint,
                )
            }

            Button(
                onClick = onSave,
                enabled = !device.isSaving && device.selectedRoomId.isNotBlank(),
                modifier = Modifier.fillMaxWidth(),
            ) {
                Text(if (device.isSaving) "Сохраняем…" else "Сохранить размещение")
            }
        }
    }
}

@Composable
private fun IntegrationCard(
    integration: IntegrationCardState,
) {
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
                text = integration.provider.uppercase(),
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.onSurface,
                fontWeight = FontWeight.SemiBold,
            )
            Text(
                text = "${integration.accountLabel.ifBlank { "Без подписи" }} • регион ${integration.region}",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Text(
                text = if (integration.status == "connected") "Подключено" else "Нужно внимание",
                style = MaterialTheme.typography.bodySmall,
                color = if (integration.status == "connected") RosDomMint else RosDomAmber,
            )
        }
    }
}

private fun buildRoomLabel(
    room: PlacementRoomOption,
    floorTitles: Map<String, String>,
): String {
    val floorLabel = room.floorId?.let(floorTitles::get)
    return if (floorLabel.isNullOrBlank()) {
        room.title
    } else {
        "$floorLabel • ${room.title}"
    }
}

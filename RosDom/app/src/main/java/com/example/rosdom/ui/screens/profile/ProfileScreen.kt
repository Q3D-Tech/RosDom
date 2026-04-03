package ru.rosdom.ui.screens.profile

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
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
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ExitToApp
import androidx.compose.material.icons.filled.Group
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Key
import androidx.compose.material.icons.filled.MotionPhotosOn
import androidx.compose.material.icons.filled.Palette
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material.icons.filled.SettingsSuggest
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import ru.rosdom.data.network.ApiFamilyMember
import ru.rosdom.data.network.ApiHome
import ru.rosdom.domain.model.UserMode
import ru.rosdom.domain.session.SessionManager
import ru.rosdom.ui.components.RosDomEmptyCard
import ru.rosdom.ui.components.RosDomHeroCard
import ru.rosdom.ui.components.RosDomInfoBanner
import ru.rosdom.ui.components.RosDomMetricTile
import ru.rosdom.ui.components.RosDomPageBackground
import ru.rosdom.ui.components.RosDomScreenHeader
import ru.rosdom.ui.components.RosDomSectionHeader
import ru.rosdom.ui.components.RosDomStatChip
import ru.rosdom.ui.theme.MotionModePreference
import ru.rosdom.ui.theme.RosDomAmber
import ru.rosdom.ui.theme.RosDomCyan
import ru.rosdom.ui.theme.RosDomMint
import ru.rosdom.ui.theme.RosDomPurple
import ru.rosdom.ui.theme.ThemeModePreference

@Composable
fun ProfileScreen(
    onLogout: () -> Unit = {},
    viewModel: ProfileViewModel = androidx.lifecycle.viewmodel.compose.viewModel(factory = ProfileViewModel.Factory),
) {
    val user by SessionManager.currentUser.collectAsState()
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
                    title = "Профиль и семья",
                    subtitle = "Управляйте аккаунтом, темой, движением интерфейса и семейным контуром из одного центра.",
                    trailing = {
                        IconButton(onClick = viewModel::refresh) {
                            Icon(
                                imageVector = Icons.Filled.Refresh,
                                contentDescription = "Обновить",
                                tint = MaterialTheme.colorScheme.onBackground,
                            )
                        }
                    },
                )
            }

            item {
                RosDomHeroCard(
                    eyebrow = userModeLabel(user?.mode),
                    title = user?.name.orEmpty().ifBlank { "Пользователь РосДом" },
                    subtitle = user?.emailOrPhone.orEmpty().ifBlank {
                        "После подключения дома и семьи здесь появятся контактные данные и основной профиль."
                    },
                    icon = Icons.Filled.Person,
                    footer = {
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                        ) {
                            RosDomStatChip(
                                icon = Icons.Filled.SettingsSuggest,
                                label = "Год рождения: ${user?.birthYear ?: "—"}",
                                accent = RosDomPurple,
                            )
                            RosDomStatChip(
                                icon = Icons.Filled.Home,
                                label = state.homes.firstOrNull()?.title ?: "Дом не выбран",
                                accent = RosDomCyan,
                            )
                        }
                    },
                )
            }

            state.error?.let { message ->
                item {
                    RosDomInfoBanner(
                        message = message,
                        accent = RosDomAmber,
                    )
                }
            }

            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    RosDomMetricTile(
                        title = "Избранное",
                        value = state.favoriteCount.toString(),
                        subtitle = "устройств закреплено",
                        icon = Icons.Filled.Home,
                        accent = RosDomCyan,
                        modifier = Modifier.weight(1f),
                    )
                    RosDomMetricTile(
                        title = "Активный этаж",
                        value = state.activeFloorTitle,
                        subtitle = "в текущем интерфейсе",
                        icon = Icons.Filled.SettingsSuggest,
                        accent = RosDomMint,
                        modifier = Modifier.weight(1f),
                    )
                }
            }

            item {
                RosDomSectionHeader(title = "Оформление")
            }

            item {
                Surface(
                    color = MaterialTheme.colorScheme.surface,
                    shape = MaterialTheme.shapes.extraLarge,
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Column(
                        modifier = Modifier.padding(18.dp),
                        verticalArrangement = Arrangement.spacedBy(16.dp),
                    ) {
                        PreferenceSelector(
                            title = "Тема",
                            icon = Icons.Filled.Palette,
                            description = "Системная, светлая или тёмная оболочка Premium Guardian.",
                            values = ThemeModePreference.entries,
                            selected = state.themeMode,
                            label = {
                                when (it) {
                                    ThemeModePreference.SYSTEM -> "Система"
                                    ThemeModePreference.LIGHT -> "Светлая"
                                    ThemeModePreference.DARK -> "Тёмная"
                                }
                            },
                            onSelect = viewModel::updateThemeMode,
                        )
                        PreferenceSelector(
                            title = "Анимации",
                            icon = Icons.Filled.MotionPhotosOn,
                            description = "Reduced Motion убирает лишние перемещения и оставляет только спокойные переходы состояния.",
                            values = MotionModePreference.entries,
                            selected = state.motionMode,
                            label = {
                                when (it) {
                                    MotionModePreference.STANDARD -> "Стандарт"
                                    MotionModePreference.REDUCED -> "Reduced"
                                }
                            },
                            onSelect = viewModel::updateMotionMode,
                        )
                        Text(
                            text = if (state.isSavingPreferences) {
                                "Настройки интерфейса сохраняются…"
                            } else {
                                "Плотность UI: ${state.uiDensity}. Изменения темы применяются сразу."
                            },
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                }
            }

            item {
                RosDomSectionHeader(title = "Семья")
            }

            if (state.family == null) {
                item {
                    RosDomEmptyCard(
                        title = "Семья ещё не подключена",
                        body = "После создания семьи здесь появятся дети, приглашения и домашние роли.",
                    )
                }
            } else {
                item {
                    Surface(
                        color = MaterialTheme.colorScheme.surface,
                        shape = MaterialTheme.shapes.extraLarge,
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Column(
                            modifier = Modifier.padding(18.dp),
                            verticalArrangement = Arrangement.spacedBy(10.dp),
                        ) {
                            Row(
                                horizontalArrangement = Arrangement.spacedBy(10.dp),
                                verticalAlignment = Alignment.CenterVertically,
                            ) {
                                Icon(
                                    imageVector = Icons.Filled.Group,
                                    contentDescription = null,
                                    tint = RosDomPurple,
                                )
                                Text(
                                    text = state.family?.title.orEmpty(),
                                    style = MaterialTheme.typography.titleMedium,
                                    color = MaterialTheme.colorScheme.onSurface,
                                    fontWeight = FontWeight.SemiBold,
                                )
                            }
                            Text(
                                text = "Участников: ${state.members.size}",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                            Text(
                                text = "Текущая плотность интерфейса: ${state.uiDensity}",
                                style = MaterialTheme.typography.bodySmall,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                        }
                    }
                }
            }

            if (user?.mode == UserMode.ADULT && state.family != null) {
                item {
                    Surface(
                        color = MaterialTheme.colorScheme.surface,
                        shape = MaterialTheme.shapes.extraLarge,
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Column(
                            modifier = Modifier.padding(18.dp),
                            verticalArrangement = Arrangement.spacedBy(12.dp),
                        ) {
                            Row(
                                horizontalArrangement = Arrangement.spacedBy(10.dp),
                                verticalAlignment = Alignment.CenterVertically,
                            ) {
                                Icon(
                                    imageVector = Icons.Filled.Key,
                                    contentDescription = null,
                                    tint = RosDomAmber,
                                )
                                Text(
                                    text = "Приглашение для ребёнка",
                                    style = MaterialTheme.typography.titleMedium,
                                    color = MaterialTheme.colorScheme.onSurface,
                                    fontWeight = FontWeight.SemiBold,
                                )
                            }
                            Text(
                                text = "Создайте код, чтобы привязать детский аккаунт к семье и детскому режиму.",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant,
                            )
                            Button(
                                onClick = viewModel::createChildInvite,
                                modifier = Modifier.fillMaxWidth(),
                            ) {
                                Text("Создать код для ребёнка")
                            }
                            AnimatedVisibility(
                                visible = state.latestInviteCode != null,
                                enter = fadeIn(),
                                exit = fadeOut(),
                            ) {
                                state.latestInviteCode?.let { code ->
                                    RosDomInfoBanner(
                                        message = "Код приглашения: $code",
                                        accent = RosDomMint,
                                    )
                                }
                            }
                        }
                    }
                }
            }

            if (state.members.isNotEmpty()) {
                item {
                    RosDomSectionHeader(title = "Участники семьи")
                }
                items(state.members, key = { it.userId }) { member ->
                    FamilyMemberCard(member = member)
                }
            }

            if (state.homes.isNotEmpty()) {
                item {
                    RosDomSectionHeader(title = "Дома")
                }
                items(state.homes, key = { it.id }) { home ->
                    HomeCard(home = home)
                }
            }

            item {
                Button(
                    onClick = onLogout,
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Icon(
                        imageVector = Icons.AutoMirrored.Filled.ExitToApp,
                        contentDescription = null,
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Выйти из аккаунта")
                }
            }
        }
    }
}

@Composable
private fun <T> PreferenceSelector(
    title: String,
    icon: androidx.compose.ui.graphics.vector.ImageVector,
    description: String,
    values: List<T>,
    selected: T,
    label: (T) -> String,
    onSelect: (T) -> Unit,
) {
    Column(verticalArrangement = Arrangement.spacedBy(10.dp)) {
        Row(
            horizontalArrangement = Arrangement.spacedBy(10.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Icon(
                imageVector = icon,
                contentDescription = null,
                tint = RosDomPurple,
            )
            Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.onSurface,
                    fontWeight = FontWeight.SemiBold,
                )
                Text(
                    text = description,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
            values.forEach { value ->
                FilterChip(
                    selected = value == selected,
                    onClick = { onSelect(value) },
                    label = { Text(label(value)) },
                )
            }
        }
    }
}

@Composable
private fun FamilyMemberCard(member: ApiFamilyMember) {
    Surface(
        color = MaterialTheme.colorScheme.surface,
        shape = MaterialTheme.shapes.large,
        modifier = Modifier.fillMaxWidth(),
    ) {
        Column(
            modifier = Modifier.padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(6.dp),
        ) {
            Text(
                text = "Участник ${member.userId.take(8)}…",
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.onSurface,
                fontWeight = FontWeight.SemiBold,
            )
            Text(
                text = "Статус: ${member.status}",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            member.guardianUserId?.let { guardianId ->
                Text(
                    text = "Привязан ко взрослому ${guardianId.take(8)}…",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
        }
    }
}

@Composable
private fun HomeCard(home: ApiHome) {
    Surface(
        color = MaterialTheme.colorScheme.surface,
        shape = MaterialTheme.shapes.large,
        modifier = Modifier.fillMaxWidth(),
    ) {
        Column(
            modifier = Modifier.padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
        ) {
            Text(
                text = home.title,
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.onSurface,
                fontWeight = FontWeight.SemiBold,
            )
            Text(
                text = home.addressLabel,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                RosDomStatChip(
                    icon = Icons.Filled.Home,
                    label = home.currentMode,
                    accent = RosDomCyan,
                )
                RosDomStatChip(
                    icon = Icons.Filled.SettingsSuggest,
                    label = home.securityMode,
                    accent = RosDomMint,
                )
            }
        }
    }
}

private fun userModeLabel(mode: UserMode?): String = when (mode) {
    UserMode.KIDS -> "Детский режим"
    UserMode.ELDERLY -> "Пожилой режим"
    UserMode.ADULT -> "Взрослый режим"
    null -> "Профиль"
}

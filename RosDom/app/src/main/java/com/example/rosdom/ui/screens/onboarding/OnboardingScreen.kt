package ru.rosdom.ui.screens.onboarding

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.ColumnScope
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Logout
import androidx.compose.material.icons.filled.FamilyRestroom
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Refresh
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedButton
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import ru.rosdom.domain.model.UserMode
import ru.rosdom.ui.components.RosDomHeroCard
import ru.rosdom.ui.components.RosDomInfoBanner
import ru.rosdom.ui.components.RosDomPageBackground
import ru.rosdom.ui.components.RosDomScreenHeader
import ru.rosdom.ui.components.RosDomSectionHeader
import ru.rosdom.ui.theme.RosDomAmber
import ru.rosdom.ui.theme.RosDomMint

@Composable
fun OnboardingScreen(
    userMode: UserMode,
    hasFamily: Boolean,
    isLoading: Boolean,
    error: String?,
    warning: String?,
    onCreateFamily: (String) -> Unit,
    onJoinFamily: (String) -> Unit,
    onCreateHome: (String, String) -> Unit,
    onRetry: () -> Unit,
    onLogout: () -> Unit,
) {
    var familyTitle by rememberSaveable { mutableStateOf("Семья РосДом") }
    var inviteCode by rememberSaveable { mutableStateOf("") }
    var homeTitle by rememberSaveable { mutableStateOf("Мой дом") }
    var homeAddress by rememberSaveable { mutableStateOf("Якутск") }

    RosDomPageBackground {
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(horizontal = 20.dp, vertical = 16.dp),
            verticalArrangement = Arrangement.spacedBy(18.dp),
        ) {
            item {
                RosDomScreenHeader(
                    title = "Первичная настройка",
                    subtitle = "Подготовим РосДом к работе: подключим семью, создадим первый дом и откроем полный интерфейс.",
                )
            }

            item {
                RosDomHeroCard(
                    eyebrow = "Premium Guardian",
                    title = "Подготовим РосДом к работе",
                    subtitle = if (userMode == UserMode.KIDS) {
                        "Для детского режима сначала нужно присоединиться к семье, а затем взрослый создаст первый дом."
                    } else {
                        "Вы можете подключить семью сейчас или сразу создать первый дом и вернуться к семейному контуру позже."
                    },
                    icon = if (userMode == UserMode.KIDS) Icons.Filled.FamilyRestroom else Icons.Filled.Home,
                )
            }

            warning?.let { message ->
                item { RosDomInfoBanner(message = message, accent = RosDomAmber) }
            }

            error?.let { message ->
                item { RosDomInfoBanner(message = message, accent = MaterialTheme.colorScheme.error) }
            }

            item {
                RosDomSectionHeader(title = "Служебные действия")
            }

            item {
                Surface(
                    color = MaterialTheme.colorScheme.surface,
                    shape = MaterialTheme.shapes.extraLarge,
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    Row(
                        modifier = Modifier.padding(18.dp),
                        horizontalArrangement = Arrangement.spacedBy(10.dp),
                    ) {
                        OutlinedButton(
                            onClick = onRetry,
                            modifier = Modifier.weight(1f),
                            enabled = !isLoading,
                        ) {
                            Icon(Icons.Filled.Refresh, contentDescription = null)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Повторить")
                        }
                        OutlinedButton(
                            onClick = onLogout,
                            modifier = Modifier.weight(1f),
                            enabled = !isLoading,
                        ) {
                            Icon(Icons.AutoMirrored.Filled.Logout, contentDescription = null)
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Сменить сервер")
                        }
                    }
                }
            }

            if (userMode == UserMode.KIDS && !hasFamily) {
                item { RosDomSectionHeader(title = "Подключение к семье") }
                item {
                    SetupCard(
                        title = "Присоединиться по коду",
                        subtitle = "Введите приглашение, которое создал взрослый участник семьи.",
                    ) {
                        OutlinedTextField(
                            value = inviteCode,
                            onValueChange = { inviteCode = it },
                            label = { Text("Код семьи") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true,
                        )
                        PrimaryActionButton(
                            label = "Присоединиться к семье",
                            isLoading = isLoading,
                            enabled = inviteCode.isNotBlank() && !isLoading,
                            onClick = { onJoinFamily(inviteCode.trim()) },
                        )
                    }
                }
            } else {
                item { RosDomSectionHeader(title = "Семья") }

                if (!hasFamily) {
                    item {
                        SetupCard(
                            title = "Создать семью",
                            subtitle = "Семья нужна для детских режимов, наград и приглашений. Если backend семьи пока не обновлён, этот шаг можно пропустить.",
                        ) {
                            OutlinedTextField(
                                value = familyTitle,
                                onValueChange = { familyTitle = it },
                                label = { Text("Название семьи") },
                                modifier = Modifier.fillMaxWidth(),
                                singleLine = true,
                            )
                            PrimaryActionButton(
                                label = "Создать семью",
                                isLoading = isLoading,
                                enabled = familyTitle.isNotBlank() && !isLoading,
                                onClick = { onCreateFamily(familyTitle.trim()) },
                            )
                        }
                    }

                    item {
                        SetupCard(
                            title = "Или присоединиться по коду",
                            subtitle = "Используйте код семьи, если она уже создана на другом аккаунте.",
                        ) {
                            OutlinedTextField(
                                value = inviteCode,
                                onValueChange = { inviteCode = it },
                                label = { Text("Код семьи") },
                                modifier = Modifier.fillMaxWidth(),
                                singleLine = true,
                            )
                            PrimaryActionButton(
                                label = "Присоединиться по коду",
                                isLoading = isLoading,
                                enabled = inviteCode.isNotBlank() && !isLoading,
                                onClick = { onJoinFamily(inviteCode.trim()) },
                            )
                        }
                    }
                } else {
                    item {
                        RosDomInfoBanner(
                            message = "Семья уже подключена. Можно переходить к созданию первого дома.",
                            accent = RosDomMint,
                        )
                    }
                }

                item { RosDomSectionHeader(title = "Первый дом") }
                item {
                    SetupCard(
                        title = "Создать дом",
                        subtitle = "Этот шаг доступен и без семьи. РосДом создаст основной этаж и откроет полноценный интерфейс.",
                    ) {
                        OutlinedTextField(
                            value = homeTitle,
                            onValueChange = { homeTitle = it },
                            label = { Text("Название дома") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true,
                        )
                        OutlinedTextField(
                            value = homeAddress,
                            onValueChange = { homeAddress = it },
                            label = { Text("Адрес или подпись") },
                            modifier = Modifier.fillMaxWidth(),
                            singleLine = true,
                            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Text),
                        )
                        PrimaryActionButton(
                            label = "Создать первый дом",
                            isLoading = isLoading,
                            enabled = homeTitle.isNotBlank() && homeAddress.isNotBlank() && !isLoading,
                            onClick = { onCreateHome(homeTitle.trim(), homeAddress.trim()) },
                        )
                    }
                }
            }

            if (userMode == UserMode.KIDS && hasFamily) {
                item {
                    RosDomInfoBanner(
                        message = "Семья уже подключена. Первый дом должен создать взрослый участник, после этого интерфейс откроется автоматически.",
                        accent = RosDomMint,
                    )
                }
            }
        }
    }
}

@Composable
private fun SetupCard(
    title: String,
    subtitle: String,
    content: @Composable ColumnScope.() -> Unit,
) {
    Surface(
        color = MaterialTheme.colorScheme.surface,
        shape = MaterialTheme.shapes.extraLarge,
        modifier = Modifier.fillMaxWidth(),
    ) {
        Column(
            modifier = Modifier.padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(14.dp),
            content = {
                Text(
                    text = title,
                    style = MaterialTheme.typography.titleLarge,
                    color = MaterialTheme.colorScheme.onSurface,
                )
                Text(
                    text = subtitle,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
                content()
            },
        )
    }
}

@Composable
private fun PrimaryActionButton(
    label: String,
    isLoading: Boolean,
    enabled: Boolean,
    onClick: () -> Unit,
) {
    Button(
        onClick = onClick,
        modifier = Modifier
            .fillMaxWidth()
            .height(56.dp),
        enabled = enabled,
    ) {
        if (isLoading) {
            CircularProgressIndicator(
                strokeWidth = 2.dp,
                modifier = Modifier.size(20.dp),
            )
        } else {
            Text(label)
        }
    }
}

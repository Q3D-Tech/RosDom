package ru.rosdom.ui.screens.auth

import androidx.compose.animation.AnimatedContent
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.togetherWith
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.imePadding
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Home
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FilterChip
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableIntStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import kotlinx.coroutines.delay
import ru.rosdom.ui.components.RosDomHeroCard
import ru.rosdom.ui.components.RosDomInfoBanner
import ru.rosdom.ui.components.RosDomPageBackground
import ru.rosdom.ui.components.RosDomScreenHeader

@Composable
fun AuthScreen(
    viewModel: AuthViewModel = androidx.lifecycle.viewmodel.compose.viewModel(factory = AuthViewModel.Factory),
    initialLoginMode: Boolean = true,
    onAuthSuccess: () -> Unit,
    onBack: (() -> Unit)? = null,
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    val scrollState = rememberScrollState()

    LaunchedEffect(initialLoginMode) {
        viewModel.setLoginMode(initialLoginMode)
    }

    RosDomPageBackground {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .verticalScroll(scrollState)
                .imePadding()
                .navigationBarsPadding()
                .padding(horizontal = 20.dp, vertical = 16.dp),
            verticalArrangement = Arrangement.spacedBy(18.dp),
        ) {
            RosDomScreenHeader(
                title = if (state.isLoginMode) "Вход в РосДом" else "Регистрация в РосДом",
                subtitle = if (state.isLoginMode) {
                    "Войдите по email или телефону и продолжайте управлять домом, устройствами и безопасностью."
                } else {
                    "Создайте аккаунт, укажите год рождения и при необходимости код семьи."
                },
            )

            RosDomHeroCard(
                eyebrow = "Premium Guardian",
                title = if (state.isLoginMode) "Мой дом" else "Новый дом",
                subtitle = if (state.isLoginMode) {
                    "Один вход для устройств, планировки, семейных сценариев и охраны."
                } else {
                    "После регистрации приложение автоматически выберет режим: детский, взрослый или пожилой."
                },
                icon = Icons.Filled.Home,
            )

            Surface(
                color = MaterialTheme.colorScheme.surface,
                shape = MaterialTheme.shapes.extraLarge,
                modifier = Modifier.fillMaxWidth(),
            ) {
                Column(
                    modifier = Modifier.padding(18.dp),
                    verticalArrangement = Arrangement.spacedBy(14.dp),
                ) {
                    if (state.isLoading) {
                        LinearProgressIndicator(modifier = Modifier.fillMaxWidth())
                    }

                    Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                        FilterChip(
                            selected = state.isLoginMode,
                            onClick = { viewModel.setLoginMode(true) },
                            label = { Text("Вход") },
                        )
                        FilterChip(
                            selected = !state.isLoginMode,
                            onClick = { viewModel.setLoginMode(false) },
                            label = { Text("Регистрация") },
                        )
                    }

                    OutlinedTextField(
                        value = state.loginIdentifier,
                        onValueChange = viewModel::updateIdentifier,
                        label = { Text("Email или телефон") },
                        modifier = Modifier.fillMaxWidth(),
                        enabled = !state.isLoading,
                        singleLine = true,
                    )

                    AnimatedContent(
                        targetState = state.isLoginMode,
                        label = "auth-mode",
                        transitionSpec = { fadeIn() togetherWith fadeOut() },
                    ) { isLoginMode ->
                        Column(verticalArrangement = Arrangement.spacedBy(12.dp)) {
                            if (!isLoginMode) {
                                OutlinedTextField(
                                    value = state.name,
                                    onValueChange = viewModel::updateName,
                                    label = { Text("Имя") },
                                    modifier = Modifier.fillMaxWidth(),
                                    enabled = !state.isLoading,
                                    singleLine = true,
                                )
                            }

                            OutlinedTextField(
                                value = state.password,
                                onValueChange = viewModel::updatePassword,
                                label = { Text("Пароль") },
                                visualTransformation = PasswordVisualTransformation(),
                                keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Password),
                                modifier = Modifier.fillMaxWidth(),
                                enabled = !state.isLoading,
                                singleLine = true,
                            )

                            if (!isLoginMode) {
                                OutlinedTextField(
                                    value = state.birthYear,
                                    onValueChange = viewModel::updateBirthYear,
                                    label = { Text("Год рождения") },
                                    keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                                    modifier = Modifier.fillMaxWidth(),
                                    enabled = !state.isLoading,
                                    singleLine = true,
                                )
                                OutlinedTextField(
                                    value = state.familyInviteCode,
                                    onValueChange = viewModel::updateFamilyInviteCode,
                                    label = { Text("Код семьи, если есть") },
                                    modifier = Modifier.fillMaxWidth(),
                                    enabled = !state.isLoading,
                                    singleLine = true,
                                )
                            }
                        }
                    }

                    OutlinedTextField(
                        value = state.serverUrl,
                        onValueChange = viewModel::updateServerUrl,
                        label = { Text("Адрес сервера") },
                        supportingText = {
                            Text(
                                if (state.serverUrl.contains("10.0.2.2")) {
                                    "10.0.2.2 работает только в эмуляторе. Для телефона укажите IP или домен Linux-сервера."
                                } else {
                                    "Укажите базовый адрес сервера, например http://192.168.1.50:4000/. Не добавляйте /v1 и /health."
                                },
                            )
                        },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Uri),
                        modifier = Modifier.fillMaxWidth(),
                        enabled = !state.isLoading,
                        singleLine = true,
                    )

                    state.error?.let { message ->
                        RosDomInfoBanner(message = message, accent = MaterialTheme.colorScheme.error)
                    }

                    Button(
                        onClick = { viewModel.submit(onAuthSuccess) },
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(56.dp),
                        enabled = !state.isLoading,
                    ) {
                        if (state.isLoading) {
                            AuthLoadingContent(
                                label = if (state.isLoginMode) "Подключаемся" else "Создаём аккаунт",
                            )
                        } else {
                            Text(if (state.isLoginMode) "Войти" else "Создать аккаунт")
                        }
                    }

                    TextButton(
                        onClick = viewModel::toggleMode,
                        modifier = Modifier.fillMaxWidth(),
                        enabled = !state.isLoading,
                    ) {
                        Text(
                            if (state.isLoginMode) {
                                "Нет аккаунта? Зарегистрируйтесь"
                            } else {
                                "Уже есть аккаунт? Войти"
                            },
                        )
                    }

                    if (onBack != null) {
                        TextButton(
                            onClick = onBack,
                            modifier = Modifier.fillMaxWidth(),
                            enabled = !state.isLoading,
                        ) {
                            Text("Назад")
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(12.dp))
        }
    }
}

@Composable
private fun AuthLoadingContent(label: String) {
    var dots by remember { mutableIntStateOf(0) }

    LaunchedEffect(label) {
        while (true) {
            delay(280)
            dots = (dots + 1) % 4
        }
    }

    Row(
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.Center,
    ) {
        CircularProgressIndicator(
            strokeWidth = 2.dp,
            modifier = Modifier.size(18.dp),
        )
        Spacer(modifier = Modifier.width(12.dp))
        Text("$label${".".repeat(dots)}")
    }
}

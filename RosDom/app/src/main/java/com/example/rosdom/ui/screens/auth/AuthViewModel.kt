package ru.rosdom.ui.screens.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.ViewModelProvider.AndroidViewModelFactory.Companion.APPLICATION_KEY
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.CreationExtras
import java.io.IOException
import java.util.Calendar
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import retrofit2.HttpException
import ru.rosdom.RosDomApplication
import ru.rosdom.data.network.BackendEndpointStore
import ru.rosdom.data.network.LoginRequest
import ru.rosdom.data.network.RegisterRequest
import ru.rosdom.data.repository.AuthRepository
import ru.rosdom.domain.session.SessionManager

data class AuthUiState(
    val loginIdentifier: String = "",
    val name: String = "",
    val password: String = "",
    val birthYear: String = "1990",
    val familyInviteCode: String = "",
    val serverUrl: String = "",
    val isLoginMode: Boolean = true,
    val isLoading: Boolean = false,
    val error: String? = null,
)

class AuthViewModel(
    private val authRepository: AuthRepository,
    private val backendEndpointStore: BackendEndpointStore,
) : ViewModel() {
    private val _uiState = MutableStateFlow(
        AuthUiState(serverUrl = backendEndpointStore.currentBaseUrl),
    )
    val uiState: StateFlow<AuthUiState> = _uiState.asStateFlow()

    init {
        val defaultServerUrl = BackendEndpointStore.normalizeBaseUrl("").orEmpty()
        viewModelScope.launch {
            backendEndpointStore.baseUrlFlow.collectLatest { storedUrl ->
                _uiState.update { current ->
                    when {
                        current.isLoading -> current
                        current.serverUrl.isBlank() -> current.copy(serverUrl = storedUrl)
                        current.serverUrl == defaultServerUrl -> current.copy(serverUrl = storedUrl)
                        else -> current
                    }
                }
            }
        }
    }

    fun updateIdentifier(value: String) {
        _uiState.update { it.copy(loginIdentifier = value, error = null) }
    }

    fun updateName(value: String) {
        _uiState.update { it.copy(name = value, error = null) }
    }

    fun updatePassword(value: String) {
        _uiState.update { it.copy(password = value, error = null) }
    }

    fun updateBirthYear(value: String) {
        _uiState.update { it.copy(birthYear = value, error = null) }
    }

    fun updateFamilyInviteCode(value: String) {
        _uiState.update { it.copy(familyInviteCode = value, error = null) }
    }

    fun updateServerUrl(value: String) {
        _uiState.update { it.copy(serverUrl = value, error = null) }
    }

    fun setLoginMode(isLoginMode: Boolean) {
        _uiState.update { it.copy(isLoginMode = isLoginMode, error = null) }
    }

    fun toggleMode() = setLoginMode(!_uiState.value.isLoginMode)

    fun submit(onAuthSuccess: () -> Unit) {
        viewModelScope.launch {
            val state = _uiState.value
            if (state.loginIdentifier.isBlank() || state.password.isBlank()) {
                _uiState.update { it.copy(error = "Заполните логин и пароль.") }
                return@launch
            }

            val isEmail = state.loginIdentifier.contains("@")
            val birthYear = state.birthYear.toIntOrNull()
            if (!state.isLoginMode) {
                val currentYear = Calendar.getInstance().get(Calendar.YEAR)
                if (state.name.isBlank()) {
                    _uiState.update { it.copy(error = "Укажите имя.") }
                    return@launch
                }
                if (birthYear == null || birthYear !in 1916..currentYear) {
                    _uiState.update { it.copy(error = "Проверьте год рождения.") }
                    return@launch
                }
            }

            val normalizedServerUrl = BackendEndpointStore.normalizeBaseUrl(state.serverUrl)
            if (normalizedServerUrl == null) {
                _uiState.update {
                    it.copy(error = "Проверьте адрес сервера РосДом. Укажите базовый адрес без /v1 и без /health.")
                }
                return@launch
            }

            _uiState.update { it.copy(isLoading = true, error = null) }

            try {
                backendEndpointStore.updateBaseUrl(normalizedServerUrl)

                val session = if (state.isLoginMode) {
                    authRepository.login(
                        LoginRequest(
                            loginIdentifier = state.loginIdentifier.trim(),
                            password = state.password,
                            deviceName = "Android client",
                        ),
                    )
                } else {
                    authRepository.register(
                        RegisterRequest(
                            loginIdentifier = state.loginIdentifier.trim(),
                            identifierType = if (isEmail) "email" else "phone",
                            password = state.password,
                            name = state.name.trim(),
                            birthYear = birthYear ?: 1990,
                            familyInviteCode = state.familyInviteCode.ifBlank { null },
                            deviceName = "Android client",
                        ),
                    )
                }

                SessionManager.establishSession(session)
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        error = null,
                        serverUrl = normalizedServerUrl,
                    )
                }
                onAuthSuccess()
            } catch (error: Exception) {
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        error = error.toUserFacingMessage(normalizedServerUrl),
                    )
                }
            }
        }
    }

    companion object {
        val Factory: ViewModelProvider.Factory = object : ViewModelProvider.Factory {
            @Suppress("UNCHECKED_CAST")
            override fun <T : ViewModel> create(modelClass: Class<T>, extras: CreationExtras): T {
                val application = checkNotNull(extras[APPLICATION_KEY]) as RosDomApplication
                return AuthViewModel(
                    authRepository = application.authRepository,
                    backendEndpointStore = application.backendEndpointStore,
                ) as T
            }
        }
    }
}

private fun Throwable.toUserFacingMessage(serverUrl: String): String {
    return when (this) {
        is HttpException -> {
            when (code()) {
                400 -> "Проверьте введённые данные и повторите попытку."
                401 -> "Неверный логин или пароль."
                403 -> "Доступ к серверу запрещён."
                404 -> "Сервер доступен, но маршрут авторизации не найден. Укажите базовый адрес без /v1 и без /health, например http://192.168.1.50:4000/."
                409 -> "Аккаунт с таким логином уже существует."
                500, 502, 503 -> "Сервер РосДом временно недоступен. Попробуйте позже."
                else -> "Ошибка сервера РосДом: HTTP ${code()}."
            }
        }

        is IOException -> {
            val rawMessage = message.orEmpty()
            when {
                rawMessage.contains("10.0.2.2") -> {
                    "Не удалось подключиться к $serverUrl. Адрес 10.0.2.2 работает только в эмуляторе. На телефоне укажите IP или домен вашего Linux-сервера."
                }

                rawMessage.contains("Unable to resolve host", ignoreCase = true) -> {
                    "Не удалось найти сервер $serverUrl. Проверьте домен или IP-адрес."
                }

                rawMessage.contains("timeout", ignoreCase = true) ||
                    rawMessage.contains("timed out", ignoreCase = true) -> {
                    "Сервер $serverUrl не ответил вовремя. Проверьте адрес, порт и доступность backend."
                }

                else -> {
                    "Не удалось подключиться к серверу $serverUrl. Проверьте IP/домен Linux-сервера и открытый порт backend."
                }
            }
        }

        else -> message ?: "Не удалось выполнить авторизацию."
    }
}

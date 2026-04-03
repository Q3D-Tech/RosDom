package ru.rosdom.ui.navigation

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.ViewModelProvider.AndroidViewModelFactory.Companion.APPLICATION_KEY
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.CreationExtras
import java.io.IOException
import java.util.TimeZone
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import retrofit2.HttpException
import ru.rosdom.RosDomApplication
import ru.rosdom.data.network.ApiFamily
import ru.rosdom.data.network.ApiHome
import ru.rosdom.data.network.ApiUserPreferences
import ru.rosdom.data.repository.PlatformRepository
import ru.rosdom.domain.model.User
import ru.rosdom.domain.session.SessionManager
import ru.rosdom.ui.theme.AppearanceManager

data class AppRootUiState(
    val isLoading: Boolean = true,
    val currentUser: User? = null,
    val family: ApiFamily? = null,
    val homes: List<ApiHome> = emptyList(),
    val currentHomeId: String? = null,
    val error: String? = null,
    val warning: String? = null,
) {
    val needsOnboarding: Boolean
        get() = currentUser != null && homes.isEmpty()
}

class AppRootViewModel(
    private val platformRepository: PlatformRepository,
) : ViewModel() {
    private val _uiState = MutableStateFlow(AppRootUiState())
    val uiState: StateFlow<AppRootUiState> = _uiState.asStateFlow()

    init {
        refreshSessionAndBootstrap()
    }

    fun refreshSessionAndBootstrap() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            SessionManager.restoreSession()
            val user = SessionManager.currentUser.value
            if (user == null) {
                _uiState.value = AppRootUiState(isLoading = false)
                return@launch
            }

            try {
                val homes = platformRepository.getHomes()
                var warning: String? = null

                val family = try {
                    platformRepository.getCurrentFamily()
                } catch (error: Exception) {
                    if (error.isMissingFamilyApi()) {
                        warning =
                            "Сервер отвечает, но семейный API не найден. Скорее всего, на Linux-сервере развёрнута старая версия backend. Можно создать дом без семьи или обновить backend."
                        null
                    } else {
                        throw error
                    }
                }

                val preferences: ApiUserPreferences? = try {
                    platformRepository.getUserPreferences()
                } catch (error: Exception) {
                    if (error.isMissingPreferencesApi()) {
                        warning = warning
                            ?: "Сервер отвечает, но API пользовательских настроек ещё не поддерживается. Приложение продолжит работу с настройками по умолчанию."
                        null
                    } else {
                        throw error
                    }
                }

                if (preferences != null) {
                    AppearanceManager.applyFromPreferences(
                        themeMode = preferences.themeMode,
                        motionMode = preferences.motionMode,
                    )
                }

                val selectedHomeId = SessionManager.currentHomeId.value ?: homes.firstOrNull()?.id
                if (selectedHomeId != null && selectedHomeId != SessionManager.currentHomeId.value) {
                    SessionManager.setCurrentHome(selectedHomeId)
                }

                _uiState.value = AppRootUiState(
                    isLoading = false,
                    currentUser = SessionManager.currentUser.value,
                    family = family,
                    homes = homes,
                    currentHomeId = selectedHomeId,
                    warning = warning,
                )
            } catch (error: Exception) {
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        currentUser = user,
                        error = error.toRootMessage(
                            action = RootAction.Bootstrap,
                            fallback = "Не удалось загрузить состояние приложения.",
                        ),
                    )
                }
            }
        }
    }

    fun selectHome(homeId: String) {
        viewModelScope.launch {
            SessionManager.setCurrentHome(homeId)
            _uiState.update { it.copy(currentHomeId = homeId) }
        }
    }

    fun createFamily(title: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            try {
                val family = platformRepository.createFamily(title)
                _uiState.update { it.copy(isLoading = false, family = family) }
            } catch (error: Exception) {
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        error = error.toRootMessage(
                            action = RootAction.CreateFamily,
                            fallback = "Не удалось создать семью.",
                        ),
                    )
                }
            }
        }
    }

    fun joinFamily(code: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            try {
                val family = platformRepository.joinFamily(code)
                _uiState.update { it.copy(isLoading = false, family = family) }
                refreshSessionAndBootstrap()
            } catch (error: Exception) {
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        error = error.toRootMessage(
                            action = RootAction.JoinFamily,
                            fallback = "Не удалось присоединиться к семье.",
                        ),
                    )
                }
            }
        }
    }

    fun createHome(title: String, addressLabel: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            try {
                val home = platformRepository.createHome(
                    title = title,
                    addressLabel = addressLabel,
                    timezone = TimeZone.getDefault().id,
                )
                SessionManager.setCurrentHome(home.id)
                refreshSessionAndBootstrap()
            } catch (error: Exception) {
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        error = error.toRootMessage(
                            action = RootAction.CreateHome,
                            fallback = "Не удалось создать дом.",
                        ),
                    )
                }
            }
        }
    }

    fun logout() {
        viewModelScope.launch {
            SessionManager.logout()
            AppearanceManager.reset()
            _uiState.value = AppRootUiState(isLoading = false)
        }
    }

    companion object {
        val Factory: ViewModelProvider.Factory = object : ViewModelProvider.Factory {
            @Suppress("UNCHECKED_CAST")
            override fun <T : ViewModel> create(modelClass: Class<T>, extras: CreationExtras): T {
                val application = checkNotNull(extras[APPLICATION_KEY]) as RosDomApplication
                return AppRootViewModel(application.platformRepository) as T
            }
        }
    }
}

private enum class RootAction {
    Bootstrap,
    CreateFamily,
    JoinFamily,
    CreateHome,
}

private fun Throwable.isMissingFamilyApi(): Boolean =
    this is HttpException && code() == 404

private fun Throwable.isMissingPreferencesApi(): Boolean =
    this is HttpException && code() == 404

private fun Throwable.toRootMessage(action: RootAction, fallback: String): String {
    return when (this) {
        is HttpException -> {
            when {
                code() == 404 && action == RootAction.CreateFamily ->
                    "Сервер отвечает, но API семьи не найдено. На Linux-сервере, скорее всего, развёрнута старая версия backend."

                code() == 404 && action == RootAction.JoinFamily ->
                    "Сервер отвечает, но API присоединения к семье не найдено. Обновите backend на Linux-сервере."

                code() == 404 && action == RootAction.CreateHome ->
                    "Сервер отвечает, но API домов не найдено. Обновите backend на Linux-сервере."

                code() == 404 && action == RootAction.Bootstrap ->
                    "Сервер отвечает, но часть обязательных API не найдена. Вероятнее всего, на Linux-сервере развёрнута старая сборка backend."

                code() == 401 ->
                    "Сессия истекла. Войдите снова и проверьте адрес сервера."

                code() in listOf(500, 502, 503) ->
                    "Сервер РосДом временно недоступен. Попробуйте позже."

                else -> "Ошибка сервера РосДом: HTTP ${code()}."
            }
        }

        is IOException -> "Не удалось подключиться к серверу РосДом. Проверьте IP, домен и доступность backend."

        else -> message ?: fallback
    }
}

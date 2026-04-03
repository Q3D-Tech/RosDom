package ru.rosdom.ui.screens.profile

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.ViewModelProvider.AndroidViewModelFactory.Companion.APPLICATION_KEY
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.CreationExtras
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import ru.rosdom.RosDomApplication
import ru.rosdom.data.network.ApiFamily
import ru.rosdom.data.network.ApiFamilyMember
import ru.rosdom.data.network.ApiHome
import ru.rosdom.data.repository.PlatformRepository
import ru.rosdom.domain.model.UserMode
import ru.rosdom.domain.session.SessionManager
import ru.rosdom.ui.theme.AppearanceManager
import ru.rosdom.ui.theme.MotionModePreference
import ru.rosdom.ui.theme.ThemeModePreference

data class ProfileUiState(
    val isLoading: Boolean = true,
    val isSavingPreferences: Boolean = false,
    val family: ApiFamily? = null,
    val members: List<ApiFamilyMember> = emptyList(),
    val homes: List<ApiHome> = emptyList(),
    val latestInviteCode: String? = null,
    val favoriteCount: Int = 0,
    val uiDensity: String = "comfortable",
    val activeFloorTitle: String = "Не выбран",
    val themeMode: ThemeModePreference = ThemeModePreference.SYSTEM,
    val motionMode: MotionModePreference = MotionModePreference.STANDARD,
    val error: String? = null,
)

class ProfileViewModel(
    private val platformRepository: PlatformRepository,
) : ViewModel() {
    private val _uiState = MutableStateFlow(ProfileUiState())
    val uiState: StateFlow<ProfileUiState> = _uiState.asStateFlow()

    init {
        refresh()
    }

    fun refresh() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            try {
                val bootstrap = platformRepository.getBootstrapState()
                val members = if (bootstrap.family != null) {
                    platformRepository.getFamilyMembers()
                } else {
                    emptyList()
                }
                val homes = platformRepository.getHomes()
                val preferences = platformRepository.getUserPreferences()
                AppearanceManager.applyFromPreferences(
                    themeMode = preferences.themeMode,
                    motionMode = preferences.motionMode,
                )
                val currentHomeId = SessionManager.currentHomeId.value
                val activeFloorTitle = if (currentHomeId != null && preferences.activeFloorId != null) {
                    platformRepository.getFloors(currentHomeId)
                        .firstOrNull { it.id == preferences.activeFloorId }
                        ?.title ?: "Не выбран"
                } else {
                    "Не выбран"
                }
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        family = bootstrap.family,
                        members = members,
                        homes = homes,
                        favoriteCount = preferences.favoriteDeviceIds.size,
                        uiDensity = preferences.uiDensity,
                        activeFloorTitle = activeFloorTitle,
                        themeMode = ThemeModePreference.fromApiValue(preferences.themeMode),
                        motionMode = MotionModePreference.fromApiValue(preferences.motionMode),
                        error = null,
                    )
                }
            } catch (error: Exception) {
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        error = error.message ?: "Не удалось загрузить профиль.",
                    )
                }
            }
        }
    }

    fun createChildInvite() {
        val currentUser = SessionManager.currentUser.value
        if (currentUser?.mode != UserMode.ADULT) {
            _uiState.update {
                it.copy(error = "Только взрослый аккаунт может создавать приглашения для детей.")
            }
            return
        }

        viewModelScope.launch {
            try {
                val invite = platformRepository.createFamilyInvite(targetAccountMode = "child")
                _uiState.update {
                    it.copy(
                        latestInviteCode = invite.code,
                        error = null,
                    )
                }
            } catch (error: Exception) {
                _uiState.update {
                    it.copy(error = error.message ?: "Не удалось создать приглашение.")
                }
            }
        }
    }

    fun updateThemeMode(mode: ThemeModePreference) {
        viewModelScope.launch {
            savePreferences(
                themeMode = mode,
                motionMode = _uiState.value.motionMode,
            )
        }
    }

    fun updateMotionMode(mode: MotionModePreference) {
        viewModelScope.launch {
            savePreferences(
                themeMode = _uiState.value.themeMode,
                motionMode = mode,
            )
        }
    }

    private suspend fun savePreferences(
        themeMode: ThemeModePreference,
        motionMode: MotionModePreference,
    ) {
        _uiState.update { it.copy(isSavingPreferences = true, error = null) }
        try {
            val updated = platformRepository.updateUserPreferences(
                themeMode = themeMode.apiValue,
                motionMode = motionMode.apiValue,
            )
            AppearanceManager.applyFromPreferences(
                themeMode = updated.themeMode,
                motionMode = updated.motionMode,
            )
            _uiState.update {
                it.copy(
                    isSavingPreferences = false,
                    themeMode = ThemeModePreference.fromApiValue(updated.themeMode),
                    motionMode = MotionModePreference.fromApiValue(updated.motionMode),
                )
            }
        } catch (error: Exception) {
            _uiState.update {
                it.copy(
                    isSavingPreferences = false,
                    error = error.message ?: "Не удалось сохранить настройки интерфейса.",
                )
            }
        }
    }

    companion object {
        val Factory: ViewModelProvider.Factory = object : ViewModelProvider.Factory {
            @Suppress("UNCHECKED_CAST")
            override fun <T : ViewModel> create(modelClass: Class<T>, extras: CreationExtras): T {
                val application = checkNotNull(extras[APPLICATION_KEY]) as RosDomApplication
                return ProfileViewModel(application.platformRepository) as T
            }
        }
    }
}

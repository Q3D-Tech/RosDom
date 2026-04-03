package ru.rosdom.ui.screens.rewards

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
import ru.rosdom.data.network.ApiRewardLedgerEntry
import ru.rosdom.data.network.RosDomWebSocket
import ru.rosdom.data.repository.PlatformRepository
import ru.rosdom.domain.session.SessionManager

data class RewardsUiState(
    val isLoading: Boolean = true,
    val balance: Int = 0,
    val ledger: List<ApiRewardLedgerEntry> = emptyList(),
    val error: String? = null,
)

class RewardsViewModel(
    private val platformRepository: PlatformRepository,
    private val realtimeSocket: RosDomWebSocket,
) : ViewModel() {
    private val _uiState = MutableStateFlow(RewardsUiState())
    val uiState: StateFlow<RewardsUiState> = _uiState.asStateFlow()

    init {
        observeRealtime()
        refresh()
    }

    private fun observeRealtime() {
        viewModelScope.launch {
            realtimeSocket.events.collect { event ->
                val currentHomeId = SessionManager.currentHomeId.value
                if (event.homeId == currentHomeId) {
                    when (event.topic) {
                        "reward.balance.updated",
                        "task.updated",
                        "home.state.updated" -> refresh()
                    }
                }
            }
        }
    }

    fun refresh() {
        viewModelScope.launch {
            val homeId = SessionManager.currentHomeId.value
            if (homeId == null) {
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        error = "Сначала настройте дом и активный профиль семьи.",
                    )
                }
                return@launch
            }

            _uiState.update { it.copy(isLoading = true, error = null) }
            try {
                val balance = platformRepository.getRewardBalance(homeId)
                val ledger = platformRepository.getRewardLedger(homeId)
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        balance = balance,
                        ledger = ledger,
                    )
                }
            } catch (error: Exception) {
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        error = error.message ?: "Не удалось загрузить баланс и историю наград.",
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
                return RewardsViewModel(
                    application.platformRepository,
                    application.realtimeSocket,
                ) as T
            }
        }
    }
}

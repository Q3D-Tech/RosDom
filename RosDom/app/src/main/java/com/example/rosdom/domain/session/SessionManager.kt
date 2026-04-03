package ru.rosdom.domain.session

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import ru.rosdom.data.repository.AuthRepository
import ru.rosdom.data.session.AuthSession
import ru.rosdom.data.session.SessionStore
import ru.rosdom.domain.model.User

object SessionManager {
    private lateinit var sessionStore: SessionStore
    private lateinit var authRepository: AuthRepository

    private val _currentUser = MutableStateFlow<User?>(null)
    val currentUser: StateFlow<User?> = _currentUser.asStateFlow()

    private val _currentHomeId = MutableStateFlow<String?>(null)
    val currentHomeId: StateFlow<String?> = _currentHomeId.asStateFlow()

    private val _accessToken = MutableStateFlow<String?>(null)
    val accessTokenFlow: StateFlow<String?> = _accessToken.asStateFlow()

    private val _isRestoring = MutableStateFlow(true)
    val isRestoring: StateFlow<Boolean> = _isRestoring.asStateFlow()

    private var currentSession: AuthSession? = null
    val accessToken: String?
        get() = currentSession?.accessToken

    fun initialize(
        sessionStore: SessionStore,
        authRepository: AuthRepository,
    ) {
        this.sessionStore = sessionStore
        this.authRepository = authRepository
    }

    suspend fun restoreSession() {
        if (!::sessionStore.isInitialized || !::authRepository.isInitialized) {
            _isRestoring.value = false
            return
        }

        val stored = sessionStore.read()
        if (stored == null) {
            currentSession = null
            _currentUser.value = null
            _currentHomeId.value = null
            _isRestoring.value = false
            return
        }

        currentSession = stored
        _accessToken.value = stored.accessToken
        _currentUser.value = stored.user
        _currentHomeId.value = stored.currentHomeId

        try {
            val freshUser = authRepository.me()
            val refreshed = stored.copy(user = freshUser)
            currentSession = refreshed
            _currentUser.value = freshUser
            sessionStore.write(refreshed)
        } catch (_: Exception) {
            clearState()
            sessionStore.clear()
        } finally {
            _isRestoring.value = false
        }
    }

    suspend fun establishSession(session: AuthSession) {
        currentSession = session
        _accessToken.value = session.accessToken
        _currentUser.value = session.user
        _currentHomeId.value = session.currentHomeId
        sessionStore.write(session)
    }

    suspend fun setCurrentHome(homeId: String?) {
        _currentHomeId.value = homeId
        currentSession = currentSession?.copy(currentHomeId = homeId)
        currentSession?.let { sessionStore.write(it) } ?: sessionStore.updateCurrentHome(homeId)
    }

    suspend fun logout() {
        try {
            if (::authRepository.isInitialized && currentSession != null) {
                authRepository.logout()
            }
        } catch (_: Exception) {
            // Best-effort logout. Local session is still cleared below.
        } finally {
            clearState()
            if (::sessionStore.isInitialized) {
                sessionStore.clear()
            }
        }
    }

    private fun clearState() {
        currentSession = null
        _accessToken.value = null
        _currentUser.value = null
        _currentHomeId.value = null
    }
}

package ru.rosdom.data.repository

import ru.rosdom.data.network.AuthPayload
import ru.rosdom.data.network.LoginRequest
import ru.rosdom.data.network.RefreshRequest
import ru.rosdom.data.network.RegisterRequest
import ru.rosdom.data.network.RosDomApi
import ru.rosdom.data.session.AuthSession
import ru.rosdom.domain.model.User

class AuthRepository(
    private val api: RosDomApi,
) {
    suspend fun register(request: RegisterRequest): AuthSession {
        return api.register(request).data.toSession()
    }

    suspend fun login(request: LoginRequest): AuthSession {
        return api.login(request).data.toSession()
    }

    suspend fun refresh(refreshToken: String): AuthSession {
        return api.refresh(RefreshRequest(refreshToken)).data.toSession()
    }

    suspend fun logout() {
        api.logout()
    }

    suspend fun me(): User {
        return api.me().data.toDomain()
    }
}

fun AuthPayload.toSession(currentHomeId: String? = null): AuthSession {
    return AuthSession(
        accessToken = accessToken,
        refreshToken = refreshToken,
        sessionId = sessionId,
        expiresAt = expiresAt,
        user = user.toDomain(),
        currentHomeId = currentHomeId,
    )
}

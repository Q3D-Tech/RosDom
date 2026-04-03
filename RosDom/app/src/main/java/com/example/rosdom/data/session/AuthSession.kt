package ru.rosdom.data.session

import ru.rosdom.domain.model.User

data class AuthSession(
    val accessToken: String,
    val refreshToken: String,
    val sessionId: String,
    val expiresAt: String,
    val user: User,
    val currentHomeId: String? = null,
)

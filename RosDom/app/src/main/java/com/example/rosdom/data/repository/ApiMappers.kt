package ru.rosdom.data.repository

import ru.rosdom.data.network.ApiUser
import ru.rosdom.domain.model.User

fun ApiUser.toDomain(): User {
    return User(
        id = id,
        name = displayName,
        emailOrPhone = loginIdentifier,
        birthYear = birthYear,
        role = when (accountMode) {
            "child" -> "Ребёнок"
            "elderly" -> "Пожилой"
            else -> "Взрослый"
        },
    )
}

package ru.rosdom.domain.model

import java.util.Calendar

enum class UserMode {
    KIDS,
    ADULT,
    ELDERLY,
}

data class User(
    val id: String,
    val name: String,
    val emailOrPhone: String,
    val birthYear: Int,
    val role: String = "Взрослый",
    val familyId: String? = null,
) {
    val mode: UserMode
        get() {
            val currentYear = Calendar.getInstance().get(Calendar.YEAR)
            val age = currentYear - birthYear
            return when {
                age in 0..13 -> UserMode.KIDS
                age in 14..49 -> UserMode.ADULT
                else -> UserMode.ELDERLY
            }
        }
}

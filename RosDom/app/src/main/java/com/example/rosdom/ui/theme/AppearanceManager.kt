package ru.rosdom.ui.theme

import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow

enum class ThemeModePreference(val apiValue: String) {
    SYSTEM("system"),
    LIGHT("light"),
    DARK("dark");

    companion object {
        fun fromApiValue(value: String?): ThemeModePreference = when (value?.lowercase()) {
            LIGHT.apiValue -> LIGHT
            DARK.apiValue -> DARK
            else -> SYSTEM
        }
    }
}

enum class MotionModePreference(val apiValue: String) {
    STANDARD("standard"),
    REDUCED("reduced");

    companion object {
        fun fromApiValue(value: String?): MotionModePreference = when (value?.lowercase()) {
            REDUCED.apiValue -> REDUCED
            else -> STANDARD
        }
    }
}

data class RosDomMotionSpec(
    val reduced: Boolean,
    val shortMillis: Int,
    val mediumMillis: Int,
    val longMillis: Int,
)

object AppearanceManager {
    private val _themeMode = MutableStateFlow(ThemeModePreference.SYSTEM)
    val themeMode: StateFlow<ThemeModePreference> = _themeMode.asStateFlow()

    private val _motionMode = MutableStateFlow(MotionModePreference.STANDARD)
    val motionMode: StateFlow<MotionModePreference> = _motionMode.asStateFlow()

    fun applyFromPreferences(
        themeMode: String?,
        motionMode: String?,
    ) {
        _themeMode.value = ThemeModePreference.fromApiValue(themeMode)
        _motionMode.value = MotionModePreference.fromApiValue(motionMode)
    }

    fun setThemeMode(mode: ThemeModePreference) {
        _themeMode.value = mode
    }

    fun setMotionMode(mode: MotionModePreference) {
        _motionMode.value = mode
    }

    fun reset() {
        _themeMode.value = ThemeModePreference.SYSTEM
        _motionMode.value = MotionModePreference.STANDARD
    }
}

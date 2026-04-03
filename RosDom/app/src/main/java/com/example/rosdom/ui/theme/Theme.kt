package ru.rosdom.ui.theme

import android.app.Activity
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Shapes
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.lightColorScheme
import androidx.compose.runtime.Composable
import androidx.compose.runtime.CompositionLocalProvider
import androidx.compose.runtime.SideEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.staticCompositionLocalOf
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.platform.LocalView
import androidx.compose.ui.unit.dp
import androidx.core.view.WindowCompat
import ru.rosdom.domain.model.UserMode
import ru.rosdom.domain.session.SessionManager

val LocalRosDomMotion = staticCompositionLocalOf {
    RosDomMotionSpec(
        reduced = false,
        shortMillis = 140,
        mediumMillis = 220,
        longMillis = 320,
    )
}

private val LightColorScheme = lightColorScheme(
    primary = RosDomPurple,
    secondary = RosDomPurpleDeep,
    tertiary = RosDomCyan,
    background = BackgroundLight,
    surface = SurfaceLight,
    surfaceVariant = SurfaceRaisedLight,
    onPrimary = SurfaceLight,
    onSecondary = SurfaceLight,
    onBackground = TextPrimaryLight,
    onSurface = TextPrimaryLight,
    onSurfaceVariant = TextSecondaryLight,
    error = RosDomCritical,
    outline = OutlineSoftLight,
)

private val DarkColorScheme = darkColorScheme(
    primary = RosDomPurple,
    secondary = RosDomPurpleGlow,
    tertiary = RosDomCyan,
    background = BackgroundDark,
    surface = SurfaceDark,
    surfaceVariant = SurfaceRaisedDark,
    onPrimary = TextPrimaryDark,
    onSecondary = TextPrimaryDark,
    onBackground = TextPrimaryDark,
    onSurface = TextPrimaryDark,
    onSurfaceVariant = TextSecondaryDark,
    error = RosDomCritical,
    outline = OutlineSoftDark,
)

private val RosDomShapes = Shapes(
    extraSmall = androidx.compose.foundation.shape.RoundedCornerShape(12.dp),
    small = androidx.compose.foundation.shape.RoundedCornerShape(16.dp),
    medium = androidx.compose.foundation.shape.RoundedCornerShape(22.dp),
    large = androidx.compose.foundation.shape.RoundedCornerShape(28.dp),
    extraLarge = androidx.compose.foundation.shape.RoundedCornerShape(34.dp),
)

@Composable
fun RosDomTheme(
    content: @Composable () -> Unit,
) {
    val currentUser by SessionManager.currentUser.collectAsState()
    val preferredTheme by AppearanceManager.themeMode.collectAsState()
    val preferredMotion by AppearanceManager.motionMode.collectAsState()

    val darkTheme = when (preferredTheme) {
        ThemeModePreference.LIGHT -> false
        ThemeModePreference.DARK -> true
        ThemeModePreference.SYSTEM -> isSystemInDarkTheme()
    }
    val colorScheme = if (darkTheme) DarkColorScheme else LightColorScheme
    val typography = if (currentUser?.mode == UserMode.ELDERLY) {
        ElderlyTypography
    } else {
        RosDomTypography
    }
    val motionSpec = if (preferredMotion == MotionModePreference.REDUCED) {
        RosDomMotionSpec(
            reduced = true,
            shortMillis = 80,
            mediumMillis = 120,
            longMillis = 160,
        )
    } else {
        RosDomMotionSpec(
            reduced = false,
            shortMillis = 140,
            mediumMillis = 220,
            longMillis = 320,
        )
    }

    val view = LocalView.current
    if (!view.isInEditMode) {
        SideEffect {
            val window = (view.context as Activity).window
            window.statusBarColor = colorScheme.background.toArgb()
            window.navigationBarColor = colorScheme.background.toArgb()
            WindowCompat.getInsetsController(window, view).apply {
                isAppearanceLightStatusBars = !darkTheme
                isAppearanceLightNavigationBars = !darkTheme
            }
        }
    }

    CompositionLocalProvider(LocalRosDomMotion provides motionSpec) {
        MaterialTheme(
            colorScheme = colorScheme,
            typography = typography,
            shapes = RosDomShapes,
            content = content,
        )
    }
}

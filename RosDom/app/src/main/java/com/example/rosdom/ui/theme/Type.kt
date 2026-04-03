package ru.rosdom.ui.theme

import androidx.compose.material3.Typography
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.sp

val RosDomTypography = Typography(
    displaySmall = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.ExtraBold,
        fontSize = 36.sp,
        lineHeight = 40.sp,
        letterSpacing = (-0.6).sp,
    ),
    headlineLarge = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Bold,
        fontSize = 30.sp,
        lineHeight = 34.sp,
        letterSpacing = (-0.4).sp,
    ),
    headlineMedium = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Bold,
        fontSize = 24.sp,
        lineHeight = 28.sp,
        letterSpacing = (-0.3).sp,
    ),
    headlineSmall = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Bold,
        fontSize = 20.sp,
        lineHeight = 24.sp,
        letterSpacing = (-0.2).sp,
    ),
    titleLarge = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.SemiBold,
        fontSize = 18.sp,
        lineHeight = 22.sp,
    ),
    titleMedium = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.SemiBold,
        fontSize = 16.sp,
        lineHeight = 20.sp,
    ),
    bodyLarge = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Normal,
        fontSize = 16.sp,
        lineHeight = 22.sp,
    ),
    bodyMedium = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Normal,
        fontSize = 14.sp,
        lineHeight = 20.sp,
    ),
    bodySmall = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Normal,
        fontSize = 12.sp,
        lineHeight = 17.sp,
    ),
    labelLarge = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Medium,
        fontSize = 14.sp,
        lineHeight = 18.sp,
    ),
    labelMedium = TextStyle(
        fontFamily = FontFamily.Default,
        fontWeight = FontWeight.Medium,
        fontSize = 12.sp,
        lineHeight = 16.sp,
    ),
)

val ElderlyTypography = Typography(
    displaySmall = RosDomTypography.displaySmall.copy(fontSize = 40.sp, lineHeight = 44.sp),
    headlineLarge = RosDomTypography.headlineLarge.copy(fontSize = 34.sp, lineHeight = 38.sp),
    headlineMedium = RosDomTypography.headlineMedium.copy(fontSize = 28.sp, lineHeight = 32.sp),
    headlineSmall = RosDomTypography.headlineSmall.copy(fontSize = 24.sp, lineHeight = 28.sp),
    titleLarge = RosDomTypography.titleLarge.copy(fontSize = 22.sp, lineHeight = 26.sp),
    titleMedium = RosDomTypography.titleMedium.copy(fontSize = 20.sp, lineHeight = 24.sp),
    bodyLarge = RosDomTypography.bodyLarge.copy(fontSize = 20.sp, lineHeight = 28.sp),
    bodyMedium = RosDomTypography.bodyMedium.copy(fontSize = 18.sp, lineHeight = 26.sp),
    bodySmall = RosDomTypography.bodySmall.copy(fontSize = 16.sp, lineHeight = 22.sp),
    labelLarge = RosDomTypography.labelLarge.copy(fontSize = 18.sp, lineHeight = 22.sp),
    labelMedium = RosDomTypography.labelMedium.copy(fontSize = 16.sp, lineHeight = 20.sp),
)

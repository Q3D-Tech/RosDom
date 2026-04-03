package ru.rosdom.ui.navigation

import androidx.compose.animation.animateColorAsState
import androidx.compose.animation.core.animateFloatAsState
import androidx.compose.animation.core.tween
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.Assignment
import androidx.compose.material.icons.filled.Devices
import androidx.compose.material.icons.filled.GridView
import androidx.compose.material.icons.filled.Home
import androidx.compose.material.icons.filled.Lock
import androidx.compose.material.icons.filled.Person
import androidx.compose.material.icons.filled.Stars
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import ru.rosdom.domain.model.UserMode
import ru.rosdom.ui.components.RosDomBottomInsetSpacer
import ru.rosdom.ui.components.RosDomPageBackground
import ru.rosdom.ui.screens.auth.AuthScreen
import ru.rosdom.ui.screens.device.AddDeviceScreen
import ru.rosdom.ui.screens.device.DeviceDetailScreen
import ru.rosdom.ui.screens.device.DevicesListScreen
import ru.rosdom.ui.screens.home.HomeScreen
import ru.rosdom.ui.screens.onboarding.OnboardingScreen
import ru.rosdom.ui.screens.profile.ProfileScreen
import ru.rosdom.ui.screens.rewards.RewardsScreen
import ru.rosdom.ui.screens.rooms.RoomsScreen
import ru.rosdom.ui.screens.scenarios.ScenariosScreen
import ru.rosdom.ui.screens.security.SecurityScreen
import ru.rosdom.ui.screens.tasks.TasksScreen
import ru.rosdom.ui.screens.welcome.WelcomeScreen
import ru.rosdom.ui.theme.LocalRosDomMotion
import ru.rosdom.ui.theme.RosDomPurple

sealed class Screen(
    val route: String,
    val title: String,
    val icon: ImageVector,
) {
    data object Home : Screen("home", "Главная", Icons.Filled.Home)
    data object Rooms : Screen("rooms", "Комнаты", Icons.Filled.GridView)
    data object Devices : Screen("devices", "Устройства", Icons.Filled.Devices)
    data object Security : Screen("security", "Охрана", Icons.Filled.Lock)
    data object Profile : Screen("profile", "Профиль", Icons.Filled.Person)
    data object Tasks : Screen("tasks", "Задания", Icons.AutoMirrored.Filled.Assignment)
    data object Rewards : Screen("rewards", "Награды", Icons.Filled.Stars)
    data object Scenarios : Screen("scenarios", "Сценарии", Icons.AutoMirrored.Filled.Assignment)
    data object AddDevice : Screen("add_device", "Подключение", Icons.Filled.Devices)
    data object DeviceDetail : Screen("device/{deviceId}", "Устройство", Icons.Filled.Devices) {
        fun createRoute(deviceId: String) = "device/$deviceId"
    }
}

@Composable
fun RosDomApp(
    rootViewModel: AppRootViewModel = androidx.lifecycle.viewmodel.compose.viewModel(factory = AppRootViewModel.Factory),
) {
    val rootState by rootViewModel.uiState.collectAsState()
    var authMode by rememberSaveable { mutableStateOf<Boolean?>(null) }

    when {
        rootState.isLoading -> {
            RosDomPageBackground {
                Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator(color = RosDomPurple)
                }
            }
        }

        rootState.currentUser == null -> {
            when (authMode) {
                null -> WelcomeScreen(
                    onLogin = { authMode = true },
                    onRegister = { authMode = false },
                )

                else -> AuthScreen(
                    initialLoginMode = authMode == true,
                    onAuthSuccess = {
                        authMode = null
                        rootViewModel.refreshSessionAndBootstrap()
                    },
                    onBack = { authMode = null },
                )
            }
        }

        rootState.needsOnboarding -> {
            OnboardingScreen(
                userMode = rootState.currentUser?.mode ?: UserMode.ADULT,
                hasFamily = rootState.family != null,
                isLoading = rootState.isLoading,
                error = rootState.error,
                warning = rootState.warning,
                onCreateFamily = rootViewModel::createFamily,
                onJoinFamily = rootViewModel::joinFamily,
                onCreateHome = rootViewModel::createHome,
                onRetry = rootViewModel::refreshSessionAndBootstrap,
                onLogout = rootViewModel::logout,
            )
        }

        else -> {
            val bottomNavItems = if (rootState.currentUser?.mode == UserMode.KIDS) {
                listOf(Screen.Home, Screen.Rooms, Screen.Tasks, Screen.Rewards, Screen.Profile)
            } else {
                listOf(Screen.Home, Screen.Rooms, Screen.Devices, Screen.Security, Screen.Profile)
            }
            val navController = rememberNavController()

            Scaffold(
                containerColor = Color.Transparent,
                bottomBar = {
                    RosDomBottomBar(
                        navController = navController,
                        items = bottomNavItems,
                    )
                },
            ) { padding ->
                Box(modifier = Modifier.padding(padding)) {
                    RosDomNavHost(
                        navController = navController,
                        onLogout = rootViewModel::logout,
                    )
                }
            }
        }
    }
}

@Composable
fun RosDomNavHost(
    navController: NavHostController,
    modifier: Modifier = Modifier,
    onLogout: () -> Unit = {},
) {
    NavHost(
        navController = navController,
        startDestination = Screen.Home.route,
        modifier = modifier,
    ) {
        composable(Screen.Home.route) {
            HomeScreen(
                onNavigateToDevice = { deviceId ->
                    navController.navigate(Screen.DeviceDetail.createRoute(deviceId))
                },
                onNavigateToProfile = { navController.navigate(Screen.Profile.route) },
                onNavigateToRooms = { navController.navigate(Screen.Rooms.route) },
                onNavigateToDevices = { navController.navigate(Screen.Devices.route) },
                onNavigateToSecurity = { navController.navigate(Screen.Security.route) },
                onNavigateToTasks = { navController.navigate(Screen.Tasks.route) },
                onNavigateToRewards = { navController.navigate(Screen.Rewards.route) },
            )
        }
        composable(Screen.Rooms.route) { RoomsScreen() }
        composable(Screen.Tasks.route) { TasksScreen() }
        composable(Screen.Rewards.route) { RewardsScreen() }
        composable(Screen.Scenarios.route) { ScenariosScreen() }
        composable(Screen.Devices.route) {
            DevicesListScreen(
                onNavigateToDevice = { deviceId ->
                    navController.navigate(Screen.DeviceDetail.createRoute(deviceId))
                },
                onNavigateToAddDevice = { navController.navigate(Screen.AddDevice.route) },
            )
        }
        composable(Screen.AddDevice.route) {
            AddDeviceScreen(onBack = { navController.popBackStack() })
        }
        composable(Screen.Security.route) { SecurityScreen() }
        composable(Screen.Profile.route) { ProfileScreen(onLogout = onLogout) }
        composable(
            route = Screen.DeviceDetail.route,
            arguments = listOf(navArgument("deviceId") { type = NavType.StringType }),
        ) { backStackEntry ->
            val deviceId = backStackEntry.arguments?.getString("deviceId").orEmpty()
            DeviceDetailScreen(
                deviceId = deviceId,
                onBack = { navController.popBackStack() },
            )
        }
    }
}

@Composable
fun RosDomBottomBar(
    navController: NavHostController,
    items: List<Screen>,
) {
    val navBackStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = navBackStackEntry?.destination?.route
    val motion = LocalRosDomMotion.current
    val hideRail = currentRoute == Screen.AddDevice.route || currentRoute?.startsWith("device/") == true

    if (hideRail) {
        RosDomBottomInsetSpacer()
        return
    }

    Column {
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 12.dp),
        ) {
            Surface(
                modifier = Modifier.fillMaxWidth(),
                shape = MaterialTheme.shapes.extraLarge,
                color = MaterialTheme.colorScheme.surface.copy(alpha = 0.94f),
                shadowElevation = 12.dp,
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 8.dp, vertical = 10.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically,
                ) {
                    items.forEach { screen ->
                        val selected = currentRoute == screen.route
                        val tint by animateColorAsState(
                            targetValue = if (selected) Color.White else MaterialTheme.colorScheme.onSurfaceVariant,
                            animationSpec = tween(if (motion.reduced) motion.shortMillis else motion.mediumMillis),
                            label = "rail-tint",
                        )
                        val scale by animateFloatAsState(
                            targetValue = if (selected) 1f else 0.96f,
                            animationSpec = tween(if (motion.reduced) motion.shortMillis else motion.mediumMillis),
                            label = "rail-scale",
                        )
                        Surface(
                            shape = MaterialTheme.shapes.large,
                            color = if (selected) RosDomPurple else Color.Transparent,
                            modifier = Modifier
                                .weight(1f)
                                .graphicsLayer {
                                    scaleX = scale
                                    scaleY = scale
                                },
                        ) {
                            Column(
                                modifier = Modifier
                                    .clickable(
                                        interactionSource = remember { MutableInteractionSource() },
                                        indication = null,
                                    ) {
                                        navController.navigate(screen.route) {
                                            popUpTo(navController.graph.startDestinationId) { saveState = true }
                                            launchSingleTop = true
                                            restoreState = true
                                        }
                                    }
                                    .padding(vertical = 10.dp),
                                horizontalAlignment = Alignment.CenterHorizontally,
                                verticalArrangement = Arrangement.spacedBy(4.dp),
                            ) {
                                Icon(
                                    imageVector = screen.icon,
                                    contentDescription = screen.title,
                                    tint = tint,
                                )
                                Text(
                                    text = screen.title,
                                    style = MaterialTheme.typography.labelMedium,
                                    color = tint,
                                    fontWeight = if (selected) FontWeight.Bold else FontWeight.Medium,
                                )
                            }
                        }
                    }
                }
            }
        }
        RosDomBottomInsetSpacer()
    }
}

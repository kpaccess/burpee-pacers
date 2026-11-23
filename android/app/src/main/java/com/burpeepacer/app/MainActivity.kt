package com.burpeepacer.app

import android.os.Bundle
import android.util.Log
import android.view.WindowManager
import androidx.activity.ComponentActivity
import androidx.activity.SystemBarStyle
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.activity.viewModels
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.safeDrawingPadding
import androidx.compose.material3.AlertDialog
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.material3.Surface
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Modifier
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.burpeepacer.app.data.CloudSync
import com.burpeepacer.app.data.DataRepository
import com.burpeepacer.app.model.ProgramCatalog
import com.burpeepacer.app.model.ProgramTrack
import com.burpeepacer.app.ui.screens.DashboardScreen
import com.burpeepacer.app.ui.screens.WorkoutScreen
import com.burpeepacer.app.ui.screens.LandingScreen
import com.burpeepacer.app.ui.theme.BurpeePacerTheme
import com.burpeepacer.app.viewmodel.AppViewModel

class MainActivity : ComponentActivity() {
    private val repository by lazy { DataRepository(applicationContext) }
    private val cloud by lazy { CloudSync(applicationContext) }
    
    private val appViewModel: AppViewModel by viewModels {
        object : ViewModelProvider.Factory {
            override fun <T : ViewModel> create(modelClass: Class<T>): T {
                Log.d("BurpeePacer", "Creating AppViewModel")
                return AppViewModel(repository, cloud) as T
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        Log.d("BurpeePacer", "MainActivity onCreate")
        // Levels, goals and schedule defaults come from the shared (web/iOS) program config.
        ProgramCatalog.init(applicationContext)
        // Keep the screen on (no dimming or auto-lock) for as long as the app is open.
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        // Targeting Android 15+ draws the app behind the system bars; the app is always dark, so keep
        // transparent bars with light icons and pad the content below/above them.
        enableEdgeToEdge(
            statusBarStyle = SystemBarStyle.dark(android.graphics.Color.TRANSPARENT),
            navigationBarStyle = SystemBarStyle.dark(android.graphics.Color.TRANSPARENT)
        )
        setContent {
            BurpeePacerTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    Box(modifier = Modifier.fillMaxSize().safeDrawingPadding()) {
                        AppNavigation(appViewModel)
                    }
                }
            }
        }
    }
}

@Composable
fun AppNavigation(appViewModel: AppViewModel) {
    val navController = rememberNavController()
    val userProfile by appViewModel.userProfile.collectAsState()

    val needsTrackChoice by appViewModel.needsTrackChoice.collectAsState()
    val syncError by appViewModel.syncError.collectAsState()

    // Signing out (here or from another device's session expiring) always returns to the sign-in screen.
    LaunchedEffect(userProfile.isLoggedIn) {
        if (!userProfile.isLoggedIn && navController.currentDestination?.route != "landing") {
            navController.navigate("landing") { popUpTo(0) }
        }
    }

    if (userProfile.isLoggedIn && needsTrackChoice) {
        AlertDialog(
            onDismissRequest = {},
            title = { Text("Choose your track") },
            text = { Text("Beginner builds up with 5-Count Pushups. Advanced adds Navy Seals and Hybrid sessions. You can change this later.") },
            confirmButton = {
                TextButton(onClick = { appViewModel.updateTrack(ProgramTrack.ADVANCED) }) { Text("Advanced") }
            },
            dismissButton = {
                TextButton(onClick = { appViewModel.updateTrack(ProgramTrack.BEGINNER) }) { Text("Beginner") }
            }
        )
    }

    syncError?.let { message ->
        AlertDialog(
            onDismissRequest = { appViewModel.dismissSyncError() },
            title = { Text("Not saved") },
            text = { Text(message) },
            confirmButton = { TextButton(onClick = { appViewModel.dismissSyncError() }) { Text("OK") } }
        )
    }

    NavHost(
        navController = navController, 
        startDestination = if (userProfile.isLoggedIn) "dashboard" else "landing"
    ) {
        composable("landing") {
            LandingScreen(
                viewModel = appViewModel,
                onLoginSuccess = { 
                    navController.navigate("dashboard") {
                        popUpTo("landing") { inclusive = true }
                    }
                }
            )
        }
        composable("dashboard") {
            DashboardScreen(
                viewModel = appViewModel,
                onStartWorkout = { navController.navigate("workout") },
                onLogout = {
                    navController.navigate("landing") {
                        popUpTo("dashboard") { inclusive = true }
                    }
                }
            )
        }
        composable("workout") {
            WorkoutScreen(
                appViewModel = appViewModel,
                onClose = { navController.popBackStack() }
            )
        }
    }
}

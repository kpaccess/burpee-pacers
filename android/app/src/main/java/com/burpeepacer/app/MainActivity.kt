package com.burpeepacer.app

import android.os.Bundle
import android.util.Log
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.viewModels
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
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
import com.burpeepacer.app.data.DataRepository
import com.burpeepacer.app.ui.screens.DashboardScreen
import com.burpeepacer.app.ui.screens.WorkoutScreen
import com.burpeepacer.app.ui.screens.LandingScreen
import com.burpeepacer.app.ui.theme.BurpeePacerTheme
import com.burpeepacer.app.viewmodel.AppViewModel

class MainActivity : ComponentActivity() {
    private val repository by lazy { DataRepository(applicationContext) }
    
    private val appViewModel: AppViewModel by viewModels {
        object : ViewModelProvider.Factory {
            override fun <T : ViewModel> create(modelClass: Class<T>): T {
                Log.d("BurpeePacer", "Creating AppViewModel")
                return AppViewModel(repository) as T
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        Log.d("BurpeePacer", "MainActivity onCreate")
        setContent {
            BurpeePacerTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    AppNavigation(appViewModel)
                }
            }
        }
    }
}

@Composable
fun AppNavigation(appViewModel: AppViewModel) {
    val navController = rememberNavController()
    val userProfile by appViewModel.userProfile.collectAsState()

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

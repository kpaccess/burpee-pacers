package com.burpeepacer.app.ui.screens

import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.burpeepacer.app.viewmodel.AppViewModel
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.common.api.ApiException

@Composable
fun LandingScreen(
    viewModel: AppViewModel,
    onLoginSuccess: () -> Unit
) {
    val userProfile by viewModel.userProfile.collectAsState()
    val authError by viewModel.authError.collectAsState()
    val isSigningIn by viewModel.isSigningIn.collectAsState()

    val googleLauncher = rememberLauncherForActivityResult(ActivityResultContracts.StartActivityForResult()) { result ->
        try {
            val account = GoogleSignIn.getSignedInAccountFromIntent(result.data).getResult(ApiException::class.java)
            viewModel.signInWithGoogle(account.idToken)
        } catch (e: ApiException) {
            // 12501 = the user closed the account picker; nothing to report.
            if (e.statusCode != 12501) viewModel.reportAuthError("Google sign-in failed (code ${e.statusCode}). Please try again.")
        }
    }

    // If already logged in, move forward
    LaunchedEffect(userProfile.isLoggedIn) {
        if (userProfile.isLoggedIn) {
            onLoginSuccess()
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(
                brush = Brush.verticalGradient(
                    colors = listOf(Color(0xFF09090B), Color(0xFF1C1C1E))
                )
            )
    ) {
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(32.dp),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Text(
                text = "BurpeePacer",
                fontSize = 42.sp,
                fontWeight = FontWeight.Black,
                color = Color(0xFFDC2626), // Crimson
                textAlign = TextAlign.Center
            )
            
            Spacer(modifier = Modifier.height(16.dp))
            
            Text(
                text = "Master the art of the burpee. 20 minutes a day. Three times a week. Parity with elite pacing.",
                fontSize = 18.sp,
                color = Color(0xFFA1A1AA),
                textAlign = TextAlign.Center,
                lineHeight = 26.sp
            )

            Spacer(modifier = Modifier.height(64.dp))

            // Value Props
            LandingValueProp("Structured Levels", "From B1 to Elite")
            LandingValueProp("Pacer Metronome", "Hit every rep on time")
            LandingValueProp("Strength Finishers", "Personalized to your age")

            Spacer(modifier = Modifier.height(64.dp))

            Button(
                onClick = {
                    val intent = viewModel.googleSignInIntent()
                    if (intent == null) {
                        viewModel.reportAuthError(
                            "Google sign-in isn't set up in this build yet. Add the Android app's google-services.json (with its SHA-1) from the Firebase console."
                        )
                    } else {
                        googleLauncher.launch(intent)
                    }
                },
                enabled = !isSigningIn,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(56.dp),
                shape = RoundedCornerShape(12.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFFDC2626))
            ) {
                if (isSigningIn) {
                    CircularProgressIndicator(modifier = Modifier.size(22.dp), color = Color.White, strokeWidth = 2.dp)
                } else {
                    Text(
                        text = "CONTINUE WITH GOOGLE",
                        fontWeight = FontWeight.Bold,
                        fontSize = 16.sp,
                        color = Color.White
                    )
                }
            }

            authError?.let {
                Spacer(modifier = Modifier.height(12.dp))
                Text(text = it, fontSize = 13.sp, color = Color(0xFFF87171), textAlign = TextAlign.Center)
            }

            Spacer(modifier = Modifier.height(16.dp))
            
            Text(
                text = "Use the same Google account as the web and iOS apps to see your progress everywhere.",
                fontSize = 12.sp,
                color = Color(0xFF52525B),
                textAlign = TextAlign.Center
            )
        }
    }
}

@Composable
fun LandingValueProp(title: String, subtitle: String) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = title,
            fontWeight = FontWeight.Bold,
            color = Color.White,
            fontSize = 16.sp
        )
        Text(
            text = subtitle,
            color = Color(0xFFA1A1AA),
            fontSize = 14.sp
        )
    }
}

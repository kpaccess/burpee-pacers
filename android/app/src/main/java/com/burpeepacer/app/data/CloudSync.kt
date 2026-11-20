package com.burpeepacer.app.data

import android.content.Context
import android.content.Intent
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInClient
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.GoogleAuthProvider
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.SetOptions
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await

/** State of the signed-in user's Firestore document. */
sealed interface RemoteDoc {
    data class Data(val fields: Map<String, Any?>) : RemoteDoc
    data object Missing : RemoteDoc
    data class Error(val message: String) : RemoteDoc
}

/**
 * Google sign-in through Firebase Auth plus the user's `users/{uid}` Firestore document, the same
 * account and data the web and iOS apps use.
 */
class CloudSync(private val context: Context) {

    private val auth: FirebaseAuth? by lazy { runCatching { FirebaseAuth.getInstance() }.getOrNull() }
    private val db: FirebaseFirestore? by lazy { runCatching { FirebaseFirestore.getInstance() }.getOrNull() }

    /** The OAuth web client id the Firebase plugin generates once the Android app is registered. */
    private val webClientId: String? by lazy {
        val id = context.resources.getIdentifier("default_web_client_id", "string", context.packageName)
        if (id == 0) null else context.getString(id)
    }

    val isConfigured: Boolean get() = auth != null && webClientId != null

    val currentUid: String? get() = auth?.currentUser?.uid

    private val googleClient: GoogleSignInClient? by lazy {
        val clientId = webClientId ?: return@lazy null
        val options = GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
            .requestIdToken(clientId)
            .requestEmail()
            .build()
        GoogleSignIn.getClient(context, options)
    }

    fun googleSignInIntent(): Intent? = googleClient?.signInIntent

    /** Emits the signed-in user's uid, or null when signed out. */
    val uidFlow: Flow<String?> = callbackFlow {
        val firebaseAuth = auth
        if (firebaseAuth == null) {
            trySend(null)
            awaitClose { }
        } else {
            val listener = FirebaseAuth.AuthStateListener { trySend(it.currentUser?.uid) }
            firebaseAuth.addAuthStateListener(listener)
            awaitClose { firebaseAuth.removeAuthStateListener(listener) }
        }
    }

    suspend fun signInWithGoogleIdToken(idToken: String) {
        val firebaseAuth = auth ?: error("Firebase isn't configured")
        firebaseAuth.signInWithCredential(GoogleAuthProvider.getCredential(idToken, null)).await()
    }

    fun userDocument(uid: String): Flow<RemoteDoc> = callbackFlow {
        val firestore = db
        if (firestore == null) {
            trySend(RemoteDoc.Error("Firebase isn't configured"))
            awaitClose { }
        } else {
            val registration = firestore.collection("users").document(uid)
                .addSnapshotListener { snapshot, error ->
                    when {
                        error != null -> trySend(RemoteDoc.Error(error.localizedMessage ?: "Couldn't load your account"))
                        snapshot == null || !snapshot.exists() -> trySend(RemoteDoc.Missing)
                        else -> trySend(RemoteDoc.Data(snapshot.data.orEmpty()))
                    }
                }
            awaitClose { registration.remove() }
        }
    }

    /** Creates the profile for a first-time user (merge, so nothing is overwritten). */
    suspend fun createProfile(newUserFields: Map<String, Any>) = update(newUserFields)

    /** Merges [fields] into the signed-in user's document. */
    suspend fun update(fields: Map<String, Any>) {
        val uid = currentUid ?: error("Not signed in")
        val firestore = db ?: error("Firebase isn't configured")
        firestore.collection("users").document(uid).set(fields, SetOptions.merge()).await()
    }

    val displayName: String? get() = auth?.currentUser?.displayName
    val email: String? get() = auth?.currentUser?.email
    val providerIds: List<String> get() = auth?.currentUser?.providerData?.map { it.providerId }.orEmpty()

    suspend fun signOut() {
        auth?.signOut()
        googleClient?.signOut()?.await()
    }
}

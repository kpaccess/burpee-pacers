package com.burpeepacer.app.util

import android.content.Context
import android.net.Uri
import java.io.File

/** Copies a picked photo into the app's own storage, since photo-picker links stop working after the app restarts. */
object PhotoStorage {
    fun copyToAppStorage(context: Context, source: Uri, name: String): Uri? = runCatching {
        val target = File(context.filesDir, "$name-${System.currentTimeMillis()}.jpg")
        context.contentResolver.openInputStream(source)?.use { input ->
            target.outputStream().use { input.copyTo(it) }
        } ?: return null
        // Drop older copies of the same photo.
        context.filesDir.listFiles { f -> f.name.startsWith("$name-") && f != target }?.forEach { it.delete() }
        Uri.fromFile(target)
    }.getOrNull()
}

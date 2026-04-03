package ru.rosdom.data.network

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.flow.map
import kotlinx.coroutines.launch
import okhttp3.HttpUrl.Companion.toHttpUrlOrNull
import ru.rosdom.BuildConfig

private val Context.backendEndpointDataStore by preferencesDataStore(name = "rosdom_backend_endpoint")

class BackendEndpointStore(
    private val context: Context,
) {
    private object Keys {
        val baseUrl = stringPreferencesKey("base_url")
    }

    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private val _baseUrl = MutableStateFlow(BuildConfig.DEFAULT_BACKEND_BASE_URL)

    val baseUrlFlow: StateFlow<String> = _baseUrl.asStateFlow()

    val currentBaseUrl: String
        get() = _baseUrl.value

    init {
        scope.launch {
            context.backendEndpointDataStore.data
                .map { preferences ->
                    normalizeBaseUrl(preferences[Keys.baseUrl]) ?: BuildConfig.DEFAULT_BACKEND_BASE_URL
                }
                .collectLatest { normalized ->
                    _baseUrl.value = normalized
                }
        }
    }

    suspend fun updateBaseUrl(rawValue: String): String {
        val normalized = normalizeBaseUrl(rawValue)
            ?: throw IllegalArgumentException("Проверьте адрес сервера")
        context.backendEndpointDataStore.edit { preferences ->
            preferences[Keys.baseUrl] = normalized
        }
        _baseUrl.value = normalized
        return normalized
    }

    companion object {
        fun normalizeBaseUrl(rawValue: String?): String? {
            val raw = rawValue?.trim().orEmpty()
            val candidate = when {
                raw.isBlank() -> BuildConfig.DEFAULT_BACKEND_BASE_URL
                raw.startsWith("http://", ignoreCase = true) -> raw
                raw.startsWith("https://", ignoreCase = true) -> raw
                else -> "http://$raw"
            }

            val parsed = candidate.toHttpUrlOrNull() ?: return null
            val segments = parsed.pathSegments
                .filter { it.isNotBlank() }
                .toMutableList()

            if (segments.lastOrNull().equals("health", ignoreCase = true)) {
                segments.removeAt(segments.lastIndex)
            }
            if (segments.lastOrNull().equals("v1", ignoreCase = true)) {
                segments.removeAt(segments.lastIndex)
            }

            val normalizedPath = if (segments.isEmpty()) {
                "/"
            } else {
                "/${segments.joinToString("/")}/"
            }

            return parsed.newBuilder()
                .encodedPath(normalizedPath)
                .query(null)
                .fragment(null)
                .build()
                .toString()
        }
    }
}

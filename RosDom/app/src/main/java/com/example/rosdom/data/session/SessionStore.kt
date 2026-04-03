package ru.rosdom.data.session

import android.content.Context
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import com.google.gson.Gson
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.flow.map
import ru.rosdom.domain.model.User

private val Context.sessionDataStore by preferencesDataStore(name = "rosdom_session")

class SessionStore(
    private val context: Context,
    private val gson: Gson,
) {
    private object Keys {
        val accessToken = stringPreferencesKey("access_token")
        val refreshToken = stringPreferencesKey("refresh_token")
        val sessionId = stringPreferencesKey("session_id")
        val expiresAt = stringPreferencesKey("expires_at")
        val currentHomeId = stringPreferencesKey("current_home_id")
        val userJson = stringPreferencesKey("user_json")
    }

    suspend fun read(): AuthSession? {
        val preferences = context.sessionDataStore.data
            .map { pref -> pref }
            .first()

        val accessToken = preferences[Keys.accessToken] ?: return null
        val refreshToken = preferences[Keys.refreshToken] ?: return null
        val sessionId = preferences[Keys.sessionId] ?: return null
        val expiresAt = preferences[Keys.expiresAt] ?: return null
        val userJson = preferences[Keys.userJson] ?: return null
        val user = gson.fromJson(userJson, User::class.java) ?: return null

        return AuthSession(
            accessToken = accessToken,
            refreshToken = refreshToken,
            sessionId = sessionId,
            expiresAt = expiresAt,
            user = user,
            currentHomeId = preferences[Keys.currentHomeId],
        )
    }

    suspend fun write(session: AuthSession) {
        context.sessionDataStore.edit { preferences ->
            preferences[Keys.accessToken] = session.accessToken
            preferences[Keys.refreshToken] = session.refreshToken
            preferences[Keys.sessionId] = session.sessionId
            preferences[Keys.expiresAt] = session.expiresAt
            preferences[Keys.userJson] = gson.toJson(session.user)
            if (session.currentHomeId == null) {
                preferences.remove(Keys.currentHomeId)
            } else {
                preferences[Keys.currentHomeId] = session.currentHomeId
            }
        }
    }

    suspend fun updateCurrentHome(homeId: String?) {
        context.sessionDataStore.edit { preferences ->
            if (homeId == null) {
                preferences.remove(Keys.currentHomeId)
            } else {
                preferences[Keys.currentHomeId] = homeId
            }
        }
    }

    suspend fun clear() {
        context.sessionDataStore.edit { it.clear() }
    }
}

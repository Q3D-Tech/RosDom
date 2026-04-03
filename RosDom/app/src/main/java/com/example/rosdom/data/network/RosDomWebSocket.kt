package ru.rosdom.data.network

import android.util.Log
import com.google.gson.Gson
import io.socket.client.IO
import io.socket.client.Socket
import io.socket.engineio.client.transports.WebSocket
import java.net.URI
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import org.json.JSONObject

data class RealtimeEnvelopeDto(
    val eventId: String? = null,
    val schemaVersion: Int? = null,
    val homeId: String? = null,
    val topic: String = "",
    val offset: Long? = null,
    val occurredAt: String? = null,
    val correlationId: String? = null,
    val data: Map<String, Any?> = emptyMap(),
)

class RosDomWebSocket(
    private val gson: Gson,
    baseUrl: String,
) {
    private val realtimeTopics = listOf(
        "home.state.updated",
        "layout.updated",
        "device.state.changed",
        "device.command.acknowledged",
        "device.command.failed",
        "integration.account.updated",
        "integration.sync.completed",
        "task.updated",
        "reward.balance.updated",
        "security.alert.created",
        "security.alert.resolved",
        "notification.created",
    )

    private var socket: Socket? = null
    private var currentToken: String? = null
    private var currentHomeId: String? = null
    private var currentBaseUrl: String = baseUrl

    private val _events = MutableSharedFlow<RealtimeEnvelopeDto>(extraBufferCapacity = 64)
    val events: SharedFlow<RealtimeEnvelopeDto> = _events.asSharedFlow()

    private val _connectionState = MutableStateFlow(false)
    val connectionState: StateFlow<Boolean> = _connectionState.asStateFlow()

    @Synchronized
    fun updateSession(token: String?, homeId: String?, baseUrl: String) {
        if (token.isNullOrBlank()) {
            disconnect()
            return
        }

        val shouldReconnect = socket == null ||
            token != currentToken ||
            homeId != currentHomeId ||
            baseUrl != currentBaseUrl

        currentToken = token
        currentHomeId = homeId
        currentBaseUrl = baseUrl

        if (shouldReconnect) {
            reconnect()
        }
    }

    @Synchronized
    fun disconnect() {
        socket?.disconnect()
        socket?.off()
        socket = null
        _connectionState.value = false
    }

    @Synchronized
    private fun reconnect() {
        disconnect()
        val token = currentToken ?: return
        val namespaceUri = URI.create(currentBaseUrl.trimEnd('/') + "/v1/realtime")
        val options = IO.Options.builder()
            .setForceNew(true)
            .setReconnection(true)
            .setReconnectionAttempts(Int.MAX_VALUE)
            .setReconnectionDelay(1_000)
            .setReconnectionDelayMax(5_000)
            .setTimeout(20_000)
            .setTransports(arrayOf(WebSocket.NAME))
            .setAuth(mapOf("token" to token))
            .build()

        val createdSocket = IO.socket(namespaceUri, options)
        createdSocket.on(Socket.EVENT_CONNECT) {
            Log.d("RosDomWebSocket", "Realtime connected")
            _connectionState.value = true
            subscribeToHome()
        }
        createdSocket.on(Socket.EVENT_DISCONNECT) { args ->
            Log.d("RosDomWebSocket", "Realtime disconnected: ${args.firstOrNull()}")
            _connectionState.value = false
        }
        createdSocket.on(Socket.EVENT_CONNECT_ERROR) { args ->
            Log.e("RosDomWebSocket", "Realtime connect error: ${args.firstOrNull()}")
            _connectionState.value = false
        }

        realtimeTopics.forEach { topic ->
            createdSocket.on(topic) { args ->
                val rawPayload = args.firstOrNull() ?: return@on
                val json = when (rawPayload) {
                    is JSONObject -> rawPayload.toString()
                    is String -> rawPayload
                    else -> gson.toJson(rawPayload)
                }
                runCatching {
                    gson.fromJson(json, RealtimeEnvelopeDto::class.java)
                }.onSuccess { envelope ->
                    _events.tryEmit(
                        if (envelope.topic.isBlank()) envelope.copy(topic = topic) else envelope,
                    )
                }.onFailure { error ->
                    Log.e("RosDomWebSocket", "Failed to parse realtime payload for $topic", error)
                }
            }
        }

        socket = createdSocket
        createdSocket.connect()
    }

    private fun subscribeToHome() {
        val homeId = currentHomeId ?: return
        socket?.emit("subscribe-home", JSONObject().put("homeId", homeId))
    }
}

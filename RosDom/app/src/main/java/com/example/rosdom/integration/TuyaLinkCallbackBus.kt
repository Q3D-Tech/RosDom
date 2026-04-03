package ru.rosdom.integration

import android.net.Uri
import kotlinx.coroutines.channels.BufferOverflow
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow

data class TuyaLinkCallbackPayload(
    val sessionId: String?,
    val status: String?,
    val message: String?,
)

object TuyaLinkCallbackBus {
    private val _events = MutableSharedFlow<TuyaLinkCallbackPayload>(
        replay = 0,
        extraBufferCapacity = 1,
        onBufferOverflow = BufferOverflow.DROP_OLDEST,
    )

    val events: SharedFlow<TuyaLinkCallbackPayload> = _events

    fun emit(uri: Uri) {
        if (uri.scheme != "ru.rosdom" || uri.host != "integrations") {
            return
        }
        if (uri.path != "/tuya/callback") {
            return
        }
        _events.tryEmit(
            TuyaLinkCallbackPayload(
                sessionId = uri.getQueryParameter("sessionId"),
                status = uri.getQueryParameter("status"),
                message = uri.getQueryParameter("message"),
            ),
        )
    }
}

package ru.rosdom

import android.app.Application
import com.google.gson.Gson
import java.util.concurrent.TimeUnit
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.flow.combine
import kotlinx.coroutines.launch
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import ru.rosdom.data.network.AuthTokenInterceptor
import ru.rosdom.data.network.BackendEndpointStore
import ru.rosdom.data.network.BaseUrlInterceptor
import ru.rosdom.data.network.RosDomApi
import ru.rosdom.data.network.RosDomWebSocket
import ru.rosdom.data.repository.AuthRepository
import ru.rosdom.data.repository.PlatformRepository
import ru.rosdom.data.session.SessionStore
import ru.rosdom.domain.repository.RosDomRepository
import ru.rosdom.domain.session.SessionManager

class RosDomApplication : Application() {
    private val applicationScope = CoroutineScope(SupervisorJob() + Dispatchers.IO)

    val legacyRepository by lazy { RosDomRepository(this) }
    val gson by lazy { Gson() }
    val sessionStore by lazy { SessionStore(this, gson) }
    val backendEndpointStore by lazy { BackendEndpointStore(this) }

    val okHttpClient by lazy {
        OkHttpClient.Builder()
            .connectTimeout(15, TimeUnit.SECONDS)
            .readTimeout(15, TimeUnit.SECONDS)
            .writeTimeout(15, TimeUnit.SECONDS)
            .addInterceptor(BaseUrlInterceptor(backendEndpointStore))
            .addInterceptor(AuthTokenInterceptor())
            .build()
    }

    val api by lazy {
        Retrofit.Builder()
            .baseUrl(BuildConfig.DEFAULT_BACKEND_BASE_URL)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create(gson))
            .build()
            .create(RosDomApi::class.java)
    }

    val realtimeSocket by lazy {
        RosDomWebSocket(
            gson = gson,
            baseUrl = backendEndpointStore.currentBaseUrl,
        )
    }

    val authRepository by lazy { AuthRepository(api) }
    val platformRepository by lazy { PlatformRepository(api) }

    override fun onCreate() {
        super.onCreate()
        SessionManager.initialize(
            sessionStore = sessionStore,
            authRepository = authRepository,
        )
        applicationScope.launch {
            combine(
                SessionManager.accessTokenFlow,
                SessionManager.currentHomeId,
                backendEndpointStore.baseUrlFlow,
            ) { token, homeId, baseUrl -> Triple(token, homeId, baseUrl) }
                .collectLatest { (token, homeId, baseUrl) ->
                    realtimeSocket.updateSession(token, homeId, baseUrl)
                }
        }
    }
}

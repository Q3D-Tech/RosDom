package ru.rosdom.data.network

import okhttp3.HttpUrl
import okhttp3.HttpUrl.Companion.toHttpUrl
import okhttp3.Interceptor
import okhttp3.Response

class BaseUrlInterceptor(
    private val endpointStore: BackendEndpointStore,
) : Interceptor {
    override fun intercept(chain: Interceptor.Chain): Response {
        val targetBaseUrl = endpointStore.currentBaseUrl.toHttpUrl()
        val originalRequest = chain.request()
        val resolvedUrl = rewriteUrl(targetBaseUrl, originalRequest.url)
        return chain.proceed(
            originalRequest.newBuilder()
                .url(resolvedUrl)
                .build(),
        )
    }

    companion object {
        internal fun rewriteUrl(baseUrl: HttpUrl, originalUrl: HttpUrl): HttpUrl {
            val baseSegments = baseUrl.pathSegments.filter { it.isNotBlank() }
            val requestSegments = originalUrl.pathSegments.filter { it.isNotBlank() }
            val mergedPath = (baseSegments + requestSegments).joinToString(separator = "/", prefix = "/")

            return originalUrl.newBuilder()
                .scheme(baseUrl.scheme)
                .host(baseUrl.host)
                .port(baseUrl.port)
                .encodedPath(if (mergedPath == "/") "/" else mergedPath)
                .build()
        }
    }
}

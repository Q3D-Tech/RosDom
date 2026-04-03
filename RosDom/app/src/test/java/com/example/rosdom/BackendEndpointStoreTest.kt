package ru.rosdom

import okhttp3.HttpUrl.Companion.toHttpUrl
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNull
import org.junit.Test
import ru.rosdom.data.network.BackendEndpointStore
import ru.rosdom.data.network.BaseUrlInterceptor

class BackendEndpointStoreTest {
    @Test
    fun `normalize base url adds http and trailing slash`() {
        assertEquals(
            "http://192.168.1.100:4000/",
            BackendEndpointStore.normalizeBaseUrl("192.168.1.100:4000"),
        )
    }

    @Test
    fun `normalize base url keeps configured path prefix`() {
        assertEquals(
            "https://rosdom.example.com/api/",
            BackendEndpointStore.normalizeBaseUrl("https://rosdom.example.com/api"),
        )
    }

    @Test
    fun `normalize base url strips duplicated v1 suffix`() {
        assertEquals(
            "http://192.168.1.100:4000/",
            BackendEndpointStore.normalizeBaseUrl("http://192.168.1.100:4000/v1"),
        )
    }

    @Test
    fun `normalize base url strips copied health endpoint`() {
        assertEquals(
            "https://rosdom.example.com/api/",
            BackendEndpointStore.normalizeBaseUrl("https://rosdom.example.com/api/v1/health"),
        )
    }

    @Test
    fun `normalize base url falls back to default when blank`() {
        assertEquals(
            BuildConfig.DEFAULT_BACKEND_BASE_URL,
            BackendEndpointStore.normalizeBaseUrl(""),
        )
    }

    @Test
    fun `normalize base url rejects malformed input`() {
        assertNull(BackendEndpointStore.normalizeBaseUrl("http://"))
    }

    @Test
    fun `rewrite url applies host port and path prefix`() {
        val rewritten = BaseUrlInterceptor.rewriteUrl(
            baseUrl = "https://rosdom.example.com/api/".toHttpUrl(),
            originalUrl = "http://placeholder.invalid/v1/auth/login?x=1".toHttpUrl(),
        )

        assertEquals(
            "https://rosdom.example.com/api/v1/auth/login?x=1",
            rewritten.toString(),
        )
    }
}

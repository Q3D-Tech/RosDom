package ru.rosdom.domain.repository

import android.content.Context
import com.google.gson.Gson
import com.google.gson.reflect.TypeToken
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import ru.rosdom.domain.model.Device
import ru.rosdom.domain.model.DeviceStatus
import java.io.File

class RosDomRepository(private val context: Context) {
    private val gson = Gson()
    private val dbFile = File(context.filesDir, "rosdom_devices.json")

    private val _devicesFlow = MutableStateFlow<List<Device>>(emptyList())

    init {
        loadFromDisk()
    }

    fun getAllDevices(): Flow<List<Device>> = _devicesFlow.asStateFlow()

    fun addDevice(device: Device) {
        _devicesFlow.update { it + device }
        saveToDisk()
    }

    fun toggleDeviceStatus(deviceId: String, newStatus: DeviceStatus) {
        _devicesFlow.update { list ->
            list.map { if (it.id == deviceId) it.copy(status = newStatus) else it }
        }
        saveToDisk()
    }

    private fun loadFromDisk() {
        if (!dbFile.exists()) {
            // Seed with initial mockup devices
            val seed = listOf(
                Device(id = "1", name = "Свет в\nгостиной", status = DeviceStatus.ONLINE, capabilities = listOf(ru.rosdom.domain.model.Capability.Brightness(80)), roomId = "living"),
                Device(id = "2", name = "Кондиционер", status = DeviceStatus.ONLINE, capabilities = listOf(ru.rosdom.domain.model.Capability.Temperature(22f)), roomId = "living"),
                Device(id = "3", name = "Декоративная\nлента", status = DeviceStatus.OFFLINE, capabilities = listOf(ru.rosdom.domain.model.Capability.Brightness(50)), roomId = "bedroom")
            )
            _devicesFlow.value = seed
            saveToDisk()
            return
        }

        try {
            val json = dbFile.readText()
            val type = object : TypeToken<List<Device>>() {}.type
            val devices: List<Device> = gson.fromJson(json, type)
            _devicesFlow.value = devices
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun saveToDisk() {
        try {
            val json = gson.toJson(_devicesFlow.value)
            dbFile.writeText(json)
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }
}

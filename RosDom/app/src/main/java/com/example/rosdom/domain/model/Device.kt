package ru.rosdom.domain.model

sealed class Capability {
    data class Power(val isOn: Boolean) : Capability()
    data class Brightness(val level: Int, val min: Int = 0, val max: Int = 100) : Capability()
    data class ColorTemperature(val temperatureK: Int, val minK: Int = 2700, val maxK: Int = 6500) : Capability()
    data class Rgb(val hexColor: String) : Capability()
    data class Motion(val isDetected: Boolean) : Capability()
    data class Contact(val isOpen: Boolean) : Capability()
    data class Lock(val isLocked: Boolean) : Capability()
    data class Temperature(val celsius: Float) : Capability()
    data class Humidity(val percentage: Float) : Capability()
}

enum class DeviceStatus {
    ONLINE, OFFLINE, ERROR, PENDING
}

data class Device(
    val id: String,
    val name: String,
    val roomId: String,
    val status: DeviceStatus,
    val capabilities: List<Capability>
)

package ru.rosdom.data.local.entity

import androidx.room.Entity
import androidx.room.PrimaryKey

@Entity(tableName = "devices")
data class DeviceEntity(
    @PrimaryKey val id: String,
    val name: String,
    val roomId: String,
    val status: String,
    val type: String,
    val value: Float? = null // Generic slider value representation
)

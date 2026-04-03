package ru.rosdom.data.local.dao

import androidx.room.*
import kotlinx.coroutines.flow.Flow
import ru.rosdom.data.local.entity.DeviceEntity
import ru.rosdom.data.local.entity.UserEntity

@Dao
interface RosDomDao {
    @Query("SELECT * FROM users WHERE id = :userId")
    fun getUserFlow(userId: String): Flow<UserEntity?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertUser(user: UserEntity)

    @Query("SELECT * FROM devices")
    fun getAllDevicesFlow(): Flow<List<DeviceEntity>>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertDevice(device: DeviceEntity)

    @Query("UPDATE devices SET status = :status WHERE id = :deviceId")
    suspend fun updateDeviceStatus(deviceId: String, status: String)
}

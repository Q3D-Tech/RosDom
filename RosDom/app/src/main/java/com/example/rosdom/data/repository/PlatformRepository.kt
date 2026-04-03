package ru.rosdom.data.repository

import ru.rosdom.data.network.ApiDevice
import ru.rosdom.data.network.ApiEvent
import ru.rosdom.data.network.ApiFamilyInvite
import ru.rosdom.data.network.ApiFamilyMember
import ru.rosdom.data.network.ApiFloor
import ru.rosdom.data.network.ApiHome
import ru.rosdom.data.network.ApiLayout
import ru.rosdom.data.network.ApiHomeSnapshot
import ru.rosdom.data.network.ApiIntegrationAccount
import ru.rosdom.data.network.ApiDeviceDetailsEnvelope
import ru.rosdom.data.network.ApiLayoutItem
import ru.rosdom.data.network.ApiNotification
import ru.rosdom.data.network.ApiRewardLedgerEntry
import ru.rosdom.data.network.ApiTask
import ru.rosdom.data.network.ApiTuyaLinkSession
import ru.rosdom.data.network.ConnectTuyaIntegrationRequest
import ru.rosdom.data.network.CreateTuyaLinkSessionRequest
import ru.rosdom.data.network.CreateFloorRequest
import ru.rosdom.data.network.CreateRoomRequest
import ru.rosdom.data.network.CreateFamilyRequest
import ru.rosdom.data.network.CreateFamilyInviteRequest
import ru.rosdom.data.network.CreateHomeRequest
import ru.rosdom.data.network.JoinFamilyRequest
import ru.rosdom.data.network.PutLayoutBlockRequest
import ru.rosdom.data.network.PutLayoutItemRequest
import ru.rosdom.data.network.PutLayoutRequest
import ru.rosdom.data.network.RosDomApi
import ru.rosdom.data.network.SubmitDeviceCommandRequest
import ru.rosdom.data.network.SubmitTaskRequest
import ru.rosdom.data.network.SyncIntegrationRequest
import ru.rosdom.data.network.UpdateDevicePlacementRequest
import ru.rosdom.data.network.UpdateHomeStateRequest
import ru.rosdom.data.network.UpdateFloorRequest
import ru.rosdom.data.network.UpdateRoomRequest
import ru.rosdom.data.network.UpdateUserPreferencesRequest
import ru.rosdom.domain.model.Capability
import ru.rosdom.domain.model.Device
import ru.rosdom.domain.model.DeviceStatus
import ru.rosdom.domain.model.Floor
import ru.rosdom.domain.model.FurnitureType
import ru.rosdom.domain.model.KidTask
import ru.rosdom.domain.model.Reward
import ru.rosdom.domain.model.RewardType
import ru.rosdom.domain.model.Room
import ru.rosdom.domain.model.RoomElement
import ru.rosdom.domain.model.RoomLayoutBlock
import ru.rosdom.domain.model.TaskStatus
import java.util.UUID

data class BootstrapState(
    val family: ru.rosdom.data.network.ApiFamily?,
    val homes: List<ApiHome>,
)

class PlatformRepository(
    private val api: RosDomApi,
) {
    suspend fun getBootstrapState(): BootstrapState {
        return BootstrapState(
            family = api.getCurrentFamily().data,
            homes = api.getHomes().data,
        )
    }

    suspend fun getCurrentFamily(): ru.rosdom.data.network.ApiFamily? =
        api.getCurrentFamily().data

    suspend fun createFamily(title: String) =
        api.createFamily(CreateFamilyRequest(title)).data

    suspend fun getFamilyMembers(): List<ApiFamilyMember> =
        api.getFamilyMembers().data

    suspend fun createFamilyInvite(
        targetAccountMode: String,
        expiresInHours: Int = 24,
    ): ApiFamilyInvite = api.createFamilyInvite(
        CreateFamilyInviteRequest(
            targetAccountMode = targetAccountMode,
            expiresInHours = expiresInHours,
        ),
    ).data

    suspend fun joinFamily(code: String) =
        api.joinFamily(JoinFamilyRequest(code)).data

    suspend fun createHome(title: String, addressLabel: String, timezone: String) =
        api.createHome(CreateHomeRequest(title, addressLabel, timezone)).data

    suspend fun getHomes(): List<ApiHome> = api.getHomes().data

    suspend fun updateHomeState(homeId: String, currentMode: String? = null, securityMode: String? = null) =
        api.updateHomeState(homeId, UpdateHomeStateRequest(currentMode = currentMode, securityMode = securityMode)).data

    suspend fun getFloors(homeId: String): List<ApiFloor> = api.getFloors(homeId).data

    suspend fun createFloor(homeId: String, title: String, sortOrder: Int? = null): ApiFloor =
        api.createFloor(homeId, CreateFloorRequest(title = title, sortOrder = sortOrder)).data

    suspend fun updateFloor(floorId: String, title: String? = null, sortOrder: Int? = null): ApiFloor =
        api.updateFloor(floorId, UpdateFloorRequest(title = title, sortOrder = sortOrder)).data

    suspend fun getUserPreferences() = api.getUserPreferences().data

    suspend fun updateUserPreferences(
        favoriteDeviceIds: List<String>? = null,
        allowedDeviceIds: List<String>? = null,
        pinnedSections: List<String>? = null,
        preferredHomeTab: String? = null,
        uiDensity: String? = null,
        themeMode: String? = null,
        motionMode: String? = null,
        activeFloorId: String? = null,
    ) = api.updateUserPreferences(
        UpdateUserPreferencesRequest(
            favoriteDeviceIds = favoriteDeviceIds,
            allowedDeviceIds = allowedDeviceIds,
            pinnedSections = pinnedSections,
            preferredHomeTab = preferredHomeTab,
            uiDensity = uiDensity,
            themeMode = themeMode,
            motionMode = motionMode,
            activeFloorId = activeFloorId,
        ),
    ).data

    suspend fun createRoom(homeId: String, floorId: String?, title: String, type: String, sortOrder: Int?): ru.rosdom.data.network.ApiRoom =
        api.createRoom(homeId, CreateRoomRequest(floorId = floorId, title = title, type = type, sortOrder = sortOrder)).data

    suspend fun updateRoom(roomId: String, floorId: String?, title: String, type: String, sortOrder: Int?): ru.rosdom.data.network.ApiRoom =
        api.updateRoom(roomId, UpdateRoomRequest(floorId = floorId, title = title, type = type, sortOrder = sortOrder)).data

    suspend fun getLayout(homeId: String, floorId: String? = null): ApiLayout =
        api.getLayout(homeId, floorId).data

    suspend fun saveLayout(homeId: String, revision: Int, rooms: List<Room>): ApiLayout {
        val blocks = rooms.flatMap { room ->
            room.layoutBlocks.map { block ->
                PutLayoutBlockRequest(
                    roomId = room.id,
                    x = block.gridX,
                    y = block.gridY,
                    width = block.width,
                    height = block.height,
                    zIndex = block.zIndex,
                )
            }
        }
        val items = rooms.flatMap { room ->
            room.elements.mapNotNull { element ->
                when (element) {
                    is RoomElement.Furniture -> PutLayoutItemRequest(
                        id = element.id.takeUnless { it.startsWith("temp-") },
                        floorId = room.floorId,
                        roomId = room.id,
                        kind = "furniture",
                        subtype = element.type.name.lowercase(),
                        title = element.title ?: room.name,
                        x = element.gridX,
                        y = element.gridY,
                        width = element.width,
                        height = element.height,
                    )

                    is RoomElement.Door -> PutLayoutItemRequest(
                        id = element.id.takeUnless { it.startsWith("temp-") },
                        floorId = room.floorId,
                        roomId = room.id,
                        kind = "door",
                        subtype = if (element.isHorizontal) "door_horizontal" else "door_vertical",
                        title = element.title,
                        x = element.gridX,
                        y = element.gridY,
                        width = element.width,
                        height = element.height,
                    )

                    is RoomElement.Window -> PutLayoutItemRequest(
                        id = element.id.takeUnless { it.startsWith("temp-") },
                        floorId = room.floorId,
                        roomId = room.id,
                        kind = "window",
                        subtype = if (element.isHorizontal) "window_horizontal" else "window_vertical",
                        title = element.title,
                        x = element.gridX,
                        y = element.gridY,
                        width = element.width,
                        height = element.height,
                    )

                    is RoomElement.DeviceMarker -> PutLayoutItemRequest(
                        id = element.id.takeUnless { it.startsWith("temp-") },
                        floorId = room.floorId,
                        roomId = room.id,
                        kind = "device",
                        subtype = "device_marker",
                        title = element.title ?: "Устройство",
                        x = element.gridX,
                        y = element.gridY,
                        width = element.width,
                        height = element.height,
                        metadata = element.deviceId?.let { mapOf("deviceId" to it) }.orEmpty(),
                    )

                    is RoomElement.TaskMarker -> PutLayoutItemRequest(
                        id = element.id.takeUnless { it.startsWith("temp-") },
                        floorId = room.floorId,
                        roomId = room.id,
                        kind = "task",
                        subtype = "task_marker",
                        title = element.title ?: "Задание",
                        x = element.gridX,
                        y = element.gridY,
                        width = element.width,
                        height = element.height,
                        metadata = element.taskId?.let { mapOf("taskId" to it) }.orEmpty(),
                    )
                }
            }
        }
        return api.putLayout(homeId, PutLayoutRequest(revision = revision, blocks = blocks, items = items)).data
    }

    suspend fun validateLayout(homeId: String, revision: Int, rooms: List<Room>): Boolean {
        val blocks = rooms.flatMap { room ->
            room.layoutBlocks.map { block ->
                PutLayoutBlockRequest(
                    roomId = room.id,
                    x = block.gridX,
                    y = block.gridY,
                    width = block.width,
                    height = block.height,
                    zIndex = block.zIndex,
                )
            }
        }
        val items = rooms.flatMap { room ->
            room.elements.map { element ->
                PutLayoutItemRequest(
                    id = element.id.takeUnless { it.startsWith("temp-") },
                    floorId = room.floorId,
                    roomId = room.id,
                    kind = when (element) {
                        is RoomElement.Furniture -> "furniture"
                        is RoomElement.Door -> "door"
                        is RoomElement.Window -> "window"
                        is RoomElement.DeviceMarker -> "device"
                        is RoomElement.TaskMarker -> "task"
                    },
                    subtype = when (element) {
                        is RoomElement.Furniture -> element.type.name.lowercase()
                        is RoomElement.Door -> if (element.isHorizontal) "door_horizontal" else "door_vertical"
                        is RoomElement.Window -> if (element.isHorizontal) "window_horizontal" else "window_vertical"
                        is RoomElement.DeviceMarker -> "device_marker"
                        is RoomElement.TaskMarker -> "task_marker"
                    },
                    title = element.title,
                    x = element.gridX,
                    y = element.gridY,
                    width = element.width,
                    height = element.height,
                )
            }
        }
        return api.validateLayout(homeId, PutLayoutRequest(revision = revision, blocks = blocks, items = items)).data["valid"] == true
    }

    suspend fun getSnapshot(homeId: String): ApiHomeSnapshot =
        api.getSnapshot(homeId).data

    suspend fun getDevices(homeId: String): List<ApiDevice> =
        api.getDevices(homeId).data

    suspend fun getDeviceDetails(deviceId: String): ApiDeviceDetailsEnvelope =
        api.getDevice(deviceId).data

    suspend fun updateDevicePlacement(
        deviceId: String,
        roomId: String,
        floorId: String? = null,
        markerX: Int? = null,
        markerY: Int? = null,
        markerTitle: String? = null,
    ): ApiDeviceDetailsEnvelope = api.updateDevicePlacement(
        deviceId = deviceId,
        request = UpdateDevicePlacementRequest(
            roomId = roomId,
            floorId = floorId,
            markerX = markerX,
            markerY = markerY,
            markerTitle = markerTitle,
        ),
    ).data

    suspend fun getEvents(homeId: String, afterOffset: Int = 0): List<ApiEvent> =
        api.getEvents(homeId, afterOffset).data

    suspend fun getNotifications(homeId: String): List<ApiNotification> =
        api.getNotifications(homeId).data

    suspend fun markNotificationRead(homeId: String, notificationId: String): ApiNotification =
        api.markNotificationRead(notificationId, homeId).data

    suspend fun getIntegrations(homeId: String): List<ApiIntegrationAccount> =
        api.getIntegrations(homeId).data

    suspend fun connectTuya(
        homeId: String,
        accountLabel: String,
        region: String,
        loginIdentifier: String? = null,
        password: String? = null,
        countryCode: String? = null,
        appSchema: String? = null,
    ): ApiIntegrationAccount =
        api.connectTuyaIntegration(
            ConnectTuyaIntegrationRequest(
                homeId = homeId,
                accountLabel = accountLabel,
                region = region,
                loginIdentifier = loginIdentifier,
                password = password,
                countryCode = countryCode,
                appSchema = appSchema,
            ),
        ).data

    suspend fun createTuyaLinkSession(
        homeId: String,
        accountLabel: String,
        region: String,
    ): ApiTuyaLinkSession = api.createTuyaLinkSession(
        CreateTuyaLinkSessionRequest(
            homeId = homeId,
            accountLabel = accountLabel,
            region = region,
        ),
    ).data

    suspend fun getTuyaLinkSession(sessionId: String): ApiTuyaLinkSession? =
        api.getTuyaLinkSession(sessionId).data

    suspend fun syncTuya(homeId: String) =
        api.syncTuyaIntegration(SyncIntegrationRequest(homeId)).data

    suspend fun getTasks(homeId: String): List<ApiTask> =
        api.getTasks(homeId).data

    suspend fun getRewardBalance(homeId: String): Int =
        api.getRewardBalance(homeId).data.balance

    suspend fun getRewardLedger(homeId: String): List<ApiRewardLedgerEntry> =
        api.getRewardLedger(homeId).data

    suspend fun submitTask(taskId: String): ApiTask =
        api.submitTask(taskId, SubmitTaskRequest()).data

    suspend fun sendCommand(deviceId: String, capability: Capability) {
        val request = when (capability) {
            is Capability.Power -> SubmitDeviceCommandRequest("power", capability.isOn)
            is Capability.Brightness -> SubmitDeviceCommandRequest("brightness", capability.level)
            is Capability.ColorTemperature -> SubmitDeviceCommandRequest("colorTemperature", capability.temperatureK)
            is Capability.Rgb -> SubmitDeviceCommandRequest("rgb", capability.hexColor)
            is Capability.Motion -> SubmitDeviceCommandRequest("motion", capability.isDetected)
            is Capability.Contact -> SubmitDeviceCommandRequest("contact", capability.isOpen)
            is Capability.Lock -> SubmitDeviceCommandRequest("lock", capability.isLocked)
            is Capability.Temperature -> SubmitDeviceCommandRequest("temperature", capability.celsius)
            is Capability.Humidity -> SubmitDeviceCommandRequest("humidity", capability.percentage)
        }
        api.submitDeviceCommand(
            deviceId = deviceId,
            idempotencyKey = UUID.randomUUID().toString(),
            request = request,
        )
    }

    fun mapRooms(snapshot: ApiHomeSnapshot): List<Room> {
        return safeList(snapshot.rooms).map { room ->
            val blocks = safeList(snapshot.layoutBlocks)
                .filter { it.roomId == room.id }
                .map { block ->
                    RoomLayoutBlock(
                        id = block.id,
                        roomId = block.roomId,
                        gridX = block.x,
                        gridY = block.y,
                        width = block.width,
                        height = block.height,
                        zIndex = block.zIndex,
                    )
                }
            val elements = safeList(snapshot.layoutItems)
                .filter { it.roomId == room.id }
                .mapNotNull(::mapLayoutItem)

            Room(
                id = room.id,
                floorId = room.floorId,
                name = room.title,
                roomType = room.type,
                layoutBlocks = blocks,
                elements = elements,
            )
        }
    }

    fun mapDevices(snapshot: ApiHomeSnapshot): List<Device> {
        val statesByDevice = safeList(snapshot.latestStates).associateBy { it.deviceId }
        return safeList(snapshot.devices).map { device ->
            val state = statesByDevice[device.id]
            Device(
                id = device.id,
                name = device.name,
                roomId = device.roomId,
                status = device.toDeviceStatus(),
                capabilities = mapCapabilities(state?.values.orEmpty()),
            )
        }
    }

    fun mapTasks(tasks: List<ApiTask>): List<KidTask> {
        return tasks.map { task ->
            KidTask(
                id = task.id,
                title = task.title,
                description = task.description,
                floorId = task.floorId,
                roomId = task.roomId,
                targetGridX = task.targetX,
                targetGridY = task.targetY,
                reward = Reward(
                    type = when (task.rewardType) {
                        "money" -> RewardType.MONEY
                        "time" -> RewardType.TIME
                        else -> RewardType.EVENT
                    },
                    amount = task.rewardValue,
                    description = task.rewardDescription,
                ),
                status = when (task.status) {
                    "submitted" -> TaskStatus.DONE
                    "approved" -> TaskStatus.VERIFIED
                    "rejected" -> TaskStatus.PENDING
                    else -> TaskStatus.PENDING
                },
                assigneeId = task.assigneeUserId,
            )
        }
    }

    private fun mapLayoutItem(item: ApiLayoutItem): RoomElement? {
        return when (item.kind) {
            "furniture" -> RoomElement.Furniture(
                id = item.id,
                gridX = item.x,
                gridY = item.y,
                width = item.width,
                height = item.height,
                type = when (item.subtype.lowercase()) {
                    "bed" -> FurnitureType.BED
                    "table" -> FurnitureType.TABLE
                    "bath", "bathtub" -> FurnitureType.BATH
                    "sofa" -> FurnitureType.SOFA
                    else -> FurnitureType.WARDROBE
                },
            )

            "door" -> RoomElement.Door(
                id = item.id,
                gridX = item.x,
                gridY = item.y,
                width = item.width,
                height = item.height,
                isHorizontal = item.width >= item.height,
            )

            "window" -> RoomElement.Window(
                id = item.id,
                gridX = item.x,
                gridY = item.y,
                width = item.width,
                height = item.height,
                isHorizontal = item.width >= item.height,
                title = item.title,
            )

            "device" -> RoomElement.DeviceMarker(
                id = item.id,
                gridX = item.x,
                gridY = item.y,
                width = item.width,
                height = item.height,
                deviceId = item.metadata["deviceId"] as? String,
                title = item.title,
            )

            "task" -> RoomElement.TaskMarker(
                id = item.id,
                gridX = item.x,
                gridY = item.y,
                width = item.width,
                height = item.height,
                taskId = item.metadata["taskId"] as? String,
                title = item.title,
            )

            else -> null
        }
    }

    private fun ApiDevice.toDeviceStatus(): DeviceStatus {
        return when (availabilityStatus) {
            "online" -> DeviceStatus.ONLINE
            "degraded" -> DeviceStatus.PENDING
            "offline" -> DeviceStatus.OFFLINE
            else -> DeviceStatus.ERROR
        }
    }

    fun mapFloors(snapshot: ApiHomeSnapshot): List<Floor> =
        safeList(snapshot.floors).sortedBy { it.sortOrder }.map { floor ->
            Floor(
                id = floor.id,
                title = floor.title,
                sortOrder = floor.sortOrder,
            )
        }

    private fun mapCapabilities(values: Map<String, Any?>): List<Capability> {
        val items = mutableListOf<Capability>()
        values["power"]?.let { value ->
            if (value is Boolean) {
                items += Capability.Power(value)
            }
        }
        values["brightness"]?.let { value ->
            val level = (value as? Number)?.toInt()
            if (level != null) {
                items += Capability.Brightness(level)
            }
        }
        values["colorTemperature"]?.let { value ->
            val temperature = (value as? Number)?.toInt()
            if (temperature != null) {
                items += Capability.ColorTemperature(temperature)
            }
        }
        values["temperature"]?.let { value ->
            val temperature = (value as? Number)?.toFloat()
            if (temperature != null) {
                items += Capability.Temperature(temperature)
            }
        }
        values["humidity"]?.let { value ->
            val humidity = (value as? Number)?.toFloat()
            if (humidity != null) {
                items += Capability.Humidity(humidity)
            }
        }
        values["motion"]?.let { value ->
            if (value is Boolean) {
                items += Capability.Motion(value)
            }
        }
        values["contact"]?.let { value ->
            if (value is Boolean) {
                items += Capability.Contact(value)
            }
        }
        values["lock"]?.let { value ->
            if (value is Boolean) {
                items += Capability.Lock(value)
            }
        }
        values["rgb"]?.let { value ->
            if (value is String) {
                items += Capability.Rgb(value)
            }
        }
        return items
    }
}

private fun <T> safeList(value: List<T>?): List<T> = value ?: emptyList()

package ru.rosdom.domain.model

data class Room(
    val id: String,
    val floorId: String? = null,
    val name: String,
    val roomType: String = "room",
    val layoutBlocks: List<RoomLayoutBlock>,
    val elements: List<RoomElement> = emptyList()
)

/**
 * Floor plan is built strictly with blocks. 
 * A compound room can be built with multiple contiguous blocks.
 */
data class RoomLayoutBlock(
    val id: String,
    val roomId: String,
    val gridX: Int,
    val gridY: Int,
    val width: Int,  // in grid units
    val height: Int,  // in grid units
    val zIndex: Int = 0,
)

enum class FurnitureType {
    BED, TABLE, BATH, SOFA, WARDROBE
}

sealed class RoomElement {
    abstract val id: String
    abstract val gridX: Int
    abstract val gridY: Int
    abstract val width: Int
    abstract val height: Int
    abstract val title: String?

    data class Furniture(
        override val id: String,
        override val gridX: Int,
        override val gridY: Int,
        override val width: Int,
        override val height: Int,
        val type: FurnitureType,
        override val title: String? = null,
    ) : RoomElement()

    data class Door(
        override val id: String,
        override val gridX: Int,
        override val gridY: Int,
        override val width: Int,
        override val height: Int,
        val isHorizontal: Boolean,
        override val title: String? = null,
    ) : RoomElement()

    data class Window(
        override val id: String,
        override val gridX: Int,
        override val gridY: Int,
        override val width: Int,
        override val height: Int,
        val isHorizontal: Boolean,
        override val title: String? = null,
    ) : RoomElement()

    data class DeviceMarker(
        override val id: String,
        override val gridX: Int,
        override val gridY: Int,
        override val width: Int,
        override val height: Int,
        val deviceId: String? = null,
        override val title: String? = null,
    ) : RoomElement()

    data class TaskMarker(
        override val id: String,
        override val gridX: Int,
        override val gridY: Int,
        override val width: Int,
        override val height: Int,
        val taskId: String? = null,
        override val title: String? = null,
    ) : RoomElement()
}

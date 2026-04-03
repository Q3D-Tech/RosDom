package ru.rosdom.domain.model

enum class TaskStatus { PENDING, DONE, VERIFIED }
enum class RewardType { MONEY, TIME, EVENT }

data class Reward(
    val type: RewardType, 
    val amount: Int, 
    val description: String
)

data class KidTask(
    val id: String,
    val title: String,
    val description: String,
    val floorId: String? = null,
    val roomId: String?,
    val targetGridX: Int?,
    val targetGridY: Int?,
    val reward: Reward,
    val status: TaskStatus = TaskStatus.PENDING,
    val assigneeId: String
)

package ru.rosdom.ui.screens.rooms

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.ViewModelProvider.AndroidViewModelFactory.Companion.APPLICATION_KEY
import androidx.lifecycle.viewModelScope
import androidx.lifecycle.viewmodel.CreationExtras
import java.util.UUID
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import ru.rosdom.RosDomApplication
import ru.rosdom.data.network.RosDomWebSocket
import ru.rosdom.data.repository.PlatformRepository
import ru.rosdom.domain.model.FurnitureType
import ru.rosdom.domain.model.LayoutEditorTool
import ru.rosdom.domain.model.Room
import ru.rosdom.domain.model.RoomElement
import ru.rosdom.domain.model.RoomLayoutBlock
import ru.rosdom.domain.session.SessionManager
import ru.rosdom.ui.state.RoomsUiState

private const val TEMP_ROOM_PREFIX = "temp-room-"
private const val TEMP_ITEM_PREFIX = "temp-item-"
private const val TEMP_BLOCK_PREFIX = "temp-block-"

private data class LayoutDraftSnapshot(val rooms: List<Room>, val revision: Int)
private data class SelectionState(val roomId: String? = null, val blockId: String? = null, val elementId: String? = null)

class RoomsViewModel(
    private val platformRepository: PlatformRepository,
    private val realtimeSocket: RosDomWebSocket,
) : ViewModel() {
    private val _uiState = MutableStateFlow(RoomsUiState(isLoading = true))
    val uiState: StateFlow<RoomsUiState> = _uiState.asStateFlow()

    private var persistedSnapshot = LayoutDraftSnapshot(emptyList(), 0)
    private val undoStack = ArrayDeque<LayoutDraftSnapshot>()
    private val redoStack = ArrayDeque<LayoutDraftSnapshot>()

    init {
        observeRealtime()
        loadRooms()
    }

    private fun observeRealtime() {
        viewModelScope.launch {
            realtimeSocket.events.collect { event ->
                if (event.homeId == SessionManager.currentHomeId.value && !_uiState.value.hasUnsavedChanges) {
                    when (event.topic) {
                        "layout.updated",
                        "task.updated",
                        "device.state.changed",
                        "home.state.updated" -> loadRooms()
                    }
                }
            }
        }
    }

    fun loadRooms() {
        viewModelScope.launch {
            val homeId = SessionManager.currentHomeId.value
            if (homeId == null) {
                setBlockingError("Сначала создайте дом.")
                return@launch
            }
            _uiState.update { it.copy(isLoading = true, error = null, inlineValidation = null, statusMessage = null) }
            try {
                val snapshot = platformRepository.getSnapshot(homeId)
                val rooms = platformRepository.mapRooms(snapshot)
                val floors = platformRepository.mapFloors(snapshot)
                val activeFloorId = _uiState.value.activeFloorId ?: snapshot.preferences.activeFloorId ?: floors.firstOrNull()?.id
                persistedSnapshot = LayoutDraftSnapshot(rooms, snapshot.home.layoutRevision)
                undoStack.clear()
                redoStack.clear()
                val selection = resolveSelection(
                    rooms = rooms,
                    activeFloorId = activeFloorId,
                    selectedRoomId = _uiState.value.selectedRoomId,
                    selectedBlockId = _uiState.value.selectedBlockId,
                    selectedElementId = _uiState.value.selectedElementId,
                )
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        floors = floors,
                        activeFloorId = activeFloorId,
                        rooms = rooms,
                        layoutRevision = snapshot.home.layoutRevision,
                        selectedRoomId = selection.roomId,
                        selectedBlockId = selection.blockId,
                        selectedElementId = selection.elementId,
                        isEditMode = false,
                        activeTool = LayoutEditorTool.SELECT,
                        hasUnsavedChanges = false,
                        canUndo = false,
                        canRedo = false,
                        error = null,
                        inlineValidation = null,
                        statusMessage = null,
                    )
                }
            } catch (error: Exception) {
                setBlockingError(error.message ?: "Не удалось загрузить планировку.")
            }
        }
    }

    fun setActiveFloor(floorId: String?) {
        val selection = resolveSelection(
            rooms = _uiState.value.rooms,
            activeFloorId = floorId,
            selectedRoomId = _uiState.value.selectedRoomId,
            selectedBlockId = _uiState.value.selectedBlockId,
            selectedElementId = _uiState.value.selectedElementId,
        )
        _uiState.update {
            it.copy(
                activeFloorId = floorId,
                selectedRoomId = selection.roomId,
                selectedBlockId = selection.blockId,
                selectedElementId = selection.elementId,
                inlineValidation = null,
                statusMessage = if (floorId == null) "Показываем все этажи." else "Активный этаж переключён.",
            )
        }
        viewModelScope.launch {
            runCatching {
                platformRepository.updateUserPreferences(activeFloorId = floorId)
            }
        }
    }

    fun selectTool(tool: LayoutEditorTool) {
        _uiState.update { it.copy(activeTool = tool, inlineValidation = null, statusMessage = toolHint(tool)) }
    }

    fun selectGridPosition(gridX: Int, gridY: Int) {
        when (_uiState.value.activeTool) {
            LayoutEditorTool.SELECT,
            LayoutEditorTool.RESIZE -> selectAt(gridX, gridY)
            LayoutEditorTool.DELETE -> deleteAt(gridX, gridY)
            LayoutEditorTool.ADD_ROOM -> addRoomAt(gridX, gridY)
            LayoutEditorTool.ADD_ROOM_BLOCK -> addRoomBlockAt(gridX, gridY)
            LayoutEditorTool.ADD_FURNITURE -> addElementAt(
                gridX,
                gridY,
                RoomElement.Furniture(nextTempItemId(), gridX, gridY, 2, 2, FurnitureType.TABLE, "Стол"),
            )
            LayoutEditorTool.ADD_DOOR -> addOpeningAt(gridX, gridY, true)
            LayoutEditorTool.ADD_WINDOW -> addOpeningAt(gridX, gridY, false)
            LayoutEditorTool.ADD_DEVICE_MARKER -> addElementAt(
                gridX,
                gridY,
                RoomElement.DeviceMarker(nextTempItemId(), gridX, gridY, 1, 1, title = "Устройство"),
            )
            LayoutEditorTool.ADD_TASK_MARKER -> addElementAt(
                gridX,
                gridY,
                RoomElement.TaskMarker(nextTempItemId(), gridX, gridY, 1, 1, title = "Задание"),
            )
        }
    }

    fun moveSelection(deltaGridX: Int, deltaGridY: Int) {
        if (deltaGridX == 0 && deltaGridY == 0) return
        mutateRooms { rooms ->
            when {
                _uiState.value.selectedElementId != null -> rooms.map { room ->
                    room.copy(elements = room.elements.map { element ->
                        if (element.id == _uiState.value.selectedElementId) {
                            element.moveBy(deltaGridX, deltaGridY)
                        } else {
                            element
                        }
                    })
                }

                _uiState.value.selectedBlockId != null -> rooms.map { room ->
                    room.copy(layoutBlocks = room.layoutBlocks.map { block ->
                        if (block.id == _uiState.value.selectedBlockId) {
                            block.copy(gridX = block.gridX + deltaGridX, gridY = block.gridY + deltaGridY)
                        } else {
                            block
                        }
                    })
                }

                _uiState.value.selectedRoomId != null -> rooms.map { room ->
                    if (room.id == _uiState.value.selectedRoomId) {
                        room.copy(
                            layoutBlocks = room.layoutBlocks.map { it.copy(gridX = it.gridX + deltaGridX, gridY = it.gridY + deltaGridY) },
                            elements = room.elements.map { it.moveBy(deltaGridX, deltaGridY) },
                        )
                    } else {
                        room
                    }
                }

                else -> {
                    setInlineValidation("Сначала выберите комнату, блок или элемент.")
                    rooms
                }
            }
        }
    }

    fun resizeSelection(deltaGridX: Int, deltaGridY: Int) {
        if (deltaGridX == 0 && deltaGridY == 0) return
        mutateRooms { rooms ->
            when {
                _uiState.value.selectedElementId != null -> rooms.map { room ->
                    room.copy(elements = room.elements.map { element ->
                        if (element.id == _uiState.value.selectedElementId) {
                            element.resizeBy(deltaGridX, deltaGridY)
                        } else {
                            element
                        }
                    })
                }

                _uiState.value.selectedBlockId != null -> rooms.map { room ->
                    room.copy(layoutBlocks = room.layoutBlocks.map { block ->
                        if (block.id == _uiState.value.selectedBlockId) {
                            block.copy(
                                width = (block.width + deltaGridX).coerceAtLeast(1),
                                height = (block.height + deltaGridY).coerceAtLeast(1),
                            )
                        } else {
                            block
                        }
                    })
                }

                else -> {
                    setInlineValidation("Сначала выделите блок или элемент, который нужно изменить.")
                    rooms
                }
            }
        }
    }

    fun renameSelectedRoom(name: String) {
        val roomId = _uiState.value.selectedRoomId ?: return
        mutateRooms { rooms -> rooms.map { room -> if (room.id == roomId) room.copy(name = name) else room } }
    }

    fun toggleEditMode() {
        _uiState.update {
            val next = !it.isEditMode
            it.copy(
                isEditMode = next,
                activeTool = LayoutEditorTool.SELECT,
                inlineValidation = null,
                statusMessage = if (next) {
                    "Редактор включён. Выберите инструмент."
                } else {
                    "Режим просмотра включён."
                },
            )
        }
    }

    fun discardChanges() {
        undoStack.clear()
        redoStack.clear()
        val rooms = persistedSnapshot.rooms
        val selection = resolveSelection(
            rooms = rooms,
            activeFloorId = _uiState.value.activeFloorId,
            selectedRoomId = null,
            selectedBlockId = null,
            selectedElementId = null,
        )
        _uiState.update {
            it.copy(
                rooms = rooms,
                layoutRevision = persistedSnapshot.revision,
                selectedRoomId = selection.roomId,
                selectedBlockId = selection.blockId,
                selectedElementId = selection.elementId,
                hasUnsavedChanges = false,
                canUndo = false,
                canRedo = false,
                error = null,
                inlineValidation = null,
                statusMessage = "Локальные изменения отменены.",
            )
        }
    }

    fun undo() {
        val previous = undoStack.removeLastOrNull() ?: return
        redoStack.addLast(LayoutDraftSnapshot(_uiState.value.rooms, _uiState.value.layoutRevision))
        applyRooms(previous.rooms, previous.revision, previous != persistedSnapshot, "Возврат на шаг назад.")
        syncHistoryFlags()
    }

    fun redo() {
        val next = redoStack.removeLastOrNull() ?: return
        undoStack.addLast(LayoutDraftSnapshot(_uiState.value.rooms, _uiState.value.layoutRevision))
        applyRooms(next.rooms, next.revision, true, "Повтор шага.")
        syncHistoryFlags()
    }

    fun saveLayout() {
        viewModelScope.launch {
            val homeId = SessionManager.currentHomeId.value
            if (homeId == null) {
                setBlockingError("Дом не выбран.")
                return@launch
            }
            val currentRooms = _uiState.value.rooms
            validateLayout(currentRooms)?.let {
                setInlineValidation(it)
                return@launch
            }
            _uiState.update { it.copy(isLoading = true, error = null, inlineValidation = null, statusMessage = "Сохраняем планировку…") }
            try {
                var workingRooms = currentRooms.map { room ->
                    room.copy(
                        layoutBlocks = room.layoutBlocks.mapIndexed { index, block ->
                            block.copy(zIndex = index)
                        },
                    )
                }

                val tempRooms = workingRooms.filter { it.id.startsWith(TEMP_ROOM_PREFIX) }
                for (room in tempRooms) {
                    val createdRoom = platformRepository.createRoom(
                        homeId = homeId,
                        floorId = room.floorId ?: _uiState.value.activeFloorId,
                        title = room.name,
                        type = room.roomType,
                        sortOrder = sortOrderForFloor(workingRooms, room),
                    )
                    workingRooms = replaceRoomId(
                        rooms = workingRooms,
                        oldRoomId = room.id,
                        newRoomId = createdRoom.id,
                        newName = createdRoom.title,
                        newType = createdRoom.type,
                        newFloorId = createdRoom.floorId,
                    )
                }

                val persistedById = persistedSnapshot.rooms.associateBy { it.id }
                workingRooms.forEach { room ->
                    val persistedRoom = persistedById[room.id]
                    if (
                        persistedRoom == null ||
                        persistedRoom.name != room.name ||
                        persistedRoom.roomType != room.roomType ||
                        persistedRoom.floorId != room.floorId
                    ) {
                        platformRepository.updateRoom(
                            roomId = room.id,
                            floorId = room.floorId,
                            title = room.name,
                            type = room.roomType,
                            sortOrder = sortOrderForFloor(workingRooms, room),
                        )
                    }
                }

                platformRepository.saveLayout(homeId, _uiState.value.layoutRevision, workingRooms)
                val snapshot = platformRepository.getSnapshot(homeId)
                val refreshedRooms = platformRepository.mapRooms(snapshot)
                val floors = platformRepository.mapFloors(snapshot)
                val activeFloorId = _uiState.value.activeFloorId ?: snapshot.preferences.activeFloorId ?: floors.firstOrNull()?.id
                persistedSnapshot = LayoutDraftSnapshot(refreshedRooms, snapshot.home.layoutRevision)
                undoStack.clear()
                redoStack.clear()
                val selection = resolveSelection(
                    rooms = refreshedRooms,
                    activeFloorId = activeFloorId,
                    selectedRoomId = _uiState.value.selectedRoomId,
                    selectedBlockId = _uiState.value.selectedBlockId,
                    selectedElementId = _uiState.value.selectedElementId,
                )
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        floors = floors,
                        activeFloorId = activeFloorId,
                        rooms = refreshedRooms,
                        layoutRevision = snapshot.home.layoutRevision,
                        selectedRoomId = selection.roomId,
                        selectedBlockId = selection.blockId,
                        selectedElementId = selection.elementId,
                        hasUnsavedChanges = false,
                        canUndo = false,
                        canRedo = false,
                        error = null,
                        inlineValidation = null,
                        statusMessage = "Планировка сохранена.",
                    )
                }
            } catch (error: Exception) {
                setBlockingError(error.message ?: "Не удалось сохранить планировку.")
            }
        }
    }

    private fun selectAt(gridX: Int, gridY: Int) {
        val visibleRooms = visibleRooms(_uiState.value.rooms, _uiState.value.activeFloorId)
        val elementHit = visibleRooms.asReversed().firstNotNullOfOrNull { room ->
            room.elements.findLast { it.contains(gridX, gridY) }?.let { room.id to it.id }
        }
        if (elementHit != null) {
            _uiState.update {
                it.copy(
                    selectedRoomId = elementHit.first,
                    selectedBlockId = null,
                    selectedElementId = elementHit.second,
                    error = null,
                    inlineValidation = null,
                )
            }
            return
        }

        val blockHit = visibleRooms
            .flatMap { room -> room.layoutBlocks.map { room.id to it } }
            .sortedByDescending { it.second.zIndex }
            .firstOrNull { it.second.contains(gridX, gridY) }
        if (blockHit != null) {
            _uiState.update {
                it.copy(
                    selectedRoomId = blockHit.first,
                    selectedBlockId = blockHit.second.id,
                    selectedElementId = null,
                    error = null,
                    inlineValidation = null,
                )
            }
            return
        }

        _uiState.update { it.copy(selectedRoomId = null, selectedBlockId = null, selectedElementId = null, inlineValidation = null) }
    }

    private fun deleteAt(gridX: Int, gridY: Int) {
        selectAt(gridX, gridY)
        when {
            _uiState.value.selectedElementId != null -> mutateRooms { rooms ->
                rooms.map { room ->
                    room.copy(elements = room.elements.filterNot { it.id == _uiState.value.selectedElementId })
                }
            }

            _uiState.value.selectedBlockId != null -> mutateRooms { rooms ->
                rooms.map { room ->
                    if (room.layoutBlocks.any { it.id == _uiState.value.selectedBlockId }) {
                        if (room.layoutBlocks.size == 1) {
                            setInlineValidation("Нельзя удалить последний блок комнаты.")
                            room
                        } else {
                            room.copy(layoutBlocks = room.layoutBlocks.filterNot { it.id == _uiState.value.selectedBlockId })
                        }
                    } else {
                        room
                    }
                }
            }
        }
    }

    private fun addRoomAt(gridX: Int, gridY: Int) {
        val activeFloorId = _uiState.value.activeFloorId ?: _uiState.value.floors.firstOrNull()?.id
        mutateRooms { rooms ->
            rooms + Room(
                id = "$TEMP_ROOM_PREFIX${UUID.randomUUID()}",
                floorId = activeFloorId,
                name = "Комната ${visibleRooms(rooms, activeFloorId).size + 1}",
                roomType = "custom",
                layoutBlocks = listOf(RoomLayoutBlock(nextTempBlockId(), "", gridX, gridY, 4, 4)),
            )
        }
        val newRoom = _uiState.value.rooms.lastOrNull { it.id.startsWith(TEMP_ROOM_PREFIX) }
        if (newRoom != null) {
            _uiState.update {
                it.copy(
                    selectedRoomId = newRoom.id,
                    selectedBlockId = newRoom.layoutBlocks.firstOrNull()?.id,
                    selectedElementId = null,
                )
            }
        }
    }

    private fun addRoomBlockAt(gridX: Int, gridY: Int) {
        val roomId = _uiState.value.selectedRoomId ?: run {
            setInlineValidation("Сначала выделите комнату, которую хотите расширить.")
            return
        }
        mutateRooms { rooms ->
            rooms.map { room ->
                if (room.id == roomId) {
                    room.copy(
                        layoutBlocks = room.layoutBlocks + RoomLayoutBlock(
                            nextTempBlockId(),
                            room.id,
                            gridX,
                            gridY,
                            2,
                            2,
                            room.layoutBlocks.size,
                        ),
                    )
                } else {
                    room
                }
            }
        }
    }

    private fun addOpeningAt(gridX: Int, gridY: Int, isDoor: Boolean) {
        val room = _uiState.value.rooms.find { it.id == _uiState.value.selectedRoomId } ?: run {
            setInlineValidation("Сначала выделите комнату.")
            return
        }
        addElementAt(gridX, gridY, createOpening(room, gridX, gridY, isDoor))
    }

    private fun addElementAt(gridX: Int, gridY: Int, element: RoomElement) {
        val room = _uiState.value.rooms.find { it.id == _uiState.value.selectedRoomId } ?: run {
            setInlineValidation("Сначала выделите комнату.")
            return
        }
        mutateRooms { rooms ->
            rooms.map { candidate ->
                if (candidate.id == room.id) {
                    candidate.copy(elements = candidate.elements + element.moveTo(gridX, gridY))
                } else {
                    candidate
                }
            }
        }
    }

    private fun mutateRooms(transform: (List<Room>) -> List<Room>) {
        val current = _uiState.value
        val updated = transform(current.rooms).normalize()
        if (updated == current.rooms) return
        validateLayout(updated)?.let {
            setInlineValidation(it)
            return
        }
        undoStack.addLast(LayoutDraftSnapshot(current.rooms, current.layoutRevision))
        redoStack.clear()
        applyRooms(updated, current.layoutRevision, true, null)
        syncHistoryFlags()
    }

    private fun applyRooms(rooms: List<Room>, revision: Int, hasUnsavedChanges: Boolean, statusMessage: String?) {
        val selection = resolveSelection(
            rooms = rooms,
            activeFloorId = _uiState.value.activeFloorId,
            selectedRoomId = _uiState.value.selectedRoomId,
            selectedBlockId = _uiState.value.selectedBlockId,
            selectedElementId = _uiState.value.selectedElementId,
        )
        _uiState.update {
            it.copy(
                rooms = rooms,
                layoutRevision = revision,
                selectedRoomId = selection.roomId,
                selectedBlockId = selection.blockId,
                selectedElementId = selection.elementId,
                hasUnsavedChanges = hasUnsavedChanges,
                error = null,
                inlineValidation = null,
                statusMessage = statusMessage,
            )
        }
    }

    private fun syncHistoryFlags() {
        _uiState.update { it.copy(canUndo = undoStack.isNotEmpty(), canRedo = redoStack.isNotEmpty()) }
    }

    private fun validateLayout(rooms: List<Room>): String? {
        val floorByRoomId = rooms.associate { room -> room.id to room.floorId }
        val blocks = rooms.flatMap { room -> room.layoutBlocks.map { block -> room.id to block } }
        for (i in blocks.indices) {
            val (firstRoomId, first) = blocks[i]
            if (first.gridX < 0 || first.gridY < 0) {
                return "Планировка не может выходить за пределы сетки."
            }
            for (j in i + 1 until blocks.size) {
                val (secondRoomId, second) = blocks[j]
                val firstFloorId = floorByRoomId[firstRoomId]
                val secondFloorId = floorByRoomId[secondRoomId]
                if (firstFloorId == secondFloorId && first.intersects(second)) {
                    return "Комнаты и блоки на одном этаже не должны пересекаться."
                }
            }
        }

        for (room in rooms) {
            if (room.layoutBlocks.isEmpty()) return "У каждой комнаты должен остаться хотя бы один блок."
            for (element in room.elements) {
                val insideRoom = room.layoutBlocks.any { block ->
                    element.gridX >= block.gridX &&
                        element.gridY >= block.gridY &&
                        element.gridX + element.width <= block.gridX + block.width &&
                        element.gridY + element.height <= block.gridY + block.height
                }
                if (!insideRoom) return "Элементы комнаты не могут выходить за её границы."

                if (element is RoomElement.Door || element is RoomElement.Window) {
                    val onPerimeter = room.layoutBlocks.any { block ->
                        element.gridX == block.gridX ||
                            element.gridX + element.width == block.gridX + block.width ||
                            element.gridY == block.gridY ||
                            element.gridY + element.height == block.gridY + block.height
                    }
                    if (!onPerimeter) return "Двери и окна должны стоять на периметре комнаты."
                }
            }
        }
        return null
    }

    private fun createOpening(room: Room, gridX: Int, gridY: Int, isDoor: Boolean): RoomElement {
        val block = room.layoutBlocks.firstOrNull { it.contains(gridX, gridY) } ?: room.layoutBlocks.first()
        val distances = listOf(
            gridX - block.gridX,
            block.gridX + block.width - gridX,
            gridY - block.gridY,
            block.gridY + block.height - gridY,
        )
        val minDistance = distances.minOrNull() ?: 0
        val vertical = minDistance == distances[0] || minDistance == distances[1]
        val width = if (vertical) 1 else 2
        val height = if (vertical) 2 else 1
        val x = when {
            minDistance == distances[0] -> block.gridX
            minDistance == distances[1] -> block.gridX + block.width - width
            else -> (gridX - width / 2).coerceIn(block.gridX, block.gridX + block.width - width)
        }
        val y = when {
            minDistance == distances[2] -> block.gridY
            minDistance == distances[3] -> block.gridY + block.height - height
            else -> (gridY - height / 2).coerceIn(block.gridY, block.gridY + block.height - height)
        }
        return if (isDoor) {
            RoomElement.Door(nextTempItemId(), x, y, width, height, !vertical, "Дверь")
        } else {
            RoomElement.Window(nextTempItemId(), x, y, width, height, !vertical, "Окно")
        }
    }

    private fun replaceRoomId(
        rooms: List<Room>,
        oldRoomId: String,
        newRoomId: String,
        newName: String,
        newType: String,
        newFloorId: String?,
    ): List<Room> = rooms.map { room ->
        if (room.id == oldRoomId) {
            room.copy(
                id = newRoomId,
                floorId = newFloorId,
                name = newName,
                roomType = newType,
                layoutBlocks = room.layoutBlocks.map { it.copy(roomId = newRoomId) },
            )
        } else {
            room
        }
    }

    private fun List<Room>.normalize(): List<Room> = mapIndexed { roomIndex, room ->
        room.copy(
            layoutBlocks = room.layoutBlocks.mapIndexed { blockIndex, block ->
                block.copy(roomId = room.id, zIndex = roomIndex * 100 + blockIndex)
            },
        )
    }

    private fun visibleRooms(rooms: List<Room>, activeFloorId: String?): List<Room> =
        rooms.filter { activeFloorId == null || it.floorId == activeFloorId }

    private fun resolveSelection(
        rooms: List<Room>,
        activeFloorId: String?,
        selectedRoomId: String?,
        selectedBlockId: String?,
        selectedElementId: String?,
    ): SelectionState {
        val visibleRooms = visibleRooms(rooms, activeFloorId)
        val room = visibleRooms.find { it.id == selectedRoomId } ?: visibleRooms.firstOrNull()
        val element = room?.elements?.firstOrNull { it.id == selectedElementId }
        val block = room?.layoutBlocks?.firstOrNull { it.id == selectedBlockId } ?: room?.layoutBlocks?.firstOrNull()
        return SelectionState(room?.id, if (element == null) block?.id else null, element?.id)
    }

    private fun sortOrderForFloor(rooms: List<Room>, targetRoom: Room): Int =
        rooms.filter { it.floorId == targetRoom.floorId }.indexOfFirst { it.id == targetRoom.id }.coerceAtLeast(0)

    private fun toolHint(tool: LayoutEditorTool): String = when (tool) {
        LayoutEditorTool.SELECT -> "Выделите комнату, блок или элемент."
        LayoutEditorTool.ADD_ROOM -> "Нажмите на сетку, чтобы добавить новую комнату."
        LayoutEditorTool.ADD_ROOM_BLOCK -> "Нажмите на сетку, чтобы расширить выбранную комнату."
        LayoutEditorTool.ADD_FURNITURE -> "Нажмите внутри комнаты, чтобы поставить мебель."
        LayoutEditorTool.ADD_DOOR -> "Нажмите ближе к стене комнаты, чтобы поставить дверь."
        LayoutEditorTool.ADD_WINDOW -> "Нажмите ближе к стене комнаты, чтобы поставить окно."
        LayoutEditorTool.ADD_DEVICE_MARKER -> "Нажмите внутри комнаты, чтобы поставить маркер устройства."
        LayoutEditorTool.ADD_TASK_MARKER -> "Нажмите внутри комнаты, чтобы поставить маркер задания."
        LayoutEditorTool.RESIZE -> "Потяните выделенный объект, чтобы изменить размер."
        LayoutEditorTool.DELETE -> "Нажмите на блок или элемент, чтобы удалить его."
    }

    private fun nextTempItemId(): String = "$TEMP_ITEM_PREFIX${UUID.randomUUID()}"
    private fun nextTempBlockId(): String = "$TEMP_BLOCK_PREFIX${UUID.randomUUID()}"

    private fun setBlockingError(message: String) {
        _uiState.update { it.copy(isLoading = false, error = message, inlineValidation = null) }
    }

    private fun setInlineValidation(message: String) {
        _uiState.update { it.copy(inlineValidation = message) }
    }

    companion object {
        val Factory: ViewModelProvider.Factory = object : ViewModelProvider.Factory {
            @Suppress("UNCHECKED_CAST")
            override fun <T : ViewModel> create(modelClass: Class<T>, extras: CreationExtras): T {
                val application = checkNotNull(extras[APPLICATION_KEY]) as RosDomApplication
                return RoomsViewModel(application.platformRepository, application.realtimeSocket) as T
            }
        }
    }
}

private fun RoomLayoutBlock.contains(gridX: Int, gridY: Int): Boolean =
    gridX >= this.gridX && gridX < this.gridX + width && gridY >= this.gridY && gridY < this.gridY + height

private fun RoomLayoutBlock.intersects(other: RoomLayoutBlock): Boolean =
    gridX < other.gridX + other.width &&
        gridX + width > other.gridX &&
        gridY < other.gridY + other.height &&
        gridY + height > other.gridY

private fun RoomElement.contains(gridX: Int, gridY: Int): Boolean =
    gridX >= this.gridX && gridX < this.gridX + width && gridY >= this.gridY && gridY < this.gridY + height

private fun RoomElement.moveBy(deltaGridX: Int, deltaGridY: Int): RoomElement = when (this) {
    is RoomElement.Furniture -> copy(gridX = gridX + deltaGridX, gridY = gridY + deltaGridY)
    is RoomElement.Door -> copy(gridX = gridX + deltaGridX, gridY = gridY + deltaGridY)
    is RoomElement.Window -> copy(gridX = gridX + deltaGridX, gridY = gridY + deltaGridY)
    is RoomElement.DeviceMarker -> copy(gridX = gridX + deltaGridX, gridY = gridY + deltaGridY)
    is RoomElement.TaskMarker -> copy(gridX = gridX + deltaGridX, gridY = gridY + deltaGridY)
}

private fun RoomElement.moveTo(newGridX: Int, newGridY: Int): RoomElement = when (this) {
    is RoomElement.Furniture -> copy(gridX = newGridX, gridY = newGridY)
    is RoomElement.Door -> copy(gridX = newGridX, gridY = newGridY)
    is RoomElement.Window -> copy(gridX = newGridX, gridY = newGridY)
    is RoomElement.DeviceMarker -> copy(gridX = newGridX, gridY = newGridY)
    is RoomElement.TaskMarker -> copy(gridX = newGridX, gridY = newGridY)
}

private fun RoomElement.resizeBy(deltaGridX: Int, deltaGridY: Int): RoomElement {
    val nextWidth = (width + deltaGridX).coerceAtLeast(1)
    val nextHeight = (height + deltaGridY).coerceAtLeast(1)
    return when (this) {
        is RoomElement.Furniture -> copy(width = nextWidth, height = nextHeight)
        is RoomElement.Door -> copy(width = nextWidth, height = nextHeight)
        is RoomElement.Window -> copy(width = nextWidth, height = nextHeight)
        is RoomElement.DeviceMarker -> copy(width = nextWidth, height = nextHeight)
        is RoomElement.TaskMarker -> copy(width = nextWidth, height = nextHeight)
    }
}

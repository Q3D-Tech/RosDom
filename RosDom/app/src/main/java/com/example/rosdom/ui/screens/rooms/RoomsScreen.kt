package ru.rosdom.ui.screens.rooms

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material.icons.filled.Edit
import androidx.compose.material.icons.filled.GridView
import androidx.compose.material.icons.filled.Layers
import androidx.compose.material.icons.filled.Straighten
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.FilterChip
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import ru.rosdom.domain.model.LayoutEditorTool
import ru.rosdom.domain.model.Room
import ru.rosdom.domain.model.RoomElement
import ru.rosdom.domain.model.RoomLayoutBlock
import ru.rosdom.ui.components.FloorPlanCanvas
import ru.rosdom.ui.components.RosDomEmptyCard
import ru.rosdom.ui.components.RosDomFloorSwitcher
import ru.rosdom.ui.components.RosDomHeroCard
import ru.rosdom.ui.components.RosDomInfoBanner
import ru.rosdom.ui.components.RosDomMetricTile
import ru.rosdom.ui.components.RosDomPageBackground
import ru.rosdom.ui.components.RosDomScreenHeader
import ru.rosdom.ui.components.RosDomSectionHeader
import ru.rosdom.ui.theme.RosDomAmber
import ru.rosdom.ui.theme.RosDomCritical
import ru.rosdom.ui.theme.RosDomCyan
import ru.rosdom.ui.theme.RosDomMint
import ru.rosdom.ui.theme.RosDomPurple

@Composable
fun RoomsScreen(
    viewModel: RoomsViewModel = androidx.lifecycle.viewmodel.compose.viewModel(factory = RoomsViewModel.Factory),
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()
    val visibleRooms = state.rooms.filter { state.activeFloorId == null || it.floorId == state.activeFloorId }
    val selectedRoom = visibleRooms.find { it.id == state.selectedRoomId }
    val selectedElement = selectedRoom?.elements?.find { it.id == state.selectedElementId }
    val selectedBlock = selectedRoom?.layoutBlocks?.find { it.id == state.selectedBlockId }

    RosDomPageBackground {
        if (state.isLoading && state.rooms.isEmpty()) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                CircularProgressIndicator(color = RosDomPurple)
            }
            return@RosDomPageBackground
        }

        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(horizontal = 20.dp, vertical = 16.dp),
            verticalArrangement = Arrangement.spacedBy(18.dp),
        ) {
            item {
                RosDomScreenHeader(
                    title = "Комнаты и этажи",
                    subtitle = "Соберите план дома как настоящий редактор: этажи, комнаты, мебель, окна, устройства и задания.",
                )
            }

            item {
                RosDomHeroCard(
                    eyebrow = "Редактор дома",
                    title = if (state.isEditMode) "Режим Family Guardian" else "Планировка и зоны",
                    subtitle = if (visibleRooms.isEmpty()) {
                        "Создайте первый этаж и разместите комнаты на сетке. Ошибки валидации больше не блокируют редактор."
                    } else {
                        "${visibleRooms.size} комнат на активном этаже • ${if (state.hasUnsavedChanges) "есть несохранённые изменения" else "всё синхронизировано"}"
                    },
                    icon = Icons.Filled.Layers,
                    actionLabel = if (state.isEditMode) "Закрыть редактор" else "Открыть редактор",
                    onAction = viewModel::toggleEditMode,
                )
            }

            if (!state.error.isNullOrBlank()) {
                item {
                    RosDomInfoBanner(
                        message = state.error.orEmpty(),
                        accent = RosDomCritical,
                    )
                }
            }

            state.inlineValidation?.let { message ->
                item {
                    RosDomInfoBanner(message = message, accent = RosDomAmber)
                }
            }

            state.statusMessage?.let { message ->
                item {
                    RosDomInfoBanner(message = message, accent = RosDomMint)
                }
            }

            if (state.floors.isNotEmpty()) {
                item {
                    RosDomSectionHeader(title = "Этажи")
                }
                item {
                    RosDomFloorSwitcher(
                        floors = state.floors,
                        activeFloorId = state.activeFloorId,
                        onSelect = viewModel::setActiveFloor,
                    )
                }
            }

            item {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(12.dp),
                ) {
                    RosDomMetricTile(
                        title = "Комнаты",
                        value = visibleRooms.size.toString(),
                        subtitle = "на выбранном этаже",
                        icon = Icons.Filled.GridView,
                        accent = RosDomCyan,
                        modifier = Modifier.weight(1f),
                    )
                    RosDomMetricTile(
                        title = "Режим",
                        value = if (state.isEditMode) "EDIT" else "VIEW",
                        subtitle = if (state.hasUnsavedChanges) "есть черновик" else "всё сохранено",
                        icon = Icons.Filled.Edit,
                        accent = RosDomPurple,
                        modifier = Modifier.weight(1f),
                    )
                }
            }

            if (state.isEditMode) {
                item {
                    RosDomSectionHeader(title = "Инструменты")
                }
                item {
                    EditorToolbar(
                        activeTool = state.activeTool,
                        hasUnsavedChanges = state.hasUnsavedChanges,
                        canUndo = state.canUndo,
                        canRedo = state.canRedo,
                        onToolSelected = viewModel::selectTool,
                        onUndo = viewModel::undo,
                        onRedo = viewModel::redo,
                        onSave = viewModel::saveLayout,
                        onDiscard = viewModel::discardChanges,
                    )
                }
            }

            item {
                RosDomSectionHeader(title = if (state.isEditMode) "Полотно этажа" else "План текущего этажа")
            }

            item {
                Surface(
                    shape = MaterialTheme.shapes.extraLarge,
                    color = MaterialTheme.colorScheme.surface,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(440.dp),
                ) {
                    Box(modifier = Modifier.padding(14.dp)) {
                        FloorPlanCanvas(
                            rooms = visibleRooms,
                            selectedRoomId = state.selectedRoomId,
                            selectedBlockId = state.selectedBlockId,
                            selectedElementId = state.selectedElementId,
                            isEditMode = state.isEditMode,
                            activeTool = state.activeTool,
                            onGridTap = viewModel::selectGridPosition,
                            onSelectionMoved = viewModel::moveSelection,
                            onSelectionResized = viewModel::resizeSelection,
                        )
                    }
                }
            }

            item {
                RosDomSectionHeader(title = "Свойства и точная настройка")
            }

            item {
                LayoutInspector(
                    roomName = selectedRoom?.name.orEmpty(),
                    selectedElement = selectedElement,
                    selectedBlock = selectedBlock,
                    isEditMode = state.isEditMode,
                    onRoomNameChange = viewModel::renameSelectedRoom,
                    onMoveLeft = { viewModel.moveSelection(-1, 0) },
                    onMoveRight = { viewModel.moveSelection(1, 0) },
                    onMoveUp = { viewModel.moveSelection(0, -1) },
                    onMoveDown = { viewModel.moveSelection(0, 1) },
                    onGrowWidth = { viewModel.resizeSelection(1, 0) },
                    onShrinkWidth = { viewModel.resizeSelection(-1, 0) },
                    onGrowHeight = { viewModel.resizeSelection(0, 1) },
                    onShrinkHeight = { viewModel.resizeSelection(0, -1) },
                )
            }

            item {
                RosDomSectionHeader(title = "Комнаты активного этажа")
            }

            if (visibleRooms.isEmpty()) {
                item {
                    RosDomEmptyCard(
                        title = "На этом этаже пока пусто",
                        body = "Переключитесь на другой этаж или откройте редактор и добавьте первую комнату.",
                    )
                }
            } else {
                items(visibleRooms, key = { it.id }) { room ->
                    RoomPreviewCard(room = room)
                }
            }
        }
    }
}

@Composable
private fun EditorToolbar(
    activeTool: LayoutEditorTool,
    hasUnsavedChanges: Boolean,
    canUndo: Boolean,
    canRedo: Boolean,
    onToolSelected: (LayoutEditorTool) -> Unit,
    onUndo: () -> Unit,
    onRedo: () -> Unit,
    onSave: () -> Unit,
    onDiscard: () -> Unit,
) {
    Surface(
        color = MaterialTheme.colorScheme.surface,
        shape = MaterialTheme.shapes.extraLarge,
        modifier = Modifier.fillMaxWidth(),
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                items(LayoutEditorTool.entries.toList(), key = { it.name }) { tool ->
                    FilterChip(
                        selected = tool == activeTool,
                        onClick = { onToolSelected(tool) },
                        label = { Text(tool.label()) },
                    )
                }
            }
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                Button(onClick = onUndo, enabled = canUndo, modifier = Modifier.weight(1f)) { Text("Назад") }
                Button(onClick = onRedo, enabled = canRedo, modifier = Modifier.weight(1f)) { Text("Вперёд") }
            }
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                Button(onClick = onSave, enabled = hasUnsavedChanges, modifier = Modifier.weight(1f)) {
                    Icon(Icons.Filled.Check, contentDescription = null)
                    Text("Сохранить", modifier = Modifier.padding(start = 8.dp))
                }
                Button(onClick = onDiscard, enabled = hasUnsavedChanges, modifier = Modifier.weight(1f)) {
                    Text("Сбросить")
                }
            }
        }
    }
}

@Composable
private fun LayoutInspector(
    roomName: String,
    selectedElement: RoomElement?,
    selectedBlock: RoomLayoutBlock?,
    isEditMode: Boolean,
    onRoomNameChange: (String) -> Unit,
    onMoveLeft: () -> Unit,
    onMoveRight: () -> Unit,
    onMoveUp: () -> Unit,
    onMoveDown: () -> Unit,
    onGrowWidth: () -> Unit,
    onShrinkWidth: () -> Unit,
    onGrowHeight: () -> Unit,
    onShrinkHeight: () -> Unit,
) {
    Surface(
        color = MaterialTheme.colorScheme.surface,
        shape = MaterialTheme.shapes.extraLarge,
        modifier = Modifier.fillMaxWidth(),
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Text(
                text = when {
                    selectedElement != null -> selectedElement.title ?: "Элемент"
                    selectedBlock != null -> "Выбран блок комнаты"
                    roomName.isNotBlank() -> roomName
                    else -> "Планировка дома"
                },
                style = MaterialTheme.typography.titleLarge,
                color = MaterialTheme.colorScheme.onSurface,
            )

            if (roomName.isNotBlank() && selectedElement == null) {
                OutlinedTextField(
                    value = roomName,
                    onValueChange = onRoomNameChange,
                    modifier = Modifier.fillMaxWidth(),
                    label = { Text("Название комнаты") },
                )
            } else {
                Text(
                    text = elementDescription(selectedElement),
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }

            if (isEditMode) {
                Text(
                    text = "Точное редактирование",
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.onSurface,
                )
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    Button(onClick = onMoveLeft, modifier = Modifier.weight(1f)) { Text("←") }
                    Button(onClick = onMoveUp, modifier = Modifier.weight(1f)) { Text("↑") }
                    Button(onClick = onMoveDown, modifier = Modifier.weight(1f)) { Text("↓") }
                    Button(onClick = onMoveRight, modifier = Modifier.weight(1f)) { Text("→") }
                }
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    Button(onClick = onShrinkWidth, modifier = Modifier.weight(1f)) { Text("Ширина -") }
                    Button(onClick = onGrowWidth, modifier = Modifier.weight(1f)) { Text("Ширина +") }
                }
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                ) {
                    Button(onClick = onShrinkHeight, modifier = Modifier.weight(1f)) { Text("Высота -") }
                    Button(onClick = onGrowHeight, modifier = Modifier.weight(1f)) { Text("Высота +") }
                }
            }
        }
    }
}

@Composable
private fun RoomPreviewCard(room: Room) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = MaterialTheme.shapes.large,
        color = MaterialTheme.colorScheme.surface,
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Column(
                modifier = Modifier.weight(1f),
                verticalArrangement = Arrangement.spacedBy(6.dp),
            ) {
                Text(
                    text = room.name,
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.onSurface,
                )
                Text(
                    text = "${room.layoutBlocks.size} блоков • ${room.elements.size} элементов",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }
            Icon(
                imageVector = Icons.Filled.Straighten,
                contentDescription = null,
                tint = RosDomPurple,
            )
        }
    }
}

private fun elementDescription(element: RoomElement?): String = when (element) {
    is RoomElement.Furniture -> "Мебель: ${element.type.name.lowercase()}"
    is RoomElement.Door -> "Дверь на периметре комнаты"
    is RoomElement.Window -> "Окно на периметре комнаты"
    is RoomElement.DeviceMarker -> "Маркер устройства"
    is RoomElement.TaskMarker -> "Маркер задания"
    null -> "Выделите комнату, блок или элемент на плане."
}

private fun LayoutEditorTool.label(): String = when (this) {
    LayoutEditorTool.SELECT -> "Выбор"
    LayoutEditorTool.ADD_ROOM -> "Комната"
    LayoutEditorTool.ADD_ROOM_BLOCK -> "Блок"
    LayoutEditorTool.ADD_FURNITURE -> "Мебель"
    LayoutEditorTool.ADD_DOOR -> "Дверь"
    LayoutEditorTool.ADD_WINDOW -> "Окно"
    LayoutEditorTool.ADD_DEVICE_MARKER -> "Устройство"
    LayoutEditorTool.ADD_TASK_MARKER -> "Задание"
    LayoutEditorTool.RESIZE -> "Размер"
    LayoutEditorTool.DELETE -> "Удалить"
}

package ru.rosdom.ui.state

import ru.rosdom.domain.model.Floor
import ru.rosdom.domain.model.LayoutEditorTool
import ru.rosdom.domain.model.Room

data class RoomsUiState(
    val isLoading: Boolean = true,
    val floors: List<Floor> = emptyList(),
    val activeFloorId: String? = null,
    val rooms: List<Room> = emptyList(),
    val selectedRoomId: String? = null,
    val selectedBlockId: String? = null,
    val selectedElementId: String? = null,
    val isEditMode: Boolean = false,
    val activeTool: LayoutEditorTool = LayoutEditorTool.SELECT,
    val layoutRevision: Int = 0,
    val hasUnsavedChanges: Boolean = false,
    val canUndo: Boolean = false,
    val canRedo: Boolean = false,
    val statusMessage: String? = null,
    val inlineValidation: String? = null,
    val error: String? = null,
)

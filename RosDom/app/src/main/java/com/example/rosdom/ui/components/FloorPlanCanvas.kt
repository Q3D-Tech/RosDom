package ru.rosdom.ui.components

import android.graphics.Paint
import androidx.compose.foundation.Canvas
import androidx.compose.foundation.gestures.detectDragGestures
import androidx.compose.foundation.gestures.detectTapGestures
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.geometry.Offset
import androidx.compose.ui.geometry.Size
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.graphics.nativeCanvas
import androidx.compose.ui.input.pointer.pointerInput
import ru.rosdom.domain.model.LayoutEditorTool
import ru.rosdom.domain.model.Room
import ru.rosdom.domain.model.RoomElement
import kotlin.math.floor
import kotlin.math.min

@Composable
fun FloorPlanCanvas(
    rooms: List<Room>,
    selectedRoomId: String?,
    selectedBlockId: String?,
    selectedElementId: String?,
    isEditMode: Boolean,
    activeTool: LayoutEditorTool,
    onGridTap: (gridX: Int, gridY: Int) -> Unit,
    onSelectionMoved: (deltaX: Int, deltaY: Int) -> Unit,
    onSelectionResized: (deltaX: Int, deltaY: Int) -> Unit,
    modifier: Modifier = Modifier,
) {
    BoxWithConstraints(modifier = modifier.fillMaxSize()) {
        val metrics = remember(rooms, maxWidth, maxHeight) {
            val maxX = rooms.flatMap { room ->
                room.layoutBlocks.map { it.gridX + it.width } +
                    room.elements.map { it.gridX + it.width }
            }.maxOrNull() ?: 12
            val maxY = rooms.flatMap { room ->
                room.layoutBlocks.map { it.gridY + it.height } +
                    room.elements.map { it.gridY + it.height }
            }.maxOrNull() ?: 12

            val columns = (maxX + 2).coerceAtLeast(12)
            val rows = (maxY + 2).coerceAtLeast(12)
            val widthPx = constraints.maxWidth.toFloat()
            val heightPx = constraints.maxHeight.toFloat()
            val cellSize = min(widthPx / columns, heightPx / rows).coerceAtLeast(20f)
            val originX = (widthPx - cellSize * columns) / 2f
            val originY = (heightPx - cellSize * rows) / 2f
            GridMetrics(
                cellSize = cellSize,
                originX = originX,
                originY = originY,
                columns = columns,
                rows = rows,
            )
        }

        Canvas(
            modifier = Modifier
                .fillMaxSize()
                .pointerInput(rooms, isEditMode, activeTool) {
                    detectTapGestures { tapOffset ->
                        metrics.toGrid(tapOffset)?.let { (gridX, gridY) ->
                            onGridTap(gridX, gridY)
                        }
                    }
                }
                .pointerInput(rooms, isEditMode, activeTool, selectedBlockId, selectedElementId) {
                    if (!isEditMode || (activeTool != LayoutEditorTool.SELECT && activeTool != LayoutEditorTool.RESIZE)) {
                        return@pointerInput
                    }
                    var startOffset = Offset.Zero
                    var latestOffset = Offset.Zero
                    detectDragGestures(
                        onDragStart = {
                            startOffset = it
                            latestOffset = it
                        },
                        onDrag = { change, dragAmount ->
                            change.consume()
                            latestOffset += dragAmount
                        },
                        onDragEnd = {
                            val deltaX = ((latestOffset.x - startOffset.x) / metrics.cellSize).toInt()
                            val deltaY = ((latestOffset.y - startOffset.y) / metrics.cellSize).toInt()
                            if (deltaX != 0 || deltaY != 0) {
                                if (activeTool == LayoutEditorTool.RESIZE) {
                                    onSelectionResized(deltaX, deltaY)
                                } else {
                                    onSelectionMoved(deltaX, deltaY)
                                }
                            }
                        },
                    )
                },
        ) {
            if (isEditMode) {
                for (column in 0..metrics.columns) {
                    val x = metrics.originX + column * metrics.cellSize
                    drawLine(
                        color = Color.White.copy(alpha = 0.06f),
                        start = Offset(x, metrics.originY),
                        end = Offset(x, metrics.originY + metrics.rows * metrics.cellSize),
                    )
                }
                for (row in 0..metrics.rows) {
                    val y = metrics.originY + row * metrics.cellSize
                    drawLine(
                        color = Color.White.copy(alpha = 0.06f),
                        start = Offset(metrics.originX, y),
                        end = Offset(metrics.originX + metrics.columns * metrics.cellSize, y),
                    )
                }
            }

            val labelPaint = Paint().apply {
                color = android.graphics.Color.WHITE
                textSize = metrics.cellSize * 0.45f
                isAntiAlias = true
            }

            rooms.forEach { room ->
                val roomSelected = room.id == selectedRoomId
                room.layoutBlocks.forEach { block ->
                    val blockSelected = block.id == selectedBlockId
                    val topLeft = metrics.toOffset(block.gridX, block.gridY)
                    val size = Size(block.width * metrics.cellSize, block.height * metrics.cellSize)
                    drawRect(
                        color = if (roomSelected) Color(0xFF6B4EFF).copy(alpha = 0.18f) else Color.White.copy(alpha = 0.08f),
                        topLeft = topLeft,
                        size = size,
                    )
                    drawRect(
                        color = if (blockSelected) Color(0xFF9D85FF) else if (roomSelected) Color(0xFF6B4EFF) else Color.White.copy(alpha = 0.35f),
                        topLeft = topLeft,
                        size = size,
                        style = Stroke(width = if (blockSelected) 5f else 3f),
                    )

                    if (room.layoutBlocks.firstOrNull()?.id == block.id) {
                        drawContext.canvas.nativeCanvas.drawText(
                            room.name,
                            topLeft.x + metrics.cellSize * 0.35f,
                            topLeft.y + metrics.cellSize * 0.9f,
                            labelPaint,
                        )
                    }

                    if (isEditMode && blockSelected) {
                        val handleSize = metrics.cellSize * 0.28f
                        drawRect(
                            color = Color(0xFF9D85FF),
                            topLeft = Offset(
                                topLeft.x + size.width - handleSize,
                                topLeft.y + size.height - handleSize,
                            ),
                            size = Size(handleSize, handleSize),
                        )
                    }
                }

                room.elements.forEach { element ->
                    val elementSelected = element.id == selectedElementId
                    val topLeft = metrics.toOffset(element.gridX, element.gridY)
                    val size = Size(element.width * metrics.cellSize, element.height * metrics.cellSize)
                    when (element) {
                        is RoomElement.Furniture -> {
                            val fill = when (element.type) {
                                ru.rosdom.domain.model.FurnitureType.BED -> Color(0xFF6882C0)
                                ru.rosdom.domain.model.FurnitureType.TABLE -> Color(0xFF7D5CFF)
                                ru.rosdom.domain.model.FurnitureType.BATH -> Color(0xFF4F8DD8)
                                ru.rosdom.domain.model.FurnitureType.SOFA -> Color(0xFFD16B2F)
                                ru.rosdom.domain.model.FurnitureType.WARDROBE -> Color(0xFF85776C)
                            }
                            drawRect(fill.copy(alpha = 0.85f), topLeft = topLeft, size = size)
                            drawRect(fill, topLeft = topLeft, size = size, style = Stroke(width = 2f))
                        }

                        is RoomElement.Door -> drawRect(Color(0xFFB78B67), topLeft = topLeft, size = size)
                        is RoomElement.Window -> drawRect(Color(0xFF6ECDF3).copy(alpha = 0.7f), topLeft = topLeft, size = size)
                        is RoomElement.DeviceMarker -> drawCircle(
                            color = Color(0xFF4DD0E1),
                            radius = metrics.cellSize * 0.32f,
                            center = Offset(topLeft.x + size.width / 2f, topLeft.y + size.height / 2f),
                        )

                        is RoomElement.TaskMarker -> drawCircle(
                            color = Color(0xFFFFC857),
                            radius = metrics.cellSize * 0.32f,
                            center = Offset(topLeft.x + size.width / 2f, topLeft.y + size.height / 2f),
                        )
                    }

                    if (elementSelected) {
                        drawRect(
                            color = Color.White,
                            topLeft = topLeft,
                            size = size,
                            style = Stroke(width = 4f),
                        )
                        if (isEditMode) {
                            val handleSize = metrics.cellSize * 0.26f
                            drawRect(
                                color = Color.White,
                                topLeft = Offset(
                                    topLeft.x + size.width - handleSize,
                                    topLeft.y + size.height - handleSize,
                                ),
                                size = Size(handleSize, handleSize),
                            )
                        }
                    }
                }
            }
        }
    }
}

private data class GridMetrics(
    val cellSize: Float,
    val originX: Float,
    val originY: Float,
    val columns: Int,
    val rows: Int,
) {
    fun toGrid(offset: Offset): Pair<Int, Int>? {
        if (offset.x < originX || offset.y < originY) return null
        val localX = offset.x - originX
        val localY = offset.y - originY
        val gridX = floor(localX / cellSize).toInt()
        val gridY = floor(localY / cellSize).toInt()
        return if (gridX in 0 until columns && gridY in 0 until rows) {
            gridX to gridY
        } else {
            null
        }
    }

    fun toOffset(gridX: Int, gridY: Int): Offset {
        return Offset(
            x = originX + gridX * cellSize,
            y = originY + gridY * cellSize,
        )
    }
}

package ru.rosdom.ui.screens.tasks

import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.CheckCircle
import androidx.compose.material.icons.filled.Star
import androidx.compose.material.icons.filled.TaskAlt
import androidx.compose.material3.Button
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import ru.rosdom.domain.model.KidTask
import ru.rosdom.domain.model.TaskStatus
import ru.rosdom.ui.components.RosDomEmptyCard
import ru.rosdom.ui.components.RosDomHeroCard
import ru.rosdom.ui.components.RosDomInfoBanner
import ru.rosdom.ui.components.RosDomPageBackground
import ru.rosdom.ui.components.RosDomSectionHeader
import ru.rosdom.ui.components.RosDomStatChip
import ru.rosdom.ui.theme.RosDomAmber
import ru.rosdom.ui.theme.RosDomMint
import ru.rosdom.ui.theme.RosDomPurple

@Composable
fun TasksScreen(
    viewModel: TasksViewModel = androidx.lifecycle.viewmodel.compose.viewModel(factory = TasksViewModel.Factory),
) {
    val state by viewModel.uiState.collectAsStateWithLifecycle()

    RosDomPageBackground {
        if (state.isLoading) {
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
                RosDomHeroCard(
                    eyebrow = "Детский режим",
                    title = "Мои задания",
                    subtitle = if (state.tasks.isEmpty()) {
                        "Сейчас активных заданий нет. Когда взрослый создаст новое, оно появится здесь."
                    } else {
                        "Отмечайте выполнение, отправляйте на проверку и получайте награды после подтверждения."
                    },
                    icon = Icons.Filled.TaskAlt,
                    footer = {
                        Spacer(modifier = Modifier.height(8.dp))
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            RosDomStatChip(
                                icon = Icons.Filled.TaskAlt,
                                label = "${state.tasks.size} активных",
                                accent = RosDomPurple,
                            )
                            RosDomStatChip(
                                icon = Icons.Filled.Star,
                                label = "${state.balance} ₽",
                                accent = RosDomAmber,
                            )
                        }
                    },
                )
            }

            state.error?.let { message ->
                item { RosDomInfoBanner(message = message, accent = RosDomAmber) }
            }

            item {
                RosDomSectionHeader(title = "Список задач")
            }

            if (state.tasks.isEmpty()) {
                item {
                    RosDomEmptyCard(
                        title = "Пока пусто",
                        body = "Здесь будут появляться задания от родителей с наградой за выполнение.",
                    )
                }
            } else {
                items(state.tasks, key = { it.id }) { task ->
                    TaskCard(
                        task = task,
                        onDoneClick = { viewModel.markDone(task.id) },
                    )
                }
            }
        }
    }
}

@Composable
private fun TaskCard(
    task: KidTask,
    onDoneClick: () -> Unit,
) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        shape = MaterialTheme.shapes.extraLarge,
        color = MaterialTheme.colorScheme.surface,
    ) {
        Column(
            modifier = Modifier.padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(12.dp),
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.Top,
            ) {
                Column(
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.spacedBy(6.dp),
                ) {
                    Text(
                        text = task.title,
                        style = MaterialTheme.typography.titleMedium,
                        color = MaterialTheme.colorScheme.onSurface,
                        fontWeight = FontWeight.Bold,
                    )
                    Text(
                        text = task.description,
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
                Spacer(modifier = Modifier.width(12.dp))
                Surface(
                    shape = MaterialTheme.shapes.medium,
                    color = RosDomAmber.copy(alpha = 0.16f),
                ) {
                    Text(
                        text = "+${task.reward.amount} ${task.reward.description}",
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 8.dp),
                        style = MaterialTheme.typography.labelLarge,
                        color = RosDomAmber,
                        fontWeight = FontWeight.Bold,
                    )
                }
            }

            task.roomId?.let { roomId ->
                Text(
                    text = "Комната: $roomId",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                )
            }

            AnimatedVisibility(
                visible = task.targetGridX != null && task.targetGridY != null,
                enter = fadeIn(),
                exit = fadeOut(),
            ) {
                if (task.targetGridX != null && task.targetGridY != null) {
                    Text(
                        text = "Метка на плане: X ${task.targetGridX}, Y ${task.targetGridY}",
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                    )
                }
            }

            when (task.status) {
                TaskStatus.PENDING -> {
                    Button(
                        onClick = onDoneClick,
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Text("Отправить на проверку")
                    }
                }

                TaskStatus.DONE,
                TaskStatus.VERIFIED,
                -> {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp),
                    ) {
                        androidx.compose.material3.Icon(
                            imageVector = Icons.Filled.CheckCircle,
                            contentDescription = null,
                            tint = RosDomMint,
                        )
                        Text(
                            text = when (task.status) {
                                TaskStatus.VERIFIED -> "Задание подтверждено взрослым"
                                TaskStatus.DONE -> "Выполнение отправлено и ждёт проверки"
                                TaskStatus.PENDING -> ""
                            },
                            style = MaterialTheme.typography.bodyMedium,
                            color = RosDomMint,
                            fontWeight = FontWeight.SemiBold,
                        )
                    }
                }
            }
        }
    }
}

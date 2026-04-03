package ru.rosdom.ui.screens.rewards

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.PaddingValues
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.History
import androidx.compose.material.icons.filled.Payments
import androidx.compose.material.icons.filled.Schedule
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import ru.rosdom.data.network.ApiRewardLedgerEntry
import ru.rosdom.ui.components.RosDomEmptyCard
import ru.rosdom.ui.components.RosDomHeroCard
import ru.rosdom.ui.components.RosDomInfoBanner
import ru.rosdom.ui.components.RosDomPageBackground
import ru.rosdom.ui.components.RosDomSectionHeader
import ru.rosdom.ui.components.RosDomStatChip
import ru.rosdom.ui.theme.RosDomAmber
import ru.rosdom.ui.theme.RosDomCritical
import ru.rosdom.ui.theme.RosDomMint
import ru.rosdom.ui.theme.RosDomPurple

@Composable
fun RewardsScreen(
    viewModel: RewardsViewModel = androidx.lifecycle.viewmodel.compose.viewModel(factory = RewardsViewModel.Factory),
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
                    eyebrow = "Награды",
                    title = "${state.balance} ₽",
                    subtitle = "Баланс обновляется после подтверждения выполненных заданий взрослым.",
                    icon = Icons.Filled.Star,
                    footer = {
                        Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                            RosDomStatChip(
                                icon = Icons.Filled.History,
                                label = "${state.ledger.size} записей",
                                accent = RosDomPurple,
                            )
                            RosDomStatChip(
                                icon = Icons.Filled.Payments,
                                label = "Семейный счёт",
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
                RosDomSectionHeader(title = "История начислений")
            }

            if (state.ledger.isEmpty()) {
                item {
                    RosDomEmptyCard(
                        title = "История пока пустая",
                        body = "После подтверждения первых задач здесь появятся начисления, бонусы и события.",
                    )
                }
            } else {
                items(state.ledger, key = { it.id }) { entry ->
                    RewardLedgerCard(entry = entry)
                }
            }
        }
    }
}

@Composable
private fun RewardLedgerCard(entry: ApiRewardLedgerEntry) {
    Surface(
        color = MaterialTheme.colorScheme.surface,
        shape = MaterialTheme.shapes.extraLarge,
        modifier = Modifier.fillMaxWidth(),
    ) {
        Column(
            modifier = Modifier.padding(18.dp),
            verticalArrangement = Arrangement.spacedBy(10.dp),
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically,
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(10.dp),
                ) {
                    Surface(
                        shape = MaterialTheme.shapes.medium,
                        color = Color.White.copy(alpha = 0.04f),
                    ) {
                        Icon(
                            imageVector = when (entry.entryType) {
                                "time" -> Icons.Filled.Schedule
                                "event" -> Icons.Filled.History
                                else -> Icons.Filled.Payments
                            },
                            contentDescription = null,
                            tint = RosDomPurple,
                            modifier = Modifier
                                .padding(10.dp)
                                .size(18.dp),
                        )
                    }
                    Column(verticalArrangement = Arrangement.spacedBy(4.dp)) {
                        Text(
                            text = entry.description,
                            style = MaterialTheme.typography.titleMedium,
                            color = MaterialTheme.colorScheme.onSurface,
                            fontWeight = FontWeight.SemiBold,
                        )
                        Text(
                            text = when (entry.entryType) {
                                "money" -> "Денежная награда"
                                "time" -> "Дополнительное время"
                                "event" -> "Событийная награда"
                                else -> "Начисление"
                            },
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                        )
                    }
                }

                Text(
                    text = if (entry.delta >= 0) "+${entry.delta}" else entry.delta.toString(),
                    color = if (entry.delta >= 0) RosDomMint else RosDomCritical,
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold,
                )
            }

            Text(
                text = entry.createdAt,
                style = MaterialTheme.typography.bodySmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
            )
        }
    }
}

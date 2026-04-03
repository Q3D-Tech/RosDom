package ru.rosdom.ui.screens.scenarios

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ScenariosScreen() {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Сценарии") },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = Color(0xFF16161A),
                    titleContentColor = Color.White
                )
            )
        },
        containerColor = Color(0xFF0A0A0C)
    ) { padding ->
        Column(modifier = Modifier.padding(padding).fillMaxSize().padding(16.dp)) {
            // Stub for scenario card
            Surface(
                color = Color(0xFF232329),
                shape = MaterialTheme.shapes.medium,
                modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp)
            ) {
                Row(
                    modifier = Modifier.padding(16.dp).fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = androidx.compose.ui.Alignment.CenterVertically
                ) {
                    Column {
                        Text("Утро", style = MaterialTheme.typography.titleMedium, color = Color.White)
                        Text("Включает свет, открывает шторы", color = Color.Gray, style = MaterialTheme.typography.bodySmall)
                    }
                    Switch(checked = true, onCheckedChange = {})
                }
            }
        }
    }
}

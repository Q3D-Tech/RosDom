package ru.rosdom.ui.core

import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.padding
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.LinearProgressIndicator
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Slider
import androidx.compose.material3.Switch
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import ru.rosdom.domain.model.Capability
import ru.rosdom.domain.model.Device

@Composable
fun DeviceCapabilityRenderer(
    device: Device,
    isPending: Boolean,
    onCapabilityChange: (Capability) -> Unit,
    modifier: Modifier = Modifier,
) {
    Column(modifier = modifier.padding(16.dp)) {
        if (isPending) {
            LinearProgressIndicator(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(bottom = 8.dp),
            )
        }

        device.capabilities.forEach { capability ->
            when (capability) {
                is Capability.Power -> {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 8.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Text("Питание", style = MaterialTheme.typography.bodyLarge, color = Color.White)
                        Switch(
                            checked = capability.isOn,
                            onCheckedChange = { onCapabilityChange(capability.copy(isOn = it)) },
                            enabled = !isPending,
                        )
                    }
                }

                is Capability.Brightness -> {
                    var sliderValue by remember(capability.level) {
                        mutableFloatStateOf(capability.level.toFloat())
                    }
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 8.dp),
                    ) {
                        Text("Яркость: ${sliderValue.toInt()}%", color = Color.White)
                        Slider(
                            value = sliderValue,
                            onValueChange = { sliderValue = it },
                            onValueChangeFinished = {
                                onCapabilityChange(capability.copy(level = sliderValue.toInt()))
                            },
                            valueRange = capability.min.toFloat()..capability.max.toFloat(),
                            enabled = !isPending,
                        )
                    }
                }

                is Capability.ColorTemperature -> {
                    var sliderValue by remember(capability.temperatureK) {
                        mutableFloatStateOf(capability.temperatureK.toFloat())
                    }
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 8.dp),
                    ) {
                        Text("Температура света: ${sliderValue.toInt()}K", color = Color.White)
                        Slider(
                            value = sliderValue,
                            onValueChange = { sliderValue = it },
                            onValueChangeFinished = {
                                onCapabilityChange(capability.copy(temperatureK = sliderValue.toInt()))
                            },
                            valueRange = capability.minK.toFloat()..capability.maxK.toFloat(),
                            enabled = !isPending,
                        )
                    }
                }

                is Capability.Temperature -> {
                    Text(
                        text = "Температура: ${capability.celsius}°C",
                        style = MaterialTheme.typography.bodyLarge,
                        color = Color.White,
                        modifier = Modifier.padding(vertical = 8.dp),
                    )
                }

                is Capability.Humidity -> {
                    Text(
                        text = "Влажность: ${capability.percentage}%",
                        style = MaterialTheme.typography.bodyLarge,
                        color = Color.White,
                        modifier = Modifier.padding(vertical = 8.dp),
                    )
                }

                is Capability.Lock -> {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 8.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically,
                    ) {
                        Text(
                            if (capability.isLocked) "Замок закрыт" else "Замок открыт",
                            style = MaterialTheme.typography.bodyLarge,
                            color = Color.White,
                        )
                        Button(
                            onClick = { onCapabilityChange(capability.copy(isLocked = !capability.isLocked)) },
                            enabled = !isPending,
                            colors = ButtonDefaults.buttonColors(
                                containerColor = if (capability.isLocked) Color.DarkGray else Color(0xFFB00020),
                            ),
                        ) {
                            Text(if (capability.isLocked) "Открыть" else "Закрыть")
                        }
                    }
                }

                is Capability.Motion -> {
                    Text(
                        text = if (capability.isDetected) "Движение обнаружено" else "Движение не обнаружено",
                        color = Color.White,
                        modifier = Modifier.padding(vertical = 8.dp),
                    )
                }

                is Capability.Contact -> {
                    Text(
                        text = if (capability.isOpen) "Контакт открыт" else "Контакт закрыт",
                        color = Color.White,
                        modifier = Modifier.padding(vertical = 8.dp),
                    )
                }

                is Capability.Rgb -> {
                    Text(
                        text = "Цвет: ${capability.hexColor}",
                        color = Color.White,
                        modifier = Modifier.padding(vertical = 8.dp),
                    )
                }
            }
        }

        if (device.capabilities.isEmpty()) {
            Text(
                text = "Для этого устройства ещё не синхронизированы capability-поля.",
                color = Color(0xFFB0B0BC),
            )
        }
    }
}

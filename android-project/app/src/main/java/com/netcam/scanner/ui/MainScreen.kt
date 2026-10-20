package com.netcam.scanner.ui

import android.content.Intent
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.PlayArrow
import androidx.compose.material.icons.filled.Share
import androidx.compose.material.icons.filled.Stop
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.netcam.scanner.model.DiscoveredCamera
import com.netcam.scanner.scanner.NetworkScanner
import com.netcam.scanner.scanner.SubnetUtils
import com.netcam.scanner.ui.components.CameraCard
import com.netcam.scanner.ui.components.CameraDetailDialog
import com.netcam.scanner.ui.theme.*
import kotlinx.coroutines.flow.collectLatest

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MainScreen(scanner: NetworkScanner) {
    val context = LocalContext.current

    var subnetInput by remember { mutableStateOf(SubnetUtils.getDefaultSubnetCidr()) }
    var isScanning by remember { mutableStateOf(false) }
    var scannedHosts by remember { mutableIntStateOf(0) }
    var totalHosts by remember { mutableIntStateOf(254) }
    var currentProbingIp by remember { mutableStateOf("") }

    val devices = remember { mutableStateListOf<DiscoveredCamera>() }
    var selectedCamera by remember { mutableStateOf<DiscoveredCamera?>(null) }
    var selectedCategoryFilter by remember { mutableStateOf("all") }

    // Collect discovered devices from scanner SharedFlow
    LaunchedEffect(scanner) {
        scanner.deviceFlow.collectLatest { dev ->
            val index = devices.indexOfFirst { it.ip == dev.ip }
            if (index >= 0) {
                devices[index] = dev
            } else {
                devices.add(dev)
            }
        }
    }

    val displayedDevices = devices.filter {
        selectedCategoryFilter == "all" || it.category == selectedCategoryFilter
    }

    val categories = listOf(
        Pair("all", "Все устройства (${devices.size})"),
        Pair("camera", "📹 Камеры (${devices.count { it.isCamera }})"),
        Pair("router", "🌐 Роутеры (${devices.count { it.category == "router" }})"),
        Pair("workstation", "💻 Компьютеры (${devices.count { it.category == "workstation" }})"),
        Pair("printer", "🖨 Принтеры (${devices.count { it.category == "printer" }})"),
        Pair("tv-media", "📺 Smart TV (${devices.count { it.category == "tv-media" }})"),
        Pair("nas-iot", "🏠 NAS/IoT (${devices.count { it.category == "nas-iot" }})")
    )

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Text(
                            text = "NetScanner Android",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            color = TextPrimary
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Surface(
                            shape = RoundedCornerShape(6.dp),
                            color = CyanPrimary.copy(alpha = 0.15f)
                        ) {
                            Text(
                                text = "Все устройства",
                                fontSize = 10.sp,
                                color = CyanPrimary,
                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                            )
                        }
                    }
                },
                actions = {
                    IconButton(onClick = {
                        val sb = StringBuilder("#EXTM3U\n")
                        devices.filter { it.isCamera }.forEach { cam ->
                            sb.append("#EXTINF:-1,${cam.vendor} (${cam.ip})\n")
                            sb.append("${cam.rtspMainUrl}\n")
                        }
                        val shareIntent = Intent(Intent.ACTION_SEND).apply {
                            type = "text/plain"
                            putExtra(Intent.EXTRA_SUBJECT, "IP Cameras M3U")
                            putExtra(Intent.EXTRA_TEXT, sb.toString())
                        }
                        context.startActivity(Intent.createChooser(shareIntent, "Экспорт плейлиста для VLC"))
                    }) {
                        Icon(Icons.Default.Share, contentDescription = "Share M3U", tint = CyanPrimary)
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = BackgroundDark)
            )
        },
        containerColor = BackgroundDark
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp)
        ) {
            // Scanner Configuration Card
            Card(
                shape = RoundedCornerShape(16.dp),
                colors = CardDefaults.cardColors(containerColor = CardDark),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text(
                        text = "Подсеть для поиска всех устройств (CIDR):",
                        fontSize = 12.sp,
                        color = TextSecondary
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    OutlinedTextField(
                        value = subnetInput,
                        onValueChange = { subnetInput = it },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true,
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = CyanPrimary,
                            unfocusedBorderColor = BorderDark
                        )
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    // Scan / Stop button
                    Button(
                        onClick = {
                            if (isScanning) {
                                scanner.stopScan()
                                isScanning = false
                            } else {
                                devices.clear()
                                isScanning = true
                                scannedHosts = 0
                                scanner.startScan(
                                    subnetCidr = subnetInput,
                                    onProgress = { scanned, total, curIp ->
                                        scannedHosts = scanned
                                        totalHosts = total
                                        currentProbingIp = curIp
                                    },
                                    onComplete = {
                                        isScanning = false
                                    }
                                )
                            }
                        },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = if (isScanning) MaterialTheme.colorScheme.error else CyanPrimary
                        ),
                        shape = RoundedCornerShape(12.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Icon(
                            imageVector = if (isScanning) Icons.Default.Stop else Icons.Default.PlayArrow,
                            contentDescription = null
                        )
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            text = if (isScanning) "Остановить ($scannedHosts/$totalHosts)" else "Сканировать все устройства сети",
                            fontWeight = FontWeight.Bold
                        )
                    }

                    // Progress bar
                    if (isScanning) {
                        Spacer(modifier = Modifier.height(10.dp))
                        LinearProgressIndicator(
                            progress = { if (totalHosts > 0) scannedHosts.toFloat() / totalHosts else 0f },
                            modifier = Modifier.fillMaxWidth(),
                            color = CyanPrimary
                        )
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "Проверка: $currentProbingIp",
                            fontSize = 10.sp,
                            fontFamily = FontFamily.Monospace,
                            color = TextSecondary
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(12.dp))

            // Category Filter Row
            LazyRow(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                items(categories) { (catId, label) ->
                    val isSelected = selectedCategoryFilter == catId
                    FilterChip(
                        selected = isSelected,
                        onClick = { selectedCategoryFilter = catId },
                        label = { Text(label, fontSize = 11.sp) },
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = CyanPrimary,
                            selectedLabelColor = BackgroundDark,
                            containerColor = CardDark,
                            labelColor = TextSecondary
                        )
                    )
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Camera / Device List
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                verticalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                items(displayedDevices, key = { it.ip }) { cam ->
                    CameraCard(
                        camera = cam,
                        onOpenDetails = { selectedCamera = it }
                    )
                }
            }
        }

        // Camera / Device Details Dialog
        selectedCamera?.let { cam ->
            CameraDetailDialog(
                camera = cam,
                onDismiss = { selectedCamera = null }
            )
        }
    }
}

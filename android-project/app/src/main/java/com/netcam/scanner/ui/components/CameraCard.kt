package com.netcam.scanner.ui.components

import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.netcam.scanner.model.DiscoveredCamera
import com.netcam.scanner.ui.theme.*

@Composable
fun CameraCard(
    camera: DiscoveredCamera,
    onOpenDetails: (DiscoveredCamera) -> Unit
) {
    val context = LocalContext.current

    val iconVector = when (camera.category) {
        "camera" -> Icons.Default.Videocam
        "router" -> Icons.Default.Router
        "workstation" -> Icons.Default.Computer
        "printer" -> Icons.Default.Print
        "tv-media" -> Icons.Default.Tv
        "nas-iot" -> Icons.Default.Home
        else -> Icons.Default.Devices
    }

    val iconColor = when (camera.category) {
        "camera" -> CyanPrimary
        "router" -> AccentGreen
        "workstation" -> Color(0xFF38BDF8)
        "printer" -> AccentAmber
        "tv-media" -> Color(0xFFA855F7)
        else -> TextSecondary
    }

    Card(
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = CardDark),
        modifier = Modifier
            .fillMaxWidth()
            .border(1.dp, if (camera.isCamera) CyanPrimary.copy(alpha = 0.5f) else BorderDark, RoundedCornerShape(16.dp))
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            // Header: IP, Vendor, and Risk Badge
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier
                            .size(40.dp)
                            .background(iconColor.copy(alpha = 0.15f), RoundedCornerShape(10.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        Icon(
                            imageVector = iconVector,
                            contentDescription = "Device",
                            tint = iconColor,
                            modifier = Modifier.size(24.dp)
                        )
                    }
                    Spacer(modifier = Modifier.width(12.dp))
                    Column {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Text(
                                text = camera.ip,
                                fontSize = 16.sp,
                                fontWeight = FontWeight.Bold,
                                fontFamily = FontFamily.Monospace,
                                color = TextPrimary
                            )
                            if (camera.riskLevel == "critical") {
                                Spacer(modifier = Modifier.width(6.dp))
                                Surface(
                                    shape = RoundedCornerShape(6.dp),
                                    color = Color(0xFFE11D48).copy(alpha = 0.2f),
                                    border = ButtonDefaults.outlinedButtonBorder
                                ) {
                                    Text(
                                        text = "КРИТИЧЕСКИЙ РИСК",
                                        fontSize = 9.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = Color(0xFFFB7185),
                                        modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp)
                                    )
                                }
                            } else if (camera.riskLevel == "high") {
                                Spacer(modifier = Modifier.width(6.dp))
                                Surface(
                                    shape = RoundedCornerShape(6.dp),
                                    color = Color(0xFFEA580C).copy(alpha = 0.2f),
                                    border = ButtonDefaults.outlinedButtonBorder
                                ) {
                                    Text(
                                        text = "ВЫСОКИЙ РИСК",
                                        fontSize = 9.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = Color(0xFFFB923C),
                                        modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp)
                                    )
                                }
                            }
                        }
                        Text(
                            text = camera.vendor,
                            fontSize = 12.sp,
                            color = iconColor,
                            fontWeight = FontWeight.Medium
                        )
                    }
                }

                // Latency Badge
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = BackgroundDark,
                    border = ButtonDefaults.outlinedButtonBorder
                ) {
                    Text(
                        text = "${camera.latencyMs} мс",
                        fontSize = 11.sp,
                        color = AccentGreen,
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                        fontFamily = FontFamily.Monospace
                    )
                }
            }

            Spacer(modifier = Modifier.height(10.dp))

            // Model / Title
            if (camera.httpTitle != null || camera.model.isNotEmpty()) {
                Text(
                    text = camera.httpTitle ?: camera.model,
                    fontSize = 12.sp,
                    color = TextSecondary,
                    maxLines = 1
                )
                Spacer(modifier = Modifier.height(8.dp))
            }

            // Open Ports Chips (Clickable to open in browser for Web ports!)
            Text(
                text = "Открытые порты (нажмите для открытия веб-интерфейса):",
                fontSize = 10.sp,
                color = TextSecondary
            )
            Spacer(modifier = Modifier.height(4.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(6.dp)
            ) {
                camera.openPorts.take(6).forEach { portInfo ->
                    val isWeb = portInfo.port == 80 || portInfo.port == 443 || portInfo.port == 8080 || portInfo.port == 8000 || portInfo.port == 5000 || portInfo.port == 8123
                    val chipColor = when {
                        portInfo.port == 23 -> Color(0xFFE11D48).copy(alpha = 0.25f)
                        isWeb -> AccentGreen.copy(alpha = 0.2f)
                        portInfo.port == 554 || portInfo.port == 8554 -> CyanPrimary.copy(alpha = 0.2f)
                        portInfo.port == 445 || portInfo.port == 3389 -> Color(0xFF38BDF8).copy(alpha = 0.2f)
                        portInfo.port == 37777 || portInfo.port == 34567 -> Color(0xFF8B5CF6).copy(alpha = 0.2f)
                        else -> BackgroundDark
                    }
                    val textColor = when {
                        portInfo.port == 23 -> Color(0xFFFB7185)
                        isWeb -> AccentGreen
                        portInfo.port == 554 || portInfo.port == 8554 -> CyanPrimary
                        portInfo.port == 445 || portInfo.port == 3389 -> Color(0xFF38BDF8)
                        portInfo.port == 37777 || portInfo.port == 34567 -> Color(0xFFA78BFA)
                        else -> TextSecondary
                    }

                    Surface(
                        shape = RoundedCornerShape(6.dp),
                        color = chipColor,
                        border = ButtonDefaults.outlinedButtonBorder,
                        modifier = Modifier.clickable {
                            if (isWeb) {
                                val protocol = if (portInfo.port == 443) "https" else "http"
                                val url = if (portInfo.port == 80) "http://${camera.ip}" else if (portInfo.port == 443) "https://${camera.ip}" else "$protocol://${camera.ip}:${portInfo.port}"
                                launchBrowser(context, url)
                            } else {
                                Toast.makeText(context, "Порт ${portInfo.port} (${portInfo.service})", Toast.LENGTH_SHORT).show()
                            }
                        }
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 3.dp)
                        ) {
                            Text(
                                text = "${portInfo.port} ${portInfo.service}",
                                fontSize = 10.sp,
                                fontFamily = FontFamily.Monospace,
                                fontWeight = FontWeight.Bold,
                                color = textColor
                            )
                            if (isWeb) {
                                Spacer(modifier = Modifier.width(3.dp))
                                Icon(Icons.Default.OpenInBrowser, contentDescription = "Web", tint = AccentGreen, modifier = Modifier.size(10.dp))
                            }
                        }
                    }
                }
            }

            // Security Vulnerabilities Warning Callout
            if (camera.securityIssues.isNotEmpty()) {
                Spacer(modifier = Modifier.height(10.dp))
                Surface(
                    shape = RoundedCornerShape(8.dp),
                    color = if (camera.riskLevel == "critical") Color(0xFF4C0519).copy(alpha = 0.6f) else Color(0xFF431407).copy(alpha = 0.6f),
                    border = ButtonDefaults.outlinedButtonBorder,
                    modifier = Modifier.fillMaxWidth().clickable { onOpenDetails(camera) }
                ) {
                    Row(
                        modifier = Modifier.padding(horizontal = 10.dp, vertical = 6.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Icon(
                            Icons.Default.Warning,
                            contentDescription = "Alert",
                            tint = if (camera.riskLevel == "critical") Color(0xFFFB7185) else Color(0xFFFB923C),
                            modifier = Modifier.size(14.dp)
                        )
                        Spacer(modifier = Modifier.width(6.dp))
                        Text(
                            text = "Найдено уязвимостей: ${camera.securityIssues.size} (нажмите для анализа)",
                            fontSize = 11.sp,
                            fontWeight = FontWeight.SemiBold,
                            color = if (camera.riskLevel == "critical") Color(0xFFFECDD3) else Color(0xFFFED7AA)
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(14.dp))

            // Action Buttons: RTSP, Web UI (Browser), Settings
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                // Launch RTSP Video Stream if camera
                if (camera.rtspMainUrl.isNotEmpty()) {
                    Button(
                        onClick = {
                            launchRtspPlayer(context, camera.rtspMainUrl)
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = CyanPrimary),
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier.weight(1f)
                    ) {
                        Icon(Icons.Default.PlayArrow, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(text = "RTSP Стрим", fontSize = 11.sp, color = BackgroundDark, fontWeight = FontWeight.Bold)
                    }
                }

                // Click to Open in Browser
                if (camera.webUiUrl != null) {
                    OutlinedButton(
                        onClick = {
                            launchBrowser(context, camera.webUiUrl)
                        },
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier.weight(1f),
                        colors = ButtonDefaults.outlinedButtonColors(contentColor = AccentGreen)
                    ) {
                        Icon(Icons.Default.OpenInBrowser, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(text = "В браузере", fontSize = 11.sp, fontWeight = FontWeight.SemiBold)
                    }
                }

                // Settings & Full Security Analysis
                OutlinedButton(
                    onClick = { onOpenDetails(camera) },
                    shape = RoundedCornerShape(10.dp),
                    colors = ButtonDefaults.outlinedButtonColors(contentColor = TextPrimary)
                ) {
                    Icon(Icons.Default.Security, contentDescription = null, modifier = Modifier.size(16.dp))
                    Spacer(modifier = Modifier.width(4.dp))
                    Text(text = "Аудит", fontSize = 11.sp)
                }
            }
        }
    }
}

private fun launchBrowser(context: Context, url: String) {
    try {
        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(url)).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        context.startActivity(intent)
    } catch (_: Exception) {
        Toast.makeText(context, "Не удалось открыть браузер для $url", Toast.LENGTH_SHORT).show()
    }
}

private fun launchRtspPlayer(context: Context, rtspUrl: String) {
    try {
        val uri = Uri.parse(rtspUrl)
        val intent = Intent(Intent.ACTION_VIEW).apply {
            setDataAndType(uri, "video/*")
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        context.startActivity(intent)
    } catch (_: Exception) {
        try {
            val vlcIntent = Intent(Intent.ACTION_VIEW).apply {
                setPackage("org.videolan.vlc")
                setDataAndType(Uri.parse(rtspUrl), "video/*")
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(vlcIntent)
        } catch (_: Exception) {
            Toast.makeText(context, "Установите VLC или видеоплеер для воспроизведения RTSP", Toast.LENGTH_LONG).show()
        }
    }
}

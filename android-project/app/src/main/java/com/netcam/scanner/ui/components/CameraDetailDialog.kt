package com.netcam.scanner.ui.components

import android.content.ClipData
import android.content.ClipboardManager
import android.content.Context
import android.content.Intent
import android.net.Uri
import android.widget.Toast
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.window.Dialog
import com.netcam.scanner.model.DiscoveredCamera
import com.netcam.scanner.scanner.CameraFingerprint
import com.netcam.scanner.ui.theme.*

@Composable
fun CameraDetailDialog(
    camera: DiscoveredCamera,
    onDismiss: () -> Unit
) {
    val context = LocalContext.current
    var username by remember { mutableStateOf("admin") }
    var password by remember { mutableStateOf("admin") }

    val currentRtsp = CameraFingerprint.buildRtspUrl(
        camera.ip,
        if (camera.vendor.contains("Hikvision")) "/Streaming/Channels/101"
        else if (camera.vendor.contains("Dahua")) "/cam/realmonitor?channel=1&subtype=0"
        else if (camera.vendor.contains("Xiongmai")) "/user=${username}_password=${password}_channel=1_stream=0.sdp"
        else "/live/ch0",
        username,
        password
    )

    Dialog(onDismissRequest = onDismiss) {
        Card(
            shape = RoundedCornerShape(20.dp),
            colors = CardDefaults.cardColors(containerColor = SurfaceDark),
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 16.dp)
        ) {
            Column(
                modifier = Modifier
                    .padding(20.dp)
                    .verticalScroll(rememberScrollState())
            ) {
                // Header
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text(
                            text = camera.vendor,
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            color = CyanPrimary
                        )
                        Text(
                            text = "${camera.ip} (${camera.category})",
                            fontSize = 14.sp,
                            fontFamily = FontFamily.Monospace,
                            color = TextSecondary
                        )
                    }
                    IconButton(onClick = onDismiss) {
                        Icon(Icons.Default.Close, contentDescription = "Close", tint = TextSecondary)
                    }
                }

                Spacer(modifier = Modifier.height(14.dp))

                // Security & Vulnerability Audit Report
                if (camera.securityIssues.isNotEmpty()) {
                    Text(
                        text = "Анализ уязвимостей (${camera.securityIssues.size}):",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.Bold,
                        color = if (camera.riskLevel == "critical") Color(0xFFFB7185) else Color(0xFFFB923C)
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Column(verticalArrangement = Arrangement.spacedBy(8.dp)) {
                        camera.securityIssues.forEach { issue ->
                            val sevColor = when (issue.severity) {
                                "critical" -> Color(0xFFE11D48)
                                "high" -> Color(0xFFEA580C)
                                "medium" -> Color(0xFFD97706)
                                else -> Color(0xFF0284C7)
                            }

                            Surface(
                                shape = RoundedCornerShape(10.dp),
                                color = BackgroundDark,
                                border = ButtonDefaults.outlinedButtonBorder,
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(modifier = Modifier.padding(10.dp)) {
                                    Row(verticalAlignment = Alignment.CenterVertically) {
                                        Surface(
                                            shape = RoundedCornerShape(4.dp),
                                            color = sevColor.copy(alpha = 0.2f)
                                        ) {
                                            Text(
                                                text = issue.severity.uppercase(),
                                                fontSize = 9.sp,
                                                fontWeight = FontWeight.Bold,
                                                color = sevColor,
                                                modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp)
                                            )
                                        }
                                        if (issue.port != null) {
                                            Spacer(modifier = Modifier.width(6.dp))
                                            Text(
                                                text = "Порт ${issue.port}",
                                                fontSize = 10.sp,
                                                fontFamily = FontFamily.Monospace,
                                                color = TextSecondary
                                            )
                                        }
                                        Spacer(modifier = Modifier.width(6.dp))
                                        Text(
                                            text = issue.title,
                                            fontSize = 11.sp,
                                            fontWeight = FontWeight.Bold,
                                            color = TextPrimary
                                        )
                                    }
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text(
                                        text = issue.description,
                                        fontSize = 10.sp,
                                        color = TextSecondary,
                                        lineHeight = 14.sp
                                    )
                                    Spacer(modifier = Modifier.height(4.dp))
                                    Text(
                                        text = "Устранение: ${issue.remediation}",
                                        fontSize = 10.sp,
                                        color = AccentGreen,
                                        lineHeight = 14.sp
                                    )
                                }
                            }
                        }
                    }
                    Spacer(modifier = Modifier.height(14.dp))
                }

                // Open in Browser Actions
                if (camera.webUiUrl != null) {
                    Button(
                        onClick = {
                            val intent = Intent(Intent.ACTION_VIEW, Uri.parse(camera.webUiUrl)).apply {
                                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
                            }
                            context.startActivity(intent)
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = AccentGreen),
                        shape = RoundedCornerShape(10.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Icon(Icons.Default.OpenInBrowser, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Открыть Web UI в браузере (${camera.webUiUrl})", fontSize = 12.sp, color = BackgroundDark, fontWeight = FontWeight.Bold)
                    }
                    Spacer(modifier = Modifier.height(14.dp))
                }

                // Credentials inputs for RTSP
                if (camera.isCamera) {
                    Text(
                        text = "Авторизация RTSP",
                        fontSize = 13.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = TextPrimary
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(
                        value = username,
                        onValueChange = { username = it },
                        label = { Text("Логин") },
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = CyanPrimary,
                            unfocusedBorderColor = BorderDark
                        )
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    OutlinedTextField(
                        value = password,
                        onValueChange = { password = it },
                        label = { Text("Пароль") },
                        modifier = Modifier.fillMaxWidth(),
                        colors = OutlinedTextFieldDefaults.colors(
                            focusedBorderColor = CyanPrimary,
                            unfocusedBorderColor = BorderDark
                        )
                    )

                    Spacer(modifier = Modifier.height(14.dp))

                    // RTSP URL
                    Text(
                        text = "RTSP Ссылка для плеера:",
                        fontSize = 12.sp,
                        color = TextSecondary
                    )
                    Spacer(modifier = Modifier.height(6.dp))
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .background(BackgroundDark, RoundedCornerShape(10.dp))
                            .padding(12.dp)
                    ) {
                        Text(
                            text = currentRtsp,
                            fontFamily = FontFamily.Monospace,
                            fontSize = 11.sp,
                            color = CyanPrimary
                        )
                    }

                    Spacer(modifier = Modifier.height(12.dp))

                    Button(
                        onClick = {
                            val clipboard = context.getSystemService(Context.CLIPBOARD_SERVICE) as ClipboardManager
                            val clip = ClipData.newPlainText("RTSP URL", currentRtsp)
                            clipboard.setPrimaryClip(clip)
                            Toast.makeText(context, "RTSP ссылка скопирована!", Toast.LENGTH_SHORT).show()
                        },
                        colors = ButtonDefaults.buttonColors(containerColor = CyanPrimary),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Icon(Icons.Default.ContentCopy, contentDescription = null, modifier = Modifier.size(16.dp))
                        Spacer(modifier = Modifier.width(6.dp))
                        Text("Копировать RTSP ссылку", fontSize = 12.sp, color = BackgroundDark)
                    }
                }
            }
        }
    }
}

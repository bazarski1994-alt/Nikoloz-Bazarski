package com.netcam.scanner.scanner

import com.netcam.scanner.model.DiscoveredCamera
import com.netcam.scanner.model.OpenPortInfo
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.SharedFlow
import java.io.BufferedReader
import java.io.InputStreamReader
import java.net.HttpURLConnection
import java.net.InetSocketAddress
import java.net.Socket
import java.net.URL
import kotlin.math.min

class NetworkScanner {

    private val _deviceFlow = MutableSharedFlow<DiscoveredCamera>(extraBufferCapacity = 64)
    val deviceFlow: SharedFlow<DiscoveredCamera> = _deviceFlow

    private var scanJob: Job? = null

    // Comprehensive ports to discover all devices: computers, routers, TVs, printers, NAS, cameras, and vulnerable services
    val defaultPorts = listOf(80, 443, 445, 22, 23, 21, 53, 554, 8080, 8000, 3389, 9100, 37777, 34567, 8899, 5000, 8008, 1883)

    private val portServices = mapOf(
        80 to "HTTP",
        443 to "HTTPS",
        445 to "SMB",
        22 to "SSH",
        23 to "Telnet",
        21 to "FTP",
        53 to "DNS",
        554 to "RTSP",
        8554 to "RTSP-Alt",
        8080 to "HTTP-Alt",
        8000 to "Hikvision",
        3389 to "RDP",
        9100 to "Print-RAW",
        37777 to "Dahua-DVR",
        34567 to "XM-NetIP",
        8899 to "ONVIF-Soap",
        5000 to "Synology/UPnP",
        8008 to "Google-Cast",
        1883 to "MQTT"
    )

    /**
     * Probes a single TCP port using standard java.net.Socket
     */
    private fun probePort(ip: String, port: Int, timeoutMs: Int = 450): Pair<Boolean, Long> {
        val start = System.currentTimeMillis()
        var socket: Socket? = null
        return try {
            socket = Socket()
            socket.connect(InetSocketAddress(ip, port), timeoutMs)
            val latency = System.currentTimeMillis() - start
            Pair(true, latency)
        } catch (_: Exception) {
            Pair(false, timeoutMs.toLong())
        } finally {
            try {
                socket?.close()
            } catch (_: Exception) {
            }
        }
    }

    /**
     * Optional lightweight HTTP banner grabber
     */
    private fun fetchHttpTitle(ip: String, port: Int): String? {
        return try {
            val url = URL("http://$ip:$port/")
            val conn = url.openConnection() as HttpURLConnection
            conn.connectTimeout = 600
            conn.readTimeout = 600
            conn.instanceFollowRedirects = false
            conn.requestMethod = "GET"
            conn.setRequestProperty("User-Agent", "NetCamScanner/1.0")

            val server = conn.getHeaderField("Server") ?: conn.getHeaderField("WWW-Authenticate")
            val reader = BufferedReader(InputStreamReader(conn.inputStream))
            val sb = StringBuilder()
            var line: String?
            var count = 0
            while (reader.readLine().also { line = it } != null && count < 50) {
                sb.append(line)
                count++
            }
            reader.close()
            conn.disconnect()

            val titleMatch = Regex("<title[^>]*>([^<]+)</title>", RegexOption.IGNORE_CASE).find(sb.toString())
            val title = titleMatch?.groupValues?.get(1)?.trim()
            title ?: server
        } catch (_: Exception) {
            null
        }
    }

    /**
     * Scans a single IP host across standard ports
     */
    suspend fun scanHost(ip: String, ports: List<Int> = defaultPorts, timeoutMs: Int = 450): DiscoveredCamera? = withContext(Dispatchers.IO) {
        val openPorts = mutableListOf<OpenPortInfo>()
        var minLatency = 9999L

        for (port in ports) {
            if (!isActive) return@withContext null
            val (open, latency) = probePort(ip, port, timeoutMs)
            if (open) {
                minLatency = min(minLatency, latency)
                val srv = portServices[port] ?: "TCP-$port"
                val isCam = port == 554 || port == 8554 || port == 8000 || port == 37777 || port == 34567 || port == 8899
                openPorts.add(OpenPortInfo(port, srv, isCam))
            }
        }

        if (openPorts.isEmpty()) {
            return@withContext null
        }

        val httpTitle = if (openPorts.any { it.port == 80 || it.port == 8080 }) {
            fetchHttpTitle(ip, openPorts.first { it.port == 80 || it.port == 8080 }.port)
        } else null

        val traits = CameraFingerprint.identify(openPorts, httpTitle ?: "")
        val (securityIssues, riskLevel) = CameraFingerprint.auditSecurity(ip, openPorts, traits.vendor, traits.isCamera)

        val mainRtsp = if (traits.isCamera) {
            CameraFingerprint.buildRtspUrl(ip, traits.mainPath, "admin", "admin")
        } else ""
        val subRtsp = if (traits.isCamera) {
            CameraFingerprint.buildRtspUrl(ip, traits.subPath, "admin", "admin")
        } else ""

        val webUrl = if (openPorts.any { it.port == 80 }) "http://$ip"
            else if (openPorts.any { it.port == 8080 }) "http://$ip:8080"
            else if (openPorts.any { it.port == 443 }) "https://$ip"
            else null

        DiscoveredCamera(
            id = ip,
            ip = ip,
            vendor = traits.vendor,
            model = traits.model,
            category = traits.category,
            isCamera = traits.isCamera,
            confidence = traits.confidence,
            openPorts = openPorts,
            latencyMs = if (minLatency == 9999L) 10L else minLatency,
            rtspMainUrl = mainRtsp,
            rtspSubUrl = subRtsp,
            httpTitle = httpTitle,
            webUiUrl = webUrl,
            riskLevel = riskLevel,
            securityIssues = securityIssues
        )
    }

    /**
     * Scans an entire subnet with concurrent coroutines pool
     */
    fun startScan(
        subnetCidr: String,
        ports: List<Int> = defaultPorts,
        concurrency: Int = 16,
        onProgress: (scanned: Int, total: Int, currentIp: String) -> Unit,
        onComplete: () -> Unit
    ) {
        stopScan()
        scanJob = CoroutineScope(Dispatchers.IO).launch {
            val ips = SubnetUtils.generateSubnetIps(subnetCidr)
            val total = ips.size
            var scannedCount = 0

            // Chunked concurrent execution
            ips.chunked(concurrency).forEach { chunk ->
                if (!isActive) return@launch
                val deferreds = chunk.map { ip ->
                    async {
                        val cam = scanHost(ip, ports)
                        scannedCount++
                        onProgress(scannedCount, total, ip)
                        if (cam != null) {
                            _deviceFlow.emit(cam)
                        }
                    }
                }
                deferreds.awaitAll()
            }
            onComplete()
        }
    }

    fun stopScan() {
        scanJob?.cancel()
        scanJob = null
    }
}

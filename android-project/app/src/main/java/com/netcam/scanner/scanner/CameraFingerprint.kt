package com.netcam.scanner.scanner

import com.netcam.scanner.model.OpenPortInfo
import com.netcam.scanner.model.SecurityIssue

object CameraFingerprint {

    data class VendorResult(
        val vendor: String,
        val model: String,
        val category: String,
        val isCamera: Boolean,
        val confidence: Int,
        val mainPath: String,
        val subPath: String
    )

    fun identify(openPorts: List<OpenPortInfo>, bannerText: String = ""): VendorResult {
        val ports = openPorts.map { it.port }.toSet()
        val text = bannerText.lowercase()

        // 1. Hikvision
        if (ports.contains(8000) || text.contains("hikvision") || text.contains("dvrdvs-webs")) {
            return VendorResult(
                vendor = "Hikvision",
                model = "Hikvision IP Camera / NVR",
                category = "camera",
                isCamera = true,
                confidence = 98,
                mainPath = "/Streaming/Channels/101",
                subPath = "/Streaming/Channels/102"
            )
        }

        // 2. Dahua
        if (ports.contains(37777) || ports.contains(37778) || text.contains("dahua") || text.contains("imou")) {
            return VendorResult(
                vendor = "Dahua",
                model = "Dahua IPC / DVR Starlight",
                category = "camera",
                isCamera = true,
                confidence = 96,
                mainPath = "/cam/realmonitor?channel=1&subtype=0",
                subPath = "/cam/realmonitor?channel=1&subtype=1"
            )
        }

        // 3. Xiongmai / XM / iCSee
        if (ports.contains(34567) || text.contains("netsurveillance") || text.contains("xiongmai") || text.contains("icsee")) {
            return VendorResult(
                vendor = "Xiongmai (iCSee)",
                model = "XM / iCSee IPC NetIP",
                category = "camera",
                isCamera = true,
                confidence = 94,
                mainPath = "/user={user}_password={pass}_channel=1_stream=0.sdp",
                subPath = "/user={user}_password={pass}_channel=1_stream=1.sdp"
            )
        }

        // 4. Tapo
        if (text.contains("tapo") || text.contains("tp-link")) {
            return VendorResult(
                vendor = "TP-Link Tapo",
                model = "Tapo Wi-Fi Smart Cam",
                category = "camera",
                isCamera = true,
                confidence = 92,
                mainPath = "/stream1",
                subPath = "/stream2"
            )
        }

        // 5. Reolink
        if (text.contains("reolink")) {
            return VendorResult(
                vendor = "Reolink",
                model = "Reolink IP Camera",
                category = "camera",
                isCamera = true,
                confidence = 92,
                mainPath = "/h264Preview_01_main",
                subPath = "/h264Preview_01_sub"
            )
        }

        // 6. Generic RTSP or ONVIF
        val hasRtsp = ports.contains(554) || ports.contains(8554)
        val hasOnvif = ports.contains(8899) || ports.contains(3702)

        if (hasRtsp) {
            return VendorResult(
                vendor = if (hasOnvif) "Generic ONVIF" else "Generic RTSP",
                model = "RTSP/ONVIF Streaming Camera",
                category = "camera",
                isCamera = true,
                confidence = if (hasOnvif) 88 else 75,
                mainPath = "/live/ch0",
                subPath = "/live/ch1"
            )
        }

        if (hasOnvif) {
            return VendorResult(
                vendor = "Generic ONVIF",
                model = "ONVIF IP Device",
                category = "camera",
                isCamera = true,
                confidence = 80,
                mainPath = "/onvif1",
                subPath = "/onvif2"
            )
        }

        // 7. Network Printers
        if (ports.contains(9100) || ports.contains(631) || text.contains("laserjet") || text.contains("printer")) {
            return VendorResult(
                vendor = "Сетевой принтер",
                model = "Принтер / МФУ (Port 9100 RAW/IPP)",
                category = "printer",
                isCamera = false,
                confidence = 92,
                mainPath = "",
                subPath = ""
            )
        }

        // 8. Windows Workstation
        if (ports.contains(445) || ports.contains(3389) || ports.contains(139) || text.contains("microsoft")) {
            return VendorResult(
                vendor = "Windows ПК / Сервер",
                model = if (ports.contains(3389)) "Рабочая станция Windows (RDP / SMB)" else "Компьютер Windows (SMB 445)",
                category = "workstation",
                isCamera = false,
                confidence = 90,
                mainPath = "",
                subPath = ""
            )
        }

        // 9. Mac / Linux / SSH
        if (ports.contains(22)) {
            val isMac = text.contains("mac") || text.contains("apple")
            return VendorResult(
                vendor = if (isMac) "Apple Mac" else "Linux ПК / Сервер",
                model = "Узел сети (SSH 22)",
                category = "workstation",
                isCamera = false,
                confidence = 85,
                mainPath = "",
                subPath = ""
            )
        }

        // 10. Routers / Gateways
        if (ports.contains(8291) || text.contains("mikrotik") || text.contains("routeros")) {
            return VendorResult(
                vendor = "MikroTik RouterOS",
                model = "Маршрутизатор MikroTik (WinBox 8291)",
                category = "router",
                isCamera = false,
                confidence = 95,
                mainPath = "",
                subPath = ""
            )
        }

        if (ports.contains(53) && (ports.contains(80) || ports.contains(443))) {
            return VendorResult(
                vendor = "Wi-Fi Роутер / Шлюз",
                model = "Сетевой маршрутизатор (DNS 53 + Web)",
                category = "router",
                isCamera = false,
                confidence = 88,
                mainPath = "",
                subPath = ""
            )
        }

        // 11. Smart TV / Media Streamer
        if (ports.contains(8008) || ports.contains(8009) || text.contains("cast") || text.contains("tizen") || text.contains("webos")) {
            return VendorResult(
                vendor = "Smart TV / Chromecast",
                model = "Телевизор / Медиаплеер",
                category = "tv-media",
                isCamera = false,
                confidence = 90,
                mainPath = "",
                subPath = ""
            )
        }

        // 12. NAS / Home Storage
        if (ports.contains(5000) || ports.contains(5001) || text.contains("synology")) {
            return VendorResult(
                vendor = "Synology NAS",
                model = "Сетевое хранилище DiskStation",
                category = "nas-iot",
                isCamera = false,
                confidence = 95,
                mainPath = "",
                subPath = ""
            )
        }

        return VendorResult(
            vendor = "Сетевое устройство",
            model = "Активный хост (${openPorts.size} откр. портов)",
            category = "other",
            isCamera = false,
            confidence = 50,
            mainPath = "",
            subPath = ""
        )
    }

    /**
     * Native Android security audit logic for discovered network hosts
     */
    fun auditSecurity(
        ip: String,
        openPorts: List<OpenPortInfo>,
        vendor: String,
        isCamera: Boolean
    ): Pair<List<SecurityIssue>, String> {
        val ports = openPorts.map { it.port }.toSet()
        val issues = mutableListOf<SecurityIssue>()

        // 1. Telnet
        if (ports.contains(23)) {
            issues.add(
                SecurityIssue(
                    id = "sec-telnet-$ip",
                    severity = "critical",
                    title = "Уязвимость: Открыт незашифрованный Telnet (Порт 23)",
                    description = "Telnet передает логины и команды в открытом виде. Уязвим к перехвату паролей и ботнетам Mirai.",
                    port = 23,
                    remediation = "Отключите службу Telnet в настройках устройства и перейдите на SSH (порт 22)."
                )
            )
        }

        // 2. SMB
        if (ports.contains(445) || ports.contains(139)) {
            issues.add(
                SecurityIssue(
                    id = "sec-smb-$ip",
                    severity = "high",
                    title = "Риск: Открыт общий доступ SMB / Samba (Порт 445 / 139)",
                    description = "Протокол общего доступа к файлам Windows SMB может быть уязвим к эксплойтам EternalBlue.",
                    port = 445,
                    remediation = "Отключите SMBv1, включите подписывание пакетов и заблокируйте гостевой вход."
                )
            )
        }

        // 3. RDP
        if (ports.contains(3389)) {
            issues.add(
                SecurityIssue(
                    id = "sec-rdp-$ip",
                    severity = "high",
                    title = "Предупреждение: Открыт порт RDP (Порт 3389)",
                    description = "Прямой доступ к удаленному рабочему столу уязвим к перебору паролей без VPN.",
                    port = 3389,
                    remediation = "Используйте VPN (WireGuard) и включите сетевую аутентификацию NLA."
                )
            )
        }

        // 4. Camera Default Password risk
        if (isCamera) {
            val vLower = vendor.lowercase()
            if (vLower.contains("xiongmai") || ports.contains(34567)) {
                issues.add(
                    SecurityIssue(
                        id = "sec-xm-pass-$ip",
                        severity = "high",
                        title = "Риск пустого пароля Xiongmai (Порт 34567)",
                        description = "Камеры на процессорах Xiongmai (iCSee) часто поставляются с пустым паролем администратора.",
                        port = 34567,
                        remediation = "Задайте надежный пароль в приложении iCSee или CMS на ПК."
                    )
                )
            } else if (vLower.contains("dahua") || ports.contains(37777)) {
                issues.add(
                    SecurityIssue(
                        id = "sec-dahua-creds-$ip",
                        severity = "medium",
                        title = "Проверка учетных данных Dahua DVR (Порт 37777)",
                        description = "Порт управления Dahua открыт. Убедитесь, что заводская пара admin:admin была изменена.",
                        port = 37777,
                        remediation = "Смените пароль по умолчанию и отключите UPnP автопроброс."
                    )
                )
            } else if (vLower.contains("hikvision") || ports.contains(8000)) {
                issues.add(
                    SecurityIssue(
                        id = "sec-hik-creds-$ip",
                        severity = "medium",
                        title = "Защита порта управления Hikvision (Порт 8000)",
                        description = "Порт Hikvision SDK активен. На старых прошивках возможны уязвимости обхода аутентификации.",
                        port = 8000,
                        remediation = "Обновите прошивку камеры до последней версии с официального сайта."
                    )
                )
            }
        }

        // 5. RTSP Unencrypted
        if (ports.contains(554) || ports.contains(8554)) {
            issues.add(
                SecurityIssue(
                    id = "sec-rtsp-$ip",
                    severity = "medium",
                    title = "Незащищенный видеопоток RTSP (Порт 554)",
                    description = "Поток RTSP транслируется без SSL/TLS шифрования в локальной сети.",
                    port = 554,
                    remediation = "Используйте RTSPS если поддерживается или изолируйте камеры в отдельный VLAN."
                )
            )
        }

        // 6. Plaintext HTTP
        if ((ports.contains(80) || ports.contains(8080)) && !ports.contains(443)) {
            issues.add(
                SecurityIssue(
                    id = "sec-http-$ip",
                    severity = "medium",
                    title = "Веб-интерфейс без HTTPS (Порт 80/8080)",
                    description = "Пароли администратора передаются через браузер в незашифрованном виде (HTTP).",
                    port = if (ports.contains(80)) 80 else 8080,
                    remediation = "Включите протокол HTTPS в настройках устройства."
                )
            )
        }

        val riskLevel = when {
            issues.any { it.severity == "critical" } -> "critical"
            issues.any { it.severity == "high" } -> "high"
            issues.any { it.severity == "medium" } -> "medium"
            issues.isNotEmpty() -> "low"
            else -> "safe"
        }

        return Pair(issues, riskLevel)
    }

    fun buildRtspUrl(ip: String, path: String, user: String = "admin", pass: String = "admin"): String {
        val auth = if (user.isNotEmpty()) "$user:$pass@" else ""
        val cleanPath = if (path.startsWith("/")) path else "/$path"
        return "rtsp://$auth$ip:554$cleanPath"
    }
}

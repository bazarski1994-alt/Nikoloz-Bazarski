package com.netcam.scanner.model

data class OpenPortInfo(
    val port: Int,
    val service: String,
    val isCameraRelated: Boolean,
    val banner: String? = null
)

data class SecurityIssue(
    val id: String,
    val severity: String, // "critical", "high", "medium", "low", "info"
    val title: String,
    val description: String,
    val port: Int? = null,
    val remediation: String
)

data class DiscoveredCamera(
    val id: String,
    val ip: String,
    val vendor: String,
    val model: String,
    val category: String, // "camera", "router", "workstation", "printer", "tv-media", "nas-iot", "other"
    val isCamera: Boolean,
    val confidence: Int,
    val openPorts: List<OpenPortInfo>,
    val latencyMs: Long,
    val rtspMainUrl: String,
    val rtspSubUrl: String,
    val httpTitle: String? = null,
    val httpServer: String? = null,
    val webUiUrl: String? = null,
    val riskLevel: String = "safe", // "safe", "low", "medium", "high", "critical"
    val securityIssues: List<SecurityIssue> = emptyList()
)

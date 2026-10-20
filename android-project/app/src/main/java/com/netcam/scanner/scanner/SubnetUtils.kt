package com.netcam.scanner.scanner

import java.net.Inet4Address
import java.net.NetworkInterface

object SubnetUtils {

    /**
     * Resolves the local IPv4 address of the Android device connected to Wi-Fi/LAN
     */
    fun getLocalDeviceIp(): String? {
        try {
            val interfaces = NetworkInterface.getNetworkInterfaces()
            while (interfaces.hasMoreElements()) {
                val iface = interfaces.nextElement()
                if (iface.isLoopback || !iface.isUp) continue

                val addresses = iface.inetAddresses
                while (addresses.hasMoreElements()) {
                    val addr = addresses.nextElement()
                    if (addr is Inet4Address && !addr.isLoopbackAddress) {
                        val host = addr.hostAddress
                        if (host != null && (host.startsWith("192.168.") || host.startsWith("10.") || host.startsWith("172."))) {
                            return host
                        }
                    }
                }
            }
        } catch (_: Exception) {
        }
        return "192.168.1.1"
    }

    /**
     * Infers a /24 subnet from the current local IP (e.g. 192.168.1.45 -> 192.168.1.0/24)
     */
    fun getDefaultSubnetCidr(): String {
        val ip = getLocalDeviceIp() ?: "192.168.1.1"
        val parts = ip.split(".")
        if (parts.size == 4) {
            return "${parts[0]}.${parts[1]}.${parts[2]}.0/24"
        }
        return "192.168.1.0/24"
    }

    /**
     * Generates all 254 IP addresses for a /24 subnet or range
     */
    fun generateSubnetIps(cidrOrIp: String): List<String> {
        val clean = cidrOrIp.trim()
        val parts = clean.split("/")
        val baseIp = parts[0]

        val octets = baseIp.split(".").mapNotNull { it.toIntOrNull() }
        if (octets.size != 4) return emptyList()

        val prefix = if (parts.size == 2) parts[1].toIntOrNull() ?: 24 else 24

        if (prefix == 32) {
            return listOf(baseIp)
        }

        // For standard local Wi-Fi subnets (/24)
        val prefixBase = "${octets[0]}.${octets[1]}.${octets[2]}"
        val list = mutableListOf<String>()
        for (host in 1..254) {
            list.add("$prefixBase.$host")
        }
        return list
    }
}

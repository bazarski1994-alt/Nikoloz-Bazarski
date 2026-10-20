package com.netcam.scanner

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.netcam.scanner.scanner.NetworkScanner
import com.netcam.scanner.ui.MainScreen
import com.netcam.scanner.ui.theme.NetCamScannerTheme

class MainActivity : ComponentActivity() {

    private val scanner = NetworkScanner()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            NetCamScannerTheme {
                MainScreen(scanner = scanner)
            }
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        scanner.stopScan()
    }
}

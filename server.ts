import express, { Request, Response } from 'express';
import os from 'os';
import net from 'net';
import http from 'http';
import https from 'https';
import fs from 'fs';
import path from 'path';
import JSZip from 'jszip';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { CAMERA_PORTS, generateIpRange } from './src/utils/networkUtils.ts';
import { identifyDeviceTraits, buildRtspUrls } from './src/utils/cameraFingerprint.ts';
import { auditDeviceSecurity } from './src/utils/securityAudit.ts';
import type { DiscoveredDevice, OpenPort, SubnetInterface } from './src/types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

/**
 * Helper to probe a TCP port with timeout
 */
function probeTcpPort(host: string, port: number, timeoutMs: number = 800): Promise<{ open: boolean; latencyMs: number; banner?: string }> {
  return new Promise((resolve) => {
    const startTime = Date.now();
    const socket = new net.Socket();
    let isResolved = false;

    socket.setTimeout(timeoutMs);

    socket.on('connect', () => {
      const latencyMs = Date.now() - startTime;
      
      // If port is RTSP (554, 8554), send OPTIONS request to grab RTSP Server banner
      if (port === 554 || port === 8554) {
        try {
          socket.write(`OPTIONS rtsp://${host}:${port}/ RTSP/1.0\r\nCSeq: 1\r\nUser-Agent: NetCam-Scanner/1.0\r\n\r\n`);
        } catch {
          // ignore write errors
        }
      }

      // Allow 200ms for banner grab if any data arrives
      const bannerTimer = setTimeout(() => {
        if (!isResolved) {
          isResolved = true;
          socket.destroy();
          resolve({ open: true, latencyMs });
        }
      }, 180);

      socket.once('data', (data) => {
        clearTimeout(bannerTimer);
        if (!isResolved) {
          isResolved = true;
          const text = data.toString('utf-8', 0, 200).trim();
          socket.destroy();
          resolve({ open: true, latencyMs, banner: text.slice(0, 150) });
        }
      });
    });

    socket.on('timeout', () => {
      if (!isResolved) {
        isResolved = true;
        socket.destroy();
        resolve({ open: false, latencyMs: timeoutMs });
      }
    });

    socket.on('error', () => {
      if (!isResolved) {
        isResolved = true;
        socket.destroy();
        resolve({ open: false, latencyMs: Date.now() - startTime });
      }
    });

    try {
      socket.connect(port, host);
    } catch {
      if (!isResolved) {
        isResolved = true;
        resolve({ open: false, latencyMs: timeoutMs });
      }
    }
  });
}

/**
 * Fetch HTTP/HTTPS title and server header
 */
async function fetchHttpInfo(host: string, port: number, isHttps: boolean = false, timeoutMs: number = 1000): Promise<{ title?: string; server?: string }> {
  return new Promise((resolve) => {
    const client = isHttps ? https : http;
    const req = client.get(
      {
        host,
        port,
        path: '/',
        timeout: timeoutMs,
        rejectUnauthorized: false,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) NetCamScanner/1.0',
        },
      },
      (res) => {
        let rawHtml = '';
        const server = (res.headers['server'] as string) || (res.headers['www-authenticate'] as string) || '';

        res.on('data', (chunk) => {
          rawHtml += chunk.toString('utf-8');
          if (rawHtml.length > 4096) {
            req.destroy();
          }
        });

        res.on('end', () => {
          const titleMatch = rawHtml.match(/<title[^>]*>([^<]+)<\/title>/i);
          const title = titleMatch ? titleMatch[1].trim() : undefined;
          resolve({ title, server: server || undefined });
        });
      }
    );

    req.on('timeout', () => {
      req.destroy();
      resolve({});
    });

    req.on('error', () => {
      resolve({});
    });
  });
}

/**
 * Scan a single host across multiple ports
 */
async function scanHost(
  ip: string,
  ports: number[],
  timeoutMs: number = 800,
  grabBanners: boolean = true
): Promise<DiscoveredDevice | null> {
  const openPorts: OpenPort[] = [];
  let minLatency = 9999;

  // Run port probes concurrently
  const probePromises = ports.map(async (port) => {
    const result = await probeTcpPort(ip, port, timeoutMs);
    if (result.open) {
      minLatency = Math.min(minLatency, result.latencyMs);
      const portInfo = CAMERA_PORTS[port] || {
        service: `TCP-${port}`,
        isCamera: false,
      };

      openPorts.push({
        port,
        protocol: 'tcp',
        service: portInfo.service,
        isCameraRelated: portInfo.isCamera,
        banner: result.banner,
      });
    }
  });

  await Promise.all(probePromises);

  // If no ports are open, host is down or unresponsive
  if (openPorts.length === 0) {
    return null;
  }

  // If web ports are open, try grabbing HTTP title/server
  let httpTitle: string | undefined;
  let httpServer: string | undefined;

  if (grabBanners) {
    if (openPorts.some((p) => p.port === 80 || p.port === 8080)) {
      const portToProbe = openPorts.find((p) => p.port === 80)?.port || 8080;
      const httpRes = await fetchHttpInfo(ip, portToProbe, false, 800);
      httpTitle = httpRes.title;
      httpServer = httpRes.server;
    } else if (openPorts.some((p) => p.port === 443)) {
      const httpRes = await fetchHttpInfo(ip, 443, true, 800);
      httpTitle = httpRes.title;
      httpServer = httpRes.server;
    }
  }

  const openPortNumbers = openPorts.map((p) => p.port);
  const traits = identifyDeviceTraits({
    ports: openPortNumbers,
    httpTitle,
    httpServer,
  });

  const rtspUrls = traits.isCamera
    ? buildRtspUrls(ip, traits.vendor, 'admin', 'admin', openPortNumbers.includes(8554) && !openPortNumbers.includes(554) ? 8554 : 554)
    : [];

  const audit = auditDeviceSecurity({
    ip,
    ports: openPorts,
    vendor: traits.vendor,
    isCamera: traits.isCamera,
    httpServer,
    httpTitle,
  });

  const device: DiscoveredDevice = {
    id: `dev-${ip.replace(/\./g, '-')}`,
    ip,
    vendor: traits.vendor,
    model: traits.modelHint || (traits.isCamera ? 'IP Camera' : 'Network Device'),
    deviceType: traits.deviceType,
    category: traits.category,
    openPorts: openPorts.sort((a, b) => a.port - b.port),
    httpTitle,
    httpServer,
    isCamera: traits.isCamera,
    confidence: traits.confidence,
    latencyMs: minLatency === 9999 ? 5 : minLatency,
    lastSeen: new Date().toISOString(),
    rtspUrls,
    webUiUrl: openPorts.some((p) => p.port === 80)
      ? `http://${ip}`
      : openPorts.some((p) => p.port === 8080)
      ? `http://${ip}:8080`
      : openPorts.some((p) => p.port === 443)
      ? `https://${ip}`
      : undefined,
    securityIssues: audit.issues,
    riskLevel: audit.riskLevel,
    androidPresets: traits.isCamera
      ? [
          {
            appName: 'TinyCam Monitor PRO',
            recommendedModel: traits.vendor,
            setupNote: 'Добавить камеру -> Производитель: ' + traits.vendor + ' -> Протокол RTSP over TCP',
          },
          {
            appName: 'VLC for Android',
            recommendedModel: 'RTSP Direct Stream',
            setupNote: 'Еще -> Потоки -> Вставить RTSP ссылку',
          },
          {
            appName: 'Onvifer',
            recommendedModel: 'ONVIF Auto-Discover',
            setupNote: 'Поиск по IP ' + ip + ' с портами 80/8899/554',
          },
        ]
      : [],
  };

  return device;
}

/**
 * Realistic Demo IP Cameras & Devices for testing
 */
const DEMO_CAMERAS: Omit<DiscoveredDevice, 'securityIssues' | 'riskLevel'>[] = [
  // 1. Wi-Fi Router / Gateway
  {
    id: 'demo-router',
    ip: '192.168.1.1',
    mac: '50:FF:20:AA:BB:CC',
    hostname: 'Keenetic-Giga-KN1011',
    vendor: 'Keenetic Router',
    model: 'KN-1011 (Wi-Fi 6 Gigabit Router)',
    deviceType: 'router',
    category: 'router',
    openPorts: [
      { port: 80, protocol: 'tcp', service: 'HTTP', isCameraRelated: false },
      { port: 443, protocol: 'tcp', service: 'HTTPS', isCameraRelated: false },
      { port: 53, protocol: 'tcp', service: 'DNS', isCameraRelated: false },
    ],
    httpTitle: 'Keenetic Web UI',
    isCamera: false,
    confidence: 95,
    latencyMs: 2,
    lastSeen: new Date().toISOString(),
    rtspUrls: [],
    webUiUrl: 'http://192.168.1.1',
    androidPresets: [],
  },

  // 2. Windows 11 PC / Workstation
  {
    id: 'demo-pc-windows',
    ip: '192.168.1.15',
    mac: 'B4:2E:99:11:44:88',
    hostname: 'DESKTOP-PRO-W11',
    vendor: 'Windows 11 PC',
    model: 'Рабочая станция Windows (RDP / SMB)',
    deviceType: 'workstation',
    category: 'workstation',
    openPorts: [
      { port: 445, protocol: 'tcp', service: 'SMB', isCameraRelated: false, banner: 'Windows SMBv3 File Sharing' },
      { port: 3389, protocol: 'tcp', service: 'RDP', isCameraRelated: false, banner: 'MS-RDP-TLS' },
      { port: 139, protocol: 'tcp', service: 'NetBIOS', isCameraRelated: false },
      { port: 135, protocol: 'tcp', service: 'MS-RPC', isCameraRelated: false },
    ],
    httpServer: 'Microsoft-HTTPAPI/2.0',
    isCamera: false,
    confidence: 95,
    latencyMs: 4,
    lastSeen: new Date().toISOString(),
    rtspUrls: [],
    androidPresets: [],
  },

  // 3. Apple MacBook Pro / macOS
  {
    id: 'demo-macbook',
    ip: '192.168.1.22',
    mac: 'F0:18:98:AA:EE:22',
    hostname: 'Alex-MacBook-Pro',
    vendor: 'Apple Mac / MacBook',
    model: 'MacBook Pro M3 Max (macOS Sequoia)',
    deviceType: 'workstation',
    category: 'workstation',
    openPorts: [
      { port: 22, protocol: 'tcp', service: 'SSH', isCameraRelated: false, banner: 'OpenSSH_9.6p1' },
      { port: 7000, protocol: 'tcp', service: 'AirPlay', isCameraRelated: false },
      { port: 631, protocol: 'tcp', service: 'IPP', isCameraRelated: false, banner: 'CUPS 2.4.7' },
    ],
    isCamera: false,
    confidence: 92,
    latencyMs: 5,
    lastSeen: new Date().toISOString(),
    rtspUrls: [],
    androidPresets: [],
  },

  // 4. Synology NAS / Home Storage
  {
    id: 'demo-nas-synology',
    ip: '192.168.1.30',
    mac: '00:11:32:9B:44:11',
    hostname: 'Synology-DS920Plus',
    vendor: 'Synology NAS',
    model: 'DiskStation DS920+ (DSM 7.2)',
    deviceType: 'nas-server',
    category: 'nas-iot',
    openPorts: [
      { port: 5000, protocol: 'tcp', service: 'UPnP/Synology', isCameraRelated: false, banner: 'Synology DSM HTTP' },
      { port: 5001, protocol: 'tcp', service: 'Synology-SSL', isCameraRelated: false },
      { port: 445, protocol: 'tcp', service: 'SMB', isCameraRelated: false },
      { port: 22, protocol: 'tcp', service: 'SSH', isCameraRelated: false },
    ],
    httpTitle: 'Synology DiskStation - DSM',
    httpServer: 'nginx',
    isCamera: false,
    confidence: 98,
    latencyMs: 3,
    lastSeen: new Date().toISOString(),
    rtspUrls: [],
    webUiUrl: 'http://192.168.1.30:5000',
    androidPresets: [],
  },

  // 5. Network Printer (HP LaserJet)
  {
    id: 'demo-printer-hp',
    ip: '192.168.1.42',
    mac: 'AC:16:2D:33:55:77',
    hostname: 'HP-LaserJet-M428fdw',
    vendor: 'HP LaserJet Printer',
    model: 'LaserJet Pro MFP M428fdw (Сетевой принтер)',
    deviceType: 'printer',
    category: 'printer',
    openPorts: [
      { port: 9100, protocol: 'tcp', service: 'RAW-Print', isCameraRelated: false, banner: 'HP JetDirect RAW' },
      { port: 631, protocol: 'tcp', service: 'IPP', isCameraRelated: false },
      { port: 80, protocol: 'tcp', service: 'HTTP', isCameraRelated: false },
      { port: 443, protocol: 'tcp', service: 'HTTPS', isCameraRelated: false },
    ],
    httpTitle: 'HP LaserJet Pro MFP M428fdw EWS',
    httpServer: 'HP-ChaiSOE/1.0',
    isCamera: false,
    confidence: 96,
    latencyMs: 8,
    lastSeen: new Date().toISOString(),
    rtspUrls: [],
    webUiUrl: 'http://192.168.1.42',
    androidPresets: [],
  },

  // 6. Smart TV (Samsung QLED 4K)
  {
    id: 'demo-tv-samsung',
    ip: '192.168.1.55',
    mac: '64:1C:AE:88:99:00',
    hostname: 'Samsung-QLED-TV-LivingRoom',
    vendor: 'Samsung Smart TV',
    model: 'Samsung QLED 4K UHD (Tizen OS)',
    deviceType: 'smart-tv',
    category: 'tv-media',
    openPorts: [
      { port: 8001, protocol: 'tcp', service: 'SmartThings', isCameraRelated: false },
      { port: 8008, protocol: 'tcp', service: 'Google-Cast', isCameraRelated: false, banner: 'Google Cast Screen Mirroring' },
      { port: 8009, protocol: 'tcp', service: 'Cast-Media', isCameraRelated: false },
    ],
    httpTitle: 'Samsung TV Interactive Web',
    isCamera: false,
    confidence: 94,
    latencyMs: 12,
    lastSeen: new Date().toISOString(),
    rtspUrls: [],
    androidPresets: [],
  },

  // 7. IP Camera 1: Hikvision 4K
  {
    id: 'demo-cam-1',
    ip: '192.168.1.64',
    mac: 'E0:50:8B:2A:71:04',
    hostname: 'HIKVISION-DS2CD2043G2',
    vendor: 'Hikvision',
    model: 'DS-2CD2043G2-I (4K AcuSense Bullet)',
    deviceType: 'ip-camera',
    category: 'camera',
    openPorts: [
      { port: 80, protocol: 'tcp', service: 'HTTP', isCameraRelated: false, banner: 'Hikvision-Webs' },
      { port: 554, protocol: 'tcp', service: 'RTSP', isCameraRelated: true, banner: 'RTSP/1.0 200 OK Live555' },
      { port: 8000, protocol: 'tcp', service: 'Hikvision-Dev', isCameraRelated: true },
      { port: 8899, protocol: 'tcp', service: 'ONVIF-Soap', isCameraRelated: true },
    ],
    httpTitle: 'Hikvision Network Camera Web Manager',
    httpServer: 'Hikvision-Webs',
    isCamera: true,
    confidence: 98,
    latencyMs: 7,
    lastSeen: new Date().toISOString(),
    firmware: 'V5.7.13 build 230915',
    rtspUrls: buildRtspUrls('192.168.1.64', 'Hikvision', 'admin', 'pass12345'),
    webUiUrl: 'http://192.168.1.64',
    androidPresets: [
      {
        appName: 'TinyCam Monitor PRO',
        recommendedModel: 'Hikvision',
        setupNote: 'IP: 192.168.1.64, Порт: 554, Путь: /Streaming/Channels/101',
      },
      {
        appName: 'Hik-Connect / iVMS-4500',
        recommendedModel: 'Hikvision Direct IP',
        setupNote: 'Порт управления: 8000, Web: 80',
      },
      {
        appName: 'VLC for Android',
        recommendedModel: 'RTSP Stream',
        setupNote: 'Ссылка: rtsp://admin:pass12345@192.168.1.64:554/Streaming/Channels/101',
      },
    ],
  },

  // 8. IP Camera 2: Dahua Starlight
  {
    id: 'demo-cam-2',
    ip: '192.168.1.108',
    mac: '3C:EF:8C:91:2E:D0',
    hostname: 'DAHUA-IPC-HFW2431S',
    vendor: 'Dahua',
    model: 'IPC-HFW2431S-S-S2 (Starlight IR)',
    deviceType: 'ip-camera',
    category: 'camera',
    openPorts: [
      { port: 80, protocol: 'tcp', service: 'HTTP', isCameraRelated: false, banner: 'General_NVR Web' },
      { port: 554, protocol: 'tcp', service: 'RTSP', isCameraRelated: true },
      { port: 37777, protocol: 'tcp', service: 'Dahua-DVR', isCameraRelated: true },
      { port: 37778, protocol: 'tcp', service: 'Dahua-UDP', isCameraRelated: true },
    ],
    httpTitle: 'Dahua Web Service',
    httpServer: 'Dahua-Httpd',
    isCamera: true,
    confidence: 96,
    latencyMs: 9,
    lastSeen: new Date().toISOString(),
    firmware: 'DH_IPC-HX2XXX-Molec_Eng_P_V2.820.0000000.4.R',
    rtspUrls: buildRtspUrls('192.168.1.108', 'Dahua', 'admin', 'admin'),
    webUiUrl: 'http://192.168.1.108',
    androidPresets: [
      {
        appName: 'DMSS (Dahua Official)',
        recommendedModel: 'Dahua IP/Domain',
        setupNote: 'Порт: 37777, Логин: admin, Пароль: admin',
      },
      {
        appName: 'TinyCam Monitor PRO',
        recommendedModel: 'Dahua RTSP',
        setupNote: 'IP: 192.168.1.108, Путь: /cam/realmonitor?channel=1&subtype=0',
      },
    ],
  },

  // 9. IP Camera 3: Xiongmai / iCSee
  {
    id: 'demo-cam-3',
    ip: '192.168.1.115',
    mac: '00:12:12:34:56:78',
    hostname: 'XM-IP-CAMERA',
    vendor: 'Xiongmai',
    model: 'XM530 + SC3335 (iCSee / XMeye 3MP)',
    deviceType: 'ip-camera',
    category: 'camera',
    openPorts: [
      { port: 80, protocol: 'tcp', service: 'HTTP', isCameraRelated: false },
      { port: 23, protocol: 'tcp', service: 'Telnet', isCameraRelated: false, banner: 'Telnetd uc-httpd 1.0.0 (Linux 3.0.8)' },
      { port: 554, protocol: 'tcp', service: 'RTSP', isCameraRelated: true },
      { port: 34567, protocol: 'tcp', service: 'Xiongmai-NetIP', isCameraRelated: true },
      { port: 8899, protocol: 'tcp', service: 'ONVIF-Soap', isCameraRelated: true },
    ],
    httpTitle: 'NETSurveillance Web',
    httpServer: 'uc-httpd 1.0.0',
    isCamera: true,
    confidence: 94,
    latencyMs: 14,
    lastSeen: new Date().toISOString(),
    firmware: 'V4.02.R12.Nat.Onvif.20230415',
    rtspUrls: buildRtspUrls('192.168.1.115', 'Xiongmai', 'admin', ''),
    webUiUrl: 'http://192.168.1.115',
    androidPresets: [
      {
        appName: 'iCSee / XMeye Pro',
        recommendedModel: 'Xiongmai Local IP',
        setupNote: 'Порт медиа: 34567, Пароль по умолчанию пустой',
      },
      {
        appName: 'TinyCam Monitor PRO',
        recommendedModel: 'Xiongmai / XMeye',
        setupNote: 'Протокол RTSP или XM NetIP, порт 34567',
      },
    ],
  },

  // 10. IP Camera 4: TP-Link Tapo C200
  {
    id: 'demo-cam-4',
    ip: '192.168.1.120',
    mac: 'AC:84:C6:11:22:33',
    hostname: 'Tapo_C200_Kitchen',
    vendor: 'TP-Link Tapo',
    model: 'TP-Link Tapo C200 (Pan/Tilt Wi-Fi)',
    deviceType: 'ip-camera',
    category: 'camera',
    openPorts: [
      { port: 443, protocol: 'tcp', service: 'HTTPS', isCameraRelated: false },
      { port: 554, protocol: 'tcp', service: 'RTSP', isCameraRelated: true },
      { port: 2020, protocol: 'tcp', service: 'Tapo-Control', isCameraRelated: true },
    ],
    httpTitle: 'TP-Link Smart Home Camera',
    httpServer: 'Tapo-Server',
    isCamera: true,
    confidence: 92,
    latencyMs: 22,
    lastSeen: new Date().toISOString(),
    rtspUrls: buildRtspUrls('192.168.1.120', 'Tapo', 'camuser', 'pass2024'),
    webUiUrl: 'https://192.168.1.120',
    androidPresets: [
      {
        appName: 'Tapo App (Официальное)',
        recommendedModel: 'TP-Link Tapo Cloud/Local',
        setupNote: 'Подключение через аккаунт TP-Link Tapo',
      },
      {
        appName: 'VLC / TinyCam',
        recommendedModel: 'RTSP поток',
        setupNote: 'URL: rtsp://camuser:pass2024@192.168.1.120:554/stream1',
      },
    ],
  },

  // 11. Smartphone: Samsung Galaxy S24 Ultra
  {
    id: 'demo-phone-samsung',
    ip: '192.168.1.144',
    hostname: 'Galaxy-S24-Ultra',
    vendor: 'Samsung Galaxy S24',
    model: 'Android 14 Смартфон (IP Webcam)',
    deviceType: 'mobile-android',
    category: 'mobile',
    openPorts: [
      { port: 8080, protocol: 'tcp', service: 'HTTP-Alt', isCameraRelated: false },
    ],
    httpTitle: 'IP Webcam Android Server',
    isCamera: true,
    confidence: 85,
    latencyMs: 18,
    lastSeen: new Date().toISOString(),
    rtspUrls: [
      {
        main: 'rtsp://192.168.1.144:8080/h264_pcm.sdp',
        sub: 'http://192.168.1.144:8080/video',
        description: 'Трансляция с Android IP Webcam',
      },
    ],
    webUiUrl: 'http://192.168.1.144:8080',
    androidPresets: [
      {
        appName: 'IP Webcam',
        recommendedModel: 'Android as Security Camera',
        setupNote: 'Приложение превращает этот смартфон в RTSP/MJPEG камеру',
      },
    ],
  },

  // 12. Smartphone: Apple iPhone 15 Pro
  {
    id: 'demo-phone-iphone',
    ip: '192.168.1.148',
    hostname: 'iPhone-15-Pro',
    vendor: 'Apple iPhone 15 Pro',
    model: 'iOS Смартфон (AirPlay / mDNS)',
    deviceType: 'mobile-ios',
    category: 'mobile',
    openPorts: [
      { port: 7000, protocol: 'tcp', service: 'AirPlay', isCameraRelated: false },
    ],
    isCamera: false,
    confidence: 88,
    latencyMs: 16,
    lastSeen: new Date().toISOString(),
    rtspUrls: [],
    androidPresets: [],
  },

  // 13. IP Camera 5: Reolink RLC-810A
  {
    id: 'demo-cam-5',
    ip: '192.168.1.150',
    mac: 'EC:71:DB:44:55:66',
    hostname: 'Reolink-RLC810A',
    vendor: 'Reolink',
    model: 'RLC-810A (4K 8MP Smart Detection)',
    deviceType: 'ip-camera',
    category: 'camera',
    openPorts: [
      { port: 80, protocol: 'tcp', service: 'HTTP', isCameraRelated: false },
      { port: 443, protocol: 'tcp', service: 'HTTPS', isCameraRelated: false },
      { port: 554, protocol: 'tcp', service: 'RTSP', isCameraRelated: true },
      { port: 8000, protocol: 'tcp', service: 'Reolink-Control', isCameraRelated: true },
      { port: 9000, protocol: 'tcp', service: 'ONVIF-Soap', isCameraRelated: true },
    ],
    httpTitle: 'Reolink Web Management',
    httpServer: 'nginx/reolink',
    isCamera: true,
    confidence: 93,
    latencyMs: 11,
    lastSeen: new Date().toISOString(),
    rtspUrls: buildRtspUrls('192.168.1.150', 'Reolink', 'admin', ''),
    webUiUrl: 'http://192.168.1.150',
    androidPresets: [
      {
        appName: 'Reolink Android App',
        recommendedModel: 'Reolink PoE / Wi-Fi',
        setupNote: 'Автоматический поиск по LAN, порт 9000 ONVIF',
      },
      {
        appName: 'TinyCam Monitor PRO',
        recommendedModel: 'Reolink RTSP',
        setupNote: 'Путь: /h264Preview_01_main',
      },
    ],
  },

  // 14. Smart Home: Home Assistant Hub
  {
    id: 'demo-iot-ha',
    ip: '192.168.1.160',
    mac: 'E4:5F:01:88:22:99',
    hostname: 'HomeAssistant-Green',
    vendor: 'Home Assistant',
    model: 'Home Assistant Green Hub (Шлюз умного дома)',
    deviceType: 'smart-iot',
    category: 'nas-iot',
    openPorts: [
      { port: 8123, protocol: 'tcp', service: 'HomeAssistant', isCameraRelated: false, banner: 'Home Assistant Frontend' },
      { port: 1883, protocol: 'tcp', service: 'MQTT', isCameraRelated: false },
      { port: 22, protocol: 'tcp', service: 'SSH', isCameraRelated: false },
    ],
    httpTitle: 'Home Assistant',
    isCamera: false,
    confidence: 96,
    latencyMs: 6,
    lastSeen: new Date().toISOString(),
    rtspUrls: [],
    webUiUrl: 'http://192.168.1.160:8123',
    androidPresets: [
      {
        appName: 'Home Assistant for Android',
        recommendedModel: 'Home Assistant Companion',
        setupNote: 'Официальное приложение для Android с поддержкой всех датчиков и камер',
      },
    ],
  },
];

const ENRICHED_DEMO_CAMERAS: DiscoveredDevice[] = DEMO_CAMERAS.map((cam) => {
  const audit = auditDeviceSecurity({
    ip: cam.ip,
    ports: cam.openPorts,
    vendor: cam.vendor,
    isCamera: cam.isCamera,
    httpServer: cam.httpServer,
    httpTitle: cam.httpTitle,
  });
  return {
    ...cam,
    securityIssues: audit.issues,
    riskLevel: audit.riskLevel,
  };
});

// API Endpoints

/**
 * 1. Get host network interfaces
 */
function calculateNetworkBase(ip: string, netmask: string): string {
  const ipOctets = ip.split('.').map(Number);
  const maskOctets = netmask.split('.').map(Number);
  return ipOctets.map((oct, i) => (oct & maskOctets[i]) >>> 0).join('.');
}

app.get('/api/network-interfaces', (_req: Request, res: Response) => {
  const interfaces = os.networkInterfaces();
  const list: SubnetInterface[] = [];

  for (const [name, addrs] of Object.entries(interfaces)) {
    if (!addrs) continue;
    for (const addr of addrs) {
      if (addr.family === 'IPv4') {
        const maskInt = addr.netmask
          .split('.')
          .reduce((acc, octet) => ((acc << 8) + Number(octet)) >>> 0, 0);
        let prefix = 0;
        let temp = maskInt;
        while (temp > 0) {
          prefix += temp & 1;
          temp = temp >>> 1;
        }

        const baseIp = calculateNetworkBase(addr.address, addr.netmask);
        const subnetCidr = `${baseIp}/${prefix}`;
        const isRecommended =
          !addr.internal &&
          (addr.address.startsWith('192.168.') ||
            addr.address.startsWith('10.') ||
            addr.address.startsWith('172.'));

        list.push({
          name,
          address: addr.address,
          netmask: addr.netmask,
          family: addr.family,
          cidr: subnetCidr,
          hostAddress: addr.address,
          displayName: `${name}: ${addr.address} → ${subnetCidr}`,
          internal: addr.internal,
          isRecommended,
        });
      }
    }
  }

  const recommended = list.find((i) => i.isRecommended);
  const fallback = list.find((i) => !i.internal);

  res.json({
    interfaces: list,
    detectedHostIp: recommended?.address || fallback?.address || '127.0.0.1',
    detectedInterface: recommended?.name || fallback?.name || 'eth0',
    defaultSuggestedSubnet: recommended?.cidr || fallback?.cidr || '192.168.1.0/24',
  });
});

/**
 * 2. Get demo lab cameras
 */
app.get('/api/demo-devices', (_req: Request, res: Response) => {
  res.json({ devices: ENRICHED_DEMO_CAMERAS });
});

/**
 * 3. Scan a single host
 */
app.post('/api/scan/host', async (req: Request, res: Response) => {
  const { ip, ports, timeoutMs, grabBanners } = req.body;
  if (!ip) {
    res.status(400).json({ error: 'IP address is required' });
    return;
  }

  const portsToScan = Array.isArray(ports) && ports.length > 0 ? ports : [554, 80, 8080, 8000, 37777, 34567, 8899, 443];
  try {
    const result = await scanHost(ip, portsToScan, timeoutMs || 700, grabBanners !== false);
    res.json({ found: !!result, device: result });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: msg });
  }
});

/**
 * 4. Scan multiple hosts / subnet with Server-Sent Events (SSE) for instant live feedback
 */
app.get('/api/scan/stream', async (req: Request, res: Response) => {
  const cidrParam = (req.query.cidr as string) || '192.168.1.0/24';
  const portsParam = (req.query.ports as string) || '554,80,8080,8000,37777,34567,8899,443';
  const timeoutMs = parseInt((req.query.timeout as string) || '600', 10);
  const concurrency = Math.min(parseInt((req.query.concurrency as string) || '16', 10), 32);
  const useDemo = req.query.demo === 'true';

  const ports = portsParam
    .split(',')
    .map((p) => parseInt(p.trim(), 10))
    .filter((p) => !isNaN(p) && p > 0 && p <= 65535);

  // Set up SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const sendEvent = (event: string, data: unknown) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  if (useDemo) {
    // Deliver demo devices with realistic streaming stagger
    sendEvent('start', { totalHosts: ENRICHED_DEMO_CAMERAS.length, mode: 'demo' });
    let scanned = 0;
    for (const dev of ENRICHED_DEMO_CAMERAS) {
      scanned++;
      await new Promise((r) => setTimeout(r, 120));
      sendEvent('device', dev);
      sendEvent('progress', {
        scannedHosts: scanned,
        totalHosts: ENRICHED_DEMO_CAMERAS.length,
        currentIp: dev.ip,
      });
    }
    sendEvent('complete', { scannedHosts: scanned, totalHosts: ENRICHED_DEMO_CAMERAS.length });
    res.end();
    return;
  }

  // Real IP Subnet generation
  const ips = generateIpRange(cidrParam, 256);
  const total = ips.length;

  sendEvent('start', { totalHosts: total, cidr: cidrParam });

  let scannedCount = 0;
  let activeIndex = 0;

  async function worker() {
    while (activeIndex < ips.length) {
      const idx = activeIndex++;
      const currentIp = ips[idx];

      try {
        const dev = await scanHost(currentIp, ports, timeoutMs, true);
        scannedCount++;

        if (dev) {
          sendEvent('device', dev);
        }

        sendEvent('progress', {
          scannedHosts: scannedCount,
          totalHosts: total,
          currentIp,
        });
      } catch {
        scannedCount++;
      }
    }
  }

  // Start parallel worker pool
  const workers = Array.from({ length: concurrency }, () => worker());
  await Promise.all(workers);

  sendEvent('complete', { scannedHosts: scannedCount, totalHosts: total });
  res.end();
});

/**
 * 5. Download complete Android Studio project as .zip
 */
function addDirToZip(zip: JSZip, localDir: string, zipPrefix: string = '') {
  if (!fs.existsSync(localDir)) return;
  const items = fs.readdirSync(localDir);
  for (const item of items) {
    const fullPath = path.join(localDir, item);
    const stat = fs.statSync(fullPath);
    const zipPath = zipPrefix ? `${zipPrefix}/${item}` : item;
    if (stat.isDirectory()) {
      addDirToZip(zip, fullPath, zipPath);
    } else {
      const content = fs.readFileSync(fullPath);
      zip.file(zipPath, content);
    }
  }
}

app.get('/api/android-project/download', async (_req: Request, res: Response) => {
  try {
    const androidDir = path.resolve(__dirname, 'android-project');
    const zip = new JSZip();
    addDirToZip(zip, androidDir, 'NetCamScanner-Android');
    const buffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="NetCamScanner-Android-Studio.zip"');
    res.send(buffer);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: msg });
  }
});

/**
 * 6. Get Android project key source files for browser code viewer
 */
app.get('/api/android-project/files', (_req: Request, res: Response) => {
  try {
    const androidDir = path.resolve(__dirname, 'android-project');
    const keyFiles = [
      { name: 'MainActivity.kt', path: 'app/src/main/java/com/netcam/scanner/MainActivity.kt', language: 'kotlin' },
      { name: 'NetworkScanner.kt', path: 'app/src/main/java/com/netcam/scanner/scanner/NetworkScanner.kt', language: 'kotlin' },
      { name: 'CameraFingerprint.kt', path: 'app/src/main/java/com/netcam/scanner/scanner/CameraFingerprint.kt', language: 'kotlin' },
      { name: 'SubnetUtils.kt', path: 'app/src/main/java/com/netcam/scanner/scanner/SubnetUtils.kt', language: 'kotlin' },
      { name: 'MainScreen.kt', path: 'app/src/main/java/com/netcam/scanner/ui/MainScreen.kt', language: 'kotlin' },
      { name: 'CameraCard.kt', path: 'app/src/main/java/com/netcam/scanner/ui/components/CameraCard.kt', language: 'kotlin' },
      { name: 'CameraDetailDialog.kt', path: 'app/src/main/java/com/netcam/scanner/ui/components/CameraDetailDialog.kt', language: 'kotlin' },
      { name: 'AndroidManifest.xml', path: 'app/src/main/AndroidManifest.xml', language: 'xml' },
      { name: 'app/build.gradle.kts', path: 'app/build.gradle.kts', language: 'kotlin' },
      { name: 'settings.gradle.kts', path: 'settings.gradle.kts', language: 'kotlin' },
      { name: 'README.md', path: 'README.md', language: 'markdown' },
    ];

    const results = keyFiles.map((f) => {
      const fullPath = path.join(androidDir, f.path);
      const content = fs.existsSync(fullPath) ? fs.readFileSync(fullPath, 'utf-8') : '// File not found';
      return {
        ...f,
        content,
      };
    });

    res.json({ files: results });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: msg });
  }
});


// Setup Vite or static serving
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[NetCam Scanner] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

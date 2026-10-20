import type { DiscoveredDevice, OpenPort, DeviceCategory, DeviceType } from '../types.ts';

export interface VendorProfile {
  vendor: string;
  defaultUser: string;
  defaultPass: string;
  mainStreamPath: string;
  subStreamPath: string;
  onvifPath: string;
  recommendedAndroidApp: string;
  notes: string;
}

export const VENDOR_PROFILES: Record<string, VendorProfile> = {
  Hikvision: {
    vendor: 'Hikvision',
    defaultUser: 'admin',
    defaultPass: '12345',
    mainStreamPath: '/Streaming/Channels/101',
    subStreamPath: '/Streaming/Channels/102',
    onvifPath: '/onvif/device_service',
    recommendedAndroidApp: 'TinyCam Monitor PRO / Hik-Connect / VLC',
    notes: 'В новых прошивках требуется активация сложного пароля через веб-интерфейс (порт 80/443).',
  },
  Dahua: {
    vendor: 'Dahua / IMOU',
    defaultUser: 'admin',
    defaultPass: 'admin',
    mainStreamPath: '/cam/realmonitor?channel=1&subtype=0',
    subStreamPath: '/cam/realmonitor?channel=1&subtype=1',
    onvifPath: '/onvif/device_service',
    recommendedAndroidApp: 'DMSS / TinyCam / gDMSS Plus',
    notes: 'Порт 37777 используется приложением DMSS для прямого быстрого P2P/IP подключения.',
  },
  Xiongmai: {
    vendor: 'Xiongmai (XM / iCSee)',
    defaultUser: 'admin',
    defaultPass: '',
    mainStreamPath: '/user={user}_password={pass}_channel=1_stream=0.sdp',
    subStreamPath: '/user={user}_password={pass}_channel=1_stream=1.sdp',
    onvifPath: '/onvif/device_service',
    recommendedAndroidApp: 'iCSee / TinyCam (выбрать XM / Xiongmai) / Onvifer',
    notes: 'Порт 34567 — фирменный NetIP. Пароль по умолчанию часто пустой.',
  },
  Tapo: {
    vendor: 'TP-Link Tapo',
    defaultUser: 'admin',
    defaultPass: 'password',
    mainStreamPath: '/stream1',
    subStreamPath: '/stream2',
    onvifPath: '/onvif/device_service',
    recommendedAndroidApp: 'Tapo app / TinyCam / VLC',
    notes: 'В приложении Tapo нужно создать "Учетную запись камеры" в разделе Расширенные настройки -> Учетная запись.',
  },
  Reolink: {
    vendor: 'Reolink',
    defaultUser: 'admin',
    defaultPass: '',
    mainStreamPath: '/h264Preview_01_main',
    subStreamPath: '/h264Preview_01_sub',
    onvifPath: '/onvif/device_service',
    recommendedAndroidApp: 'Reolink App / TinyCam / VLC',
    notes: 'RTSP и ONVIF по умолчанию могут быть выключены в веб-настройках (Network -> Advanced -> Server Settings).',
  },
  Axis: {
    vendor: 'Axis Communications',
    defaultUser: 'root',
    defaultPass: 'pass',
    mainStreamPath: '/axis-media/media.amp?videocodec=h264',
    subStreamPath: '/axis-media/media.amp?videocodec=h264&resolution=640x360',
    onvifPath: '/onvif/device_service',
    recommendedAndroidApp: 'Axis Companion / TinyCam / CamViewer',
    notes: 'Промышленный стандарт. Отличная поддержка ONVIF Profile S/T/G.',
  },
  Uniview: {
    vendor: 'Uniview (UNV)',
    defaultUser: 'admin',
    defaultPass: '123456',
    mainStreamPath: '/unicast/c1/s0/live',
    subStreamPath: '/unicast/c1/s1/live',
    onvifPath: '/onvif/device_service',
    recommendedAndroidApp: 'EZView / TinyCam PRO',
    notes: 'Качественная поддержка RTSP и ONVIF протоколов.',
  },
  Generic: {
    vendor: 'Generic ONVIF / RTSP',
    defaultUser: 'admin',
    defaultPass: 'admin',
    mainStreamPath: '/live/ch0',
    subStreamPath: '/live/ch1',
    onvifPath: '/onvif/device_service',
    recommendedAndroidApp: 'TinyCam Monitor / Onvifer / VLC for Android',
    notes: 'Универсальная камера. Подходит автопоиск ONVIF в приложении TinyCam или Onvifer.',
  },
};

/**
 * Detects vendor and device classification (cameras, routers, PCs, phones, TVs, printers, NAS)
 */
export function identifyDeviceTraits(params: {
  ports: number[];
  httpTitle?: string;
  httpServer?: string;
  mac?: string;
  hostname?: string;
}): {
  vendor: string;
  isCamera: boolean;
  confidence: number;
  deviceType: DeviceType;
  category: DeviceCategory;
  modelHint?: string;
} {
  const { ports, httpTitle = '', httpServer = '', mac = '', hostname = '' } = params;
  const pSet = new Set(ports);
  const textBlob = `${httpTitle} ${httpServer} ${hostname} ${mac}`.toLowerCase();

  // 1. IP-Cameras & Video Recorders (Hikvision)
  if (pSet.has(8000) || textBlob.includes('hikvision') || textBlob.includes('dvr-web') || textBlob.includes('hik-') || textBlob.includes('dvrdvs-webs')) {
    return {
      vendor: 'Hikvision',
      isCamera: true,
      confidence: 98,
      category: 'camera',
      deviceType: pSet.has(8000) && pSet.has(554) ? 'ip-camera' : 'nvr-dvr',
      modelHint: 'Hikvision IP Camera / NVR',
    };
  }

  // Dahua
  if (pSet.has(37777) || pSet.has(37778) || textBlob.includes('dahua') || textBlob.includes('imou') || textBlob.includes('general_nvr')) {
    return {
      vendor: 'Dahua',
      isCamera: true,
      confidence: 96,
      category: 'camera',
      deviceType: 'ip-camera',
      modelHint: 'Dahua IPC / DVR Starlight',
    };
  }

  // Xiongmai (XM / iCSee)
  if (pSet.has(34567) || textBlob.includes('netsurveillance') || textBlob.includes('xiongmai') || textBlob.includes('uc-httpd') || textBlob.includes('icsee')) {
    return {
      vendor: 'Xiongmai',
      isCamera: true,
      confidence: 94,
      category: 'camera',
      deviceType: 'ip-camera',
      modelHint: 'XM / iCSee IP Camera',
    };
  }

  // TP-Link Tapo
  if (pSet.has(2020) || textBlob.includes('tapo') || textBlob.includes('c200') || textBlob.includes('c310')) {
    return {
      vendor: 'TP-Link Tapo',
      isCamera: true,
      confidence: 92,
      category: 'camera',
      deviceType: 'ip-camera',
      modelHint: 'TP-Link Tapo Smart Cam',
    };
  }

  // Reolink
  if (textBlob.includes('reolink') || textBlob.includes('rlc-')) {
    return {
      vendor: 'Reolink',
      isCamera: true,
      confidence: 92,
      category: 'camera',
      deviceType: 'ip-camera',
      modelHint: 'Reolink IP Camera',
    };
  }

  // Axis
  if (textBlob.includes('axis') || textBlob.includes('axis network camera')) {
    return {
      vendor: 'Axis',
      isCamera: true,
      confidence: 95,
      category: 'camera',
      deviceType: 'ip-camera',
      modelHint: 'Axis Network Camera',
    };
  }

  // Generic RTSP / ONVIF camera
  const hasRtsp = pSet.has(554) || pSet.has(8554);
  const hasOnvif = pSet.has(8899) || pSet.has(3702) || textBlob.includes('onvif');

  if (hasRtsp) {
    return {
      vendor: hasOnvif ? 'Generic (ONVIF)' : 'Generic (RTSP)',
      isCamera: true,
      confidence: hasOnvif ? 88 : 78,
      category: 'camera',
      deviceType: 'ip-camera',
      modelHint: 'RTSP/ONVIF Streaming Camera',
    };
  }

  if (hasOnvif) {
    return {
      vendor: 'Generic (ONVIF)',
      isCamera: true,
      confidence: 82,
      category: 'camera',
      deviceType: 'ip-camera',
      modelHint: 'ONVIF Device',
    };
  }

  // 2. Network Printers
  if (pSet.has(9100) || pSet.has(631) || pSet.has(515) || textBlob.includes('printer') || textBlob.includes('laserjet') || textBlob.includes('epson') || textBlob.includes('canon') || textBlob.includes('xerox') || textBlob.includes('kyocera') || textBlob.includes('brother')) {
    const printerBrand = textBlob.includes('hp') || textBlob.includes('laserjet') ? 'HP LaserJet'
      : textBlob.includes('epson') ? 'Epson Printer'
      : textBlob.includes('canon') ? 'Canon Printer'
      : textBlob.includes('brother') ? 'Brother Printer'
      : textBlob.includes('kyocera') ? 'Kyocera Printer'
      : textBlob.includes('xerox') ? 'Xerox Printer'
      : 'Сетевой принтер (RAW/IPP)';
    return {
      vendor: printerBrand,
      isCamera: false,
      confidence: 90,
      category: 'printer',
      deviceType: 'printer',
      modelHint: 'Сетевой принтер / МФУ (Порт 9100/631)',
    };
  }

  // 3. Network Routers & Gateways
  if (pSet.has(8291) || textBlob.includes('mikrotik') || textBlob.includes('routeros')) {
    return {
      vendor: 'MikroTik RouterOS',
      isCamera: false,
      confidence: 95,
      category: 'router',
      deviceType: 'router',
      modelHint: 'Маршрутизатор MikroTik (WinBox 8291)',
    };
  }

  if (textBlob.includes('keenetic')) {
    return {
      vendor: 'Keenetic Router',
      isCamera: false,
      confidence: 95,
      category: 'router',
      deviceType: 'router',
      modelHint: 'Интернет-центр Keenetic (Wi-Fi 6)',
    };
  }

  if (textBlob.includes('openwrt') || textBlob.includes('luci')) {
    return {
      vendor: 'OpenWrt Router',
      isCamera: false,
      confidence: 92,
      category: 'router',
      deviceType: 'router',
      modelHint: 'Роутер с прошивкой OpenWrt',
    };
  }

  if (textBlob.includes('asus') && (pSet.has(80) || pSet.has(8443) || pSet.has(53))) {
    return {
      vendor: 'ASUS Wi-Fi Router',
      isCamera: false,
      confidence: 90,
      category: 'router',
      deviceType: 'router',
      modelHint: 'Маршрутизатор ASUS RT/ZenWiFi',
    };
  }

  if (pSet.has(53) && (pSet.has(80) || pSet.has(443))) {
    return {
      vendor: 'Wi-Fi Роутер / Шлюз',
      isCamera: false,
      confidence: 85,
      category: 'router',
      deviceType: 'router',
      modelHint: 'Сетевой шлюз (DNS 53 + Web)',
    };
  }

  // 4. Smart TV & Media Streamers
  if (pSet.has(8008) || pSet.has(8009) || textBlob.includes('chromecast') || textBlob.includes('google cast')) {
    return {
      vendor: 'Google Cast / Chromecast',
      isCamera: false,
      confidence: 92,
      category: 'tv-media',
      deviceType: 'smart-tv',
      modelHint: 'Медиаплеер Chromecast / Android TV (8008)',
    };
  }

  if (textBlob.includes('tizen') || textBlob.includes('samsung smart') || textBlob.includes('sec_dtv')) {
    return {
      vendor: 'Samsung Smart TV',
      isCamera: false,
      confidence: 92,
      category: 'tv-media',
      deviceType: 'smart-tv',
      modelHint: 'Телевизор Samsung Smart TV (Tizen OS)',
    };
  }

  if (textBlob.includes('webos') || textBlob.includes('lg smart tv')) {
    return {
      vendor: 'LG Smart TV',
      isCamera: false,
      confidence: 92,
      category: 'tv-media',
      deviceType: 'smart-tv',
      modelHint: 'Телевизор LG Smart TV (webOS)',
    };
  }

  if (pSet.has(7000) || textBlob.includes('appletv') || textBlob.includes('airplay')) {
    return {
      vendor: 'Apple TV / AirPlay',
      isCamera: false,
      confidence: 90,
      category: 'tv-media',
      deviceType: 'smart-tv',
      modelHint: 'Медиаплеер Apple TV / AirPlay (7000)',
    };
  }

  if (pSet.has(32400) || textBlob.includes('plex')) {
    return {
      vendor: 'Plex Media Server',
      isCamera: false,
      confidence: 95,
      category: 'tv-media',
      deviceType: 'nas-server',
      modelHint: 'Медиасервер Plex (32400)',
    };
  }

  // 5. NAS & Home Automation
  if (pSet.has(5000) || pSet.has(5001) || textBlob.includes('synology') || textBlob.includes('diskstation')) {
    return {
      vendor: 'Synology NAS',
      isCamera: false,
      confidence: 95,
      category: 'nas-iot',
      deviceType: 'nas-server',
      modelHint: 'Сетевое хранилище Synology DiskStation',
    };
  }

  if (pSet.has(8123) || textBlob.includes('homeassistant') || textBlob.includes('home assistant')) {
    return {
      vendor: 'Home Assistant',
      isCamera: false,
      confidence: 95,
      category: 'nas-iot',
      deviceType: 'smart-iot',
      modelHint: 'Шлюз умного дома Home Assistant (8123)',
    };
  }

  // 6. Computers & Workstations (Windows, Mac, Linux)
  if (pSet.has(445) || pSet.has(139) || pSet.has(3389) || textBlob.includes('microsoft') || textBlob.includes('windows')) {
    return {
      vendor: 'Windows ПК / Ноутбук',
      isCamera: false,
      confidence: 90,
      category: 'workstation',
      deviceType: 'workstation',
      modelHint: pSet.has(3389) ? 'Рабочая станция Windows (RDP + SMB)' : 'Компьютер Windows (SMB 445)',
    };
  }

  if (pSet.has(22)) {
    const isMac = textBlob.includes('mac') || textBlob.includes('apple') || textBlob.includes('darwin');
    return {
      vendor: isMac ? 'Apple Mac / MacBook' : 'Linux Сервер / ПК',
      isCamera: false,
      confidence: 85,
      category: 'workstation',
      deviceType: 'workstation',
      modelHint: isMac ? 'Компьютер macOS (SSH 22)' : 'Linux Сервер / Узел (SSH 22)',
    };
  }

  // 7. Smartphones & Mobile Devices
  if (textBlob.includes('android') || textBlob.includes('samsung') || textBlob.includes('pixel') || textBlob.includes('xiaomi') || textBlob.includes('huawei')) {
    return {
      vendor: 'Android Смартфон / Планшет',
      isCamera: false,
      confidence: 85,
      category: 'mobile',
      deviceType: 'mobile-android',
      modelHint: 'Мобильное устройство Android',
    };
  }

  if (textBlob.includes('iphone') || textBlob.includes('ipad') || textBlob.includes('ios')) {
    return {
      vendor: 'Apple iPhone / iPad',
      isCamera: false,
      confidence: 85,
      category: 'mobile',
      deviceType: 'mobile-ios',
      modelHint: 'Смартфон Apple iOS',
    };
  }

  // Default active host
  return {
    vendor: 'Сетевое устройство (Активный хост)',
    isCamera: false,
    confidence: 50,
    category: 'other',
    deviceType: 'network-host',
    modelHint: `Активный сетевой узел (${ports.length} откр. портов)`,
  };
}

/**
 * Builds standard RTSP URLs for a given IP and vendor
 */
export function buildRtspUrls(
  ip: string,
  vendor: string,
  username: string = 'admin',
  password: string = 'admin',
  port: number = 554
): { main: string; sub: string; description: string }[] {
  const encUser = encodeURIComponent(username);
  const encPass = password ? `:${encodeURIComponent(password)}` : '';
  const auth = username ? `${encUser}${encPass}@` : '';
  const host = `${ip}:${port}`;

  const profile = VENDOR_PROFILES[vendor] || VENDOR_PROFILES.Generic;

  const replaceTokens = (path: string) =>
    path
      .replace('{user}', encodeURIComponent(username))
      .replace('{pass}', encodeURIComponent(password));

  const mainPath = replaceTokens(profile.mainStreamPath);
  const subPath = replaceTokens(profile.subStreamPath);

  const list = [
    {
      main: `rtsp://${auth}${host}${mainPath.startsWith('/') ? mainPath : `/${mainPath}`}`,
      sub: `rtsp://${auth}${host}${subPath.startsWith('/') ? subPath : `/${subPath}`}`,
      description: `${profile.vendor} Стандартный поток`,
    },
  ];

  if (vendor !== 'Generic') {
    list.push({
      main: `rtsp://${auth}${host}/live/ch0`,
      sub: `rtsp://${auth}${host}/live/ch1`,
      description: 'Универсальный ONVIF / RTSP поток (Запасной)',
    });
    list.push({
      main: `rtsp://${auth}${host}/ch0_0.264`,
      sub: `rtsp://${auth}${host}/ch0_1.264`,
      description: 'Альтернативный H.264 поток',
    });
  }

  return list;
}

/**
 * Generates an M3U playlist file content for Android VLC or IPTV players
 */
export function generateM3uPlaylist(devices: DiscoveredDevice[], username?: string, password?: string): string {
  const lines: string[] = ['#EXTM3U', '# Generated by NetCam Scanner for Android'];

  const cameras = devices.filter((d) => d.isCamera);
  for (const cam of cameras) {
    const urls = buildRtspUrls(cam.ip, cam.vendor || 'Generic', username || 'admin', password || 'admin');
    const mainUrl = urls[0]?.main || `rtsp://${cam.ip}:554/live/ch0`;
    const title = `${cam.vendor || 'IP-Камера'} (${cam.ip})`;

    lines.push(`#EXTINF:-1 tvg-id="${cam.ip}" group-title="IP Cameras",${title} [Main Stream]`);
    lines.push(mainUrl);

    if (urls[0]?.sub) {
      lines.push(`#EXTINF:-1 tvg-id="${cam.ip}-sub" group-title="IP Cameras Sub",${title} [Sub Stream]`);
      lines.push(urls[0].sub);
    }
  }

  return lines.join('\n');
}

/**
 * Generates TinyCam Monitor XML/JSON compatible configuration snippet
 */
export function generateTinyCamConfig(device: DiscoveredDevice, username: string = 'admin', password: string = 'admin') {
  return {
    camera: {
      name: `${device.vendor || 'IP Camera'} ${device.ip}`,
      vendor: device.vendor || 'Generic',
      model: device.model || 'RTSP over TCP',
      host: device.ip,
      port: 554,
      httpPort: device.openPorts.find((p) => p.port === 80 || p.port === 8080)?.port || 80,
      user: username,
      password: password,
      protocol: 'RTSP',
      channel: 1,
    },
  };
}

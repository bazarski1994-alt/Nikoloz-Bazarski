/**
 * Utility functions for IP address manipulation, CIDR calculation, and port dictionaries.
 */

// Comprehensive network ports dictionary
export const NETWORK_PORTS: Record<number, { service: string; isCamera: boolean; category: string; description: string }> = {
  // Web & Common Management
  80: { service: 'HTTP', isCamera: false, category: 'web', description: 'Веб-интерфейс управления (HTTP)' },
  443: { service: 'HTTPS', isCamera: false, category: 'web', description: 'Защищенный веб-интерфейс (SSL/TLS)' },
  8080: { service: 'HTTP-Alt', isCamera: false, category: 'web', description: 'Альтернативный веб-порт / Прокси / Веб-камера' },
  8443: { service: 'HTTPS-Alt', isCamera: false, category: 'web', description: 'Альтернативный защищенный веб-порт' },

  // Video Streaming & IP Cameras
  554: { service: 'RTSP', isCamera: true, category: 'camera', description: 'Потоковое видео RTSP (Real Time Streaming Protocol)' },
  8554: { service: 'RTSP-Alt', isCamera: true, category: 'camera', description: 'Альтернативный RTSP видеопоток' },
  8000: { service: 'Hikvision-Dev', isCamera: true, category: 'camera', description: 'Порт управления Hikvision / HiLook / EZVIZ' },
  37777: { service: 'Dahua-DVR', isCamera: true, category: 'camera', description: 'Служебный порт Dahua / IMOU видеорегистратора' },
  37778: { service: 'Dahua-UDP', isCamera: true, category: 'camera', description: 'UDP порт обнаружения и управления Dahua' },
  34567: { service: 'Xiongmai-NetIP', isCamera: true, category: 'camera', description: 'Порт Xiongmai / XM / iCSee / Polyvision DVR/IPC' },
  8899: { service: 'ONVIF-Soap', isCamera: true, category: 'camera', description: 'Стандартный порт ONVIF веб-служб' },
  3702: { service: 'WS-Discovery', isCamera: true, category: 'camera', description: 'ONVIF WS-Discovery (поиск камер в сети)' },
  1935: { service: 'RTMP', isCamera: true, category: 'camera', description: 'Потоковый видеосервер RTMP' },
  8081: { service: 'MJPEG-Stream', isCamera: true, category: 'camera', description: 'MJPEG стрим камеры' },
  9000: { service: 'Camera-Config', isCamera: true, category: 'camera', description: 'Служба конфигурации камер Reolink / ONVIF' },
  2020: { service: 'Tapo-Control', isCamera: true, category: 'camera', description: 'Порт управления умными камерами TP-Link Tapo' },

  // Computers & Workstations (Windows, Mac, Linux)
  445: { service: 'SMB', isCamera: false, category: 'workstation', description: 'Microsoft Windows SMB / Samba общий доступ к файлам' },
  139: { service: 'NetBIOS', isCamera: false, category: 'workstation', description: 'Служба сеансов NetBIOS Windows' },
  135: { service: 'MS-RPC', isCamera: false, category: 'workstation', description: 'Служба удаленного вызова процедур Microsoft RPC' },
  3389: { service: 'RDP', isCamera: false, category: 'workstation', description: 'Удаленный рабочий стол Windows Remote Desktop' },
  22: { service: 'SSH', isCamera: false, category: 'workstation', description: 'Защищенный терминал SSH (Linux / macOS / Серверы)' },
  23: { service: 'Telnet', isCamera: false, category: 'workstation', description: 'Удаленный терминал Telnet' },
  5900: { service: 'VNC', isCamera: false, category: 'workstation', description: 'Удаленный рабочий стол VNC' },

  // Network Infrastructure & Routers
  53: { service: 'DNS', isCamera: false, category: 'router', description: 'Служба доменных имен DNS (часто открыт на Wi-Fi роутере)' },
  161: { service: 'SNMP', isCamera: false, category: 'router', description: 'Протокол сетевого управления SNMP' },
  8291: { service: 'WinBox', isCamera: false, category: 'router', description: 'Порт управления MikroTik RouterOS WinBox' },

  // Network Printers
  9100: { service: 'RAW-Print', isCamera: false, category: 'printer', description: 'Порт прямой сетевой печати (HP JetDirect / RAW)' },
  631: { service: 'IPP', isCamera: false, category: 'printer', description: 'Internet Printing Protocol (сетевые принтеры CUPS / AirPrint)' },
  515: { service: 'LPD', isCamera: false, category: 'printer', description: 'Line Printer Daemon' },

  // Smart TV & Media Streamers
  8008: { service: 'Google-Cast', isCamera: false, category: 'tv-media', description: 'Google Cast / Chromecast Web Server' },
  8009: { service: 'Cast-Media', isCamera: false, category: 'tv-media', description: 'Google Cast управление медиа' },
  7000: { service: 'AirPlay', isCamera: false, category: 'tv-media', description: 'Apple AirPlay сервис' },
  32400: { service: 'Plex', isCamera: false, category: 'tv-media', description: 'Медиасервер Plex' },

  // NAS, Smart Home & IoT
  5000: { service: 'UPnP/Synology', isCamera: false, category: 'nas-iot', description: 'UPnP шлюз или веб-интерфейс Synology DSM' },
  5001: { service: 'Synology-SSL', isCamera: false, category: 'nas-iot', description: 'Защищенный веб-интерфейс Synology DSM HTTPS' },
  8123: { service: 'HomeAssistant', isCamera: false, category: 'nas-iot', description: 'Панель умного дома Home Assistant' },
  1883: { service: 'MQTT', isCamera: false, category: 'nas-iot', description: 'Брокер сообщений умного дома MQTT' },
};

// Backwards compatibility alias
export const CAMERA_PORTS = NETWORK_PORTS;

/**
 * Checks whether an IP string is a valid IPv4 address
 */
export function isValidIpv4(ip: string): boolean {
  if (!ip) return false;
  const parts = ip.trim().split('.');
  if (parts.length !== 4) return false;
  for (const part of parts) {
    if (!/^\d+$/.test(part)) return false;
    const num = Number(part);
    if (num < 0 || num > 255) return false;
    if (part.length > 1 && part.startsWith('0')) return false;
  }
  return true;
}

/**
 * Converts dotted IPv4 string to 32-bit unsigned integer
 */
export function ipToInt(ip: string): number {
  return ip
    .split('.')
    .reduce((acc, octet) => ((acc << 8) + Number(octet)) >>> 0, 0);
}

/**
 * Converts 32-bit integer to dotted IPv4 string
 */
export function intToIp(int: number): string {
  return [
    (int >>> 24) & 255,
    (int >>> 16) & 255,
    (int >>> 8) & 255,
    int & 255,
  ].join('.');
}

/**
 * Calculates start IP, end IP, and total usable hosts from CIDR (e.g. 192.168.1.0/24)
 */
export function parseCidr(cidr: string): {
  valid: boolean;
  networkIp?: string;
  netmask?: string;
  prefix?: number;
  startIp?: string;
  endIp?: string;
  totalHosts?: number;
  error?: string;
} {
  const match = cidr.trim().match(/^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\/(\d{1,2})$/);
  if (!match) {
    if (isValidIpv4(cidr.trim())) {
      const cleanIp = cidr.trim();
      return {
        valid: true,
        networkIp: cleanIp,
        prefix: 32,
        startIp: cleanIp,
        endIp: cleanIp,
        totalHosts: 1,
      };
    }
    return { valid: false, error: 'Неверный формат CIDR (например, 192.168.1.0/24)' };
  }

  const baseIp = match[1];
  const prefix = Number(match[2]);

  if (!isValidIpv4(baseIp)) {
    return { valid: false, error: 'Некорректный базовый IP адрес' };
  }
  if (prefix < 16 || prefix > 32) {
    return { valid: false, error: 'Префикс маски должен быть от /16 до /32 для безопасности сканирования' };
  }

  const ipInt = ipToInt(baseIp);
  const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
  const netInt = (ipInt & mask) >>> 0;
  const broadcastInt = (netInt | ~mask) >>> 0;

  if (prefix === 32) {
    const single = intToIp(netInt);
    return {
      valid: true,
      networkIp: single,
      prefix,
      startIp: single,
      endIp: single,
      totalHosts: 1,
    };
  }

  if (prefix === 31) {
    return {
      valid: true,
      networkIp: intToIp(netInt),
      prefix,
      startIp: intToIp(netInt),
      endIp: intToIp(broadcastInt),
      totalHosts: 2,
    };
  }

  const startInt = netInt + 1;
  const endInt = broadcastInt - 1;
  const totalHosts = Math.max(0, endInt - startInt + 1);

  return {
    valid: true,
    networkIp: intToIp(netInt),
    netmask: intToIp(mask),
    prefix,
    startIp: intToIp(startInt),
    endIp: intToIp(endInt),
    totalHosts,
  };
}

/**
 * Generates an array of IP addresses for a given CIDR notation or range
 */
export function generateIpRange(target: string, maxHosts: number = 256): string[] {
  const parsed = parseCidr(target);
  if (!parsed.valid || !parsed.startIp || !parsed.endIp) {
    if (isValidIpv4(target.trim())) {
      return [target.trim()];
    }
    return [];
  }

  const start = ipToInt(parsed.startIp);
  const end = ipToInt(parsed.endIp);
  const ips: string[] = [];

  const limit = Math.min(end, start + maxHosts - 1);
  for (let current = start; current <= limit; current++) {
    ips.push(intToIp(current));
  }

  return ips;
}

/**
 * Standard Port Presets
 */
export const PORT_PRESETS = [
  {
    id: 'all_devices',
    name: 'Все устройства сети (Комплексный)',
    description: 'Компьютеры (SMB/RDP/SSH), роутеры, смартфоны, Smart TV, принтеры и камеры',
    ports: [80, 443, 445, 22, 53, 554, 8080, 8000, 3389, 9100, 37777, 34567, 8899, 5000, 8008],
    badge: 'Рекомендуется',
  },
  {
    id: 'camera_essential',
    name: 'IP-Камеры и Видеорегистраторы',
    description: 'RTSP (554), Web (80, 8080, 443), Hikvision (8000), Dahua (37777), Xiongmai (34567), ONVIF (8899)',
    ports: [554, 80, 8080, 443, 8000, 37777, 34567, 8899],
    badge: 'Камеры',
  },
  {
    id: 'computers_servers',
    name: 'Компьютеры и серверы (PC/Mac/Linux)',
    description: 'Windows SMB (445), RDP (3389), SSH (22), Web (80, 443, 8080), VNC (5900)',
    ports: [445, 3389, 22, 80, 443, 8080, 5900, 139],
    badge: 'ПК/Серверы',
  },
  {
    id: 'printers_iot',
    name: 'Принтеры, Smart TV, IoT и NAS',
    description: 'RAW печать (9100), IPP (631), Cast (8008), Synology (5000), Home Assistant (8123)',
    ports: [9100, 631, 8008, 8009, 5000, 8123, 32400, 80],
    badge: 'Smart/IoT',
  },
  {
    id: 'fast_discovery',
    name: 'Быстрый опрос сети (Основные порты)',
    description: 'Проверка самых распространенных портов для скоростного составления карты сети',
    ports: [80, 445, 22, 554, 53],
    badge: 'Сверхбыстрый',
  },
];

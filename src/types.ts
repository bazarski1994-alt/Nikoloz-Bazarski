export interface OpenPort {
  port: number;
  protocol: 'tcp' | 'udp';
  service: string;
  isCameraRelated: boolean;
  banner?: string;
}

export type DeviceCategory =
  | 'all'
  | 'camera'
  | 'router'
  | 'workstation'
  | 'mobile'
  | 'tv-media'
  | 'printer'
  | 'nas-iot'
  | 'other';

export type DeviceType =
  | 'ip-camera'
  | 'nvr-dvr'
  | 'router'
  | 'workstation'
  | 'mobile-android'
  | 'mobile-ios'
  | 'smart-tv'
  | 'printer'
  | 'nas-server'
  | 'smart-iot'
  | 'network-host'
  | 'unknown';

export type RiskSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export type LanguageCode = 'ru' | 'ka' | 'en';

export interface EducationalRemediationOption {
  id: string;
  category: 'credentials' | 'vlan' | 'services' | 'firmware' | 'firewall' | 'encryption';
  title: string;
  description: string;
  actionSteps: string[];
  commandExample?: string;
  priority: 'immediate' | 'high' | 'recommended' | 'best-practice';
}

export interface SecurityIssue {
  id: string;
  severity: RiskSeverity;
  title: string;
  description: string;
  port?: number;
  remediation: string;
  cveOrRef?: string;
  technicalDetails?: string;
  threatModel?: string;
  testVerificationSteps?: string[];
  safeAuditCommand?: string;
  remediationOptions?: EducationalRemediationOption[];
}

export interface DiscoveredDevice {
  id: string;
  ip: string;
  mac?: string;
  hostname?: string;
  vendor?: string;
  model?: string;
  deviceType: DeviceType;
  category: DeviceCategory;
  openPorts: OpenPort[];
  httpTitle?: string;
  httpServer?: string;
  isCamera: boolean;
  confidence: number;
  latencyMs: number;
  lastSeen: string;
  firmware?: string;
  rtspUrls: {
    main: string;
    sub: string;
    description: string;
  }[];
  onvifUrl?: string;
  webUiUrl?: string;
  securityIssues: SecurityIssue[];
  riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical';
  androidPresets: {
    appName: string;
    recommendedModel: string;
    setupNote: string;
  }[];
}

export interface SubnetInterface {
  name: string;
  address: string;
  netmask: string;
  family: string;
  cidr: string;
  hostAddress?: string;
  displayName?: string;
  internal: boolean;
  isRecommended?: boolean;
}

export interface ScanOptions {
  targets: string[];
  ports: number[];
  timeoutMs: number;
  concurrency: number;
  grabBanners: boolean;
  useDemoMode?: boolean;
}

export interface ScanProgress {
  totalHosts: number;
  scannedHosts: number;
  discoveredHosts: number;
  camerasFound: number;
  status: 'idle' | 'scanning' | 'completed' | 'stopped';
  currentIp?: string;
  elapsedSeconds: number;
}

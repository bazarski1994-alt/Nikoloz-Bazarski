import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  Search,
  Filter,
  Sparkles,
  Smartphone,
  Cpu,
  Layers,
  ArrowUpDown,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ListFilter,
  SlidersHorizontal,
  Router,
  Monitor,
  Printer,
  Tv,
  HardDrive,
  Home,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Wifi,
} from 'lucide-react';
import { Header } from './components/Header.tsx';
import { ScanControls } from './components/ScanControls.tsx';
import { DeviceCard } from './components/DeviceCard.tsx';
import { AndroidSetupModal } from './components/AndroidSetupModal.tsx';
import { SecurityAuditModal } from './components/SecurityAuditModal.tsx';
import { PortDistribution } from './components/PortDistribution.tsx';
import { SingleIpScanner } from './components/SingleIpScanner.tsx';
import { AndroidHub } from './components/AndroidHub.tsx';
import { AndroidProjectTab } from './components/AndroidProjectTab.tsx';
import { PORT_PRESETS } from './utils/networkUtils.ts';
import { LanguageProvider, useTranslation } from './utils/i18n.tsx';
import type { DiscoveredDevice, ScanProgress, SubnetInterface, DeviceCategory } from './types.ts';

function AppContent() {
  const { t } = useTranslation();

  const [interfaces, setInterfaces] = useState<SubnetInterface[]>([]);
  const [cidr, setCidr] = useState<string>('192.168.1.0/24');
  const [selectedPresetId, setSelectedPresetId] = useState<string>(PORT_PRESETS[0].id);
  const [ports, setPorts] = useState<number[]>(PORT_PRESETS[0].ports);
  const [customPorts, setCustomPorts] = useState<string>(PORT_PRESETS[0].ports.join(', '));
  const [timeoutMs, setTimeoutMs] = useState<number>(600);
  const [concurrency, setConcurrency] = useState<number>(16);

  const [isDemoMode, setIsDemoMode] = useState<boolean>(true);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [isAutoDetecting, setIsAutoDetecting] = useState<boolean>(false);
  const [devices, setDevices] = useState<DiscoveredDevice[]>([]);
  const [selectedDeviceForAndroid, setSelectedDeviceForAndroid] = useState<DiscoveredDevice | null>(null);
  const [selectedDeviceForSecurity, setSelectedDeviceForSecurity] = useState<DiscoveredDevice | null>(null);

  const [activeTab, setActiveTab] = useState<'devices' | 'ports' | 'single' | 'android' | 'android-studio'>('devices');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<DeviceCategory>('all');
  const [selectedPortFilter, setSelectedPortFilter] = useState<number | null>(null);
  const [showOnlyVulnerable, setShowOnlyVulnerable] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'confidence' | 'latency' | 'ip'>('ip');

  const [progress, setProgress] = useState<ScanProgress>({
    totalHosts: 0,
    scannedHosts: 0,
    discoveredHosts: 0,
    camerasFound: 0,
    status: 'idle',
    elapsedSeconds: 0,
  });

  const eventSourceRef = useRef<EventSource | null>(null);
  const timerRef = useRef<number | null>(null);

  // Network Auto-Detection Function
  const fetchNetworkInterfaces = (applyDefaultSubnet = false) => {
    setIsAutoDetecting(true);
    fetch('/api/network-interfaces')
      .then((res) => res.json())
      .then((data) => {
        if (data.interfaces && data.interfaces.length > 0) {
          setInterfaces(data.interfaces);
          if (applyDefaultSubnet && data.defaultSuggestedSubnet) {
            setCidr(data.defaultSuggestedSubnet);
          }
        }
      })
      .catch((err) => console.error('Failed to get network interfaces', err))
      .finally(() => {
        setTimeout(() => setIsAutoDetecting(false), 400);
      });
  };

  // Fetch initial network interfaces & demo devices
  useEffect(() => {
    fetchNetworkInterfaces(true);

    // Pre-populate with demo devices so initial screen shows devices immediately
    fetch('/api/demo-devices')
      .then((res) => res.json())
      .then((data) => {
        if (data.devices) {
          setDevices(data.devices);
          setProgress((prev) => ({
            ...prev,
            discoveredHosts: data.devices.length,
            camerasFound: data.devices.filter((d: DiscoveredDevice) => d.isCamera).length,
            status: 'completed',
            totalHosts: data.devices.length,
            scannedHosts: data.devices.length,
          }));
        }
      })
      .catch((err) => console.error('Failed to fetch demo devices', err));
  }, []);

  const handleSelectPreset = (id: string, presetPorts: number[]) => {
    setSelectedPresetId(id);
    setPorts(presetPorts);
    setCustomPorts(presetPorts.join(', '));
  };

  const handleCustomPortsChange = (val: string) => {
    setCustomPorts(val);
    const parsed = val
      .split(',')
      .map((p) => parseInt(p.trim(), 10))
      .filter((p) => !isNaN(p) && p > 0 && p <= 65535);
    if (parsed.length > 0) {
      setPorts(parsed);
      setSelectedPresetId('custom');
    }
  };

  const startScan = () => {
    if (isScanning) return;

    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setDevices([]);
    setIsScanning(true);
    setProgress({
      totalHosts: 0,
      scannedHosts: 0,
      discoveredHosts: 0,
      camerasFound: 0,
      status: 'scanning',
      elapsedSeconds: 0,
    });

    const startTime = Date.now();
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = window.setInterval(() => {
      setProgress((prev) => ({
        ...prev,
        elapsedSeconds: Math.floor((Date.now() - startTime) / 1000),
      }));
    }, 1000);

    const portsStr = ports.join(',');
    const url = `/api/scan/stream?cidr=${encodeURIComponent(cidr)}&ports=${encodeURIComponent(portsStr)}&timeout=${timeoutMs}&concurrency=${concurrency}&demo=${isDemoMode}`;

    const es = new EventSource(url);
    eventSourceRef.current = es;

    es.addEventListener('start', (e: MessageEvent) => {
      const data = JSON.parse(e.data);
      setProgress((prev) => ({
        ...prev,
        totalHosts: data.totalHosts || 254,
        status: 'scanning',
      }));
    });

    es.addEventListener('device', (e: MessageEvent) => {
      const dev: DiscoveredDevice = JSON.parse(e.data);
      setDevices((prev) => {
        const existing = prev.findIndex((d) => d.ip === dev.ip);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = dev;
          return updated;
        }
        return [...prev, dev];
      });

      setProgress((prev) => ({
        ...prev,
        discoveredHosts: prev.discoveredHosts + 1,
        camerasFound: prev.camerasFound + (dev.isCamera ? 1 : 0),
      }));
    });

    es.addEventListener('progress', (e: MessageEvent) => {
      const data = JSON.parse(e.data);
      setProgress((prev) => ({
        ...prev,
        scannedHosts: data.scannedHosts,
        totalHosts: data.totalHosts || prev.totalHosts,
        currentIp: data.currentIp,
      }));
    });

    es.addEventListener('complete', () => {
      setIsScanning(false);
      setProgress((prev) => ({ ...prev, status: 'completed' }));
      if (timerRef.current) clearInterval(timerRef.current);
      es.close();
    });

    es.onerror = () => {
      setIsScanning(false);
      setProgress((prev) => ({ ...prev, status: 'completed' }));
      if (timerRef.current) clearInterval(timerRef.current);
      es.close();
    };
  };

  const stopScan = () => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    if (timerRef.current) clearInterval(timerRef.current);
    setIsScanning(false);
    setProgress((prev) => ({ ...prev, status: 'completed' }));
  };

  // Filter and sort devices
  const filteredDevices = devices
    .filter((d) => {
      if (showOnlyVulnerable && d.riskLevel === 'safe' && (!d.securityIssues || d.securityIssues.length === 0)) {
        return false;
      }
      if (selectedCategory !== 'all' && d.category !== selectedCategory) return false;
      if (selectedPortFilter !== null && !d.openPorts.some((p) => p.port === selectedPortFilter)) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchIp = d.ip.includes(q);
        const matchVendor = d.vendor?.toLowerCase().includes(q);
        const matchModel = d.model?.toLowerCase().includes(q);
        const matchHost = d.hostname?.toLowerCase().includes(q);
        const matchPort = d.openPorts.some((p) => String(p.port).includes(q) || p.service.toLowerCase().includes(q));
        if (!matchIp && !matchVendor && !matchModel && !matchHost && !matchPort) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'confidence') return b.confidence - a.confidence;
      if (sortBy === 'latency') return a.latencyMs - b.latencyMs;
      return a.ip.localeCompare(b.ip, undefined, { numeric: true });
    });

  const camerasCount = devices.filter((d) => d.isCamera).length;
  const routersCount = devices.filter((d) => d.category === 'router').length;
  const workstationsCount = devices.filter((d) => d.category === 'workstation').length;
  const printersCount = devices.filter((d) => d.category === 'printer').length;
  const tvsCount = devices.filter((d) => d.category === 'tv-media').length;
  const mobilesCount = devices.filter((d) => d.category === 'mobile').length;
  const nasIotCount = devices.filter((d) => d.category === 'nas-iot').length;
  const vulnerableDevicesCount = devices.filter(
    (d) => d.riskLevel !== 'safe' || (d.securityIssues && d.securityIssues.length > 0)
  ).length;

  const CATEGORY_TABS: { id: DeviceCategory; label: string; icon: React.ReactNode; count: number }[] = [
    { id: 'all', label: t.catAll, icon: <Layers className="w-3.5 h-3.5" />, count: devices.length },
    { id: 'camera', label: t.catCameras, icon: <Camera className="w-3.5 h-3.5" />, count: camerasCount },
    { id: 'router', label: t.catRouters, icon: <Router className="w-3.5 h-3.5" />, count: routersCount },
    { id: 'workstation', label: t.catPCs, icon: <Monitor className="w-3.5 h-3.5" />, count: workstationsCount },
    { id: 'mobile', label: t.catMobile, icon: <Smartphone className="w-3.5 h-3.5" />, count: mobilesCount },
    { id: 'tv-media', label: t.catSmartTv, icon: <Tv className="w-3.5 h-3.5" />, count: tvsCount },
    { id: 'printer', label: t.catPrinters, icon: <Printer className="w-3.5 h-3.5" />, count: printersCount },
    { id: 'nas-iot', label: t.catSmartHome, icon: <Home className="w-3.5 h-3.5" />, count: nasIotCount },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      {/* Top Header */}
      <Header
        interfaces={interfaces}
        selectedInterface={cidr}
        onSelectInterface={(newCidr) => setCidr(newCidr)}
        isScanning={isScanning}
        isDemoMode={isDemoMode}
        onToggleDemoMode={() => setIsDemoMode(!isDemoMode)}
        discoveredCount={devices.length}
        camerasCount={camerasCount}
        vulnerableCount={vulnerableDevicesCount}
      />

      {/* Main Container */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 flex-1">
        {/* Scanner Configuration, Network Auto-Detection & Trigger */}
        <ScanControls
          cidr={cidr}
          onChangeCidr={(val) => setCidr(val)}
          selectedPresetId={selectedPresetId}
          onSelectPreset={handleSelectPreset}
          customPorts={customPorts}
          onChangeCustomPorts={handleCustomPortsChange}
          isScanning={isScanning}
          progress={progress}
          onStartScan={startScan}
          onStopScan={stopScan}
          timeoutMs={timeoutMs}
          onChangeTimeoutMs={setTimeoutMs}
          concurrency={concurrency}
          onChangeConcurrency={setConcurrency}
          isDemoMode={isDemoMode}
          interfaces={interfaces}
          onAutoDetect={() => fetchNetworkInterfaces(true)}
          isAutoDetecting={isAutoDetecting}
        />

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-2 flex-wrap gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setActiveTab('devices')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'devices'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm shadow-cyan-950'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>{t.tabDevices}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                {devices.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('ports')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'ports'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm shadow-cyan-950'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <Cpu className="w-4 h-4" />
              <span>{t.tabPorts}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('single')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'single'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm shadow-cyan-950'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <Search className="w-4 h-4" />
              <span>{t.tabSingleIp}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('android')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'android'
                  ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm shadow-cyan-950'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <Smartphone className="w-4 h-4" />
              <span>{t.tabAndroidPresets}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                M3U / QR
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('android-studio')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'android-studio'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 shadow-md shadow-cyan-950'
                  : 'text-zinc-300 hover:text-white bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <Smartphone className="w-4 h-4 text-cyan-400" />
              <span className="font-bold">{t.tabAndroidStudio}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
                ZIP
              </span>
            </button>
          </div>

          {/* Quick mode/status info */}
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            {isDemoMode && (
              <span className="text-[11px] text-amber-400/90 bg-amber-950/40 border border-amber-800/40 px-2.5 py-1 rounded-xl">
                {t.demoLabMode} ({devices.length} {t.devicesCount})
              </span>
            )}
          </div>
        </div>

        {/* TAB 1: Devices & Cameras Grid */}
        {activeTab === 'devices' && (
          <div className="space-y-4">
            {/* Category Filter Chips Bar + Only Vulnerable Toggle */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin flex-1">
                {CATEGORY_TABS.map((tab) => {
                  const isSelected = selectedCategory === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setSelectedCategory(tab.id)}
                      className={`text-xs px-3 py-1.5 rounded-xl border font-medium whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? 'bg-cyan-500 text-zinc-950 font-bold border-cyan-400 shadow-md shadow-cyan-950/40'
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                      }`}
                    >
                      {tab.icon}
                      <span>{tab.label}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                          isSelected ? 'bg-zinc-950/30 text-zinc-950 font-bold' : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Only Vulnerable Filter Button */}
              {vulnerableDevicesCount > 0 && (
                <button
                  type="button"
                  onClick={() => setShowOnlyVulnerable(!showOnlyVulnerable)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer shrink-0 ${
                    showOnlyVulnerable
                      ? 'bg-rose-500 text-white border-rose-400 shadow-md shadow-rose-950/40'
                      : 'bg-rose-950/30 text-rose-300 border-rose-800/60 hover:bg-rose-900/40'
                  }`}
                  title={t.filterOnlyVulnerable}
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>{t.filterOnlyVulnerable}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    showOnlyVulnerable ? 'bg-black/30 text-white' : 'bg-rose-900/80 text-rose-200'
                  }`}>
                    {vulnerableDevicesCount}
                  </span>
                </button>
              )}
            </div>

            {/* Search & Sort Bar */}
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                <div className="relative w-full max-w-md">
                  <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t.searchPlaceholder}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Sort selector */}
                <div className="flex items-center gap-1.5 text-xs text-zinc-400 bg-zinc-950 border border-zinc-800 px-2.5 py-1.5 rounded-lg">
                  <ArrowUpDown className="w-3.5 h-3.5 text-zinc-500" />
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as 'confidence' | 'latency' | 'ip')}
                    className="bg-transparent text-zinc-300 outline-none cursor-pointer"
                    aria-label={t.sortByLabel}
                  >
                    <option value="ip" className="bg-zinc-900">{t.sortByIp}</option>
                    <option value="latency" className="bg-zinc-900">{t.sortByLatency}</option>
                    <option value="confidence" className="bg-zinc-900">{t.sortByConfidence}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Devices Grid */}
            {filteredDevices.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
                {filteredDevices.map((device) => (
                  <DeviceCard
                    key={device.id}
                    device={device}
                    onOpenAndroidModal={(d) => setSelectedDeviceForAndroid(d)}
                    onOpenSecurityModal={(d) => setSelectedDeviceForSecurity(d)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-zinc-900/40 border border-zinc-800 rounded-2xl p-8">
                <Layers className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                <h3 className="text-base font-semibold text-zinc-300">{t.noDevicesFound}</h3>
                <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                  {t.noDevicesMatch}
                </p>
                {(selectedCategory !== 'all' || showOnlyVulnerable || searchQuery) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('all');
                      setShowOnlyVulnerable(false);
                      setSearchQuery('');
                    }}
                    className="mt-4 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl text-xs font-medium cursor-pointer"
                  >
                    {t.catAll} ({devices.length})
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: Ports Map */}
        {activeTab === 'ports' && (
          <PortDistribution
            devices={devices}
            selectedPortFilter={selectedPortFilter}
            onSelectPortFilter={(p) => {
              setSelectedPortFilter(p);
              if (p !== null) setActiveTab('devices');
            }}
          />
        )}

        {/* TAB 3: Single IP Scanner */}
        {activeTab === 'single' && (
          <SingleIpScanner
            onOpenAndroidModal={(d) => setSelectedDeviceForAndroid(d)}
            onOpenSecurityModal={(d) => setSelectedDeviceForSecurity(d)}
            isDemoMode={isDemoMode}
          />
        )}

        {/* TAB 4: Android Hub */}
        {activeTab === 'android' && (
          <AndroidHub
            devices={devices}
            onOpenAndroidModal={(d) => setSelectedDeviceForAndroid(d)}
          />
        )}

        {/* TAB 5: Android Studio Project Downloader & Code Inspector */}
        {activeTab === 'android-studio' && (
          <AndroidProjectTab />
        )}
      </main>

      {/* Android Setup Modal with dynamic QR Code */}
      <AndroidSetupModal
        device={selectedDeviceForAndroid}
        onClose={() => setSelectedDeviceForAndroid(null)}
      />

      {/* Educational Vulnerability Analysis & Hardening Modal */}
      <SecurityAuditModal
        device={selectedDeviceForSecurity}
        onClose={() => setSelectedDeviceForSecurity(null)}
      />

      {/* Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-4 text-center text-xs text-zinc-600">
        NetCam Scanner • {t.brandSubtitle}
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}

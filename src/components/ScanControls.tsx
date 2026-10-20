import React, { useState } from 'react';
import {
  Play,
  Square,
  Settings2,
  Sliders,
  ShieldAlert,
  Cpu,
  Globe,
  ArrowRight,
  Wifi,
  RefreshCw,
  Check,
  ChevronDown
} from 'lucide-react';
import { PORT_PRESETS } from '../utils/networkUtils.ts';
import type { ScanProgress, SubnetInterface } from '../types.ts';
import { useTranslation } from '../utils/i18n.tsx';

interface ScanControlsProps {
  cidr: string;
  onChangeCidr: (val: string) => void;
  selectedPresetId: string;
  onSelectPreset: (id: string, ports: number[]) => void;
  customPorts: string;
  onChangeCustomPorts: (val: string) => void;
  isScanning: boolean;
  progress: ScanProgress;
  onStartScan: () => void;
  onStopScan: () => void;
  timeoutMs: number;
  onChangeTimeoutMs: (val: number) => void;
  concurrency: number;
  onChangeConcurrency: (val: number) => void;
  isDemoMode: boolean;
  interfaces?: SubnetInterface[];
  onAutoDetect?: () => void;
  isAutoDetecting?: boolean;
}

export const ScanControls: React.FC<ScanControlsProps> = ({
  cidr,
  onChangeCidr,
  selectedPresetId,
  onSelectPreset,
  customPorts,
  onChangeCustomPorts,
  isScanning,
  progress,
  onStartScan,
  onStopScan,
  timeoutMs,
  onChangeTimeoutMs,
  concurrency,
  onChangeConcurrency,
  isDemoMode,
  interfaces = [],
  onAutoDetect,
  isAutoDetecting = false,
}) => {
  const { t, lang } = useTranslation();
  const [showAdvanced, setShowAdvanced] = useState(false);

  const selectedPreset = PORT_PRESETS.find((p) => p.id === selectedPresetId);

  // Common private subnets presets
  const COMMON_SUBNETS = [
    { label: '192.168.1.0/24', desc: 'Home / Office A' },
    { label: '192.168.0.0/24', desc: 'Home / Office B' },
    { label: '192.168.10.0/24', desc: 'IoT / Camera VLAN' },
    { label: '10.0.0.0/24', desc: 'Enterprise LAN' },
    { label: '172.16.0.0/24', desc: 'Corporate / Lab' },
  ];

  // Find detected primary interface
  const detectedPrimary = interfaces.find((i) => i.isRecommended) || interfaces.find((i) => !i.internal) || interfaces[0];

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-xl shadow-black/40 space-y-4">
      {/* 1. Network Auto-Detection & Subnet Chooser Header */}
      <div className="bg-zinc-950/80 border border-zinc-800/90 rounded-xl p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <Wifi className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-zinc-200">
                {t.autoDetectTitle}
              </span>
              {detectedPrimary && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-300 border border-emerald-800/80">
                  {t.detectedBadge}: {detectedPrimary.name} ({detectedPrimary.address})
                </span>
              )}
            </div>
            <p className="text-[11px] text-zinc-400 mt-0.5">
              {t.detectedSubnet}: <span className="font-mono text-cyan-300 font-semibold">{detectedPrimary?.cidr || '192.168.1.0/24'}</span>
              {detectedPrimary?.hostAddress && (
                <span className="text-zinc-500 ml-2">
                  ({t.detectedHostIp}: <span className="font-mono text-zinc-300">{detectedPrimary.hostAddress}</span>)
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Auto Detect / Subnet Dropdown Action */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Subnet selector dropdown */}
          <div className="relative">
            <select
              value={cidr}
              onChange={(e) => onChangeCidr(e.target.value)}
              disabled={isScanning}
              className="bg-zinc-900 hover:bg-zinc-800 text-zinc-200 text-xs font-mono py-1.5 px-3 pr-8 rounded-xl border border-zinc-700/80 outline-none cursor-pointer disabled:opacity-50 appearance-none"
              aria-label={t.chooseSubnet}
            >
              <optgroup label={t.autoDetectSubnet}>
                {interfaces.map((iface) => (
                  <option key={iface.cidr} value={iface.cidr}>
                    {iface.name}: {iface.cidr} ({iface.address})
                  </option>
                ))}
              </optgroup>
              <optgroup label={t.quickSubnets}>
                {COMMON_SUBNETS.map((cs) => (
                  <option key={cs.label} value={cs.label}>
                    {cs.label} - {cs.desc}
                  </option>
                ))}
              </optgroup>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Re-detect network button */}
          {onAutoDetect && (
            <button
              type="button"
              onClick={onAutoDetect}
              disabled={isScanning || isAutoDetecting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border border-cyan-800/80 text-xs font-medium transition-colors cursor-pointer disabled:opacity-50"
              title={t.detectButton}
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isAutoDetecting ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">{t.detectButton}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Main Scan Controls Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
        {/* Target CIDR Input & Quick Chips */}
        <div className="lg:col-span-4 space-y-1.5">
          <div className="flex items-center justify-between">
            <label htmlFor="target-subnet" className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              {t.targetSubnetLabel}
            </label>
            <span className="text-[11px] text-zinc-500 font-mono">192.168.1.0/24</span>
          </div>
          <div className="relative">
            <input
              id="target-subnet"
              type="text"
              value={cidr}
              onChange={(e) => onChangeCidr(e.target.value)}
              disabled={isScanning}
              placeholder={t.targetSubnetPlaceholder}
              className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3.5 py-2.5 text-sm font-mono text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all disabled:opacity-50"
            />
          </div>

          {/* Quick Subnet Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
            <span className="text-[11px] text-zinc-500">{t.chooseSubnet}</span>
            {COMMON_SUBNETS.slice(0, 4).map((sn) => (
              <button
                key={sn.label}
                type="button"
                onClick={() => onChangeCidr(sn.label)}
                disabled={isScanning}
                className={`text-[11px] px-2 py-0.5 rounded-lg font-mono transition-colors cursor-pointer ${
                  cidr === sn.label
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                    : 'bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 border border-zinc-700/50'
                }`}
              >
                {sn.label.replace('/24', '')}
              </button>
            ))}
          </div>
        </div>

        {/* Port Presets Profile */}
        <div className="lg:col-span-5 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              {t.portProfileLabel}
            </span>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium cursor-pointer"
            >
              <Sliders className="w-3 h-3" />
              <span>{showAdvanced ? '− ' + t.advancedSettings : '+ ' + t.advancedSettings}</span>
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {PORT_PRESETS.map((preset) => {
              const isSelected = selectedPresetId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => onSelectPreset(preset.id, preset.ports)}
                  disabled={isScanning}
                  className={`text-left p-2 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300 shadow-sm shadow-cyan-950/40'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1 mb-0.5">
                    <span className="text-xs font-medium truncate text-zinc-200">{preset.name}</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800/80 text-zinc-400 border border-zinc-700/60 shrink-0">
                      {preset.badge}
                    </span>
                  </div>
                  <p className="text-[10px] text-zinc-500 font-mono truncate">
                    {preset.ports.slice(0, 4).join(', ')}
                    {preset.ports.length > 4 ? ` +${preset.ports.length - 4}` : ''}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Button */}
        <div className="lg:col-span-3">
          {isScanning ? (
            <button
              type="button"
              onClick={onStopScan}
              className="w-full flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white font-medium py-3 px-4 rounded-xl transition-all shadow-lg shadow-rose-950/50 cursor-pointer"
            >
              <Square className="w-4 h-4 fill-white" />
              <span>{t.stopScan}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={onStartScan}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold py-3 px-4 rounded-xl transition-all shadow-lg shadow-cyan-950/50 cursor-pointer group"
            >
              <Play className="w-4 h-4 fill-white group-hover:scale-110 transition-transform" />
              <span>{isDemoMode ? `${t.startScan} (${t.demoLabMode})` : t.startScan}</span>
            </button>
          )}
        </div>
      </div>

      {/* Advanced Settings Drawer */}
      {showAdvanced && (
        <div className="mt-3 pt-3 border-t border-zinc-800/80 grid grid-cols-1 sm:grid-cols-3 gap-4 animate-in fade-in">
          <div>
            <label htmlFor="custom-ports" className="text-xs text-zinc-400 block mb-1">
              {t.customPortsLabel}
            </label>
            <input
              id="custom-ports"
              type="text"
              value={customPorts}
              onChange={(e) => onChangeCustomPorts(e.target.value)}
              disabled={isScanning}
              placeholder="554, 80, 8080, 8000, 37777"
              className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-3 py-1.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-cyan-500"
            />
          </div>
          <div>
            <label htmlFor="timeout-range" className="text-xs text-zinc-400 block mb-1">
              {t.timeoutLabel} <span className="text-cyan-400 font-mono">{timeoutMs} ms</span>
            </label>
            <input
              id="timeout-range"
              type="range"
              min="200"
              max="2500"
              step="100"
              value={timeoutMs}
              onChange={(e) => onChangeTimeoutMs(Number(e.target.value))}
              disabled={isScanning}
              className="w-full accent-cyan-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-zinc-500">
              <span>200ms</span>
              <span>600ms</span>
              <span>2500ms</span>
            </div>
          </div>
          <div>
            <label htmlFor="concurrency-range" className="text-xs text-zinc-400 block mb-1">
              {t.concurrencyLabel} <span className="text-cyan-400 font-mono">{concurrency}</span>
            </label>
            <input
              id="concurrency-range"
              type="range"
              min="4"
              max="64"
              step="4"
              value={concurrency}
              onChange={(e) => onChangeConcurrency(Number(e.target.value))}
              disabled={isScanning}
              className="w-full accent-cyan-500 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-zinc-500">
              <span>4</span>
              <span>16</span>
              <span>64</span>
            </div>
          </div>
        </div>
      )}

      {/* Scanning Progress Bar */}
      {isScanning && (
        <div className="pt-2 border-t border-zinc-800/80 space-y-1.5">
          <div className="flex justify-between text-xs text-zinc-400">
            <span className="flex items-center gap-1.5 text-cyan-300 font-medium">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping inline-block" />
              <span>{t.activeScanInProgress}</span>
              {progress.currentIp && (
                <span className="font-mono text-zinc-400">({progress.currentIp})</span>
              )}
            </span>
            <span className="font-mono text-zinc-300">
              {progress.scannedHosts} / {progress.totalHosts} ({Math.round((progress.scannedHosts / (progress.totalHosts || 1)) * 100)}%)
            </span>
          </div>
          <div className="w-full bg-zinc-950 rounded-full h-2 overflow-hidden border border-zinc-800">
            <div
              className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-300"
              style={{
                width: `${Math.min(100, Math.round((progress.scannedHosts / (progress.totalHosts || 1)) * 100))}%`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

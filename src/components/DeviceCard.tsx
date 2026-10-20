import React, { useState } from 'react';
import {
  Camera,
  Server,
  Globe,
  Smartphone,
  Copy,
  Check,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Radio,
  Clock,
  Tv,
  Router,
  Monitor,
  Printer,
  HardDrive,
  Home,
  Cpu,
  ChevronDown,
  ChevronUp,
  Lock,
  Unlock,
  Info,
  Shield
} from 'lucide-react';
import type { DiscoveredDevice } from '../types.ts';
import { isBrowserAccessiblePort, getBrowserUrl } from '../utils/securityAudit.ts';
import { useTranslation } from '../utils/i18n.tsx';

interface DeviceCardProps {
  device: DiscoveredDevice;
  onOpenAndroidModal: (device: DiscoveredDevice) => void;
  onOpenSecurityModal?: (device: DiscoveredDevice) => void;
}

export const DeviceCard: React.FC<DeviceCardProps> = ({
  device,
  onOpenAndroidModal,
  onOpenSecurityModal,
}) => {
  const { t } = useTranslation();
  const [copiedRtsp, setCopiedRtsp] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [showSecurityDetails, setShowSecurityDetails] = useState(false);

  const mainRtsp =
    device.rtspUrls?.[0]?.main ||
    (device.openPorts.some((p) => p.port === 554) ? `rtsp://${device.ip}:554/live/ch0` : '');

  const copyRtsp = () => {
    if (!mainRtsp) return;
    navigator.clipboard.writeText(mainRtsp);
    setCopiedRtsp(true);
    setTimeout(() => setCopiedRtsp(false), 2000);
  };

  // Find primary web URL to open in browser
  const webPort = device.openPorts.find((p) => isBrowserAccessiblePort(p.port).isWeb);
  const primaryWebUrl = device.webUiUrl || (webPort ? getBrowserUrl(device.ip, webPort.port) : undefined);

  // Vendor / Category badge colors
  const getVendorBadge = () => {
    const v = device.vendor?.toLowerCase() || '';
    if (v.includes('hikvision')) return 'bg-red-500/10 text-red-400 border-red-500/30';
    if (v.includes('dahua')) return 'bg-orange-500/10 text-orange-400 border-orange-500/30';
    if (v.includes('xiongmai') || v.includes('icsee')) return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    if (v.includes('tapo') || v.includes('tp-link')) return 'bg-teal-500/10 text-teal-400 border-teal-500/30';
    if (v.includes('reolink')) return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
    if (v.includes('keenetic') || v.includes('mikrotik') || device.category === 'router')
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    if (v.includes('windows') || device.category === 'workstation')
      return 'bg-sky-500/10 text-sky-400 border-sky-500/30';
    if (device.category === 'printer') return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
    if (device.category === 'tv-media') return 'bg-purple-500/10 text-purple-400 border-purple-500/30';
    if (device.category === 'nas-iot') return 'bg-violet-500/10 text-violet-400 border-violet-500/30';
    if (device.category === 'mobile') return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
    if (device.isCamera) return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
    return 'bg-zinc-800 text-zinc-400 border-zinc-700';
  };

  const getDeviceIcon = () => {
    if (device.isCamera) return <Camera className="w-5 h-5 text-cyan-400" />;
    if (device.category === 'router' || device.deviceType === 'router')
      return <Router className="w-5 h-5 text-emerald-400" />;
    if (device.category === 'workstation' || device.deviceType === 'workstation')
      return <Monitor className="w-5 h-5 text-sky-400" />;
    if (device.category === 'printer' || device.deviceType === 'printer')
      return <Printer className="w-5 h-5 text-amber-400" />;
    if (device.category === 'tv-media' || device.deviceType === 'smart-tv')
      return <Tv className="w-5 h-5 text-purple-400" />;
    if (device.category === 'nas-iot' || device.deviceType === 'nas-server')
      return <HardDrive className="w-5 h-5 text-violet-400" />;
    if (device.deviceType === 'smart-iot') return <Home className="w-5 h-5 text-rose-400" />;
    if (device.category === 'mobile' || device.deviceType.startsWith('mobile'))
      return <Smartphone className="w-5 h-5 text-indigo-400" />;
    return <Cpu className="w-5 h-5 text-zinc-400" />;
  };

  const getCategoryLabel = () => {
    switch (device.category) {
      case 'camera':
        return t.catCameras;
      case 'router':
        return t.catRouters;
      case 'workstation':
        return t.catPCs;
      case 'printer':
        return t.catPrinters;
      case 'tv-media':
        return t.catSmartTv;
      case 'nas-iot':
        return t.catSmartHome;
      case 'mobile':
        return t.catMobile;
      default:
        return t.catAll;
    }
  };

  const issues = device.securityIssues || [];
  const criticalCount = issues.filter((i) => i.severity === 'critical').length;
  const highCount = issues.filter((i) => i.severity === 'high').length;

  return (
    <div
      className={`rounded-2xl border transition-all ${
        device.isCamera
          ? 'bg-zinc-900/90 border-cyan-500/40 hover:border-cyan-500/70 shadow-lg shadow-cyan-950/20'
          : 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700'
      }`}
    >
      <div className="p-4 sm:p-5 space-y-4">
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${
                device.isCamera
                  ? 'bg-cyan-500/10 border-cyan-500/30 shadow-inner shadow-cyan-500/20'
                  : 'bg-zinc-800/80 border-zinc-700'
              }`}
            >
              {getDeviceIcon()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-base font-bold text-white tracking-tight">
                  {device.ip}
                </span>
                <span
                  className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${getVendorBadge()}`}
                >
                  {device.vendor || getCategoryLabel()}
                </span>
                {/* Risk Level Badge */}
                {device.riskLevel === 'critical' ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/50">
                    <ShieldAlert className="w-3 h-3 text-rose-400" />
                    {t.riskCritical}
                  </span>
                ) : device.riskLevel === 'high' ? (
                  <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-300 border border-orange-500/50">
                    <AlertTriangle className="w-3 h-3 text-orange-400" />
                    {t.riskHigh}
                  </span>
                ) : device.riskLevel === 'medium' ? (
                  <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/50">
                    <AlertTriangle className="w-3 h-3 text-amber-400" />
                    {t.riskMedium}
                  </span>
                ) : device.riskLevel === 'low' ? (
                  <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/50">
                    <Info className="w-3 h-3 text-blue-400" />
                    {t.riskLow}
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-800">
                    <ShieldCheck className="w-3 h-3 text-emerald-400" />
                    {t.safeStatus}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 font-medium mt-0.5 truncate max-w-sm">
                {device.model || device.hostname || getCategoryLabel()}
              </p>
            </div>
          </div>

          {/* Latency badge */}
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-800 shrink-0 font-mono">
            <Clock className="w-3 h-3 text-emerald-400" />
            <span>{device.latencyMs} ms</span>
          </div>
        </div>

        {/* Banner / Title preview if available */}
        {(device.httpTitle || device.httpServer || device.mac || device.hostname) && (
          <div className="bg-zinc-950/80 rounded-xl p-3 border border-zinc-800/80 text-xs space-y-1">
            {device.hostname && (
              <div className="flex items-center gap-2 text-zinc-300 font-mono truncate">
                <span className="text-zinc-500">{t.hostnameLabel}</span>
                <span className="text-zinc-200">{device.hostname}</span>
              </div>
            )}
            {device.httpTitle && (
              <div className="flex items-center gap-2 text-zinc-300 truncate">
                <Globe className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                <span className="text-zinc-500">{t.webTitleLabel}</span>
                <span className="font-medium truncate text-zinc-200">{device.httpTitle}</span>
              </div>
            )}
            {device.httpServer && (
              <div className="flex items-center gap-2 text-zinc-400 truncate">
                <Server className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                <span className="text-zinc-500">{t.serverServiceLabel}</span>
                <span className="font-mono text-zinc-300">{device.httpServer}</span>
              </div>
            )}
            {device.mac && (
              <div className="flex items-center gap-2 text-zinc-500 font-mono">
                <span>{t.macLabel}</span>
                <span className="text-zinc-400">{device.mac}</span>
              </div>
            )}
          </div>
        )}

        {/* Open Ports Section - with Click to Open in Browser */}
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 mb-2 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <span>{t.openPortsHeader} ({device.openPorts.length})</span>
              <span className="text-[10px] text-zinc-500 font-normal normal-case">
                {t.browserAccessibleNotice}
              </span>
            </span>
            {device.openPorts.some((p) => p.isCameraRelated) && (
              <span className="text-cyan-400 font-medium normal-case flex items-center gap-1 text-[11px]">
                <Camera className="w-3 h-3" />
                {t.mediaStreamAvailable}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {device.openPorts.map((p) => {
              const webInfo = isBrowserAccessiblePort(p.port);
              const isRtsp = p.port === 554 || p.port === 8554;
              const isDvrPort = p.port === 8000 || p.port === 37777 || p.port === 34567;
              const isSmb = p.port === 445 || p.port === 139 || p.port === 3389;
              const isPrinter = p.port === 9100 || p.port === 631;
              const isTelnet = p.port === 23;

              let style = 'bg-zinc-800 text-zinc-300 border-zinc-700';
              if (isTelnet) {
                style = 'bg-rose-500/20 text-rose-300 border-rose-500/60 font-bold animate-pulse';
              } else if (webInfo.isWeb) {
                style =
                  'bg-emerald-500/20 text-emerald-300 border-emerald-500/60 font-medium hover:bg-emerald-500/30 hover:border-emerald-400 hover:ring-1 hover:ring-emerald-400 cursor-pointer shadow-sm shadow-emerald-950/40';
              } else if (isRtsp) {
                style = 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 font-bold';
              } else if (isDvrPort) {
                style = 'bg-purple-500/20 text-purple-300 border-purple-500/50 font-semibold';
              } else if (isSmb) {
                style = 'bg-sky-500/20 text-sky-300 border-sky-500/50 font-semibold';
              } else if (isPrinter) {
                style = 'bg-amber-500/20 text-amber-300 border-amber-500/50';
              }

              if (webInfo.isWeb) {
                const url = getBrowserUrl(device.ip, p.port);
                return (
                  <a
                    key={p.port}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`${t.openInBrowser}: ${url}`}
                    className={`group/port inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border font-mono transition-all ${style}`}
                  >
                    <span>{p.port}</span>
                    <span className="text-[10px] opacity-75">({p.service})</span>
                    <ExternalLink className="w-3 h-3 ml-0.5 text-emerald-400 group-hover/port:translate-x-0.5 transition-transform" />
                  </a>
                );
              }

              return (
                <span
                  key={p.port}
                  title={`${p.service} (${p.protocol.toUpperCase()})${p.banner ? `: ${p.banner}` : ''}`}
                  className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border font-mono ${style}`}
                >
                  <span>{p.port}</span>
                  <span className="text-[10px] opacity-75">({p.service})</span>
                </span>
              );
            })}
          </div>
        </div>

        {/* Security Audit & Vulnerability Summary */}
        {issues.length > 0 && (
          <div
            className={`rounded-xl border p-3 text-xs transition-colors ${
              criticalCount > 0
                ? 'bg-rose-950/20 border-rose-500/40'
                : highCount > 0
                ? 'bg-orange-950/20 border-orange-500/40'
                : 'bg-zinc-950/60 border-zinc-800'
            }`}
          >
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <ShieldAlert
                  className={`w-4 h-4 ${
                    criticalCount > 0
                      ? 'text-rose-400'
                      : highCount > 0
                      ? 'text-orange-400'
                      : 'text-amber-400'
                  }`}
                />
                <span className="font-semibold text-zinc-200">
                  {t.vulnerabilitiesFound} {issues.length}
                </span>
                {criticalCount > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-900/60 text-rose-200 border border-rose-700 font-bold">
                    {criticalCount} {t.riskCritical}
                  </span>
                )}
                {highCount > 0 && (
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-orange-900/60 text-orange-200 border border-orange-700 font-semibold">
                    {highCount} {t.riskHigh}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {onOpenSecurityModal && (
                  <button
                    type="button"
                    onClick={() => onOpenSecurityModal(device)}
                    className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 bg-cyan-950/50 hover:bg-cyan-900/50 border border-cyan-800/80 px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Shield className="w-3 h-3 text-cyan-400" />
                    <span>{t.securityExplorationBtn}</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setShowSecurityDetails(!showSecurityDetails)}
                  className="text-[11px] font-medium text-zinc-400 hover:text-zinc-200 flex items-center gap-1 cursor-pointer"
                >
                  <span>{showSecurityDetails ? t.hideVulnerabilities : t.showVulnerabilities}</span>
                  {showSecurityDetails ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              </div>
            </div>

            {/* Expanded Security Issues List */}
            {showSecurityDetails && (
              <div className="mt-3 space-y-2.5 pt-2.5 border-t border-zinc-800/80 animate-in fade-in">
                {issues.map((issue) => {
                  let sevStyle = 'bg-blue-500/10 text-blue-300 border-blue-500/30';
                  let sevLabel = 'INFO';
                  if (issue.severity === 'critical') {
                    sevStyle = 'bg-rose-500/20 text-rose-300 border-rose-500/50';
                    sevLabel = 'CRITICAL';
                  } else if (issue.severity === 'high') {
                    sevStyle = 'bg-orange-500/20 text-orange-300 border-orange-500/50';
                    sevLabel = 'HIGH';
                  } else if (issue.severity === 'medium') {
                    sevStyle = 'bg-amber-500/20 text-amber-300 border-amber-500/50';
                    sevLabel = 'MEDIUM';
                  }

                  return (
                    <div
                      key={issue.id}
                      className="p-2.5 rounded-lg bg-zinc-900/90 border border-zinc-800 space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${sevStyle}`}>
                            {sevLabel}
                          </span>
                          {issue.port && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                              Port {issue.port}
                            </span>
                          )}
                          <span className="font-semibold text-zinc-100">{issue.title}</span>
                        </div>
                      </div>
                      <p className="text-zinc-400 text-[11px] leading-relaxed">{issue.description}</p>
                      <div className="text-[11px] text-emerald-400/90 bg-emerald-950/30 border border-emerald-900/40 p-2 rounded-md">
                        <span className="font-semibold text-emerald-300">{t.howToRemediate} </span>
                        {issue.remediation}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* RTSP Stream Quick Copy if camera */}
        {mainRtsp && (
          <div className="pt-1">
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-1">
              <span className="font-medium text-zinc-300 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5 text-cyan-400" />
                {t.rtspStreamLabel}
              </span>
              <button
                type="button"
                onClick={copyRtsp}
                className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 text-[11px] font-medium cursor-pointer"
              >
                {copiedRtsp ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                {copiedRtsp ? t.copiedLabel : t.copyLabel}
              </button>
            </div>
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 flex items-center justify-between gap-2">
              <code className="text-xs font-mono text-cyan-300 truncate select-all">{mainRtsp}</code>
            </div>
          </div>
        )}

        {/* Card Actions: Android Setup + Open in Browser + Educational Lab */}
        <div className="flex items-center gap-2 pt-2 border-t border-zinc-800/80 flex-wrap">
          {device.isCamera ? (
            <button
              type="button"
              onClick={() => onOpenAndroidModal(device)}
              className="flex-1 min-w-[160px] flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium py-2 px-3 rounded-xl text-xs transition-all shadow-md shadow-cyan-950/40 cursor-pointer"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>{t.androidSetupBtn}</span>
            </button>
          ) : (
            <div className="flex-1 min-w-[140px] text-xs text-zinc-400 font-mono flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />
              <span>{t.deviceActive}</span>
            </div>
          )}

          {/* Educational Security Lab Button if issues exist */}
          {issues.length > 0 && onOpenSecurityModal && (
            <button
              type="button"
              onClick={() => onOpenSecurityModal(device)}
              className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-2 rounded-xl text-xs font-medium border border-zinc-700 transition-colors cursor-pointer"
              title={t.securityLabTitle}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>{t.securityExplorationBtn}</span>
            </button>
          )}

          {/* Click to open in browser (Web UI) */}
          {primaryWebUrl && (
            <a
              href={primaryWebUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 px-3 py-2 rounded-xl text-xs font-semibold border border-emerald-500/40 transition-colors shadow-sm shadow-emerald-950/30 cursor-pointer"
              title={`${t.openInBrowser}: ${primaryWebUrl}`}
            >
              <ExternalLink className="w-3.5 h-3.5 text-emerald-400" />
              <span>{t.openInBrowser}</span>
            </a>
          )}

          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            className="p-2 rounded-xl text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Дополнительно"
            aria-label="Toggle details"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Expanded Tech Specs */}
        {expanded && (
          <div className="pt-3 border-t border-zinc-800 text-xs text-zinc-400 space-y-2 animate-in fade-in">
            <div className="grid grid-cols-2 gap-2 font-mono">
              <div>
                <span className="text-zinc-500">ID: </span>
                <span className="text-zinc-300">{device.id}</span>
              </div>
              <div>
                <span className="text-zinc-500">Type: </span>
                <span className="text-zinc-300">{device.deviceType}</span>
              </div>
              <div>
                <span className="text-zinc-500">Confidence: </span>
                <span className="text-zinc-300">{device.confidence}%</span>
              </div>
              <div>
                <span className="text-zinc-500">Last seen: </span>
                <span className="text-zinc-300">{new Date(device.lastSeen).toLocaleTimeString()}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import {
  Search,
  Radio,
  CheckCircle,
  XCircle,
  Clock,
  Smartphone,
  Globe,
  Copy,
  Check,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Sliders,
  Layers,
  Terminal,
} from 'lucide-react';
import { isValidIpv4, CAMERA_PORTS } from '../utils/networkUtils.ts';
import { isBrowserAccessiblePort, getBrowserUrl, auditDeviceSecurity } from '../utils/securityAudit.ts';
import type { DiscoveredDevice } from '../types.ts';
import { useTranslation } from '../utils/i18n.tsx';

interface SingleIpScannerProps {
  onOpenAndroidModal: (device: DiscoveredDevice) => void;
  onOpenSecurityModal?: (device: DiscoveredDevice) => void;
  isDemoMode: boolean;
}

const SINGLE_PORT_PRESETS = [
  {
    id: 'web',
    name: 'Веб и админки',
    ports: '80, 443, 8080, 8443, 8000, 9000, 5000, 8123, 32400',
  },
  {
    id: 'cams',
    name: 'Камеры и RTSP',
    ports: '554, 8554, 80, 8000, 37777, 37778, 34567, 8899, 3702, 2020',
  },
  {
    id: 'vuln',
    name: 'Уязвимые службы',
    ports: '21, 22, 23, 25, 53, 135, 139, 445, 1883, 3389, 5900',
  },
  {
    id: 'common',
    name: 'Топ-15 портов',
    ports: '22, 23, 53, 80, 139, 443, 445, 554, 3389, 5000, 8000, 8080, 8899, 34567, 37777',
  },
];

export const SingleIpScanner: React.FC<SingleIpScannerProps> = ({
  onOpenAndroidModal,
  onOpenSecurityModal,
  isDemoMode,
}) => {
  const { t } = useTranslation();
  const [targetIp, setTargetIp] = useState('192.168.1.64');
  const [portInput, setPortInput] = useState('554, 80, 8080, 8000, 37777, 34567, 8899, 443, 23, 22, 445');
  const [timeoutMs, setTimeoutMs] = useState(800);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<DiscoveredDevice | null>(null);
  const [searched, setSearched] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedRtsp, setCopiedRtsp] = useState(false);

  const handleScanSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setScanResult(null);

    const cleanIp = targetIp.trim();
    if (!isValidIpv4(cleanIp)) {
      setErrorMsg('Пожалуйста, введите корректный IPv4 адрес (например, 192.168.1.64)');
      return;
    }

    const ports = portInput
      .split(',')
      .map((p) => parseInt(p.trim(), 10))
      .filter((p) => !isNaN(p) && p > 0 && p <= 65535);

    if (ports.length === 0) {
      setErrorMsg('Укажите хотя бы один валидный порт (1-65535)');
      return;
    }

    setIsScanning(true);
    setSearched(true);

    try {
      if (isDemoMode) {
        // Simulated response with realistic port and vulnerability evaluation
        await new Promise((r) => setTimeout(r, 600));
        const res = await fetch('/api/demo-devices');
        const data = await res.json();
        const found = data.devices.find((d: DiscoveredDevice) => d.ip === cleanIp) || data.devices[0];

        // Ensure security audit is calculated
        const audit = auditDeviceSecurity({
          ip: found.ip,
          ports: found.openPorts,
          vendor: found.vendor,
          isCamera: found.isCamera,
          httpServer: found.httpServer,
          httpTitle: found.httpTitle,
        });

        setScanResult({
          ...found,
          securityIssues: audit.issues,
          riskLevel: audit.riskLevel,
        });
      } else {
        const res = await fetch('/api/scan/host', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ip: cleanIp,
            ports,
            timeoutMs,
            grabBanners: true,
          }),
        });
        const data = await res.json();
        if (data.found && data.device) {
          const audit = auditDeviceSecurity({
            ip: data.device.ip,
            ports: data.device.openPorts,
            vendor: data.device.vendor,
            isCamera: data.device.isCamera,
            httpServer: data.device.httpServer,
            httpTitle: data.device.httpTitle,
          });
          setScanResult({
            ...data.device,
            securityIssues: audit.issues,
            riskLevel: audit.riskLevel,
          });
        } else {
          setScanResult(null);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(`Ошибка сканирования: ${msg}`);
    } finally {
      setIsScanning(false);
    }
  };

  const copyRtsp = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedRtsp(true);
    setTimeout(() => setCopiedRtsp(false), 2000);
  };

  // Find primary web port
  const primaryWebPort = scanResult?.openPorts.find((p) => isBrowserAccessiblePort(p.port).isWeb);
  const primaryWebUrl = scanResult
    ? scanResult.webUiUrl || (primaryWebPort ? getBrowserUrl(scanResult.ip, primaryWebPort.port) : undefined)
    : undefined;

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-6">
      <div>
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Search className="w-5 h-5 text-cyan-400" />
          Полноценный сканер портов и поиск уязвимостей узла
        </h3>
        <p className="text-xs text-zinc-400 mt-1">
          Глубокое сканирование TCP портов отдельного хоста, проверка веб-интерфейсов, обнаружение уязвимостей и открытие в браузере по клику.
        </p>
      </div>

      {/* Preset Buttons */}
      <div className="flex items-center gap-2 flex-wrap text-xs">
        <span className="text-zinc-500 font-medium">Шаблоны портов:</span>
        {SINGLE_PORT_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            onClick={() => setPortInput(preset.ports)}
            className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 cursor-pointer transition-colors"
          >
            {preset.name}
          </button>
        ))}
      </div>

      <form onSubmit={handleScanSingle} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
        <div className="md:col-span-4 space-y-1.5">
          <label htmlFor="single-ip" className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            IP адрес цели
          </label>
          <input
            id="single-ip"
            type="text"
            value={targetIp}
            onChange={(e) => setTargetIp(e.target.value)}
            disabled={isScanning}
            placeholder="192.168.1.64"
            className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm font-mono text-zinc-100 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="md:col-span-5 space-y-1.5">
          <label htmlFor="single-ports" className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Порты для проверки (через запятую)
          </label>
          <input
            id="single-ports"
            type="text"
            value={portInput}
            onChange={(e) => setPortInput(e.target.value)}
            disabled={isScanning}
            placeholder="554, 80, 8080, 8000, 37777, 34567, 8899"
            className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs font-mono text-zinc-200 focus:outline-none focus:border-cyan-500"
          />
        </div>

        <div className="md:col-span-3">
          <button
            type="submit"
            disabled={isScanning}
            className="w-full flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 active:bg-cyan-700 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-all shadow-md shadow-cyan-950 cursor-pointer disabled:opacity-50"
          >
            <Search className="w-4 h-4" />
            <span>{isScanning ? 'Сканирование портов...' : 'Сканировать порты'}</span>
          </button>
        </div>
      </form>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
          {errorMsg}
        </div>
      )}

      {/* Results view */}
      {searched && !isScanning && (
        <div className="pt-2 border-t border-zinc-800">
          {scanResult ? (
            <div className="bg-zinc-950 rounded-2xl p-5 border border-cyan-500/30 space-y-5">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-white flex items-center gap-2 flex-wrap">
                      <span>{scanResult.ip}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                        {scanResult.vendor || 'Сетевой хост'}
                      </span>
                      {scanResult.riskLevel === 'critical' ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-700 font-bold flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3 text-rose-400" />
                          Критический риск
                        </span>
                      ) : scanResult.riskLevel === 'high' ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-orange-950 text-orange-300 border border-orange-700 font-bold flex items-center gap-1">
                          <ShieldAlert className="w-3 h-3 text-orange-400" />
                          Высокий риск
                        </span>
                      ) : (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-medium flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-emerald-400" />
                          Безопасно
                        </span>
                      )}
                    </h4>
                    <p className="text-xs text-zinc-400 font-mono mt-0.5">
                      Время отклика: {scanResult.latencyMs} мс | Найдено открытых портов: {scanResult.openPorts.length}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {primaryWebUrl && (
                    <a
                      href={primaryWebUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/50 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-md shadow-emerald-950/30 cursor-pointer transition-colors"
                      title={`Открыть ${primaryWebUrl} в браузере`}
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Открыть в браузере ({primaryWebPort?.port})</span>
                    </a>
                  )}

                  {scanResult.isCamera && (
                    <button
                      type="button"
                      onClick={() => onOpenAndroidModal(scanResult)}
                      className="flex items-center gap-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 text-white px-3.5 py-2 rounded-xl text-xs font-semibold shadow-md shadow-cyan-950 cursor-pointer"
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>QR для Android</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Open Ports Breakdown with Click to Open in Browser */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold uppercase text-zinc-400 tracking-wider">
                  <span>Результат сканирования портов:</span>
                  <span className="text-[11px] text-zinc-500 normal-case font-normal">
                    (кликните по порту для открытия в браузере)
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {scanResult.openPorts.map((p) => {
                    const portDef = CAMERA_PORTS[p.port];
                    const webInfo = isBrowserAccessiblePort(p.port);
                    const browserUrl = webInfo.isWeb ? getBrowserUrl(scanResult.ip, p.port) : null;

                    return (
                      <div
                        key={p.port}
                        className={`bg-zinc-900 border p-3 rounded-xl flex flex-col justify-between gap-2 transition-all ${
                          webInfo.isWeb
                            ? 'border-emerald-500/50 hover:border-emerald-400'
                            : p.port === 23
                            ? 'border-rose-500/60'
                            : 'border-zinc-800'
                        }`}
                      >
                        <div>
                          <div className="flex items-center justify-between font-mono text-xs mb-1">
                            <span className="font-bold text-white text-sm">{p.port}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
                              OPEN
                            </span>
                          </div>
                          <span className="text-cyan-400 font-semibold text-xs uppercase block">{p.service}</span>
                          <p className="text-[11px] text-zinc-400 mt-1 leading-snug">
                            {portDef?.description || (p.banner ? `Баннер: ${p.banner}` : 'Сетевая служба')}
                          </p>
                        </div>

                        {webInfo.isWeb && browserUrl && (
                          <a
                            href={browserUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-2 flex items-center justify-center gap-1.5 w-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/50 py-1.5 px-2.5 rounded-lg text-xs font-medium transition-colors"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Открыть в браузере</span>
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Security & Vulnerabilities Audit */}
              {scanResult.securityIssues && scanResult.securityIssues.length > 0 && (
                <div className="bg-zinc-900/90 border border-zinc-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-orange-400" />
                      <h5 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
                        {t.vulnerabilitiesFound} ({scanResult.securityIssues.length})
                      </h5>
                    </div>
                    {onOpenSecurityModal && (
                      <button
                        type="button"
                        onClick={() => onOpenSecurityModal(scanResult)}
                        className="text-xs font-medium text-cyan-400 hover:text-cyan-300 bg-cyan-950/60 border border-cyan-800/80 px-2.5 py-1 rounded-lg flex items-center gap-1 cursor-pointer"
                      >
                        <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
                        <span>{t.securityExplorationBtn}</span>
                      </button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {scanResult.securityIssues.map((issue) => (
                      <div
                        key={issue.id}
                        className="p-3 rounded-lg bg-zinc-950 border border-zinc-800 text-xs space-y-1.5"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                              issue.severity === 'critical'
                                ? 'bg-rose-500/20 text-rose-300 border-rose-500/50'
                                : issue.severity === 'high'
                                ? 'bg-orange-500/20 text-orange-300 border-orange-500/50'
                                : 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                            }`}
                          >
                            {issue.severity.toUpperCase()}
                          </span>
                          {issue.port && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300">
                              Порт {issue.port}
                            </span>
                          )}
                          <span className="font-semibold text-zinc-200">{issue.title}</span>
                        </div>
                        <p className="text-zinc-400 text-[11px]">{issue.description}</p>
                        <div className="text-[11px] text-emerald-400/90 bg-emerald-950/20 border border-emerald-900/30 p-2 rounded">
                          <span className="font-semibold text-emerald-300">Рекомендация: </span>
                          {issue.remediation}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* RTSP Stream Link Preview */}
              {scanResult.rtspUrls && scanResult.rtspUrls.length > 0 && (
                <div className="bg-zinc-900/80 p-3 rounded-xl border border-zinc-800 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-300 font-medium">Основной RTSP URL (H.264/H.265):</span>
                    <button
                      type="button"
                      onClick={() => copyRtsp(scanResult.rtspUrls[0].main)}
                      className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium cursor-pointer"
                    >
                      {copiedRtsp ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      {copiedRtsp ? 'Скопировано!' : 'Копировать'}
                    </button>
                  </div>
                  <div className="font-mono text-xs text-cyan-300 bg-zinc-950 p-2 rounded-lg border border-zinc-800 select-all">
                    {scanResult.rtspUrls[0].main}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 text-center bg-zinc-950/60 rounded-2xl border border-zinc-800/80">
              <XCircle className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
              <h4 className="text-sm font-semibold text-zinc-300">Хост {targetIp} недоступен или порты закрыты</h4>
              <p className="text-xs text-zinc-500 mt-1 max-w-md mx-auto">
                Убедитесь, что устройство включено, подключено к сети, и брандмауэр не блокирует TCP-пакеты.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

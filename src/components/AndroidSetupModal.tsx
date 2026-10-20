import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import {
  X,
  Smartphone,
  QrCode,
  Copy,
  Check,
  Download,
  KeyRound,
  ExternalLink,
  HelpCircle,
  Video,
  Layers,
  Sparkles,
} from 'lucide-react';
import type { DiscoveredDevice } from '../types.ts';
import { buildRtspUrls, VENDOR_PROFILES, generateTinyCamConfig } from '../utils/cameraFingerprint.ts';

interface AndroidSetupModalProps {
  device: DiscoveredDevice | null;
  onClose: () => void;
}

export const AndroidSetupModal: React.FC<AndroidSetupModalProps> = ({ device, onClose }) => {
  if (!device) return null;

  const vendorKey = device.vendor?.split(' ')[0] || 'Generic';
  const defaultProfile = VENDOR_PROFILES[vendorKey] || VENDOR_PROFILES.Generic;

  const [username, setUsername] = useState(defaultProfile.defaultUser || 'admin');
  const [password, setPassword] = useState(defaultProfile.defaultPass || '');
  const [streamType, setStreamType] = useState<'main' | 'sub'>('main');
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [copiedLink, setCopiedLink] = useState(false);
  const [activeTab, setActiveTab] = useState<'qr' | 'apps' | 'export'>('qr');

  // Compute RTSP URLs based on user inputs
  const rtspList = buildRtspUrls(device.ip, device.vendor || 'Generic', username, password);
  const activeUrl = streamType === 'main' ? rtspList[0]?.main : rtspList[0]?.sub;

  // Generate QR Code dynamically
  useEffect(() => {
    if (!activeUrl) return;
    QRCode.toDataURL(activeUrl, {
      width: 260,
      margin: 1.5,
      color: {
        dark: '#0f172a',
        light: '#f8fafc',
      },
    })
      .then((url) => setQrDataUrl(url))
      .catch((err) => console.error('Failed to generate QR code', err));
  }, [activeUrl]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const downloadSingleM3u = () => {
    const content = `#EXTM3U\n#EXTINF:-1 tvg-id="${device.ip}" group-title="Cameras",${device.vendor} (${device.ip})\n${activeUrl}`;
    const blob = new Blob([content], { type: 'audio/x-mpegurl' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `camera-${device.ip}.m3u`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadTinyCamJson = () => {
    const config = generateTinyCamConfig(device, username, password);
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tinycam-${device.ip}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-zinc-900 border border-zinc-700/80 rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl shadow-cyan-950/40">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Настройка для Android
                <span className="text-xs font-mono font-normal px-2 py-0.5 rounded bg-zinc-800 text-cyan-300 border border-zinc-700">
                  {device.ip}
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Камера: <span className="text-zinc-200 font-medium">{device.vendor}</span> {device.model ? `(${device.model})` : ''}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-label="Закрыть окно"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex border-b border-zinc-800 bg-zinc-950/30 px-5 pt-2 gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('qr')}
            className={`pb-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'qr'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <QrCode className="w-4 h-4" />
            QR-Код и RTSP ссылка
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('apps')}
            className={`pb-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'apps'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Smartphone className="w-4 h-4" />
            Инструкции для Android приложений
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('export')}
            className={`pb-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition-all cursor-pointer ${
              activeTab === 'export'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Download className="w-4 h-4" />
            Экспорт (M3U / TinyCam)
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Credentials Configuration */}
          <div className="bg-zinc-950/80 p-4 rounded-xl border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-cyan-400" />
                Авторизация камеры для Android
              </span>
              <span className="text-[11px] text-zinc-500">
                По умолчанию: <span className="font-mono text-zinc-400">{defaultProfile.defaultUser || 'admin'} / {defaultProfile.defaultPass || '(пусто)'}</span>
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="cam-user" className="text-[11px] text-zinc-400 block mb-1">
                  Логин камеры (RTSP User)
                </label>
                <input
                  id="cam-user"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full bg-zinc-900 border border-zinc-700/80 rounded-lg px-3 py-1.5 text-xs text-zinc-100 font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>
              <div>
                <label htmlFor="cam-pass" className="text-[11px] text-zinc-400 block mb-1">
                  Пароль камеры (RTSP Password)
                </label>
                <input
                  id="cam-pass"
                  type="text"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Пароль камеры..."
                  className="w-full bg-zinc-900 border border-zinc-700/80 rounded-lg px-3 py-1.5 text-xs text-zinc-100 font-mono focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {/* Stream resolution toggle */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[11px] text-zinc-400">Поток:</span>
              <button
                type="button"
                onClick={() => setStreamType('main')}
                className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-colors ${
                  streamType === 'main'
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                    : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                }`}
              >
                Основной (HD/4K Main Stream)
              </button>
              <button
                type="button"
                onClick={() => setStreamType('sub')}
                className={`text-xs px-2.5 py-1 rounded-lg border font-medium transition-colors ${
                  streamType === 'sub'
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                    : 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-zinc-200'
                }`}
              >
                Второй поток (Sub Stream для мобильного интернета)
              </button>
            </div>
          </div>

          {/* TAB 1: QR Code & RTSP Link */}
          {activeTab === 'qr' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
                {/* QR Code Container */}
                <div className="sm:col-span-5 flex flex-col items-center justify-center p-3 bg-white rounded-2xl shadow-xl border border-zinc-700/40">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt="Android Camera Setup QR Code"
                      className="w-48 h-48 rounded-lg"
                    />
                  ) : (
                    <div className="w-48 h-48 flex items-center justify-center text-zinc-400">
                      Генерация QR...
                    </div>
                  )}
                  <span className="text-[11px] font-semibold text-zinc-900 mt-2 flex items-center gap-1 text-center">
                    <Smartphone className="w-3.5 h-3.5" />
                    Наведите камеру Android телефона
                  </span>
                </div>

                {/* RTSP Stream Details */}
                <div className="sm:col-span-7 space-y-3">
                  <div>
                    <span className="text-xs font-semibold text-zinc-300 block mb-1">
                      Сгенерированная RTSP ссылка для Android:
                    </span>
                    <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-3 space-y-2">
                      <div className="font-mono text-xs text-cyan-300 break-all select-all bg-zinc-900/60 p-2 rounded-lg border border-zinc-800">
                        {activeUrl}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => copyToClipboard(activeUrl || '')}
                          className="flex-1 flex items-center justify-center gap-1.5 bg-cyan-600 hover:bg-cyan-500 text-white font-medium py-1.5 px-3 rounded-lg text-xs transition-colors cursor-pointer"
                        >
                          {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5" />}
                          {copiedLink ? 'Ссылка скопирована' : 'Скопировать RTSP ссылку'}
                        </button>
                        <a
                          href={`vlc://${activeUrl}`}
                          className="flex items-center justify-center gap-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 py-1.5 px-2.5 rounded-lg text-xs font-medium border border-zinc-700 transition-colors"
                          title="Открыть напрямую в установленном приложении VLC на смартфоне"
                        >
                          <Video className="w-3.5 h-3.5 text-amber-400" />
                          <span>VLC Intent</span>
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="text-xs text-zinc-400 space-y-1 bg-zinc-950/40 p-3 rounded-xl border border-zinc-800/80">
                    <p className="font-medium text-zinc-300">Подсказка для этого производителя ({defaultProfile.vendor}):</p>
                    <p className="text-[11px] text-zinc-400">{defaultProfile.notes}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Android App Specific Guides */}
          {activeTab === 'apps' && (
            <div className="space-y-3">
              {/* TinyCam Monitor */}
              <div className="bg-zinc-950/90 border border-zinc-800 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-zinc-100 flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-cyan-400" />
                    TinyCam Monitor PRO (Рекомендуемое приложение №1)
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                    Google Play
                  </span>
                </div>
                <ol className="text-xs text-zinc-400 space-y-1.5 list-decimal list-inside">
                  <li>Откройте TinyCam на Android и нажмите <strong>«Управление камерами» → «+ Добавить»</strong>.</li>
                  <li>В поле <strong>«Производитель»</strong> выберите <span className="text-cyan-300 font-mono">{defaultProfile.vendor}</span> или <strong>Generic</strong>.</li>
                  <li>В поле <strong>«Имя хоста / IP адрес»</strong> укажите <span className="text-cyan-300 font-mono">{device.ip}</span>.</li>
                  <li>В поле <strong>«RTSP порт»</strong> укажите <span className="text-cyan-300 font-mono">554</span>.</li>
                  <li>Введите логин (<span className="font-mono text-zinc-300">{username || 'admin'}</span>) и пароль камеры.</li>
                  <li>Нажмите <strong>«Проверка связи»</strong> — изображение появится мгновенно!</li>
                </ol>
              </div>

              {/* VLC for Android */}
              <div className="bg-zinc-950/90 border border-zinc-800 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-zinc-100 flex items-center gap-2">
                    <Video className="w-4 h-4 text-amber-400" />
                    VLC for Android (Бесплатный плеер без рекламы)
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                    Бесплатно
                  </span>
                </div>
                <ol className="text-xs text-zinc-400 space-y-1.5 list-decimal list-inside">
                  <li>Запустите VLC на телефоне Android.</li>
                  <li>Перейдите во вкладку <strong>«Еще» (More) → «Потоки» (Streams)</strong>.</li>
                  <li>Вставьте скопированный RTSP адрес: <span className="font-mono text-amber-300 text-[11px]">{activeUrl}</span>.</li>
                  <li>Нажмите воспроизведение. VLC начнет аппаратное декодирование видеосигнала.</li>
                </ol>
              </div>

              {/* Onvifer */}
              <div className="bg-zinc-950/90 border border-zinc-800 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-zinc-100 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-400" />
                    Onvifer (Автопоиск по протоколу ONVIF)
                  </span>
                </div>
                <p className="text-xs text-zinc-400">
                  Если на камере открыт порт 80, 8080 или 8899, Onvifer автоматически обнаружит профили сжатия (H.264/H.265) и позволит управлять поворотом PTZ.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: Batch Export Files */}
          {activeTab === 'export' && (
            <div className="space-y-4">
              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-zinc-100">Плейлист .M3U для VLC Android</h4>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Файл плейлиста с прямой ссылкой на видеопоток. Открывается в VLC, MX Player или IPTV плеерах на Android в один клик.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={downloadSingleM3u}
                  className="shrink-0 flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3.5 py-2 rounded-xl text-xs font-semibold border border-zinc-700 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Скачать .m3u</span>
                </button>
              </div>

              <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4 flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-sm font-semibold text-zinc-100">Конфиг для TinyCam Monitor (.json)</h4>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Структурированный файл с параметрами камеры, портами и профилем подключения.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={downloadTinyCamJson}
                  className="shrink-0 flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3.5 py-2 rounded-xl text-xs font-semibold border border-zinc-700 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Скачать .json</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950/80 flex items-center justify-between text-xs text-zinc-400">
          <span className="flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Убедитесь, что ваш Android смартфон подключен к тому же Wi-Fi роутеру
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl font-medium transition-colors cursor-pointer"
          >
            Закрыть
          </button>
        </div>
      </div>
    </div>
  );
};

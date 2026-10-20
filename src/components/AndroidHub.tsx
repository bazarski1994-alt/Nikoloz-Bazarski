import React, { useState } from 'react';
import {
  Smartphone,
  Download,
  Video,
  Layers,
  Key,
  Wifi,
  ShieldCheck,
  Check,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';
import type { DiscoveredDevice } from '../types.ts';
import { generateM3uPlaylist, VENDOR_PROFILES } from '../utils/cameraFingerprint.ts';

interface AndroidHubProps {
  devices: DiscoveredDevice[];
  onOpenAndroidModal: (device: DiscoveredDevice) => void;
}

export const AndroidHub: React.FC<AndroidHubProps> = ({ devices, onOpenAndroidModal }) => {
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [authUsername, setAuthUsername] = useState('admin');
  const [authPassword, setAuthPassword] = useState('admin');

  const cameras = devices.filter((d) => d.isCamera);

  const handleDownloadAllM3u = () => {
    const playlistContent = generateM3uPlaylist(devices, authUsername, authPassword);
    const blob = new Blob([playlistContent], { type: 'audio/x-mpegurl' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `netcam-android-all-cameras-${new Date().toISOString().slice(0, 10)}.m3u`;
    a.click();
    URL.revokeObjectURL(url);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Batch Export */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-8 space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 text-xs font-semibold">
              <Smartphone className="w-3.5 h-3.5" />
              Центр интеграции с Android
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Экспорт найденных IP-камер на Android телефон
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
              Обнаружено <span className="text-cyan-300 font-bold">{cameras.length} IP-камер</span> в сети.
              Вы можете скачать готовый плейлист M3U для открытия всех камер в VLC на Android или настроить профессиональное видеонаблюдение через TinyCam Monitor.
            </p>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-3">
            <button
              type="button"
              onClick={handleDownloadAllM3u}
              disabled={cameras.length === 0}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold py-3 px-4 rounded-xl text-sm transition-all shadow-lg shadow-cyan-950/50 cursor-pointer disabled:opacity-50"
            >
              {downloadSuccess ? <Check className="w-4 h-4 text-emerald-300" /> : <Download className="w-4 h-4" />}
              <span>{downloadSuccess ? 'Плейлист скачан!' : 'Скачать все камеры в .M3U'}</span>
            </button>
            <p className="text-[11px] text-zinc-500 text-center">
              Открывается в один клик в VLC, MX Player или IPTV на Android
            </p>
          </div>
        </div>
      </div>

      {/* Recommended Android Apps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* TinyCam */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-white flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-cyan-400" />
                TinyCam Monitor PRO
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                Топ 1
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Лучшее приложение для Android для видеонаблюдения. Поддерживает одновременный просмотр десятков камер, детекцию движения, запись в облако и звук.
            </p>
            <div className="text-[11px] text-cyan-300 bg-zinc-950 p-2.5 rounded-xl border border-zinc-800 font-mono space-y-1">
              <div>Протокол: RTSP over TCP</div>
              <div>Порт стрима: 554</div>
              <div>Аутентификация: Basic / Digest</div>
            </div>
          </div>
          <div className="pt-2 border-t border-zinc-800 text-xs text-zinc-500">
            Доступно в Google Play Store
          </div>
        </div>

        {/* VLC for Android */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-white flex items-center gap-2">
                <Video className="w-4 h-4 text-amber-400" />
                VLC for Android
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                Бесплатно
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Мощный открытый плеер с аппаратным декодированием видеопотоков H.264 и H.265. Идеально для мгновенного просмотра трансляции без лишних настроек.
            </p>
            <div className="text-[11px] text-amber-300 bg-zinc-950 p-2.5 rounded-xl border border-zinc-800 font-mono space-y-1">
              <div>Меню: Еще → Потоки (Streams)</div>
              <div>Вставка RTSP ссылки или .m3u</div>
              <div>Низкая задержка буферизации</div>
            </div>
          </div>
          <div className="pt-2 border-t border-zinc-800 text-xs text-zinc-500">
            Открытый исходный код, без рекламы
          </div>
        </div>

        {/* Onvifer */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 space-y-3 flex flex-col justify-between">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sm text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                Onvifer
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                ONVIF
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Специализированный ONVIF клиент для Android. Автоматически сканирует локальную сеть, определяет профили потоков и поддерживает управление поворотом PTZ.
            </p>
            <div className="text-[11px] text-indigo-300 bg-zinc-950 p-2.5 rounded-xl border border-zinc-800 font-mono space-y-1">
              <div>Порты ONVIF: 80, 8080, 8899</div>
              <div>Профиль: Profile S / Profile T</div>
              <div>Поддержка PTZ джойстика</div>
            </div>
          </div>
          <div className="pt-2 border-t border-zinc-800 text-xs text-zinc-500">
            Подходит для безымянных IP-камер
          </div>
        </div>
      </div>

      {/* Default Credentials Reference */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Key className="w-4 h-4 text-cyan-400" />
            Справочник заводских логинов и паролей IP-камер
          </h3>
          <span className="text-xs text-zinc-500">Для первичного входа</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Object.entries(VENDOR_PROFILES).map(([key, prof]) => (
            <div key={key} className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/80 space-y-1.5">
              <div className="font-semibold text-xs text-zinc-200">{prof.vendor}</div>
              <div className="text-[11px] font-mono text-zinc-400">
                Логин: <span className="text-cyan-300">{prof.defaultUser}</span>
              </div>
              <div className="text-[11px] font-mono text-zinc-400">
                Пароль: <span className="text-cyan-300">{prof.defaultPass || '(пустой)'}</span>
              </div>
              <div className="text-[10px] text-zinc-500 truncate pt-1 border-t border-zinc-800">
                {prof.recommendedAndroidApp}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Network Tips for Android */}
      <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-5 text-xs text-zinc-400 space-y-2">
        <h4 className="font-semibold text-zinc-200 flex items-center gap-1.5">
          <Wifi className="w-4 h-4 text-emerald-400" />
          Важные советы при настройке Android приложения в локальной сети:
        </h4>
        <ul className="list-disc list-inside space-y-1 text-zinc-400">
          <li><strong>Изоляция точек доступа (AP Isolation):</strong> Убедитесь, что в настройках вашего Wi-Fi роутера отключена функция «AP Isolation» / «Client Isolation», иначе телефон не сможет отправлять пакеты на IP-камеру.</li>
          <li><strong>Транспорт RTSP:</strong> В настройках приложений (например, TinyCam) всегда выбирайте протокол <em>RTSP over TCP</em> вместо UDP, чтобы избежать потери пакетов и артефактов видео.</li>
          <li><strong>Статический IP (DHCP Static Lease):</strong> Привяжите MAC-адрес камеры к фиксированному IP в панели роутера, чтобы адрес не сменился при перезагрузке сети.</li>
        </ul>
      </div>
    </div>
  );
};

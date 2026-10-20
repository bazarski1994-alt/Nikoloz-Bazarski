import React from 'react';
import { Camera, Activity, Wifi, Sparkles, Globe } from 'lucide-react';
import type { SubnetInterface, LanguageCode } from '../types.ts';
import { useTranslation } from '../utils/i18n.tsx';

interface HeaderProps {
  interfaces: SubnetInterface[];
  selectedInterface: string;
  onSelectInterface: (cidr: string) => void;
  isScanning: boolean;
  isDemoMode: boolean;
  onToggleDemoMode: () => void;
  discoveredCount: number;
  camerasCount: number;
  vulnerableCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  interfaces,
  selectedInterface,
  onSelectInterface,
  isScanning,
  isDemoMode,
  onToggleDemoMode,
  discoveredCount,
  camerasCount,
  vulnerableCount = 0,
}) => {
  const { t, lang, setLang } = useTranslation();

  const LANGUAGES: { code: LanguageCode; label: string; flag: string }[] = [
    { code: 'ru', label: 'Русский', flag: 'RU' },
    { code: 'ka', label: 'ქართული', flag: 'KA' },
    { code: 'en', label: 'English', flag: 'EN' },
  ];

  return (
    <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3 sm:gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-sm shadow-cyan-950/50">
            <Camera className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white tracking-tight text-base sm:text-lg">
                NetCam<span className="text-cyan-400">Scanner</span>
              </span>
              <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-cyan-950/60 text-cyan-300 border border-cyan-800/60">
                {t.androidReady}
              </span>
            </div>
            <p className="text-xs text-zinc-400 hidden sm:block truncate max-w-md">
              {t.brandSubtitle}
            </p>
          </div>
        </div>

        {/* Status, Language Selector & Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language Switcher with Memory */}
          <div className="flex items-center bg-zinc-900 border border-zinc-800 rounded-xl p-0.5 text-xs font-semibold">
            {LANGUAGES.map((item) => (
              <button
                key={item.code}
                type="button"
                onClick={() => setLang(item.code)}
                className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${
                  lang === item.code
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 border border-transparent'
                }`}
                title={item.label}
              >
                {item.flag}
              </button>
            ))}
          </div>

          {/* Real vs Demo Lab Toggle */}
          <button
            type="button"
            onClick={onToggleDemoMode}
            disabled={isScanning}
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
              isDemoMode
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20'
                : 'bg-zinc-900 border-zinc-700 text-zinc-300 hover:bg-zinc-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden md:inline">{t.modeLabel}</span>
            <span>{isDemoMode ? t.demoLabMode : t.realNetworkMode}</span>
          </button>

          {/* Network Interface Badge */}
          {interfaces.length > 0 && (
            <div className="hidden lg:flex items-center gap-1.5 bg-zinc-900/80 border border-zinc-800 px-2.5 py-1.5 rounded-xl text-xs text-zinc-300">
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              <select
                value={selectedInterface}
                onChange={(e) => onSelectInterface(e.target.value)}
                disabled={isScanning || isDemoMode}
                className="bg-transparent text-zinc-200 outline-none cursor-pointer pr-1"
                aria-label={t.networkInterfaceLabel}
              >
                {interfaces.map((iface) => (
                  <option key={iface.cidr} value={iface.cidr} className="bg-zinc-900 text-zinc-200">
                    {iface.name}: {iface.cidr}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Quick Counter */}
          <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800/80 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs">
            <span className="flex items-center gap-1 text-zinc-300">
              <Activity className="w-3.5 h-3.5 text-zinc-400" />
              <span className="font-semibold text-white">{discoveredCount}</span>
              <span className="hidden sm:inline">{t.devicesCount}</span>
            </span>
            <span className="text-zinc-600">|</span>
            <span className="flex items-center gap-1 text-cyan-400 font-medium">
              <Camera className="w-3.5 h-3.5" />
              <span className="font-semibold text-cyan-300">{camerasCount}</span>
              <span className="hidden sm:inline">{t.camerasCount}</span>
            </span>
            {vulnerableCount > 0 && (
              <>
                <span className="text-zinc-600">|</span>
                <span className="flex items-center gap-1 text-rose-400 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                  <span className="font-semibold text-rose-300">{vulnerableCount}</span>
                  <span className="hidden xl:inline">{t.vulnerableCount}</span>
                </span>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

import React from 'react';
import { ShieldCheck, AlertTriangle, Video, Globe, Lock, Cpu, Filter } from 'lucide-react';
import type { DiscoveredDevice } from '../types.ts';

interface PortDistributionProps {
  devices: DiscoveredDevice[];
  selectedPortFilter: number | null;
  onSelectPortFilter: (port: number | null) => void;
}

export const PortDistribution: React.FC<PortDistributionProps> = ({
  devices,
  selectedPortFilter,
  onSelectPortFilter,
}) => {
  // Aggregate open ports count
  const portCounts: Record<number, { count: number; service: string; isCamera: boolean }> = {};

  devices.forEach((dev) => {
    dev.openPorts.forEach((p) => {
      if (!portCounts[p.port]) {
        portCounts[p.port] = { count: 0, service: p.service, isCamera: p.isCameraRelated };
      }
      portCounts[p.port].count++;
    });
  });

  const sortedPorts = Object.entries(portCounts)
    .map(([port, data]) => ({ port: Number(port), ...data }))
    .sort((a, b) => b.count - a.count);

  const totalOpenPorts = sortedPorts.reduce((acc, curr) => acc + curr.count, 0);

  // Security checks
  const telnetCount = devices.filter((d) => d.openPorts.some((p) => p.port === 23)).length;
  const rtspCount = devices.filter((d) => d.openPorts.some((p) => p.port === 554 || p.port === 8554)).length;
  const webCount = devices.filter((d) => d.openPorts.some((p) => p.port === 80 || p.port === 8080)).length;

  return (
    <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            Анализ открытых портов и безопасности сети
          </h3>
          <p className="text-xs text-zinc-400">
            Всего обнаружено {totalOpenPorts} открытых портов на {devices.length} активных узлах
          </p>
        </div>

        {selectedPortFilter !== null && (
          <button
            type="button"
            onClick={() => onSelectPortFilter(null)}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1 cursor-pointer"
          >
            Сбросить фильтр ({selectedPortFilter})
          </button>
        )}
      </div>

      {/* Security alert cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Video className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-bold text-white font-mono">{rtspCount}</div>
            <div className="text-[11px] text-zinc-400">RTSP видеопотоков (554)</div>
          </div>
        </div>

        <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Globe className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-bold text-white font-mono">{webCount}</div>
            <div className="text-[11px] text-zinc-400">Веб-интерфейсов (80/8080)</div>
          </div>
        </div>

        <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-lg flex items-center justify-center ${
              telnetCount > 0
                ? 'bg-rose-500/10 border border-rose-500/30 text-rose-400'
                : 'bg-zinc-800 border border-zinc-700 text-zinc-400'
            }`}
          >
            {telnetCount > 0 ? <AlertTriangle className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4 text-emerald-400" />}
          </div>
          <div>
            <div className="text-sm font-bold text-white font-mono">{telnetCount}</div>
            <div className="text-[11px] text-zinc-400">
              {telnetCount > 0 ? 'Уязвимый Telnet (Порт 23)' : 'Telnet не обнаружен'}
            </div>
          </div>
        </div>
      </div>

      {/* Port Chips Filter */}
      <div>
        <div className="text-xs text-zinc-400 mb-2 flex items-center gap-1.5 font-medium">
          <Filter className="w-3 h-3 text-zinc-500" />
          Фильтр устройств по открытому порту:
        </div>
        <div className="flex flex-wrap gap-2">
          {sortedPorts.map(({ port, count, service, isCamera }) => {
            const isSelected = selectedPortFilter === port;
            return (
              <button
                key={port}
                type="button"
                onClick={() => onSelectPortFilter(isSelected ? null : port)}
                className={`text-xs px-2.5 py-1 rounded-lg border font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-500 text-zinc-950 font-bold border-cyan-400 shadow-md shadow-cyan-950'
                    : isCamera
                    ? 'bg-zinc-950 text-cyan-300 border-cyan-900/60 hover:border-cyan-500/60'
                    : 'bg-zinc-950 text-zinc-300 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <span>{port}</span>
                <span className="text-[10px] opacity-75 uppercase">{service}</span>
                <span className={`text-[10px] px-1 rounded ${isSelected ? 'bg-zinc-900/30 text-zinc-950' : 'bg-zinc-800 text-zinc-400'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

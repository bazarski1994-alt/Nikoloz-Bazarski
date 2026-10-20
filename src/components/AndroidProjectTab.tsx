import React, { useState, useEffect } from 'react';
import {
  Download,
  FolderGit2,
  FileCode2,
  Copy,
  Check,
  Smartphone,
  ShieldCheck,
  Terminal,
  Layers,
  ChevronRight,
  ExternalLink,
  Code2,
  CheckCircle2,
  Cpu,
} from 'lucide-react';

interface ProjectFile {
  name: string;
  path: string;
  language: string;
  content: string;
}

export const AndroidProjectTab: React.FC = () => {
  const [files, setFiles] = useState<ProjectFile[]>([]);
  const [selectedFilePath, setSelectedFilePath] = useState<string>('app/src/main/java/com/netcam/scanner/scanner/NetworkScanner.kt');
  const [copiedCode, setCopiedCode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/android-project/files')
      .then((res) => res.json())
      .then((data) => {
        if (data.files && data.files.length > 0) {
          setFiles(data.files);
          const defaultFile = data.files.find((f: ProjectFile) => f.name === 'NetworkScanner.kt') || data.files[0];
          setSelectedFilePath(defaultFile.path);
        }
      })
      .catch((err) => console.error('Failed to load project files', err))
      .finally(() => setLoading(false));
  }, []);

  const activeFile = files.find((f) => f.path === selectedFilePath) || files[0];

  const handleCopyCode = () => {
    if (!activeFile) return;
    navigator.clipboard.writeText(activeFile.content);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Hero Banner with Direct Download */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-8 space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 text-xs font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Без внешних API (100% автономный)
              </span>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800 text-xs font-semibold">
                <Smartphone className="w-3.5 h-3.5" />
                Kotlin 2.0 + Jetpack Compose
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700 text-xs font-mono">
                API 24 - 35 (Android 7.0 - 15)
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              Готовый нативный проект для Android Studio
            </h2>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed max-w-2xl">
              Полноценный проект Android Studio без сторонних облачных API, рекламных трекеров или серверных прокси.
              Приложение работает напрямую со смартфона в локальной сети Wi-Fi через нативные сокеты Linux/Android (<code className="text-cyan-300 font-mono text-xs">java.net.Socket</code>) и Kotlin Coroutines.
            </p>

            <div className="flex items-center gap-4 text-xs text-zinc-400 pt-1">
              <div className="flex items-center gap-1.5">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <span>Многопоточность на Coroutines</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Автономная работа в изолированных LAN</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 flex flex-col gap-3">
            <a
              href="/api/android-project/download"
              download="NetCamScanner-Android-Studio.zip"
              className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-3.5 px-5 rounded-xl text-sm transition-all shadow-xl shadow-cyan-950/60 cursor-pointer group"
            >
              <Download className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
              <span>Скачать проект для Android Studio (.ZIP)</span>
            </a>
            <p className="text-[11px] text-zinc-500 text-center">
              Включает полный исходный код, Gradle-скрипты, ресурсы и AndroidManifest
            </p>
          </div>
        </div>
      </div>

      {/* Instructions: How to Open & Build */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-white flex items-center gap-2">
          <Terminal className="w-5 h-5 text-cyan-400" />
          Инструкция по открытию и сборке в Android Studio
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800/80 space-y-2">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-bold flex items-center justify-center text-xs">
              1
            </div>
            <h4 className="text-xs font-bold text-zinc-200">Распаковка архива</h4>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Скачайте архив <span className="font-mono text-cyan-300">NetCamScanner-Android-Studio.zip</span> и распакуйте в любую удобную папку на компьютере.
            </p>
          </div>

          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800/80 space-y-2">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-bold flex items-center justify-center text-xs">
              2
            </div>
            <h4 className="text-xs font-bold text-zinc-200">Открытие в IDE</h4>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Запустите Android Studio, нажмите <strong>File → Open...</strong> и укажите распакованную папку.
            </p>
          </div>

          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800/80 space-y-2">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-bold flex items-center justify-center text-xs">
              3
            </div>
            <h4 className="text-xs font-bold text-zinc-200">Синхронизация Gradle</h4>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Студия автоматически выполнит <strong>Gradle Sync</strong> и загрузит официальные библиотеки Jetpack Compose.
            </p>
          </div>

          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800/80 space-y-2">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 font-bold flex items-center justify-center text-xs">
              4
            </div>
            <h4 className="text-xs font-bold text-zinc-200">Запуск на телефоне</h4>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Подключите Android по USB или включите эмулятор и нажмите зеленую кнопку <strong>Run 'app' (Shift+F10)</strong>.
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Code Browser */}
      <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 sm:p-5 border-b border-zinc-800 flex flex-wrap items-center justify-between gap-4 bg-zinc-950/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                Инспектор исходного кода проекта Android Studio
              </h3>
              <p className="text-xs text-zinc-400 font-mono">
                {activeFile?.path || 'Загрузка файлов...'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyCode}
              disabled={!activeFile}
              className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3 py-1.5 rounded-lg text-xs font-medium border border-zinc-700 transition-colors cursor-pointer"
            >
              {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedCode ? 'Скопировано!' : 'Копировать код'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[520px]">
          {/* File Tree List */}
          <div className="lg:col-span-4 border-r border-zinc-800 bg-zinc-950/50 p-3 space-y-1 overflow-y-auto max-h-[600px]">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 px-2 py-1 block">
              Файлы проекта:
            </span>
            {files.map((file) => {
              const isSelected = file.path === selectedFilePath;
              return (
                <button
                  key={file.path}
                  type="button"
                  onClick={() => setSelectedFilePath(file.path)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-mono transition-colors flex items-center justify-between gap-2 cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-500/20 text-cyan-300 font-semibold border border-cyan-500/40'
                      : 'text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileCode2 className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-cyan-400' : 'text-zinc-500'}`} />
                    <span className="truncate">{file.name}</span>
                  </div>
                  <ChevronRight className={`w-3 h-3 shrink-0 ${isSelected ? 'text-cyan-400' : 'opacity-0'}`} />
                </button>
              );
            })}
          </div>

          {/* Code Viewer */}
          <div className="lg:col-span-8 bg-zinc-950 p-4 overflow-x-auto max-h-[600px] font-mono text-xs text-zinc-300 leading-relaxed selection:bg-cyan-500 selection:text-black">
            {activeFile ? (
              <pre className="whitespace-pre">
                <code>{activeFile.content}</code>
              </pre>
            ) : (
              <div className="flex items-center justify-center h-full text-zinc-500">
                Загрузка кода...
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

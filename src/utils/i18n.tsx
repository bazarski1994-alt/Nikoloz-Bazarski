import React, { createContext, useContext, useState, useEffect } from 'react';
import type { LanguageCode } from '../types.ts';

export interface Translations {
  // Brand & Header
  brandTitle: string;
  brandSubtitle: string;
  androidReady: string;
  modeLabel: string;
  demoLabMode: string;
  realNetworkMode: string;
  networkInterfaceLabel: string;
  devicesCount: string;
  camerasCount: string;
  vulnerableCount: string;

  // Auto Network Detection
  autoDetectTitle: string;
  autoDetectSubnet: string;
  detectedHostIp: string;
  detectedSubnet: string;
  detectedInterface: string;
  detectButton: string;
  detectedBadge: string;
  chooseSubnet: string;
  customSubnet: string;
  quickSubnets: string;

  // Scan Controls
  targetSubnetLabel: string;
  targetSubnetPlaceholder: string;
  targetSubnetExample: string;
  portProfileLabel: string;
  customPortsLabel: string;
  portsCount: string;
  scanningStatus: string;
  startScan: string;
  stopScan: string;
  advancedSettings: string;
  timeoutLabel: string;
  concurrencyLabel: string;
  activeScanInProgress: string;
  scanFinished: string;

  // Tabs & Navigation
  tabDevices: string;
  tabPorts: string;
  tabSingleIp: string;
  tabAndroidPresets: string;
  tabAndroidStudio: string;

  // Categories
  catAll: string;
  catCameras: string;
  catRouters: string;
  catServers: string;
  catPCs: string;
  catMobile: string;
  catSmartTv: string;
  catPrinters: string;
  catSmartHome: string;
  filterOnlyVulnerable: string;

  // Device Card
  openInBrowser: string;
  browserAccessibleNotice: string;
  openPortsHeader: string;
  webPortBadge: string;
  mediaStreamAvailable: string;
  hostnameLabel: string;
  webTitleLabel: string;
  serverServiceLabel: string;
  macLabel: string;
  rtspStreamLabel: string;
  copyLabel: string;
  copiedLabel: string;
  androidSetupBtn: string;
  deviceActive: string;
  safeStatus: string;
  riskCritical: string;
  riskHigh: string;
  riskMedium: string;
  riskLow: string;
  vulnerabilitiesFound: string;
  showVulnerabilities: string;
  hideVulnerabilities: string;
  securityExplorationBtn: string;
  howToRemediate: string;

  // Security Lab & Educational Explanations
  securityLabTitle: string;
  securityLabSubtitle: string;
  explanationTitle: string; // "Объяснить что к чему"
  whyDangerous: string;
  threatModelTitle: string;
  testingSafetyTitle: string; // "В целях теста и обучения"
  safeAuditCommandLabel: string;
  verificationStepsTitle: string;
  allRemediationOptionsTitle: string; // "Предложить все варианты"
  optionCredentialsTitle: string;
  optionVlanTitle: string;
  optionServicesTitle: string;
  optionFirmwareTitle: string;
  optionFirewallTitle: string;
  optionEncryptionTitle: string;
  appliedOptionCheck: string;
  exportReportBtn: string;
  closeBtn: string;

  // Search & Sorting
  searchPlaceholder: string;
  sortByLabel: string;
  sortByIp: string;
  sortByConfidence: string;
  sortByLatency: string;
  noDevicesFound: string;
  noDevicesMatch: string;
}

export const TRANSLATIONS: Record<LanguageCode, Translations> = {
  ru: {
    brandTitle: 'NetCam',
    brandSubtitle: 'Поиск всех устройств в сети, IP-камер, сканер портов и аудит безопасности',
    androidReady: 'Android Ready',
    modeLabel: 'Режим:',
    demoLabMode: 'Тестовая лаборатория',
    realNetworkMode: 'Реальная сеть',
    networkInterfaceLabel: 'Сетевой адаптер',
    devicesCount: 'устр.',
    camerasCount: 'камер',
    vulnerableCount: 'уязвимо',

    autoDetectTitle: 'Автоопределение локальной сети и подсетей',
    autoDetectSubnet: 'Определенная подсеть',
    detectedHostIp: 'IP устройства',
    detectedSubnet: 'Подсеть',
    detectedInterface: 'Адаптер',
    detectButton: 'Переопределить сеть',
    detectedBadge: 'Автоопределено',
    chooseSubnet: 'Выбрать подсеть:',
    customSubnet: 'Ввести свою подсеть CIDR',
    quickSubnets: 'Быстрый выбор подсети:',

    targetSubnetLabel: 'Целевая сеть / Подсеть CIDR',
    targetSubnetPlaceholder: '192.168.1.0/24',
    targetSubnetExample: 'Пример: 192.168.1.0/24 или 10.0.0.0/24',
    portProfileLabel: 'Профиль портов для поиска',
    customPortsLabel: 'Пользовательские порты (через запятую):',
    portsCount: 'портов',
    scanningStatus: 'Идет сканирование сети...',
    startScan: 'Запустить сканирование',
    stopScan: 'Остановить',
    advancedSettings: 'Параметры сканирования',
    timeoutLabel: 'Таймаут порта (мс):',
    concurrencyLabel: 'Потоков (параллельность):',
    activeScanInProgress: 'Сканирование хостов...',
    scanFinished: 'Сканирование завершено',

    tabDevices: 'Все устройства и камеры',
    tabPorts: 'Распределение портов',
    tabSingleIp: 'Сканер одного IP / Портов',
    tabAndroidPresets: 'Пресеты для Android',
    tabAndroidStudio: 'Android Studio Проект',

    catAll: 'Все устройства',
    catCameras: 'Камеры и DVR',
    catRouters: 'Роутеры и Шлюзы',
    catServers: 'Серверы и NAS',
    catPCs: 'Компьютеры',
    catMobile: 'Смартфоны',
    catSmartTv: 'Smart TV & Медиа',
    catPrinters: 'Принтеры',
    catSmartHome: 'Умный дом / IoT',
    filterOnlyVulnerable: 'Только с уязвимостями',

    openInBrowser: 'Открыть в браузере',
    browserAccessibleNotice: '(веб-порты открываются по клику)',
    openPortsHeader: 'Открытые порты',
    webPortBadge: 'Веб-доступен',
    mediaStreamAvailable: 'Медиа-поток доступен',
    hostnameLabel: 'Имя хоста:',
    webTitleLabel: 'Заголовок Web:',
    serverServiceLabel: 'Сервер/Служба:',
    macLabel: 'MAC:',
    rtspStreamLabel: 'RTSP поток для Android / VLC:',
    copyLabel: 'Копировать',
    copiedLabel: 'Скопировано!',
    androidSetupBtn: 'Настройка для Android / QR',
    deviceActive: 'Хост активен в сети',
    safeStatus: 'Безопасно',
    riskCritical: 'КРИТИЧЕСКИЙ РИСК',
    riskHigh: 'ВЫСОКИЙ РИСК',
    riskMedium: 'СРЕДНИЙ РИСК',
    riskLow: 'НИЗКИЙ РИСК',
    vulnerabilitiesFound: 'Обнаружено уязвимостей и рисков:',
    showVulnerabilities: 'Показать уязвимости',
    hideVulnerabilities: 'Скрыть уязвимости',
    securityExplorationBtn: 'Обучение и варианты защиты',
    howToRemediate: 'Как устранить:',

    securityLabTitle: 'Анализ уязвимостей, обучение и методы защиты',
    securityLabSubtitle: 'Детальный разбор обнаруженных угроз, безопасная проверка и все варианты устранения',
    explanationTitle: 'Что это такое и как устроена уязвимость («Что к чему»)',
    whyDangerous: 'В чем опасность для локальной сети:',
    threatModelTitle: 'Вектор угрозы и теоретический сценарий атаки:',
    testingSafetyTitle: 'Безопасное тестирование и верификация (для обучения)',
    safeAuditCommandLabel: 'Команда для безопасного аудита:',
    verificationStepsTitle: 'Шаги проверки без нанесения вреда:',
    allRemediationOptionsTitle: 'Все варианты устранения и повышения безопасности',
    optionCredentialsTitle: 'Смена учетных записей и сложных паролей',
    optionVlanTitle: 'Изоляция в выделенный VLAN видеонаблюдения',
    optionServicesTitle: 'Отключение устаревших и неиспользуемых служб',
    optionFirmwareTitle: 'Обновление прошивки от производителя',
    optionFirewallTitle: 'Межсетевой экран и фильтрация по IP',
    optionEncryptionTitle: 'Шифрование и защищенный VPN-доступ',
    appliedOptionCheck: 'Отметить как выполненное',
    exportReportBtn: 'Экспорт отчета безопасности',
    closeBtn: 'Закрыть',

    searchPlaceholder: 'Поиск по IP, имени, модели или производителю...',
    sortByLabel: 'Сортировка:',
    sortByIp: 'По IP адресу',
    sortByConfidence: 'По совпадению',
    sortByLatency: 'По отклику (мс)',
    noDevicesFound: 'Устройства не найдены',
    noDevicesMatch: 'По выбранным фильтрам ничего не найдено. Попробуйте сбросить фильтры.',
  },

  ka: {
    brandTitle: 'NetCam',
    brandSubtitle: 'ქსელის მოწყობილობების, IP-კამერების ძებნა, პორტების სკანერი და უსაფრთხოების აუდიტი',
    androidReady: 'Android Ready',
    modeLabel: 'რეჟიმი:',
    demoLabMode: 'სატესტო ლაბორატორია',
    realNetworkMode: 'რეალური ქსელი',
    networkInterfaceLabel: 'ქსელის ადაპტერი',
    devicesCount: 'მოწყობ.',
    camerasCount: 'კამერა',
    vulnerableCount: 'მოწყვლადი',

    autoDetectTitle: 'ლოკალური ქსელისა და ქვექსელების ავტო-ამოცნობა',
    autoDetectSubnet: 'ამოცნობილი ქვექსელი',
    detectedHostIp: 'მოწყობილობის IP',
    detectedSubnet: 'ქვექსელი',
    detectedInterface: 'ადაპტერი',
    detectButton: 'ქსელის განახლება',
    detectedBadge: 'ამოცნობილია',
    chooseSubnet: 'ქვექსელის არჩევა:',
    customSubnet: 'საკუთარი CIDR ქვექსელი',
    quickSubnets: 'სწრაფი ქვექსელები:',

    targetSubnetLabel: 'სამიზნე ქსელი / CIDR ქვექსელი',
    targetSubnetPlaceholder: '192.168.1.0/24',
    targetSubnetExample: 'მაგალითი: 192.168.1.0/24 ან 10.0.0.0/24',
    portProfileLabel: 'პორტების პროფილი საძიებლად',
    customPortsLabel: 'მომხმარებლის პორტები (მძიმით გამოყოფილი):',
    portsCount: 'პორტი',
    scanningStatus: 'მიმდინარეობს ქსელის სკანირება...',
    startScan: 'სკანირების დაწყება',
    stopScan: 'შეჩერება',
    advancedSettings: 'სკანირების პარამეტრები',
    timeoutLabel: 'პორტის ტაიმაუტი (მს):',
    concurrencyLabel: 'პარალელური ნაკადები:',
    activeScanInProgress: 'ჰოსტების სკანირება...',
    scanFinished: 'სკანირება დასრულდა',

    tabDevices: 'ყველა მოწყობილობა და კამერა',
    tabPorts: 'პორტების განაწილება',
    tabSingleIp: 'ერთი IP-ის / პორტების სკანერი',
    tabAndroidPresets: 'Android-ის პარამეტრები',
    tabAndroidStudio: 'Android Studio პროექტი',

    catAll: 'ყველა მოწყობილობა',
    catCameras: 'კამერები და DVR',
    catRouters: 'როუტერები და შლუზები',
    catServers: 'სერვერები და NAS',
    catPCs: 'კომპიუტერები',
    catMobile: 'სმარტფონები',
    catSmartTv: 'Smart TV & მედია',
    catPrinters: 'პრინტერები',
    catSmartHome: 'ჭკვიანი სახლი / IoT',
    filterOnlyVulnerable: 'მხოლოდ მოწყვლადი',

    openInBrowser: 'ბრაუზერში გახსნა',
    browserAccessibleNotice: '(ვებ-პორტები იხსნება დაკლიკებით)',
    openPortsHeader: 'ღია პორტები',
    webPortBadge: 'ვებ-ხელმისაწვდომი',
    mediaStreamAvailable: 'მედია-ნაკადი ხელმისაწვდომია',
    hostnameLabel: 'ჰოსტის სახელი:',
    webTitleLabel: 'Web სათაური:',
    serverServiceLabel: 'სერვერი/სერვისი:',
    macLabel: 'MAC:',
    rtspStreamLabel: 'RTSP ნაკადი Android / VLC-სთვის:',
    copyLabel: 'კოპირება',
    copiedLabel: 'დაკოპირდა!',
    androidSetupBtn: 'Android-ის მორგება / QR',
    deviceActive: 'ჰოსტი აქტიურია ქსელში',
    safeStatus: 'უსაფრთხო',
    riskCritical: 'კრიტიკული რისკი',
    riskHigh: 'მაღალი რისკი',
    riskMedium: 'საშუალო რისკი',
    riskLow: 'დაბალი რისკი',
    vulnerabilitiesFound: 'აღმოჩენილი მოწყვლადობები და რისკები:',
    showVulnerabilities: 'მოწყვლადობების ჩვენება',
    hideVulnerabilities: 'მოწყვლადობების დამალვა',
    securityExplorationBtn: 'სწავლება და დაცვის ვარიანტები',
    howToRemediate: 'როგორ აღმოვფხვრათ:',

    securityLabTitle: 'მოწყვლადობების ანალიზი, სწავლება და დაცვა',
    securityLabSubtitle: 'საფრთხეების დეტალური განხილვა, უსაფრთხო შემოწმება და აღმოფხვრის ყველა გზა',
    explanationTitle: 'რა არის ეს და როგორ მუშაობს მოწყვლადობა («რა ხდება»)',
    whyDangerous: 'რა საფრთხეს უქმნის ლოკალურ ქსელს:',
    threatModelTitle: 'საფრთხის ვექტორი და თავდასხმის თეორიული სცენარი:',
    testingSafetyTitle: 'უსაფრთხო ტესტირება და ვერიფიკაცია (სწავლებისთვის)',
    safeAuditCommandLabel: 'ბრძანება უსაფრთხო აუდიტისთვის:',
    verificationStepsTitle: 'შემოწმების ნაბიჯები ზიანის მიყენების გარეშე:',
    allRemediationOptionsTitle: 'აღმოფხვრისა და უსაფრთხოების გაძლიერების ყველა ვარიანტი',
    optionCredentialsTitle: 'მომხმარებლებისა და რთული პაროლების შეცვლა',
    optionVlanTitle: 'იზოლირება ცალკე სამეთვალყურეო VLAN-ში',
    optionServicesTitle: 'მოძველებული და გამოუყენებელი სერვისების გამორთვა',
    optionFirmwareTitle: 'მწარმოებლისგან პროგრამული უზრუნველყოფის განახლება',
    optionFirewallTitle: 'ქსელთაშორისი ეკრანი და IP ფილტრაცია',
    optionEncryptionTitle: 'შიფრაცია და დაცული VPN წვდომა',
    appliedOptionCheck: 'მონიშვნა შესრულებულად',
    exportReportBtn: 'უსაფრთხოების ანგარიშის ექსპორტი',
    closeBtn: 'დახურვა',

    searchPlaceholder: 'ძებნა IP-ით, სახელით, მოდელით ან მწარმოებლით...',
    sortByLabel: 'სორტირება:',
    sortByIp: 'IP მისამართით',
    sortByConfidence: 'დამთხვევით',
    sortByLatency: 'რეაქციის დროით (მს)',
    noDevicesFound: 'მოწყობილობები ვერ მოიძებნა',
    noDevicesMatch: 'არჩეული ფილტრებით არაფერი მოიძებნა. სცადეთ ფილტრების გასუფთავება.',
  },

  en: {
    brandTitle: 'NetCam',
    brandSubtitle: 'Discover all network devices, IP cameras, port scanning and security audit',
    androidReady: 'Android Ready',
    modeLabel: 'Mode:',
    demoLabMode: 'Demo Lab',
    realNetworkMode: 'Real Network',
    networkInterfaceLabel: 'Network Adapter',
    devicesCount: 'devices',
    camerasCount: 'cameras',
    vulnerableCount: 'vulnerable',

    autoDetectTitle: 'Auto-Detect Local Network & Subnets',
    autoDetectSubnet: 'Detected Subnet',
    detectedHostIp: 'Host IP',
    detectedSubnet: 'Subnet',
    detectedInterface: 'Adapter',
    detectButton: 'Re-detect Network',
    detectedBadge: 'Auto-detected',
    chooseSubnet: 'Select Subnet:',
    customSubnet: 'Custom CIDR Subnet',
    quickSubnets: 'Quick Subnets:',

    targetSubnetLabel: 'Target Network / Subnet CIDR',
    targetSubnetPlaceholder: '192.168.1.0/24',
    targetSubnetExample: 'Example: 192.168.1.0/24 or 10.0.0.0/24',
    portProfileLabel: 'Port Scan Profile',
    customPortsLabel: 'Custom Ports (comma-separated):',
    portsCount: 'ports',
    scanningStatus: 'Scanning network in progress...',
    startScan: 'Start Scan',
    stopScan: 'Stop',
    advancedSettings: 'Scan Settings',
    timeoutLabel: 'Port Timeout (ms):',
    concurrencyLabel: 'Threads (concurrency):',
    activeScanInProgress: 'Scanning hosts...',
    scanFinished: 'Scan completed',

    tabDevices: 'All Devices & Cameras',
    tabPorts: 'Port Distribution',
    tabSingleIp: 'Single IP / Port Scanner',
    tabAndroidPresets: 'Android Presets',
    tabAndroidStudio: 'Android Studio Project',

    catAll: 'All Devices',
    catCameras: 'Cameras & DVR',
    catRouters: 'Routers & Gateways',
    catServers: 'Servers & NAS',
    catPCs: 'Workstations & PCs',
    catMobile: 'Mobile Phones',
    catSmartTv: 'Smart TV & Media',
    catPrinters: 'Printers',
    catSmartHome: 'Smart Home / IoT',
    filterOnlyVulnerable: 'Only Vulnerable',

    openInBrowser: 'Open in Browser',
    browserAccessibleNotice: '(click on web ports to open in browser)',
    openPortsHeader: 'Open Ports',
    webPortBadge: 'Web Accessible',
    mediaStreamAvailable: 'Media Stream Available',
    hostnameLabel: 'Hostname:',
    webTitleLabel: 'Web Title:',
    serverServiceLabel: 'Server/Service:',
    macLabel: 'MAC:',
    rtspStreamLabel: 'RTSP Stream for Android / VLC:',
    copyLabel: 'Copy',
    copiedLabel: 'Copied!',
    androidSetupBtn: 'Android Setup / QR',
    deviceActive: 'Host active on network',
    safeStatus: 'Safe',
    riskCritical: 'CRITICAL RISK',
    riskHigh: 'HIGH RISK',
    riskMedium: 'MEDIUM RISK',
    riskLow: 'LOW RISK',
    vulnerabilitiesFound: 'Vulnerabilities & risks discovered:',
    showVulnerabilities: 'Show Vulnerabilities',
    hideVulnerabilities: 'Hide Vulnerabilities',
    securityExplorationBtn: 'Educational Lab & Defenses',
    howToRemediate: 'How to remediate:',

    securityLabTitle: 'Vulnerability Analysis, Learning & Defense Lab',
    securityLabSubtitle: 'In-depth threat breakdown, safe testing verification, and comprehensive defensive remediation',
    explanationTitle: 'What It Is & How the Vulnerability Works (Explanation)',
    whyDangerous: 'Why it is dangerous for the local network:',
    threatModelTitle: 'Threat Model & Theoretical Attack Scenario:',
    testingSafetyTitle: 'Safe Testing & Verification (For Learning & Safety)',
    safeAuditCommandLabel: 'Safe Audit Command:',
    verificationStepsTitle: 'Safe Verification Steps Without Causing Harm:',
    allRemediationOptionsTitle: 'All Remediation & Security Hardening Options',
    optionCredentialsTitle: 'Credential & Complex Password Hardening',
    optionVlanTitle: 'Network Isolation in Surveillance VLAN',
    optionServicesTitle: 'Disabling Legacy & Unused Network Services',
    optionFirmwareTitle: 'Firmware Updates from Official Vendor',
    optionFirewallTitle: 'Firewall Rules & Source IP Filtering',
    optionEncryptionTitle: 'Encryption & Secure VPN Tunneling',
    appliedOptionCheck: 'Mark as Completed',
    exportReportBtn: 'Export Security Report',
    closeBtn: 'Close',

    searchPlaceholder: 'Search by IP, name, model or vendor...',
    sortByLabel: 'Sort by:',
    sortByIp: 'By IP Address',
    sortByConfidence: 'By Match Confidence',
    sortByLatency: 'By Latency (ms)',
    noDevicesFound: 'No devices found',
    noDevicesMatch: 'No devices match your selected filters. Try resetting filters.',
  },
};

const STORAGE_KEY = 'netcam_scanner_lang';

interface LanguageContextType {
  lang: LanguageCode;
  setLang: (lang: LanguageCode) => void;
  t: Translations;
}

export const LanguageContext = createContext<LanguageContextType>({
  lang: 'ru',
  setLang: () => {},
  t: TRANSLATIONS.ru,
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<LanguageCode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as LanguageCode;
      if (saved && (saved === 'ru' || saved === 'ka' || saved === 'en')) {
        return saved;
      }
    } catch {
      // fallback
    }
    return 'ru';
  });

  const setLang = (newLang: LanguageCode) => {
    setLangState(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: TRANSLATIONS[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => useContext(LanguageContext);

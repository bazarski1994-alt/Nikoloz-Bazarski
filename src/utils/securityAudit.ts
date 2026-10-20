import type { OpenPort, SecurityIssue, RiskSeverity, EducationalRemediationOption } from '../types.ts';

/**
 * Checks whether a port is commonly accessible via Web browser (HTTP / HTTPS)
 */
export function isBrowserAccessiblePort(port: number): { isWeb: boolean; protocol: 'http' | 'https'; label: string } {
  if (port === 443 || port === 8443 || port === 5001) {
    return { isWeb: true, protocol: 'https', label: 'HTTPS' };
  }
  if (port === 80) {
    return { isWeb: true, protocol: 'http', label: 'HTTP' };
  }
  if (port === 8080 || port === 8081 || port === 8082) {
    return { isWeb: true, protocol: 'http', label: 'HTTP Alt' };
  }
  if (port === 5000) {
    return { isWeb: true, protocol: 'http', label: 'Synology / UPnP Web' };
  }
  if (port === 8123) {
    return { isWeb: true, protocol: 'http', label: 'Home Assistant Web' };
  }
  if (port === 32400) {
    return { isWeb: true, protocol: 'http', label: 'Plex Web UI' };
  }
  if (port === 8000) {
    return { isWeb: true, protocol: 'http', label: 'Web / iVMS-4500' };
  }
  if (port === 8001) {
    return { isWeb: true, protocol: 'http', label: 'SmartThings / Web UI' };
  }
  if (port === 8008) {
    return { isWeb: true, protocol: 'http', label: 'Google Cast Web API' };
  }
  if (port === 9000) {
    return { isWeb: true, protocol: 'http', label: 'ONVIF Web Config' };
  }
  if (port === 631) {
    return { isWeb: true, protocol: 'http', label: 'CUPS Printer Web UI' };
  }
  return { isWeb: false, protocol: 'http', label: '' };
}

export function getBrowserUrl(ip: string, port: number): string {
  const info = isBrowserAccessiblePort(port);
  if (port === 80) return `http://${ip}`;
  if (port === 443) return `https://${ip}`;
  return `${info.protocol}://${ip}:${port}`;
}

/**
 * Evaluates open ports, banners, and network services to detect security misconfigurations and vulnerabilities
 * Provides comprehensive educational breakdowns ("что к чему") and all remediation options for testing and safety.
 */
export function auditDeviceSecurity(params: {
  ip: string;
  ports: OpenPort[];
  vendor?: string;
  isCamera: boolean;
  httpServer?: string;
  httpTitle?: string;
}): { issues: SecurityIssue[]; riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical' } {
  const { ip, ports, vendor = '', isCamera, httpServer = '', httpTitle = '' } = params;
  const issues: SecurityIssue[] = [];
  const openPortNumbers = ports.map((p) => p.port);
  const pSet = new Set(openPortNumbers);

  // 1. Telnet Port 23 Check (Critical)
  if (pSet.has(23)) {
    issues.push({
      id: `sec-telnet-${ip}`,
      severity: 'critical',
      cveOrRef: 'CWE-319, Botnet Vectors (Mirai, Bashlite)',
      title: 'Открыт незашифрованный Telnet (Порт 23)',
      description:
        'Служба Telnet передает логины, пароли и команды в открытом виде. Уязвима к MITM-перехвату и атакам ботнетов (Mirai, Bashlite), сканирующим стандартные учетные записи.',
      port: 23,
      remediation:
        'Немедленно отключите службу Telnet в веб-интерфейсе устройства. Перейдите на защищенный протокол SSH (порт 22) с доступом по криптографическим ключам.',
      technicalDetails:
        'Протокол Telnet (RFC 854) был разработан в 1969 году до появления современных стандартов шифрования. Весь трафик между клиентом и камерой/устройством идет открытым байтовым потоком. В прошивках многих OEM-камер (Xiongmai, Goke, HiSilicon) встроен telnetd без обязательной смены заводских паролей (root/xc3511, root/vizxv, admin/123456).',
      threatModel:
        'Любой узел в локальной сети (зараженный рабочий ПК, гостевой смартфон или вредоносный скрипт) может перехватить трафик сессии через ARP-spoofing либо методом автоматизированного перебора получить root shell в Linux-системе камеры, сделав ее частью DDoS-ботнета.',
      safeAuditCommand: `nc -zv -w 2 ${ip} 23`,
      testVerificationSteps: [
        '1. Запустите безопасную проверку баннера через сетевую утилиту или curl без передачи учетных данных.',
        '2. Убедитесь, возвращает ли порт приглашение командной оболочки BusyBox / Linux Login prompt.',
        '3. Проверьте, закрывается ли порт при отключении службы в меню "Службы сети -> Telnet" в веб-интерфейсе.',
        '4. Просканируйте хост повторно для подтверждения блокировки порта.',
      ],
      remediationOptions: [
        {
          id: 'opt-telnet-disable',
          category: 'services',
          title: 'Вариант 1 (Рекомендуемый): Полное отключение Telnet',
          description: 'Отключите службу Telnet в веб-интерфейсе или приложении управления (iCSee / SmartPSS / CMS).',
          actionSteps: [
            'Войдите в Веб-интерфейс устройства (порт 80/443).',
            'Перейдите в раздел "Настройки сети" -> "Службы" (Network Services).',
            'Снимите флажок "Включить Telnet" (Enable Telnet) и сохраните параметры.',
            'Перезагрузите устройство.',
          ],
          priority: 'immediate',
        },
        {
          id: 'opt-telnet-ssh',
          category: 'encryption',
          title: 'Вариант 2: Замена на зашифрованный SSH',
          description: 'Если необходим терминальный доступ к Linux-оборудованию, используйте OpenSSH / Dropbear с аутентификацией по Ed25519 ключам.',
          actionSteps: [
            'Включите SSH на нестандартном порту (например, 2222).',
            'Отключите аутентификацию по паролям (PasswordAuthentication no).',
            'Установите публичный ключ администратора в authorized_keys.',
          ],
          commandExample: `ssh -p 22 -o PreferredAuthentications=publickey admin@${ip}`,
          priority: 'high',
        },
        {
          id: 'opt-telnet-firewall',
          category: 'firewall',
          title: 'Вариант 3: Блокировка порта на уровне коммутатора / роутера',
          description: 'Если устройство не позволяет отключить Telnet программно, заблокируйте трафик к порту 23 правилом Firewall (ACL).',
          actionSteps: [
            'Откройте настройки роутера или управляемого свитча (L2/L3).',
            'Добавьте правило DROP TCP на порт 23 для IP адреса устройства.',
          ],
          commandExample: `iptables -A FORWARD -d ${ip} -p tcp --dport 23 -j DROP`,
          priority: 'recommended',
        },
      ],
    });
  }

  // 2. SMB Port 445 / NetBIOS 139 (High)
  if (pSet.has(445) || pSet.has(139)) {
    issues.push({
      id: `sec-smb-${ip}`,
      severity: 'high',
      cveOrRef: 'MS17-010 (EternalBlue), CVE-2020-0796 (SMBGhost)',
      title: 'Открыт файловый доступ SMB / Samba (Порт 445 / 139)',
      description:
        'Сетевые папки Windows SMB часто подвергаются эксплойтам удаленного выполнения кода (EternalBlue / MS17-010) и атакам шифровальщиков-вымогателей при отсутствии изоляции.',
      port: 445,
      remediation:
        'Отключите устаревший SMBv1. Включите подписывание пакетов SMBv3 и запретите гостевой анонимный вход без аутентификации.',
      technicalDetails:
        'SMB (Server Message Block) используется для общего доступа к файлам и принтерам. Устаревшие реализации SMBv1 содержат критические уязвимости управления памятью в ядре srv.sys. В современных сетях SMB не должен выходить за пределы локальной рабочей группы.',
      threatModel:
        'Черви-вымогатели (WannaCry, NotPetya) сканируют локальные подсети на порт 445 для латерального перемещения (lateral movement) и автоматического заражения всех компьютеров в сети за считанные минуты.',
      safeAuditCommand: `nmap -p 445 --script smb-protocols ${ip}`,
      testVerificationSteps: [
        '1. Выполните безопасное согласование диалектов SMB (Dialect Negotiation).',
        '2. Убедитесь, что диалект SMBv1 отключен и устройство принимает только SMBv2.1 или SMBv3.1.1.',
        '3. Проверьте, включено ли обязательное подписывание пакетов (SMB Signing: Required).',
      ],
      remediationOptions: [
        {
          id: 'opt-smb-v1-disable',
          category: 'services',
          title: 'Вариант 1: Полное отключение SMBv1 в системе',
          description: 'Удалите поддержку протокола SMB 1.0/CIFS во всех операционных системах сети.',
          actionSteps: [
            'В Windows: Откройте "Включение или отключение компонентов Windows".',
            'Снимите галочку с "Поддержка общего доступа к файлам SMB 1.0/CIFS".',
            'В Linux/Samba: В файле smb.conf установите "server min protocol = SMB2_02".',
          ],
          commandExample: 'powershell: Disable-WindowsOptionalFeature -Online -FeatureName smb1protocol',
          priority: 'immediate',
        },
        {
          id: 'opt-smb-vlan',
          category: 'vlan',
          title: 'Вариант 2: Сегментация файловых хранилищ',
          description: 'Выделите файловые серверы и NAS в доверенный изолированный VLAN.',
          actionSteps: [
            'Запретите доступ к порту 445 из гостевых сетей и VLAN видеонаблюдения.',
            'Разрешите SMB трафик только между авторизованными рабочими станциями.',
          ],
          priority: 'high',
        },
      ],
    });
  }

  // 3. Remote Desktop RDP Port 3389 (High)
  if (pSet.has(3389)) {
    issues.push({
      id: `sec-rdp-${ip}`,
      severity: 'high',
      cveOrRef: 'CVE-2019-0708 (BlueKeep), CVE-2012-0002',
      title: 'Открыт прямой порт удаленного рабочего стола RDP (3389)',
      description:
        'Прямой доступ к RDP без защищенного VPN-шлюза уязвим к непрерывному перебору паролей (brute-force) и уязвимостям класса BlueKeep (CVE-2019-0708).',
      port: 3389,
      remediation:
        'Никогда не пробрасывайте 3389 во внешнюю сеть. Настройте WireGuard или OpenVPN и активируйте NLA (Network Level Authentication).',
      technicalDetails:
        'RDP (Remote Desktop Protocol) обеспечивает полный доступ к сеансу рабочего стола. Без предварительной аутентификации на сетевом уровне (NLA) служба RDP обрабатывает запросы до проверки логина, создавая поверхность атаки.',
      threatModel:
        'Боты и злоумышленники автоматизированно сканируют порт 3389, перебирают учетные записи администраторов и используют уязвимости ядра терминального сервера для захвата управления.',
      safeAuditCommand: `nmap -p 3389 --script rdp-enum-encryption ${ip}`,
      testVerificationSteps: [
        '1. Проверьте статус NLA (Network Level Authentication) с помощью скрипта rdp-enum-encryption.',
        '2. Убедитесь, что служба требует CredSSP перед созданием графической сессии.',
        '3. Проверьте логи безопасности (Event Viewer ID 4625) на наличие попыток перебора паролей.',
      ],
      remediationOptions: [
        {
          id: 'opt-rdp-nla',
          category: 'credentials',
          title: 'Вариант 1: Включение обязательного NLA',
          description: 'Разрешите подключения только с компьютеров, на которых работает удаленный рабочий стол с проверкой подлинности на уровне сети.',
          actionSteps: [
            'В свойствах системы перейдите во вкладку "Удаленный доступ".',
            'Включите "Разрешить подключения только с компьютеров с проверкой подлинности на уровне сети (NLA)".',
          ],
          priority: 'immediate',
        },
        {
          id: 'opt-rdp-vpn',
          category: 'encryption',
          title: 'Вариант 2: Доступ исключительно через VPN (WireGuard / Tailscale)',
          description: 'Закройте доступ к RDP снаружи и подключайтесь к рабочему столу только через шифрованный VPN-туннель.',
          actionSteps: [
            'Разверните WireGuard или Tailscale на роутере.',
            'Уберите Port Forwarding порта 3389 в настройках маршрутизатора.',
          ],
          priority: 'high',
        },
      ],
    });
  }

  // 4. Default Camera Credentials & Proprietary Port Exposure (High)
  if (isCamera) {
    const vLower = vendor.toLowerCase();
    if (vLower.includes('xiongmai') || pSet.has(34567)) {
      issues.push({
        id: `sec-xm-pass-${ip}`,
        severity: 'high',
        cveOrRef: 'Xiongmai NetIP Sofia protocol CVE-2018-10088 / Default blank password',
        title: 'Риск заводского пароля Xiongmai NetIP (порт 34567)',
        description:
          'Камеры на процессорах Xiongmai (iCSee / XMeye / Xiongmai) по умолчанию поставляются с учетной записью "admin" и пустым паролем через бинарный протокол NetIP (порт 34567).',
        port: 34567,
        remediation:
          'Задайте сложный надежный пароль (минимум 10-14 символов) через мобильное приложение iCSee или программу VMS на ПК. Отключите облачный сервис Xiongmai Cloud P2P если он не используется.',
        technicalDetails:
          'Служба sofia в прошивках Xiongmai слушает порт 34567 по кастомному протоколу NetIP. Протокол позволяет конфигурировать камеру, получать видеопоток, менять IP-адреса и обновлять прошивку. При пустом пароле любой клиент в сети получает права суперадминистратора.',
        threatModel:
          'Злоумышленник в локальной сети или вредоносное ПО может подключиться к порту 34567 без ввода пароля, перехватить видеопоток, загрузить модифицированную прошивку или использовать камеру как прокси.',
        safeAuditCommand: `curl -s -m 2 http://${ip}/`,
        testVerificationSteps: [
          '1. Откройте приложение iCSee или программу VMS / CMS.',
          '2. Попробуйте войти с логином admin и пустым паролем.',
          '3. Если устройство успешно пускает без пароля — устройство критически уязвимо!',
          '4. Установите пароль с буквами разного регистра, цифрами и спецсимволами.',
        ],
        remediationOptions: [
          {
            id: 'opt-xm-passwd',
            category: 'credentials',
            title: 'Вариант 1: Смена пароля администратора в iCSee / VMS',
            description: 'Немедленно смените пароль учетной записи admin на надежный пароль.',
            actionSteps: [
              'Откройте приложение iCSee или VMS на компьютере.',
              'Перейдите в "Настройки устройства" -> "Управление пользователями" -> "admin".',
              'Введите новый сложный пароль (минимум 10 символов) и подтвердите.',
            ],
            priority: 'immediate',
          },
          {
            id: 'opt-xm-p2p',
            category: 'services',
            title: 'Вариант 2: Отключение публичного облака Cloud P2P',
            description: 'Если камера используется локально с NVR или Home Assistant, отключите китайские облачные серверы Xiongmai Cloud.',
            actionSteps: [
              'В настройках сети отключите функцию "Cloud" / "P2P Service".',
              'Заблокируйте DNS-запросы камеры к серверам xmeye.net на вашем роутере.',
            ],
            priority: 'high',
          },
          {
            id: 'opt-xm-vlan',
            category: 'vlan',
            title: 'Вариант 3: Изоляция в отдельный VLAN без выхода в интернет',
            description: 'Заблокируйте камере доступ во внешнюю глобальную сеть (WAN Drop).',
            actionSteps: [
              'На роутере создайте правило межсетевого экрана, запрещающее камере ${ip} доступ в WAN.',
              'Оставьте доступ только локальному серверу записи (NVR/Frigate).',
            ],
            priority: 'recommended',
          },
        ],
      });
    } else if (vLower.includes('dahua') || pSet.has(37777)) {
      issues.push({
        id: `sec-dahua-creds-${ip}`,
        severity: 'medium',
        cveOrRef: 'Dahua DVR Private Protocol Port 37777 / CVE-2021-33044',
        title: 'Проверка учетных данных Dahua DVR (порт 37777)',
        description:
          'Порт управления Dahua DVR/NVR 37777 открыт. Убедитесь, что заводская пара admin:admin или 888888 была изменена при начальной инициализации устройства.',
        port: 37777,
        remediation:
          'Проверьте сложность пароля в веб-интерфейсе камеры, обновите прошивку Dahua и отключите протокол UPnP автопроброса портов на домашнем роутере.',
        technicalDetails:
          'Порт 37777 — фирменный TCP-протокол Dahua (SmartPSS / gDMSS). Старые модели регистраторов Dahua имели жестко зашитые резервные учетные записи (888888/888888, 666666/666666). В уязвимых версиях прошивок обнаружен обход аутентификации CVE-2021-33044.',
        threatModel:
          'Неавторизованный пользователь в локальной сети через утилиту ConfigTool может сканировать и изменять конфигурацию регистратора при слабом пароле.',
        safeAuditCommand: `nc -zv -w 2 ${ip} 37777`,
        testVerificationSteps: [
          '1. Откройте SmartPSS или Dahua ConfigTool.',
          '2. Убедитесь, что стандартные сервисные аккаунты (default, guest, 888888) деактивированы.',
          '3. Проверьте версию прошивки на официальном сайте Dahua Security Bulletin.',
        ],
        remediationOptions: [
          {
            id: 'opt-dahua-creds',
            category: 'credentials',
            title: 'Вариант 1: Проверка пароля и отключение сервисных учетных записей',
            description: 'Убедитесь, что учетная запись admin защищена сложным паролем, а гостевые профили удалены.',
            actionSteps: [
              'Войдите в Веб-интерфейс Dahua по адресу https://${ip}.',
              'Перейдите в "Система" -> "Учетная запись" (Account).',
              'Удалите неиспользуемые учетные записи, смените пароль admin.',
            ],
            priority: 'immediate',
          },
          {
            id: 'opt-dahua-firmware',
            category: 'firmware',
            title: 'Вариант 2: Обновление прошивки Dahua',
            description: 'Установите последнюю ревизию ПО с устраненной уязвимостью CVE-2021-33044.',
            actionSteps: [
              'Скачайте официальный файл обновления (.bin) с портала Dahua Wiki или сайта поддержки.',
              'Выполните прошивку через ConfigTool или веб-панель "Обновление системы".',
            ],
            priority: 'high',
          },
        ],
      });
    } else if (vLower.includes('hikvision') || pSet.has(8000)) {
      issues.push({
        id: `sec-hik-creds-${ip}`,
        severity: 'medium',
        cveOrRef: 'Hikvision iVMS SDK / CVE-2017-7921, CVE-2021-36260',
        title: 'Защита порта управления Hikvision iVMS (порт 8000)',
        description:
          'Служебный порт Hikvision SDK (8000) активен. На устаревших прошивках возможны уязвимости обхода аутентификации (CVE-2017-7921) и внедрения команд (CVE-2021-36260).',
        port: 8000,
        remediation:
          'Обновите прошивку камеры до актуальной версии с сайта Hikvision. Измените стандартный порт SDK и ограничьте доступ по IP.',
        technicalDetails:
          'Порт 8000 используется фирменным ПО Hikvision iVMS-4200 и Hik-Connect. В версиях прошивок Hikvision до 2021 года веб-сервер камеры имел критическую уязвимость в обработчике сообщений XML (CVE-2021-36260, CVSS 9.8), позволявшую выполнить команды без авторизации.',
        threatModel:
          'Уязвимая камера в локальной сети может быть скомпрометирована одним HTTP-запросом с вредоносной XML-полезной нагрузкой, предоставив атакующему доступ к внутренней сети.',
        safeAuditCommand: `curl -I -m 2 http://${ip}/System/deviceInfo`,
        testVerificationSteps: [
          '1. Проверьте версию прошивки через Web-интерфейс в меню "Конфигурация" -> "Система" -> "Информация об устройстве".',
          '2. Если прошивка выпущена ранее октября 2021 года — обновление обязательно!',
          '3. Убедитесь, что камера не возвращает системную конфигурацию без запроса аутентификации.',
        ],
        remediationOptions: [
          {
            id: 'opt-hik-fw',
            category: 'firmware',
            title: 'Вариант 1: Срочное обновление прошивки Hikvision',
            description: 'Загрузите официальную прошивку с сайта Hikvision Security Center и примените через веб-интерфейс.',
            actionSteps: [
              'Перейдите на официальный сайт hikvision.com в раздел Support -> Firmware.',
              'Найдите точную модель вашей камеры и загрузите digicap.dav.',
              'В веб-интерфейсе камеры: "Конфигурация" -> "Обслуживание" -> "Обновление".',
            ],
            priority: 'immediate',
          },
          {
            id: 'opt-hik-net',
            category: 'firewall',
            title: 'Вариант 2: Ограничение доступа к портам 80 и 8000',
            description: 'Разрешите доступ к портам камеры только IP-адресу NVR или рабочей станции администратора.',
            actionSteps: [
              'Включите встроенный IP-фильтр камеры: "Безопасность" -> "IP Filter".',
              'Добавьте в белый список только разрешенные доверенные IP-адреса.',
            ],
            priority: 'high',
          },
        ],
      });
    }
  }

  // 5. Unencrypted RTSP Stream (Medium)
  if (pSet.has(554) || pSet.has(8554)) {
    issues.push({
      id: `sec-rtsp-unenc-${ip}`,
      severity: 'medium',
      cveOrRef: 'RFC 2326 (Unencrypted Real Time Streaming Protocol)',
      title: 'Незащищенный видеопоток RTSP (Порт 554)',
      description:
        'Стандартный протокол RTSP передает видеопоток H.264/H.265 в открытом виде без SSL/TLS шифрования, что позволяет просматривать видео любому пользователю в локальной сети.',
      port: 554,
      remediation:
        'Используйте RTSPS (RTSP поверх TLS) если поддерживается оборудованием, либо изолируйте камеры в защищенный сегмент сети (VLAN). Обязательно включите дайджест-аутентификацию (Digest Auth).',
      technicalDetails:
        'RTSP согласует медиапотоки по TCP, а сами RTP/RTCP пакеты с кадрами видео передаются без криптографической защиты. Если в камере включена базовая аутентификация (Basic Auth), учетные данные передаются в заголовке Authorization в кодировке Base64, которая тривиально декодируется.',
      threatModel:
        'Пользователь, подключившийся к общему Wi-Fi или локальной сети, может запустить Wireshark и собрать живой видеопоток с камеры наблюдения, нарушая конфиденциальность объекта.',
      safeAuditCommand: `ffprobe -v error -rtsp_transport tcp -i "rtsp://${ip}:554/ch0_0.h264"`,
      testVerificationSteps: [
        '1. Попробуйте открыть RTSP поток в плеере VLC без указания логина и пароля.',
        '2. Если видео начинает воспроизводиться сразу — авторизация отключена (критический риск!).',
        '3. Убедитесь, что в настройках видеопотока метод аутентификации переключен с "Basic" на "Digest".',
      ],
      remediationOptions: [
        {
          id: 'opt-rtsp-digest',
          category: 'credentials',
          title: 'Вариант 1: Включение Digest Authentication вместо Basic',
          description: 'Запретите передачу открытых паролей при согласовании RTSP сессии.',
          actionSteps: [
            'В веб-панели камеры откройте "Безопасность" -> "Аутентификация RTSP".',
            'Установите тип аутентификации: "Digest" (хэшированная) вместо "Basic".',
          ],
          priority: 'immediate',
        },
        {
          id: 'opt-rtsp-vlan',
          category: 'vlan',
          title: 'Вариант 2: Изоляция трафика RTSP в VLAN видеонаблюдения',
          description: 'Полностью отделите трафик видеокамер от офисных или домашних компьютеров.',
          actionSteps: [
            'Настройте на коммутаторе отдельный VLAN для всех камер и регистратора NVR.',
            'Запретите маршрутизацию между VLAN видеонаблюдения и общей пользовательской сетью.',
          ],
          priority: 'high',
        },
      ],
    });
  }

  // 6. Plaintext HTTP Admin Interface without HTTPS (Medium)
  if ((pSet.has(80) || pSet.has(8080)) && !pSet.has(443) && !pSet.has(8443)) {
    issues.push({
      id: `sec-http-plain-${ip}`,
      severity: 'medium',
      cveOrRef: 'CWE-319 (Cleartext Transmission of Sensitive Information)',
      title: 'Веб-управление без HTTPS (Порт 80/8080)',
      description:
        'Аутентификация администратора и cookie сессии передаются по незашифрованному протоколу HTTP, открытому для сниффинга в Wi-Fi сети.',
      port: pSet.has(80) ? 80 : 8080,
      remediation:
        'Включите в настройках протокол HTTPS с самоподписанным или доверенным сертификатом и автоматическое перенаправление с HTTP.',
      technicalDetails:
        'При передаче формы входа по HTTP заголовки Authorization или POST-параметры формы передаются в открытом текстовом формате. Любой сниффер пакетов в том же широковещательном домене (L2) перехватывает пароли в момент ввода.',
      threatModel:
        'Атака Man-in-the-Middle (через ARP-spoofing) позволяет перехватить сессионные куки или пароль администратора при авторизации через браузер.',
      safeAuditCommand: `curl -I http://${ip}/`,
      testVerificationSteps: [
        '1. Откройте в браузере http://${ip}.',
        '2. Проверьте, появляется ли предупреждение о небезопасном подключении ("Не защищено").',
        '3. Проверьте в сетевых настройках наличие опции "HTTPS" или "SSL Certificate".',
      ],
      remediationOptions: [
        {
          id: 'opt-https-enable',
          category: 'encryption',
          title: 'Вариант 1: Активация HTTPS и генерация сертификата',
          description: 'Включите шифрование SSL/TLS в веб-сервере камеры.',
          actionSteps: [
            'Откройте настройки: "Сеть" -> "Расширенные" -> "HTTPS".',
            'Сгенерируйте встроенный самоподписанный сертификат устройства.',
            'Включите "Автоматический редирект HTTP на HTTPS".',
          ],
          priority: 'high',
        },
      ],
    });
  }

  // 7. VNC Port 5900 (Medium)
  if (pSet.has(5900)) {
    issues.push({
      id: `sec-vnc-${ip}`,
      severity: 'medium',
      cveOrRef: 'RFB Protocol / Weak DES authentication',
      title: 'Удаленный экран VNC без шифрования (Порт 5900)',
      description:
        'Традиционный RFB-протокол VNC передает экран и ввод клавиатуры без сквозного SSL-шифрования и ограничен паролем до 8 символов.',
      port: 5900,
      remediation: 'Заверните трафик VNC в SSH-туннель или используйте RDP/NoMachine с шифрованием.',
      technicalDetails: 'Стандартный пароль VNC ограничен 8 символами и шифруется устаревшим алгоритмом DES.',
      threatModel: 'Сниффинг ввода с клавиатуры (клавиши, пароли) в локальной сети.',
      safeAuditCommand: `nc -zv -w 2 ${ip} 5900`,
      testVerificationSteps: ['Проверьте, требует ли VNC-сервер пароль при подключении через vncviewer.'],
      remediationOptions: [
        {
          id: 'opt-vnc-ssh',
          category: 'encryption',
          title: 'Использование SSH-туннеля для VNC',
          description: 'Ограничьте VNC локальным адресом 127.0.0.1 и подключайтесь через SSH туннель: ssh -L 5900:localhost:5900 user@ip',
          actionSteps: ['Настройте VNC на прослушивание только 127.0.0.1.', 'Создайте SSH туннель.'],
          priority: 'high',
        },
      ],
    });
  }

  // 8. Plaintext FTP Port 21 (Medium)
  if (pSet.has(21)) {
    issues.push({
      id: `sec-ftp-${ip}`,
      severity: 'medium',
      cveOrRef: 'RFC 959 (Cleartext File Transfer Protocol)',
      title: 'Открыт устаревший FTP сервер (Порт 21)',
      description: 'Учетные записи и передаваемые файлы (включая снимки с камер) передаются по FTP в открытом виде.',
      port: 21,
      remediation: 'Используйте SFTP (через порт 22 SSH) или FTPS (FTP over TLS). Отключите анонимный вход.',
      technicalDetails: 'Команды USER и PASS передаются в виде простого текста.',
      threatModel: 'Перехват логинов, паролей и выгружаемых архивов видеокамер.',
      safeAuditCommand: `nc -zv -w 2 ${ip} 21`,
      testVerificationSteps: ['Попробуйте выполнить анонимный вход: ftp anonymous@ip.'],
      remediationOptions: [
        {
          id: 'opt-ftp-sftp',
          category: 'services',
          title: 'Переход на SFTP / FTPS',
          description: 'Отключите FTP и используйте SFTP или сетевую папку с шифрованием.',
          actionSteps: ['Отключите службу FTP.', 'Включите SFTP.'],
          priority: 'recommended',
        },
      ],
    });
  }

  // 9. Plaintext MQTT Port 1883 (Low)
  if (pSet.has(1883)) {
    issues.push({
      id: `sec-mqtt-${ip}`,
      severity: 'low',
      cveOrRef: 'MQTT without TLS',
      title: 'Открыт брокер MQTT без TLS (Порт 1883)',
      description:
        'Телеметрия умного дома и команды управления датчиками могут читаться неавторизованными устройствами в общей подсети.',
      port: 1883,
      remediation: 'Включите MQTTS с TLS-сертификатом на порту 8883 и обязательную авторизацию по логину/паролю.',
      technicalDetails: 'Сообщения топиков MQTT передаются без шифрования.',
      threatModel: 'Подписка на топик "#" позволяет читать состояние датчиков движения, открытия дверей и замков.',
      safeAuditCommand: `nc -zv -w 2 ${ip} 1883`,
      testVerificationSteps: ['Проверьте, принимает ли брокер подписку mosquitto_sub -h ip -t "#" без логина.'],
      remediationOptions: [
        {
          id: 'opt-mqtt-tls',
          category: 'encryption',
          title: 'Включение MQTTS (Порт 8883)',
          description: 'Настройте SSL сертификат для брокера Mosquitto и отключите анонимный доступ (allow_anonymous false).',
          actionSteps: ['Включите TLS на порту 8883.', 'Задайте логин и пароль для клиентов.'],
          priority: 'recommended',
        },
      ],
    });
  }

  // 10. Flat Network / Surveillance VLAN recommendation (Info)
  if (isCamera) {
    issues.push({
      id: `sec-cam-vlan-${ip}`,
      severity: 'info',
      cveOrRef: 'Network Segmentation Best Practices (CIS Controls 12)',
      title: 'Рекомендация по изоляции в отдельный VLAN видеонаблюдения',
      description: `Устройство ${vendor || 'IP-камера'} находится в общей локальной сети вместе с персональными ПК и мобильными телефонами.`,
      port: 554,
      remediation:
        'Выделите камеры и NVR в отдельную изолированную подсеть (VLAN видеонаблюдения) без прямого доступа в общую локальную сеть и интернет.',
      technicalDetails:
        'IoT-устройства и камеры имеют ограниченные ресурсы процессора и редко получают обновления безопасности, поэтому размещение их в общем сегменте L2 с рабочими ПК увеличивает радиус поражения при атаке.',
      threatModel:
        'В случае компрометации прошивки камеры злоумышленник может сканировать остальные устройства в локальной сети.',
      safeAuditCommand: `ping -c 2 ${ip}`,
      testVerificationSteps: ['Проверьте, пингуется ли камера из гостевой сети или с офисных ПК.'],
      remediationOptions: [
        {
          id: 'opt-cam-vlan-setup',
          category: 'vlan',
          title: 'Создание изолированного VLAN для камер',
          description: 'Настройте отдельный тегированный VLAN (например VLAN 20 - Cameras).',
          actionSteps: [
            'Создайте интерфейс VLAN на маршрутизаторе (например 192.168.20.0/24).',
            'Назначьте порты коммутатора, к которым подключены камеры, в VLAN 20.',
            'Настройте правила фаервола: разрешить доступ только серверу записи NVR.',
          ],
          priority: 'recommended',
        },
      ],
    });
  }

  // Calculate overall risk
  let riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical' = 'safe';
  if (issues.some((i) => i.severity === 'critical')) {
    riskLevel = 'critical';
  } else if (issues.some((i) => i.severity === 'high')) {
    riskLevel = 'high';
  } else if (issues.some((i) => i.severity === 'medium')) {
    riskLevel = 'medium';
  } else if (issues.some((i) => i.severity === 'low' || i.severity === 'info')) {
    riskLevel = 'low';
  }

  return { issues, riskLevel };
}

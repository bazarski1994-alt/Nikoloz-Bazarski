# NetCam Scanner — Нативный проект для Android Studio

Полноценное Android-приложение для сканирования локальной сети Wi-Fi, обнаружения IP-камер (Hikvision, Dahua, Xiongmai, Tapo, Reolink, ONVIF) и запуска RTSP-видеопотоков.

## 🚀 Особенности проекта:
- **100% автономная работа без внешних API:** использует только нативные Java/Android сокеты (`java.net.Socket`), корутины (`Dispatchers.IO`) и сетевые интерфейсы (`NetworkInterface`, `WifiManager`).
- **Современный стек:** Kotlin 2.0+, Jetpack Compose, Material 3, Coroutines Flow.
- **Минимальная версия Android:** Android 7.0 (API 24) до новейшей Android 15 (API 35).
- **Прямой запуск потока:** Открытие RTSP-стрима через системный Intent в установленные плееры (VLC for Android, MX Player, TinyCam).
- **Экспорт плейлиста:** отправка сформированного `.m3u` списка всех найденных камер в один клик.

## 🛠 Инструкция по сборке в Android Studio:

1. **Открытие проекта:**
   - Откройте **Android Studio** (рекомендуется Hedgehog, Iguana, Koala, Ladybug или новее).
   - Выберите **File → Open...**
   - Выберите папку `android-project` (или распакованный архив).

2. **Синхронизация Gradle:**
   - Android Studio автоматически начнет **Gradle Sync**.
   - Дождитесь скачивания официальных библиотек AndroidX и Jetpack Compose.

3. **Запуск:**
   - Подключите Android смартфон по USB (включите «Отладку по USB» в настройках разработчика) или запустите эмулятор с доступом к локальной сети.
   - Нажмите зеленую кнопку **Run 'app' (Shift + F10)**.

## 📋 Разрешения в AndroidManifest.xml:
- `android.permission.INTERNET` — для открытия сокетов по локальной сети;
- `android.permission.ACCESS_NETWORK_STATE` — проверка подключения к Wi-Fi;
- `android.permission.ACCESS_WIFI_STATE` — чтение параметров локального IP-адреса.

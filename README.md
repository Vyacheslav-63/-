# SpeakEasy English — Разговорный английский (PWA)

Интерактивный игровой тренажёр английского языка, созданный специально для русскоязычных пользователей, плюс двусторонний голосовой переводчик **RU ⇄ EN** и поддержка установки как мобильного приложения (PWA) на Android и iOS.

## Возможности

- **Дорожная карта и шаблоны речи:** готовые разговорные конструкции с кириллической фонетикой и подсказками.
- **Симулятор диалогов:** практические сценарии (кафе, аэропорт, знакомство, магазин и др.) с озвучиванием фраз.
- **Тренировки и тесты:** сборка фраз, аудирование и быстрые проверки понимания.
- **Интервальное повторение:** личный словарь карточек для закрепления сложных слов и фраз.
- **Прогрессия и напоминания:** XP, серия дней (streak), таблица лидеров, достижения и ежедневные уведомления.
- **Голосовой переводчик RU ⇄ EN:** распознавание русской и английской речи, перевод через Gemini API на сервере, кириллическая транскрипция `[...]` и добавление фраз в словарь.
- **PWA для Android и iOS:** офлайн-кэш интерфейса, иконки и подсказка установки на главный экран.

## Стек

- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Vite, `vite-plugin-pwa`, Lucide Icons, Motion
- **Backend:** Express, Node.js >= 22 (нативный запуск `server.ts`), `@google/genai`

## Требования и локальный запуск

1. Установите **Node.js 22+** (`node -v`).
2. Установите зависимости:

```bash
npm install
```

3. Создайте файл `.env` на основе `.env.example` и укажите ваш ключ Gemini API:

```bash
cp .env.example .env
```

```env
GEMINI_API_KEY="ВАШ_КЛЮЧ_GEMINI"
PORT="3000"
```

4. Запустите сервер разработки (Express + Vite на порту `3000`):

```bash
npm run dev
```

## Сборка и запуск в production

```bash
npm run build
npm start
```

> **Важно для мобильного PWA и микрофона:** в продакшене (вне `localhost`) браузеры разрешают работу Service Worker и доступ к микрофону только по протоколу **HTTPS**.

## Скачать на телефон прямо с GitHub

В репозитории подготовлены два способа установки без запуска собственного сервера:

1. **Единый автономный файл (`downloads/SpeakEasy-English-Offline.html`)**
   - Откройте файл [`downloads/SpeakEasy-English-Offline.html`](downloads/SpeakEasy-English-Offline.html) на GitHub и нажмите **Download raw file**.
   - Откройте скачанный файл в браузере на телефоне (Chrome на Android или через «Файлы» / браузер на iPhone) — все уроки, диалоги, 50 карточек словаря, тесты и встроенный офлайн-разговорник работают внутри одного файла без интернета.
   - Для пересборки файла локально используйте: `npm run build:portable`.

2. **Готовый `.apk` для Android (автоматически через GitHub Actions)**
   - После загрузки проекта на GitHub перейдите во вкладку **Actions** → **Build Android APK & Portable App** → последний запуск → **Artifacts** → скачайте **`SpeakEasy-English-Mobile`** (внутри лежит готовый установочный файл **`SpeakEasy-English.apk`**).
   - Либо создайте тег версии (`git tag v1.0.0 && git push origin v1.0.0`) — `.apk` автоматически прикрепится в раздел **Releases** вашего репозитория.

## Полезные команды

- `npm run lint` — проверка типов TypeScript (`tsc --noEmit`)
- `npm run build` — сборка клиентского бандла и PWA Service Worker в `dist/`
- `npm run build:portable` — сборка единого автономного файла `downloads/SpeakEasy-English-Offline.html`
- `npm run generate-icons` — перегенерация PNG-иконок из `public/icon.svg`
- `npm run clean` — очистка сборочных папок (`dist/`, `dev-dist/`, `.portable-tmp/`)

## Как отправить проект на GitHub

```bash
git add .
git commit -m "Initial commit: SpeakEasy English PWA"
git branch -M main
git remote add origin https://github.com/<ваш-логин>/<имя-репозитория>.git
git push -u origin main
```

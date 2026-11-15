import React, { useState } from 'react';
import {
  Download,
  X,
  Smartphone,
  Apple,
  Check,
  Share,
  PlusSquare,
  Sparkles,
  AlertTriangle,
  Copy,
} from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { sfx } from '../utils/audio';

interface InstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const InstallModal: React.FC<InstallModalProps> = ({ isOpen, onClose }) => {
  const {
    isInstallable,
    isIOS,
    isAndroid,
    isInAppBrowser,
    isInIframe,
    install,
  } = usePWAInstall();
  const [activeTab, setActiveTab] = useState<'android' | 'ios'>(isIOS ? 'ios' : 'android');
  const [installSuccess, setInstallSuccess] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);

  if (!isOpen) return null;

  const isFileProtocol = typeof window !== 'undefined' && window.location.protocol === 'file:';

  const handleInstallClick = async () => {
    sfx.playClick();
    const success = await install();
    if (success) {
      sfx.playLevelUp();
      setInstallSuccess(true);
      setTimeout(() => {
        onClose();
      }, 2000);
    }
  };

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      sfx.playClick();
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2000);
    } catch {
      // ignore clipboard errors
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#10B981] to-[#047857] flex items-center justify-center text-white shadow-xs">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 leading-tight">
                Установка на телефон
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Android & iOS (iPhone / iPad)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Warning when opened inside iframe / Telegram / WhatsApp WebView */}
        {(isInAppBrowser || isInIframe) && (
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-xs text-amber-950 space-y-2">
            <div className="flex items-center gap-1.5 font-extrabold text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>Откройте в обычном Google Chrome</span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-900">
              {isInAppBrowser
                ? 'Вы открыли приложение во встроенном браузере (Telegram, WhatsApp или др.) — внутри него Android не даёт установить приложение. Нажмите меню (⋮) в углу и выберите «Открыть в Chrome».'
                : 'Приложение сейчас открыто в окне предпросмотра. Чтобы установить его на Android, откройте ссылку напрямую в новой вкладке Google Chrome на телефоне.'}
            </p>
            {!isFileProtocol && (
              <button
                type="button"
                onClick={handleCopyUrl}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-amber-300 text-[11px] font-bold text-amber-900 hover:bg-amber-100 transition-colors"
              >
                {copiedUrl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedUrl ? 'Ссылка скопирована!' : 'Скопировать ссылку для Chrome'}</span>
              </button>
            )}
          </div>
        )}

        {/* Benefits badge */}
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 font-medium space-y-1.5">
          <div className="flex items-center gap-1.5 font-bold text-emerald-800">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Преимущества приложения:</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            • Открывается на весь экран без лишних рамок браузера<br />
            • Работает офлайн даже без интернета (в самолете или метро)<br />
            • Быстрый запуск с рабочего стола телефона в 1 клик
          </p>
        </div>

        {/* Native 1-Click Install if supported (Chrome Android / Edge / Desktop) */}
        {isInstallable && (
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md text-center space-y-2.5">
            <p className="text-xs font-bold text-emerald-100">
              Ваш браузер поддерживает автоматическую установку:
            </p>
            <button
              onClick={handleInstallClick}
              disabled={installSuccess}
              className="btn-tactile-neutral w-full py-3 rounded-xl text-slate-900 font-extrabold text-sm flex items-center justify-center gap-2 shadow-md"
            >
              {installSuccess ? (
                <>
                  <Check className="w-5 h-5 text-emerald-600" />
                  <span>Установлено! Приятного обучения!</span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5 text-emerald-600" />
                  <span>Установить на телефон в 1 клик</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Platform Tabs: Android / iOS */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1.5 rounded-2xl">
            <button
              onClick={() => {
                sfx.playClick();
                setActiveTab('android');
              }}
              className={`py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all ${
                activeTab === 'android'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Smartphone className="w-4 h-4 text-emerald-600" />
              <span>Android</span>
            </button>

            <button
              onClick={() => {
                sfx.playClick();
                setActiveTab('ios');
              }}
              className={`py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all ${
                activeTab === 'ios'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Apple className="w-4 h-4 text-slate-900" />
              <span>iPhone / iOS</span>
            </button>
          </div>

          {/* Android Guide */}
          {activeTab === 'android' && (
            <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                Как установить на Android (через Chrome):
              </h4>

              <div className="space-y-2.5 text-xs text-slate-700 font-medium">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold flex items-center justify-center text-[11px] shrink-0 mt-0.5">
                    1
                  </span>
                  <p>
                    Откройте эту страницу именно в браузере <strong>Google Chrome</strong> (не через Telegram и не во встроенном окне).
                    {isAndroid && isInAppBrowser ? ' Сейчас у вас открыт встроенный браузер.' : ''}
                  </p>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold flex items-center justify-center text-[11px] shrink-0 mt-0.5">
                    2
                  </span>
                  <p>
                    Нажмите на значок меню с тремя точками <strong className="text-slate-900">( ⋮ )</strong> в правом верхнем углу Chrome и выберите <strong>«Добавить на главный экран»</strong> или <strong>«Установить приложение»</strong>.
                  </p>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold flex items-center justify-center text-[11px] shrink-0 mt-0.5">
                    3
                  </span>
                  <p>
                    Если нужно установить как обычный <strong>.apk файл</strong> без браузера — загрузите проект на GitHub, где автоматически соберётся <strong>SpeakEasy-English.apk</strong> (вкладка <strong>Actions</strong>).
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* iOS (Apple) Guide */}
          {activeTab === 'ios' && (
            <div className="space-y-3 p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700">
                Инструкция для iPhone & iPad (Safari):
              </h4>

              <div className="space-y-2.5 text-xs text-slate-700 font-medium">
                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-800 font-extrabold flex items-center justify-center text-[11px] shrink-0 mt-0.5">
                    1
                  </span>
                  <p>
                    Откройте сайт в браузере <strong>Safari</strong> на вашем iPhone или iPad.
                  </p>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-800 font-extrabold flex items-center justify-center text-[11px] shrink-0 mt-0.5">
                    2
                  </span>
                  <p className="flex items-center gap-1.5 flex-wrap">
                    Нажмите кнопку <strong>«Поделиться»</strong>
                    <span className="inline-flex items-center gap-1 bg-white border border-slate-200 px-1.5 py-0.5 rounded-md text-[11px] font-bold">
                      <Share className="w-3.5 h-3.5 text-indigo-600 inline" /> квадрат со стрелкой
                    </span>
                    на нижней панели Safari.
                  </p>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-800 font-extrabold flex items-center justify-center text-[11px] shrink-0 mt-0.5">
                    3
                  </span>
                  <p className="flex items-center gap-1.5 flex-wrap">
                    Прокрутите меню вниз и выберите <strong>«На экран "Домой"»</strong>
                    <span className="inline-flex items-center gap-1 bg-white border border-slate-200 px-1.5 py-0.5 rounded-md text-[11px] font-bold">
                      <PlusSquare className="w-3.5 h-3.5 text-slate-700 inline" /> иконка с плюсом
                    </span>.
                  </p>
                </div>

                <div className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-800 font-extrabold flex items-center justify-center text-[11px] shrink-0 mt-0.5">
                    4
                  </span>
                  <p>
                    В правом верхнем углу нажмите <strong>«Добавить»</strong>. Приложение сразу появится на главном экране вашего iPhone!
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Direct Standalone Offline File Download */}
        {!isFileProtocol && (
          <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-extrabold text-indigo-950">
                Автономная веб-версия (файл .html)
              </span>
              <span className="text-[10px] font-bold text-indigo-700 bg-white px-2 py-0.5 rounded-full border border-indigo-200">
                ~650 КБ
              </span>
            </div>
            <p className="text-[11px] text-indigo-900/80 leading-relaxed">
              Единый файл со всеми уроками, диалогами, тестами и 500 карточками (10 уровней по 50 фраз). На Android открывайте его через <strong>Chrome</strong> (не встроенный HTML-просмотрщик); для установки как обычного приложения нужен <strong>.apk</strong> из GitHub Actions.
            </p>
            <a
              href="/download/SpeakEasy-English-Offline.html"
              download="SpeakEasy-English-Offline.html"
              onClick={() => sfx.playClick()}
              className="btn-tactile-secondary w-full py-2.5 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Скачать автономный файл (.html)</span>
            </a>
          </div>
        )}

        {/* Close / Got it button */}
        <button
          onClick={onClose}
          className="btn-tactile-neutral w-full py-3 rounded-2xl text-xs font-bold text-slate-800"
        >
          Понятно, спасибо
        </button>
      </div>
    </div>
  );
};

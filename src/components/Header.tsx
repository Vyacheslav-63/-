import React from 'react';
import { Flame, Gem, Bell, Volume2, VolumeX, Sparkles, Snail, Download } from 'lucide-react';
import { useProgress } from '../context/ProgressContext';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { sfx } from '../utils/audio';

interface HeaderProps {
  onOpenReminders: () => void;
  onOpenProfile: () => void;
  onOpenInstall: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenReminders, onOpenProfile, onOpenInstall }) => {
  const { state, toggleSlowSpeech, toggleSound } = useProgress();
  const { isInstalled } = usePWAInstall();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-4xl mx-auto px-4 py-2.5 flex items-center justify-between gap-2">
        {/* Logo and Brand */}
        <div 
          onClick={onOpenProfile}
          className="flex items-center gap-2 cursor-pointer group select-none"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#10B981] to-[#059669] flex items-center justify-center text-white font-bold text-lg shadow-sm group-hover:scale-105 transition-transform">
            SE
          </div>
          <div className="hidden sm:block">
            <div className="flex items-center gap-1">
              <span className="font-extrabold text-slate-900 text-base tracking-tight leading-tight">
                SpeakEasy
              </span>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                RU Edition
              </span>
            </div>
            <p className="text-[11px] text-slate-500 font-medium">Английский с нуля</p>
          </div>
        </div>

        {/* Center / Gamification Badges */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Streak Badge */}
          <button
            onClick={() => {
              sfx.playStreak();
              onOpenProfile();
            }}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 active:scale-95 transition-all"
            title="Ваш ударный режим (дни подряд)"
          >
            <Flame className="w-4 h-4 text-amber-500 fill-amber-500 animate-pulse" />
            <span className="text-xs sm:text-sm font-bold">{state.streak}</span>
            <span className="hidden md:inline text-xs text-amber-700">дн.</span>
          </button>

          {/* Gems Badge */}
          <button
            onClick={onOpenProfile}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-800 hover:bg-indigo-100 active:scale-95 transition-all"
            title="Кристаллы за достижения"
          >
            <Gem className="w-4 h-4 text-indigo-600 fill-indigo-200" />
            <span className="text-xs sm:text-sm font-bold">{state.gems}</span>
          </button>

          {/* Level / XP Badge */}
          <button
            onClick={onOpenProfile}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100 active:scale-95 transition-all"
            title={`Уровень ${state.level}: ${state.xp} XP`}
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-xs sm:text-sm font-bold">Ур. {state.level}</span>
          </button>
        </div>

        {/* Quick Controls */}
        <div className="flex items-center gap-1 sm:gap-1.5">
          {/* Slow Speech Toggle (Turtle icon for slow speech) */}
          <button
            onClick={() => {
              sfx.playClick();
              toggleSlowSpeech();
            }}
            className={`p-2 rounded-xl border transition-all ${
              state.slowSpeech
                ? 'bg-amber-100 border-amber-300 text-amber-800 font-bold'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
            title={state.slowSpeech ? 'Медленная речь (0.75x) включена' : 'Обычная скорость речи (1x)'}
          >
            <div className="flex items-center gap-1">
              <Snail className="w-4 h-4" />
              <span className="text-[11px] font-bold hidden sm:inline">
                {state.slowSpeech ? '0.75x' : '1x'}
              </span>
            </div>
          </button>

          {/* Sound Toggle */}
          <button
            onClick={() => {
              sfx.playClick();
              toggleSound();
            }}
            className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 active:scale-95 transition-all"
            title={state.soundEnabled ? 'Звуковые эффекты включены' : 'Звуковые эффекты выключены'}
          >
            {state.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-red-500" />}
          </button>

          {/* Reminder Bell */}
          <button
            onClick={() => {
              sfx.playClick();
              onOpenReminders();
            }}
            className="relative p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:bg-slate-100 active:scale-95 transition-all"
            title="Напоминания и таймер занятий"
          >
            <Bell className="w-4 h-4 text-slate-700" />
            {state.reminderSettings.enabled && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white"></span>
            )}
          </button>

          {/* Download App Button (suppressed if already in standalone mode) */}
          {!isInstalled && (
            <button
              onClick={() => {
                sfx.playClick();
                onOpenInstall();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-xs active:scale-95 transition-all"
              title="Скачать приложение на телефон (Android / iOS)"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Скачать</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

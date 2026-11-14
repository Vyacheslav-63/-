import React from 'react';
import { MessageSquare, Puzzle, Zap, CheckCircle2, Star, Sparkles, ChevronRight, Lock, BookOpen, Smartphone, Download, Mic } from 'lucide-react';
import { MODULES } from '../data/lessonsData';
import { useProgress } from '../context/ProgressContext';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Lesson } from '../types';
import { sfx } from '../utils/audio';

interface RoadmapViewProps {
  onStartLesson: (lesson: Lesson) => void;
  onOpenQuickDrill: () => void;
  onOpenInstall?: () => void;
  onOpenTranslator?: () => void;
}

export const RoadmapView: React.FC<RoadmapViewProps> = ({
  onStartLesson,
  onOpenQuickDrill,
  onOpenInstall,
  onOpenTranslator,
}) => {
  const { state } = useProgress();
  const { isInstalled } = usePWAInstall();

  const getLessonIcon = (type: Lesson['type']) => {
    switch (type) {
      case 'dialogue':
        return MessageSquare;
      case 'pattern':
        return Puzzle;
      case 'test':
        return Zap;
      default:
        return BookOpen;
    }
  };

  const completedCount = Object.values(state.completedLessons).filter((l) => l.completed).length;

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 pb-24 space-y-6">
      {/* Daily Motivation Banner */}
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white rounded-3xl p-5 shadow-lg relative overflow-hidden">
        <div className="relative z-10 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-200 mb-1">
              <Sparkles className="w-4 h-4 text-emerald-300" />
              <span>Главный секрет разговорного английского</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight leading-tight">
              Учите готовые шаблоны, а не сухую грамматику!
            </h2>
            <p className="text-xs text-emerald-100 mt-2 max-w-md leading-relaxed font-medium">
              Носители говорят речевыми блоками («chunks»). Запоминая целые конструкции, вы начинаете говорить без пауз и перевода в голове.
            </p>
          </div>

          <div className="hidden sm:flex flex-col items-center bg-white/10 backdrop-blur-md px-3.5 py-2.5 rounded-2xl border border-white/20 text-center shrink-0">
            <span className="text-[10px] uppercase font-bold text-emerald-200">Пройдено</span>
            <span className="text-xl font-black">{completedCount}</span>
            <span className="text-[10px] text-emerald-100">уроков</span>
          </div>
        </div>

        {/* Quick action button */}
        <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between">
          <span className="text-xs font-semibold text-emerald-100">
            Есть 3 минуты прямо сейчас?
          </span>
          <button
            onClick={() => {
              sfx.playClick();
              onOpenQuickDrill();
            }}
            className="px-4 py-2 rounded-xl bg-white text-emerald-900 font-extrabold text-xs shadow-md hover:bg-emerald-50 active:scale-95 transition-all flex items-center gap-1"
          >
            <span>Экспресс-тренировка</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Quick Voice Translator Card */}
      {onOpenTranslator && (
        <div
          onClick={() => {
            sfx.playClick();
            onOpenTranslator();
          }}
          className="bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-3xl p-4 shadow-md flex items-center justify-between gap-3 cursor-pointer hover:from-indigo-700 hover:to-indigo-800 transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white/15 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Mic className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xs sm:text-sm font-extrabold">
                Голосовой переводчик RU ⇄ EN
              </h3>
              <p className="text-[11px] text-indigo-100 font-medium mt-0.5">
                Скажите фразу вслух — получите перевод, озвучку и чтение русскими буквами
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white text-indigo-900 text-xs font-extrabold shrink-0 shadow-xs">
            <span>Сказать</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </div>
        </div>
      )}

      {/* Install Mobile App Banner (if not installed yet) */}
      {!isInstalled && onOpenInstall && (
        <div 
          onClick={() => {
            sfx.playClick();
            onOpenInstall();
          }}
          className="bg-white rounded-3xl p-4 border border-emerald-200/90 shadow-sm flex items-center justify-between gap-3 cursor-pointer hover:border-emerald-400 hover:shadow-md transition-all group"
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-extrabold text-slate-900">
                  Установить на Android / iPhone
                </h3>
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
                  PWA
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                Занимайтесь без интернета прямо с экрана телефона
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold shrink-0 shadow-2xs group-hover:bg-emerald-700">
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Скачать</span>
          </div>
        </div>
      )}

      {/* Modules Roadmap */}
      <div className="space-y-6">
        {MODULES.map((moduleItem, modIdx) => {
          // A module is unlocked if it's the first or previous module has at least one completed lesson
          const isUnlocked =
            modIdx === 0 ||
            Object.keys(state.completedLessons).length >= modIdx;

          return (
            <div
              key={moduleItem.id}
              className={`bg-white rounded-3xl p-5 border transition-all ${
                isUnlocked
                  ? 'border-slate-200 shadow-sm'
                  : 'border-slate-200/60 opacity-60 bg-slate-50'
              }`}
            >
              {/* Module Header */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-xs"
                    style={{ backgroundColor: `${moduleItem.accentColor}15` }}
                  >
                    {moduleItem.icon}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        {moduleItem.level} • Модуль {moduleItem.order}
                      </span>
                      {!isUnlocked && (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-slate-400">
                          <Lock className="w-3 h-3" /> Закрыт
                        </span>
                      )}
                    </div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 mt-0.5">
                      {moduleItem.titleRu}
                    </h3>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-500 font-medium mb-4 leading-relaxed">
                {moduleItem.descriptionRu}
              </p>

              {/* Lesson Items */}
              <div className="space-y-2.5">
                {moduleItem.lessons.map((lesson) => {
                  const lessonState = state.completedLessons[lesson.id];
                  const isDone = !!lessonState?.completed;
                  const stars = lessonState?.stars || 0;
                  const Icon = getLessonIcon(lesson.type);

                  return (
                    <div
                      key={lesson.id}
                      onClick={() => {
                        if (isUnlocked) {
                          sfx.playClick();
                          onStartLesson(lesson);
                        }
                      }}
                      className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        isUnlocked
                          ? 'cursor-pointer hover:border-emerald-300 hover:bg-emerald-50/20 active:scale-99 bg-slate-50/70 border-slate-200'
                          : 'cursor-not-allowed opacity-50 bg-slate-100 border-slate-200'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                            isDone
                              ? 'bg-emerald-500 text-white shadow-xs'
                              : 'bg-white text-slate-700 border border-slate-200'
                          }`}
                        >
                          {isDone ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : (
                            <Icon className="w-5 h-5" />
                          )}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs sm:text-sm font-extrabold text-slate-900">
                              {lesson.titleRu}
                            </h4>
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-white border border-slate-200 text-slate-500">
                              ~{lesson.durationMinutes} мин
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 font-medium">
                            {lesson.subtitleRu}
                          </p>
                        </div>
                      </div>

                      {/* Right side: Stars or Start button */}
                      <div className="flex items-center gap-2 shrink-0">
                        {isDone ? (
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3].map((s) => (
                              <Star
                                key={s}
                                className={`w-3.5 h-3.5 ${
                                  s <= stars
                                    ? 'text-amber-400 fill-amber-400'
                                    : 'text-slate-200'
                                }`}
                              />
                            ))}
                          </div>
                        ) : (
                          <div className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                            <span>+{lesson.xpReward} XP</span>
                            <ChevronRight className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { Flame, Trophy, Award, Sparkles, Gem, CheckCircle2, ChevronRight, Zap, Target } from 'lucide-react';
import { useProgress } from '../context/ProgressContext';
import { sfx } from '../utils/audio';

export const ProfileAndLeaderboard: React.FC = () => {
  const { state, claimAchievement, leaderboard, streakDaysList } = useProgress();
  const [activeTab, setActiveTab] = useState<'achievements' | 'leaderboard' | 'quests'>('achievements');

  // Level calculations
  const currentLevel = state.level;
  const currentXP = state.xp;
  const nextLevelXP = Math.pow(currentLevel, 2) * 60;
  const prevLevelXP = Math.pow(currentLevel - 1, 2) * 60;
  const levelProgress = Math.min(
    100,
    Math.max(0, ((currentXP - prevLevelXP) / (nextLevelXP - prevLevelXP)) * 100)
  );

  const getLevelTitle = (lvl: number) => {
    if (lvl <= 1) return 'Любознательный новичок (A0)';
    if (lvl <= 3) return 'Уверенный турист (A1)';
    if (lvl <= 6) return 'Мастер ситуаций (A2)';
    if (lvl <= 9) return 'Свободный собеседник (B1)';
    return 'Гуру разговорного английского (B2)';
  };

  const daysOfWeek = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 pb-24 space-y-5">
      {/* User Hero Card */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center text-3xl shadow-sm">
            🦁
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-900">Вы (Ученик)</h2>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Уровень {currentLevel}
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-500">
              {getLevelTitle(currentLevel)}
            </p>
          </div>
        </div>

        {/* Level Progress Track */}
        <div className="space-y-1.5 mb-4">
          <div className="flex justify-between text-xs font-bold text-slate-600">
            <span>Опыт: {currentXP} XP</span>
            <span>До {currentLevel + 1} уровня: {Math.max(0, nextLevelXP - currentXP)} XP</span>
          </div>
          <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${levelProgress}%` }}
            />
          </div>
        </div>

        {/* 7-day streak calendar */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
              <Flame className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>Ударный режим: {state.streak} дня подряд</span>
            </div>
            <span className="text-[10px] text-slate-400 font-bold">Текущая неделя</span>
          </div>

          <div className="grid grid-cols-7 gap-1.5 text-center">
            {daysOfWeek.map((day, idx) => {
              const active = streakDaysList[idx];
              return (
                <div key={day} className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400">{day}</span>
                  <div
                    className={`w-full aspect-square rounded-xl flex items-center justify-center text-xs font-extrabold transition-all ${
                      active
                        ? 'bg-amber-400 text-amber-950 shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-300'
                    }`}
                  >
                    {active ? '🔥' : '•'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Sub Tabs: Achievements, Leaderboard, Quests */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { id: 'achievements', labelRu: 'Достижения', icon: Award },
          { id: 'leaderboard', labelRu: 'Лига & Рейтинг', icon: Trophy },
          { id: 'quests', labelRu: 'Задания дня', icon: Target },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => {
                sfx.playClick();
                setActiveTab(tab.id as typeof activeTab);
              }}
              className={`p-2.5 rounded-2xl flex flex-col sm:flex-row items-center justify-center gap-1.5 transition-all text-xs font-bold ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.labelRu}</span>
            </button>
          );
        })}
      </div>

      {/* Tab: Achievements */}
      {activeTab === 'achievements' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Ваши ачивки ({state.achievements.filter((a) => a.unlocked).length} из {state.achievements.length})
            </h3>
            <span className="text-xs font-bold text-indigo-600">
              💎 {state.gems} кристаллов на счету
            </span>
          </div>

          <div className="space-y-2.5">
            {state.achievements.map((ach) => {
              const progressPct = Math.min(100, (ach.currentProgress / ach.maxProgress) * 100);

              return (
                <div
                  key={ach.id}
                  className={`p-4 rounded-3xl border transition-all ${
                    ach.unlocked
                      ? 'bg-white border-emerald-200 shadow-xs'
                      : 'bg-slate-50 border-slate-200 opacity-80'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-2xl shrink-0 shadow-2xs">
                      {ach.icon}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-sm font-extrabold text-slate-900">
                          {ach.titleRu}
                        </h4>
                        <span className="text-xs font-extrabold text-indigo-600 flex items-center gap-1">
                          +{ach.gemReward} 💎
                        </span>
                      </div>

                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        {ach.descriptionRu}
                      </p>

                      {/* Progress bar */}
                      <div className="mt-3 flex items-center gap-2">
                        <div className="flex-1 bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full rounded-full transition-all"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                        <span className="text-[11px] font-bold text-slate-500">
                          {ach.currentProgress}/{ach.maxProgress}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Claim Reward Button */}
                  {ach.unlocked && !ach.claimed && (
                    <div className="mt-3 pt-3 border-t border-slate-100 flex justify-end">
                      <button
                        onClick={() => claimAchievement(ach.id)}
                        className="btn-tactile-primary px-4 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>Забрать {ach.gemReward} кристаллов</span>
                      </button>
                    </div>
                  )}

                  {ach.claimed && (
                    <div className="mt-2 text-right">
                      <span className="text-[11px] font-bold text-emerald-600">
                        ✓ Награда получена
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab: Leaderboard */}
      {activeTab === 'leaderboard' && (
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <span>🥉 Бронзовая лига</span>
              </h3>
              <p className="text-xs text-slate-500">
                Топ-3 переходят в Серебряную лигу в конце недели!
              </p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 bg-amber-50 text-amber-800 rounded-full border border-amber-200">
              Осталось 3 дня
            </span>
          </div>

          <div className="space-y-2">
            {leaderboard.map((user) => {
              const isTop3 = user.rank <= 3;

              return (
                <div
                  key={user.id}
                  className={`p-3.5 rounded-2xl flex items-center justify-between gap-3 border transition-all ${
                    user.isCurrent
                      ? 'bg-emerald-50 border-emerald-300 shadow-xs'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-6 text-center font-black text-sm ${
                        user.rank === 1
                          ? 'text-amber-500 text-base'
                          : user.rank === 2
                          ? 'text-slate-400 text-base'
                          : user.rank === 3
                          ? 'text-amber-700 text-base'
                          : 'text-slate-400'
                      }`}
                    >
                      {user.rank}
                    </span>

                    <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-xl shrink-0">
                      {user.avatar}
                    </div>

                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-extrabold text-slate-900">
                          {user.name}
                        </span>
                        {user.isCurrent && (
                          <span className="text-[10px] font-bold bg-emerald-200 text-emerald-800 px-1.5 py-0.2 rounded-full">
                            ВЫ
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {user.cityRu} • {user.streak} дн. стрик
                      </span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-black text-slate-900 block">
                      {user.xp} XP
                    </span>
                    {isTop3 && (
                      <span className="text-[10px] font-bold text-emerald-600 block">
                        ↑ Повышение
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab: Daily Quests */}
      {activeTab === 'quests' && (
        <div className="space-y-3">
          <div className="px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Ежедневный план для закрепления (Обновляется в полночь)
            </h3>
          </div>

          <div className="space-y-2.5">
            {state.dailyQuests.map((quest) => {
              const progressPct = Math.min(100, (quest.current / quest.target) * 100);

              return (
                <div
                  key={quest.id}
                  className={`p-4 rounded-3xl border transition-all ${
                    quest.completed
                      ? 'bg-emerald-50/60 border-emerald-300'
                      : 'bg-white border-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{quest.icon}</span>
                      <span className="text-sm font-extrabold text-slate-900">
                        {quest.titleRu}
                      </span>
                    </div>

                    <span className="text-xs font-extrabold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      +{quest.xpReward} XP
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                    <span className="text-xs font-bold text-slate-500">
                      {quest.current}/{quest.target}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

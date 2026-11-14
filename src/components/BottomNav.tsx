import React from 'react';
import { Map, MessageSquare, Puzzle, Target, BrainCircuit, Trophy, Mic } from 'lucide-react';
import { sfx } from '../utils/audio';

export type TabType = 'roadmap' | 'dialogues' | 'patterns' | 'translator' | 'drills' | 'flashcards' | 'profile';

interface BottomNavProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  dueCardsCount?: number;
}

interface TabItem {
  id: TabType;
  labelRu: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | null;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  dueCardsCount = 0,
}) => {
  const tabs: TabItem[] = [
    { id: 'roadmap', labelRu: 'Карта', icon: Map },
    { id: 'dialogues', labelRu: 'Диалоги', icon: MessageSquare },
    { id: 'patterns', labelRu: 'Шаблоны', icon: Puzzle },
    { id: 'translator', labelRu: 'Перевод', icon: Mic },
    { id: 'drills', labelRu: 'Тесты', icon: Target },
    { id: 'flashcards', labelRu: 'Словарь', icon: BrainCircuit, badge: dueCardsCount > 0 ? dueCardsCount : null },
    { id: 'profile', labelRu: 'Лига', icon: Trophy },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg">
      <div className="max-w-lg mx-auto px-1 py-1.5 flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          const isTranslator = tab.id === 'translator';

          return (
            <button
              key={tab.id}
              onClick={() => {
                sfx.playClick();
                onChangeTab(tab.id);
              }}
              className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-xl transition-all relative select-none ${
                isActive
                  ? isTranslator
                    ? 'text-indigo-700 font-bold scale-105'
                    : 'text-emerald-700 font-bold scale-105'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div
                className={`p-1 rounded-xl transition-all ${
                  isActive
                    ? isTranslator
                      ? 'bg-indigo-100 text-indigo-600'
                      : 'bg-emerald-50 text-emerald-600'
                    : isTranslator
                      ? 'bg-indigo-50/70 text-indigo-500'
                      : 'text-slate-400'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] sm:text-[11px] leading-tight mt-0.5">{tab.labelRu}</span>

              {tab.badge && (
                <span className="absolute top-0 right-1 w-4 h-4 bg-amber-500 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center shadow-xs">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

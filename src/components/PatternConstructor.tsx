import React, { useState } from 'react';
import { Volume2, Sparkles, BookmarkPlus, Check, Lightbulb, Play, ArrowRight, Snail } from 'lucide-react';
import { SPEECH_PATTERNS } from '../data/lessonsData';
import { SpeechPattern, PatternSlotOption } from '../types';
import { speakEnglish, sfx } from '../utils/audio';
import { useProgress } from '../context/ProgressContext';

interface PatternConstructorProps {
  initialPatternId?: string;
  onFinish?: () => void;
}

export const PatternConstructor: React.FC<PatternConstructorProps> = ({
  initialPatternId = 'cafe-pattern',
  onFinish,
}) => {
  const { state, addXP, incrementAchievement, incrementDailyQuest, reviewFlashcard } = useProgress();

  const patternsList = Object.values(SPEECH_PATTERNS);
  const [activePatternId, setActivePatternId] = useState<string>(initialPatternId);

  const pattern: SpeechPattern = SPEECH_PATTERNS[activePatternId] || patternsList[0];

  // Selected slot options: map slot name to selected option
  const [selectedSlots, setSelectedSlots] = useState<Record<string, PatternSlotOption>>(() => {
    const initial: Record<string, PatternSlotOption> = {};
    pattern.slots.forEach((slot) => {
      if (slot.options.length > 0) {
        initial[slot.name] = slot.options[0];
      }
    });
    return initial;
  });

  const [savedToVocab, setSavedToVocab] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [assembledCount, setAssembledCount] = useState(0);

  // When changing active pattern, reset slot choices
  const handleSelectPattern = (id: string) => {
    sfx.playClick();
    setActivePatternId(id);
    const newPattern = SPEECH_PATTERNS[id];
    if (newPattern) {
      const initial: Record<string, PatternSlotOption> = {};
      newPattern.slots.forEach((slot) => {
        if (slot.options.length > 0) {
          initial[slot.name] = slot.options[0];
        }
      });
      setSelectedSlots(initial);
      setSavedToVocab(false);
    }
  };

  const handleSelectSlotOption = (slotName: string, option: PatternSlotOption) => {
    sfx.playClick();
    setSelectedSlots((prev) => ({
      ...prev,
      [slotName]: option,
    }));
    setSavedToVocab(false);
    setAssembledCount((c) => c + 1);

    // Gamification progress
    incrementAchievement('pattern-builder', 1);
    incrementDailyQuest('quest-pattern', 1);
    addXP(10);
  };

  // Build current assembled phrase
  const buildCurrentSentence = () => {
    let en = pattern.formula;
    let ru = pattern.formulaRu;

    pattern.slots.forEach((slot) => {
      const chosen = selectedSlots[slot.name];
      if (chosen) {
        en = en.replace(`[${slot.name}]`, chosen.en).replace('[что-то]', chosen.en);
        ru = ru.replace(`[${slot.name}]`, chosen.ru).replace('[что-то]', chosen.ru);
      }
    });

    return { en, ru };
  };

  const currentSentence = buildCurrentSentence();

  const handleSpeak = (slow = false) => {
    sfx.playClick();
    setIsPlaying(true);
    speakEnglish(
      currentSentence.en,
      slow ? 0.72 : 1.0,
      undefined,
      () => setIsPlaying(false)
    );
  };

  const handleSaveToVocab = () => {
    sfx.playCorrect();
    reviewFlashcard(currentSentence.en, 'again');
    setSavedToVocab(true);
    setTimeout(() => setSavedToVocab(false), 2500);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 pb-24">
      {/* Pattern Selector Pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none mb-4">
        {patternsList.map((p) => {
          const isSelected = p.id === activePatternId;
          return (
            <button
              key={p.id}
              onClick={() => handleSelectPattern(p.id)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                isSelected
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {p.categoryRu}
            </button>
          );
        })}
      </div>

      {/* Main Pattern Card */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded-full">
            🧩 Конструктор шаблонов
          </span>
          <span className="text-xs font-bold text-slate-400">
            Собрано вариантов: {assembledCount}
          </span>
        </div>

        <h2 className="text-xl font-black text-slate-900 tracking-tight">
          {pattern.formula}
        </h2>
        <p className="text-sm font-bold text-slate-600 mt-1">
          {pattern.formulaRu}
        </p>

        <p className="text-xs text-slate-600 mt-2.5 leading-relaxed bg-slate-50 p-3 rounded-2xl border border-slate-100">
          {pattern.explanationRu}
        </p>

        {/* Literal vs Real Russian Meaning */}
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200/50">
            <span className="font-bold text-amber-900 block mb-0.5">Дословно:</span>
            <span className="text-amber-800">{pattern.literalMeaningRu}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/50">
            <span className="font-bold text-emerald-900 block mb-0.5">В живой речи:</span>
            <span className="text-emerald-800 font-semibold">{pattern.formulaRu}</span>
          </div>
        </div>
      </div>

      {/* Interactive Slot Pickers */}
      <div className="space-y-4 mb-5">
        {pattern.slots.map((slot) => {
          const currentChosen = selectedSlots[slot.name];

          return (
            <div key={slot.name} className="bg-white rounded-3xl p-4 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-2.5">
                <span className="text-xs font-bold text-slate-600">
                  Подставьте: <span className="text-indigo-600 font-extrabold">{slot.nameRu}</span>
                </span>
                <span className="text-[11px] text-slate-400 font-medium">Нажмите на вариант</span>
              </div>

              <div className="flex flex-wrap gap-2">
                {slot.options.map((opt) => {
                  const isSelected = currentChosen?.en === opt.en;

                  return (
                    <button
                      key={opt.en}
                      onClick={() => handleSelectSlotOption(slot.name, opt)}
                      className={`px-3 py-2 rounded-2xl text-xs font-bold transition-all text-left ${
                        isSelected
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-100 scale-102 border-b-2 border-indigo-900'
                          : 'bg-slate-50 text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      <p className="font-extrabold">{opt.en}</p>
                      <p className={`text-[11px] ${isSelected ? 'text-indigo-100' : 'text-slate-500'}`}>
                        {opt.ru}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Assembled Sentence Output Box */}
      <div className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-3xl p-5 shadow-lg relative overflow-hidden mb-5">
        <div className="flex items-center justify-between text-emerald-100 text-xs font-bold mb-2">
          <span>Готовая фраза для использования:</span>
          <span className="bg-emerald-400/30 px-2 py-0.5 rounded-full text-[10px]">
            Живой английский
          </span>
        </div>

        <p className="text-xl sm:text-2xl font-black tracking-tight leading-tight mb-1">
          {currentSentence.en}
        </p>

        <p className="text-sm font-semibold text-emerald-100 mb-4">
          🇷🇺 {currentSentence.ru}
        </p>

        {/* Action buttons on live sentence */}
        <div className="flex items-center gap-2 pt-2 border-t border-emerald-400/40">
          <button
            onClick={() => handleSpeak(false)}
            className="flex-1 py-2.5 px-3 rounded-xl bg-white text-emerald-900 font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm hover:bg-emerald-50 active:scale-95 transition-all"
          >
            <Volume2 className="w-4 h-4 text-emerald-600" />
            <span>Послушать (1x)</span>
          </button>

          <button
            onClick={() => handleSpeak(true)}
            className="py-2.5 px-3 rounded-xl bg-emerald-700/60 text-white font-bold text-xs flex items-center justify-center gap-1 hover:bg-emerald-700 active:scale-95 transition-all"
            title="Медленная речь"
          >
            <Snail className="w-3.5 h-3.5" />
            <span>0.75x</span>
          </button>

          <button
            onClick={handleSaveToVocab}
            disabled={savedToVocab}
            className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all ${
              savedToVocab
                ? 'bg-white text-emerald-800'
                : 'bg-emerald-700/60 text-white hover:bg-emerald-700'
            }`}
          >
            {savedToVocab ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Сохранено!</span>
              </>
            ) : (
              <>
                <BookmarkPlus className="w-4 h-4" />
                <span className="hidden sm:inline">В словарь</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Cultural Lifehack Tip */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm mb-5">
        <div className="flex items-center gap-2 text-amber-700 font-bold text-xs mb-2">
          <Lightbulb className="w-4 h-4 text-amber-500 fill-amber-500" />
          <span>Лайфхак носителя & Частая ошибка русскоязычных:</span>
        </div>
        <p className="text-xs text-slate-700 font-medium leading-relaxed">
          {pattern.culturalTipRu}
        </p>
      </div>

      {/* Ready Examples List */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm">
        <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
          Готовые примеры из реальной жизни:
        </h3>

        <div className="space-y-3">
          {pattern.examples.map((ex, idx) => (
            <div
              key={idx}
              className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start justify-between gap-3 hover:bg-slate-100/80 transition-colors"
            >
              <div>
                <p className="text-sm font-extrabold text-slate-900">{ex.en}</p>
                <p className="text-xs font-bold text-indigo-600 mt-0.5">{ex.phonetic}</p>
                <p className="text-xs text-slate-500 font-medium mt-1">{ex.ru}</p>
              </div>

              <button
                onClick={() => {
                  sfx.playClick();
                  speakEnglish(ex.en, state.slowSpeech ? 0.75 : 1.0);
                }}
                className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 shrink-0 shadow-2xs"
                title="Послушать"
              >
                <Volume2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

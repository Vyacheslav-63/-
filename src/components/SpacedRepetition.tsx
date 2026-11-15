import React, { useEffect, useMemo, useState } from 'react';
import {
  Volume2,
  RotateCw,
  Plus,
  Brain,
  Snail,
  ChevronLeft,
  ChevronRight,
  Lock,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
  Trophy,
  Sparkles,
  Star,
} from 'lucide-react';
import { useProgress } from '../context/ProgressContext';
import { DICTIONARY_LEVELS } from '../data/lessonsData';
import { speakEnglish, sfx } from '../utils/audio';
import { FlashcardItem } from '../types';

export const SpacedRepetition: React.FC = () => {
  const {
    state,
    reviewFlashcard,
    addCustomFlashcard,
    selectDictLevel,
    unlockNextDictLevel,
    resetDictLevelProgress,
  } = useProgress();

  const [viewMode, setViewMode] = useState<'levels' | 'custom'>('levels');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [completedPromptLevel, setCompletedPromptLevel] = useState<number | null>(null);

  // New phrase inputs
  const [newEn, setNewEn] = useState('');
  const [newRu, setNewRu] = useState('');
  const [newPhonetic, setNewPhonetic] = useState('');

  const customCards = useMemo(
    () => state.flashcards.filter((c) => !c.dictLevel),
    [state.flashcards]
  );

  const activeLevel = state.activeDictLevel || 1;
  const unlockedLevel = state.unlockedDictLevel || 1;
  const masteredSet = useMemo(
    () => new Set(state.masteredDictCardIds || []),
    [state.masteredDictCardIds]
  );

  const currentLevelMeta =
    DICTIONARY_LEVELS.find((l) => l.level === activeLevel) || DICTIONARY_LEVELS[0];
  const nextLevelMeta =
    activeLevel < 10 ? DICTIONARY_LEVELS.find((l) => l.level === activeLevel + 1) : undefined;

  const cards = useMemo(() => {
    if (viewMode === 'custom') return customCards;
    return state.flashcards.filter((c) => c.dictLevel === activeLevel);
  }, [viewMode, customCards, state.flashcards, activeLevel]);

  // Keep currentIndex inside bounds when switching levels or adding custom phrases
  useEffect(() => {
    if (currentIndex >= cards.length) {
      setCurrentIndex(0);
    }
  }, [cards.length, currentIndex]);

  const masteredInActiveLevel = useMemo(
    () =>
      viewMode === 'levels'
        ? cards.filter((c) => masteredSet.has(c.id)).length
        : 0,
    [viewMode, cards, masteredSet]
  );

  const isActiveLevelPassed =
    viewMode === 'levels' && cards.length > 0 && masteredInActiveLevel === cards.length;

  const currentCard: FlashcardItem | undefined = cards[currentIndex] || cards[0];

  const handleSelectLevel = (level: number) => {
    if (level > unlockedLevel) {
      sfx.playError();
      return;
    }
    sfx.playClick();
    setViewMode('levels');
    selectDictLevel(level);
    setCurrentIndex(0);
    setIsFlipped(false);
    setCompletedPromptLevel(null);
  };

  const handleSelectCustom = () => {
    sfx.playClick();
    setViewMode('custom');
    setCurrentIndex(0);
    setIsFlipped(false);
    setCompletedPromptLevel(null);
  };

  const handleFlip = () => {
    sfx.playClick();
    setIsFlipped(!isFlipped);
  };

  const handleRating = (rating: 'again' | 'hard' | 'good' | 'easy') => {
    if (!currentCard) return;

    if (rating === 'again') {
      sfx.playError();
    } else {
      sfx.playCorrect();
    }

    // Compute updated mastered status synchronously to detect immediate level completion
    const willBeMasteredSet = new Set(masteredSet);
    if (rating === 'again') {
      willBeMasteredSet.delete(currentCard.id);
    } else {
      willBeMasteredSet.add(currentCard.id);
    }

    reviewFlashcard(currentCard.id, rating);
    setIsFlipped(false);

    if (viewMode === 'levels') {
      const remainingIndices = cards
        .map((c, idx) => (!willBeMasteredSet.has(c.id) ? idx : -1))
        .filter((idx) => idx !== -1);

      if (remainingIndices.length === 0) {
        // Every card in this themed level is now passed -> offer next level!
        sfx.playLevelUp();
        setCompletedPromptLevel(activeLevel);
        return;
      }

      // Move to the next unmastered card in this level (wrapping around if needed)
      const nextUnmastered =
        remainingIndices.find((idx) => idx > currentIndex) ?? remainingIndices[0];
      setCurrentIndex(nextUnmastered);
      return;
    }

    if (currentIndex + 1 < cards.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setCurrentIndex(0);
    }
  };

  const handleNextCard = () => {
    if (!cards.length) return;
    sfx.playClick();
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev + 1 < cards.length ? prev + 1 : 0));
  };

  const handlePrevCard = () => {
    if (!cards.length) return;
    sfx.playClick();
    setIsFlipped(false);
    setCurrentIndex((prev) => (prev - 1 >= 0 ? prev - 1 : cards.length - 1));
  };

  const handleEnableNextLevel = () => {
    if (activeLevel >= 10) return;
    const nextLevel = activeLevel + 1;
    setCompletedPromptLevel(null);
    setIsFlipped(false);
    setCurrentIndex(0);
    unlockNextDictLevel(nextLevel);
  };

  const handleRepeatLevel = () => {
    sfx.playClick();
    resetDictLevelProgress(activeLevel);
    setCompletedPromptLevel(null);
    setIsFlipped(false);
    setCurrentIndex(0);
  };

  const handleSpeak = (text: string, slow = false) => {
    sfx.playClick();
    speakEnglish(text, slow ? 0.72 : 1.0);
  };

  const handleAddNewPhrase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEn.trim() || !newRu.trim()) return;

    sfx.playCorrect();
    const formattedPhonetic = newPhonetic.trim()
      ? newPhonetic.trim().startsWith('[')
        ? newPhonetic.trim()
        : `[${newPhonetic.trim()}]`
      : '';
    addCustomFlashcard(
      newEn.trim(),
      newRu.trim(),
      formattedPhonetic,
      'Добавлено вами для повторения'
    );

    setViewMode('custom');
    setCurrentIndex(0);
    setIsFlipped(false);
    setNewEn('');
    setNewRu('');
    setNewPhonetic('');
    setShowAddModal(false);
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-4 pb-24">
      {/* Header bar */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Brain className="w-6 h-6 text-indigo-600" />
            <span>Словарь по темам</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            10 тематических уровней • Проходите шаг за шагом
          </p>
        </div>

        <button
          onClick={() => {
            sfx.playClick();
            setShowAddModal(true);
          }}
          className="btn-tactile-neutral px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 text-slate-700"
        >
          <Plus className="w-4 h-4 text-emerald-600" />
          <span>Своя фраза</span>
        </button>
      </div>

      {/* 10 Themed Levels Selector */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500">
            Уровни словаря (открыто {unlockedLevel} из 10)
          </span>
          <span className="text-[11px] font-bold text-emerald-700">
            Всего фраз: {state.flashcards.length}
          </span>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
          {DICTIONARY_LEVELS.map((lvl) => {
            const isUnlocked = lvl.level <= unlockedLevel;
            const isSelected = viewMode === 'levels' && activeLevel === lvl.level;
            const lvlCards = state.flashcards.filter((c) => c.dictLevel === lvl.level);
            const lvlMastered = lvlCards.filter((c) => masteredSet.has(c.id)).length;
            const isDone = lvlCards.length > 0 && lvlMastered === lvlCards.length;

            return (
              <button
                key={lvl.level}
                type="button"
                onClick={() => handleSelectLevel(lvl.level)}
                title={
                  isUnlocked
                    ? `Уровень ${lvl.level}: ${lvl.titleRu}`
                    : `Пройдите Уровень ${lvl.level - 1}, чтобы открыть`
                }
                className={`shrink-0 w-32 p-2.5 rounded-2xl border-2 text-left transition-all ${
                  isSelected
                    ? 'bg-emerald-50 border-emerald-500 shadow-sm'
                    : isUnlocked
                      ? 'bg-white border-slate-200 hover:border-slate-300'
                      : 'bg-slate-100/80 border-slate-200/70 opacity-70 cursor-not-allowed'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-base leading-none">{lvl.icon}</span>
                  {!isUnlocked ? (
                    <Lock className="w-3.5 h-3.5 text-slate-400" />
                  ) : isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <span className="text-[10px] font-extrabold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded-md">
                      {lvlMastered}/{lvlCards.length}
                    </span>
                  )}
                </div>
                <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                  Уровень {lvl.level}
                </div>
                <div className="text-xs font-extrabold text-slate-900 truncate">
                  {lvl.titleRu}
                </div>
              </button>
            );
          })}

          {customCards.length > 0 && (
            <button
              type="button"
              onClick={handleSelectCustom}
              className={`shrink-0 w-32 p-2.5 rounded-2xl border-2 text-left transition-all ${
                viewMode === 'custom'
                  ? 'bg-indigo-50 border-indigo-500 shadow-sm'
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <Star className="w-4 h-4 text-amber-500 fill-amber-400" />
                <span className="text-[10px] font-extrabold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded-md">
                  {customCards.length}
                </span>
              </div>
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Личное
              </div>
              <div className="text-xs font-extrabold text-slate-900 truncate">
                Мои фразы
              </div>
            </button>
          )}
        </div>
      </div>

      {/* Active Level Topic Banner */}
      {viewMode === 'levels' ? (
        <div className="mb-4 p-3.5 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-xl shrink-0">
                {currentLevelMeta.icon}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    Уровень {activeLevel} из 10
                  </span>
                  {isActiveLevelPassed && (
                    <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                      Пройден ✓
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-black text-slate-900 truncate mt-0.5">
                  {currentLevelMeta.titleRu}
                </h3>
                <p className="text-[11px] text-slate-500 truncate">
                  {currentLevelMeta.subtitleRu}
                </p>
              </div>
            </div>

            <div className="text-right shrink-0">
              <span className="text-xs font-black text-slate-900 block">
                {masteredInActiveLevel} / {cards.length}
              </span>
              <span className="text-[10px] font-bold text-slate-400">
                изучено
              </span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300"
              style={{
                width: `${cards.length ? Math.round((masteredInActiveLevel / cards.length) * 100) : 0}%`,
              }}
            />
          </div>

          {/* Inline offer to switch/enable next level if already passed */}
          {isActiveLevelPassed && activeLevel < 10 && completedPromptLevel !== activeLevel && (
            <div className="pt-1 flex items-center justify-between gap-2 border-t border-slate-100">
              <span className="text-[11px] font-bold text-emerald-800">
                {unlockedLevel <= activeLevel
                  ? `Уровень ${activeLevel} пройден! Включить Уровень ${activeLevel + 1}?`
                  : `Доступен следующий Уровень ${activeLevel + 1}: ${nextLevelMeta?.titleRu}`}
              </span>
              <button
                type="button"
                onClick={handleEnableNextLevel}
                className="btn-tactile-primary px-3 py-1.5 rounded-xl text-[11px] font-extrabold flex items-center gap-1 shrink-0"
              >
                <span>
                  {unlockedLevel <= activeLevel
                    ? `Включить Ур. ${activeLevel + 1}`
                    : `К Уровню ${activeLevel + 1}`}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="mb-4 p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700">
              Личный раздел
            </span>
            <h3 className="text-sm font-black text-indigo-950">
              ⭐ Мои добавленные фразы ({customCards.length})
            </h3>
          </div>
          <button
            type="button"
            onClick={() => handleSelectLevel(activeLevel)}
            className="btn-tactile-neutral px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700"
          >
            К уровням
          </button>
        </div>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        <div className="p-3 bg-white rounded-2xl border border-slate-200 text-center shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">В теме</span>
          <span className="text-lg font-black text-slate-900">{cards.length} фраз</span>
        </div>
        <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-center shadow-xs">
          <span className="text-[10px] font-bold text-emerald-800 uppercase block">Карточка</span>
          <span className="text-lg font-black text-emerald-950">
            {cards.length ? `${currentIndex + 1} из ${cards.length}` : '0'}
          </span>
        </div>
        <div className="p-3 bg-indigo-50 rounded-2xl border border-indigo-200 text-center shadow-xs">
          <span className="text-[10px] font-bold text-indigo-800 uppercase block">Память</span>
          <span className="text-lg font-black text-indigo-950">
            {currentCard ? `Бокс ${currentCard.box}` : '1'}
          </span>
        </div>
      </div>

      {/* The Flashcard */}
      {currentCard && (
        <div className="perspective-1000 mb-6">
          <div
            onClick={handleFlip}
            className={`min-h-[280px] bg-white rounded-3xl p-6 border-2 border-slate-200 shadow-lg cursor-pointer flex flex-col justify-between transition-all duration-300 relative select-none hover:border-slate-300 ${
              isFlipped ? 'bg-indigo-50/40 border-indigo-200' : ''
            }`}
          >
            {/* Top row */}
            <div className="flex items-center justify-between text-xs text-slate-400 gap-2">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="font-bold uppercase tracking-wider text-[10px] bg-slate-100 px-2 py-0.5 rounded-full text-slate-600">
                  {isFlipped ? '🇷🇺 Перевод' : '🇬🇧 Английский'}
                </span>
                {viewMode === 'levels' && masteredSet.has(currentCard.id) && (
                  <span className="font-bold text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                    ✓ Выучено
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => handleSpeak(currentCard.phraseEn, false)}
                  className="p-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200"
                  title="Озвучить"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleSpeak(currentCard.phraseEn, true)}
                  className="px-2 py-1 text-[10px] font-bold rounded-lg bg-amber-50 text-amber-800 border border-amber-200"
                  title="Медленная речь"
                >
                  <Snail className="w-3 h-3 inline mr-0.5" />
                  0.75x
                </button>
              </div>
            </div>

            {/* Center Content */}
            <div className="text-center py-6">
              {!isFlipped ? (
                <div>
                  <h3 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-tight">
                    {currentCard.phraseEn}
                  </h3>
                  {currentCard.phoneticRu && (
                    <p className="text-sm font-semibold text-indigo-600 mt-2">
                      {currentCard.phoneticRu}
                    </p>
                  )}
                  <p className="text-xs text-slate-400 font-medium mt-6">
                    Нажмите на карточку, чтобы перевернуть 🔄
                  </p>
                </div>
              ) : (
                <div className="animate-in fade-in duration-200">
                  <h3 className="text-xl sm:text-2xl font-black text-indigo-950 tracking-tight leading-tight">
                    {currentCard.phraseRu}
                  </h3>
                  {currentCard.contextRu && (
                    <p className="text-xs text-slate-600 font-medium mt-3 bg-white p-3 rounded-2xl border border-indigo-100 max-w-sm mx-auto">
                      💡 {currentCard.contextRu}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Bottom clue */}
            <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-slate-400">
              <RotateCw className="w-3.5 h-3.5" />
              <span>{isFlipped ? 'Нажмите для возврата' : 'Нажмите для перевода'}</span>
            </div>
          </div>

          {/* Card Navigation Controls */}
          <div className="flex items-center gap-2.5 mt-3">
            <button
              type="button"
              onClick={handlePrevCard}
              disabled={cards.length <= 1}
              className="btn-tactile-neutral px-3.5 py-3 rounded-2xl text-xs font-bold text-slate-700 flex items-center justify-center gap-1 shrink-0 disabled:opacity-40"
              title="Предыдущая карточка"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Назад</span>
            </button>

            <button
              type="button"
              onClick={handleNextCard}
              disabled={cards.length <= 1}
              className="btn-tactile-secondary flex-1 py-3 px-4 rounded-2xl text-xs sm:text-sm font-extrabold flex items-center justify-center gap-1.5 disabled:opacity-40"
            >
              <span>Следующая карточка</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Review Response Buttons */}
      {isFlipped && (
        <div className="space-y-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <p className="text-xs font-bold text-center text-slate-500 uppercase tracking-wider">
            Насколько хорошо вы помнили эту фразу?
          </p>

          <div className="grid grid-cols-4 gap-2">
            <button
              onClick={() => handleRating('again')}
              className="btn-tactile-danger py-2.5 px-2 rounded-2xl text-center text-xs font-bold"
            >
              <span className="block text-sm">🔴</span>
              <span>Забыл</span>
            </button>

            <button
              onClick={() => handleRating('hard')}
              className="btn-tactile-amber py-2.5 px-2 rounded-2xl text-center text-xs font-bold"
            >
              <span className="block text-sm">🟡</span>
              <span>С трудом</span>
            </button>

            <button
              onClick={() => handleRating('good')}
              className="btn-tactile-primary py-2.5 px-2 rounded-2xl text-center text-xs font-bold"
            >
              <span className="block text-sm">🟢</span>
              <span>Помню</span>
            </button>

            <button
              onClick={() => handleRating('easy')}
              className="btn-tactile-secondary py-2.5 px-2 rounded-2xl text-center text-xs font-bold"
            >
              <span className="block text-sm">💎</span>
              <span>Легко</span>
            </button>
          </div>
        </div>
      )}

      {/* Level Completed -> Offer to Enable Next Level (1 -> 2 -> ... -> 10) */}
      {completedPromptLevel !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in"
          onClick={() => setCompletedPromptLevel(null)}
        >
          <div
            className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 text-center space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center mx-auto shadow-md text-3xl">
              {completedPromptLevel === 10 ? <Trophy className="w-8 h-8" /> : currentLevelMeta.icon}
            </div>

            <div>
              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-extrabold uppercase tracking-wider mb-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  {completedPromptLevel === 10
                    ? 'Все 10 уровней пройдены!'
                    : `Уровень ${completedPromptLevel} пройден!`}
                </span>
              </div>

              <h3 className="text-xl font-black text-slate-900">
                {completedPromptLevel === 10
                  ? 'Вы освоили весь словарь!'
                  : `Тема «${currentLevelMeta.titleRu}» закреплена`}
              </h3>

              {completedPromptLevel < 10 && nextLevelMeta ? (
                <div className="mt-3 p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200 text-left">
                  <div className="text-[11px] font-extrabold uppercase tracking-wider text-indigo-700 mb-1">
                    {unlockedLevel <= completedPromptLevel
                      ? 'Включить следующий уровень?'
                      : 'Следующий уровень:'}
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="text-2xl">{nextLevelMeta.icon}</span>
                    <div>
                      <div className="text-sm font-black text-indigo-950">
                        Уровень {nextLevelMeta.level}: {nextLevelMeta.titleRu}
                      </div>
                      <div className="text-xs text-indigo-800/80">
                        {nextLevelMeta.subtitleRu}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-slate-600 mt-2">
                  Все 50 базовых разговорных фраз по 10 темам изучены. Вы можете повторять любой уровень или добавлять свои фразы!
                </p>
              )}
            </div>

            <div className="space-y-2 pt-1">
              {completedPromptLevel < 10 && nextLevelMeta && (
                <button
                  type="button"
                  onClick={handleEnableNextLevel}
                  className="btn-tactile-primary w-full py-3.5 px-4 rounded-2xl text-sm font-extrabold flex items-center justify-center gap-2"
                >
                  <span>
                    {unlockedLevel <= completedPromptLevel
                      ? `Включить Уровень ${nextLevelMeta.level}`
                      : `Перейти на Уровень ${nextLevelMeta.level}`}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleRepeatLevel}
                  className="btn-tactile-neutral flex-1 py-2.5 px-3 rounded-2xl text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Повторить уровень</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCompletedPromptLevel(null)}
                  className="btn-tactile-neutral flex-1 py-2.5 px-3 rounded-2xl text-xs font-bold text-slate-700"
                >
                  Остаться здесь
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Phrase Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-black text-slate-900 mb-1">
              Добавить фразу в свой словарь
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Новая фраза попадет в ваш личный раздел «Мои фразы»
            </p>

            <form onSubmit={handleAddNewPhrase} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Фраза на английском:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Could you help me with this?"
                  value={newEn}
                  onChange={(e) => setNewEn(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Перевод на русский:
                </label>
                <input
                  type="text"
                  placeholder="Не могли бы вы помочь мне с этим?"
                  value={newRu}
                  onChange={(e) => setNewRu(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Произношение русскими буквами (необязательно):
                </label>
                <input
                  type="text"
                  placeholder="Куд ю хэлп ми уиз зис?"
                  value={newPhonetic}
                  onChange={(e) => setNewPhonetic(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-300 text-sm font-semibold focus:outline-indigo-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-tactile-neutral flex-1 py-2.5 rounded-xl text-xs font-bold"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="btn-tactile-primary flex-1 py-2.5 rounded-xl text-xs font-bold"
                >
                  Добавить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

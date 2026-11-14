import React, { useState } from 'react';
import {
  Volume2,
  RotateCw,
  Plus,
  Brain,
  Snail,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useProgress } from '../context/ProgressContext';
import { speakEnglish, sfx } from '../utils/audio';
import { FlashcardItem } from '../types';

export const SpacedRepetition: React.FC = () => {
  const { state, reviewFlashcard, addCustomFlashcard } = useProgress();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  // New phrase inputs
  const [newEn, setNewEn] = useState('');
  const [newRu, setNewRu] = useState('');
  const [newPhonetic, setNewPhonetic] = useState('');

  // Filter cards due today or all cards
  const cards = state.flashcards;
  const currentCard: FlashcardItem | undefined = cards[currentIndex];

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

    reviewFlashcard(currentCard.id, rating);
    setIsFlipped(false);

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
            <span>Интервальное повторение</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Система Лейтнера: надежное закрепление в долговременной памяти
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

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        <div className="p-3 bg-white rounded-2xl border border-slate-200 text-center shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase block">Всего фраз</span>
          <span className="text-lg font-black text-slate-900">{cards.length}</span>
        </div>
        <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 text-center shadow-xs">
          <span className="text-[10px] font-bold text-emerald-800 uppercase block">Карточка</span>
          <span className="text-lg font-black text-emerald-950">
            {currentIndex + 1} из {cards.length}
          </span>
        </div>
        <div className="p-3 bg-indigo-50 rounded-2xl border border-indigo-200 text-center shadow-xs">
          <span className="text-[10px] font-bold text-indigo-800 uppercase block">Уровень памяти</span>
          <span className="text-lg font-black text-indigo-950">
            {currentCard ? `Уровень ${currentCard.box}` : '1'}
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
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-bold uppercase tracking-wider text-[10px] bg-slate-100 px-2 py-0.5 rounded-full text-slate-600">
                {isFlipped ? '🇷🇺 Перевод' : '🇬🇧 Английский'}
              </span>

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

      {/* Add Custom Phrase Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-200">
            <h3 className="text-lg font-black text-slate-900 mb-1">
              Добавить фразу в свой словарь
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Новая фраза сразу попадет в систему интервального повторения
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

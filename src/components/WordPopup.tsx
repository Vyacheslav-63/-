import React, { useState } from 'react';
import { Volume2, X, BookmarkPlus, Check, Sparkles } from 'lucide-react';
import { ChunkAnnotation } from '../types';
import { speakEnglish, sfx } from '../utils/audio';
import { useProgress } from '../context/ProgressContext';

interface WordPopupProps {
  chunk: ChunkAnnotation | null;
  onClose: () => void;
}

export const WordPopup: React.FC<WordPopupProps> = ({ chunk, onClose }) => {
  const { state, reviewFlashcard } = useProgress();
  const [added, setAdded] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  if (!chunk) return null;

  const handleSpeak = (slow = false) => {
    sfx.playClick();
    setIsPlaying(true);
    speakEnglish(
      chunk.en,
      slow ? 0.7 : 1.0,
      undefined,
      () => setIsPlaying(false)
    );
  };

  const handleAddToFlashcards = () => {
    sfx.playClick();
    reviewFlashcard(chunk.en, 'again');
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl border border-slate-100 transform transition-all animate-in slide-in-from-bottom-4 sm:slide-in-from-bottom-0 sm:zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
          <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Разбор фразы</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* English phrase & Pronunciation */}
        <div className="mb-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
              {chunk.en}
            </h3>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleSpeak(false)}
                className={`p-2.5 rounded-full transition-all ${
                  isPlaying
                    ? 'bg-emerald-500 text-white animate-pulse'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                }`}
                title="Озвучить"
              >
                <Volume2 className="w-5 h-5" />
              </button>
              <button
                onClick={() => handleSpeak(true)}
                className="px-2 py-1 text-[11px] font-bold rounded-lg bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100"
                title="Озвучить медленно"
              >
                0.75x
              </button>
            </div>
          </div>

          {chunk.phoneticRu && (
            <p className="text-sm font-semibold text-indigo-600 mt-1">
              {chunk.phoneticRu}
            </p>
          )}
        </div>

        {/* Russian translation */}
        <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 mb-4">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
            Перевод на русский:
          </span>
          <p className="text-base font-bold text-slate-900">
            {chunk.ru}
          </p>
          {chunk.noteRu && (
            <p className="text-xs text-slate-600 mt-1.5 font-medium leading-relaxed border-t border-slate-200 pt-1.5">
              💡 {chunk.noteRu}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleAddToFlashcards}
            disabled={added}
            className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
              added
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'btn-tactile-neutral'
            }`}
          >
            {added ? (
              <>
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Добавлено в словарь!</span>
              </>
            ) : (
              <>
                <BookmarkPlus className="w-4 h-4 text-slate-600" />
                <span>В словарь на повторение</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

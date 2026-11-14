import React, { useState, useEffect } from 'react';
import { Volume2, Sparkles, AlertCircle, ArrowRight, RotateCcw, Award, CheckCircle2, Snail } from 'lucide-react';
import { DIALOGUES } from '../data/lessonsData';
import { DialogueOption, ChunkAnnotation } from '../types';
import { speakEnglish, sfx } from '../utils/audio';
import { useProgress } from '../context/ProgressContext';
import { WordPopup } from './WordPopup';

interface DialogueSimulatorProps {
  scenarioId?: string;
  onFinish?: () => void;
  onSelectAnother?: (id: string) => void;
}

export const DialogueSimulator: React.FC<DialogueSimulatorProps> = ({
  scenarioId = 'cafe-dialogue',
  onFinish,
  onSelectAnother,
}) => {
  const { state, completeLesson } = useProgress();
  const scenario = DIALOGUES[scenarioId] || DIALOGUES['cafe-dialogue'];

  const [currentExchangeIdx, setCurrentExchangeIdx] = useState(0);
  const [selectedOption, setSelectedOption] = useState<DialogueOption | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [selectedChunk, setSelectedChunk] = useState<ChunkAnnotation | null>(null);
  const [revealedTranslations, setRevealedTranslations] = useState<Record<string, boolean>>({});
  const [userMistakesCount, setUserMistakesCount] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [activeTabScenario, setActiveTabScenario] = useState(scenarioId);

  // Sync if prop changes
  useEffect(() => {
    setActiveTabScenario(scenarioId);
    resetDialogue();
  }, [scenarioId]);

  const currentExchange = scenario.exchanges[currentExchangeIdx];

  const resetDialogue = () => {
    setCurrentExchangeIdx(0);
    setSelectedOption(null);
    setShowFeedback(false);
    setUserMistakesCount(0);
    setIsCompleted(false);
    setRevealedTranslations({});
  };

  const playSpeech = (text: string, slow = false) => {
    sfx.playClick();
    speakEnglish(text, slow ? 0.72 : 1.0);
  };

  const handleSelectOption = (option: DialogueOption) => {
    setSelectedOption(option);
    setShowFeedback(true);

    if (option.isCorrect) {
      sfx.playCorrect();
      speakEnglish(option.textEn, state.slowSpeech ? 0.75 : 1.0);
    } else {
      sfx.playError();
      setUserMistakesCount((prev) => prev + 1);
    }
  };

  const handleNextExchange = () => {
    sfx.playClick();
    setShowFeedback(false);
    setSelectedOption(null);

    if (currentExchangeIdx + 1 < scenario.exchanges.length) {
      setCurrentExchangeIdx((prev) => prev + 1);
      // Auto speak next NPC message
      const nextMsg = scenario.exchanges[currentExchangeIdx + 1];
      setTimeout(() => {
        speakEnglish(nextMsg.npcMessage, state.slowSpeech ? 0.75 : 1.0);
      }, 300);
    } else {
      // Completed dialogue!
      setIsCompleted(true);
      const stars = userMistakesCount === 0 ? 3 : userMistakesCount <= 2 ? 2 : 1;
      completeLesson(scenario.id, stars, 50, 10);
    }
  };

  const toggleTranslation = (id: string) => {
    sfx.playClick();
    setRevealedTranslations((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Scenario switch list
  const allScenarios = Object.values(DIALOGUES);

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 pb-24">
      {/* Scenario switcher pills */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none mb-4">
        {allScenarios.map((sc) => {
          const isSelected = sc.id === activeTabScenario;
          const isDone = state.completedLessons[sc.id]?.completed;

          return (
            <button
              key={sc.id}
              onClick={() => {
                sfx.playClick();
                setActiveTabScenario(sc.id);
                if (onSelectAnother) onSelectAnother(sc.id);
                resetDialogue();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                isSelected
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <span>{sc.partnerAvatar}</span>
              <span>{sc.titleRu.split(' ')[0]}</span>
              {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 ml-0.5" />}
            </button>
          );
        })}
      </div>

      {/* Scenario Header Card */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm mb-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-2xl shadow-xs">
              {scenario.partnerAvatar}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-extrabold text-slate-900">
                  {scenario.titleRu}
                </h2>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {scenario.difficulty}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium">
                Собеседник: <span className="font-bold text-slate-700">{scenario.partnerName}</span> ({scenario.partnerRole})
              </p>
            </div>
          </div>
        </div>

        <p className="text-xs text-slate-600 mt-3 p-3 rounded-2xl bg-slate-50 border border-slate-100 leading-relaxed">
          📍 <span className="font-semibold text-slate-700">Контекст:</span> {scenario.contextRu}
        </p>

        {/* Culture Tip */}
        {scenario.cultureTipRu && (
          <div className="mt-3 p-3 rounded-2xl bg-amber-50/80 border border-amber-200/60 text-amber-900 text-xs font-medium leading-relaxed">
            {scenario.cultureTipRu}
          </div>
        )}
      </div>

      {!isCompleted ? (
        <div className="space-y-5">
          {/* Progress Bar */}
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-slate-200 h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                style={{
                  width: `${((currentExchangeIdx + 1) / scenario.exchanges.length) * 100}%`,
                }}
              />
            </div>
            <span className="text-xs font-bold text-slate-500 whitespace-nowrap">
              Реплика {currentExchangeIdx + 1} из {scenario.exchanges.length}
            </span>
          </div>

          {/* Chat Stream: NPC Turn */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-xl shrink-0 mt-1 shadow-xs">
                {scenario.partnerAvatar}
              </div>

              <div className="flex-1 bg-white rounded-3xl rounded-tl-sm p-4 border border-slate-200 shadow-sm relative group">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="text-xs font-bold text-slate-500">
                    {scenario.partnerName}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => playSpeech(currentExchange.npcMessage, false)}
                      className="p-1.5 rounded-xl bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
                      title="Озвучить"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => playSpeech(currentExchange.npcMessage, true)}
                      className="px-1.5 py-1 text-[10px] font-bold rounded-lg bg-amber-50 text-amber-800 border border-amber-200"
                      title="Медленная речь"
                    >
                      <Snail className="w-3 h-3 inline mr-0.5" />
                      0.75x
                    </button>
                  </div>
                </div>

                {/* English NPC phrase */}
                <p className="text-base font-extrabold text-slate-900 leading-snug">
                  {currentExchange.npcMessage}
                </p>

                {/* Russian Phonetic Transcription */}
                <p className="text-xs font-semibold text-indigo-600 mt-1">
                  {currentExchange.phoneticRu}
                </p>

                {/* Translation Accordion */}
                <div className="mt-3 pt-2.5 border-t border-slate-100">
                  {revealedTranslations[currentExchange.id] ? (
                    <div className="text-xs font-bold text-slate-800 bg-indigo-50/60 p-2.5 rounded-xl border border-indigo-100">
                      Перевод: «{currentExchange.npcMessageRu}»
                      {currentExchange.tipRu && (
                        <p className="text-[11px] text-slate-600 font-normal mt-1">
                          💡 {currentExchange.tipRu}
                        </p>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => toggleTranslation(currentExchange.id)}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                    >
                      👁️ Показать перевод на русский
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* User Speech Options */}
            <div className="mt-6 pt-4 border-t border-slate-200">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                Выберите ваш ответ на английском:
              </h4>

              <div className="space-y-2.5">
                {currentExchange.options.map((option) => {
                  const isChosen = selectedOption?.id === option.id;
                  let cardStyle = 'btn-tactile-neutral text-left';

                  if (showFeedback && isChosen) {
                    cardStyle = option.isCorrect
                      ? 'bg-emerald-50 border-2 border-emerald-500 text-emerald-900 border-b-4'
                      : 'bg-red-50 border-2 border-red-500 text-red-900 border-b-4';
                  }

                  return (
                    <button
                      key={option.id}
                      onClick={() => !showFeedback && handleSelectOption(option)}
                      disabled={showFeedback}
                      className={`w-full p-4 rounded-2xl font-bold transition-all ${cardStyle}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm sm:text-base font-extrabold leading-snug">
                            {option.textEn}
                          </p>
                          <p className="text-xs text-indigo-600 font-semibold mt-0.5">
                            {option.phoneticRu}
                          </p>
                          <p className="text-xs text-slate-500 font-medium mt-1">
                            {option.textRu}
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            playSpeech(option.textEn, false);
                          }}
                          className="p-1.5 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-200 shrink-0"
                          title="Послушать вариант"
                        >
                          <Volume2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Chunks helper if correct option */}
                      {option.chunks && (
                        <div className="mt-2.5 flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
                          {option.chunks.map((ch, idx) => (
                            <span
                              key={idx}
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedChunk(ch);
                              }}
                              className="inline-flex items-center gap-1 text-[11px] font-bold bg-white text-indigo-700 px-2 py-0.5 rounded-lg border border-indigo-200 hover:bg-indigo-50 cursor-pointer"
                            >
                              🔍 {ch.en} = {ch.ru}
                            </span>
                          ))}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Explanation & Feedback Banner */}
            {showFeedback && selectedOption && (
              <div
                className={`p-4 rounded-2xl border-2 transition-all animate-in fade-in ${
                  selectedOption.isCorrect
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                    : 'bg-red-50 border-red-300 text-red-950'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  {selectedOption.isCorrect ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p className="font-extrabold text-sm">
                      {selectedOption.isCorrect ? 'Отлично! Верно' : 'Не совсем так!'}
                    </p>
                    <p className="text-xs mt-1 leading-relaxed font-medium">
                      {selectedOption.feedbackRu}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex justify-end">
                  {selectedOption.isCorrect ? (
                    <button
                      onClick={handleNextExchange}
                      className="btn-tactile-primary px-5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
                    >
                      <span>
                        {currentExchangeIdx + 1 < scenario.exchanges.length
                          ? 'Продолжить диалог'
                          : 'Завершить диалог'}
                      </span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => setShowFeedback(false)}
                      className="btn-tactile-neutral px-4 py-2 rounded-xl text-xs font-bold text-slate-700"
                    >
                      Попробовать снова
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Victory Screen */
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xl text-center space-y-4 animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 mx-auto flex items-center justify-center text-3xl shadow-sm">
            🎉
          </div>

          <div>
            <h3 className="text-2xl font-black text-slate-900 tracking-tight">
              Диалог успешно пройден!
            </h3>
            <p className="text-xs text-slate-500 font-medium mt-1">
              Вы отлично справились с ситуацией: {scenario.titleRu}
            </p>
          </div>

          {/* Stars */}
          <div className="flex items-center justify-center gap-2 py-2">
            {[1, 2, 3].map((star) => {
              const earnedStars = userMistakesCount === 0 ? 3 : userMistakesCount <= 2 ? 2 : 1;
              const isEarned = star <= earnedStars;

              return (
                <div
                  key={star}
                  className={`text-3xl transition-transform ${isEarned ? 'scale-110 drop-shadow-sm' : 'opacity-20'}`}
                >
                  ⭐
                </div>
              );
            })}
          </div>

          {/* Rewards */}
          <div className="flex justify-center gap-4 py-3">
            <div className="bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-2xl flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              <div className="text-left">
                <span className="text-[10px] uppercase font-bold text-emerald-800 block">Опыт</span>
                <span className="text-sm font-extrabold text-emerald-950">+50 XP</span>
              </div>
            </div>

            <div className="bg-indigo-50 border border-indigo-200 px-4 py-2 rounded-2xl flex items-center gap-2">
              <Award className="w-5 h-5 text-indigo-600" />
              <div className="text-left">
                <span className="text-[10px] uppercase font-bold text-indigo-800 block">Награда</span>
                <span className="text-sm font-extrabold text-indigo-950">+10 кристаллов</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2.5 pt-2">
            <button
              onClick={resetDialogue}
              className="flex-1 py-3 rounded-2xl btn-tactile-neutral text-xs font-bold flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Пройти еще раз</span>
            </button>

            {onFinish && (
              <button
                onClick={onFinish}
                className="flex-1 py-3 rounded-2xl btn-tactile-primary text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <span>К списку уроков</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Word Details Modal */}
      <WordPopup chunk={selectedChunk} onClose={() => setSelectedChunk(null)} />
    </div>
  );
};

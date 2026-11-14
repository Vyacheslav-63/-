import React, { useState, useEffect, useRef } from 'react';
import {
  Volume2,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Timer,
  ArrowRight,
  Zap,
  Headphones,
  Puzzle,
  AlertTriangle,
  Lightbulb,
  Snail,
} from 'lucide-react';
import { QUIZ_QUESTIONS } from '../data/lessonsData';
import { QuizQuestion } from '../types';
import { speakEnglish, sfx } from '../utils/audio';
import { useProgress } from '../context/ProgressContext';

type DrillMode = 'sentence' | 'listening' | 'spot_mistake' | 'blitz';

const SMART_HINTS_BY_ID: Record<string, string> = {
  'q-cafe-1':
    'Начните с вежливой конструкции «Could I have...», а «навынос / с собой» по-английски — «to go». В банке слов есть лишние слова!',
  'q-cafe-2':
    'Прислушайтесь к ключевым словам в конце вопроса: «for here» (здесь) и «to go» (с собой).',
  'q-cafe-3':
    'Ищите кальку с русского: прямое требование «Give me...» («Дай мне...») в англоязычных кафе считается грубым.',
  'q-tr-1':
    'Сначала вежливо привлеките внимание («Excuse me»), затем используйте шаблон «I’m looking for...» («Я ищу...»).',
  'q-tr-2':
    'Вслушайтесь в названия двух вещей, которые просит показать сотрудник: «boarding pass» и «passport».',
  'q-st-1':
    'Обратите внимание на буквальный перевод слова «себя» (myself) после глагола «feel» — в английском так говорить нельзя.',
  'q-sh-1':
    '«Примерить» — это фразовый глагол «try ... on». Слово «this» ставится прямо между его частями: «try this on».',
  'q-ct-1':
    'Слушайте глагол поворота сразу после «Go straight ahead» (идите прямо): left (налево) или right (направо)?',
  'q-em-1':
    'По-английски говорят «У меня есть ужасная головная боль» («I have a ... headache»), а не «моя голова болит».',
};

function getQuestionHint(q: QuizQuestion): string {
  if (SMART_HINTS_BY_ID[q.id]) {
    return SMART_HINTS_BY_ID[q.id];
  }
  if (q.type === 'sentence_builder' && q.correctSentence) {
    const words = q.correctSentence.split(' ');
    const startWords = words.slice(0, 2).join(' ');
    return `Начало фразы: «${startWords}...». Всего нужно собрать слов/блоков: ${words.length}.`;
  }
  if (q.type === 'listening') {
    return 'Нажмите «Послушать медленнее (0.75x)», чтобы чётко разобрать ключевые слова вопроса.';
  }
  return 'Вспомните разговорные шаблоны из уроков и исключите дословный перевод с русского.';
}

export const TrainingDrills: React.FC = () => {
  const { state, addXP, addGems, incrementAchievement } = useProgress();

  const [activeMode, setActiveMode] = useState<DrillMode>('sentence');

  // Flatten questions according to mode
  const allQuestions = Object.values(QUIZ_QUESTIONS).flat();

  // Mode specific questions
  const getFilteredQuestions = (mode: DrillMode): QuizQuestion[] => {
    switch (mode) {
      case 'sentence':
        return allQuestions.filter((q) => q.type === 'sentence_builder');
      case 'listening':
        return allQuestions.filter((q) => q.type === 'listening');
      case 'spot_mistake':
        return allQuestions.filter((q) => q.type === 'spot_mistake');
      case 'blitz':
        return allQuestions; // Blitz takes all questions randomized
      default:
        return allQuestions;
    }
  };

  const [currentQuestions, setCurrentQuestions] = useState<QuizQuestion[]>(() =>
    getFilteredQuestions('sentence')
  );
  const [currentIdx, setCurrentIdx] = useState(0);

  // Sentence Builder State
  const [selectedTokens, setSelectedTokens] = useState<string[]>([]);
  const [availableTokens, setAvailableTokens] = useState<string[]>([]);

  // Option selection state
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isAnswerChecked, setIsAnswerChecked] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const rewardedIdsRef = useRef<Set<string>>(new Set());

  // Blitz mode timer & score
  const [blitzTimeLeft, setBlitzTimeLeft] = useState(60);
  const [blitzScore, setBlitzScore] = useState(0);
  const [isBlitzActive, setIsBlitzActive] = useState(false);

  const question = currentQuestions[currentIdx];

  const resetCurrentQuestion = (replayAudio = false) => {
    if (!question) return;

    if (question.type === 'sentence_builder' && question.wordBank) {
      const shuffled = [...question.wordBank].sort(() => Math.random() - 0.5);
      setAvailableTokens(shuffled);
      setSelectedTokens([]);
    }

    if (replayAudio && question.type === 'listening' && question.audioText) {
      setTimeout(() => {
        speakEnglish(question.audioText!, state.slowSpeech ? 0.75 : 1.0);
      }, 200);
    }

    setSelectedOptionId(null);
    setIsAnswerChecked(false);
    setIsCorrect(false);
    setShowHint(false);
  };

  // Set up current question
  useEffect(() => {
    resetCurrentQuestion(true);
  }, [currentIdx, question]);

  // Blitz Timer Effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (activeMode === 'blitz' && isBlitzActive && blitzTimeLeft > 0) {
      timer = setInterval(() => {
        setBlitzTimeLeft((t) => t - 1);
      }, 1000);
    } else if (blitzTimeLeft === 0 && isBlitzActive) {
      setIsBlitzActive(false);
      sfx.playLevelUp();
      addXP(blitzScore * 15);
      addGems(Math.floor(blitzScore * 2));
    }
    return () => clearInterval(timer);
  }, [activeMode, isBlitzActive, blitzTimeLeft, blitzScore]);

  const switchMode = (mode: DrillMode) => {
    sfx.playClick();
    setActiveMode(mode);
    const qs = getFilteredQuestions(mode);
    setCurrentQuestions(qs);
    setCurrentIdx(0);
    if (mode === 'blitz') {
      setIsBlitzActive(false);
      setBlitzTimeLeft(60);
      setBlitzScore(0);
    }
  };

  // Sentence Builder Token Clicks
  const handlePickToken = (token: string, index: number) => {
    sfx.playClick();
    setSelectedTokens((prev) => [...prev, token]);
    setAvailableTokens((prev) => prev.filter((_, i) => i !== index));
  };

  const handleReturnToken = (token: string, index: number) => {
    sfx.playClick();
    setSelectedTokens((prev) => prev.filter((_, i) => i !== index));
    setAvailableTokens((prev) => [...prev, token]);
  };

  // Check Answer Handler
  const handleCheckAnswer = () => {
    if (!question) return;
    setIsAnswerChecked(true);

    let correct = false;

    if (question.type === 'sentence_builder') {
      const userSentence = selectedTokens.join(' ').replace(/[.,?!]/g, '').toLowerCase().trim();
      const targetSentence = (question.correctSentence || '').replace(/[.,?!]/g, '').toLowerCase().trim();
      correct = userSentence === targetSentence;
    } else if (question.options) {
      const chosen = question.options.find((o) => o.id === selectedOptionId);
      correct = !!chosen?.isCorrect;
    }

    setIsCorrect(correct);

    if (correct) {
      sfx.playCorrect();
      if (!rewardedIdsRef.current.has(question.id)) {
        rewardedIdsRef.current.add(question.id);
        addXP(15);
        if (activeMode === 'blitz') {
          setBlitzScore((s) => s + 1);
        }
        if (question.type === 'listening') {
          incrementAchievement('sharp-ear', 1);
        }
        if (question.type === 'spot_mistake') {
          incrementAchievement('no-calque', 1);
        }
      }
    } else {
      sfx.playError();
    }
  };

  const handleRetryQuestion = () => {
    sfx.playClick();
    resetCurrentQuestion(true);
  };

  const handleToggleHint = () => {
    sfx.playClick();
    setShowHint((prev) => !prev);
  };

  const handleNextQuestion = () => {
    sfx.playClick();
    if (currentIdx + 1 < currentQuestions.length) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      // Loop or restart
      setCurrentIdx(0);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 pb-24">
      {/* Mode Selector Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
        {[
          { id: 'sentence', labelRu: 'Сборка предложений', icon: Puzzle },
          { id: 'listening', labelRu: 'Чистый слух', icon: Headphones },
          { id: 'spot_mistake', labelRu: 'Найди ошибку', icon: AlertTriangle },
          { id: 'blitz', labelRu: 'Блиц-марафон', icon: Zap },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeMode === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => switchMode(tab.id as DrillMode)}
              className={`p-2.5 rounded-2xl flex flex-col items-center justify-center gap-1 text-center transition-all ${
                isActive
                  ? 'bg-slate-900 text-white shadow-sm font-bold'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[11px] leading-tight">{tab.labelRu}</span>
            </button>
          );
        })}
      </div>

      {/* Blitz Start Banner (if in blitz mode and not started) */}
      {activeMode === 'blitz' && !isBlitzActive && blitzTimeLeft === 60 && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-3xl p-6 text-center shadow-lg mb-5">
          <Zap className="w-12 h-12 mx-auto mb-2 fill-white animate-bounce" />
          <h3 className="text-xl font-extrabold tracking-tight">
            Блиц-марафон: 60 секунд!
          </h3>
          <p className="text-xs text-amber-100 max-w-sm mx-auto mt-1 mb-4 leading-relaxed">
            Ответьте на максимальное число вопросов за одну минуту. Проверьте свою быструю реакцию и языковое чутье!
          </p>
          <button
            onClick={() => {
              sfx.playLevelUp();
              setIsBlitzActive(true);
            }}
            className="btn-tactile-neutral px-8 py-3 rounded-2xl text-slate-900 font-extrabold text-sm shadow-md"
          >
            Начать спринт ⏱️
          </button>
        </div>
      )}

      {/* Blitz Finished Summary */}
      {activeMode === 'blitz' && blitzTimeLeft === 0 && (
        <div className="bg-white rounded-3xl p-6 text-center border border-slate-200 shadow-xl mb-5 space-y-3">
          <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center text-2xl mx-auto">
            🏆
          </div>
          <h3 className="text-2xl font-black text-slate-900">Время вышло!</h3>
          <p className="text-xs text-slate-500 font-medium">
            Ваш результат в спринте:
          </p>
          <div className="text-4xl font-black text-amber-600">
            {blitzScore} <span className="text-base text-slate-600">верных ответов</span>
          </div>
          <p className="text-xs text-emerald-600 font-bold">
            +{blitzScore * 15} XP • +{Math.floor(blitzScore * 2)} кристаллов
          </p>
          <button
            onClick={() => {
              setBlitzTimeLeft(60);
              setBlitzScore(0);
              setIsBlitzActive(true);
            }}
            className="btn-tactile-primary w-full py-3 rounded-2xl text-xs font-bold mt-2"
          >
            Сыграть снова
          </button>
        </div>
      )}

      {/* Exercise Question Card */}
      {question && (activeMode !== 'blitz' || isBlitzActive) && (
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-5">
          {/* Header info */}
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-xs font-bold text-slate-500">
              Тема: <span className="text-slate-800">{question.category}</span>
            </span>

            {activeMode === 'blitz' && (
              <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-900 rounded-full border border-amber-200 font-mono text-xs font-bold">
                <Timer className="w-3.5 h-3.5 text-amber-600" />
                <span>{blitzTimeLeft} сек</span>
                <span className="text-slate-400">|</span>
                <span>Счет: {blitzScore}</span>
              </div>
            )}
          </div>

          {/* Question Prompt */}
          <div>
            <h3 className="text-base sm:text-lg font-extrabold text-slate-900 leading-snug">
              {question.promptRu}
            </h3>
          </div>

          {/* Audio Button if Listening Mode */}
          {question.type === 'listening' && question.audioText && (
            <div className="py-4 text-center">
              <button
                onClick={() => {
                  sfx.playClick();
                  speakEnglish(question.audioText!, state.slowSpeech ? 0.75 : 1.0);
                }}
                className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-md hover:scale-105 active:scale-95 transition-all"
                title="Послушать речь"
              >
                <Volume2 className="w-8 h-8" />
              </button>
              <p className="text-xs text-slate-500 font-medium mt-2">
                Нажмите, чтобы прослушать аудио еще раз
              </p>
            </div>
          )}

          {/* Sentence Builder Workspace */}
          {question.type === 'sentence_builder' && (
            <div className="space-y-4">
              {/* Drop / Assembled Slot */}
              <div className="min-h-16 p-3.5 rounded-2xl bg-slate-50 border-2 border-dashed border-slate-300 flex flex-wrap gap-2 items-center">
                {selectedTokens.length === 0 ? (
                  <span className="text-xs text-slate-400 font-medium">
                    Нажимайте на слова ниже, чтобы собрать английское предложение
                  </span>
                ) : (
                  selectedTokens.map((token, idx) => (
                    <button
                      key={idx}
                      onClick={() => !isAnswerChecked && handleReturnToken(token, idx)}
                      disabled={isAnswerChecked}
                      className="px-3 py-1.5 rounded-xl bg-white text-slate-900 font-extrabold text-xs border border-slate-300 shadow-2xs hover:bg-slate-50 active:scale-95 transition-all"
                    >
                      {token}
                    </button>
                  ))
                )}
              </div>

              {/* Word Bank Chips */}
              <div className="flex flex-wrap gap-2 pt-2">
                {availableTokens.map((token, idx) => (
                  <button
                    key={idx}
                    onClick={() => !isAnswerChecked && handlePickToken(token, idx)}
                    disabled={isAnswerChecked}
                    className="px-3.5 py-2 rounded-2xl bg-white text-slate-700 font-bold text-xs border-2 border-slate-200 border-b-4 border-b-slate-300 hover:border-slate-300 active:translate-y-[2px] active:border-b-2 transition-all shadow-2xs"
                  >
                    {token}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Multiple Choice / Options */}
          {question.options && (
            <div className="space-y-2.5">
              {question.options.map((opt) => {
                const isSelected = selectedOptionId === opt.id;
                let btnStyle = 'btn-tactile-neutral text-left';

                if (isAnswerChecked && isSelected) {
                  btnStyle = opt.isCorrect
                    ? 'bg-emerald-50 border-2 border-emerald-500 text-emerald-950 border-b-4'
                    : 'bg-red-50 border-2 border-red-500 text-red-950 border-b-4';
                }

                return (
                  <button
                    key={opt.id}
                    onClick={() => !isAnswerChecked && setSelectedOptionId(opt.id)}
                    disabled={isAnswerChecked}
                    className={`w-full p-3.5 rounded-2xl font-bold text-xs sm:text-sm transition-all ${btnStyle} ${
                      isSelected && !isAnswerChecked ? 'ring-2 ring-indigo-500 border-indigo-500' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{opt.text}</span>
                      {isAnswerChecked && isSelected && (
                        opt.isCorrect ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-600 shrink-0" />
                        )
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Hint Banner */}
          {showHint && !isAnswerChecked && (
            <div className="p-3.5 rounded-2xl bg-amber-50 border-2 border-amber-200 text-amber-950 space-y-2 animate-in fade-in">
              <div className="flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="text-xs font-semibold leading-relaxed">
                  <span className="font-extrabold">Подсказка: </span>
                  {getQuestionHint(question)}
                </div>
              </div>
              {question.type === 'listening' && question.audioText && (
                <button
                  type="button"
                  onClick={() => {
                    sfx.playClick();
                    speakEnglish(question.audioText!, 0.72);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-amber-300 text-amber-900 text-[11px] font-bold hover:bg-amber-100/60 transition-colors"
                >
                  <Snail className="w-3.5 h-3.5 text-amber-700" />
                  <span>Послушать медленнее (0.75x)</span>
                </button>
              )}
            </div>
          )}

          {/* Explanation Banner after Check */}
          {isAnswerChecked && (
            <div
              className={`p-4 rounded-2xl border-2 transition-all animate-in fade-in ${
                isCorrect
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                  : 'bg-red-50 border-red-300 text-red-950'
              }`}
            >
              <div className="flex items-start gap-2.5">
                {isCorrect ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p className="font-extrabold text-sm">
                    {isCorrect ? 'Правильно! +15 XP' : 'Ошибка! Попробуйте еще раз или посмотрите разбор:'}
                  </p>
                  <p className="text-xs mt-1 leading-relaxed font-medium">
                    {question.explanationRu}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Action Bottom Bar */}
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
            {!isAnswerChecked ? (
              <>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleToggleHint}
                    className={`px-3.5 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 ${
                      showHint
                        ? 'bg-amber-100 border-amber-300 text-amber-900'
                        : 'btn-tactile-neutral text-slate-700'
                    }`}
                  >
                    <Lightbulb className="w-4 h-4 text-amber-500" />
                    <span>Подсказка</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleRetryQuestion}
                    className="btn-tactile-neutral px-3.5 py-2.5 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-1.5"
                    title="Сбросить выбор и попробовать еще раз"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                    <span>Попробовать ещё раз</span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleCheckAnswer}
                  disabled={
                    (question.type === 'sentence_builder' && selectedTokens.length === 0) ||
                    (question.options && !selectedOptionId)
                  }
                  className="btn-tactile-primary w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs ml-auto"
                >
                  Проверить ответ
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleRetryQuestion}
                  className="btn-tactile-neutral w-full sm:w-auto px-4 py-2.5 rounded-xl font-bold text-xs text-slate-700 flex items-center justify-center gap-1.5"
                >
                  <RotateCcw className="w-4 h-4 text-slate-600" />
                  <span>Попробовать ещё раз</span>
                </button>

                <button
                  type="button"
                  onClick={handleNextQuestion}
                  className="btn-tactile-secondary w-full sm:w-auto px-6 py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 ml-auto"
                >
                  <span>Следующий вопрос</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

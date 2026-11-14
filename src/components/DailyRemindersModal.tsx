import React, { useState, useEffect } from 'react';
import { Bell, X, Check, Timer, Play, Pause, RotateCcw, Sparkles, Flame, ShieldCheck } from 'lucide-react';
import { useProgress } from '../context/ProgressContext';
import { requestNotificationPermission, getNotificationPermission, sendLocalNotification, REMINDER_MESSAGES } from '../utils/notifications';
import { sfx } from '../utils/audio';

interface DailyRemindersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DailyRemindersModal: React.FC<DailyRemindersModalProps> = ({ isOpen, onClose }) => {
  const { state, updateReminderSettings, addXP } = useProgress();
  const settings = state.reminderSettings;

  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [testSent, setTestSent] = useState(false);

  // Focus Timer state
  const [focusDuration, setFocusDuration] = useState(5); // 5 or 10 min
  const [secondsLeft, setSecondsLeft] = useState(focusDuration * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerCompleted, setTimerCompleted] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setPermission(getNotificationPermission());
    }
  }, [isOpen]);

  // Focus timer countdown
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isTimerRunning && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((s) => s - 1);
      }, 1000);
    } else if (secondsLeft === 0 && isTimerRunning) {
      setIsTimerRunning(false);
      setTimerCompleted(true);
      sfx.playLevelUp();
      addXP(50);
      sendLocalNotification(
        'Сессия фокуса завершена! 🎉',
        'Отличная работа! Вы позанимались английским 5 минут и закрепили знания.'
      );
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, secondsLeft]);

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    sfx.playClick();
    const result = await requestNotificationPermission();
    setPermission(result);
    if (result === 'granted') {
      sfx.playCorrect();
      updateReminderSettings({ enabled: true });
    }
  };

  const handleSendTestNotification = () => {
    sfx.playClick();
    const randomMsg = REMINDER_MESSAGES[Math.floor(Math.random() * REMINDER_MESSAGES.length)];
    sendLocalNotification(randomMsg.title, randomMsg.body, randomMsg.icon);
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  };

  const startFocusTimer = (mins: number) => {
    sfx.playClick();
    setFocusDuration(mins);
    setSecondsLeft(mins * 60);
    setIsTimerRunning(true);
    setTimerCompleted(false);
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
      <div 
        className="w-full max-w-lg bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto space-y-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center text-amber-700 shadow-xs">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 leading-tight">
                Ежедневные напоминания
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Закрепление фраз в долговременной памяти
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Browser Permission status */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-bold text-slate-800">
                Push-уведомления браузера:
              </span>
            </div>

            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
              permission === 'granted'
                ? 'bg-emerald-100 text-emerald-800'
                : 'bg-amber-100 text-amber-800'
            }`}>
              {permission === 'granted' ? 'Разрешено ✅' : 'Требуется разрешение'}
            </span>
          </div>

          {permission !== 'granted' ? (
            <button
              onClick={handleRequestPermission}
              className="btn-tactile-primary w-full py-2.5 rounded-xl text-xs font-bold"
            >
              Включить уведомления в браузере
            </button>
          ) : (
            <button
              onClick={handleSendTestNotification}
              disabled={testSent}
              className="btn-tactile-neutral w-full py-2 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5"
            >
              {testSent ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span>Уведомление отправлено! Проверьте экран</span>
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4 text-indigo-600" />
                  <span>Отправить тестовое напоминание сейчас</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Time and Duration Settings */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700">
              Удобное время для напоминания:
            </label>
            <input
              type="time"
              value={settings.time}
              onChange={(e) => updateReminderSettings({ time: e.target.value })}
              className="p-2 rounded-xl border border-slate-300 font-bold text-sm text-slate-900 bg-slate-50 focus:outline-indigo-500"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-700 block mb-2">
              Ежедневная цель по времени:
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { min: 5, labelRu: '5 мин', subRu: 'Спринт' },
                { min: 15, labelRu: '15 мин', subRu: 'Оптимально' },
                { min: 30, labelRu: '30 мин', subRu: 'Интенсив' },
              ].map((goal) => {
                const isSelected = settings.dailyGoalMinutes === goal.min;
                return (
                  <button
                    key={goal.min}
                    onClick={() => updateReminderSettings({ dailyGoalMinutes: goal.min })}
                    className={`p-3 rounded-2xl text-center border-2 transition-all ${
                      isSelected
                        ? 'bg-indigo-50 border-indigo-500 text-indigo-950 font-bold'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="block text-sm font-extrabold">{goal.labelRu}</span>
                    <span className="text-[10px] text-slate-500">{goal.subRu}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Active Focus Sprint Timer (5-min quick session) */}
        <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 text-white rounded-3xl p-5 shadow-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-100">
              <Timer className="w-4 h-4" />
              <span>Таймер фокус-занятия</span>
            </div>
            <span className="text-[10px] bg-indigo-400/40 px-2 py-0.5 rounded-full font-bold">
              +50 XP бонус
            </span>
          </div>

          <div className="text-center py-2">
            <div className="text-4xl sm:text-5xl font-black tracking-tight font-mono">
              {formatTimer(secondsLeft)}
            </div>
            <p className="text-xs text-indigo-200 mt-1">
              {timerCompleted
                ? 'Отлично! Сессия завершена 🎉'
                : isTimerRunning
                ? 'Фокус идет: повторяйте слова или решайте тесты!'
                : 'Запустите 5-минутку английского прямо сейчас'}
            </p>
          </div>

          <div className="flex gap-2">
            {!isTimerRunning ? (
              <button
                onClick={() => startFocusTimer(5)}
                className="btn-tactile-amber flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 text-white"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>{secondsLeft < 300 && secondsLeft > 0 ? 'Продолжить' : 'Начать 5 минут'}</span>
              </button>
            ) : (
              <button
                onClick={() => setIsTimerRunning(false)}
                className="btn-tactile-neutral flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 text-slate-800"
              >
                <Pause className="w-4 h-4" />
                <span>Пауза</span>
              </button>
            )}

            <button
              onClick={() => {
                sfx.playClick();
                setIsTimerRunning(false);
                setSecondsLeft(300);
                setTimerCompleted(false);
              }}
              className="p-2.5 rounded-xl bg-indigo-600/60 hover:bg-indigo-600 text-white"
              title="Сбросить"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Why Daily Matters Tip */}
        <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/50 text-xs text-amber-950 font-medium leading-relaxed">
          💡 <span className="font-bold">Правило кривой Эббингауза:</span> Мозг забывает до 70% новой информации уже через 24 часа. Всего 5 минут ежедневного закрепления шаблонов экономят сотни часов за счет переноса фраз в долгосрочную память!
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="btn-tactile-primary w-full py-3 rounded-2xl text-xs font-bold"
        >
          Сохранить и продолжить
        </button>
      </div>
    </div>
  );
};

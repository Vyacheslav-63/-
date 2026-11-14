import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import confetti from 'canvas-confetti';
import { Achievement, DailyQuest, FlashcardItem, LeaderboardUser, ReminderSettings } from '../types';
import { INITIAL_ACHIEVEMENTS, INITIAL_DAILY_QUESTS } from '../data/achievementsData';
import { INITIAL_FLASHCARDS } from '../data/lessonsData';
import { sfx } from '../utils/audio';

const STORAGE_KEY = 'speakeasy_progress_v1';

export interface ProgressState {
  xp: number;
  level: number;
  gems: number;
  streak: number;
  lastActiveDate: string;
  completedLessons: Record<string, { completed: boolean; stars: number }>;
  flashcards: FlashcardItem[];
  achievements: Achievement[];
  dailyQuests: DailyQuest[];
  reminderSettings: ReminderSettings;
  soundEnabled: boolean;
  slowSpeech: boolean;
}

const DEFAULT_SETTINGS: ReminderSettings = {
  enabled: true,
  time: '19:00',
  dailyGoalMinutes: 10,
  soundEnabled: true,
  slowSpeechDefault: false,
};

const INITIAL_STATE: ProgressState = {
  xp: 120,
  level: 1,
  gems: 75,
  streak: 2,
  lastActiveDate: new Date().toISOString().split('T')[0],
  completedLessons: {
    'cafe-pattern': { completed: true, stars: 3 },
  },
  flashcards: INITIAL_FLASHCARDS,
  achievements: INITIAL_ACHIEVEMENTS,
  dailyQuests: INITIAL_DAILY_QUESTS,
  reminderSettings: DEFAULT_SETTINGS,
  soundEnabled: true,
  slowSpeech: false,
};

interface ProgressContextType {
  state: ProgressState;
  addXP: (amount: number, reasonRu?: string) => void;
  addGems: (amount: number) => void;
  completeLesson: (lessonId: string, stars: number, xpReward: number, gemsReward: number) => void;
  claimAchievement: (achievementId: string) => void;
  incrementAchievement: (id: string, amount?: number) => void;
  incrementDailyQuest: (questId: string, amount?: number) => void;
  updateReminderSettings: (settings: Partial<ReminderSettings>) => void;
  reviewFlashcard: (cardId: string, rating: 'again' | 'hard' | 'good' | 'easy') => void;
  addCustomFlashcard: (phraseEn: string, phraseRu: string, phoneticRu?: string, contextRu?: string) => void;
  toggleSlowSpeech: () => void;
  toggleSound: () => void;
  leaderboard: LeaderboardUser[];
  streakDaysList: boolean[];
}

const ProgressContext = createContext<ProgressContextType | undefined>(undefined);

export const ProgressProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<ProgressState>(() => {
    if (typeof window === 'undefined') return INITIAL_STATE;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const savedFlashcards: FlashcardItem[] = Array.isArray(parsed.flashcards)
          ? parsed.flashcards
          : [];
        const savedCardIds = new Set(savedFlashcards.map((c) => c.id));
        const mergedFlashcards = [
          ...savedFlashcards,
          ...INITIAL_FLASHCARDS.filter((fc) => !savedCardIds.has(fc.id)),
        ];

        return {
          ...INITIAL_STATE,
          ...parsed,
          flashcards: mergedFlashcards,
          achievements: INITIAL_ACHIEVEMENTS.map((initialAch) => {
            const savedAch = parsed.achievements?.find((a: Achievement) => a.id === initialAch.id);
            return savedAch ? { ...initialAch, ...savedAch } : initialAch;
          }),
          dailyQuests: INITIAL_DAILY_QUESTS.map((initialQuest) => {
            const savedQuest = parsed.dailyQuests?.find((q: DailyQuest) => q.id === initialQuest.id);
            return savedQuest ? { ...initialQuest, ...savedQuest } : initialQuest;
          }),
        };
      }
    } catch (e) {
      console.error('Failed to load progress state:', e);
    }
    return INITIAL_STATE;
  });

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Failed to save progress:', e);
    }
  }, [state]);

  // Check and update streak on load
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    if (state.lastActiveDate !== today) {
      const last = new Date(state.lastActiveDate);
      const curr = new Date(today);
      const diffTime = Math.abs(curr.getTime() - last.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        // Consecutive day
        setState((prev) => {
          const newStreak = prev.streak + 1;
          return {
            ...prev,
            streak: newStreak,
            lastActiveDate: today,
          };
        });
      } else if (diffDays > 2) {
        // Reset streak if gap > 2 days
        setState((prev) => ({
          ...prev,
          streak: 1,
          lastActiveDate: today,
        }));
      }
    }
  }, []);

  const calculateLevel = (currentXP: number) => {
    // 100 XP for Lvl 1, 250 for Lvl 2, 450 for Lvl 3, etc.
    return Math.floor(Math.sqrt(currentXP / 60)) + 1;
  };

  const addXP = (amount: number) => {
    setState((prev) => {
      const newXP = prev.xp + amount;
      const oldLevel = prev.level;
      const newLevel = calculateLevel(newXP);

      if (newLevel > oldLevel) {
        sfx.playLevelUp();
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      }

      // Update XP daily quest
      const updatedQuests = prev.dailyQuests.map((q) => {
        if (q.id === 'quest-xp') {
          const current = Math.min(q.target, q.current + amount);
          return { ...q, current, completed: current >= q.target };
        }
        return q;
      });

      return {
        ...prev,
        xp: newXP,
        level: newLevel,
        dailyQuests: updatedQuests,
      };
    });
  };

  const addGems = (amount: number) => {
    setState((prev) => ({
      ...prev,
      gems: prev.gems + amount,
    }));
  };

  const completeLesson = (lessonId: string, stars: number, xpReward: number, gemsReward: number) => {
    setState((prev) => {
      const existing = prev.completedLessons[lessonId];
      const bestStars = existing ? Math.max(existing.stars, stars) : stars;

      const updatedCompleted = {
        ...prev.completedLessons,
        [lessonId]: { completed: true, stars: bestStars },
      };

      // Check achievements
      const completedCount = Object.keys(updatedCompleted).length;
      const updatedAchievements = prev.achievements.map((ach) => {
        if (ach.id === 'first-step') {
          return { ...ach, currentProgress: 1, unlocked: true };
        }
        if (ach.id === 'cafe-master') {
          const cafeCompleted = ['cafe-pattern', 'cafe-dialogue', 'cafe-test'].every(
            (id) => updatedCompleted[id]?.completed
          );
          return {
            ...ach,
            currentProgress: cafeCompleted ? 3 : (ach.currentProgress || 0) + 1,
            unlocked: cafeCompleted,
          };
        }
        if (ach.id === 'dialogue-pro' && lessonId.includes('dialogue') && stars === 3) {
          const prog = Math.min(ach.maxProgress, ach.currentProgress + 1);
          return { ...ach, currentProgress: prog, unlocked: prog >= ach.maxProgress };
        }
        return ach;
      });

      // Daily quest updates
      const updatedQuests = prev.dailyQuests.map((q) => {
        if (lessonId.includes('dialogue') && q.id === 'quest-dialogue') {
          const cur = Math.min(q.target, q.current + 1);
          return { ...q, current: cur, completed: cur >= q.target };
        }
        if (lessonId.includes('pattern') && q.id === 'quest-pattern') {
          const cur = Math.min(q.target, q.current + 1);
          return { ...q, current: cur, completed: cur >= q.target };
        }
        return q;
      });

      return {
        ...prev,
        completedLessons: updatedCompleted,
        achievements: updatedAchievements,
        dailyQuests: updatedQuests,
      };
    });

    addXP(xpReward);
    addGems(gemsReward);
    sfx.playCorrect();
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
    });
  };

  const incrementAchievement = (id: string, amount = 1) => {
    setState((prev) => ({
      ...prev,
      achievements: prev.achievements.map((ach) => {
        if (ach.id === id) {
          const nextVal = Math.min(ach.maxProgress, ach.currentProgress + amount);
          const unlocked = nextVal >= ach.maxProgress;
          return { ...ach, currentProgress: nextVal, unlocked };
        }
        return ach;
      }),
    }));
  };

  const claimAchievement = (achievementId: string) => {
    setState((prev) => {
      const ach = prev.achievements.find((a) => a.id === achievementId);
      if (!ach || !ach.unlocked || ach.claimed) return prev;

      confetti({
        particleCount: 60,
        spread: 80,
      });
      sfx.playStreak();

      return {
        ...prev,
        gems: prev.gems + ach.gemReward,
        achievements: prev.achievements.map((a) =>
          a.id === achievementId ? { ...a, claimed: true } : a
        ),
      };
    });
  };

  const incrementDailyQuest = (questId: string, amount = 1) => {
    setState((prev) => ({
      ...prev,
      dailyQuests: prev.dailyQuests.map((q) => {
        if (q.id === questId) {
          const cur = Math.min(q.target, q.current + amount);
          return { ...q, current: cur, completed: cur >= q.target };
        }
        return q;
      }),
    }));
  };

  const updateReminderSettings = (newSettings: Partial<ReminderSettings>) => {
    setState((prev) => ({
      ...prev,
      reminderSettings: {
        ...prev.reminderSettings,
        ...newSettings,
      },
    }));
  };

  const reviewFlashcard = (cardId: string, rating: 'again' | 'hard' | 'good' | 'easy') => {
    setState((prev) => {
      const updatedCards = prev.flashcards.map((card) => {
        if (card.id !== cardId) return card;
        let newBox = card.box;
        let delayDays = 1;

        if (rating === 'again') {
          newBox = 1;
          delayDays = 0.5;
        } else if (rating === 'hard') {
          newBox = Math.max(1, card.box);
          delayDays = 1;
        } else if (rating === 'good') {
          newBox = Math.min(5, card.box + 1);
          delayDays = newBox * 2;
        } else if (rating === 'easy') {
          newBox = Math.min(5, card.box + 2);
          delayDays = newBox * 3;
        }

        return {
          ...card,
          box: newBox,
          timesReviewed: card.timesReviewed + 1,
          nextReview: Date.now() + delayDays * 24 * 60 * 60 * 1000,
        };
      });

      // Update flashcards quest
      const updatedQuests = prev.dailyQuests.map((q) => {
        if (q.id === 'quest-cards') {
          const cur = Math.min(q.target, q.current + 1);
          return { ...q, current: cur, completed: cur >= q.target };
        }
        return q;
      });

      return {
        ...prev,
        flashcards: updatedCards,
        dailyQuests: updatedQuests,
      };
    });

    addXP(10);
    incrementAchievement('vocab-champ', 1);
  };

  const addCustomFlashcard = (
    phraseEn: string,
    phraseRu: string,
    phoneticRu = '',
    contextRu = 'Добавлено из голосового переводчика'
  ) => {
    setState((prev) => {
      const exists = prev.flashcards.some(
        (c) => c.phraseEn.toLowerCase() === phraseEn.trim().toLowerCase()
      );
      if (exists) return prev;
      const newCard: FlashcardItem = {
        id: `tr-${Date.now()}`,
        phraseEn: phraseEn.trim(),
        phraseRu: phraseRu.trim(),
        phoneticRu: phoneticRu.trim(),
        contextRu,
        box: 1,
        nextReview: Date.now(),
        timesReviewed: 0,
      };
      return {
        ...prev,
        flashcards: [newCard, ...prev.flashcards],
      };
    });
    addXP(5);
  };

  const toggleSlowSpeech = () => {
    setState((prev) => ({ ...prev, slowSpeech: !prev.slowSpeech }));
  };

  const toggleSound = () => {
    setState((prev) => ({ ...prev, soundEnabled: !prev.soundEnabled }));
  };

  // Streak indicator for the last 7 days
  const streakDaysList = [true, true, true, false, true, true, true].map((_, i) => i < state.streak);

  // Dynamic leaderboard simulating competitors around user's XP
  const leaderboard: LeaderboardUser[] = [
    { id: 'u1', name: 'Анна М.', cityRu: 'Москва', avatar: '👩', xp: state.xp + 180, streak: 8, rank: 1 },
    { id: 'u2', name: 'Дмитрий К.', cityRu: 'Санкт-Петербург', avatar: '🧔', xp: state.xp + 70, streak: 5, rank: 2 },
    { id: 'u-current', name: 'Вы (Ученик)', cityRu: 'Ваш профиль', avatar: '🦁', xp: state.xp, streak: state.streak, isCurrent: true, rank: 3 },
    { id: 'u3', name: 'Елена В.', cityRu: 'Казань', avatar: '👱‍♀️', xp: Math.max(40, state.xp - 45), streak: 2, rank: 4 },
    { id: 'u4', name: 'Максим С.', cityRu: 'Новосибирск', avatar: '🧑', xp: Math.max(10, state.xp - 95), streak: 1, rank: 5 },
  ];

  return (
    <ProgressContext.Provider
      value={{
        state,
        addXP,
        addGems,
        completeLesson,
        claimAchievement,
        incrementAchievement,
        incrementDailyQuest,
        updateReminderSettings,
        reviewFlashcard,
        addCustomFlashcard,
        toggleSlowSpeech,
        toggleSound,
        leaderboard,
        streakDaysList,
      }}
    >
      {children}
    </ProgressContext.Provider>
  );
};

export const useProgress = () => {
  const context = useContext(ProgressContext);
  if (!context) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return context;
};

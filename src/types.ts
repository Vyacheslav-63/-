export type LevelCategory = 'A0' | 'A1' | 'A2';

export interface ChunkAnnotation {
  en: string;
  ru: string;
  phoneticRu?: string;
  noteRu?: string;
}

export interface DialogueOption {
  id: string;
  textEn: string;
  textRu: string;
  phoneticRu: string;
  isCorrect: boolean;
  feedbackRu: string;
  chunks?: ChunkAnnotation[];
}

export interface DialogueExchange {
  id: string;
  npcMessage: string;
  npcMessageRu: string;
  phoneticRu: string;
  tipRu?: string;
  options: DialogueOption[];
  wordTokens?: string[]; // for sentence builder mode in dialogue
  correctPhrase?: string;
}

export interface DialogueScenario {
  id: string;
  moduleId: string;
  titleRu: string;
  contextRu: string;
  partnerName: string;
  partnerRole: string;
  partnerAvatar: string;
  location: string;
  difficulty: 'Легкий' | 'Средний' | 'Продвинутый';
  exchanges: DialogueExchange[];
  cultureTipRu: string;
}

export interface PatternSlotOption {
  en: string;
  ru: string;
  phonetic: string;
}

export interface PatternSlot {
  name: string;
  nameRu: string;
  options: PatternSlotOption[];
}

export interface SpeechPattern {
  id: string;
  moduleId: string;
  categoryRu: string;
  formula: string;
  formulaRu: string;
  explanationRu: string;
  literalMeaningRu: string;
  culturalTipRu: string;
  slots: PatternSlot[];
  examples: {
    en: string;
    ru: string;
    phonetic: string;
    chunks?: ChunkAnnotation[];
  }[];
}

export type QuizType = 'sentence_builder' | 'listening' | 'speed_blitz' | 'spot_mistake' | 'multiple_choice';

export interface QuizQuestion {
  id: string;
  type: QuizType;
  promptRu: string;
  audioText?: string;
  correctSentence?: string;
  wordBank?: string[];
  options?: {
    id: string;
    text: string;
    textRu?: string;
    isCorrect: boolean;
    explanationRu: string;
  }[];
  explanationRu: string;
  category: string;
}

export interface FlashcardItem {
  id: string;
  phraseEn: string;
  phraseRu: string;
  phoneticRu: string;
  contextRu: string;
  box: number; // 1 to 5 for Leitner box
  nextReview: number; // timestamp
  timesReviewed: number;
}

export interface Achievement {
  id: string;
  titleRu: string;
  descriptionRu: string;
  icon: string;
  category: 'dialogues' | 'streaks' | 'patterns' | 'drills' | 'speed';
  maxProgress: number;
  currentProgress: number;
  unlocked: boolean;
  claimed: boolean;
  gemReward: number;
}

export interface DailyQuest {
  id: string;
  titleRu: string;
  target: number;
  current: number;
  completed: boolean;
  xpReward: number;
  icon: string;
}

export interface ReminderSettings {
  enabled: boolean;
  time: string; // "19:00"
  dailyGoalMinutes: number; // 5, 15, 30
  soundEnabled: boolean;
  slowSpeechDefault: boolean;
}

export interface LeaderboardUser {
  id: string;
  name: string;
  cityRu: string;
  avatar: string;
  xp: number;
  streak: number;
  isCurrent?: boolean;
  rank: number;
}

export interface Lesson {
  id: string;
  moduleId: string;
  type: 'dialogue' | 'pattern' | 'test';
  titleRu: string;
  subtitleRu: string;
  durationMinutes: number;
  xpReward: number;
  gemsReward: number;
  completed: boolean;
  stars: number; // 0 to 3
}

export interface ModuleItem {
  id: string;
  order: number;
  titleRu: string;
  descriptionRu: string;
  icon: string;
  accentColor: string;
  level: LevelCategory;
  lessons: Lesson[];
}

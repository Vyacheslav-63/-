import React, { useState } from 'react';
import { ProgressProvider, useProgress } from './context/ProgressContext';
import { Header } from './components/Header';
import { BottomNav, TabType } from './components/BottomNav';
import { RoadmapView } from './components/RoadmapView';
import { DialogueSimulator } from './components/DialogueSimulator';
import { PatternConstructor } from './components/PatternConstructor';
import { TrainingDrills } from './components/TrainingDrills';
import { SpacedRepetition } from './components/SpacedRepetition';
import { ProfileAndLeaderboard } from './components/ProfileAndLeaderboard';
import { DailyRemindersModal } from './components/DailyRemindersModal';
import { InstallModal } from './components/InstallModal';
import { OfflineIndicator } from './components/OfflineIndicator';
import { VoiceTranslator } from './components/VoiceTranslator';
import { Lesson } from './types';

function AppContent() {
  const { state } = useProgress();
  const [activeTab, setActiveTab] = useState<TabType>('roadmap');
  const [activeScenarioId, setActiveScenarioId] = useState<string>('cafe-dialogue');
  const [activePatternId, setActivePatternId] = useState<string>('cafe-pattern');
  const [isRemindersModalOpen, setIsRemindersModalOpen] = useState<boolean>(false);
  const [isInstallModalOpen, setIsInstallModalOpen] = useState<boolean>(false);

  // When user clicks a lesson from the roadmap
  const handleStartLesson = (lesson: Lesson) => {
    if (lesson.type === 'dialogue') {
      setActiveScenarioId(lesson.id);
      setActiveTab('dialogues');
    } else if (lesson.type === 'pattern') {
      setActivePatternId(lesson.id);
      setActiveTab('patterns');
    } else if (lesson.type === 'test') {
      setActiveTab('drills');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Offline notification banner if offline */}
      <OfflineIndicator />

      {/* Sticky Gamified Top Bar */}
      <Header
        onOpenReminders={() => setIsRemindersModalOpen(true)}
        onOpenProfile={() => setActiveTab('profile')}
        onOpenInstall={() => setIsInstallModalOpen(true)}
      />

      {/* Main View Container */}
      <main className="flex-1 w-full max-w-4xl mx-auto">
        {activeTab === 'roadmap' && (
          <RoadmapView
            onStartLesson={handleStartLesson}
            onOpenQuickDrill={() => setActiveTab('drills')}
            onOpenInstall={() => setIsInstallModalOpen(true)}
            onOpenTranslator={() => setActiveTab('translator')}
          />
        )}

        {activeTab === 'dialogues' && (
          <DialogueSimulator
            scenarioId={activeScenarioId}
            onSelectAnother={(id) => setActiveScenarioId(id)}
            onFinish={() => setActiveTab('roadmap')}
          />
        )}

        {activeTab === 'patterns' && (
          <PatternConstructor
            initialPatternId={activePatternId}
            onFinish={() => setActiveTab('roadmap')}
          />
        )}

        {activeTab === 'translator' && <VoiceTranslator />}

        {activeTab === 'drills' && <TrainingDrills />}

        {activeTab === 'flashcards' && <SpacedRepetition />}

        {activeTab === 'profile' && <ProfileAndLeaderboard />}
      </main>

      {/* Daily Reminders & Focus Timer Modal */}
      <DailyRemindersModal
        isOpen={isRemindersModalOpen}
        onClose={() => setIsRemindersModalOpen(false)}
      />

      {/* PWA Install Modal (Android & iOS instructions) */}
      <InstallModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />

      {/* Sticky Bottom Dock */}
      <BottomNav
        activeTab={activeTab}
        onChangeTab={setActiveTab}
        dueCardsCount={
          state.flashcards.filter(
            (c) =>
              (!c.dictLevel || c.dictLevel <= state.unlockedDictLevel) &&
              !state.masteredDictCardIds.includes(c.id)
          ).length
        }
      />
    </div>
  );
}

export default function App() {
  return (
    <ProgressProvider>
      <AppContent />
    </ProgressProvider>
  );
}

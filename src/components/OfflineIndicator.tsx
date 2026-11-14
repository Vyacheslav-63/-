import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed top-14 left-4 right-4 sm:left-auto sm:right-4 z-50 flex items-center gap-2 rounded-2xl bg-slate-900 text-white px-4 py-2.5 text-xs font-bold shadow-xl border border-slate-700 animate-in slide-in-from-top-2">
      <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
      <span>Офлайн-режим: уроки, диалоги, тесты, карточки и разговорник работают без интернета!</span>
    </div>
  );
};

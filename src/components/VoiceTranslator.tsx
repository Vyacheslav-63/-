import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  Square,
  Volume2,
  Languages,
  Send,
  BookmarkPlus,
  Check,
  Sparkles,
  Snail,
  Trash2,
  AlertCircle,
  Loader2,
  ArrowLeftRight,
  Copy,
  WifiOff,
  BookOpen,
} from 'lucide-react';
import { useProgress } from '../context/ProgressContext';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { playNaturalSpeech, sfx } from '../utils/audio';
import {
  findOfflineTranslation,
  getOfflineQuickSuggestions,
  type OfflinePhraseEntry,
} from '../utils/offlineDictionary';

type DirectionMode = 'auto' | 'ru-en' | 'en-ru';

interface AlternativeItem {
  text: string;
  noteRu: string;
}

interface TranslationEntry {
  id: string;
  sourceLang: 'ru' | 'en';
  targetLang: 'en' | 'ru';
  sourceText: string;
  translatedText: string;
  phoneticRu: string;
  usageTipRu: string;
  alternatives: AlternativeItem[];
  timestamp: number;
  fromOffline?: boolean;
}

const HISTORY_STORAGE_KEY = 'speakeasy_translator_history_v1';

const QUICK_PHRASES_RU = [
  'Где здесь ближайшее метро?',
  'Можно мне счёт, пожалуйста?',
  'У меня аллергия на орехи',
  'Сколько стоит эта куртка?',
  'Я не говорю по-английски, говорите медленнее',
];

function getSupportedAudioMimeType(): string {
  if (typeof MediaRecorder === 'undefined') return 'audio/webm';
  const candidates = [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
    'audio/aac',
    'audio/ogg;codecs=opus',
  ];
  for (const type of candidates) {
    if (MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return 'audio/webm';
}

export const VoiceTranslator: React.FC = () => {
  const { state, addXP, addCustomFlashcard } = useProgress();
  const isOnline = useOnlineStatus();
  const isFileProtocol =
    typeof window !== 'undefined' && window.location.protocol === 'file:';

  const [direction, setDirection] = useState<DirectionMode>('auto');
  const [inputText, setInputText] = useState('');
  const [autoSpeak, setAutoSpeak] = useState(true);

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingLangHint, setRecordingLangHint] = useState<DirectionMode>('auto');
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [isLiveSpeechMode, setIsLiveSpeechMode] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [offlineSuggestions, setOfflineSuggestions] = useState<OfflinePhraseEntry[]>([]);

  // Playback / save feedback
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [savedIds, setSavedIds] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Translation result & history
  const [history, setHistory] = useState<TranslationEntry[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const saved = localStorage.getItem(HISTORY_STORAGE_KEY);
      return saved ? (JSON.parse(saved) as TranslationEntry[]) : [];
    } catch {
      return [];
    }
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recognitionRef = useRef<{ stop: () => void; abort: () => void } | null>(null);
  const liveTranscriptRef = useRef<string>('');
  const audioChunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const levelIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserActiveRef = useRef<boolean>(false);
  const peakLevelRef = useRef<number>(0);
  const heardSpeechRef = useRef<boolean>(false);
  const silenceStartRef = useRef<number | null>(null);
  const speechRecUnavailableRef = useRef<boolean>(false);

  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history.slice(0, 20)));
    } catch {
      // ignore storage quota errors
    }
  }, [history]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (levelIntervalRef.current) clearInterval(levelIntervalRef.current);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const currentResult = history[0] || null;

  const handlePlay = async (text: string, lang: 'en' | 'ru', slow: boolean, id: string) => {
    sfx.playClick();
    await playNaturalSpeech(
      text,
      lang,
      slow,
      () => setSpeakingId(id),
      () => setSpeakingId((curr) => (curr === id ? null : curr))
    );
  };

  const processTranslationResult = (data: Omit<TranslationEntry, 'id' | 'timestamp'>) => {
    const entry: TranslationEntry = {
      ...data,
      id: `tr-${Date.now()}`,
      timestamp: Date.now(),
    };
    setHistory((prev) => [entry, ...prev].slice(0, 20));
    sfx.playCorrect();
    addXP(10);

    if (autoSpeak && entry.translatedText) {
      handlePlay(
        entry.translatedText,
        entry.targetLang,
        state.slowSpeech,
        entry.id
      );
    }
  };

  const tryOfflineTranslate = (trimmed: string, dir: DirectionMode): boolean => {
    const { result, suggestions } = findOfflineTranslation(
      trimmed,
      dir,
      state.flashcards,
      history
    );
    if (result) {
      setOfflineSuggestions([]);
      processTranslationResult(result);
      setInputText('');
      return true;
    }
    setOfflineSuggestions(
      suggestions.length > 0 ? suggestions : getOfflineQuickSuggestions(4)
    );
    sfx.playError();
    setErrorMsg(
      'Нет интернета, а точной фразы нет во встроенном офлайн-словаре. Выберите похожую фразу ниже или подключите сеть для свободного перевода.'
    );
    return false;
  };

  const translateText = async (textToTranslate: string, overrideDir?: DirectionMode) => {
    const trimmed = textToTranslate.trim();
    if (!trimmed || isTranslating) return;

    const effectiveDir = overrideDir || direction;
    setErrorMsg(null);
    setOfflineSuggestions([]);

    if (isFileProtocol || !isOnline || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      tryOfflineTranslate(trimmed, effectiveDir);
      return;
    }

    setIsTranslating(true);

    try {
      const res = await fetch('/api/translate-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(18000),
        body: JSON.stringify({
          text: trimmed,
          direction: effectiveDir,
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (res.status === 404 || res.status === 405 || !contentType.includes('application/json')) {
        tryOfflineTranslate(trimmed, effectiveDir);
        return;
      }

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Не удалось выполнить перевод');
      }

      processTranslationResult(data);
      setInputText('');
    } catch (err) {
      const isNetworkFailure =
        err instanceof TypeError ||
        (typeof navigator !== 'undefined' && !navigator.onLine);
      if (isNetworkFailure) {
        tryOfflineTranslate(trimmed, effectiveDir);
        return;
      }

      sfx.playError();
      const isTimeout = err instanceof DOMException && err.name === 'TimeoutError';
      setErrorMsg(
        isTimeout
          ? 'Сервер перевода отвечает слишком долго. Попробуйте еще раз.'
          : err instanceof Error
            ? err.message
            : 'Ошибка соединения с переводчиком. Проверьте интернет.'
      );
    } finally {
      setIsTranslating(false);
    }
  };

  const startMediaRecorder = async (dirHint: DirectionMode) => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setErrorMsg(
        'Запись с микрофона не поддерживается в этом браузере. Используйте ввод текста ниже.'
      );
      return;
    }

    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            channelCount: 1,
          },
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      }
      streamRef.current = stream;

      const mimeType = getSupportedAudioMimeType();
      let recorder: MediaRecorder;
      try {
        recorder = new MediaRecorder(stream, {
          mimeType,
          audioBitsPerSecond: 16000,
        });
      } catch {
        recorder = new MediaRecorder(stream, { mimeType });
      }
      audioChunksRef.current = [];
      mediaRecorderRef.current = recorder;
      peakLevelRef.current = 0;
      analyserActiveRef.current = false;
      heardSpeechRef.current = false;
      silenceStartRef.current = null;
      setIsLiveSpeechMode(false);
      setLiveTranscript('');

      // Monitor microphone volume level + VAD auto-stop on ~1.05s pause after speaking
      try {
        const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtxClass) {
          const audioCtx = new AudioCtxClass();
          audioCtxRef.current = audioCtx;
          if (audioCtx.state === 'suspended') {
            audioCtx.resume().catch(() => {});
          }
          const source = audioCtx.createMediaStreamSource(stream);
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 256;
          source.connect(analyser);
          const dataArray = new Uint8Array(analyser.fftSize);

          levelIntervalRef.current = setInterval(() => {
            if (audioCtx.state !== 'running') return;
            analyserActiveRef.current = true;
            analyser.getByteTimeDomainData(dataArray);
            let sum = 0;
            for (let i = 0; i < dataArray.length; i++) {
              const v = (dataArray[i] - 128) / 128;
              sum += v * v;
            }
            const rms = Math.sqrt(sum / dataArray.length);
            if (rms > peakLevelRef.current) {
              peakLevelRef.current = rms;
            }
            setAudioLevel(Math.min(100, Math.round(rms * 400)));

            // Voice activity detection for snappy auto-stop
            if (rms > 0.015) {
              heardSpeechRef.current = true;
              silenceStartRef.current = null;
            } else if (heardSpeechRef.current && rms < 0.009) {
              if (!silenceStartRef.current) {
                silenceStartRef.current = Date.now();
              } else if (Date.now() - silenceStartRef.current > 1050) {
                stopRecording();
              }
            }
          }, 80);
        }
      } catch {
        analyserActiveRef.current = false;
      }

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        if (levelIntervalRef.current) {
          clearInterval(levelIntervalRef.current);
          levelIntervalRef.current = null;
        }
        if (audioCtxRef.current) {
          audioCtxRef.current.close().catch(() => {});
          audioCtxRef.current = null;
        }
        setAudioLevel(0);
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;

        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        if (blob.size < 400) {
          setErrorMsg('Запись слишком короткая. Нажмите на микрофон и произнесите фразу целиком.');
          return;
        }
        if (analyserActiveRef.current && peakLevelRef.current < 0.003) {
          setErrorMsg('Микрофон не уловил звук. Проверьте, не выключен ли микрофон, и скажите фразу громче.');
          return;
        }

        setIsTranslating(true);
        try {
          const base64Audio = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const resultStr = reader.result as string;
              const commaIndex = resultStr.indexOf(',');
              resolve(commaIndex >= 0 ? resultStr.slice(commaIndex + 1) : resultStr);
            };
            reader.onerror = () => reject(new Error('Ошибка чтения аудио'));
            reader.readAsDataURL(blob);
          });

          const cleanMime = mimeType.split(';')[0] || 'audio/webm';

          const res = await fetch('/api/translate-voice', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: AbortSignal.timeout(22000),
            body: JSON.stringify({
              audioBase64: base64Audio,
              mimeType: cleanMime,
              direction: dirHint,
            }),
          });

          const data = await res.json();
          if (!res.ok) {
            let errText = data.error || 'Не удалось распознать речь';
            if (typeof errText === 'string' && errText.startsWith('{')) {
              try {
                const parsedErr = JSON.parse(errText);
                errText = parsedErr?.error?.message || errText;
              } catch {
                // keep raw string
              }
            }
            throw new Error(errText);
          }

          processTranslationResult(data);
        } catch (err) {
          sfx.playError();
          const isTimeout = err instanceof DOMException && err.name === 'TimeoutError';
          setErrorMsg(
            isTimeout
              ? 'Распознавание заняло слишком много времени. Попробуйте сказать фразу короче или еще раз.'
              : err instanceof Error
                ? err.message
                : 'Не удалось распознать и перевести речь. Попробуйте еще раз.'
          );
        } finally {
          setIsTranslating(false);
        }
      };

      recorder.start();
      setRecordingLangHint(dirHint);
      setRecordingSeconds(0);
      setIsRecording(true);

      timerRef.current = setInterval(() => {
        setRecordingSeconds((s) => {
          if (s >= 29) {
            stopRecording();
            return 30;
          }
          return s + 1;
        });
      }, 1000);
    } catch (err) {
      sfx.playError();
      setErrorMsg(
        'Доступ к микрофону запрещен. Разрешите доступ к микрофону в настройках браузера или введите текст вручную.'
      );
      console.warn('Mic permission error:', err);
    }
  };

  const startRecording = async (dirHint: DirectionMode) => {
    if (isRecording || isTranslating) return;
    setErrorMsg(null);
    setOfflineSuggestions([]);
    sfx.playClick();

    // Use instant live SpeechRecognition when language is explicit (RU or EN) and browser supports it
    const SpeechRecCtor =
      typeof window !== 'undefined'
        ? (window as unknown as {
            SpeechRecognition?: new () => {
              lang: string;
              interimResults: boolean;
              continuous: boolean;
              maxAlternatives: number;
              onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
              onerror: ((e: { error: string }) => void) | null;
              onend: (() => void) | null;
              start: () => void;
              stop: () => void;
              abort: () => void;
            };
            webkitSpeechRecognition?: new () => {
              lang: string;
              interimResults: boolean;
              continuous: boolean;
              maxAlternatives: number;
              onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
              onerror: ((e: { error: string }) => void) | null;
              onend: (() => void) | null;
              start: () => void;
              stop: () => void;
              abort: () => void;
            };
          }).SpeechRecognition ||
          (window as unknown as { webkitSpeechRecognition?: new () => never }).webkitSpeechRecognition
        : undefined;

    if (SpeechRecCtor && dirHint !== 'auto' && !speechRecUnavailableRef.current) {
      try {
        const recognition = new SpeechRecCtor();
        recognition.lang = dirHint === 'ru-en' ? 'ru-RU' : 'en-US';
        recognition.interimResults = true;
        recognition.continuous = false;
        recognition.maxAlternatives = 1;

        let settled = false;
        liveTranscriptRef.current = '';
        setLiveTranscript('');
        setIsLiveSpeechMode(true);
        setRecordingLangHint(dirHint);
        setRecordingSeconds(0);
        setIsRecording(true);
        recognitionRef.current = recognition;

        timerRef.current = setInterval(() => {
          setRecordingSeconds((s) => s + 1);
        }, 1000);

        recognition.onresult = (event) => {
          let full = '';
          let hasFinal = false;
          for (let i = 0; i < event.results.length; i++) {
            const res = event.results[i];
            if (res[0]?.transcript) {
              full += res[0].transcript + ' ';
            }
            if (res.isFinal) hasFinal = true;
          }
          const cleaned = full.trim();
          liveTranscriptRef.current = cleaned;
          setLiveTranscript(cleaned);

          if (hasFinal && cleaned && !settled) {
            settled = true;
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }
            setIsRecording(false);
            setIsLiveSpeechMode(false);
            recognitionRef.current = null;
            translateText(cleaned, dirHint);
          }
        };

        recognition.onerror = (event) => {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          setIsRecording(false);
          setIsLiveSpeechMode(false);
          recognitionRef.current = null;

          if (event.error === 'not-allowed' || event.error === 'permission-denied') {
            sfx.playError();
            setErrorMsg(
              'Доступ к микрофону запрещен. Разрешите доступ к микрофону в настройках браузера.'
            );
            settled = true;
            return;
          }

          // Remember broken browser speech service (e.g. blocked/offline) and fallback cleanly to MediaRecorder
          if (event.error === 'network' || event.error === 'service-not-allowed' || event.error === 'language-not-supported') {
            speechRecUnavailableRef.current = true;
          }
          if (!settled && event.error !== 'aborted') {
            settled = true;
            if (liveTranscriptRef.current.trim()) {
              translateText(liveTranscriptRef.current.trim(), dirHint);
            } else if (event.error === 'no-speech') {
              sfx.playError();
              setErrorMsg('Не удалось расслышать речь. Попробуйте сказать чуть громче и ближе к микрофону.');
            } else if (isFileProtocol || !isOnline || (typeof navigator !== 'undefined' && !navigator.onLine)) {
              sfx.playError();
              setOfflineSuggestions(getOfflineQuickSuggestions(4));
              setErrorMsg(
                'Голосовой ввод недоступен в автономном режиме. Введите фразу текстом или выберите из офлайн-разговорника ниже.'
              );
            } else {
              startMediaRecorder(dirHint);
            }
          }
        };

        recognition.onend = () => {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          setIsRecording(false);
          setIsLiveSpeechMode(false);
          recognitionRef.current = null;

          if (!settled) {
            settled = true;
            const finalStr = liveTranscriptRef.current.trim();
            if (finalStr) {
              translateText(finalStr, dirHint);
            } else {
              setErrorMsg('Не удалось расслышать речь. Попробуйте сказать чуть громче и ближе к микрофону.');
            }
          }
        };

        recognition.start();
        return;
      } catch {
        setIsRecording(false);
        setIsLiveSpeechMode(false);
      }
    }

    if (isFileProtocol || !isOnline || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      sfx.playError();
      setOfflineSuggestions(getOfflineQuickSuggestions(4));
      setErrorMsg(
        'Распознавание живой речи с микрофона требует интернет. В автономном режиме пользуйтесь текстовым вводом и быстрыми фразами ниже.'
      );
      return;
    }

    await startMediaRecorder(dirHint);
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      sfx.playClick();
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      return;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      sfx.playClick();
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleSaveEntry = (entry: TranslationEntry) => {
    sfx.playCorrect();
    const enText = entry.sourceLang === 'en' ? entry.sourceText : entry.translatedText;
    const ruText = entry.sourceLang === 'ru' ? entry.sourceText : entry.translatedText;
    addCustomFlashcard(enText, ruText, entry.phoneticRu, entry.usageTipRu);
    setSavedIds((prev) => ({ ...prev, [entry.id]: true }));
  };

  const handleCopy = async (text: string, id: string) => {
    sfx.playClick();
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1800);
    } catch {
      // ignore clipboard restriction
    }
  };

  const clearHistory = () => {
    sfx.playClick();
    setHistory([]);
    localStorage.removeItem(HISTORY_STORAGE_KEY);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 pb-24 space-y-5">
      {/* Header Card */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
              <Languages className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Голосовой переводчик RU ⇄ EN
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Говорите по-русски или по-английски — переводит, озвучивает и учит
              </p>
            </div>
          </div>

          <button
            onClick={() => {
              sfx.playClick();
              setAutoSpeak(!autoSpeak);
            }}
            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-bold border transition-all shrink-0 flex items-center gap-1 ${
              autoSpeak
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-slate-50 border-slate-200 text-slate-500'
            }`}
            title="Автоматически озвучивать перевод"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{autoSpeak ? 'Авто-голос' : 'Без голоса'}</span>
          </button>
        </div>

        {/* Direction Mode Pills */}
        <div className="grid grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-2xl">
          {[
            { id: 'auto', label: 'Авто (RU ⇄ EN)' },
            { id: 'ru-en', label: '🇷🇺 ➔ 🇬🇧' },
            { id: 'en-ru', label: '🇬🇧 ➔ 🇷🇺' },
          ].map((item) => {
            const active = direction === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  sfx.playClick();
                  setDirection(item.id as DirectionMode);
                }}
                className={`py-2 px-2 rounded-xl text-xs font-extrabold transition-all ${
                  active
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Voice Controls Zone */}
        {isRecording ? (
          <div className="py-5 px-4 rounded-3xl bg-gradient-to-br from-indigo-600 to-indigo-700 text-white text-center space-y-3 shadow-lg">
            <div className="flex items-center justify-center gap-2 text-xs font-bold text-indigo-100">
              <span className="w-2.5 h-2.5 rounded-full bg-red-400 animate-ping" />
              <span>
                {recordingLangHint === 'ru-en'
                  ? 'Слушаю русскую речь...'
                  : recordingLangHint === 'en-ru'
                    ? 'Слушаю английскую речь...'
                    : 'Слушаю... говорите на русском или английском'}
              </span>
              <span className="font-mono bg-white/15 px-2 py-0.5 rounded-full">
                00:{recordingSeconds.toString().padStart(2, '0')}
              </span>
            </div>

            <button
              onClick={stopRecording}
              className="mx-auto w-20 h-20 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-xl ring-8 ring-white/20 animate-pulse active:scale-95 transition-all"
              aria-label="Остановить запись"
            >
              <Square className="w-8 h-8 fill-white" />
            </button>

            {/* Live transcript or microphone volume bar */}
            {isLiveSpeechMode ? (
              <div className="max-w-sm mx-auto bg-white/10 rounded-2xl px-3.5 py-2.5 text-sm font-bold text-white min-h-[40px] flex items-center justify-center">
                {liveTranscript ? `«${liveTranscript}»` : 'Говорите, слова появятся мгновенно...'}
              </div>
            ) : (
              <div className="max-w-[200px] mx-auto bg-white/15 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-400 h-full rounded-full transition-all duration-75"
                  style={{ width: `${Math.max(8, audioLevel)}%` }}
                />
              </div>
            )}

            <p className="text-xs font-bold text-indigo-100">
              {isLiveSpeechMode
                ? 'Остановится автоматически после фразы (или нажмите стоп)'
                : 'Остановится автоматически после паузы (или нажмите стоп)'}
            </p>
          </div>
        ) : isTranslating ? (
          <div className="py-8 px-4 rounded-3xl bg-slate-50 border border-slate-200 text-center space-y-2.5">
            <Loader2 className="w-9 h-9 text-emerald-600 animate-spin mx-auto" />
            <p className="text-sm font-extrabold text-slate-900">
              Распознаём и переводим живую речь...
            </p>
            <p className="text-xs text-slate-500 font-medium">
              Подбираем естественную фразу и русскую транскрипцию
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Dual Quick Conversation Buttons + Auto Mic */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                onClick={() => startRecording('ru-en')}
                className="btn-tactile-secondary p-4 rounded-2xl flex flex-col items-center justify-center gap-1.5 text-center"
              >
                <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center">
                  <Mic className="w-6 h-6" />
                </div>
                <span className="text-xs sm:text-sm font-extrabold">Я говорю (RU)</span>
                <span className="text-[10px] text-indigo-100 font-medium">
                  Переведёт на английский
                </span>
              </button>

              <button
                onClick={() => startRecording('en-ru')}
                className="btn-tactile-primary p-4 rounded-2xl flex flex-col items-center justify-center gap-1.5 text-center"
              >
                <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center">
                  <Mic className="w-6 h-6" />
                </div>
                <span className="text-xs sm:text-sm font-extrabold">Собеседник (EN)</span>
                <span className="text-[10px] text-emerald-100 font-medium">
                  Переведёт на русский
                </span>
              </button>
            </div>

            {direction === 'auto' && (
              <button
                onClick={() => startRecording('auto')}
                className="btn-tactile-neutral w-full py-2.5 px-4 rounded-2xl flex items-center justify-center gap-2 text-xs font-extrabold text-slate-800"
              >
                <ArrowLeftRight className="w-4 h-4 text-indigo-600" />
                <span>Авто-режим: сказать на любом языке (RU / EN)</span>
              </button>
            )}
          </div>
        )}

        {/* Text Input Fallback / Manual Typing */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            translateText(inputText);
          }}
          className="flex items-center gap-2 pt-1"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Или напишите фразу по-русски или по-английски..."
            disabled={isTranslating || isRecording}
            className="flex-1 px-4 py-3 rounded-2xl bg-slate-50 border-2 border-slate-200 text-xs sm:text-sm font-semibold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isTranslating || isRecording}
            className="btn-tactile-primary px-4 py-3 rounded-2xl flex items-center justify-center shrink-0"
            title="Перевести"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

        {/* Offline Mode Helper Banner */}
        {!isOnline && (
          <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-center gap-2.5 text-xs font-semibold">
            <WifiOff className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Без интернета работает встроенный <span className="font-extrabold">офлайн-разговорник</span> (фразы уроков, ваш словарь и быстрые фразы) с озвучкой.
            </span>
          </div>
        )}

        {/* Quick Tap Phrases for Russians */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {QUICK_PHRASES_RU.map((phrase) => (
            <button
              key={phrase}
              onClick={() => {
                sfx.playClick();
                translateText(phrase, 'ru-en');
              }}
              disabled={isTranslating || isRecording}
              className="px-3 py-1.5 rounded-full bg-slate-100 hover:bg-indigo-50 hover:text-indigo-800 text-[11px] font-bold text-slate-600 whitespace-nowrap transition-colors border border-slate-200"
            >
              {phrase}
            </button>
          ))}
        </div>
      </div>

      {/* Error Message Banner + Offline Phrase Suggestions */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-50 border-2 border-red-200 text-red-900 space-y-3 animate-in fade-in">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="text-xs font-semibold leading-relaxed">{errorMsg}</div>
          </div>

          {offlineSuggestions.length > 0 && (
            <div className="pt-2 border-t border-red-200/70 space-y-1.5">
              <span className="text-[11px] font-extrabold text-red-800 flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5" />
                Похожие фразы в офлайн-словаре:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {offlineSuggestions.map((s) => (
                  <button
                    key={`${s.en}-${s.ru}`}
                    onClick={() => {
                      sfx.playClick();
                      translateText(s.ru, 'ru-en');
                    }}
                    className="px-2.5 py-1.5 rounded-xl bg-white border border-red-200 hover:border-indigo-300 text-left text-[11px] font-bold text-slate-800 transition-colors"
                  >
                    {s.ru}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Latest Translation Result Card */}
      {currentResult && (
        <div className="bg-white rounded-3xl p-5 border-2 border-emerald-200 shadow-md space-y-4 animate-in fade-in slide-in-from-bottom-2">
          {/* Top badges */}
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                {currentResult.sourceLang === 'ru'
                  ? '🇷🇺 Русский ➔ 🇬🇧 Английский'
                  : '🇬🇧 Английский ➔ 🇷🇺 Русский'}
              </span>
              {currentResult.fromOffline && (
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                  <BookOpen className="w-3 h-3" />
                  Офлайн-словарь
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => handleCopy(currentResult.translatedText, currentResult.id)}
                className="p-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-800 text-xs"
                title="Скопировать перевод"
              >
                {copiedId === currentResult.id ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Source phrase */}
          <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-start justify-between gap-2">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Вы сказали ({currentResult.sourceLang === 'ru' ? 'Русский' : 'English'}):
              </span>
              <p className="text-sm font-bold text-slate-700 mt-0.5">
                {currentResult.sourceText}
              </p>
            </div>
            <button
              onClick={() =>
                handlePlay(
                  currentResult.sourceText,
                  currentResult.sourceLang,
                  false,
                  `${currentResult.id}-src`
                )
              }
              className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 shrink-0"
              title="Озвучить оригинал"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>

          {/* Target Translation */}
          <div className="space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
              Перевод ({currentResult.targetLang === 'en' ? 'English' : 'Русский'}):
            </span>

            <p className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
              {currentResult.translatedText}
            </p>

            {/* Cyrillic Phonetics for English phrase */}
            {currentResult.phoneticRu && (
              <p className="text-sm font-bold text-indigo-600">
                🗣️ Читается: {currentResult.phoneticRu}
              </p>
            )}

            {/* Playback & Save Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <button
                onClick={() =>
                  handlePlay(
                    currentResult.translatedText,
                    currentResult.targetLang,
                    false,
                    currentResult.id
                  )
                }
                className={`btn-tactile-secondary px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 ${
                  speakingId === currentResult.id ? 'animate-pulse' : ''
                }`}
              >
                <Volume2 className="w-4 h-4" />
                <span>Озвучить</span>
              </button>

              {currentResult.targetLang === 'en' && (
                <button
                  onClick={() =>
                    handlePlay(
                      currentResult.translatedText,
                      'en',
                      true,
                      `${currentResult.id}-slow`
                    )
                  }
                  className="px-3 py-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 text-xs font-bold flex items-center gap-1"
                  title="Послушать медленно по слогам"
                >
                  <Snail className="w-3.5 h-3.5" />
                  <span>Медленно</span>
                </button>
              )}

              <button
                onClick={() => handleSaveEntry(currentResult)}
                disabled={!!savedIds[currentResult.id]}
                className={`ml-auto px-3.5 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                  savedIds[currentResult.id]
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'btn-tactile-neutral text-slate-800'
                }`}
              >
                {savedIds[currentResult.id] ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>В словаре!</span>
                  </>
                ) : (
                  <>
                    <BookmarkPlus className="w-4 h-4 text-indigo-600" />
                    <span>В словарь</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Usage Tip in Russian */}
          {currentResult.usageTipRu && (
            <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-xs text-indigo-950 font-medium leading-relaxed">
              💡 <span className="font-extrabold">Подсказка:</span> {currentResult.usageTipRu}
            </div>
          )}

          {/* Alternative Phrasings */}
          {currentResult.alternatives.length > 0 && (
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Другие естественные варианты:
              </span>
              <div className="space-y-1.5">
                {currentResult.alternatives.map((alt, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-2"
                  >
                    <div>
                      <p className="text-xs font-extrabold text-slate-900">{alt.text}</p>
                      <p className="text-[11px] text-slate-500 font-medium">{alt.noteRu}</p>
                    </div>
                    <button
                      onClick={() =>
                        handlePlay(
                          alt.text,
                          currentResult.targetLang,
                          state.slowSpeech,
                          `${currentResult.id}-alt-${i}`
                        )
                      }
                      className="p-1.5 rounded-lg bg-white border border-slate-200 text-slate-600 hover:text-indigo-600 shrink-0"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* History of Recent Translations */}
      {history.length > 1 && (
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">
              Недавние переводы ({history.length - 1})
            </h3>
            <button
              onClick={clearHistory}
              className="text-xs font-bold text-slate-400 hover:text-red-600 flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Очистить</span>
            </button>
          </div>

          <div className="space-y-2">
            {history.slice(1).map((item) => (
              <div
                key={item.id}
                className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-500 truncate">
                    {item.sourceText}
                  </p>
                  <p className="text-sm font-extrabold text-slate-900 truncate">
                    {item.translatedText}
                  </p>
                  {item.phoneticRu && (
                    <p className="text-[11px] font-semibold text-indigo-600 truncate">
                      {item.phoneticRu}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() =>
                      handlePlay(item.translatedText, item.targetLang, state.slowSpeech, item.id)
                    }
                    className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-indigo-600"
                    title="Озвучить"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleSaveEntry(item)}
                    disabled={!!savedIds[item.id]}
                    className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:text-emerald-600"
                    title="В словарь"
                  >
                    {savedIds[item.id] ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <BookmarkPlus className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

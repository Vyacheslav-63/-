import { DIALOGUES, INITIAL_FLASHCARDS, SPEECH_PATTERNS } from '../data/lessonsData';
import type { FlashcardItem } from '../types';

export interface OfflinePhraseEntry {
  en: string;
  ru: string;
  phoneticRu: string;
  tipRu: string;
}

export interface OfflineTranslationResult {
  sourceLang: 'ru' | 'en';
  targetLang: 'en' | 'ru';
  sourceText: string;
  translatedText: string;
  phoneticRu: string;
  usageTipRu: string;
  alternatives: Array<{ text: string; noteRu: string }>;
  fromOffline: true;
}

const BUILTIN_PHRASES: OfflinePhraseEntry[] = [
  // Quick phrases & core travel
  {
    en: 'Where is the nearest metro station?',
    ru: 'Где здесь ближайшее метро?',
    phoneticRu: '[Уэ́а из зэ ни́рэст мэ́троу стэ́йшн?]',
    tipRu: 'В Лондоне вместо metro часто говорят Underground или Tube, в Нью-Йорке — subway.',
  },
  {
    en: 'Could I have the check, please?',
    ru: 'Можно мне счёт, пожалуйста?',
    phoneticRu: '[Куд ай хэв зэ чек, плиз?]',
    tipRu: 'В США просят check, а в Великобритании чаще говорят bill.',
  },
  {
    en: 'I have a nut allergy.',
    ru: 'У меня аллергия на орехи.',
    phoneticRu: '[Ай хэв э нат э́лэджи.]',
    tipRu: 'Обязательно скажите это официанту до заказа.',
  },
  {
    en: 'How much is this jacket?',
    ru: 'Сколько стоит эта куртка?',
    phoneticRu: '[Ха́у мач из зис джэ́кит?]',
    tipRu: 'Слово jacket можно заменить на shirt (рубашка), dress (платье) или this (это).',
  },
  {
    en: "I don't speak English well, could you speak slower please?",
    ru: 'Я не говорю по-английски, говорите медленнее.',
    phoneticRu: '[Ай донт спик и́нглиш уэ́л, куд ю спик сло́уэ плиз?]',
    tipRu: 'Вежливая просьба сразу располагает собеседника к помощи.',
  },
  // Greetings & Basics
  {
    en: 'Hello! How are you?',
    ru: 'Привет! Как дела?',
    phoneticRu: '[Хэло́у! Ха́у а ю?]',
    tipRu: 'Универсальное приветствие для знакомых и новых людей.',
  },
  {
    en: 'Good morning!',
    ru: 'Доброе утро!',
    phoneticRu: '[Гуд мо́рнин!]',
    tipRu: 'Используется до 12:00 дня.',
  },
  {
    en: 'Good evening!',
    ru: 'Добрый вечер!',
    phoneticRu: '[Гуд и́внин!]',
    tipRu: 'Вежливое приветствие после 17:00–18:00.',
  },
  {
    en: 'Thank you very much!',
    ru: 'Большое спасибо!',
    phoneticRu: '[Сэ́нкью ве́ри мач!]',
    tipRu: 'На спасибо часто отвечают «You’re welcome!» (пожалуйста).',
  },
  {
    en: "You're welcome!",
    ru: 'Пожалуйста (не за что)!',
    phoneticRu: '[Ю́а уэ́лкам!]',
    tipRu: 'Стандартный ответ на благодарность.',
  },
  {
    en: 'Excuse me, can you help me?',
    ru: 'Извините, вы не могли бы мне помочь?',
    phoneticRu: '[Икскью́з ми, кэн ю хэлп ми?]',
    tipRu: 'Excuse me используют, чтобы привлечь внимание прохожего или официанта.',
  },
  {
    en: "I'm sorry, I didn't understand.",
    ru: 'Извините, я не понял.',
    phoneticRu: '[Айм со́ри, ай ди́днт андэстэ́нд.]',
    tipRu: 'Можно сразу добавить «Could you repeat that?» (Не могли бы вы повторить?).',
  },
  {
    en: 'Yes, please.',
    ru: 'Да, пожалуйста.',
    phoneticRu: '[Ес, плиз.]',
    tipRu: 'Вежливое согласие на предложение в кафе, самолёте или магазине.',
  },
  {
    en: 'No, thank you.',
    ru: 'Нет, спасибо.',
    phoneticRu: '[Но́у, сэ́нкью.]',
    tipRu: 'Вежливый отказ от пакета, чека или доп. услуг.',
  },
  {
    en: 'Have a nice day!',
    ru: 'Хорошего дня!',
    phoneticRu: '[Хэв э найс дэй!]',
    tipRu: 'Очень популярное прощание в магазинах и кофейнях.',
  },
  {
    en: 'See you later!',
    ru: 'Увидимся позже!',
    phoneticRu: '[Си ю лэ́йтэ!]',
    tipRu: 'Дружелюбное прощание со знакомыми.',
  },
  // Cafe & Food
  {
    en: 'Can I have a cup of coffee, please?',
    ru: 'Можно мне чашку кофе, пожалуйста?',
    phoneticRu: '[Кэн ай хэв э кап ов ко́фи, плиз?]',
    tipRu: '«Can I have...» — самый естественный способ сделать заказ.',
  },
  {
    en: 'Water without gas, please.',
    ru: 'Воду без газа, пожалуйста.',
    phoneticRu: '[Уо́тэ уиза́ут гэс, плиз.]',
    tipRu: 'Носители также часто говорят «still water» (без газа) и «sparkling water» (с газом).',
  },
  {
    en: 'For here or to go?',
    ru: 'Здесь или с собой?',
    phoneticRu: '[Фо хи́а о ту го́у?]',
    tipRu: 'Так часто спрашивает бариста в кофейне.',
  },
  {
    en: 'To go, please.',
    ru: 'С собой, пожалуйста.',
    phoneticRu: '[Ту го́у, плиз.]',
    tipRu: 'В Великобритании также говорят «takeaway».',
  },
  {
    en: 'Can I pay by card?',
    ru: 'Можно оплатить картой?',
    phoneticRu: '[Кэн ай пэй бай кард?]',
    tipRu: 'Наличными — «by cash» или «in cash».',
  },
  {
    en: 'The menu, please.',
    ru: 'Меню, пожалуйста.',
    phoneticRu: '[Зэ мэ́нью, плиз.]',
    tipRu: 'Полная вежливая фраза: «Could I see the menu, please?»',
  },
  {
    en: 'It was delicious!',
    ru: 'Было очень вкусно!',
    phoneticRu: '[Ит уо́з дили́шэс!]',
    tipRu: 'Приятный комплимент официанту после еды.',
  },
  // Airport, Hotel & Transport
  {
    en: 'Where is the check-in counter?',
    ru: 'Где стойка регистрации?',
    phoneticRu: '[Уэ́а из зэ чек-и́н ка́унтэ?]',
    tipRu: 'В аэропорту полезно иметь под рукой номер рейса (flight number).',
  },
  {
    en: 'Where is the boarding gate?',
    ru: 'Где выход на посадку?',
    phoneticRu: '[Уэ́а из зэ бо́рдин гэйт?]',
    tipRu: 'Номер выхода указан на посадочном талоне (boarding pass) как Gate.',
  },
  {
    en: 'Where is the baggage claim?',
    ru: 'Где получение багажа?',
    phoneticRu: '[Уэ́а из зэ бэ́гидж клэйм?]',
    tipRu: 'Ищите указатели «Baggage Claim» или «Arrivals».',
  },
  {
    en: 'I have a reservation.',
    ru: 'У меня есть бронь.',
    phoneticRu: '[Ай хэв э рэзэрвэ́йшн.]',
    tipRu: 'Скажите это на стойке регистрации в отеле или ресторане.',
  },
  {
    en: 'What is the Wi-Fi password?',
    ru: 'Какой пароль от вай-фая?',
    phoneticRu: '[Уо́т из зэ уа́й-фа́й пэ́суорд?]',
    tipRu: 'Часто пароль пишут на ключе от номера или чеке.',
  },
  {
    en: 'At what time is check-out?',
    ru: 'Во сколько выезд из отеля?',
    phoneticRu: '[Эт уо́т тайм из чек-а́ут?]',
    tipRu: 'Заселение — check-in, выселение — check-out.',
  },
  {
    en: 'Take me to this address, please.',
    ru: 'Отвезите меня по этому адресу, пожалуйста.',
    phoneticRu: '[Тэйк ми ту зис э́дрэс, плиз.]',
    tipRu: 'Удобно показать экран телефона с адресом водителю такси.',
  },
  {
    en: 'How long does it take?',
    ru: 'Сколько времени это займёт?',
    phoneticRu: '[Ха́у лонг даз ит тэйк?]',
    tipRu: 'Универсальный вопрос про дорогу, ожидание заказа или очередь.',
  },
  // City & Directions
  {
    en: 'Where is the restroom?',
    ru: 'Где здесь туалет?',
    phoneticRu: '[Уэ́а из зэ рэ́струм?]',
    tipRu: 'В США говорят restroom, в Европе чаще toilet или WC.',
  },
  {
    en: 'Go straight ahead and turn left.',
    ru: 'Идите прямо и поверните налево.',
    phoneticRu: '[Го́у стрэ́йт эхэ́д энд тёрн лэфт.]',
    tipRu: 'Направо — «turn right».',
  },
  {
    en: 'Is it far from here?',
    ru: 'Это далеко отсюда?',
    phoneticRu: '[Из ит фар фром хи́а?]',
    tipRu: 'Можно уточнить: «Can I walk there?» (Туда можно дойти пешком?).',
  },
  {
    en: 'I am lost.',
    ru: 'Я заблудился.',
    phoneticRu: '[Ай эм лост.]',
    tipRu: 'После этого удобно показать нужную точку на карте.',
  },
  // Shopping
  {
    en: 'How much is this?',
    ru: 'Сколько это стоит?',
    phoneticRu: '[Ха́у мач из зис?]',
    tipRu: 'Для множественного числа: «How much are these?».',
  },
  {
    en: 'Can I try this on?',
    ru: 'Можно это примерить?',
    phoneticRu: '[Кэн ай трай зис он?]',
    tipRu: 'Примерочная называется «fitting room» или «changing room».',
  },
  {
    en: 'Do you have a larger size?',
    ru: 'У вас есть размер побольше?',
    phoneticRu: '[Ду ю хэв э ла́рджэ сайз?]',
    tipRu: 'Поменьше — «a smaller size».',
  },
  {
    en: "I'm just looking, thank you.",
    ru: 'Я просто смотрю, спасибо.',
    phoneticRu: '[Айм джаст лу́кин, сэ́нкью.]',
    tipRu: 'Вежливый ответ продавцу, когда помощь пока не нужна.',
  },
  // Health & Emergency
  {
    en: 'Where is the nearest pharmacy?',
    ru: 'Где ближайшая аптека?',
    phoneticRu: '[Уэ́а из зэ ни́рэст фа́рмаси?]',
    tipRu: 'В Великобритании аптеку также называют chemist.',
  },
  {
    en: 'I have a headache.',
    ru: 'У меня болит голова.',
    phoneticRu: '[Ай хэв э хэ́дэйк.]',
    tipRu: 'Боль в животе — stomachache, зубная боль — toothache.',
  },
  {
    en: 'I need a doctor.',
    ru: 'Мне нужен врач.',
    phoneticRu: '[Ай нид э до́ктэ.]',
    tipRu: 'В экстренных случаях звоните 911 (США) или 112 (Европа).',
  },
  {
    en: 'Call the police, please!',
    ru: 'Пожалуйста, вызовите полицию!',
    phoneticRu: '[Кол зэ поли́с, плиз!]',
    tipRu: 'Критически важная фраза при потере документов или краже.',
  },
  // Time & Connection
  {
    en: 'What time is it?',
    ru: 'Который час?',
    phoneticRu: '[Уо́т тайм из ит?]',
    tipRu: 'Также вежливо: «Could you tell me the time?».',
  },
  {
    en: 'Where can I buy a SIM card?',
    ru: 'Где я могу купить сим-карту?',
    phoneticRu: '[Уэ́а кэн ай бай э сим кард?]',
    tipRu: 'Часто продаются прямо в зоне прилёта аэропорта.',
  },
  {
    en: 'My phone battery is dead.',
    ru: 'У меня разрядился телефон.',
    phoneticRu: '[Май фо́ун бэ́тэри из дэд.]',
    tipRu: 'Попросить зарядку: «Do you have a phone charger?».',
  },
  {
    en: 'What is your name?',
    ru: 'Как вас зовут?',
    phoneticRu: '[Уо́т из ё нэйм?]',
    tipRu: 'Ответ: «My name is...» (Меня зовут...).',
  },
  {
    en: 'Nice to meet you!',
    ru: 'Приятно познакомиться!',
    phoneticRu: '[Найс ту мит ю!]',
    tipRu: 'В ответ говорят «Nice to meet you too!».',
  },
];

function normalizeText(str: string): string {
  return str
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[«»"'`.,!?;:()[\]—–-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function tokenize(str: string): string[] {
  return normalizeText(str)
    .split(' ')
    .filter((w) => w.length >= 2);
}

let cachedBaseCatalog: OfflinePhraseEntry[] | null = null;

function getBaseCatalog(): OfflinePhraseEntry[] {
  if (cachedBaseCatalog) return cachedBaseCatalog;

  const map = new Map<string, OfflinePhraseEntry>();
  const addEntry = (entry: OfflinePhraseEntry) => {
    const en = entry.en.trim();
    const ru = entry.ru.trim();
    if (!en || !ru) return;
    const key = `${normalizeText(en)}::${normalizeText(ru)}`;
    if (!map.has(key)) {
      map.set(key, {
        en,
        ru,
        phoneticRu: entry.phoneticRu.trim(),
        tipRu: entry.tipRu.trim(),
      });
    }
  };

  for (const item of BUILTIN_PHRASES) {
    addEntry(item);
  }

  for (const card of INITIAL_FLASHCARDS) {
    addEntry({
      en: card.phraseEn,
      ru: card.phraseRu,
      phoneticRu: card.phoneticRu,
      tipRu: card.contextRu,
    });
  }

  for (const pattern of Object.values(SPEECH_PATTERNS)) {
    for (const ex of pattern.examples) {
      addEntry({
        en: ex.en,
        ru: ex.ru,
        phoneticRu: ex.phonetic,
        tipRu: pattern.explanationRu,
      });
    }
  }

  for (const dialogue of Object.values(DIALOGUES)) {
    for (const ex of dialogue.exchanges) {
      addEntry({
        en: ex.npcMessage,
        ru: ex.npcMessageRu,
        phoneticRu: ex.phoneticRu,
        tipRu: ex.tipRu || dialogue.contextRu,
      });
      for (const opt of ex.options) {
        addEntry({
          en: opt.textEn,
          ru: opt.textRu,
          phoneticRu: opt.phoneticRu,
          tipRu: opt.feedbackRu,
        });
      }
    }
  }

  cachedBaseCatalog = Array.from(map.values());
  return cachedBaseCatalog;
}

export function getOfflineQuickSuggestions(limit = 8): OfflinePhraseEntry[] {
  return BUILTIN_PHRASES.slice(0, limit);
}

export function findOfflineTranslation(
  query: string,
  direction: 'auto' | 'ru-en' | 'en-ru',
  userFlashcards: FlashcardItem[] = [],
  recentHistory: Array<{
    sourceLang: 'ru' | 'en';
    targetLang: 'en' | 'ru';
    sourceText: string;
    translatedText: string;
    phoneticRu: string;
    usageTipRu: string;
    alternatives: Array<{ text: string; noteRu: string }>;
  }> = []
): { result: OfflineTranslationResult | null; suggestions: OfflinePhraseEntry[] } {
  const trimmed = query.trim();
  const normQuery = normalizeText(trimmed);
  if (!normQuery) {
    return { result: null, suggestions: getOfflineQuickSuggestions(5) };
  }

  const detectedSource: 'ru' | 'en' =
    direction === 'ru-en'
      ? 'ru'
      : direction === 'en-ru'
        ? 'en'
        : /[а-яё]/i.test(trimmed)
          ? 'ru'
          : 'en';
  const targetLang: 'en' | 'ru' = detectedSource === 'ru' ? 'en' : 'ru';

  // 1. Check user's recent online translation history first (exact/near exact)
  for (const h of recentHistory) {
    if (normalizeText(h.sourceText) === normQuery) {
      return {
        result: {
          sourceLang: h.sourceLang,
          targetLang: h.targetLang,
          sourceText: h.sourceText,
          translatedText: h.translatedText,
          phoneticRu: h.phoneticRu,
          usageTipRu: `${h.usageTipRu ? `${h.usageTipRu} ` : ''}(Сохранено в вашей офлайн-истории)`,
          alternatives: h.alternatives || [],
          fromOffline: true,
        },
        suggestions: [],
      };
    }
    if (normalizeText(h.translatedText) === normQuery) {
      return {
        result: {
          sourceLang: h.targetLang,
          targetLang: h.sourceLang,
          sourceText: h.translatedText,
          translatedText: h.sourceText,
          phoneticRu: h.phoneticRu,
          usageTipRu: `${h.usageTipRu ? `${h.usageTipRu} ` : ''}(Сохранено в вашей офлайн-истории)`,
          alternatives: [],
          fromOffline: true,
        },
        suggestions: [],
      };
    }
  }

  // 2. Build merged catalog (user flashcards + built-in phrasebook + lessons)
  const catalog: OfflinePhraseEntry[] = [
    ...userFlashcards.map((c) => ({
      en: c.phraseEn,
      ru: c.phraseRu,
      phoneticRu: c.phoneticRu,
      tipRu: c.contextRu,
    })),
    ...getBaseCatalog(),
  ];

  const queryTokens = tokenize(trimmed);
  const scored: Array<{ entry: OfflinePhraseEntry; score: number }> = [];

  for (const entry of catalog) {
    const srcField = detectedSource === 'ru' ? entry.ru : entry.en;
    const normField = normalizeText(srcField);
    if (!normField) continue;

    let score = 0;
    if (normField === normQuery) {
      score = 100;
    } else if (normField.includes(normQuery) && normQuery.length >= 4) {
      score = 78 + Math.min(18, Math.round((normQuery.length / normField.length) * 20));
    } else if (normQuery.includes(normField) && normField.length >= 4) {
      score = 72 + Math.min(18, Math.round((normField.length / normQuery.length) * 20));
    } else if (queryTokens.length > 0) {
      const fieldTokens = tokenize(srcField);
      if (fieldTokens.length > 0) {
        let hits = 0;
        for (const qt of queryTokens) {
          if (fieldTokens.some((ft) => ft === qt || (qt.length >= 4 && ft.startsWith(qt.slice(0, 4))))) {
            hits += 1;
          }
        }
        if (hits > 0) {
          const union = new Set([...queryTokens, ...fieldTokens]).size;
          const jaccard = hits / Math.max(1, union);
          const coverage = hits / queryTokens.length;
          score = Math.round(coverage * 55 + jaccard * 35);
        }
      }
    }

    if (score > 0) {
      scored.push({ entry, score });
    }
  }

  scored.sort((a, b) => b.score - a.score);

  const best = scored[0];
  if (best && best.score >= 45) {
    const srcMatched = detectedSource === 'ru' ? best.entry.ru : best.entry.en;
    const tgtMatched = detectedSource === 'ru' ? best.entry.en : best.entry.ru;
    const alternatives = scored
      .slice(1, 3)
      .filter((s) => s.score >= 40 && normalizeText(detectedSource === 'ru' ? s.entry.en : s.entry.ru) !== normalizeText(tgtMatched))
      .map((s) => ({
        text: detectedSource === 'ru' ? s.entry.en : s.entry.ru,
        noteRu: `Похожая фраза: «${detectedSource === 'ru' ? s.entry.ru : s.entry.en}»`,
      }));

    return {
      result: {
        sourceLang: detectedSource,
        targetLang,
        sourceText: best.score >= 95 ? trimmed : srcMatched,
        translatedText: tgtMatched,
        phoneticRu: best.entry.phoneticRu,
        usageTipRu: best.entry.tipRu || 'Найдено во встроенном офлайн-разговорнике.',
        alternatives,
        fromOffline: true,
      },
      suggestions: [],
    };
  }

  return {
    result: null,
    suggestions: scored.slice(0, 4).map((s) => s.entry),
  };
}

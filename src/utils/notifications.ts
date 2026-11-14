/**
 * Daily reminders & Web Notifications helper
 */

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch {
    return 'denied';
  }
}

export function getNotificationPermission(): NotificationPermission {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'denied';
  }
  return Notification.permission;
}

export function sendLocalNotification(title: string, body: string, icon = '🔥') {
  if (typeof window === 'undefined') return;

  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      new Notification(`${icon} ${title}`, {
        body,
        icon: '/favicon.ico',
      });
      return;
    } catch {
      // Fallback
    }
  }
}

export const REMINDER_MESSAGES = [
  {
    title: 'Не потеряй свой стрик!',
    body: 'Всего 5 минут практики сегодня закрепят фразы в долговременной памяти.',
    icon: '🔥',
  },
  {
    title: 'Время для английского!',
    body: 'Новый шаблон речи ждет тебя. Узнай, как заказать кофе как местный!',
    icon: '☕',
  },
  {
    title: 'Закрепи разговорные фразы!',
    body: 'Пройди короткий блиц-тест и поднимись в лидерской таблице.',
    icon: '⚡',
  },
  {
    title: 'Интервальное повторение',
    body: 'В твоем словаре есть карточки, готовые к повторению на сегодня.',
    icon: '🧠',
  },
];

// Website only: install details and browser notifications. Phone apps never call these.
import { supabase } from './supabase';

const VAPID_KEY = process.env.EXPO_PUBLIC_VAPID_PUBLIC_KEY ?? '';

export const isIphone = () => /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
export const isAndroid = () => /Android/.test(navigator.userAgent);
export const isInstalled = () =>
  window.matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true;

export const pushSupported = () => !!VAPID_KEY && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

export const pushPermission = () => ('Notification' in window ? Notification.permission : 'default');

const keyBytes = (key: string) => Uint8Array.from(atob(key.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(key.length / 4) * 4, '=')), (c) => c.charCodeAt(0));

/** Adds the install details and the notification worker to the page. */
export function setUpWebsite() {
  const add = (tag: string, attrs: Record<string, string>) => {
    const el = document.createElement(tag);
    Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
    document.head.appendChild(el);
  };
  add('link', { rel: 'manifest', href: '/manifest.webmanifest' });
  add('link', { rel: 'apple-touch-icon', href: '/icon-192.png' });
  add('meta', { name: 'apple-mobile-web-app-capable', content: 'yes' });
  add('meta', { name: 'apple-mobile-web-app-title', content: 'Uncommon Intake' });
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js').catch(() => undefined);
}

async function saveSubscription(userId: string) {
  const reg = await navigator.serviceWorker.ready;
  const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(VAPID_KEY) }));
  const json = sub.toJSON();
  await supabase
    .from('web_push_subscriptions')
    .upsert({ user_id: userId, endpoint: sub.endpoint, p256dh: json.keys?.p256dh ?? '', auth: json.keys?.auth ?? '' }, { onConflict: 'endpoint' });
}

/** Must run from a tap: iPhones refuse to ask otherwise. Returns true when notifications are on. */
export async function enableWebPush(userId: string) {
  if (!pushSupported()) return false;
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return false;
  await saveSubscription(userId);
  return true;
}

/** Keeps the saved browser up to date once permission was given. Never asks. */
export async function refreshWebPush(userId: string) {
  try {
    if (pushSupported() && Notification.permission === 'granted') await saveSubscription(userId);
  } catch {
    // Notifications are a nice extra. Everything is still in the notifications list and email.
  }
}

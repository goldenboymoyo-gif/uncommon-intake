// Save now, upload later.
// Every interview answer goes into this queue first and is kept on the phone.
// The queue retries with growing waits until the network is good enough.
import { useEffect, useSyncExternalStore } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { Directory, File, Paths } from 'expo-file-system';
import { supabase } from './supabase';
import type { AnswerFormat } from './types';

export type QueueItem = {
  key: string; // `${applicationId}:${questionId}`
  userId: string;
  applicationId: string;
  questionId: string;
  format: AnswerFormat;
  text?: string;
  localUri?: string;
  ext?: string;
  mime?: string;
  durationSeconds?: number;
  attempts: number;
  nextTryAt: number;
  lastError?: string;
};

const STORAGE_KEY = 'upload-queue-v1';
const MAX_WAIT_MS = 5 * 60 * 1000;

let items: QueueItem[] = [];
let loaded = false;
let running = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

async function load() {
  if (loaded) return;
  try {
    items = JSON.parse((await AsyncStorage.getItem(STORAGE_KEY)) ?? '[]');
  } catch {
    items = [];
  }
  loaded = true;
  emit();
}

async function save() {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  emit();
}

const answersDir = () => {
  const dir = new Directory(Paths.document, 'answers');
  dir.create({ intermediates: true, idempotent: true });
  return dir;
};

/** Adds or replaces the answer for one question. Media is copied somewhere the system will not clear. */
export async function enqueueAnswer(input: Omit<QueueItem, 'key' | 'attempts' | 'nextTryAt'>) {
  await load();
  const key = `${input.applicationId}:${input.questionId}`;
  let localUri = input.localUri;
  if (localUri) {
    const source = new File(localUri);
    const target = new File(answersDir(), `${input.applicationId}-${input.questionId}-${Date.now()}.${input.ext}`);
    source.copy(target);
    localUri = target.uri;
  }
  removeLocalFile(items.find((i) => i.key === key)?.localUri);
  items = [...items.filter((i) => i.key !== key), { ...input, localUri, key, attempts: 0, nextTryAt: 0 }];
  await save();
  runQueue();
}

function removeLocalFile(uri?: string) {
  if (!uri) return;
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // already gone
  }
}

async function uploadOne(item: QueueItem) {
  // 1. Create or update the answer row.
  const { data: row, error } = await supabase
    .from('interview_answers')
    .upsert(
      {
        application_id: item.applicationId,
        question_id: item.questionId,
        format: item.format,
        text_answer: item.format === 'text' ? item.text ?? '' : null,
        duration_seconds: item.durationSeconds ?? null,
        state: item.format === 'text' ? 'uploaded' : 'pending',
      },
      { onConflict: 'application_id,question_id' },
    )
    .select('id')
    .single();
  if (error || !row) throw new Error(error?.message ?? 'Could not save the answer');

  // 2. Upload the recording.
  if (item.localUri) {
    const file = new File(item.localUri);
    if (!file.exists) throw new Error('The recording is missing on this phone. Please record it again.');
    const path = `${item.userId}/${item.applicationId}/${item.questionId}.${item.ext}`;
    const { error: upErr } = await supabase.storage
      .from('interview-media')
      .upload(path, await file.arrayBuffer(), { contentType: item.mime, upsert: true });
    if (upErr) throw new Error(upErr.message);
    const { error: rowErr } = await supabase
      .from('interview_answers')
      .update({ media_path: path, state: 'uploaded' })
      .eq('id', row.id);
    if (rowErr) throw new Error(rowErr.message);
  }

  // 3. Ask for the text version and summary. If this fails, staff can run it again later.
  supabase.functions.invoke('process-answer', { body: { answer_id: row.id } }).catch(() => undefined);
}

/** `force` retries now, ignoring the wait between attempts (used by pull to refresh). */
export async function runQueue(force = false) {
  await load();
  if (running) return;
  running = true;
  try {
    const net = await NetInfo.fetch();
    if (!net.isConnected || net.isInternetReachable === false) return;
    for (const item of [...items]) {
      if (!force && item.nextTryAt > Date.now()) continue;
      try {
        await uploadOne(item);
        removeLocalFile(item.localUri);
        items = items.filter((i) => i.key !== item.key);
      } catch (e) {
        const attempts = item.attempts + 1;
        const wait = Math.min(MAX_WAIT_MS, 2000 * 2 ** attempts);
        items = items.map((i) =>
          i.key === item.key ? { ...i, attempts, nextTryAt: Date.now() + wait, lastError: (e as Error).message } : i,
        );
      }
      await save();
    }
  } finally {
    running = false;
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  load();
  return () => listeners.delete(listener);
}

export function useUploadQueue() {
  return useSyncExternalStore(subscribe, () => items);
}

/** Mounted once while signed in. Retries when the network comes back, the app opens, or every 30 seconds. */
export function UploadQueueRunner() {
  useEffect(() => {
    runQueue();
    const netSub = NetInfo.addEventListener((s) => {
      if (s.isConnected) runQueue();
    });
    const appSub = AppState.addEventListener('change', (s) => {
      if (s === 'active') runQueue();
    });
    const timer = setInterval(() => runQueue(), 30000);
    return () => {
      netSub();
      appSub.remove();
      clearInterval(timer);
    };
  }, []);
  return null;
}

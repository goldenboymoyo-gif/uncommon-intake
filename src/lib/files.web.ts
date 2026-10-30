// Website file helpers. Recordings wait in the browser's own storage (IndexedDB) until they have
// uploaded, so a refresh or a bad connection does not lose an answer.
const DB = 'uncommon-recordings';
const STORE = 'files';
const PREFIX = 'idb://';

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function run<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await open();
  return new Promise((resolve, reject) => {
    const req = action(db.transaction(STORE, mode).objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function toBlob(uri: string): Promise<Blob> {
  if (uri.startsWith(PREFIX)) {
    const blob = await run<Blob | undefined>('readonly', (s) => s.get(uri.slice(PREFIX.length)));
    if (!blob) throw new Error('The recording is missing. Please record it again.');
    return blob;
  }
  return (await fetch(uri)).blob();
}

export const readBytes = async (uri: string) => (await toBlob(uri)).arrayBuffer();

// The browser tells us the size when the file is picked, so this is only a fallback.
export const fileSize = (_uri: string) => 0;

export async function keepRecording(uri: string, name: string) {
  const blob = await toBlob(uri);
  await run('readwrite', (s) => s.put(blob, name));
  return `${PREFIX}${name}`;
}

export const recordingExists = async (uri: string) =>
  !uri.startsWith(PREFIX) || !!(await run<Blob | undefined>('readonly', (s) => s.get(uri.slice(PREFIX.length))));

export function removeRecording(uri?: string) {
  if (uri?.startsWith(PREFIX)) run('readwrite', (s) => s.delete(uri.slice(PREFIX.length))).catch(() => undefined);
}

/** Each browser records in its own format, so ask the recording itself. */
export async function recordingInfo(uri: string, format: 'audio' | 'video') {
  const type = (await toBlob(uri)).type.split(';')[0];
  if (type.includes('webm')) return { ext: 'webm', mime: format === 'audio' ? 'audio/webm' : 'video/webm' };
  if (type.includes('ogg')) return { ext: 'ogg', mime: 'audio/ogg' };
  return format === 'audio' ? { ext: 'm4a', mime: 'audio/mp4' } : { ext: 'mp4', mime: 'video/mp4' };
}

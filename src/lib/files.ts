// Phone file helpers. The website version is files.web.ts.
import { Directory, File, Paths } from 'expo-file-system';

export const readBytes = (uri: string) => new File(uri).arrayBuffer();

export const fileSize = (uri: string) => new File(uri).size;

const answersDir = () => {
  const dir = new Directory(Paths.document, 'answers');
  dir.create({ intermediates: true, idempotent: true });
  return dir;
};

/** Copies a recording somewhere the system will not clear, until it has uploaded. */
export async function keepRecording(uri: string, name: string) {
  const target = new File(answersDir(), name);
  new File(uri).copy(target);
  return target.uri;
}

export const recordingExists = async (uri: string) => new File(uri).exists;

export function removeRecording(uri?: string) {
  if (!uri) return;
  try {
    const file = new File(uri);
    if (file.exists) file.delete();
  } catch {
    // already gone
  }
}

/** iOS cameras save .mov files; Android saves .mp4. */
export async function recordingInfo(uri: string, format: 'audio' | 'video') {
  const isMov = uri.toLowerCase().endsWith('.mov');
  return {
    ext: format === 'audio' ? 'm4a' : isMov ? 'mov' : 'mp4',
    mime: format === 'audio' ? 'audio/mp4' : isMov ? 'video/quicktime' : 'video/mp4',
  };
}

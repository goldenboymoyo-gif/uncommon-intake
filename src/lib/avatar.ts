import { useEffect, useState } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { File } from 'expo-file-system';
import { supabase } from './supabase';

// Photos are private, so they are shown with short lived signed links. Keep each link for 50 minutes.
const urls = new Map<string, { url: string; at: number }>();
const KEEP_MS = 50 * 60 * 1000;

export function useAvatarUrl(path?: string | null) {
  const [url, setUrl] = useState<string | null>(() => (path ? urls.get(path)?.url ?? null : null));
  useEffect(() => {
    if (!path) return setUrl(null);
    const hit = urls.get(path);
    if (hit && Date.now() - hit.at < KEEP_MS) return setUrl(hit.url);
    supabase.storage
      .from('avatars')
      .createSignedUrl(path, 60 * 60)
      .then(({ data }) => {
        if (!data?.signedUrl) return;
        urls.set(path, { url: data.signedUrl, at: Date.now() });
        setUrl(data.signedUrl);
      });
  }, [path]);
  return url;
}

/** Lets the person pick a square photo and saves it. Returns false if they cancelled. */
export async function pickAndUploadAvatar(userId: string): Promise<boolean> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) throw new Error('Please allow access to your photos to add a profile photo.');
  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.5 });
  if (result.canceled || !result.assets?.[0]) return false;

  // A new file name each time, so old cached links never show the old photo.
  const path = `${userId}/avatar-${Date.now()}.jpg`;
  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, await new File(result.assets[0].uri).arrayBuffer(), { contentType: 'image/jpeg' });
  if (error) throw new Error('The photo did not upload. Please try again.');
  const { error: rowErr } = await supabase.from('profiles').update({ avatar_path: path }).eq('id', userId);
  if (rowErr) throw new Error('The photo did not save. Please try again.');
  return true;
}

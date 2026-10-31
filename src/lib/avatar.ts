import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { readBytes } from './files';
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

// A browser gives us the full photo, which can be over the 2 MB limit, so make a small square one.
async function squarePhotoForWeb(uri: string): Promise<ArrayBuffer> {
  const image = new Image();
  image.src = uri;
  await image.decode();
  const side = Math.min(image.naturalWidth, image.naturalHeight);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 512;
  canvas.getContext('2d')!.drawImage(image, (image.naturalWidth - side) / 2, (image.naturalHeight - side) / 2, side, side, 0, 0, 512, 512);
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.8));
  if (!blob) throw new Error('We could not read this photo. Please try another one.');
  return blob.arrayBuffer();
}

/** Lets the person pick a square photo and saves it. Returns false if they cancelled. */
export async function pickAndUploadAvatar(userId: string): Promise<boolean> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) throw new Error('Please allow access to your photos to add a profile photo.');
  const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.5 });
  if (result.canceled || !result.assets?.[0]) return false;

  // A new file name each time, so old cached links never show the old photo.
  const path = `${userId}/avatar-${Date.now()}.jpg`;
  const uri = result.assets[0].uri;
  const bytes = Platform.OS === 'web' ? await squarePhotoForWeb(uri) : await readBytes(uri);
  const { error } = await supabase.storage
    .from('avatars')
    .upload(path, bytes, { contentType: 'image/jpeg' });
  if (error) throw new Error('The photo did not upload. Please try again.');
  const { error: rowErr } = await supabase.from('profiles').update({ avatar_path: path }).eq('id', userId);
  if (rowErr) throw new Error('The photo did not save. Please try again.');
  return true;
}

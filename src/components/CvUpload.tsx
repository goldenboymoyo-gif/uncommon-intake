import { useState } from 'react';
import { Pressable, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import Feather from '@expo/vector-icons/Feather';
import { fileSize, readBytes } from '../lib/files';
import { callFunction, supabase } from '../lib/supabase';
import type { Application } from '../lib/types';
import { colors, layout, radius, space } from '../theme';
import { Button } from './Button';
import { Card } from './Card';
import { Input } from './Input';
import { Text } from './Text';

const MAX_BYTES = 5 * 1024 * 1024;
export const MIN_ABOUT_CHARS = 150;
const TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

type Props = {
  application: Application;
  onChange: (app: Application) => void;
  onAboutChange: (text: string) => void;
  showErrors: boolean;
};

// Upload a CV (PDF or Word, max 5MB). The server checks it is a CV for what we teach. No CV? Write a few lines about yourself instead.
export function CvUpload({ application, onChange, onAboutChange, showErrors }: Props) {
  const [busy, setBusy] = useState(false);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noCv, setNoCv] = useState(!application.cv_path && !!application.about_text);
  const about = application.about_text ?? '';

  async function pick() {
    setError(null);
    const result = await DocumentPicker.getDocumentAsync({ type: Object.values(TYPES), copyToCacheDirectory: true });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    const ext = asset.name.split('.').pop()?.toLowerCase() ?? '';
    if (!TYPES[ext]) return setError('Please choose a PDF or Word file.');
    if ((asset.size ?? fileSize(asset.uri)) > MAX_BYTES) return setError('This file is bigger than 5MB. Please choose a smaller file.');

    setBusy(true);
    setChecking(false);
    try {
      const path = `${application.applicant_id}/${application.id}/cv-${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('application-cvs')
        .upload(path, await readBytes(asset.uri), { contentType: TYPES[ext] });
      if (upErr) throw new Error('Upload did not work. Check your connection and try again.');
      // The server checks it is a real CV that fits what we teach before adding it.
      setChecking(true);
      const updated = await callFunction<Application>('check-cv', { application_id: application.id, path, file_name: asset.name });
      onChange(updated);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
      setChecking(false);
    }
  }

  if (noCv) {
    const short = about.trim().length < MIN_ABOUT_CHARS;
    return (
      <View style={{ gap: space.md }}>
        <Input
          label="Tell us about yourself"
          multiline
          value={about}
          onChangeText={onAboutChange}
          helper="Write about your school or training, any work or volunteering, things you have built or fixed, and what you are good at."
          error={showErrors && short ? `Please write a little more (at least ${MIN_ABOUT_CHARS} letters).` : null}
        />
        <Text variant="small">{about.trim().length} / {MIN_ABOUT_CHARS} letters</Text>
        <Button title="I have a CV after all" variant="ghost" icon="upload" onPress={() => setNoCv(false)} />
      </View>
    );
  }

  return (
    <View style={{ gap: space.md }}>
      {application.cv_path ? (
        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
          <View style={{ width: 40, height: 40, borderRadius: radius.sm, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center' }}>
            <Feather name="file-text" size={20} color={colors.accentBlue} />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="bodySemi" numberOfLines={1}>{application.cv_name ?? 'Your CV'}</Text>
            <Text variant="small">Uploaded</Text>
          </View>
        </Card>
      ) : null}

      <Button
        title={application.cv_path ? 'Replace CV' : 'Upload your CV'}
        variant={application.cv_path ? 'outline' : 'primary'}
        icon="upload"
        loading={busy}
        onPress={pick}
      />
      {checking ? <Text variant="small" style={{ textAlign: 'center' }}>Checking your CV. This takes a few seconds.</Text> : null}
      {error ? <Text variant="small" style={{ color: colors.danger }}>{error}</Text> : null}
      {showErrors && !application.cv_path ? <Text variant="small" style={{ color: colors.danger }}>Please upload your CV.</Text> : null}

      {!application.cv_path ? (
        <Pressable accessibilityRole="button" onPress={() => setNoCv(true)} style={{ minHeight: layout.tapTarget, justifyContent: 'center', alignSelf: 'center' }}>
          <Text variant="smallSemi" style={{ color: colors.brand }}>No CV? Write about yourself instead</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

export const hasCvOrAbout = (app: Application) =>
  !!app.cv_path || (app.about_text ?? '').trim().length >= MIN_ABOUT_CHARS;

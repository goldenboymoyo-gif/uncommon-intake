import { useEffect, useState } from 'react';
import { View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { Feather } from '@expo/vector-icons';
import { callFunction, supabase } from '../lib/supabase';
import type { Application, Suggestions } from '../lib/types';
import { colors, radius, space } from '../theme';
import { AiLabel } from './AiLabel';
import { Button } from './Button';
import { Card } from './Card';
import { Text } from './Text';

const MAX_BYTES = 5 * 1024 * 1024;
const TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

type Props = { application: Application; onChange: (app: Application) => void };

export function LetterUpload({ application, onChange }: Props) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Suggestions | null>(null);
  const [feedbackBusy, setFeedbackBusy] = useState(false);
  const locked = !!application.submitted_at;

  useEffect(() => {
    supabase
      .from('letter_feedback')
      .select('suggestions')
      .eq('application_id', application.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => setFeedback((data?.suggestions as Suggestions) ?? null));
  }, [application.id, application.letter_path]);

  async function pick() {
    setError(null);
    const result = await DocumentPicker.getDocumentAsync({ type: Object.values(TYPES), copyToCacheDirectory: true });
    if (result.canceled || !result.assets?.[0]) return;
    const asset = result.assets[0];
    const ext = asset.name.split('.').pop()?.toLowerCase() ?? '';
    if (!TYPES[ext]) return setError('Please choose a PDF or Word file.');
    const file = new File(asset.uri);
    if ((asset.size ?? file.size) > MAX_BYTES) return setError('This file is bigger than 5MB. Please choose a smaller file.');

    setBusy(true);
    try {
      const path = `${application.applicant_id}/${application.id}/letter.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('letters')
        .upload(path, await file.arrayBuffer(), { contentType: TYPES[ext], upsert: true });
      if (upErr) throw upErr;
      const { data, error: rowErr } = await supabase
        .from('applications')
        .update({ letter_path: path, letter_name: asset.name })
        .eq('id', application.id)
        .select()
        .single();
      if (rowErr) throw rowErr;
      setFeedback(null);
      onChange(data as Application);
    } catch {
      setError('Upload did not work. Check your connection and try again.');
    } finally {
      setBusy(false);
    }
  }

  async function getFeedback() {
    setFeedbackBusy(true);
    setError(null);
    try {
      const row = await callFunction<{ suggestions: Suggestions }>('letter-feedback', { application_id: application.id });
      setFeedback(row.suggestions);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setFeedbackBusy(false);
    }
  }

  return (
    <View style={{ gap: space.md }}>
      <View style={{ gap: space.xs }}>
        <Text variant="h3">Motivational letter</Text>
        <Text variant="small">Tell us in your own words why you want to join. PDF or Word, up to 5MB.</Text>
      </View>

      {application.letter_path ? (
        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
          <View style={{ width: 40, height: 40, borderRadius: radius.sm, backgroundColor: colors.soft, alignItems: 'center', justifyContent: 'center' }}>
            <Feather name="file-text" size={20} color={colors.accentBlue} />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="bodySemi" numberOfLines={1}>{application.letter_name ?? 'Your letter'}</Text>
            <Text variant="small">Uploaded</Text>
          </View>
        </Card>
      ) : null}

      {!locked ? (
        <Button
          title={application.letter_path ? 'Replace letter' : 'Upload letter'}
          variant={application.letter_path ? 'outline' : 'primary'}
          icon="upload"
          loading={busy}
          onPress={pick}
        />
      ) : null}

      {application.letter_path && !locked && !feedback ? (
        <Button title="Get tips on my letter" variant="ghost" icon="message-circle" loading={feedbackBusy} onPress={getFeedback} />
      ) : null}

      {error ? <Text variant="small" style={{ color: colors.danger }}>{error}</Text> : null}

      {feedback ? (
        <Card tone="soft" large style={{ gap: space.md }}>
          <AiLabel note="suggestions only" />
          <Text variant="small">
            These are tips, not rules. The AI will never write your letter for you. It is your own work, in your own words.
          </Text>
          {feedback.strengths.length ? (
            <View style={{ gap: space.xs }}>
              <Text variant="bodySemi">What works well</Text>
              {feedback.strengths.map((s, i) => (
                <Text key={i} variant="small" style={{ color: colors.ink }}>• {s}</Text>
              ))}
            </View>
          ) : null}
          {feedback.suggestions.length ? (
            <View style={{ gap: space.xs }}>
              <Text variant="bodySemi">Things to think about</Text>
              {feedback.suggestions.map((s, i) => (
                <Text key={i} variant="small" style={{ color: colors.ink }}>
                  • <Text variant="smallSemi">{s.area}:</Text> {s.suggestion}
                </Text>
              ))}
            </View>
          ) : null}
        </Card>
      ) : null}
    </View>
  );
}

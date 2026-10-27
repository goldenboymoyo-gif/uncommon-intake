import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Header } from '../../components/Header';
import { Screen } from '../../components/Screen';
import { Button } from '../../components/Button';
import { ConfirmDelete } from '../../components/ConfirmDelete';
import { Input } from '../../components/Input';
import { Text } from '../../components/Text';
import * as ImagePicker from 'expo-image-picker';
import { File } from 'expo-file-system';
import { GraduatePhoto } from '../../components/GraduateCard';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { colors, layout, radius, space } from '../../theme';

// Add a 2026 graduate story, or edit one when opened with ?id=.
// It shows on Home only when staff confirm the graduate gave written consent.
export default function StoryEdit() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { profile } = useAuth();
  const [form, setForm] = useState({ name: '', role: '', employer: '', story: '' });
  const [consent, setConsent] = useState(false);
  const [photoPath, setPhotoPath] = useState<string | null>(null);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof form) => (v: string) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    if (!id) return;
    supabase
      .from('graduate_stories')
      .select('name, role, employer, story, consent_given, photo_path')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        if (!data) return;
        setForm({ name: data.name, role: data.role, employer: data.employer, story: data.story });
        setConsent(data.consent_given);
        setPhotoPath(data.photo_path);
      });
  }, [id]);

  const valid = Object.values(form).every((v) => v.trim());

  async function save() {
    if (!valid || !profile) return;
    setBusy(true);
    setError(null);
    const fields = {
      name: form.name.trim(),
      role: form.role.trim(),
      employer: form.employer.trim(),
      story: form.story.trim(),
      graduation_year: 2026,
      photo_path: photoPath,
      consent_given: consent,
      approved_by: consent ? profile.id : null,
      approved_at: consent ? new Date().toISOString() : null,
    };
    const { error: err } = id
      ? await supabase.from('graduate_stories').update(fields).eq('id', id)
      : await supabase.from('graduate_stories').insert(fields);
    setBusy(false);
    if (err) return setError('We could not save the story. Please try again.');
    router.back();
  }

  // Photos go to a public bucket because stories show before sign in (only with consent).
  async function pickPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.6 });
    if (result.canceled || !result.assets?.[0]) return;
    setPhotoBusy(true);
    setError(null);
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`;
    const { error: upErr } = await supabase.storage
      .from('story-photos')
      .upload(path, await new File(result.assets[0].uri).arrayBuffer(), { contentType: 'image/jpeg' });
    setPhotoBusy(false);
    if (upErr) return setError('The photo did not upload. Please try again.');
    setPhotoPath(path);
  }

  return (
    <View style={{ flex: 1 }}>
      <Header onBack={() => router.back()} />
      <Screen footer={<Button title={id ? 'Save changes' : 'Save story'} loading={busy} disabled={!valid} onPress={save} />}>
        <Text variant="h1">{id ? 'Edit story' : 'Add a graduate story'}</Text>
        <View style={{ alignItems: 'center', gap: space.sm }}>
          <GraduatePhoto story={{ name: form.name || '?', photo_path: photoPath }} size={96} />
          <Button title={photoPath ? 'Change photo' : 'Add a photo'} variant="outline" icon="camera" fullWidth={false} loading={photoBusy} onPress={pickPhoto} />
        </View>
        <Input label="Graduate's name" value={form.name} onChangeText={set('name')} />
        <Input label="Job title" value={form.role} onChangeText={set('role')} />
        <Input label="Employer" value={form.employer} onChangeText={set('employer')} />
        <Input label="Their story, in their own words" multiline value={form.story} onChangeText={set('story')} maxLength={1200} helper={`${form.story.length} / 1200`} />

        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: consent }}
          onPress={() => setConsent((c) => !c)}
          style={{ flexDirection: 'row', gap: space.md, alignItems: 'flex-start', minHeight: layout.tapTarget }}
        >
          <View style={{ width: 24, height: 24, borderRadius: radius.sm / 2, borderWidth: 1.5, borderColor: consent ? colors.brand : colors.muted, backgroundColor: consent ? colors.brand : colors.white, alignItems: 'center', justifyContent: 'center', marginTop: 2 }}>
            {consent ? <Feather name="check" size={16} color={colors.white} /> : null}
          </View>
          <Text style={{ flex: 1 }}>The graduate has given written consent for this story, their name and their employer to be shown in the app.</Text>
        </Pressable>
        {!consent ? <Text variant="small">Without consent the story is saved but stays hidden.</Text> : null}
        {error ? <Text variant="small" style={{ color: colors.danger }}>{error}</Text> : null}

        {id ? (
          <ConfirmDelete
            label="Delete this story"
            warning="This removes the story from the app. It cannot be undone."
            onConfirm={async () => {
              const { error: err } = await supabase.from('graduate_stories').delete().eq('id', id);
              if (err) throw new Error('We could not delete the story. Please try again.');
              router.back();
            }}
          />
        ) : null}
      </Screen>
    </View>
  );
}

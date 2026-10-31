import { useState } from 'react';
import { Linking, View } from 'react-native';
import { router } from 'expo-router';
import { Header } from '../../components/Header';
import { Screen } from '../../components/Screen';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Chip } from '../../components/Chip';
import { ChoiceList } from '../../components/ChoiceList';
import { Input } from '../../components/Input';
import { Text } from '../../components/Text';
import { useQuery } from '../../lib/data';
import { supabase } from '../../lib/supabase';
import { confirmedProjects, PROJECT_STATUS, SOCIAL_PLATFORMS, socialSummary, StudentProgress } from '../../lib/studentProgress';
import { colors, space } from '../../theme';

const CHECK_IN_TEXT: Record<string, string> = {
  wrong: 'That code is not right. Please check it with your instructor.',
  locked: 'Too many wrong tries today. Please speak to your instructor.',
  no_code: 'Your instructor has not opened today\'s code yet.',
  not_student: 'Your account is not linked to a hub yet. Please speak to your instructor.',
};

export default function Progress() {
  const { data, loading, reload } = useQuery(async () => {
    const { data: result, error } = await supabase.rpc('my_progress');
    if (error) throw error;
    return result as StudentProgress;
  }, []);
  const [code, setCode] = useState('');
  const [link, setLink] = useState('');
  const [title, setTitle] = useState('');
  const [projectLink, setProjectLink] = useState('');
  const [platform, setPlatform] = useState<string | null>(null);
  const [followers, setFollowers] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<{ part: string; text: string } | null>(null);

  async function run(part: string, action: () => PromiseLike<{ error: { message: string } | null }>, done: () => void) {
    setBusy(part);
    setError(null);
    const { error: err } = await action();
    setBusy(null);
    if (err) return setError({ part, text: err.message });
    done();
    reload();
  }

  async function checkIn() {
    setBusy('code');
    setError(null);
    const { data: result, error: err } = await supabase.rpc('check_in', { p_code: code });
    setBusy(null);
    if (err || result !== 'ok') return setError({ part: 'code', text: CHECK_IN_TEXT[result as string] ?? 'We could not check you in. Please try again.' });
    setCode('');
    reload();
  }

  const problem = (part: string) => (error?.part === part ? <Text variant="small" style={{ color: colors.danger }}>{error.text}</Text> : null);
  const summary = data ? socialSummary(data) : [];

  return (
    <View style={{ flex: 1 }}>
      <Header onBack={() => router.back()} />
      <Screen refreshing={loading} onRefresh={reload}>
        <Text variant="h1">My progress</Text>

        <Card large style={{ gap: space.sm }}>
          <Text variant="h2">Attendance</Text>
          <Text variant="small">You attended {data?.attended ?? 0} of {data?.days_open ?? 0} days your hub took attendance.</Text>
          {data?.checked_in_today ? (
            <Chip label="You are checked in today" tone="success" />
          ) : (
            <>
              <Input label="Today's code from your instructor" value={code} onChangeText={setCode} keyboardType="number-pad" maxLength={6} />
              {problem('code')}
              <Button title="Check in" loading={busy === 'code'} disabled={code.length < 6} onPress={checkIn} />
            </>
          )}
        </Card>

        <Card large style={{ gap: space.sm }}>
          <Text variant="h2">LinkedIn post</Text>
          {data?.linkedin_url ? (
            <>
              <Chip label="Done for this week" tone="success" />
              <Button title="Open my post" variant="ghost" onPress={() => Linking.openURL(data.linkedin_url!)} />
            </>
          ) : (
            <>
              <Text variant="small">Post on LinkedIn this week, then paste your post link here. Reminders stop once you send it.</Text>
              <Input label="Link to your post" value={link} onChangeText={setLink} autoCapitalize="none" keyboardType="url" />
              {problem('linkedin')}
              <Button title="Send my link" loading={busy === 'linkedin'} disabled={!link.trim()} onPress={() => run('linkedin', () => supabase.rpc('send_linkedin_post', { p_url: link }), () => setLink(''))} />
            </>
          )}
          {data?.linkedin_missed ? <Text variant="small">Weeks missed so far: {data.linkedin_missed}</Text> : null}
        </Card>

        <Card large style={{ gap: space.sm }}>
          <Text variant="h2">Projects</Text>
          <Text variant="small">{data ? confirmedProjects(data) : 0} confirmed by your instructor.</Text>
          {data?.projects.map((p) => (
            <View key={p.id} style={{ gap: space.xs, borderTopWidth: 1, borderColor: colors.border, paddingTop: space.sm }}>
              <Text variant="bodySemi">{p.title}</Text>
              <Chip label={PROJECT_STATUS[p.status].label} tone={PROJECT_STATUS[p.status].tone} />
            </View>
          ))}
          <Input label="Project name" value={title} onChangeText={setTitle} />
          <Input label="Link to the project" value={projectLink} onChangeText={setProjectLink} autoCapitalize="none" keyboardType="url" />
          {problem('project')}
          <Button
            title="Send my project"
            variant="outline"
            loading={busy === 'project'}
            disabled={!title.trim() || !projectLink.trim()}
            onPress={() => run('project', () => supabase.rpc('send_project', { p_title: title, p_url: projectLink }), () => { setTitle(''); setProjectLink(''); })}
          />
        </Card>

        <Card large style={{ gap: space.sm }}>
          <Text variant="h2">Social accounts</Text>
          <Text variant="small">Add your followers once a month. These are your own numbers, and nobody checks them automatically.</Text>
          {summary.map((s) => (
            <Text key={s.platform} variant="small" style={{ color: colors.ink }}>
              {s.platform}: {s.followers} followers{s.change !== null ? `, ${s.change >= 0 ? 'up' : 'down'} ${Math.abs(s.change)} since last month` : ''}
            </Text>
          ))}
          <ChoiceList options={SOCIAL_PLATFORMS} value={platform} onChange={(v) => setPlatform(v as string)} />
          <Input label="Followers this month" value={followers} onChangeText={setFollowers} keyboardType="number-pad" />
          {problem('social')}
          <Button
            title="Save my number"
            variant="outline"
            loading={busy === 'social'}
            disabled={!platform || !/^\d+$/.test(followers)}
            onPress={() => run('social', () => supabase.rpc('send_social_number', { p_platform: platform, p_followers: Number(followers) }), () => { setPlatform(null); setFollowers(''); })}
          />
        </Card>
      </Screen>
    </View>
  );
}

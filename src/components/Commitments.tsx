import { View } from 'react-native';
import { supabase } from '../lib/supabase';
import type { Application } from '../lib/types';
import { space } from '../theme';
import { Card } from './Card';
import { ChoiceList } from './ChoiceList';
import { Text } from './Text';

// Wording follows uncommon.org: the bootcamp is full time for 12 months, and students give back
// by teaching free coding classes to children.
const questions: { key: 'available_daily' | 'will_teach_children'; text: string }[] = [
  {
    key: 'available_daily',
    text: 'The bootcamp is full time. Will you be able to be at your hub every weekday from 9am to 4pm until you graduate?',
  },
  {
    key: 'will_teach_children',
    text: 'Bootcamp students give back by teaching free coding classes to children. Are you willing to volunteer to teach?',
  },
];

export const commitmentsAnswered = (app: Application) => app.available_daily != null && app.will_teach_children != null;

export function Commitments({ app, onChange }: { app: Application; onChange: (app: Application) => void }) {
  const answer = (key: (typeof questions)[number]['key'], yes: boolean) => {
    onChange({ ...app, [key]: yes });
    supabase.from('applications').update({ [key]: yes }).eq('id', app.id).then(() => undefined);
  };
  const value = (v: boolean | null) => (v == null ? null : v ? 'Yes' : 'No');

  return (
    <Card large style={{ gap: space.lg }}>
      <Text variant="h3">Two more questions</Text>
      {questions.map((q) => (
        <View key={q.key} style={{ gap: space.sm }}>
          <Text variant="bodySemi">{q.text}</Text>
          <ChoiceList options={['Yes', 'No']} value={value(app[q.key])} onChange={(v) => answer(q.key, v === 'Yes')} />
        </View>
      ))}
    </Card>
  );
}

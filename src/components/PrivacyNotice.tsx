import { View } from 'react-native';
import { space } from '../theme';
import { Text } from './Text';

// Plain English description of what this app does with personal data.
const sections = [
  {
    title: 'What we collect',
    body: 'Your name, email, phone or WhatsApp number, where you live, the hub you choose, your CV (or what you write about yourself), and your interview answers. We only ask for what we need to review your application.',
  },
  {
    title: 'Who can see it',
    body: 'Only you and the Uncommon staff who review applications. We do not sell your data or share it with employers.',
  },
  {
    title: 'How we use AI',
    body: 'AI reads your CV to write 5 interview questions about your own experience, turns spoken answers into text, and writes short summaries of your answers for staff. All AI text is marked "AI generated". The AI never decides who gets a place. People decide.',
  },
  {
    title: 'What the AI does not do',
    body: 'It does not score your CV, look at your face, judge your voice or tone, or guess your feelings. It only works with the words you write or say.',
  },
  {
    title: 'How long we keep recordings',
    body: 'Audio and video answers are kept for about 90 days, then deleted automatically. The written text of your answers stays with your application.',
  },
  {
    title: 'How we contact you',
    body: 'We send decisions in the app, as a phone notification, and by email. We never send decisions by WhatsApp or a phone call.',
  },
  {
    title: 'Your choices',
    body: 'You can ask us to see, correct or delete your data at any time. Contact the Uncommon team through uncommon.org.',
  },
];

export function PrivacyNotice() {
  return (
    <View style={{ gap: space.lg }}>
      {sections.map((s) => (
        <View key={s.title} style={{ gap: space.xs }}>
          <Text variant="h3">{s.title}</Text>
          <Text>{s.body}</Text>
        </View>
      ))}
    </View>
  );
}

import { View } from 'react-native';
import { colors, space } from '../theme';
import { Text } from './Text';

// Plain English privacy notice and terms, written with Zimbabwe's Cyber and Data Protection Act
// [Chapter 12:07] in mind. Uncommon should have it checked by their own legal adviser before launch.
export const PRIVACY_UPDATED = '22 October 2026';

const sections: { title: string; body: string[] }[] = [
  {
    title: 'Who we are',
    body: [
      'This app is run by Uncommon.org ("Uncommon", "we") to take applications for the free Technology Bootcamp and to support students. Uncommon decides how your information is used.',
      'Questions or requests: contact the Uncommon team through uncommon.org.',
    ],
  },
  {
    title: 'What we collect',
    body: [
      'Your name, email, phone or WhatsApp number, where you live, and the hub you choose.',
      'Your CV, or what you write about yourself instead.',
      'Your interview answers: text, voice recordings or short videos, and their written text.',
      'Your answers to the two commitment questions, your survey answers, coach requests, and an optional profile photo.',
      'We do not collect your location from your phone, your contacts, or anything you do not give us.',
    ],
  },
  {
    title: 'Why we use it',
    body: [
      'To review your application fairly and tell you the decision.',
      'To support students during the bootcamp with surveys, coaching and messages.',
      'To understand how the intake went, using totals only, never to identify you in reports.',
      'We use your information because you agree to it when you sign up, and to run the bootcamp you applied for. You can withdraw your consent at any time (see Your rights).',
    ],
  },
  {
    title: 'How we use AI',
    body: [
      'AI reads your CV to write 5 interview questions about your own experience.',
      'AI turns spoken answers into text and writes short summaries for staff. All AI text is labelled "AI generated".',
      'AI never decides who gets a place, never scores you, and never looks at your face, voice tone or feelings. People make every decision.',
      'Your information is sent to our AI provider only to do these tasks. It is not used to train their models.',
    ],
  },
  {
    title: 'Who can see it',
    body: [
      'Only you and the Uncommon staff who review applications or run the bootcamp.',
      'We never sell your information and never share it with employers without asking you first.',
      'Trusted service providers store and process it for us under contract: Supabase (secure database and file storage), our AI provider, and email and notification services. They may only use it to provide that service.',
      'Some of these providers store data outside Zimbabwe. We only use providers that protect it with strong security.',
    ],
  },
  {
    title: 'How we keep it safe',
    body: [
      'Your information is encrypted while it travels and while it is stored.',
      'Every record is locked so you can only see your own, and staff can only see what they need.',
      'Files like your CV, recordings and photo are private and only open through links that expire.',
      'You sign in with a one time code sent to your email, so there is no password to steal.',
    ],
  },
  {
    title: 'How long we keep it',
    body: [
      'Voice and video recordings: about 90 days, then deleted automatically. The written text stays with your application.',
      'Your application: for as long as needed for the intake and Uncommon’s records, unless you ask us to delete it sooner.',
      'If you delete your account in the app, we delete your account, application, CV, answers, recordings and photo straight away.',
    ],
  },
  {
    title: 'Your rights',
    body: [
      'You can ask to see the information we hold about you, ask us to correct it, and ask us to delete it.',
      'You can object to how we use it or withdraw your consent. This may mean we cannot continue your application.',
      'You can delete your account yourself: Profile, then Delete my account.',
      'If you are unhappy with how we handle your information, you can complain to the Data Protection Authority (POTRAZ) in Zimbabwe.',
    ],
  },
  {
    title: 'How we contact you',
    body: [
      'Decisions and messages come in the app, as a phone notification, and by email. We never send decisions by WhatsApp or a phone call.',
    ],
  },
  {
    title: 'Terms of use',
    body: [
      'Applying is free. Only use your own details and tell the truth in your application and interview.',
      'Do not try to access other people’s information or misuse the app. We may close accounts that do.',
      'Getting a place depends on Uncommon’s review. Using the app does not guarantee a place.',
      'We may update this notice. We will tell you in the app if anything important changes.',
    ],
  },
];

export function PrivacyNotice() {
  return (
    <View style={{ gap: space.xl }}>
      <Text variant="small">Last updated {PRIVACY_UPDATED}</Text>
      {sections.map((s) => (
        <View key={s.title} style={{ gap: space.sm }}>
          <Text variant="h3">{s.title}</Text>
          {s.body.map((p) => (
            <Text key={p} style={{ color: colors.ink }}>{p}</Text>
          ))}
        </View>
      ))}
    </View>
  );
}

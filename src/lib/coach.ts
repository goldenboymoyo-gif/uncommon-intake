import type { Feather } from '@expo/vector-icons';
import { colors } from '../theme';

export type CoachKind = 'cv' | 'cover_letter' | 'interview_practice';

export const coachTools: Record<CoachKind, { title: string; body: string; icon: keyof typeof Feather.glyphMap; accent: string }> = {
  cv: { title: 'CV feedback', body: 'Upload your CV or paste it in. Get tips to make it clearer.', icon: 'file-text', accent: colors.accentBlue },
  cover_letter: { title: 'Cover letter feedback', body: 'Check a cover letter before you send it to an employer.', icon: 'mail', accent: colors.accentOrange },
  interview_practice: { title: 'Job interview practice', body: 'Answer a common interview question and get feedback.', icon: 'message-square', accent: colors.accentMint },
};

// Common job interview questions for practice. Students can also type their own.
export const practiceQuestions = [
  'Tell me about yourself.',
  'Why do you want this job?',
  'Tell me about a project you are proud of.',
  'Tell me about a time you solved a hard problem.',
  'Tell me about a time you worked in a team.',
  'Where do you see yourself in two years?',
];

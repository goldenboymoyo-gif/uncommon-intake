import type Feather from '@expo/vector-icons/Feather';
import { colors } from '../theme';

export type CoachKind = 'cv' | 'cover_letter' | 'interview_practice';

export const coachTools: Record<CoachKind, { title: string; body: string; icon: keyof typeof Feather.glyphMap; accent: string }> = {
  cv: { title: 'CV coach', body: 'Learn what a good CV has, then get feedback on yours.', icon: 'file-text', accent: colors.accentBlue },
  cover_letter: { title: 'Cover letter coach', body: 'Learn how to write a cover letter, then check yours before you send it.', icon: 'mail', accent: colors.accentOrange },
  interview_practice: { title: 'Interview practice', body: 'Pick the job you are going for. Practise real questions and get feedback.', icon: 'message-square', accent: colors.accentMint },
};

// Each career has its own AI coach. They are AI, not real people, and the app always says so.
export type Career = { id: string; label: string; coach: string; icon: keyof typeof Feather.glyphMap; color: string };

export const careers: Career[] = [
  { id: 'software', label: 'Software developer', coach: 'Tendai', icon: 'code', color: colors.accentBlue },
  { id: 'marketing', label: 'Digital marketer', coach: 'Rudo', icon: 'trending-up', color: colors.accentOrange },
  { id: 'design', label: 'Product designer', coach: 'Farai', icon: 'pen-tool', color: colors.accentRose },
  { id: 'hr', label: 'HR interview (any job)', coach: 'Nyasha', icon: 'users', color: colors.accentMint },
  { id: 'other', label: 'Another career', coach: 'Tatenda', icon: 'briefcase', color: colors.brand },
];

// Short lessons shown before the student uploads, so they learn how to do it well.
export const coachTips: Record<'cv' | 'cover_letter', string[]> = {
  cv: [
    'Keep it to one or two pages.',
    'Start with your name, phone, email and a link to your work (GitHub, Behance or a portfolio).',
    'Write a short profile: 2 or 3 lines on who you are and the job you want.',
    'List your skills and tools that match the job.',
    'Show projects: what you built, the tools you used and the result.',
    'Add work, volunteering and training, newest first.',
    'Use simple words, the same font throughout, and check your spelling.',
  ],
  cover_letter: [
    'Write to a real person and name the job you are applying for.',
    'Say in the first lines why you want this job at this company.',
    'Give one or two examples that show you can do the work.',
    'Match your skills to what the job advert asks for.',
    'Keep it under one page, in short paragraphs.',
    'End by thanking them and saying you would like to talk.',
    'Write a new letter for each job. Do not send the same one everywhere.',
  ],
};

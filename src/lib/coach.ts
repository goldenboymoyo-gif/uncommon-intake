import type Feather from '@expo/vector-icons/Feather';
import type { ImageSourcePropType } from 'react-native';
import { colors } from '../theme';

// Feedback saved before the coach became a chat. Students can still open it.
export type CoachKind = 'cv' | 'cover_letter' | 'interview_practice';

export const coachTools: Record<CoachKind, { title: string; icon: keyof typeof Feather.glyphMap; accent: string }> = {
  cv: { title: 'CV coach', icon: 'file-text', accent: colors.accentBlue },
  cover_letter: { title: 'Cover letter coach', icon: 'mail', accent: colors.accentOrange },
  interview_practice: { title: 'Interview practice', icon: 'message-square', accent: colors.accentMint },
};

export type CoachTopic = 'cv' | 'cover_letter' | 'interview' | 'english';

export const coachTopics: Record<CoachTopic, { title: string; body: string; pick: string; icon: keyof typeof Feather.glyphMap; accent: string }> = {
  cv: { title: 'CV coach', body: 'Chat with a coach and learn to write a strong CV.', pick: 'Which job is your CV for?', icon: 'file-text', accent: colors.accentBlue },
  cover_letter: { title: 'Cover letter coach', body: 'Learn to write a cover letter that gets read.', pick: 'Which job is your letter for?', icon: 'mail', accent: colors.accentOrange },
  interview: { title: 'Interview practice', body: 'Practise a real interview. The coach asks and follows up on your answers.', pick: 'Which interview are you practising for?', icon: 'message-square', accent: colors.accentMint },
  english: { title: 'English Tutor', body: 'Find your level and learn with lessons, daily practice and tests.', pick: 'What do you want to learn?', icon: 'book-open', accent: colors.accentRose },
};

export type CoachSubject = { id: string; label: string; coach: string; photo: ImageSourcePropType };

const tendai = require('../../assets/coaches/tendai.png');
const rudo = require('../../assets/coaches/rudo.png');
const farai = require('../../assets/coaches/farai.png');
const nyasha = require('../../assets/coaches/nyasha.png');
const tatenda = require('../../assets/coaches/tatenda.png');
const chipo = require('../../assets/coaches/chipo.png');

const careers: CoachSubject[] = [
  { id: 'software', label: 'Software developer', coach: 'Tendai', photo: tendai },
  { id: 'marketing', label: 'Digital marketer', coach: 'Rudo', photo: rudo },
  { id: 'design', label: 'Product designer', coach: 'Farai', photo: farai },
  { id: 'other', label: 'Another tech career', coach: 'Tatenda', photo: tatenda },
];

const hr: CoachSubject = { id: 'hr', label: 'HR interview for a tech job', coach: 'Nyasha', photo: nyasha };

const english: CoachSubject[] = [
  { id: 'general', label: 'Everyday English', coach: 'Chipo', photo: chipo },
  { id: 'work', label: 'English for work', coach: 'Chipo', photo: chipo },
  { id: 'pronunciation', label: 'Pronunciation', coach: 'Chipo', photo: chipo },
  { id: 'spelling', label: 'Spelling', coach: 'Chipo', photo: chipo },
];

export const subjectsFor = (topic: CoachTopic): CoachSubject[] =>
  topic === 'english' ? english : topic === 'interview' ? [...careers.slice(0, 3), hr, careers[3]] : careers;

export const subjectById = (id: string): CoachSubject =>
  [...careers, hr, ...english].find((s) => s.id === id) ?? careers[3];

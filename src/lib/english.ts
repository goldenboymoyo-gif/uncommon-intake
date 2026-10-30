import { callFunction } from './supabase';

export const ENGLISH_LANGUAGES = ['English', 'Shona', 'Ndebele', 'Tonga'] as const;

export const SKILL_LABELS: Record<string, string> = {
  grammar: 'Grammar',
  vocabulary: 'Vocabulary',
  speaking: 'Speaking',
  writing: 'Writing',
  reading: 'Reading',
  listening: 'Listening',
};

export type EnglishOverview = {
  level: string | null;
  language: string;
  points: number;
  streak: number;
  learning_minutes: number;
  words: number;
  lessons_passed: number;
  speaking_answers: number;
  writing_scores: { first: number | null; recent: number | null };
  skills: Record<string, { score: number | null; answers: number }>;
  plan: { weaknesses: string[]; objectives: string[]; recommended: { id: string; title: string }[]; daily: string; weekly: string; target: string } | null;
  recommended: { id: string; title: string } | null;
  mistakes: { pattern: string; correction: string; times: number }[];
  achievements: { title: string; earned: boolean }[];
  active_assessment: string | null;
  daily: { id: string; title: string; done: boolean }[];
  modules: { id: string; title: string; lessons: { id: string; title: string; objective: string; passed: boolean }[] }[];
  can_weekly: boolean;
  level_test: { next: string | null; lessons_needed: number; ready: boolean };
};

export type EnglishStart =
  | { kind: 'assessment' | 'weekly' | 'level_test' }
  | { kind: 'lesson'; lesson_id: string }
  | { kind: 'daily'; activity: string };

export const startEnglish = async (input: EnglishStart) =>
  (await callFunction<{ id: string }>('english-tutor', { action: 'start', ...input })).id;

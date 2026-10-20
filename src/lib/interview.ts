import { supabase } from './supabase';
import { fetchCurrentIntake, getOrCreateApplication } from './data';
import type { Application, InterviewAnswer, InterviewQuestion } from './types';

export const QUESTION_COUNT = 5;
export const MAX_AUDIO_SECONDS = 180;
export const MAX_VIDEO_SECONDS = 90;

export type InterviewData = {
  app: Application;
  questions: InterviewQuestion[];
  answers: Record<string, InterviewAnswer>;
};

export async function fetchInterview(userId: string): Promise<InterviewData | null> {
  const intake = await fetchCurrentIntake();
  if (!intake) return null;
  const app = await getOrCreateApplication(intake.id, userId);
  const [{ data: questions }, { data: answers }] = await Promise.all([
    supabase.from('interview_questions').select('id, position, prompt').eq('intake_id', intake.id).order('position'),
    supabase.from('interview_answers').select('*').eq('application_id', app.id),
  ]);
  const byQuestion: Record<string, InterviewAnswer> = {};
  (answers ?? []).forEach((a: InterviewAnswer) => (byQuestion[a.question_id] = a));
  return { app, questions: (questions ?? []) as InterviewQuestion[], answers: byQuestion };
}

export const formatTime = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;

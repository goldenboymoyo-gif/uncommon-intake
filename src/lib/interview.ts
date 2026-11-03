import { supabase } from './supabase';
import { fetchCurrentIntake, getOrCreateApplication } from './data';
import type { Application, InterviewAnswer, InterviewQuestion } from './types';

// New applicants get 10 questions. Anyone who already had 5 keeps their 5, so screens count what is there.
export const QUESTION_COUNT = 10;
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
  const [questions, { data: answers }] = await Promise.all([
    fetchQuestions(app.id, intake.id),
    supabase.from('interview_answers').select('*').eq('application_id', app.id),
  ]);
  const byQuestion: Record<string, InterviewAnswer> = {};
  (answers ?? []).forEach((a: InterviewAnswer) => (byQuestion[a.question_id] = a));
  return { app, questions, answers: byQuestion };
}

/** This applicant's own questions (written by AI from their CV), or shared intake questions if staff set any. */
export async function fetchQuestions(applicationId: string, intakeId: string): Promise<InterviewQuestion[]> {
  const cols = 'id, position, prompt, ai_generated, based_on';
  const { data: own } = await supabase.from('interview_questions').select(cols).eq('application_id', applicationId).order('position');
  if (own?.length) return own as InterviewQuestion[];
  const { data: shared } = await supabase
    .from('interview_questions')
    .select(cols)
    .eq('intake_id', intakeId)
    .is('application_id', null)
    .order('position');
  return (shared ?? []) as InterviewQuestion[];
}

export const formatTime = (seconds: number) =>
  `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, '0')}`;

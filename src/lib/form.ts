import { supabase } from './supabase';
import type { FormQuestion } from './types';

export const STEP_ONE_TITLE = 'About you';

export type FormSetup = {
  titles: Record<number, string>;
  questions: FormQuestion[];
  /** True when staff have added questions for every step from 2 to 7. */
  complete: boolean;
};

/** Steps 2 to 7 come from the database. The app never makes up questions. */
export async function fetchFormSetup(intakeId: string): Promise<FormSetup> {
  const [{ data: steps }, { data: questions, error }] = await Promise.all([
    supabase.from('form_steps').select('step, title').eq('intake_id', intakeId),
    supabase.from('form_questions').select('*').eq('intake_id', intakeId).order('step').order('position'),
  ]);
  if (error) throw error;
  const titles: Record<number, string> = { 1: STEP_ONE_TITLE };
  (steps ?? []).forEach((s: { step: number; title: string }) => (titles[s.step] = s.title));
  const list = (questions ?? []) as FormQuestion[];
  const complete = [2, 3, 4, 5, 6, 7].every((n) => list.some((q) => q.step === n));
  return { titles, questions: list, complete };
}

export const stepTitle = (setup: FormSetup | null, step: number) => setup?.titles[step] ?? `Step ${step}`;

/** The letter goes on the step that has a letter question, or on step 7 if there is none. */
export const letterStep = (setup: FormSetup | null) =>
  setup?.questions.find((q) => q.kind === 'letter_upload')?.step ?? 7;

export type AnswerMap = Record<string, unknown>;

export async function fetchAnswers(applicationId: string): Promise<AnswerMap> {
  const { data } = await supabase.from('application_answers').select('question_id, value').eq('application_id', applicationId);
  const map: AnswerMap = {};
  (data ?? []).forEach((a: { question_id: string; value: unknown }) => (map[a.question_id] = a.value));
  return map;
}

export const isAnswered = (value: unknown) =>
  value !== undefined && value !== null && !(typeof value === 'string' && !value.trim()) && !(Array.isArray(value) && !value.length);

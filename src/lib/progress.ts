import type { Href } from 'expo-router';
import type { Application } from './types';

export const TOTAL_STEPS = 7;

export type NextStep = { title: string; body: string; action: string; href: Href };

/** What the applicant should do next, in plain words. */
export function nextStep(app: Application | null): NextStep {
  if (!app) {
    return {
      title: 'Start your application',
      body: 'It takes a few sittings. Your answers save as you go.',
      action: 'Start application',
      href: '/application',
    };
  }
  if (!app.submitted_at && app.current_step > TOTAL_STEPS) {
    return {
      title: 'Check and send',
      body: 'All 7 steps are done. Check your answers, then send your application.',
      action: 'Review your application',
      href: '/application/review',
    };
  }
  if (!app.submitted_at) {
    return {
      title: `Step ${app.current_step} of ${TOTAL_STEPS}`,
      body: 'Your answers are saved. Carry on when you are ready.',
      action: 'Continue application',
      href: { pathname: '/application/[step]', params: { step: String(app.current_step) } },
    };
  }
  if (!app.interview_sent_at) {
    return {
      title: 'Your interview',
      body: 'Answer 5 short questions by text, voice or video.',
      action: app.recording_consent_at ? 'Continue interview' : 'Start interview',
      href: app.recording_consent_at ? '/interview' : '/interview/consent',
    };
  }
  if (!app.decision) {
    return {
      title: 'Our team is reviewing',
      body: 'You do not need to do anything now. We will tell you when there is a decision.',
      action: 'See status',
      href: '/status',
    };
  }
  return {
    title: 'You have a decision',
    body: 'Open your status to see it.',
    action: 'See decision',
    href: '/status',
  };
}

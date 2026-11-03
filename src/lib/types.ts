export type Role = 'applicant' | 'student' | 'graduate' | 'staff' | 'admin';
export type AnswerFormat = 'text' | 'audio' | 'video';
export type Decision = 'accepted' | 'waitlisted' | 'not_accepted';
export type ReviewStatus =
  | 'not_started' | 'in_progress' | 'all_answered' | 'ready_to_review'
  | 'in_review' | 'needs_help' | 'accepted' | 'waitlisted' | 'not_accepted';

export type Profile = {
  id: string;
  role: Role;
  first_names: string;
  surname: string;
  phone: string;
  email: string;
  hub_id: string | null;
  is_hub_lead: boolean;
  staff_status: 'choosing' | 'pending' | 'rejected' | null;
  terms_accepted_at: string | null;
  avatar_path: string | null;
};

export type Intake = {
  id: string;
  year: number;
  title: string;
  opens_at: string | null;
  closes_at: string | null;
  places_total: number | null;
  is_open: boolean;
};

export type Application = {
  id: string;
  applicant_id: string;
  intake_id: string;
  hub_id: string | null;
  first_names: string;
  surname: string;
  phone: string;
  email: string;
  location: string;
  current_step: number;
  cv_path: string | null;
  cv_name: string | null;
  letter_path: string | null;
  letter_name: string | null;
  about_text: string | null;
  questions_ready_at: string | null;
  available_daily: boolean | null;
  will_teach_children: boolean | null;
  ai_notice_seen_at: string | null;
  submitted_at: string | null;
  interview_format: AnswerFormat | null;
  recording_consent_at: string | null;
  low_data: boolean;
  interview_sent_at: string | null;
  review_status: ReviewStatus;
  needs_help: boolean;
  decision: Decision | null;
  decided_at: string | null;
  place_confirmed_at: string | null;
  created_at: string;
};

export type InterviewQuestion = {
  id: string;
  position: number;
  prompt: string;
  ai_generated?: boolean;
  based_on?: string | null;
};

export type Hub = { id: string; name: string; area: string | null; city: string | null; status: 'open' | 'coming_soon' | 'closed' };

export type Suggestions = {
  strengths: string[];
  suggestions: { area: string; suggestion: string }[];
};

export type AnswerSummary = {
  summary: string;
  checklist: { item: string; what_the_answer_says: string }[];
};

export type InterviewAnswer = {
  id: string;
  application_id: string;
  question_id: string;
  format: AnswerFormat;
  text_answer: string | null;
  media_path: string | null;
  duration_seconds: number | null;
  state: 'pending' | 'uploaded' | 'transcribed' | 'summarised' | 'failed';
  transcript: string | null;
  ai_summary: AnswerSummary | null;
  media_deleted_at: string | null;
};

export type GraduateStory = {
  id: string;
  name: string;
  role: string;
  employer: string;
  story: string;
  photo_path: string | null;
};

export type AppNotification = {
  id: string;
  kind: 'decision' | 'reminder' | 'survey' | 'general';
  title: string;
  body: string;
  read_at: string | null;
  created_at: string;
};

export type JobOpportunity = {
  id: string;
  title: string;
  company: string;
  location: string;
  details: string;
  requirements: string;
  apply_url: string;
  closes_on: string | null;
  created_at: string;
};

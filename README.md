# Uncommon Intake

A mobile app (iOS and Android only) for applying to the Uncommon.org Technology Bootcamp,
following an application to a decision, and getting career support once accepted.

Solo capstone project. React Native with Expo, TypeScript, Expo Router and Supabase.

## What it does

**Applicants**
- Home with the intake, graduate stories (only real, consented, staff-approved ones) and "How it works".
- Sign up with name, phone or WhatsApp, and email. Sign in with a code sent by email. No passwords.
- A 2 step application with autosave, "Save and finish later", and a review screen before sending:
  1. Your details: name, email, phone or WhatsApp, where you live, and a hub (from the `hubs` table).
  2. Your CV: PDF or Word, up to 5MB. No CV? Applicants can write a short "about you" instead.
- After sending, AI reads the CV and writes 5 professional interview questions about that person's own
  experience (`generate-questions` Edge Function). It runs once per applicant and never asks about age,
  gender, family, religion, health, background or politics. Staff see which part of the CV each question came from.
- A consent screen before the interview, then 5 questions answered by text, audio (waveform and timer)
  or short video. Answers are saved on the phone first and uploaded when the network allows.
  Low data mode gives smaller audio files and turns video off.
- A status timeline: Application received, Interview answers sent, Review by staff, Decision.
- Decisions in the app, as a push notification, and by email. Accepted applicants tap "Confirm my place".

**Students** (after confirming a place)
- Career coach: CV feedback, cover letter feedback, job interview practice, and history.
- Surveys from instructors.

**Staff** (accounts created by an admin only)
- Review board with status chips, search and filters. Two columns on tablets.
- Applicant detail: details, hub, CV, the AI-written questions, interview answers, transcripts, AI summaries, audio and video playback, notes.
- Accept, Waitlist or Decline with a confirmation screen. Mark "Needs help" for hub assisted mode.
- Overview counted from real rows only: applied, interviewed, accepted, places left, applications by hub, job outcomes.
- Surveys: create, see results, and AI themes that always link back to the raw answers.

## Rules this codebase follows

1. **No fake data.** Nothing in code, seeds or screens invents people, employers, quotes, numbers or stories.
   Empty tables show honest empty states.
2. Graduate stories come only from `graduate_stories` rows with `consent_given = true` and `approved_by` set.
3. Staff numbers come only from database rows (`staff_overview` function).
4. Test accounts exist only in `scripts/dev-seed.mjs`, which refuses to run against production.
5. Simple English everywhere.
6. **The AI never decides.** It only gives feedback, transcripts and summaries. People decide.
   It does not analyse faces, voice tone or emotion. All AI text is labelled "AI generated".
7. **No secrets in the app.** The app holds only the public Supabase URL and anon key.
   OpenAI and other keys live in Edge Function secrets.

## Project layout

```
src/
  app/                 Expo Router screens
    (public)/          Home, sign up, sign in, code check, terms
    (app)/             Applicant and student screens (tabs + stack)
    (staff)/           Staff screens (tabs + stack)
  components/          UI kit: Button, Input, Card, Chip, PillTabBar, Logo, recorders...
  lib/                 Supabase client, auth, data hooks, upload queue, push
  theme.ts             All design tokens
  content.ts           Bootcamp wording, copied word for word from uncommon.org
supabase/
  migrations/          Schema, Row Level Security, storage, triggers, cron
  functions/           Edge Functions (all AI calls happen here)
    _shared/ai.ts      One AI module: OpenAI, with Hugging Face fallback
  setup/               SQL template for a real intake
scripts/dev-seed.mjs   Development-only test accounts
```

## Setup

### 1. App

```bash
npm install
cp .env.example .env
```

Fill in `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` in `.env`. Never commit `.env`.

The app uses native modules (camera, audio, notifications), so use a development build, not Expo Go:

```bash
npx eas-cli@latest build --profile development --platform android
npx expo start --dev-client
```

### 2. Supabase

```bash
npx supabase link --project-ref <your-project-ref>
npx supabase db push
npx supabase functions deploy
```

Then in the Supabase Dashboard:
- **Authentication > Sign In / Providers > Email**: turn on email sign up. Set the OTP length to 6.
- **Authentication > Emails**: in both "Confirm signup" and "Magic Link", show `{{ .Token }}`
  (the code), not a link. `supabase/templates/code.html` is ready to paste.
- **Database > Extensions**: `pg_cron` and `pg_net` are turned on by the migration.
- **Vault**: add `project_url` and `cron_secret` (see the comment in `20261020000002_storage_status_cron.sql`).

### 3. Edge Function secrets

```bash
cp supabase/functions/.env.example supabase/functions/.env
# fill it in, then:
npx supabase secrets set --env-file supabase/functions/.env
```

| Secret | What it is |
| --- | --- |
| `AI_PROVIDER` | `openai` (default) or `huggingface` |
| `OPENAI_API_KEY` | OpenAI key |
| `OPENAI_MODEL` | Model for feedback and summaries (Responses API with structured outputs) |
| `OPENAI_TRANSCRIBE_MODEL` | Speech to text model |
| `HF_TOKEN`, `HF_MODEL`, `HF_TRANSCRIBE_MODEL` | Hugging Face Inference Providers fallback |
| `RESEND_API_KEY`, `EMAIL_FROM` | Decision emails |
| `CRON_SECRET` | Shared with the daily media clean up job |

### 4. Real intake content

Interview questions are written per applicant from their CV, so no question list is needed. Staff still
set up the intake itself (year, dates, places) and, optionally, a review checklist. See
`supabase/setup/intake_setup_template.sql`.
That file also shows how to make someone staff and how to publish a consented graduate story.

### 5. Test accounts (development only)

```bash
# against a local Supabase (npx supabase start)
SUPABASE_URL=http://127.0.0.1:54321 SUPABASE_SERVICE_ROLE_KEY=<local service key> npm run seed:dev
```

Creates "Test Applicant 1" to "Test Applicant 3", "Test Student 1" and "Test Staff 1" with
`@example.test` emails. Add `-- --with-test-intake` for an open test intake so you can click
through the form and interview locally. Delete it before going live.

## Build and release

```bash
npx eas-cli@latest build --profile preview --platform android    # APK for testing
npx eas-cli@latest build --profile production --platform ios     # TestFlight (needs an Apple developer account)
npx eas-cli@latest submit --platform ios
npx eas-cli@latest update --channel preview --message "..."       # over the air update
```

Push notifications need the EAS project ID, which `eas build` adds to `app.json` the first time.

## Fonts

Headings use Outfit and body text uses Nunito Sans (a stand-in for Avenir Next). To use Chillax for
headings, add the font files from Fontshare to `assets/fonts`, load them in `src/app/_layout.tsx`,
and change `fonts.heading` in `src/theme.ts`.

## Logo

`src/components/Logo.tsx` renders the word "uncommon". Replace its body with the official SVG
when you have it. Every screen uses this one component.

# Uncommon Intake

A mobile app (iOS and Android only) for applying to the free Uncommon.org Technology Bootcamp,
following an application to a decision, and supporting students once they join.

Solo capstone project. React Native with Expo (SDK 57), TypeScript, Expo Router and Supabase.

## Links

- **Website** (laptop or phone browser): https://uncommon-intake.netlify.app
  Staff sign in with their work email. Applicants and students are asked to use the phone app.
- **Android app**: install link from the latest EAS build (see Build and release).
- **iPhone**: Expo Go for now; App Store and TestFlight need an Apple Developer account.

To update the staff website after changes: `npx expo export --platform web --output-dir dist`,
add `dist/_redirects` with `/*    /index.html   200`, then `npx netlify-cli deploy --dir=dist --prod`.

## What it does

**Applicants**
- Home: the intake with a live countdown, Uncommon's Innovation Hubs by city, real 2026 graduate
  stories (only with written consent), and "How it works".
- Sign up with name, phone or WhatsApp, and email. Sign in with a code sent by email. No passwords.
- Application in 2 steps with autosave and a review screen:
  1. Details: name, email, phone, where you live, and a hub (dropdown of the real hubs).
  2. CV (PDF or Word, max 5MB). No CV? Write a short "about you" instead.
- After sending, AI reads the CV and writes 5 professional interview questions about that person's
  own experience. Written once per applicant; never about age, gender, family, religion, health,
  background or politics.
- Consent screen, then answers by text, audio (waveform and timer) or short video. Answers are saved
  on the phone and uploaded when the network allows. Low data mode.
- Two commitment questions: at the hub every weekday 9am to 4pm, and volunteering to teach coding to children.
- Status timeline, decision in the app, by push notification and by email. "Confirm my place".
- Profile photo, notifications, and Delete my account.

**Students** (after confirming a place)
- Career coach: CV, cover letter and job interview practice feedback, with history they can delete.
- Surveys from instructors, with push notifications when a new one arrives.

**Staff** (accounts made by an admin, never by sign up)
- Review board with status chips, search and filters (two columns on tablets).
- Applicant page with Interview, Application and Notes tabs: answers, transcripts, AI summaries,
  audio and video, CV, commitments, notes. Accept, Waitlist or Decline with a confirmation screen.
- Overview counted from real rows: applied, interviewed, accepted, places left, applications by hub.
- Job outcomes (add, edit, delete), 2026 graduate stories (add, edit, delete, consent required).
- Surveys (create, edit, close, delete, AI themes linked to raw answers) and messages to all students.

## Rules this codebase follows

1. **No fake data.** Nothing invents people, employers, quotes, numbers or stories. Empty means an honest empty state.
2. Graduate stories show only with `consent_given = true` and `approved_by` set.
3. Staff numbers come only from database rows.
4. Test accounts exist only in `scripts/dev-seed.mjs`, which refuses to run against production.
5. Simple English everywhere, no arrows or dashes in the interface.
6. **The AI never decides.** Feedback, questions, transcripts and summaries only, all labelled
   "AI generated". No face, voice tone or emotion analysis. People decide.
7. **No secrets in the app.** It holds only the public Supabase URL and publishable key.

## Project layout

```
src/
  app/              Expo Router screens: (public), (app) for applicants and students, (staff)
  components/       UI kit: Button, Input, Card, PillTabBar, HubPicker, CvUpload, recorders...
  lib/              Supabase client, auth, data loading and cache, upload queue, push, avatars
  theme.ts          Design tokens (brand blue #0747A1 from uncommon.org)
  content.ts        Bootcamp wording copied from uncommon.org
supabase/
  migrations/       Schema, Row Level Security, storage, triggers, cron
  functions/        Edge Functions; all AI runs here (_shared/ai.ts: OpenAI, Hugging Face fallback)
  setup/            SQL templates: real intake setup, removing the test intake
scripts/
  dev-seed.mjs      Development only test accounts
  expo-go.mjs       Starts the dev server for Expo Go
assets/             App icon, splash image
```

## Run it on your phone (Expo Go)

```bash
npm install
cp .env.example .env    # then fill in the two public Supabase values
npm run go              # scan the QR code with Expo Go
npm run go:tunnel       # if the phone can not reach your computer on Wi-Fi
```

The project is on SDK 57 because the store version of Expo Go does not support SDK 58 yet.
Push notifications do not work in Expo Go; use an installed build for those.

## Supabase

Project: `piksurpdvbmcbupnopeu`. With the CLI linked (`npx supabase link --project-ref piksurpdvbmcbupnopeu`):

```bash
npx supabase db push
npx supabase functions deploy <name> --use-api --project-ref piksurpdvbmcbupnopeu
```

Edge Functions: `generate-questions`, `process-answer`, `coach-feedback`, `survey-themes`,
`decide`, `confirm-place`, `notify-students`, `delete-account`, `purge-media`.

Secrets (Dashboard: Edge Functions, Secrets). Never commit them:

| Secret | What it is |
| --- | --- |
| `AI_PROVIDER` | `openai` (or `huggingface`) |
| `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_TRANSCRIBE_MODEL` | AI (currently `gpt-6-luna` and `gpt-transcribe`) |
| `OPENAI_TTS_MODEL` | Optional. The voice for Listen in the English Tutor (default `gpt-4o-mini-tts`) |
| `HF_TOKEN`, `HF_MODEL`, `HF_TRANSCRIBE_MODEL` | Optional Hugging Face fallback |
| `RESEND_API_KEY`, `EMAIL_FROM` | Decision emails |
| `CRON_SECRET` | Daily recording clean up (also `cron_secret` and `project_url` in Vault) |

Sign in codes are sent through custom SMTP (Authentication, Emails, SMTP Settings) using the Gmail
account `uncommonintake.app@gmail.com` with an app password. Both email templates show `{{ .Token }}`.

Make the first admin in the SQL editor: `update profiles set role = 'admin', hub_id = null where email = '...';`. Admins set up each hub lead on Overview, Staff accounts. New staff sign up at `/staff` with an @uncommon.org email, and their hub lead or an admin approves them.

The real intake, hubs and checklist: see `supabase/setup/intake_setup_template.sql`.
Before 1 November 2026, remove the test intake with `supabase/setup/remove_test_intake.sql`.

## Build and release (EAS)

```bash
npx eas-cli build --platform android --profile preview      # installable APK
npx eas-cli update --channel preview --environment preview  # over the air update for code only changes
```

- EAS project `@brightmoyo3/uncommon-intake`. Public Supabase values come from EAS environment variables.
- Android push uses Firebase project `uncommon-intake-zw26`. `google-services.json` is not in git;
  builds get it from the `GOOGLE_SERVICES_JSON` EAS file variable. The FCM V1 key is uploaded with
  `npx eas-cli credentials -p android`.
- iOS needs an Apple Developer account, then `--platform ios --profile production` and TestFlight.

## Privacy and security

- Row Level Security on every table; column limits so applicants can not change review fields or AI text.
- Private storage buckets with expiring links; recordings deleted after about 90 days.
- Sessions stored in the phone's secure storage; no passwords.
- Every request has a time limit; the app never waits forever.
- The privacy notice (`src/components/PrivacyNotice.tsx`) follows Zimbabwe's Cyber and Data
  Protection Act. Have it reviewed by Uncommon's legal adviser, and register with POTRAZ as a
  data controller before launch.

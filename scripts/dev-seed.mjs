#!/usr/bin/env node
// DEVELOPMENT ONLY. Creates clearly named test accounts so you can click through the app.
// It never runs in production: it refuses unless the target is a local Supabase
// (localhost / 127.0.0.1) or you pass --dev-project AND set DEV_SEED_ALLOWED=yes.
//
// It does NOT create graduate stories, job outcomes, statistics or anything that
// could be mistaken for real data.
//
// Usage:
//   node scripts/dev-seed.mjs                  test accounts only
//   node scripts/dev-seed.mjs --with-test-form also a "Test intake" with labelled test questions
//
// Reads SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY from the environment or .env.development.local.
import { readFileSync, existsSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const args = new Set(process.argv.slice(2));

if (existsSync('.env.development.local')) {
  for (const line of readFileSync('.env.development.local', 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error('Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (for your LOCAL or DEV project).');
  process.exit(1);
}

const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/.test(url);
const devProjectAllowed = args.has('--dev-project') && process.env.DEV_SEED_ALLOWED === 'yes';
if (process.env.NODE_ENV === 'production' || (!isLocal && !devProjectAllowed)) {
  console.error('Refusing to seed: this script is for local or dev projects only.');
  console.error('For a hosted dev project, pass --dev-project and set DEV_SEED_ALLOWED=yes.');
  process.exit(1);
}

const db = createClient(url, serviceKey, { auth: { persistSession: false } });

const accounts = [
  { email: 'test-applicant-1@example.test', first_names: 'Test Applicant', surname: '1', role: 'applicant' },
  { email: 'test-applicant-2@example.test', first_names: 'Test Applicant', surname: '2', role: 'applicant' },
  { email: 'test-applicant-3@example.test', first_names: 'Test Applicant', surname: '3', role: 'applicant' },
  { email: 'test-student-1@example.test', first_names: 'Test Student', surname: '1', role: 'student' },
  { email: 'test-staff-1@example.test', first_names: 'Test Staff', surname: '1', role: 'staff' },
];

async function ensureUser(a) {
  const { data: list } = await db.auth.admin.listUsers({ perPage: 1000 });
  let user = list?.users.find((u) => u.email === a.email);
  if (!user) {
    const { data, error } = await db.auth.admin.createUser({
      email: a.email,
      email_confirm: true,
      user_metadata: { first_names: a.first_names, surname: a.surname },
    });
    if (error) throw error;
    user = data.user;
  }
  const { error } = await db.from('profiles').update({ role: a.role, first_names: a.first_names, surname: a.surname }).eq('id', user.id);
  if (error) throw error;
  return user;
}

for (const a of accounts) {
  const u = await ensureUser(a);
  console.log(`ok  ${a.first_names} ${a.surname}  <${a.email}>  role=${a.role}  id=${u.id}`);
}

if (args.has('--with-test-form')) {
  const { data: intake, error } = await db
    .from('intakes')
    .upsert({ year: 1999, title: 'Test intake (development only)', is_open: true }, { onConflict: 'year' })
    .select()
    .single();
  if (error) throw error;

  await db.from('form_steps').delete().eq('intake_id', intake.id);
  await db.from('form_questions').delete().eq('intake_id', intake.id);
  await db.from('interview_questions').delete().eq('intake_id', intake.id);
  await db.from('review_checklist').delete().eq('intake_id', intake.id);

  const steps = [2, 3, 4, 5, 6, 7];
  await db.from('form_steps').insert(steps.map((step) => ({ intake_id: intake.id, step, title: `Test step ${step}` })));
  await db.from('form_questions').insert(
    steps.map((step) => ({ intake_id: intake.id, step, position: 0, label: `Test question for step ${step}`, kind: 'short_text' })),
  );
  await db.from('form_questions').insert({ intake_id: intake.id, step: 7, position: 1, label: 'Test letter upload', kind: 'letter_upload' });
  await db.from('interview_questions').insert(
    [1, 2, 3, 4, 5].map((position) => ({ intake_id: intake.id, position, prompt: `Test interview question ${position}` })),
  );
  await db.from('review_checklist').insert({ intake_id: intake.id, position: 0, item: 'Test checklist item' });
  console.log(`ok  Test intake (year 1999) with labelled test questions. Delete it before going live.`);
}

console.log('\nSign in with any test email. Codes for local Supabase arrive in Inbucket/Mailpit (http://127.0.0.1:54324).');

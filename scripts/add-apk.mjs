// Copies the newest Android build into dist, so the website can offer it at /uncommon-intake.apk.
// Expo's own download links expire, so the website keeps its own copy. Run after `expo export`.
import { execSync } from 'node:child_process';
import { createWriteStream } from 'node:fs';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';

const out = execSync('npx --yes eas-cli@latest build:list --platform android --status finished --limit 1 --json --non-interactive', { encoding: 'utf8' });
const url = JSON.parse(out)[0]?.artifacts?.applicationArchiveUrl;
if (!url) throw new Error('No finished Android build found.');

const res = await fetch(url);
if (!res.ok) throw new Error(`Download failed: ${res.status}`);
await pipeline(Readable.fromWeb(res.body), createWriteStream('dist/uncommon-intake.apk'));
console.log('APK added to dist.');

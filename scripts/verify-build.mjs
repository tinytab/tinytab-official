// Checks the production build before it is published. The pages may reach only the license center's production
// origins, no development-only value may appear in the output, and the custom domain ships with the site. `pnpm
// build` runs this after Vite; the Deploy workflow publishes the same directory after the check passes.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const dist = join(root, 'dist');
const CUSTOM_DOMAIN = 'tinytab.xinlu.ink';

/** Staging and test settings; none may reach the published site. */
const DEVELOPMENT_MARKERS = [
  'univo-api-staging.xinlu.ink',
  'univo-api-backup-staging.xinlu.ink',
  'localhost', // A local API origin must never ship.
  '1x00000000000000000000AA', // Cloudflare's always-passing Turnstile site key.
  '0x4AAAAAAGCyIfoU4yZAJvIY', // Staging Turnstile site key.
];

/** Files the browser may execute or render; binary assets cannot smuggle settings. */
const INSPECTED_FILE = /\.(html|js|css|svg)$/;

function fail(message) {
  console.error(`\n✗ ${message}`);
  process.exit(1);
}

/** The origins in `.env.production`, which the CSP must allow for orders to reach the license center. */
function productionOrigins() {
  const env = readFileSync(join(root, '.env.production'), 'utf8');
  return ['VITE_API_PRIMARY', 'VITE_API_BACKUP'].map((name) => {
    const value = env.match(new RegExp(`^${name}=(.+)$`, 'm'))?.[1]?.trim();
    if (!value || value.includes('example')) {
      fail(`Set ${name} in .env.production to the Univo license center.`);
    }
    try {
      return new URL(value).origin;
    } catch {
      fail(`${name} in .env.production is not a URL: ${value}`);
    }
  });
}

/** Every file under `dir`, as paths relative to it. */
function filesIn(dir, prefix = '') {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    return statSync(path).isDirectory() ? filesIn(path, `${prefix}${name}/`) : [`${prefix}${name}`];
  });
}

function read(file) {
  try {
    return readFileSync(join(dist, file), 'utf8');
  } catch {
    fail(`dist/${file} is missing: run \`pnpm build\` with Vite first.`);
  }
}

// The site ships its contact address and payment payloads from `src/config.ts`; placeholders must not go out.
const config = readFileSync(join(root, 'src/config.ts'), 'utf8');
const contactEmail = config.match(/CONTACT_EMAIL = '([^']*)'/)?.[1] ?? '';
if (contactEmail === '' || contactEmail.includes('TODO')) {
  fail('Set CONTACT_EMAIL in src/config.ts.');
}
if (/payload: ''/.test(config)) {
  fail('Every payment method in src/config.ts needs a payload.');
}

const origins = productionOrigins();
const html = read('index.html');
if (!html.includes(`connect-src ${origins.join(' ')}`)) {
  fail('dist/index.html lacks the CSP for the production license center origins.');
}

if (read('CNAME').trim() !== CUSTOM_DOMAIN) {
  fail(`dist/CNAME must contain ${CUSTOM_DOMAIN}.`);
}

for (const file of filesIn(dist).filter((name) => INSPECTED_FILE.test(name))) {
  const text = read(file);
  for (const marker of DEVELOPMENT_MARKERS) {
    if (text.includes(marker)) {
      fail(`dist/${file} contains ${marker}: built with development settings?`);
    }
  }
}

console.log(`✓ dist/ is clean: only the production license center origins, and CNAME is ${CUSTOM_DOMAIN}.`);

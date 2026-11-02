// Tests for the personality settings and spoken commands. Run: node scripts/test-personality.mjs
import { mkdtempSync, rmSync, writeFileSync, readFileSync, statSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { parseCommand, commandReply, cleanSettings, loadSettings, saveSettings, DEFAULTS, ACTIVE } from '../personality.js';

let failed = 0;
const check = (name, ok, detail = '') => { console.log(`  ${ok ? '✓' : '✕'} ${name}${ok || !detail ? '' : ` — ${detail}`}`); if (!ok) failed++; };
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

console.log('spoken commands');
const yes = {
  'Work mode.': { mode: 'work' }, "Q, let's get serious": { mode: 'work' }, 'switch to work mode': { mode: 'work' }, 'Get serious.': { mode: 'work' },
  'Back to casual.': { mode: 'casual' }, 'casual mode': { mode: 'casual' }, 'Hey Q, go back to casual': { mode: 'casual' },
  'Auto mode': { mode: 'auto' }, 'You pick.': { mode: 'auto' },
  "Cuttin' Up chill": { level: 'chill' }, 'Cutting up playful.': { level: 'playful' }, "cuttin up wildin'": { level: 'wildin' }, 'Cut in up wilding': { level: 'wildin' }, 'Cuttin’ up on chill': { level: 'chill' },
  'Watch your mouth.': { watchYourMouth: true }, 'WATCHYAMOUTH': { watchYourMouth: true }, 'watchyamouth on': { watchYourMouth: true },
  'WATCHYAMOUTH off': { watchYourMouth: false }, 'Watch your mouth off.': { watchYourMouth: false }, 'watch ya mouth off': { watchYourMouth: false },
};
for (const [said, change] of Object.entries(yes)) check(`"${said}"`, same(parseCommand(said)?.change, change), JSON.stringify(parseCommand(said)));
const no = ["What's work mode?", 'Work mode?', 'I was in work mode all day', 'My friend said watch your mouth to me', 'Is cuttin up playful good?', 'casual', 'serious', 'Get serious about this bug', 'Remember that I like work mode', '', null, 5];
for (const said of no) check(`not a command: ${JSON.stringify(said)}`, parseCommand(said) === null, JSON.stringify(parseCommand(said)));
check('there is no spoken way to change anything else', Object.values(yes).every((c) => Object.keys(c).every((k) => ['mode', 'level', 'watchYourMouth'].includes(k))));
check('while settings have no effect, the read-back says so', ACTIVE === false && /won't change how I talk/.test(commandReply('Work mode')));

console.log('settings');
check('junk is ignored, known values kept', same(cleanSettings({ mode: 'work', level: 'loud', watchYourMouth: 'no', culturalLanguage: true, x: 1 }), { ...DEFAULTS, mode: 'work' }));
check('WATCHYAMOUTH defaults to on', DEFAULTS.watchYourMouth === true);
const dir = mkdtempSync(path.join(tmpdir(), 'q-settings-test-'));
try {
  const file = path.join(dir, 'sub', 'settings.json');
  check('no file yet: defaults, no complaint', same(loadSettings(file), { settings: DEFAULTS, problem: null }));
  saveSettings(file, { ...DEFAULTS, level: 'chill' });
  check('saves and reads back', loadSettings(file).settings.level === 'chill' && !existsSync(`${file}.tmp`));
  check('the file is readable by this user only', (statSync(file).mode & 0o077) === 0);
  writeFileSync(file, '{ not json');
  let r = loadSettings(file);
  check('a damaged file: defaults, and says so', same(r.settings, DEFAULTS) && /damaged/.test(r.problem));
  writeFileSync(file, '[1,2]');
  check('a file of the wrong shape counts as damaged', /damaged/.test(loadSettings(file).problem));
  writeFileSync(file, JSON.stringify({ mode: 'nonsense', level: 'wildin' }));
  r = loadSettings(file);
  check('a bad value doesn’t spoil the good ones', r.settings.mode === 'auto' && r.settings.level === 'wildin' && !r.problem);
  check('nothing else was written', JSON.parse(readFileSync(file, 'utf8')).level === 'wildin');
} finally { rmSync(dir, { recursive: true, force: true }); }

if (failed) { console.log(`\n${failed} case(s) failed\n`); process.exit(1); }
console.log('\nall passed\n');

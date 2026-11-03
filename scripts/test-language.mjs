// Tests for the language filter. Run: node scripts/test-language.mjs
// The words are base64 here too, so this file can't be searched either, and
// failures print numbers, never the words.
import { cleanText, createLanguageFilter, languagePolicy } from '../language.js';

let failed = 0;
const check = (name, ok, detail = '') => { console.log(`  ${ok ? '✓' : '✕'} ${name}${ok || !detail ? '' : ` — ${detail}`}`); if (!ok) failed++; };
const V = Object.fromEntries(Object.entries({"f": "ZnVjaw==", "ing": "ZnVja2luZw==", "sh": "c2hpdA==", "da": "ZGFtbg==", "as": "YXNz", "bi": "Yml0Y2g=", "c1": "bmlnZ2E=", "c2": "bmlnZ2Fz", "h1": "bmlnZ2Vy", "h2": "bmlnZ2Vycw==", "star": "Zipjaw==", "bang": "c2ghdA==", "long": "c2hpaWl0", "upper": "U0hJVA==", "cap": "RnVjaw=="}).map(([k, b]) => [k, Buffer.from(b, 'base64').toString()]));
const ALL = { swearing: true, cultural: true };
const stream = (parts, policy) => { const f = createLanguageFilter(policy); const out = parts.map((t) => f.push(t)).join('') + f.end(); return { out, hits: f.hits() }; };

console.log('swapping and dropping');
check('swaps a word with a mild one', cleanText(`A ${V.da} good day.`, ALL).text === 'A dang good day.');
check('keeps a capital', cleanText(`${V.cap} that.`, ALL).text === 'Freak that.');
check('swaps the -ing form', cleanText(`So ${V.ing} good.`, ALL).text === 'So freaking good.');
check('drops a word with no swap, tidily', cleanText(`You ${V.bi}, please.`, ALL).text === 'You please.', JSON.stringify(cleanText(`You ${V.bi}, please.`, ALL).hits));
check('counts what it changed', cleanText(`${V.da} ${V.sh}`, ALL).hits === 2);
check('shouted, stretched, starred', [V.upper, V.long, V.star, V.bang].every((w) => cleanText(`It was ${w} today.`, ALL).hits === 1));

console.log('words that must survive');
for (const safe of ['class', 'assess', 'assassin', 'bass', 'passing', 'glass', 'Dickens', 'Dick Gregory', 'cocktail', 'Hancock', 'shitake', 'Scunthorpe', 'therapist', 'peacock', 'dickie', 'mass', 'Nigeria', 'Nigerian', 'niger', 'Dam', 'dame', 'bitcoin', 'assume', 'pistachio', 'snigger']) {
  const r = cleanText(`The ${safe} here.`, ALL);
  check(`"${safe}"`, r.hits === 0 && r.text === `The ${safe} here.`, r.text);
}

console.log('the rules');
const P = (watchYourMouth, mode, culturalLanguage) => languagePolicy({ watchYourMouth, mode, culturalLanguage });
check('WATCHYAMOUTH on blocks swearing in every mode', ['auto', 'casual', 'work'].every((m) => P(true, m, false).swearing));
check('Work blocks swearing even with WATCHYAMOUTH off', P(false, 'work', false).swearing && !P(false, 'casual', false).swearing && !P(false, 'auto', false).swearing);
const combos = [];
for (const w of [true, false]) for (const m of ['auto', 'casual', 'work']) for (const c of [true, false]) combos.push([w, m, c]);
for (const [w, m, c] of combos) {
  const allowed = !w && m === 'casual' && c;
  const p = P(w, m, c);
  const a = cleanText(`Yo ${V.c1} and ${V.c2} here.`, p);
  const h = cleanText(`Yo ${V.h1} and ${V.h2} here.`, p);
  check(`mouth ${w ? 'on' : 'off'}, ${m}, cultural ${c ? 'on' : 'off'}: ${allowed ? 'allowed' : 'blocked'}; hard-R blocked`, (allowed ? a.hits === 0 : a.hits === 2) && h.hits === 2 && !/nigg/i.test(h.text), `${a.hits}/${h.hits}`);
}
check('hard-R stays blocked when the colloquial word is allowed', cleanText(V.h1, P(false, 'casual', true)).hits === 1);

console.log('words split across pieces');
const half = Math.floor(V.ing.length / 2);
let r = stream(['So ', V.ing.slice(0, half), V.ing.slice(half), ' good.'], ALL);
check('a word in two pieces is still caught', r.out === 'So freaking good.' && r.hits === 1, r.out);
r = stream([...`It was ${V.sh}.`], ALL);
check('even one letter at a time', r.out === 'It was shoot.' && r.hits === 1, r.out);
const f = createLanguageFilter(ALL);
check('none of a word gets out before it is complete', f.push('So ') === 'So ' && f.push(V.sh.slice(0, 2)) === '' && f.push(V.sh.slice(2)) === '' && f.push(' now') === 'shoot ' && f.end() === 'now');
check('a word at the very end is caught', stream([`Well ${V.da}`], ALL).out === 'Well dang');
check('ordinary text passes unchanged, spacing and all', stream(['Abuja. ', 'Lagos gets more ', "attention, but it's not the capital."], ALL).out === "Abuja. Lagos gets more attention, but it's not the capital.");
check('nothing to filter, nothing counted', stream(['Fine ', 'day.'], ALL).hits === 0);

if (failed) { console.log(`\n${failed} case(s) failed\n`); process.exit(1); }
console.log('\nall passed\n');

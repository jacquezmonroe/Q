// Q's language rules, enforced in code (D-048, D-049): profanity, the colloquial
// n-word and its hard-R form. Every reply passes through this on the server
// before it is shown, spoken or saved. It works on whole words, so "class" and
// "assess" are safe, and a word that is also a common first name is left off
// the list (Dick Gregory). It catches words, not tone, and only spellings it knows.
//
// The word list is base64 so it can't be read at a glance or found by searching
// the public repository. That is tidiness, not secrecy: anyone can decode it.

const LISTS = JSON.parse(Buffer.from([
  'eyJzd2VhciI6eyJmdWNrIjoiZnJlYWsiLCJmdWNrcyI6ImZyZWFrcyIsImZ1Y2tpbmciOiJmcmVha2luZyIsImZ1Y2tpbiI6',
  'ImZyZWFraW4iLCJmdWNrZWQiOiJtZXNzZWQgdXAiLCJmdWNrZXIiOiIiLCJmdWNrZXJzIjoiIiwibW90aGVyZnVja2VyIjoi',
  'IiwibW90aGVyZnVja2VycyI6IiIsIm1vdGhlcmZ1Y2tpbmciOiIiLCJzaGl0Ijoic2hvb3QiLCJzaGl0cyI6IiIsInNoaXR0',
  'eSI6ImxvdXN5Iiwic2hpdHRpbmciOiIiLCJidWxsc2hpdCI6Im5vbnNlbnNlIiwiZGFtbiI6ImRhbmciLCJnb2RkYW1uIjoi',
  'ZGFuZyIsImdvZGRhbW5lZCI6ImRhbmciLCJkYW1uZWQiOiJkYW5nIiwiYXNzIjoiIiwiYXNzZXMiOiIiLCJhc3Nob2xlIjoi',
  'amVyayIsImFzc2hvbGVzIjoiamVya3MiLCJiaXRjaCI6IiIsImJpdGNoZXMiOiIiLCJiaXRjaGluZyI6ImNvbXBsYWluaW5n',
  'IiwiYmFzdGFyZCI6ImplcmsiLCJiYXN0YXJkcyI6ImplcmtzIiwiY29jayI6IiIsImNvY2tzIjoiIiwicHVzc3kiOiIiLCJw',
  'aXNzIjoiIiwicGlzc2VkIjoibWFkIiwiY3VudCI6IiIsImN1bnRzIjoiIiwid2hvcmUiOiIiLCJ3aG9yZXMiOiIiLCJzbHV0',
  'IjoiIiwic2x1dHMiOiIiLCJ3YW5rZXIiOiIiLCJ0d2F0IjoiIn0sImN1bHR1cmFsIjpbIm5pZ2dhIiwibmlnZ2FzIiwibmln',
  'Z2F6IiwibmlnZ2FoIiwibmlnZ3VoIl0sImhhcmQiOlsibmlnZ2VyIiwibmlnZ2VycyIsIm5pZ2dhciIsIm5pZ2dhcnMiLCJu',
  'aWdndXIiXX0=',
].join(''), 'base64').toString('utf8'));

// Stretched and starred spellings: "shiiit", "f*ck", "sh!t".
const SWAP = { a: '[a@*]', e: '[e*]', i: '[i!1*]', o: '[o0*]', u: '[u*]', s: '[s$]' };
// Only vowels stretch: stretching consonants would turn "assess" into a match.
const spelled = (word) => [...word].map((c) => (`aeiou`.includes(c) ? `${SWAP[c]}+` : SWAP[c] ?? c)).join('');
const BEFORE = "(?<![\\p{L}\\p{N}])";
const AFTER = "(?![\\p{L}\\p{N}])";
const pattern = (words) => new RegExp(`${BEFORE}(${[...words].sort((a, b) => b.length - a.length).map(spelled).join('|')})${AFTER}`, 'giu');
const WORDS = pattern(Object.keys(LISTS.swear));
const CULTURAL = pattern(LISTS.cultural);
const HARD = pattern(LISTS.hard);

// Which word this spelling is, once stretching and stars are undone.
const canonical = (found) => Object.keys(LISTS.swear).find((w) => new RegExp(`^${spelled(w)}$`, 'iu').test(found));

// What is blocked right now. The hard-R form is always blocked. The colloquial
// word needs all three: permission on, WATCHYAMOUTH off, and Casual mode. Auto
// doesn't count as Casual until Q can tell which mode it's in (Phase 4).
export function languagePolicy(s) {
  return {
    swearing: s.watchYourMouth !== false || s.mode === 'work',
    cultural: !(s.culturalLanguage === true && s.watchYourMouth === false && s.mode === 'casual'),
  };
}

const matchCase = (found, mild) => (found[0] === found[0].toUpperCase() && found[0] !== found[0].toLowerCase() ? mild.charAt(0).toUpperCase() + mild.slice(1) : mild);

// Removes or swaps blocked words. A word with no mild swap is dropped, with the
// comma or space after it, and the text is left to read as naturally as it can.
export function cleanText(text, policy) {
  let hits = 0;
  const drop = (re) => {
    out = out.replace(new RegExp(`${re.source}[,;:]?\\s?`, 'giu'), () => { hits++; return ''; });
  };
  let out = String(text);
  drop(HARD);
  if (policy.cultural) drop(CULTURAL);
  if (policy.swearing) {
    out = out.replace(new RegExp(`${WORDS.source}([,;:]?\\s?)`, 'giu'), (all, found, tail) => {
      hits++;
      const mild = LISTS.swear[canonical(found)];
      return mild ? matchCase(found, mild) + tail : '';
    });
  }
  return { text: out, hits };
}

// For a reply arriving in pieces: a word split across two pieces has to be seen
// whole, so anything after the last word break waits for the next piece.
const WORD_CHARS = /[\p{L}\p{N}*@!$'’-]+$/u;
export function createLanguageFilter(policy) {
  let held = '';
  let hits = 0;
  const pass = (t) => { const r = cleanText(t, policy); hits += r.hits; return r.text; };
  return {
    push(text) {
      held += text;
      const tail = held.match(WORD_CHARS)?.[0] ?? '';
      const ready = held.slice(0, held.length - tail.length);
      if (!ready) return '';
      const out = pass(ready);
      held = tail;
      return out;
    },
    end() { const out = pass(held); held = ''; return out; },
    hits: () => hits,
  };
}

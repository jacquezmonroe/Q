// Approved memories (v0.4 step 3): the plain-code side. Nothing here asks
// the model anything. It recognises "remember that …" (said or typed), turns
// the fact into Q's read-back line, and builds the block of facts that goes
// at the top of what Q is sent.

export const MAX_MEMORIES = 20;
export const MAX_MEMORY_CHARS = 140;

// Words that may come before the command: "Q, …", "hey Q, …", "okay, …".
const LEAD = /^(?:(?:hey|yo|ok(?:ay)?|so|and|also|oh)\s*,?\s+)*(?:q\s*[,.]?\s+)?(?:please\s+)?/i;
// "remember when/what/how …" asks about the past; it is not a request to keep something.
const NOT_A_FACT = /^(?:when|what|how|who|where|why|if|whether|me|you|us|this conversation|to\b)/i;

// Returns the fact to remember, in his own words, or null if this isn't a request to remember something.
export function parseRemember(text) {
  if (typeof text !== 'string') return null;
  const s = text.trim().replace(LEAD, '');
  const m = s.match(/^(?:(?:can|could|would|will)\s+you\s+)?(?:remember|don'?t\s+forget|do\s+not\s+forget|keep\s+in\s+mind)\s*(?:that\s+|this\s*[:,-]\s*|[:,-]\s*)?(.+)$/is);
  if (!m) return null;
  let fact = m[1].trim();
  if (NOT_A_FACT.test(fact)) return null;
  fact = fact.replace(/^that\s+/i, '').replace(/[\s.!?,;:]+$/, '').replace(/\s+/g, ' ');
  if (fact.split(' ').length < 2) return null; // "remember it", "remember this": nothing to keep
  return fact.charAt(0).toUpperCase() + fact.slice(1);
}

// His words in Q's mouth: "my sister" → "your sister", "I'm" → "you're".
const SWAP = {
  i: 'you', "i'm": "you're", im: "you're", "i've": "you've", "i'll": "you'll", "i'd": "you'd",
  me: 'you', my: 'your', mine: 'yours', myself: 'yourself', am: 'are', was: 'was',
};
export function readBack(fact) {
  let afterI = false;
  const out = fact.replace(/[A-Za-z']+/g, (w) => {
    const low = w.toLowerCase();
    let r = w;
    if (low === 'am' && afterI) r = 'are';
    else if (low === 'was' && afterI) r = 'were';
    else if (low in SWAP && low !== 'am' && low !== 'was') r = SWAP[low];
    afterI = low === 'i';
    return r;
  });
  return out.charAt(0).toUpperCase() + out.slice(1);
}

// His words about himself, rewritten so the model can't take them as its own:
// "I'm allergic to peanuts" → "He's allergic to peanuts". In a 2026-10-17
// test, facts left as "my sister's name is Ada" (bare or in quotes) were
// repeated by the model as "my sister", and used for his brother's name too.
const MODALS = new Set(['can', 'could', 'will', 'would', 'should', 'shall', 'must', 'might', 'may', "can't", "won't", "couldn't", "wouldn't", "shouldn't", 'was', "wasn't", 'used']);
const ADVERBS = new Set(['always', 'never', 'usually', 'often', 'really', 'also', 'just', 'still', 'sometimes', 'rarely', 'only', 'mostly', 'actually', 'basically', 'definitely', 'probably', 'kind', 'sort', 'mainly', 'normally', 'generally', 'totally', 'absolutely', 'hardly', 'barely', 'already', 'even', 'mostly']);
const THIRD = { i: 'he', me: 'him', my: 'his', mine: 'his', myself: 'himself', "i'm": "he's", im: "he's", "i've": "he's", "i'll": "he'll", "i'd": "he'd" };
const AGREE = { am: 'is', have: 'has', do: 'does', "don't": "doesn't", "haven't": "hasn't", are: 'is', "aren't": "isn't", go: 'goes' };
function thirdPersonVerb(w) {
  const low = w.toLowerCase();
  if (low in AGREE) return AGREE[low];
  if (MODALS.has(low) || /(ed|ing|s)$/.test(low) && !/(ss|us)$/.test(low)) return w; // past tense, -ing, already agreeing
  if (/(sh|ch|x|z|o|ss)$/.test(low)) return `${w}es`;
  if (/[^aeiou]y$/.test(low)) return `${w.slice(0, -1)}ies`;
  return `${w}s`;
}
export function aboutHim(fact) {
  const words = fact.split(/(\s+)/);
  let afterI = false;
  for (let i = 0; i < words.length; i++) {
    const w = words[i];
    if (!w.trim()) continue;
    const m = w.match(/^([A-Za-z']+)(.*)$/);
    if (!m) { afterI = false; continue; }
    const [, word, rest] = m;
    const low = word.toLowerCase();
    if (afterI && ADVERBS.has(low)) { continue; } // "I always use" → "He always uses"
    if (afterI) { words[i] = thirdPersonVerb(word) + rest; afterI = false; continue; }
    if (low in THIRD) { words[i] = THIRD[low] + rest; afterI = low === 'i' && !rest; continue; }
  }
  const out = words.join('');
  return out.charAt(0).toUpperCase() + out.slice(1);
}

// The facts, as Q is shown them: at the very top, before the persona, so the
// persona's closing honesty check stays last.
export function memoryBlock(memories) {
  if (!memories?.length) return '';
  const lines = memories.map((m) => `- ${aboutHim(m.text)}.`).join('\n');
  return `Facts about him (the user, not you), which he asked you to remember:\n${lines}\nUse one only when it matters to what he's saying. Never suggest anything that goes against them. Never add to them or guess beyond them.`;
}

// Tidies a fact typed or said, and says why it can't be kept if it can't.
export function cleanMemory(text) {
  const t = String(text ?? '').replace(/\s+/g, ' ').trim().replace(/[\s.!?,;:]+$/, '');
  if (!t) return { error: 'empty' };
  if (t.length > MAX_MEMORY_CHARS) return { error: 'too-long' };
  return { text: t.charAt(0).toUpperCase() + t.slice(1) };
}

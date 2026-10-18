// Tests for approved memories: the "remember" matcher, the read-back and the prompt block. Run: node scripts/test-memory.mjs
import { parseRemember, readBack, memoryBlock, cleanMemory, aboutHim, createSuggestionFilter, offerable, answerTo, MAX_MEMORY_CHARS } from '../memory.js';

let failed = 0;
const check = (name, ok, detail = '') => { console.log(`  ${ok ? '✓' : '✕'} ${name}${ok || !detail ? '' : ` — ${detail}`}`); if (!ok) failed++; };

console.log('recognising "remember …"');
const yes = {
  'Remember that my sister\'s name is Ada.': "My sister's name is Ada",
  'remember my sister\'s name is Ada': "My sister's name is Ada",
  'Q, remember that I prefer short answers.': 'I prefer short answers',
  'Hey Q, please remember I work late on Fridays': 'I work late on Fridays',
  'Can you remember that my birthday is March 3rd?': 'My birthday is March 3rd',
  "Don't forget that I'm allergic to peanuts.": "I'm allergic to peanuts",
  'Keep in mind I use VS Code for everything': 'I use VS Code for everything',
  'Okay, remember this: the portfolio project lives in my Projects folder.': 'The portfolio project lives in my Projects folder',
  'Remember: I drink my coffee black.': 'I drink my coffee black',
};
for (const [said, fact] of Object.entries(yes)) {
  const got = parseRemember(said);
  check(`"${said}"`, got === fact, `got ${JSON.stringify(got)}`);
}
const no = [
  'Do you remember what we talked about yesterday?', 'Remember when we fixed the mic?', 'I can\'t remember the name of that song',
  'I remember my first computer', 'Remember what I said earlier?', 'remember how this works?', 'Remember me?', 'remember it',
  'remember this', 'What should I remember for the exam?', 'Tell me how to remember names better', 'Remember to drink water',
  '', '   ', null, 42, 'Who do you remember?',
];
for (const said of no) check(`not a request: ${JSON.stringify(said)}`, parseRemember(said) === null, `got ${JSON.stringify(parseRemember(said))}`);

console.log('reading it back in Q\'s words');
const back = {
  "My sister's name is Ada": "Your sister's name is Ada",
  'I prefer short answers': 'You prefer short answers',
  "I'm allergic to peanuts": "You're allergic to peanuts",
  'I am a night owl and I was born in Lagos': 'You are a night owl and you were born in Lagos',
  'The portfolio project lives in my Projects folder': 'The portfolio project lives in your Projects folder',
  'Ada is my sister, not mine to boss around': 'Ada is your sister, not yours to boss around',
};
for (const [fact, said] of Object.entries(back)) check(`"${fact}" → "${said}"`, readBack(fact) === said, `got ${JSON.stringify(readBack(fact))}`);

console.log('what Q is shown');
check('no memories, nothing added', memoryBlock([]) === '' && memoryBlock(null) === '');
const block = memoryBlock([{ text: "My sister's name is Ada" }, { text: 'I prefer short answers' }]);
check('rewrites each fact about him in the third person', block.includes("- His sister's name is Ada.\n- He prefers short answers."), block);
check('says the facts are about him, not Q, and how to use them', /about him \(the user, not you\)/.test(block) && /Never suggest anything that goes against them/.test(block) && /Never add to them or guess beyond them/.test(block));

console.log('his words, about him');
const third = {
  "My sister's name is Ada": "His sister's name is Ada",
  "I'm allergic to peanuts": "He's allergic to peanuts",
  'I use VS Code for everything': 'He uses VS Code for everything',
  'I always drink my coffee black': 'He always drinks his coffee black',
  "I don't like mornings": "He doesn't like mornings",
  'I work late on Fridays': 'He works late on Fridays',
  'I have two cats': 'He has two cats',
  'I am a night owl': 'He is a night owl',
  'I was born in Lagos': 'He was born in Lagos',
  'I can play the guitar': 'He can play the guitar',
  "I've been learning Swift": "He's been learning Swift",
  'I study at night and I watch anime': 'He studies at night and he watches anime',
  'I go to the gym on Mondays': 'He goes to the gym on Mondays',
  'I fix bikes for fun': 'He fixes bikes for fun',
  'The portfolio project lives in my Projects folder': 'The portfolio project lives in his Projects folder',
  'Call me Jay': 'Call him Jay',
  'Ada is my sister': 'Ada is his sister',
};
for (const [fact, want] of Object.entries(third)) check(`"${fact}" → "${want}"`, aboutHim(fact) === want, `got ${JSON.stringify(aboutHim(fact))}`);

console.log('tidying');
check('trims, collapses spaces, capitalises, drops end punctuation', cleanMemory('  my   dog is   called Rex.  ').text === 'My dog is called Rex');
check('refuses empty', cleanMemory('  ').error === 'empty' && cleanMemory(null).error === 'empty');
check(`refuses over ${MAX_MEMORY_CHARS} characters`, cleanMemory('x'.repeat(MAX_MEMORY_CHARS + 1)).error === 'too-long' && cleanMemory('x'.repeat(MAX_MEMORY_CHARS)).text.length === MAX_MEMORY_CHARS);

console.log('Q suggesting a memory');
const tidy = (t) => t.replace(/\s+/g, ' ').trim(); // spare spaces around removed text are harmless in speech
const stream = (parts) => { const f = createSuggestionFilter(); const shown = parts.map((t) => f.push(t)); const rest = f.end(); return { early: shown, text: tidy(shown.join('') + rest), question: f.question() }; };
let r = stream(['Rex is a solid', ' name. Want me', ' to remember', ' that?']);
check('holds back a closing "want me to remember that?" and hands it over separately', r.text === 'Rex is a solid name.' && r.question === 'Want me to remember that?', JSON.stringify(r));
check('nothing of the question gets out early, even in pieces', r.early.join('').trim() === 'Rex is a solid name.', JSON.stringify(r.early));
for (const q of ['Should I remember that?', 'Do you want me to keep that?', 'Would you like me to save this?', 'want me to remember that for you?']) check(`recognises "${q}"`, stream([`Nice. ${q}`]).question === q);
r = stream(['Want me to explain more?']);
check('other "want me to …" questions are let through', r.text === 'Want me to explain more?' && r.question === '', JSON.stringify(r));
r = stream(['Want me to remember that? Miso is a great name.']);
check('a question in the middle is just text', r.text === 'Want me to remember that? Miso is a great name.' && r.question === '');
check('a remember tag the model writes anyway is removed', stream(['Sure. [[remember: your dog is Rex]]']).text === 'Sure.' && stream(['Big change. [remember: you are moving].']).text === 'Big change.' && stream(['Sure. [[remember: your dog']).text === 'Sure.');
check('ordinary brackets are left alone', stream(['A list [1] and ', 'more [2].']).text === 'A list [1] and more [2].');
check('a normal reply passes untouched', stream(['Just ', 'a reply.']).text === 'Just a reply.');

console.log('what can be offered');
const offer = {
  "My dog's name is Rex.": "My dog's name is Rex",
  "I'm moving to Atlanta in May.": "I'm moving to Atlanta in May",
  'Q, I work at a bakery on weekends': 'I work at a bakery on weekends',
  "I'm tired today.": null, 'I am so hungry right now': null, "What's the capital of Nigeria?": null,
  'yes': null, 'Remember that I like tea': null, 'Hi': null, 'Ok cool': null, ['x '.repeat(80)]: null,
};
for (const [said, want] of Object.entries(offer)) check(`"${said.slice(0, 40)}" → ${want === null ? 'not offered' : `"${want}"`}`, offerable(said) === want, `got ${JSON.stringify(offerable(said))}`);

const yesNo = { 'yes': true, 'Yeah.': true, 'Q, yes please': true, 'sure!': true, 'do it': true, 'go ahead': true, 'save it': true, 'no': false, 'Nah.': false, 'no thanks': false, "don't": false, 'never mind': false, 'yes but what about Ada': null, 'maybe': null, 'What time is it?': null, '': null };
for (const [said, want] of Object.entries(yesNo)) check(`"${said}" answers ${want === null ? 'nothing' : want ? 'yes' : 'no'}`, answerTo(said) === want, `got ${answerTo(said)}`);

if (failed) { console.log(`\n${failed} case(s) failed\n`); process.exit(1); }
console.log('\nall passed\n');

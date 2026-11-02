// Q's personality settings (Personality Core 2.1, Phase 1): one file shared by
// Q's window and any browser, and the spoken commands that change it. Commands
// are matched in plain code, never by the model, and must be the whole message.
//
// These settings don't change how Q talks yet: the filter comes in Phase 2,
// the persona in Phase 3. ACTIVE says so, so nothing claims otherwise.

import { readFileSync, writeFileSync, renameSync, mkdirSync } from 'node:fs';
import path from 'node:path';
import { LEAD } from './memory.js';

export const ACTIVE = false;
export const MODES = ['auto', 'casual', 'work'];
export const LEVELS = ['chill', 'playful', 'wildin'];
export const DEFAULTS = { mode: 'auto', level: 'playful', watchYourMouth: true, learningMoments: true };

// Keeps only known settings with allowed values; anything else is ignored.
export function cleanSettings(raw, base = DEFAULTS) {
  const out = { ...base };
  if (MODES.includes(raw?.mode)) out.mode = raw.mode;
  if (LEVELS.includes(raw?.level)) out.level = raw.level;
  if (typeof raw?.watchYourMouth === 'boolean') out.watchYourMouth = raw.watchYourMouth;
  if (typeof raw?.learningMoments === 'boolean') out.learningMoments = raw.learningMoments;
  return out;
}

// A missing file is normal. A damaged one falls back to the defaults, and says so.
export function loadSettings(file) {
  let text;
  try { text = readFileSync(file, 'utf8'); } catch (err) {
    return err.code === 'ENOENT' ? { settings: { ...DEFAULTS }, problem: null } : { settings: { ...DEFAULTS }, problem: `couldn't read the settings file: ${err.message}` };
  }
  try {
    const raw = JSON.parse(text);
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('not a settings object');
    return { settings: cleanSettings(raw), problem: null };
  } catch {
    return { settings: { ...DEFAULTS }, problem: 'the settings file was damaged, so Q is using the defaults' };
  }
}

// Written to a temporary file first, so a crash can't leave half a file.
export function saveSettings(file, settings) {
  mkdirSync(path.dirname(file), { recursive: true, mode: 0o700 });
  const tmp = `${file}.tmp`;
  writeFileSync(tmp, `${JSON.stringify(settings, null, 2)}\n`, { mode: 0o600 });
  renameSync(tmp, file);
}

const CHANGE = [
  [/^(?:switch to |go to |go into )?work mode$|^let'?s get serious$|^get serious$/, { mode: 'work' }, 'Work mode'],
  [/^(?:switch to |go to )?casual mode$|^(?:go )?back to casual$/, { mode: 'casual' }, 'Casual mode'],
  [/^(?:switch to |go to )?auto(?:matic)? mode$|^you pick$/, { mode: 'auto' }, 'Auto mode'],
  [/^(?:cuttin'?|cutting|cut in) up (?:on )?chill$/, { level: 'chill' }, 'Cuttin\' Up on chill'],
  [/^(?:cuttin'?|cutting|cut in) up (?:on )?playful$/, { level: 'playful' }, 'Cuttin\' Up on playful'],
  [/^(?:cuttin'?|cutting|cut in) up (?:on )?wild(?:in'?|ing)?$/, { level: 'wildin' }, 'Cuttin\' Up on wildin\''],
  [/^(?:watch ?ya ?mouth|watch ?yo ?mouth|watch ?your ?mouth)(?: on)?$/, { watchYourMouth: true }, 'WATCHYAMOUTH on'],
  [/^(?:watch ?ya ?mouth|watch ?yo ?mouth|watch ?your ?mouth) off$/, { watchYourMouth: false }, 'WATCHYAMOUTH off'],
];

// Returns { change, label } for a whole-message command, or null. A question is never a command.
export function parseCommand(text) {
  if (typeof text !== 'string' || /\?\s*$/.test(text)) return null;
  const s = text.trim().replace(/[’‘]/g, "'").replace(LEAD, '').replace(/[.!,\s]+$/, '').toLowerCase();
  for (const [pattern, change, label] of CHANGE) if (pattern.test(s)) return { change, label };
  return null;
}

// What Q says back. While the settings have no effect, it says that too.
export const commandReply = (label) => `${label}.${ACTIVE ? '' : ' Saved, but it won\'t change how I talk until my new personality is in.'}`;

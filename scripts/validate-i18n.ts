import { readFileSync } from 'node:fs';

const source = readFileSync(new URL('../src/app/i18n.ts', import.meta.url), 'utf8');
const en = source.match(/en:\s*\{([\s\S]*?)\n\s*\},\n\s*fr:/)?.[1] ?? '';
const fr = source.match(/fr:\s*\{([\s\S]*?)\n\s*\},\n\} as const/)?.[1] ?? '';
const keys = (value: string) =>
  [...value.matchAll(/^\s{4}([a-zA-Z]+):/gm)].map((match) => match[1]);
const enKeys = keys(en);
const frKeys = keys(fr);
if (enKeys.join() !== frKeys.join()) {
  console.error('English and French translation keys differ.');
  process.exitCode = 1;
} else {
  console.log(`${enKeys.length} translation keys validated.`);
}

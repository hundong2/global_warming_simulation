import { readFile, readdir, stat } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { createHash } from 'node:crypto';
const html = await readFile('dist/index.html', 'utf8');
if (/\b(?:src|href)="\/(?!\/)/.test(html))
  throw new Error('Build contains root-relative assets.');
for (const [, path] of html.matchAll(/(?:src|href)="(\.\/[^"#?]+)"/g))
  await stat(resolve('dist', path));
const geography = await readFile('public/data/countries.geojson');
const digest = createHash('sha256').update(geography).digest('hex');
if (
  digest !== 'e4578a878f5be98ca4b5796a750bb976e76d27ac8260058fa5cc44fe30143b27'
)
  throw new Error('Geography changed: review provenance.');
const documents = [
  'README.md',
  'README.ko.md',
  'AGENTS.md',
  'AGENTS.ko.md',
  ...(await readdir('docs'))
    .filter((f) => f.endsWith('.md'))
    .map((f) => `docs/${f}`),
  ...(await readdir('docs/ko'))
    .filter((f) => f.endsWith('.md'))
    .map((f) => `docs/ko/${f}`),
];
for (const file of documents) {
  const text = await readFile(file, 'utf8');
  if (!text.includes('English') || !text.includes('한국어'))
    throw new Error(`Missing language navigation: ${file}`);
  for (const [, link] of text.matchAll(/\]\(([^)]+)\)/g)) {
    if (/^(https?:|mailto:|#)/.test(link)) continue;
    await stat(resolve(dirname(file), decodeURI(link.split('#')[0])));
  }
}
for (const file of (await readdir('docs')).filter((f) => f.endsWith('.md'))) {
  const en = await readFile(`docs/${file}`, 'utf8'),
    ko = await readFile(`docs/ko/${file}`, 'utf8');
  if (!en.includes(`](ko/${file})`) || !ko.includes(`](../${file})`))
    throw new Error(`Missing reciprocal links: ${file}`);
  const urls = (text) =>
    [...new Set(text.match(/https?:\/\/[^\s)>`]+/g) ?? [])].sort();
  if (JSON.stringify(urls(en)) !== JSON.stringify(urls(ko)))
    throw new Error(`External source mismatch: ${file}`);
}
console.log(
  `Static asset paths, geography SHA-256, and ${documents.length} bilingual documents verified.`,
);

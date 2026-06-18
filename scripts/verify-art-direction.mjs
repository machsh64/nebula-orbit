import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = process.cwd();
const artDirectionPath = resolve(root, 'src/data/artDirection.ts');
const source = readFileSync(artDirectionPath, 'utf8');

const requiredExports = [
  'ART_DIRECTION',
  'SPECTRAL_TRAILS',
  'CONSTELLATION_VERSES',
];

for (const exportName of requiredExports) {
  if (!source.includes(`export const ${exportName}`)) {
    throw new Error(`Missing art-direction export: ${exportName}`);
  }
}

const trailMatches = [...source.matchAll(/\bid:\s*'([^']+)'/g)].map(match => match[1]);
const duplicateIds = trailMatches.filter((id, index) => trailMatches.indexOf(id) !== index);
if (duplicateIds.length > 0) {
  throw new Error(`Duplicate art-direction ids: ${[...new Set(duplicateIds)].join(', ')}`);
}

const paletteMatches = [...source.matchAll(/#[0-9a-fA-F]{6}/g)].map(match => match[0].toLowerCase());
const uniquePalette = new Set(paletteMatches);
if (uniquePalette.size < 10) {
  throw new Error(`Expected at least 10 unique palette colors, found ${uniquePalette.size}`);
}

const verseMatches = [...source.matchAll(/text:\s*'([^']+)'/g)].map(match => match[1]);
if (verseMatches.length < 4) {
  throw new Error(`Expected at least 4 constellation verses, found ${verseMatches.length}`);
}

if (!verseMatches.every(text => text.length >= 18 && text.length <= 64)) {
  throw new Error('Every constellation verse must be between 18 and 64 characters');
}

console.log(`Art direction verified: ${uniquePalette.size} colors, ${verseMatches.length} verses.`);

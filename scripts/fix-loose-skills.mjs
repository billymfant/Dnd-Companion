// One-off: convert loose .claude/skills/*.md files (non-standard frontmatter)
// into proper <stem>/SKILL.md skill folders Claude Code can discover.
import { readdirSync, readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';

const SKILLS = 'D:/apps/DnD Companion/.claude/skills';
const looseFiles = readdirSync(SKILLS, { withFileTypes: true })
  .filter((d) => d.isFile() && d.name.endsWith('.md'))
  .map((d) => d.name);

const results = [];
for (const file of looseFiles) {
  const stem = file.replace(/\.md$/, '');
  const raw = readFileSync(join(SKILLS, file), 'utf8');
  const lines = raw.split(/\r?\n/);

  if (lines[0].trim() !== '---') {
    results.push(`SKIP (no frontmatter): ${file}`);
    continue;
  }
  let end = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === '---') { end = i; break; }
  }
  if (end === -1) { results.push(`SKIP (unterminated frontmatter): ${file}`); continue; }

  const fm = lines.slice(1, end);
  const body = lines.slice(end + 1).join('\n').replace(/^\n+/, '');

  let summary = '';
  let triggers = '';
  for (const l of fm) {
    const m = l.match(/^([A-Za-z_]+):\s*(.*)$/);
    if (!m) continue;
    const key = m[1].toLowerCase();
    if (key === 'summary') summary = m[2].trim();
    if (key === 'triggers') triggers = m[2].trim();
  }
  if (!summary) { results.push(`SKIP (no summary): ${file}`); continue; }

  const trigList = triggers
    .replace(/^\[/, '').replace(/\]$/, '')
    .split(',').map((t) => t.trim()).filter(Boolean);

  let description = summary;
  if (trigList.length) description += ` Use when working with: ${trigList.join(', ')}.`;

  const out = `---\nname: ${stem}\ndescription: ${description}\n---\n\n${body}`;
  const dir = join(SKILLS, stem);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'SKILL.md'), out, 'utf8');
  rmSync(join(SKILLS, file));
  results.push(`OK: ${file} -> ${stem}/SKILL.md`);
}

console.log(results.join('\n'));
console.log(`\nConverted ${results.filter((r) => r.startsWith('OK')).length} / ${looseFiles.length}`);

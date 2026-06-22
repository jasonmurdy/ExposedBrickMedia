import fs from 'fs';
const content = fs.readFileSync('src/components/PuckEditor.tsx', 'utf8');
const lines = content.split('\n');
const newLines = [...lines.slice(0, 249), '  const seedPresets: Omit<PuckTemplateItem, "id" | "createdAt">[] = [];', ...lines.slice(1571)];
fs.writeFileSync('src/components/PuckEditor.tsx', newLines.join('\n'));

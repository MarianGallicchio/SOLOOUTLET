import fs from 'fs';

const md = fs.readFileSync('docs/PRESENTACION-SOLOOUTLET.md', 'utf8');
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const inline = (s) => esc(s)
  .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  .replace(/\*([^*]+)\*/g, '<em>$1</em>')
  .replace(/`([^`]+)`/g, '<code>$1</code>')
  .replace(/(https?:\/\/[^\s\)]+)/g, '<a href="$1">$1</a>');

let html = '';
let inTable = false, inList = false;
const closeTable = () => { if (inTable) { html += '</tbody></table>'; inTable = false; } };
const closeList = () => { if (inList) { html += '</ul>'; inList = false; } };

for (const line0 of md.split('\n')) {
  const line = line0.trimEnd();
  if (/^\|/.test(line)) {
    const cells = line.split('|').slice(1, -1).map((c) => c.trim());
    if (cells.every((c) => /^:?-+:?$/.test(c))) continue;
    if (!inTable) { html += '<table><tbody>'; inTable = true; }
    html += '<tr>' + cells.map((c) => '<td>' + inline(c) + '</td>').join('') + '</tr>';
    continue;
  }
  closeTable();
  if (/^- /.test(line)) {
    if (!inList) { html += '<ul>'; inList = true; }
    html += '<li>' + inline(line.slice(2)) + '</li>';
    continue;
  }
  closeList();
  if (/^# /.test(line)) html += '<h1>' + inline(line.slice(2)) + '</h1>';
  else if (/^## /.test(line)) html += '<h2>' + inline(line.slice(3)) + '</h2>';
  else if (/^### /.test(line)) html += '<h3>' + inline(line.slice(4)) + '</h3>';
  else if (/^---\s*$/.test(line)) html += '<hr/>';
  else if (line.trim() === '') { /* skip */ }
  else html += '<p>' + inline(line) + '</p>';
}
closeTable();
closeList();

const css = `
  body { font-family: 'Segoe UI', system-ui, sans-serif; color: #1e293b; max-width: 800px; margin: 0 auto; padding: 40px 32px; font-size: 13px; line-height: 1.55; }
  h1 { font-size: 26px; color: #0f172a; border-bottom: 3px solid #004AC6; padding-bottom: 8px; }
  h2 { font-size: 19px; color: #004AC6; margin-top: 28px; page-break-after: avoid; }
  h3 { font-size: 14px; color: #0f172a; margin-top: 18px; page-break-after: avoid; }
  table { border-collapse: collapse; width: 100%; margin: 10px 0 18px; page-break-inside: avoid; }
  td { border: 1px solid #cbd5e1; padding: 6px 10px; vertical-align: top; }
  tr:nth-child(odd) td { background: #f8fafc; }
  td:first-child { font-weight: 600; width: 32%; }
  code { background: #e2e8f0; padding: 1px 5px; border-radius: 4px; font-size: 11px; }
  a { color: #004AC6; }
  hr { border: none; border-top: 1px solid #cbd5e1; margin: 24px 0; }
  li { margin-bottom: 4px; }
`;

const page = '<!doctype html><html lang="es"><head><meta charset="utf-8"><title>solooutlet — Presentación Empresarial</title><style>' + css + '</style></head><body>' + html + '</body></html>';
fs.writeFileSync('docs/presentacion.html', page);
console.log('OK: docs/presentacion.html', page.length, 'chars');

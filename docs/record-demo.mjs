import { execSync } from 'child_process';
import fs from 'fs';

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const OUT_ABS = 'C:/Users/Mariano/Documents/freebuffapps/SOLOOUTLET/docs/demo-frames';
fs.mkdirSync(OUT_ABS, { recursive: true });

const BASE = 'http://localhost:4185/SOLOOUTLET/';
let n = 0;
const shot = (name, hash = '') => {
  try {
    execSync(`"${EDGE}" --headless --disable-gpu --no-sandbox --hide-scrollbars --window-size=1280,720 --virtual-time-budget=9000 --screenshot="${OUT_ABS}/${name}.png" "${BASE}?demo=1${hash}"`, { stdio: 'pipe' });
    const ok = fs.existsSync(`${OUT_ABS}/${name}.png`);
    console.log(ok ? '📸' : '❌', name, ok ? '' : '(no se escribió)');
  } catch (e) {
    console.log('❌', name, e.message.split('\n')[0]);
  }
};

shot('01-home');
shot('02-catalogo', '#catalog');
shot('03-ficha', '&open=demo-p1');
shot('04-vender', '#vender');
shot('05-ayuda', '#ayuda');

console.log('✅ Listo');

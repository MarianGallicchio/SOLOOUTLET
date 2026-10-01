import { execSync } from 'child_process';
import fs from 'fs';

const F = 'docs/demo-frames';
const CLIPS = 'docs/demo-clips';
fs.mkdirSync(CLIPS, { recursive: true });

const scenes = ['01-home', '02-catalogo', '03-ficha', '04-vender', '05-ayuda'];

const ffmpeg = (cmd) => execSync(`ffmpeg -y ${cmd} 2>docs/ff.log`, { stdio: 'pipe' });

// Clip 6s: un solo frame de entrada, zoompan genera 150 frames (6s @25fps)
scenes.forEach((name) => {
  ffmpeg(`-loop 1 -framerate 25 -i "${F}/${name}.png" -vf "zoompan=z='min(1+on/300,1.12)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=150:s=1280x720:fps=25" -frames:v 150 -c:v libx264 -preset fast -crf 21 -pix_fmt yuv420p "${CLIPS}/${name}.mp4"`);
  console.log('🎬', name);
});

let filter = `[0:v][1:v]xfade=transition=fade:duration=0.8:offset=5.2[v1];[v1][2:v]xfade=transition=fade:duration=0.8:offset=10.4[v2];[v2][3:v]xfade=transition=fade:duration=0.8:offset=15.6[v3];[v3][4:v]xfade=transition=fade:duration=0.8:offset=20.8[v4]`;
ffmpeg(`-i "${CLIPS}/01-home.mp4" -i "${CLIPS}/02-catalogo.mp4" -i "${CLIPS}/03-ficha.mp4" -i "${CLIPS}/04-vender.mp4" -i "${CLIPS}/05-ayuda.mp4" -filter_complex "${filter}" -map "[v4]" -c:v libx264 -preset fast -crf 21 -pix_fmt yuv420p -movflags +faststart docs/demo-video.mp4`);
console.log('✅ docs/demo-video.mp4');

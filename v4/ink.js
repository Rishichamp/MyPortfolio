/* ============================================================
   INK.JS — draws a handwritten word and a same-colour scribble
   on two canvases. Used by the hero card (WebGL texture) and by
   the research demo (before / after slider).
   The pictures are drawn in the browser; they illustrate the
   thesis task and are not thesis data.
   ============================================================ */

export const INKS = {
  black: '#17151c',
  blue:  '#1d2f78',
};

/* Small seeded random generator so the scribble looks the same on every visit. */
export function rng(seed = 7){
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6D2B79F5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export async function fontsReady(){
  try{
    await Promise.race([
      document.fonts.load('700 120px "Kalam"'),
      new Promise(r => setTimeout(r, 2500)),   // slow network: draw with the fallback font
    ]);
  }catch(e){ /* the canvas falls back to a system cursive font */ }
}

function makeCanvas(w, h){
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return c;
}

/** Paper with a faint ruled line and a margin, like a word crop from a scanned sheet. */
function paintPaper(ctx, w, h, rand, { ruled = true } = {}){
  ctx.fillStyle = '#f6f0e4';
  ctx.fillRect(0, 0, w, h);
  // paper fibre speckle
  for(let i = 0; i < w * h / 90; i++){
    const x = rand() * w, y = rand() * h;
    const a = rand() * 0.05;
    ctx.fillStyle = `rgba(80,60,30,${a})`;
    ctx.fillRect(x, y, 1 + rand() * 1.5, 1);
  }
  if(ruled){
    ctx.strokeStyle = 'rgba(40,70,140,0.13)';
    ctx.lineWidth = Math.max(1, h / 260);
    const base = h * 0.72;
    ctx.beginPath(); ctx.moveTo(0, base); ctx.lineTo(w, base); ctx.stroke();
  }
}

/** Writes the word with a slight per-letter wobble, like real handwriting. */
function writeWord(ctx, text, w, h, ink, rand){
  const size = h * 0.5;
  ctx.font = `700 ${size}px "Kalam", "Segoe Print", "Bradley Hand", cursive`;
  ctx.textBaseline = 'alphabetic';
  const total = ctx.measureText(text).width;
  const scale = Math.min(1, (w * 0.84) / total);
  ctx.save();
  ctx.translate(w / 2 - (total * scale) / 2, h * 0.70);
  ctx.scale(scale, scale);
  ctx.fillStyle = ink;
  let x = 0;
  for(const ch of text){
    const cw = ctx.measureText(ch).width;
    ctx.save();
    ctx.translate(x, (rand() - 0.5) * size * 0.05);
    ctx.rotate((rand() - 0.5) * 0.06);
    ctx.fillText(ch, 0, 0);
    ctx.restore();
    x += cw * 0.97;
  }
  ctx.restore();
  return { x0: w / 2 - (total * scale) / 2, x1: w / 2 + (total * scale) / 2, y0: h * 0.70 - size * 0.85 * scale, y1: h * 0.70 + size * 0.2 * scale };
}

/** Dense looping ballpoint scribble over the word box, same ink as the word. */
function scribble(ctx, box, ink, rand, density = 1){
  const { x0, x1, y0, y1 } = box;
  const bh = y1 - y0, bw = x1 - x0;
  ctx.strokeStyle = ink;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const passes = Math.round(3 * density);
  for(let p = 0; p < passes; p++){
    ctx.lineWidth = bh * (0.035 + rand() * 0.025);
    ctx.globalAlpha = 0.86 + rand() * 0.14;
    ctx.beginPath();
    let x = x0 - bw * 0.04, y = y0 + bh * (0.2 + rand() * 0.6);
    ctx.moveTo(x, y);
    const loops = Math.round((bw / bh) * 5 * density) + 6;
    for(let i = 0; i < loops; i++){
      const nx = x + bw / loops * (0.7 + rand() * 0.9);
      const ny = y0 + bh * (0.05 + rand() * 0.95);
      const cx1 = x + (rand() - 0.3) * bh * 0.9, cy1 = y0 - bh * 0.15 + rand() * bh * 1.3;
      const cx2 = nx - (rand() - 0.3) * bh * 0.9, cy2 = y0 - bh * 0.15 + rand() * bh * 1.3;
      ctx.bezierCurveTo(cx1, cy1, cx2, cy2, nx, ny);
      x = Math.min(nx, x1 + bw * 0.05); y = ny;
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

/**
 * Builds the three pictures for one word.
 * clean     : paper + word (the "after")
 * scribbled : paper + word + scribble (the "before")
 * mask      : white scribble on black, used by the WebGL dissolve
 */
export function makeWordImages(text, { width = 1024, height = 512, ink = INKS.black, seed = 11, density = 1, ruled = true } = {}){
  const clean = makeCanvas(width, height);
  const scribbled = makeCanvas(width, height);
  const mask = makeCanvas(width, height);
  const cc = clean.getContext('2d');
  const sc = scribbled.getContext('2d');
  const mc = mask.getContext('2d');

  paintPaper(cc, width, height, rng(seed), { ruled });
  const box = writeWord(cc, text, width, height, ink, rng(seed + 1));
  sc.drawImage(clean, 0, 0);
  scribble(sc, box, ink, rng(seed + 2), density);

  mc.fillStyle = '#000';
  mc.fillRect(0, 0, width, height);
  scribble(mc, box, '#fff', rng(seed + 2), density);

  return { clean, scribbled, mask, box };
}

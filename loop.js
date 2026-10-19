// =====================================================
//  LOOP · sesion_martes.log
//  adentro afuera · Interludio: Martes
//  La ventana de chat como trayecto. Se repite sola.
// =====================================================
//  CONTROLES
//  1 2 3 4   saltar a Autenticidad · Integridad · Fiabilidad · Disponibilidad
//  Espacio   pausar / seguir
//  S         sonido de teclado (sí / no) — haz clic en la pantalla primero
//  R         reiniciar
//  F         pantalla completa
// =====================================================

// ---------- 1. EDITA AQUÍ LA CONVERSACIÓN ----------
// who: 'yo' (tú) · 'h' (la herramienta) · 'sys' (pausas y avisos)
// tag: marca uno de los cuatro momentos (o null)
// verify: true pone el sello VERIFICAR sobre ese mensaje
// En los mensajes de integridad, las líneas que empiezan con "- " se tachan
// y las que empiezan con "+ " son la versión nueva.
const MSGS = [
  { t: '09:14', who: 'yo', text: 'Buenos días. Revisa este FUID y dime qué series no tienen fechas extremas.' },
  { t: '09:15', who: 'h',  text: 'Encontré 14 registros sin fecha inicial. Te los ordeno por serie documental.' },
  { t: '09:41', who: 'yo', text: 'Escribamos juntas el párrafo del proyecto. Empiezo yo: "El archivo no es un depósito…"', tag: 'AUTENTICIDAD' },
  { t: '09:41', who: 'h',  text: '"…es el lugar donde una institución decide qué recordar y qué dejar caer."', tag: 'AUTENTICIDAD' },
  { t: '10:02', who: 'yo', text: 'Mejora este oficio, pero que siga sonando a mí.', tag: 'INTEGRIDAD' },
  { t: '10:03', who: 'h',  text: '- Le escribo con cariño y algo de cansancio para solicitar el préstamo del fondo.\n+ Me permito respetuosamente solicitar el préstamo del fondo.', tag: 'INTEGRIDAD' },
  { t: '11:47', who: 'yo', text: '¿Qué dice el Acuerdo 003 de 2015?', tag: 'FIABILIDAD' },
  { t: '11:47', who: 'h',  text: '[AQUÍ VA LA RESPUESTA REAL CON EL ERROR QUE DETECTASTE]', tag: 'FIABILIDAD', verify: true },
  { t: '13:20', who: 'sys', text: '··· 1 h 45 min sin actividad ···' },
  { t: '15:05', who: 'yo', text: 'Resume estas tres actas en un cuadro.' },
  { t: '15:06', who: 'h',  text: 'Listo. ¿Quieres que lo convierta en tabla de retención?' },
  { t: '16:30', who: 'yo', text: '¿Qué recuerdas de mí?', tag: 'DISPONIBILIDAD' },
  { t: '16:30', who: 'h',  text: 'Que te llamas Lala. Que trabajas con archivos. Que empezaste una maestría en agosto. Lo demás no me lo has dicho.', tag: 'DISPONIBILIDAD' },
  { t: '17:52', who: 'yo', text: 'Gracias. Hasta mañana.' },
  { t: '17:52', who: 'sys', text: '— fin de la sesión · el expediente se actualizó —' }
];

// ---------- 2. RITMO ----------
const SPEED_YO = 0.022;  // letras por milisegundo de tus mensajes (lento, a mano)
const SPEED_H  = 0.12;   // letras por milisegundo de la herramienta (rápido)
const PAUSE    = 1100;   // milisegundos entre mensajes
const HOLD_END = 5000;   // milisegundos quieto al final antes de repetir

// ---------- No hace falta tocar nada de aquí para abajo ----------
const W = 720, H = 1080;
const G = {
  bright: '#33FF77', mid: '#1FC25A', dim: '#0E7A36', faint: '#073D1C',
  white: '#E6FFEC', amber: '#FFB000', black: '#000000'
};
const FONT = 'IBM Plex Mono';
const AREA = { x: 32, top: 104, bottom: 1046, w: 656 };
const MOMENTS = ['AUTENTICIDAD', 'INTEGRIDAD', 'FIABILIDAD', 'DISPONIBILIDAD'];

let idx = 0, msgStart = 0, chars = 0, paused = false, pauseAt = 0;
let endAt = 0, offset = 0, scaleF = 1;
let soundOn = false, actx = null, lastClick = 0;

// Enlace con la capa de la cámara (misma página web): avisa en qué momento va
let canal = null, ultimoMomento = undefined;
try { canal = new BroadcastChannel('adentro-afuera'); } catch (e) { canal = null; }
function avisar(tag) {
  if (tag === ultimoMomento) return;
  ultimoMomento = tag;
  if (canal) canal.postMessage({ momento: tag || null });
}

function setup() {
  const cnv = createCanvas(10, 10);
  cnv.mousePressed(() => { ensureAudio(); });
  fitCanvas();
  restart();
}
function fitCanvas() {
  scaleF = Math.min(windowWidth / W, windowHeight / H);
  resizeCanvas(Math.floor(W * scaleF), Math.floor(H * scaleF));
}
function windowResized() { fitCanvas(); }

function restart() { idx = 0; chars = 0; msgStart = millis() + 600; endAt = 0; offset = 0; }
function jumpTo(tag) {
  const i = MSGS.findIndex(m => m.tag === tag);
  if (i >= 0) { idx = i; chars = 0; msgStart = millis() + 300; endAt = 0; }
}

// ---------- Sonido (ruido de teclado sintetizado) ----------
function ensureAudio() {
  if (actx) return;
  try { actx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { actx = null; }
}
function click(who) {
  if (!soundOn || !actx) return;
  const now = actx.currentTime;
  const len = who === 'yo' ? 0.03 : 0.012;
  const buf = actx.createBuffer(1, Math.floor(actx.sampleRate * len), actx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / d.length, 4);
  const src = actx.createBufferSource(); src.buffer = buf;
  const f = actx.createBiquadFilter(); f.type = 'bandpass';
  f.frequency.value = who === 'yo' ? 1800 + Math.random() * 600 : 5200; f.Q.value = 1.2;
  const g = actx.createGain(); g.gain.value = who === 'yo' ? 0.35 : 0.12;
  src.connect(f); f.connect(g); g.connect(actx.destination); src.start(now);
}

// ---------- Texto ----------
function wrap(str, maxW) {
  // devuelve [{s, kind}] · kind: 'del' (tachado), 'add' (nuevo) o ''
  const out = [];
  str.split('\n').forEach(par => {
    const kind = par.startsWith('- ') ? 'del' : par.startsWith('+ ') ? 'add' : '';
    const words = par.split(' ');
    let line = '';
    words.forEach(w => {
      const test = line ? line + ' ' + w : w;
      if (textWidth(test) > maxW && line) { out.push({ s: line, kind }); line = (kind ? '  ' : '') + w; } else line = test;
    });
    out.push({ s: line, kind });
  });
  return out;
}
const LEAD = 31, META = 30, GAP = 26;

function blockHeight(m, shownText) {
  if (m.who === 'sys') return 44;
  textSize(22);
  const lines = wrap(shownText || ' ', m.who === 'h' ? AREA.w - 28 : AREA.w);
  return META + lines.length * LEAD + GAP;
}

// ---------- Dibujo ----------
function draw() {
  const now = millis();
  // avance
  if (!paused && now >= msgStart && idx < MSGS.length) {
    const m = MSGS[idx];
    const sp = m.who === 'yo' ? SPEED_YO : m.who === 'h' ? SPEED_H : 1;
    const before = Math.floor(chars);
    chars = (now - msgStart) * sp;
    if (Math.floor(chars) > before && Math.floor(chars) <= m.text.length && m.who !== 'sys') {
      if (m.who === 'yo' || now - lastClick > 45) { click(m.who); lastClick = now; }
    }
    if (chars >= m.text.length) {
      idx++; chars = 0; msgStart = now + PAUSE;
      if (idx >= MSGS.length) endAt = now;
    }
  }
  if (!paused && endAt && now - endAt > HOLD_END) restart();

  scale(scaleF);
  background(0);
  textFont(FONT);

  // cabecera
  noStroke(); fill(0); rect(0, 0, W, 84);
  fill(G.mid); textSize(18); textAlign(LEFT, CENTER);
  text('> sesion_martes.log', 32, 34);
  const shownIdx = Math.min(idx, MSGS.length - 1);
  fill(G.bright); textAlign(RIGHT, CENTER); textSize(26);
  text(MSGS[shownIdx].t, W - 32, 34);
  fill(G.dim); textSize(14); textAlign(LEFT, CENTER);
  text('LOOP · LA VENTANA DE CHAT COMO TRAYECTO', 32, 64);
  stroke(G.dim); strokeWeight(1); line(32, 84, W - 32, 84); noStroke();

  // qué se ve
  const visible = [];
  for (let i = 0; i <= Math.min(idx, MSGS.length - 1); i++) {
    const m = MSGS[i];
    if (i < idx) visible.push({ m, shown: m.text, done: true });
    else if (now >= msgStart) visible.push({ m, shown: m.text.slice(0, Math.floor(chars)), done: false });
  }
  let total = 0;
  visible.forEach(v => { v.h = blockHeight(v.m, v.shown); total += v.h; });
  const avail = AREA.bottom - AREA.top;
  const target = Math.max(0, total - avail);
  offset = lerp(offset, target, 0.12);

  drawingContext.save();
  drawingContext.beginPath(); drawingContext.rect(0, AREA.top - 2, W, AREA.bottom - AREA.top + 10); drawingContext.clip();
  let y = AREA.top - offset;
  visible.forEach((v, vi) => {
    const isLast = vi === visible.length - 1;
    drawBlock(v, y, isLast && !v.done);
    y += v.h;
  });
  drawingContext.restore();

  // indicador de momento activo
  const cur = MSGS[shownIdx].tag;
  if (cur || idx === 0) avisar(cur || null);
  textSize(13); textAlign(LEFT, CENTER);
  MOMENTS.forEach((mo, i) => {
    const x = 32 + i * 164, on = mo === cur;
    fill(on ? G.bright : G.faint); rect(x, H - 26, 150, 4);
    fill(on ? G.bright : G.dim); text(mo, x, H - 12);
  });

  if (paused) { fill(G.amber); textSize(14); textAlign(RIGHT, CENTER); text('PAUSA', W - 32, 64); }
  else if (soundOn) { fill(G.dim); textSize(14); textAlign(RIGHT, CENTER); text('♪ ruido', W - 32, 64); }
}

function drawBlock(v, y, typing) {
  const m = v.m;
  if (m.who === 'sys') {
    fill(G.dim); textSize(17); textAlign(CENTER, TOP);
    text(v.shown, W / 2, y + 8);
    return;
  }
  const isH = m.who === 'h';
  const x = AREA.x + (isH ? 28 : 0);
  // meta
  textSize(15); textAlign(LEFT, TOP);
  fill(G.dim); text(m.t, x, y);
  fill(isH ? G.mid : G.white); text(isH ? 'herramienta>' : 'yo>', x + 62, y);
  if (m.tag) {
    const tw = textWidth(m.tag) + 18;
    noFill(); stroke(G.bright); strokeWeight(1); rect(W - 32 - tw, y - 3, tw, 22); noStroke();
    fill(G.bright); textAlign(RIGHT, TOP); text(m.tag, W - 41, y);
    textAlign(LEFT, TOP);
  }
  // texto
  textSize(22);
  const lines = wrap(v.shown || ' ', isH ? AREA.w - 28 : AREA.w);
  let ly = y + META;
  lines.forEach((L, li) => {
    const ln = L.s;
    const strike = isH && L.kind === 'del';
    fill(strike ? G.dim : isH ? G.bright : G.white); text(ln, x, ly);
    if (strike) {
      const lead = ln.startsWith('- ') ? textWidth('- ') : textWidth('  ');
      stroke(G.dim); strokeWeight(2); line(x + lead, ly + 14, x + textWidth(ln), ly + 14); noStroke();
    }
    if (typing && li === lines.length - 1 && frameCount % 36 < 22) {
      fill(isH ? G.bright : G.white); rect(x + textWidth(ln) + 4, ly + 3, 11, 22);
    }
    ly += LEAD;
  });
  if (isH) { fill(G.faint); rect(AREA.x + 8, y + META - 2, 3, lines.length * LEAD); }
  // sello
  if (m.verify && v.done) {
    push();
    translate(W - 150, y + META + lines.length * LEAD / 2);
    rotate(-0.14);
    noFill(); stroke(G.amber); strokeWeight(4); rectMode(CENTER); rect(0, 0, 230, 54);
    noStroke(); fill(G.amber); textSize(30); textStyle(BOLD); textAlign(CENTER, CENTER);
    text('VERIFICAR', 0, 2); textStyle(NORMAL);
    pop();
  }
}

function keyPressed() {
  ensureAudio();
  const k = (key || '').toLowerCase();
  if (key === ' ') {
    paused = !paused;
    if (paused) pauseAt = millis();
    else { const d = millis() - pauseAt; msgStart += d; if (endAt) endAt += d; }
    return false;
  }
  if (['1', '2', '3', '4'].includes(k)) { jumpTo(MOMENTS[+k - 1]); return false; }
  if (k === 's') { soundOn = !soundOn; if (actx && actx.state === 'suspended') actx.resume(); }
  else if (k === 'r') { restart(); }
  else if (k === 'f') { fullscreen(!fullscreen()); }
}

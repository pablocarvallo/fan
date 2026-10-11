// Variables used by Scriptable.
// These must be at the very top of the file. Do not edit.
// icon-color: purple; icon-glyph: wallet;

// FAN · widget para la pantalla de inicio del iPhone (app Scriptable)
//
// Muestra el saldo de la cuenta y las tres últimas compras. Parte del saldo que FAN publica en el buzón
// (el repositorio privado de GitHub) y le suma las compras que llegaron después, aunque no hayas abierto FAN.
// No copies este archivo a mano: usa el botón «Copiar el script del widget» de FAN, que completa las dos
// líneas siguientes con tu repositorio y tu token.
const REPO = '__REPO__';
const TOKEN = '__TOKEN__';

const API = 'https://api.github.com/repos/' + REPO;
const MS_TITLE = 'FAN · widget';
const MES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/* ---------- Formatos ---------- */
function pad(n) { return (n < 10 ? '0' : '') + n; }
function dayKey(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
function dots(n) { return String(Math.round(Math.abs(n))).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
function money(n) { return (n < 0 ? '−' : '') + '$' + dots(n); }
function hm(d) { return pad(d.getHours()) + ':' + pad(d.getMinutes()); }
function dayLabel(k) {
  const t = new Date(), y = new Date(t.getFullYear(), t.getMonth(), t.getDate() - 1);
  if (k === dayKey(t)) return 'hoy';
  if (k === dayKey(y)) return 'ayer';
  const p = k.split('-');
  return (+p[2]) + ' ' + MES[+p[1] - 1];
}
function validDate(k) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(k)) return false;
  const p = k.split('-'), d = new Date(Date.UTC(+p[0], +p[1] - 1, +p[2]));
  return d.getUTCFullYear() === +p[0] && d.getUTCMonth() === +p[1] - 1 && d.getUTCDate() === +p[2];
}

/* ---------- Lector de los avisos del banco (el mismo de FAN) ---------- */
const CP1252 = { 0x20ac: 0x80, 0x201a: 0x82, 0x0192: 0x83, 0x201e: 0x84, 0x2026: 0x85, 0x2020: 0x86, 0x2021: 0x87, 0x02c6: 0x88, 0x2030: 0x89, 0x0160: 0x8a,
  0x2039: 0x8b, 0x0152: 0x8c, 0x017d: 0x8e, 0x2018: 0x91, 0x2019: 0x92, 0x201c: 0x93, 0x201d: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97, 0x02dc: 0x98,
  0x2122: 0x99, 0x0161: 0x9a, 0x203a: 0x9b, 0x0153: 0x9c, 0x017e: 0x9e, 0x0178: 0x9f };
function contByte(ch) { let c = ch.charCodeAt(0); if (c > 0xff) c = CP1252[c] || 0; return c >= 0x80 && c <= 0xbf ? c : -1; }
function demojibake(s) {
  if (!/[ÂÃâ]/.test(s)) return s;
  return s.replace(/[ÂÃ][^\u0000-\u007f]|â[^\u0000-\u007f]{2}/g, function (seq) {
    const b1 = contByte(seq.charAt(1)), b2 = seq.length > 2 ? contByte(seq.charAt(2)) : 0;
    if (b1 < 0 || b2 < 0) return seq;
    return String.fromCharCode(seq.length > 2 ? (0x2 << 12) | ((b1 & 0x3f) << 6) | (b2 & 0x3f) : ((seq.charCodeAt(0) & 0x1f) << 6) | (b1 & 0x3f));
  });
}
const ENT = { nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", dollar: '$', eacute: 'é', Eacute: 'É', aacute: 'á', iacute: 'í', oacute: 'ó', uacute: 'ú', ntilde: 'ñ', Ntilde: 'Ñ' };
function plainText(s) {
  s = String(s == null ? '' : s);
  if (s.length > 400000) s = s.slice(-400000);
  s = demojibake(s);
  if (s.normalize) s = s.normalize('NFC');
  if (/<[a-z!\/][^>]*>/i.test(s)) s = s.replace(/<(script|style)\b[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' ');
  s = s.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, function (all, e) {
    if (e.charAt(0) === '#') {
      const c = e.charAt(1).toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
      return c > 0 && c < 0x10000 ? String.fromCharCode(c) : ' ';
    }
    return Object.prototype.hasOwnProperty.call(ENT, e) ? ENT[e] : all;
  });
  return s.replace(/[\s ​‌‍﻿]+/g, ' ');
}
function clean(s) { return String(s == null ? '' : s).replace(/\s+/g, ' ').trim().slice(0, 60); }
function skel(key) {
  const p = String(key).split('|');
  return p[0] + '|' + (p[1] || '') + '|' + p.slice(2).join('').toUpperCase().replace(/[^A-Z0-9]/g, '');
}
// Devuelve las compras con cargo a la cuenta que trae un texto. Deja fuera las de tarjeta de crédito y en dólares.
function parseMail(raw) {
  const text = plainText(raw);
  const re = /compra\W{1,4}por\W{1,4}?(US\$|USD|\$)?\W{0,3}?([\d.]+(?:,\d{1,2})?)\W{1,4}con\W{1,4}(?:cargo\W{1,4}a\W{1,4})?(.{1,60}?)\s+en\s+(.{1,80}?)\s+el\s+(\d{1,2})\/(\d{1,2})\/(\d{4})\W{1,4}(\d{1,2}):(\d{2})/gi;
  const out = [];
  let m;
  while ((m = re.exec(text))) {
    const cur = (m[1] || '$').toUpperCase(), medio = m[3], merchant = clean(m[4]);
    const amount = parseInt(m[2].replace(/\./g, '').replace(/,.*$/, ''), 10);
    const date = m[7] + '-' + pad(+m[6]) + '-' + pad(+m[5]), time = pad(+m[8]) + ':' + m[9];
    if (!validDate(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(time) || !merchant || !(amount > 0)) continue;
    if (cur !== '$' || /cr.{0,12}dito/i.test(medio)) continue;
    out.push({ d: date, h: time, c: merchant, m: amount, acct: (/(\d{4})\W*$/.exec(medio) || [])[1] || '',
      key: date + 'T' + time + '|' + amount + '|' + merchant.toUpperCase() });
  }
  return out;
}

/* ---------- Datos ---------- */
async function gh(path) {
  const r = new Request(API + path);
  r.headers = { Authorization: 'Bearer ' + TOKEN, Accept: 'application/vnd.github+json' };
  r.timeoutInterval = 20;
  const data = await r.loadJSON();
  const code = r.response && r.response.statusCode;
  if (code && code >= 400) { const e = new Error('GitHub ' + code); e.status = code; throw e; }
  return data;
}
function cachePath() { const fm = FileManager.local(); return fm.joinPath(fm.documentsDirectory(), 'fan-widget.json'); }
function readCache() {
  try { const fm = FileManager.local(), p = cachePath(); return fm.fileExists(p) ? JSON.parse(fm.readString(p)) : null; } catch (e) { return null; }
}
function writeCache(res) { try { FileManager.local().writeString(cachePath(), JSON.stringify(res)); } catch (e) {} }

// Saldo publicado por FAN + compras que llegaron al buzón después de la última vez que FAN lo leyó
async function load() {
  const list = await gh('/milestones?state=all&per_page=100');
  const ms = (Array.isArray(list) ? list : []).filter(function (x) { return x && x.title === MS_TITLE; })[0];
  let st = null;
  try { st = ms && ms.description ? JSON.parse(ms.description) : null; } catch (e) { st = null; }
  if (!st || st.app !== 'fan') return { msg: 'Abre FAN y activa el widget en «Buzón y atajo».' };

  const known = {};
  (st.keys || []).forEach(function (k) { known[k] = 1; });
  const acct = /^\d{4}$/.test(String(st.acct || '')) ? String(st.acct) : '';
  const since = st.read > 0 ? '&since=' + encodeURIComponent(new Date(st.read - 30 * 60000).toISOString().replace(/\.\d+Z$/, 'Z')) : '';
  const nuevas = [];
  for (let page = 1; page <= 3; page++) {
    const issues = await gh('/issues?state=all&sort=created&direction=asc&per_page=100&page=' + page + since);
    if (!Array.isArray(issues)) break;
    issues.forEach(function (it) {
      if (!it || it.pull_request) return;
      const title = String(it.title || '');
      parseMail((title.length > 20 ? title + '\n' : '') + String(it.body || '')).forEach(function (f) {
        const sk = skel(f.key);
        if (known[sk]) return;
        known[sk] = 1;
        if (acct && f.acct && f.acct !== acct) return;            // FAN sigue una sola cuenta
        if (st.at && f.d + 'T' + f.h < st.at) return;             // anterior al último ajuste de saldo
        nuevas.push(f);
      });
    });
    if (issues.length < 100) break;
  }
  let saldo = typeof st.saldo === 'number' ? st.saldo : null;
  if (saldo !== null) nuevas.forEach(function (f) { saldo -= f.m; });
  const buys = (st.ult || []).concat(nuevas).filter(function (b) { return b && b.d && b.m > 0; })
    .sort(function (a, b) { return (a.d + 'T' + a.h) < (b.d + 'T' + b.h) ? 1 : -1; }).slice(0, 3)
    .map(function (b) { return { d: b.d, h: b.h, c: String(b.c || 'Compra'), m: b.m }; });
  return { saldo: saldo, buys: buys, nuevas: nuevas.length, at: Date.now() };
}

/* ---------- Dibujo ---------- */
const WHITE = new Color('#ffffff'), GOLD = new Color('#ffcf70');
function label(stack, str, size, color, opacity, bold) {
  const t = stack.addText(str);
  t.font = bold ? Font.boldSystemFont(size) : Font.systemFont(size);
  t.textColor = color || WHITE;
  if (opacity) t.textOpacity = opacity;
  t.lineLimit = 1;
  return t;
}
function build(res, family) {
  const w = new ListWidget();
  const lock = String(family || '').indexOf('accessory') === 0;
  const small = family === 'small';
  if (lock) {
    // Pantalla bloqueada: saldo y última compra
    label(w, 'FAN ' + (res.msg ? '' : res.saldo === null ? 'sin saldo' : money(res.saldo)), 14, null, 0, true).minimumScaleFactor = 0.6;
    if (res.msg) label(w, res.msg, 11).lineLimit = 2;
    else if (res.buys.length) label(w, res.buys[0].c + ' ' + money(-res.buys[0].m), 11).minimumScaleFactor = 0.7;
    return w;
  }
  const g = new LinearGradient();
  g.colors = [new Color('#873a9c'), new Color('#34113f')];
  g.locations = [0, 1];
  g.startPoint = new Point(0, 0);
  g.endPoint = new Point(1, 1);
  w.backgroundGradient = g;
  w.setPadding(small ? 12 : 14, small ? 12 : 16, small ? 10 : 12, small ? 12 : 16);

  const head = w.addStack();
  head.layoutHorizontally();
  head.centerAlignContent();
  label(head, 'SALDO FAN', small ? 9 : 10, GOLD, 0, true);
  head.addSpacer();
  if (res.at) label(head, (res.old ? 'sin conexión · ' : '') + hm(new Date(res.at)), 9, WHITE, 0.6);
  w.addSpacer(2);

  if (res.msg) {
    const t = label(w, res.msg, small ? 12 : 14, WHITE, 0.9);
    t.lineLimit = 4;
    w.addSpacer();
    return w;
  }
  const total = label(w, res.saldo === null ? 'Sin definir' : money(res.saldo), small ? 22 : 28, WHITE, 0, true);
  total.minimumScaleFactor = 0.5;
  w.addSpacer(small ? 4 : 8);

  if (!res.buys.length) label(w, 'Aún no hay compras', 12, WHITE, 0.7);
  res.buys.forEach(function (b, i) {
    if (i) w.addSpacer(small ? 2 : 4);
    const row = w.addStack();
    row.layoutHorizontally();
    row.centerAlignContent();
    if (!small) { label(row, dayLabel(b.d) + ' ' + b.h, 10, WHITE, 0.6); row.addSpacer(6); }
    label(row, b.c, small ? 10 : 12, WHITE, 0.95);
    row.addSpacer();
    label(row, money(-b.m), small ? 10 : 12, WHITE, 0, true);
  });
  w.addSpacer();
  return w;
}

/* ---------- Ejecución ---------- */
let res;
if (/^__/.test(TOKEN) || /^__/.test(REPO)) {
  res = { msg: 'Copia este script desde FAN, con el botón «Copiar el script del widget».' };
} else {
  try {
    res = await load();
    if (!res.msg) writeCache(res);
  } catch (e) {
    const c = readCache();
    if (c && !c.msg) { res = c; res.old = true; }
    else res = { msg: e && e.status === 401 ? 'El token venció. Copia de nuevo el script desde FAN.' : 'No se pudo leer el buzón. Revisa la conexión.' };
  }
}
const widget = build(res, config.widgetFamily);
widget.refreshAfterDate = new Date(Date.now() + 10 * 60 * 1000);
if (config.runsInWidget) Script.setWidget(widget);
else await widget.presentMedium();
Script.complete();

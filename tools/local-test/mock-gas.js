/**
 * จำลองบริการ Google Apps Script ในเครื่อง (Node) เพื่อรันโค้ดหลังบ้านจริงโดยไม่ต้อง Deploy
 * ใช้ทดสอบเท่านั้น · ข้อมูลอยู่ในหน่วยความจำ · ไม่ติดต่อ Google
 *   const gas = require('./mock-gas').load({ dir: '../../apps-script', owner: 'owner@example.com' });
 *   gas.ctx.doPost({ postData: { contents: JSON.stringify({ v: 1, fn: 'apiPing', args: [] }) } })
 */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), crypto = require('crypto'), zlib = require('zlib');

const ORDER = ['Config', 'Core', 'CountLib', 'Api', 'Flow', 'ReconUndo', 'Firestore', 'Setup'];
const unknown = new Set();

/** อ็อบเจกต์ที่เมธอดอะไรก็ได้คืนตัวเอง (ใช้กับคำสั่งจัดรูปแบบที่ทดสอบไม่ต้องสนใจ) */
function chain(name, extra) {
  const base = Object.assign({}, extra || {});
  const p = new Proxy(base, {
    get(t, k) {
      if (k in t) return t[k];
      if (typeof k === 'symbol' || k === 'then' || k === 'toJSON') return undefined;
      return function () { if (!/^set|^build|^when|^require|^with|^match|^time|^every|^at|^on/.test(String(k))) unknown.add(name + '.' + String(k)); return p; };
    }
  });
  return p;
}

function a1(ref) {                                    // 'D2:D5000' → [row, col, nr, nc]
  const m = /^([A-Z]+)(\d+)(?::([A-Z]+)(\d+))?$/.exec(String(ref).replace(/\$/g, ''));
  if (!m) throw new Error('mock: A1 ไม่รองรับ ' + ref);
  const c = s => s.split('').reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0);
  const r1 = +m[2], c1 = c(m[1]), r2 = m[4] ? +m[4] : r1, c2 = m[3] ? c(m[3]) : c1;
  return [r1, c1, r2 - r1 + 1, c2 - c1 + 1];
}

function makeSheet(ss, name) {
  const S = { name, rows: [], fx: {}, maxRows: 1000, maxCols: 26, frozen: 0, prot: [], cf: [], dv: 0 };
  const cellOk = (r, c) => { while (S.rows.length < r) S.rows.push([]); const row = S.rows[r - 1]; while (row.length < c) row.push(''); };
  const get = (r, c) => { const row = S.rows[r - 1]; const v = row ? row[c - 1] : undefined; return v === undefined || v === null ? '' : v; };
  const put = (r, c, v) => {
    if (r > S.maxRows) S.maxRows = r; if (c > S.maxCols) S.maxCols = c;
    cellOk(r, c);
    const k = r + ',' + c;
    if (typeof v === 'string' && v.charAt(0) === '=') { S.fx[k] = v; S.rows[r - 1][c - 1] = ''; }
    else { delete S.fx[k]; S.rows[r - 1][c - 1] = (v === undefined || v === null) ? '' : v; }
  };
  const lastRow = () => {
    let last = 0;
    for (let i = 0; i < S.rows.length; i++) if (S.rows[i].some(v => v !== '' && v !== null && v !== undefined)) last = i + 1;
    Object.keys(S.fx).forEach(k => { const r = +k.split(',')[0]; if (r > last) last = r; });
    return last;
  };
  const lastCol = () => {
    let last = 0;
    S.rows.forEach(row => row.forEach((v, j) => { if (v !== '' && v !== null && v !== undefined && j + 1 > last) last = j + 1; }));
    Object.keys(S.fx).forEach(k => { const c = +k.split(',')[1]; if (c > last) last = c; });
    return last;
  };
  function range(r, c, nr, nc) {
    if (typeof r === 'string') [r, c, nr, nc] = a1(r);
    nr = nr || 1; nc = nc || 1;
    if (r < 1 || c < 1) throw new Error('mock: range นอกตาราง ' + r + ',' + c);
    if (r + nr - 1 > S.maxRows) throw new Error('mock: range เกินจำนวนแถวของแท็บ ' + name + ' (' + (r + nr - 1) + ' > ' + S.maxRows + ')');
    const R = chain('Range', {
      getValues: () => { const o = []; for (let i = 0; i < nr; i++) { const x = []; for (let j = 0; j < nc; j++) x.push(get(r + i, c + j)); o.push(x); } return o; },
      getValue: () => get(r, c),
      getDisplayValue: () => String(get(r, c)),
      getFormulas: () => { const o = []; for (let i = 0; i < nr; i++) { const x = []; for (let j = 0; j < nc; j++) x.push(S.fx[(r + i) + ',' + (c + j)] || ''); o.push(x); } return o; },
      setValues: v => {
        if (!Array.isArray(v) || v.length !== nr || v.some(x => !Array.isArray(x) || x.length !== nc))
          throw new Error('mock: setValues ขนาดไม่ตรง ' + name + ' ต้องการ ' + nr + 'x' + nc + ' ได้ ' + (v.length) + 'x' + (v[0] || []).length);
        v.forEach((row, i) => row.forEach((x, j) => put(r + i, c + j, x))); return R;
      },
      setValue: v => { for (let i = 0; i < nr; i++) for (let j = 0; j < nc; j++) put(r + i, c + j, v); return R; },
      setFormula: f => { put(r, c, f); return R; },
      clearContent: () => { for (let i = 0; i < nr; i++) for (let j = 0; j < nc; j++) put(r + i, c + j, ''); return R; },
      getRow: () => r, getColumn: () => c, getNumRows: () => nr, getNumColumns: () => nc, getLastRow: () => r + nr - 1,
      getSheet: () => sheet, getA1Notation: () => r + ',' + c,
      getCell: (i, j) => range(r + i - 1, c + j - 1, 1, 1),
      offset: (dr, dc, a, b) => range(r + dr, c + dc, a || nr, b || nc),
      createTextFinder: text => {
        const F = chain('TextFinder', {
          findNext: () => {
            for (let i = 0; i < nr; i++) for (let j = 0; j < nc; j++) if (String(get(r + i, c + j)) === String(text)) return range(r + i, c + j);
            return null;
          }
        });
        return F;
      },
      protect: () => { const p = protection('RANGE'); S.prot.push(p); return p; },
      setDataValidation: () => { S.dv++; return R; }
    });
    return R;
  }
  function protection(type) {
    let d = '';
    const P = chain('Protection', { getDescription: () => d, setDescription: x => { d = x; return P; }, type: type });
    return P;
  }
  const sheet = chain('Sheet', {
    _S: S,
    getName: () => S.name, setName: n => { S.name = n; return sheet; }, getParent: () => ss, getSheetId: () => S.id,
    getRange: range, getDataRange: () => range(1, 1, Math.max(1, lastRow()), Math.max(1, lastCol())),
    getLastRow: lastRow, getLastColumn: lastCol, getMaxRows: () => S.maxRows, getMaxColumns: () => S.maxCols,
    insertColumnsAfter: (a, n) => { S.maxCols += n; return sheet; }, insertRowsAfter: (a, n) => { S.maxRows += n; return sheet; },
    appendRow: arr => { const r = lastRow() + 1; arr.forEach((v, j) => put(r, j + 1, v)); return sheet; },
    deleteRow: r => { S.rows.splice(r - 1, 1); const fx = {}; Object.keys(S.fx).forEach(k => { const [a, b] = k.split(',').map(Number); if (a < r) fx[k] = S.fx[k]; else if (a > r) fx[(a - 1) + ',' + b] = S.fx[k]; }); S.fx = fx; return sheet; },
    setFrozenRows: n => { S.frozen = n; return sheet; }, getFrozenRows: () => S.frozen,
    clear: () => { S.rows = []; S.fx = {}; return sheet; },
    protect: () => { const p = protection('SHEET'); S.prot.push(p); return p; },
    getProtections: t => S.prot.filter(p => p.type === (t === 'SHEET' ? 'SHEET' : 'RANGE')),
    getConditionalFormatRules: () => S.cf.slice(), setConditionalFormatRules: x => { S.cf = x; return sheet; }
  });
  return sheet;
}

function makeSpreadsheet(id, name) {
  const st = { id, name, tz: 'America/Los_Angeles', locale: 'en_US', sheets: [] };
  const ss = chain('Spreadsheet', {
    _st: st,
    getId: () => st.id, getName: () => st.name, getUrl: () => 'https://docs.google.com/spreadsheets/d/' + st.id + '/edit',
    getSheets: () => st.sheets.slice(), getSheetByName: n => st.sheets.find(s => s.getName() === n) || null,
    insertSheet: (n, idx) => {
      if (st.sheets.some(s => s.getName() === n)) throw new Error('mock: มีแท็บ ' + n + ' แล้ว');
      const s = makeSheet(ss, n); s._S.id = 1000 + st.sheets.length;
      if (typeof idx === 'number') st.sheets.splice(idx, 0, s); else st.sheets.push(s);
      return s;
    },
    deleteSheet: s => { st.sheets = st.sheets.filter(x => x !== s); },
    setSpreadsheetTimeZone: z => { st.tz = z; }, getSpreadsheetTimeZone: () => st.tz,
    setSpreadsheetLocale: l => { st.locale = l; }, getSpreadsheetLocale: () => st.locale,
    getOwner: () => ({ getEmail: () => 'owner@example.com' }), getEditors: () => [], getViewers: () => []
  });
  st.sheets.push(makeSheet(ss, 'Sheet1'));
  return ss;
}

function fmtDate(d, tz, pat) {
  if (!(d instanceof Date)) d = new Date(d);
  const parts = {};
  new Intl.DateTimeFormat('en-GB', { timeZone: tz || 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).formatToParts(d).forEach(p => { parts[p.type] = p.value; });
  return String(pat).replace(/yyyy|yy|MM|dd|HH|mm|ss|M|d/g, t => ({
    yyyy: parts.year, yy: parts.year.slice(2), MM: parts.month, dd: parts.day, HH: parts.hour, mm: parts.minute, ss: parts.second,
    M: String(+parts.month), d: String(+parts.day) })[t]);
}

function blob(bytes, type, name) {
  const buf = Buffer.isBuffer(bytes) ? bytes : (typeof bytes === 'string' ? Buffer.from(bytes, 'utf8') : Buffer.from((bytes || []).map(b => b & 255)));
  let nm = name || '';
  const B = chain('Blob', {
    _buf: buf,
    getBytes: () => Array.from(buf).map(b => b > 127 ? b - 256 : b),
    getDataAsString: () => buf.toString('utf8'), getContentType: () => type, getName: () => nm,
    setName: n => { nm = n; return B; }, setContentType: () => B
  });
  return B;
}

function template(file, dir) {
  const src = fs.readFileSync(path.join(dir, file + '.html'), 'utf8');
  const T = { evaluate: null };
  T.evaluate = function () {
    let code = 'let __o = "";\n', i = 0;
    const re = /<\?(!?=)?([\s\S]*?)\?>/g; let m;
    const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    while ((m = re.exec(src))) {
      code += '__o += ' + JSON.stringify(src.slice(i, m.index)) + ';\n';
      if (m[1] === '=') code += '__o += __esc(' + m[2] + ');\n';
      else if (m[1] === '!=') code += '__o += (' + m[2] + ');\n';
      else code += m[2] + '\n';
      i = re.lastIndex;
    }
    code += '__o += ' + JSON.stringify(src.slice(i)) + '; return __o;';
    const self = Object.assign({}, T); delete self.evaluate;
    const keys = Object.keys(self);
    const out = new Function('__esc', ...keys, code)(esc, ...keys.map(k => self[k]));
    return { getContent: () => out };
  };
  return T;
}

function load(opts) {
  opts = opts || {};
  const dir = path.resolve(opts.dir || path.join(__dirname, '..', '..', 'apps-script'));
  const owner = opts.owner || 'owner@example.com';
  const props = Object.assign({}, opts.props || {});
  const cache = {}, sheets = {}, mails = [], logs = [], triggers = [], files = {};
  let ids = 0;
  const now = () => Date.now();
  const scriptCache = {
    get: k => { const e = cache[k]; if (!e) return null; if (e.x < now()) { delete cache[k]; return null; } return e.v; },
    put: (k, v, ttl) => { const s = String(v); if (s.length > 100000) throw new Error('mock: ค่าแคชใหญ่เกิน 100KB ' + k); cache[k] = { v: s, x: now() + 1000 * (ttl || 600) }; },
    putAll: (o, ttl) => Object.keys(o).forEach(k => scriptCache.put(k, o[k], ttl)),
    getAll: ks => { const o = {}; ks.forEach(k => { const v = scriptCache.get(k); if (v !== null) o[k] = v; }); return o; },
    remove: k => { delete cache[k]; }, removeAll: ks => ks.forEach(k => { delete cache[k]; })
  };
  const scriptProps = {
    getProperty: k => Object.prototype.hasOwnProperty.call(props, k) ? props[k] : null,
    setProperty: (k, v) => { props[k] = String(v); return scriptProps; },
    deleteProperty: k => { delete props[k]; return scriptProps; },
    getProperties: () => Object.assign({}, props), getKeys: () => Object.keys(props),
    setProperties: o => { Object.assign(props, o); return scriptProps; }
  };
  function folder(name) {
    const id = 'FOLDER' + (++ids);
    const F = chain('Folder', {
      getId: () => id, getName: () => name, isTrashed: () => false,
      createFolder: n => folder(n), getViewers: () => [], getEditors: () => [], getOwner: () => ({ getEmail: () => owner }),
      addViewer: () => F, createFile: b => {
        const fid = 'FILE' + (++ids);
        const f = chain('File', { getId: () => fid, getUrl: () => 'https://drive.google.com/file/d/' + fid + '/view', getName: () => b.getName(), setDescription: () => f });
        files[fid] = f; return f;
      }
    });
    files[id] = F;
    return F;
  }
  const root = folder('My Drive');
  const ctx = {
    console: { log: (...a) => logs.push(a.map(String).join(' ')), error: (...a) => logs.push('ERR ' + a.join(' ')) },
    Logger: { log: (f, ...a) => { let i = 0; logs.push(String(f).replace(/%s|%d/g, () => String(a[i++]))); } },
    PropertiesService: { getScriptProperties: () => scriptProps, getUserProperties: () => scriptProps },
    CacheService: { getScriptCache: () => scriptCache, getUserCache: () => scriptCache },
    LockService: { getScriptLock: () => ({ tryLock: () => true, waitLock: () => {}, releaseLock: () => {}, hasLock: () => true }) },
    Session: { getEffectiveUser: () => ({ getEmail: () => owner }), getActiveUser: () => ({ getEmail: () => '' }), getScriptTimeZone: () => 'Asia/Bangkok' },
    Utilities: {
      DigestAlgorithm: { SHA_256: 'sha256', MD5: 'md5', SHA_1: 'sha1' }, Charset: { UTF_8: 'utf8' },
      computeDigest: (alg, s) => Array.from(crypto.createHash(alg).update(String(s)).digest()).map(b => b > 127 ? b - 256 : b),
      getUuid: () => crypto.randomUUID(), formatDate: fmtDate, sleep: () => {},
      base64Encode: b => (typeof b === 'string' ? Buffer.from(b, 'utf8') : Buffer.from(b.map(x => x & 255))).toString('base64'),
      base64Decode: s => Array.from(Buffer.from(String(s), 'base64')).map(b => b > 127 ? b - 256 : b),
      newBlob: (d, t, n) => blob(d, t, n),
      gzip: b => blob(zlib.gzipSync(b._buf), 'application/x-gzip'),
      ungzip: b => blob(zlib.gunzipSync(b._buf), 'application/octet-stream')
    },
    MailApp: {
      getRemainingDailyQuota: () => 100,
      sendEmail: (a, b, c) => { const m = typeof a === 'object' ? a : { to: a, subject: b, body: c }; mails.push(m); }
    },
    UrlFetchApp: {
      fetch: (url, o) => {
        if (/tokeninfo/.test(url)) {
          const t = String((o && o.payload && o.payload.id_token) || '');
          const mm = /^test\.([^.]+)\.sig$/.exec(t);
          if (!mm) return { getResponseCode: () => 400, getContentText: () => '{"error":"invalid_token"}' };
          const email = Buffer.from(mm[1], 'base64url').toString('utf8');
          const body = { aud: props.GIS_CLIENT_ID, iss: 'https://accounts.google.com', email, email_verified: 'true', exp: String(Math.floor(now() / 1000) + 3600) };
          const dom = email.split('@')[1]; if (props.STAFF_DOMAIN && dom === String(props.STAFF_DOMAIN).replace(/^@/, '')) body.hd = dom;
          return { getResponseCode: () => 200, getContentText: () => JSON.stringify(body) };
        }
        return { getResponseCode: () => 404, getContentText: () => '{}' };
      }
    },
    ContentService: { MimeType: { JSON: 'json', TEXT: 'text' }, createTextOutput: t => { const o = { getContent: () => t, setMimeType: () => o }; return o; } },
    HtmlService: {
      XFrameOptionsMode: { ALLOWALL: 'ALLOWALL' },
      createTemplateFromFile: f => template(f, dir),
      createHtmlOutput: h => { const o = chain('HtmlOutput', { getContent: () => String(h) }); return o; }
    },
    DriveApp: { getRootFolder: () => root, getFolderById: id => { if (!files[id]) throw new Error('mock: ไม่พบโฟลเดอร์ ' + id); return files[id]; },
                getFileById: id => files[id] || chain('File', { moveTo: () => {} }) },
    ScriptApp: {
      getService: () => ({ getUrl: () => opts.serviceUrl || 'http://localhost/api' }),
      getOAuthToken: () => 'mock-token',
      getProjectTriggers: () => triggers.slice(),
      deleteTrigger: t => { const i = triggers.indexOf(t); if (i >= 0) triggers.splice(i, 1); },
      newTrigger: fn => chain('TriggerBuilder', { create: () => { const t = { getHandlerFunction: () => fn }; triggers.push(t); return t; } })
    },
    SpreadsheetApp: {
      openById: id => { if (!sheets[id]) throw new Error('mock: ไม่พบชีต ' + id); return sheets[id]; },
      create: n => { const id = 'SHEET' + (++ids); sheets[id] = makeSpreadsheet(id, n); return sheets[id]; },
      flush: () => {}, newDataValidation: () => chain('DataValidationBuilder'), newConditionalFormatRule: () => chain('CFBuilder'),
      ProtectionType: { RANGE: 'RANGE', SHEET: 'SHEET' }, WrapStrategy: { CLIP: 'CLIP', WRAP: 'WRAP' }
    }
  };
  ctx.globalThis = ctx;
  vm.createContext(ctx);
  ORDER.forEach(f => {
    const p = path.join(dir, f + '.gs');
    vm.runInContext(fs.readFileSync(p, 'utf8'), ctx, { filename: f + '.gs' });
  });
  function post(body) {
    const out = ctx.doPost({ postData: { contents: JSON.stringify(body) } });
    return JSON.parse(out.getContent());
  }
  return { ctx, props, cache, sheets, mails, logs, triggers, post, unknown, owner };
}

module.exports = { load, unknown };

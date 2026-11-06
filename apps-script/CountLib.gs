/**
 * ระบบ Stock สำเร็จรูป — ส่วนตรวจนับ (เดิมเป็นไลบรารีแยก รวมเข้าโปรเจกต์เดียวแล้ว)
 * ทุกอย่างอยู่ในกล่อง COUNTLIB ไม่ชนชื่อกับ Core.gs · Core.gs เรียกผ่าน countlib_() เท่านั้น
 * ยอดที่นับได้ลงคอลัมน์ นับใหม่ (H) และต่อท้ายแท็บ RECON_LOG ทุกครั้ง (แก้ย้อนหลังไม่ได้)
 * คอลัมน์ F (จำนวนตั้งต้น) และ G (ยอดยกมา) ไม่ถูกเขียนทับ
 */
const COUNTLIB = (function () {
// ═══════════════════════════════════════════════════════════════
//  ส่วนตั้งค่า — แก้ได้เฉพาะในบล็อกนี้
// ═══════════════════════════════════════════════════════════════
const CONFIG = {

  // ไอดีของไฟล์ Google Sheets (ดูได้จาก URL ระหว่าง /d/ กับ /edit)
  // รหัสชีตมาจาก Core.gs ผ่าน useContext() ทุกครั้ง · ว่าง = หยุด ไม่เดาชีต
  SHEET_ID: '',

  // ชื่อแท็บ
  TAB_REGISTER: 'ทะเบียนพัสดุ',   // แท็บทะเบียนพัสดุ
  TAB_LOG:      'RECON_LOG',      // แท็บบันทึกการกระทบยอด สร้างเองอัตโนมัติถ้าไม่มี

  HEADER_ROW: 1,                  // แถวหัวตารางของแท็บทะเบียน
  FIRST_DATA_ROW: 2,

  // ตำแหน่งคอลัมน์ในแท็บทะเบียนพัสดุ (นับเป็นเลข A=1, B=2, ...)
  COL: {
    code:        1,   // A  รหัสรายการ
    name:        2,   // B  รายการ
    subCat:      3,   // C  หมวดหมู่
    size:        4,   // D  ไซส์ / รายละเอียด
    mainCat:     5,   // E  หมวดหลัก
    qtyStart:    6,   // F  จำนวนตั้งต้น      ← อ่านเท่านั้น
    qtyOld:      7,   // G  ยอดยกมา        ← อ่านเท่านั้น (หน้าตรวจนับใช้ยอดในระบบจาก LEDGER แทน)
    qtyNew:      8,   // H  นับใหม่           ← เขียน
    onShelf:     9,   // I  ขึ้นชั้นแล้ว       ← เขียน
    diff:       10,   // J  ส่วนต่าง          ← เป็นสูตรในชีต ไม่เขียนทับ
    location:   11,   // K  สถานที่เก็บ       ← เขียน
    condition:  12,   // L  สภาพอุปกรณ์       ← เขียน
    photo:      13,   // M  สถานะภาพ
    qtyKind:    14,   // N  ข้อมูลจำนวน
    lastInsp:   15,   // O  ผู้ตรวจล่าสุด
    inspDate:   16,   // P  วันที่ตรวจ
    counter:    17,   // Q  ผู้นับรอบนี้       ← เขียน
    note:       18    // R  หมายเหตุ          ← เขียน (ต่อท้ายข้อความเดิม)
  },

  // ตัวเลือกในช่อง "สถานะการกระทบยอด"
  STATUS_OPTIONS: [
    'ครบตามยอดในระบบ',
    'ขาด — หาไม่พบ',
    'ขาด — ถูกใช้งานไปแล้ว',
    'ขาด — ชำรุด ทิ้งแล้ว',
    'เกินยอดในระบบ',
    'ยังนับไม่ครบ รอนับต่อ'
  ],

  // ตัวเลือกช่องสภาพอุปกรณ์ ให้ตรงกับ dropdown ในชีต
  CONDITION_OPTIONS: [
    'ใหม่', 'พร้อมใช้งาน', 'ใช้งานได้ มีรอยสึก',
    'ชำรุด / รอซ่อม', 'หาไม่พบ', 'ยังไม่ตรวจ'
  ],

  get ORG_NAME() { return CTX_.org || 'ชื่อหน่วยงานของคุณ'; },
  DOC_TITLE: 'แบบฟอร์มตรวจนับพัสดุ',
  TIMEZONE: 'Asia/Bangkok'
};

const LOG_HEADERS = [
  'RECON_ID', 'วันที่เวลา', 'รหัสรายการ', 'ชื่อรายการ', 'หมวดหลัก',
  'ยอดในระบบขณะนับ', 'ยอดนับได้จริง', 'ส่วนต่าง', 'สถานะ',
  'ขึ้นชั้นแล้ว', 'สถานที่เก็บ', 'สภาพอุปกรณ์', 'ผู้นับ', 'อีเมลผู้บันทึก', 'หมายเหตุ'
];




/** ส่งค่าตั้งต้นให้หน้าเว็บตอนเปิด */
function getBootstrapData() {
  return {
    orgName: CONFIG.ORG_NAME,
    docTitle: CONFIG.DOC_TITLE,
    statusOptions: CONFIG.STATUS_OPTIONS,
    conditionOptions: CONFIG.CONDITION_OPTIONS,
    user: safeUserEmail_(),
    progress: getProgress()
  };
}


// ═══════════════════════════════════════════════════════════════
//  อ่านข้อมูล
// ═══════════════════════════════════════════════════════════════

/** คืนรายการทั้งหมดแบบย่อ สำหรับช่องค้นหา */
function listItems() {
  const sh = registerSheet_();
  const last = sh.getLastRow();
  if (last < CONFIG.FIRST_DATA_ROW) return [];

  const n = last - CONFIG.FIRST_DATA_ROW + 1;
  const vals = sh.getRange(CONFIG.FIRST_DATA_ROW, 1, n, CONFIG.COL.note).getValues();
  const C = CONFIG.COL;

  return vals
    .filter(r => r[C.code - 1] !== '' && r[C.code - 1] !== null)
    .map(r => ({
      code: String(r[C.code - 1]).trim(),
      name: cleanText_(r[C.name - 1]),
      mainCat: cleanText_(r[C.mainCat - 1]),
      size: cleanText_(r[C.size - 1]),
      qtyOld: oldOf_(String(r[C.code - 1]).trim(), r[C.qtyOld - 1], false, false),
      counted: r[C.qtyNew - 1] === '' || r[C.qtyNew - 1] === null ? null : toNum_(r[C.qtyNew - 1])
    }));
}

/** ดึงรายละเอียดรายการเดียวตามรหัส */
function getItem(code) {
  const row = findRowByCode_(String(code).trim());
  if (!row) throw new Error('ไม่พบรหัส ' + code + ' ในทะเบียน');

  const sh = registerSheet_();
  const r = sh.getRange(row, 1, 1, CONFIG.COL.note).getValues()[0];
  const C = CONFIG.COL;

  return {
    row: row,
    code: String(r[C.code - 1]).trim(),
    name: cleanText_(r[C.name - 1]),
    subCat: cleanText_(r[C.subCat - 1]),
    size: cleanText_(r[C.size - 1]),
    mainCat: cleanText_(r[C.mainCat - 1]),
    qtyStart: toNum_(r[C.qtyStart - 1]),
    qtyOld: oldOf_(String(r[C.code - 1]).trim(), r[C.qtyOld - 1], false, false),
    qtyNew: r[C.qtyNew - 1] === '' ? null : toNum_(r[C.qtyNew - 1]),
    onShelf: cleanText_(r[C.onShelf - 1]),
    location: cleanText_(r[C.location - 1]),
    condition: cleanText_(r[C.condition - 1]),
    photo: cleanText_(r[C.photo - 1]),
    qtyKind: cleanText_(r[C.qtyKind - 1]),
    note: cleanText_(r[C.note - 1])
  };
}

/** ความคืบหน้าการกระทบยอด สำหรับแถบบนหน้าแรก */
function getProgress() {
  const sh = registerSheet_();
  const last = sh.getLastRow();
  if (last < CONFIG.FIRST_DATA_ROW) return { total: 0, done: 0, pending: 0, percent: 0 };

  const n = last - CONFIG.FIRST_DATA_ROW + 1;
  const codes = sh.getRange(CONFIG.FIRST_DATA_ROW, CONFIG.COL.code, n, 1).getValues();
  const news  = sh.getRange(CONFIG.FIRST_DATA_ROW, CONFIG.COL.qtyNew, n, 1).getValues();

  let total = 0, done = 0;
  for (let i = 0; i < n; i++) {
    if (codes[i][0] === '' || codes[i][0] === null) continue;
    total++;
    if (news[i][0] !== '' && news[i][0] !== null) done++;
  }
  return {
    total: total,
    done: done,
    pending: total - done,
    percent: total ? Math.round(done / total * 1000) / 10 : 0
  };
}


// ═══════════════════════════════════════════════════════════════
//  บันทึก — Online Record
// ═══════════════════════════════════════════════════════════════
/**
 * payload = {
 *   code, countedQty, status, onShelf, location, condition, counter, note
 * }
 * คืนอ็อบเจกต์สรุปสำหรับหน้า Summary และหน้าพิมพ์
 */
function saveRecon(payload) {
  const lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) throw new Error('ระบบกำลังบันทึกรายการอื่น ลองอีกครั้งใน 2–3 วินาที');

  try {
    // ── ตรวจความถูกต้องฝั่งหลังบ้าน ไม่เชื่อฟอร์มฝั่งหน้า ──
    const code = String(payload.code || '').trim();
    if (!code) throw new Error('กรุณาเลือกรายการ');

    const item = getItem(code);

    if (payload.countedQty === '' || payload.countedQty === null || payload.countedQty === undefined)
      throw new Error('กรุณากรอกยอดที่นับได้จริง');

    const counted = Number(payload.countedQty);
    if (!isFinite(counted) || counted < 0 || Math.floor(counted) !== counted)
      throw new Error('ยอดที่นับได้จริงต้องเป็นจำนวนเต็มไม่ติดลบ');

    const status = String(payload.status || '').trim();
    if (!status) throw new Error('กรุณาเลือกสถานะ');

    const counter = String(payload.counter || '').trim();
    if (!counter) throw new Error('กรุณากรอกชื่อผู้นับ');

    const diff = counted - item.qtyOld;

    // ส่วนต่างไม่เป็นศูนย์ ต้องมีหมายเหตุ เพื่อให้ตรวจสอบย้อนหลังได้
    const note = String(payload.note || '').trim();
    if (diff !== 0 && !note)
      throw new Error('ยอดไม่ตรงกับยอดในระบบ (ส่วนต่าง ' + fmtDiff_(diff) + ') กรุณาระบุหมายเหตุ');

    // ── เขียนลงแท็บทะเบียน เฉพาะคอลัมน์ที่อนุญาต ──
    const sh = registerSheet_();
    const C = CONFIG.COL;
    const now = new Date();

    sh.getRange(item.row, C.qtyNew).setValue(counted);
    if (payload.onShelf)  sh.getRange(item.row, C.onShelf).setValue(payload.onShelf);
    if (payload.location) sh.getRange(item.row, C.location).setValue(String(payload.location).trim());
    if (payload.condition) sh.getRange(item.row, C.condition).setValue(payload.condition);
    sh.getRange(item.row, C.counter).setValue(counter);
    sh.getRange(item.row, C.inspDate).setValue(now);

    // หมายเหตุ: ต่อท้ายของเดิม ไม่ลบประวัติที่มีอยู่
    const stampedNote = '[' + fmtDate_(now) + ' ' + status + '] ' + note;
    const mergedNote = item.note ? (item.note + '\n' + stampedNote) : stampedNote;
    sh.getRange(item.row, C.note).setValue(mergedNote);

    // ── append ลง RECON_LOG — ประวัติที่แก้ย้อนหลังไม่ได้ ──
    const logSh = logSheet_();
    const reconId = nextReconId_(logSh);
    logSh.appendRow([
      reconId, now, item.code, item.name, item.mainCat,
      item.qtyOld, counted, diff, status,
      payload.onShelf || '', payload.location || '', payload.condition || '',
      counter, safeUserEmail_(), note
    ]);

    SpreadsheetApp.flush();

    // ── สรุปกลับไปแสดงและใช้พิมพ์ ──
    return {
      ok: true,
      reconId: reconId,
      savedAt: fmtDateTime_(now),
      code: item.code,
      name: item.name,
      subCat: item.subCat,
      size: item.size,
      mainCat: item.mainCat,
      qtyStart: item.qtyStart,
      qtyOld: item.qtyOld,
      counted: counted,
      diff: diff,
      diffLabel: fmtDiff_(diff),
      status: status,
      onShelf: payload.onShelf || '-',
      location: payload.location || '-',
      condition: payload.condition || '-',
      counter: counter,
      recorder: safeUserEmail_() || '-',
      note: note || '-',
      sheetRow: item.row,
      progress: getProgress()
    };

  } finally {
    lock.releaseLock();
  }
}

/** สร้าง HTML หน้าพิมพ์จาก Print.html — Offline Record */
function getPrintHtml(summary) {
  const t = HtmlService.createTemplateFromFile('Print');
  // หัวเอกสารและช่องลงนามตั้งได้ที่หน้าเว็บ assets/config.js (FORMS.COUNT) · ไม่ส่งมา = ค่าเริ่มต้น
  const s = Object.assign({}, summary || {});
  const str = function (v, n) { return String(v == null ? '' : v).slice(0, n || 120); };
  const ft = Array.isArray(s.formTitle) ? s.formTitle : [];
  const fs = Array.isArray(s.formSigns) && s.formSigns.length ? s.formSigns : [['ผู้นับ', 'Counted by'], ['ผู้ตรวจสอบ', 'Checked by'], ['ผู้อนุมัติ', 'Approved by']];
  t.d = s;
  t.org = CONFIG.ORG_NAME;
  t.docTitle = str(ft[0]) || CONFIG.DOC_TITLE;
  t.docSub = str(ft[1]) || 'ตรวจนับเทียบยอดในระบบ';
  t.signs = fs.slice(0, 4).map(function (x) { return [str(x && x[0], 60), str(x && x[1], 60)]; });
  t.foot = str(s.formFoot, 300);
  return t.evaluate().getContent();
}


// ═══════════════════════════════════════════════════════════════
//  ตัวช่วยภายใน
// ═══════════════════════════════════════════════════════════════
// Core.gs เรียก useContext ก่อนทุกครั้ง: ใช้ชีตไหน ใครเป็นผู้ใช้ที่ยืนยันตัวตนแล้ว และยอดในระบบของแต่ละรหัส
let CTX_ = { sheetId: '', email: '', qtyOld: null, org: '', app: '' };
function useContext(sheetId, email, o) {
  o = o || {};
  CTX_ = { sheetId: String(sheetId || ''), email: String(email || ''),
           qtyOld: typeof o.qtyOld === 'function' ? o.qtyOld : null, org: String(o.org || ''), app: String(o.app || '') };
}
/** ยอดที่ใช้เทียบกับยอดนับ: ยอดในระบบจาก LEDGER (ถ้ามีตัวบอก) ไม่งั้นใช้คอลัมน์ G */
function oldOf_(code, gValue, counted, forDash) {
  if (CTX_.qtyOld) { try { return toNum_(CTX_.qtyOld(code, counted, forDash)); } catch (e) {} }
  return toNum_(gValue);
}

function ss_() {
  const id = CTX_.sheetId || CONFIG.SHEET_ID;
  if (!id) throw new Error('ยังไม่ได้ตั้งค่าชีต (SHEET_ID)');
  return SpreadsheetApp.openById(id);
}

function registerSheet_() {
  const sh = ss_().getSheetByName(CONFIG.TAB_REGISTER);
  if (!sh) throw new Error('ไม่พบแท็บ "' + CONFIG.TAB_REGISTER + '" ในไฟล์ชีต');
  return sh;
}

/** คืนแท็บ log สร้างใหม่พร้อมหัวตารางถ้ายังไม่มี */
function logSheet_() {
  const ss = ss_();
  let sh = ss.getSheetByName(CONFIG.TAB_LOG);
  if (!sh) {
    sh = ss.insertSheet(CONFIG.TAB_LOG);
    sh.appendRow(LOG_HEADERS);
    const hdr = sh.getRange(1, 1, 1, LOG_HEADERS.length);
    hdr.setBackground('#0A2342').setFontColor('#FFFFFF').setFontWeight('bold');
    sh.setFrozenRows(1);
    sh.setColumnWidth(2, 150);
    sh.setColumnWidth(4, 260);
    sh.setColumnWidth(15, 320);
  }
  return sh;
}

/** หาแถวจากรหัสรายการ ใช้ TextFinder เร็วกว่าอ่านทั้งคอลัมน์ */
function findRowByCode_(code) {
  const sh = registerSheet_();
  const last = sh.getLastRow();
  if (last < CONFIG.FIRST_DATA_ROW) return null;

  const rng = sh.getRange(CONFIG.FIRST_DATA_ROW, CONFIG.COL.code,
                          last - CONFIG.FIRST_DATA_ROW + 1, 1);
  const hit = rng.createTextFinder(code).matchEntireCell(true).findNext();
  return hit ? hit.getRow() : null;
}

function nextReconId_(logSh) {
  const n = Math.max(0, logSh.getLastRow() - 1) + 1;
  const yr = Number(Utilities.formatDate(new Date(), CONFIG.TIMEZONE, 'yyyy')) + 543;
  return 'RC-' + yr + '-' + ('0000' + n).slice(-4);
}

function safeUserEmail_() {
  if (CTX_.email) return CTX_.email;
  try { return Session.getActiveUser().getEmail() || ''; }
  catch (err) { return ''; }
}

function toNum_(v) {
  if (v === '' || v === null || v === undefined) return 0;
  const n = Number(String(v).replace(/,/g, '').trim());
  return isFinite(n) ? n : 0;
}

function cleanText_(v) {
  return v === null || v === undefined ? '' : String(v).replace(/\s+/g, ' ').trim();
}

function fmtDiff_(d) {
  if (d === 0) return 'ตรงกัน';
  return (d > 0 ? 'เกิน +' : 'ขาด ') + d;
}

function fmtDate_(d) {
  return Utilities.formatDate(d, CONFIG.TIMEZONE, 'dd/MM/yyyy');
}

function fmtDateTime_(d) {
  return Utilities.formatDate(d, CONFIG.TIMEZONE, 'dd/MM/yyyy HH:mm');
}




// ═══════════════════════════════════════════════════════════════
//  หน้าแดชบอร์ด — อ่านยอดสดจากทะเบียนและ RECON_LOG (เปิดด้วย ?page=dash)
// ═══════════════════════════════════════════════════════════════
/** รวมตัวเลขทั้งหมดที่หน้าแดชบอร์ดต้องใช้ ในการอ่านชีตรอบเดียว */
function dashData() {
  const sh = registerSheet_();
  const last = sh.getLastRow();
  const n = Math.max(0, last - CONFIG.FIRST_DATA_ROW + 1);
  const rows = n ? sh.getRange(CONFIG.FIRST_DATA_ROW, 1, n, 18).getValues() : [];
  const C = CONFIG.COL;

  const cat = {};
  let total = 0, done = 0, oldAll = 0, oldDone = 0, newSum = 0;
  const short = [], over = [];

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    const code = cleanText_(r[C.code - 1]);
    if (!code) continue;
    total++;

    const main = cleanText_(r[C.mainCat - 1]) || 'ไม่ระบุหมวด';
    const raw = r[C.qtyNew - 1];
    const counted = (raw !== '' && raw !== null && raw !== undefined);
    const o = oldOf_(code, r[C.qtyOld - 1], counted, true);
    const v = toNum_(raw);

    oldAll += o;
    if (!cat[main]) cat[main] = { name: main, total: 0, done: 0, old: 0, now: 0, diff: 0 };
    const c = cat[main];
    c.total++; c.old += o;

    if (counted) {
      done++; oldDone += o; newSum += v;
      c.done++; c.now += v; c.diff += (v - o);
      const d = v - o;
      if (d !== 0) {
        const item = {
          code: code, name: cleanText_(r[C.name - 1]), old: o, now: v, diff: d,
          loc: cleanText_(r[C.location - 1]), by: cleanText_(r[C.counter - 1])
        };
        if (d < 0) short.push(item); else over.push(item);
      }
    }
  }

  short.sort(function (a, b) { return a.diff - b.diff; });
  over.sort(function (a, b) { return b.diff - a.diff; });

  let recent = [];
  try {
    const lg = logSheet_();
    const ln = lg.getLastRow();
    const take = Math.min(12, Math.max(0, ln - 1));
    if (take > 0) {
      const lr = lg.getRange(ln - take + 1, 1, take, LOG_HEADERS.length).getValues();
      recent = lr.map(function (x) {
        return {
          when: fmtDateTime_(x[1]), code: cleanText_(x[2]), name: cleanText_(x[3]),
          old: toNum_(x[5]), now: toNum_(x[6]), diff: toNum_(x[7]),
          status: cleanText_(x[8]), by: cleanText_(x[12])
        };
      }).reverse();
    }
  } catch (err) { recent = []; }

  let shortQty = 0; for (let a = 0; a < short.length; a++) shortQty -= short[a].diff;
  let overQty = 0;  for (let b = 0; b < over.length; b++)  overQty  += over[b].diff;

  const cats = Object.keys(cat).map(function (k) { return cat[k]; })
                     .sort(function (a, b) { return b.old - a.old; });

  return {
    asof: fmtDateTime_(new Date()),
    total: total, done: done, pending: total - done,
    percent: total ? Math.round(done / total * 1000) / 10 : 0,
    oldAll: oldAll, oldDone: oldDone, newSum: newSum, diff: newSum - oldDone,
    shortRows: short.length, shortQty: shortQty,
    overRows: over.length, overQty: overQty,
    cats: cats, short: short.slice(0, 20), over: over.slice(0, 10), recent: recent
  };
}


// ═══════════════════════════════════════════════════════════════
//  แตกชื่อรายการเป็นช่อง และค้นหาแบบถามทีละชั้น
//  เขียนคอลัมน์ S ถึง X ต่อท้ายคอลัมน์ R ไม่แตะคอลัมน์ A ถึง R เดิมเลย
// ═══════════════════════════════════════════════════════════════
const ATTR = {
  firstCol: 19,
  heads: ['แบบ', 'งาน', 'ปี', 'สี', 'สีรอง', 'ขนาด']
};

const A_FORM = [
  [/ปลอกแขน/i, 'ปลอกแขน'],
  [/เสื้อยืดคอกลม|เสื้อยืด|t-?shirt/i, 'เสื้อยืด'],
  [/polo|โปโล/i, 'โปโล'],
  [/เสื้อกั๊ก/i, 'เสื้อกั๊ก'],
  [/แขนยาว|long\s*sleeve/i, 'แขนยาว'],
  [/กันฝน|rain/i, 'ชุดกันฝน'],
  [/แจ๊?คเก็ต|jacket/i, 'แจ็คเก็ต'],
  [/สูท/i, 'สูท'],
  [/หมวก|cap|hat/i, 'หมวก']
];
const A_EVENT = [];   // ชื่องาน/กิจกรรมที่จะแยกจากชื่อรายการ เช่น [/ประชุมใหญ่/i, 'ประชุมใหญ่']
const A_COLOR = [
  [/เขียวเข้ม|dark\s*green/i, 'เขียวเข้ม'], [/เขียวมะนาว|lime/i, 'เขียวมะนาว'],
  [/น้ำเงิน|navy|กรม/i, 'กรม'],            [/ครีม|cream|beige|baige/i, 'ครีม'],
  [/ฟ้า|blue/i, 'ฟ้า'],                     [/ขาว|white/i, 'ขาว'],
  [/เขียว|green/i, 'เขียว'],                [/ส้ม|orange|oran/i, 'ส้ม'],
  [/เหลือง|yellow/i, 'เหลือง'],             [/แดง|red/i, 'แดง'],
  [/ม่วง|purple/i, 'ม่วง'],                 [/ดำ|black/i, 'ดำ'],
  [/ชมพู|pink/i, 'ชมพู'],                   [/เทา|grey|gray/i, 'เทา'],
  [/ทอง|gold/i, 'ทอง'],                     [/เงิน|silver/i, 'เงิน']
];
const A_SIZE = {
  SSS: 'SSS', SS: 'SS', XS: 'XS', S: 'S', M: 'M', L: 'L', XL: 'XL',
  '2XL': '2XL', XXL: '2XL', '2L': '2XL', '3XL': '3XL', XXXL: '3XL',
  '4XL': '4XL', XXXXL: '4XL', '5XL': '5XL', XXXXXL: '5XL',
  '36': '36', '38': '38', '40': '40', '44': '44', '48': '48', '52': '52'
};
const A_WEAR = ['เสื้อ', 'หมวก', 'เสื้อ / ชุดกันฝน'];

const A_FIX = {};     // แก้ผลแยกช่องรายรหัส เช่น { 'ITEM-020': { 'ทรง': 'ปลอกแขน' } }
const A_SUM = [];     // รหัสที่เป็นแถวรวม ไม่แสดงในตัวช่วยเลือกหมวด

function aPick_(rules, t) {
  for (let i = 0; i < rules.length; i++) if (rules[i][0].test(t)) return rules[i][1];
  return '';
}
function aColor_(t) {
  let m = t.match(/(.*?)\s*คอปก\s*(.+)/);
  if (m) return [aPick_(A_COLOR, m[1]), aPick_(A_COLOR, m[2])];
  m = t.match(/(.+?)\s*(?:polo)?\s*\/\s*(.+?)\s*coll?ar/i);
  if (m) return [aPick_(A_COLOR, m[1]), aPick_(A_COLOR, m[2])];
  return [aPick_(A_COLOR, t), ''];
}
function aSize_(t) {
  let m = t.match(/size\s*([A-Za-z0-9]+)/i);
  if (m) return A_SIZE[m[1].toUpperCase().replace(/[^A-Z0-9]/g, '')] || '';
  m = t.trim().match(/([A-Za-z0-9]{1,6})\s*$/);
  if (m) return A_SIZE[m[1].toUpperCase()] || '';
  return '';
}
function aYear_(t) {
  let m = t.match(/(?<![0-9])((?:19|20)[0-9]{2})(?![0-9])/);
  if (m) return m[1];
  m = t.match(/'([0-9]{2})(?![0-9])/);
  if (m) return '20' + m[1];
  m = t.match(/(?<![0-9])(25[0-9]{2})(?![0-9])/);
  if (m) return String(Number(m[1]) - 543);
  return '';
}

function aSplit_(code, name, subCat) {
  if (A_SUM.indexOf(code) >= 0) return ['', '', '', '', '', ''];
  let form = aPick_(A_FORM, name) || (subCat === 'หมวก' ? 'หมวก' : '');
  const ev = aPick_(A_EVENT, name);
  const yr = aYear_(name);
  const c  = aColor_(name);
  const sz = aSize_(name);
  if (A_WEAR.indexOf(subCat) >= 0 && !form) form = 'ไม่ทราบ';
  const o = { 'ทรง': form, 'งาน': ev, 'ปี': yr, 'สีตัว': c[0], 'สีคอปก': c[1], 'ไซส์': sz };
  const fix = A_FIX[code];
  if (fix) for (const k in fix) o[k] = fix[k];
  return ATTR.heads.map(function (h) { return o[h]; });
}


/** ข้อมูลทั้งหมดสำหรับช่องค้นหาแบบถามทีละชั้น โหลดรอบเดียวแล้วกรองที่หน้าเว็บ */
function facetData() {
  const sh   = registerSheet_();
  const last = sh.getLastRow();
  const n    = last - CONFIG.FIRST_DATA_ROW + 1;
  if (n < 1) return { ready: false, items: [] };

  const wide = sh.getLastColumn() >= ATTR.firstCol + 5;
  const vals = sh.getRange(CONFIG.FIRST_DATA_ROW, 1, n,
                           wide ? ATTR.firstCol + 5 : 18).getValues();
  const C = CONFIG.COL, F = ATTR.firstCol - 1;
  const items = [];
  let hasAttr = 0;

  for (let i = 0; i < n; i++) {
    const r = vals[i];
    const code = cleanText_(r[C.code - 1]);
    if (!code || A_SUM.indexOf(code) >= 0) continue;
    const name = String(r[C.name - 1] || '').replace(/\n/g, ' ').trim();
    const a = wide ? [r[F], r[F+1], r[F+2], r[F+3], r[F+4], r[F+5]].map(cleanText_)
                   : aSplit_(code, name, cleanText_(r[C.subCat - 1]));
    if (a.join('')) hasAttr++;
    const raw = r[C.qtyNew - 1];
    items.push({
      c: code, n: name,
      cat:  cleanText_(r[C.mainCat - 1]),
      sub:  cleanText_(r[C.subCat - 1]),
      old:  oldOf_(code, r[C.qtyOld - 1], !(raw === '' || raw === null || raw === undefined), false),
      done: !(raw === '' || raw === null || raw === undefined),
      now:  toNum_(raw),
      loc:  cleanText_(r[C.location - 1]),
      f: a[0], e: a[1], y: a[2], b: a[3], cl: a[4], s: a[5]
    });
  }
  return { ready: hasAttr > 0, written: wide, items: items };
}











// ── ฟังก์ชันที่หน้าเว็บเรียก ───────────────────────────────────






// ── ตั้งค่า รันมือจากหน้า Editor เท่านั้น ───────────────────────








// สะพานให้ระบบเบิกจ่าย เฟส 2 เรียกข้ามโปรเจกต์เข้ามาได้
function countListItems() { return listItems(); }

  return { useContext: useContext, getBootstrapData: getBootstrapData, listItems: listItems,
           countListItems: countListItems, getItem: getItem, getProgress: getProgress, saveRecon: saveRecon,
           getPrintHtml: getPrintHtml, facetData: facetData, dashData: dashData };
})();

/**
 * ระบบ Stock สำเร็จรูป — หลังบ้านหลัก: เบิก จ่าย คืน ย้าย สายอนุมัติ ผู้ดูแลระบบ รายการพัสดุ เข้าสู่ระบบ
 *
 * หลักการ
 *   1 คงเหลือคำนวณจากแท็บ LEDGER_เคลื่อนไหว เสมอ (ผลรวม เข้า − ออก) ไม่เขียนทับยอดในทะเบียน
 *   2 หนึ่งเอกสารมีหลายรายการ แยกตารางหัวเรื่องกับตารางรายการ
 *   3 สิทธิ์อ่านจากแท็บ MASTER_ผู้ใช้ ไม่ฝังชื่อหรืออีเมลคนไว้ในโค้ด
 *   4 "ลบรายการ" = เปลี่ยนสถานะเป็น เลิกใช้ + ตัดยอดเหลือ 0 ไม่ลบแถว ประวัติอยู่ครบ
 *
 * ค่าตั้งทั้งหมดอยู่ใน Script Properties (ดูไฟล์ Config.gs) ไม่มีรหัสชีตหรืออีเมลในโค้ด
 */

// ═══════════════════════════════════════════════════════════════
//  ส่วนตั้งค่า — แก้ได้เฉพาะในบล็อกนี้
// ═══════════════════════════════════════════════════════════════
const CFG = {

  // อ่านจาก Script Properties (SHEET_ID) · ว่าง = ระบบหยุด ไม่ย้อนไปเขียนชีตเก่า
  get SHEET_ID() { return prop_('SHEET_ID'); },

  // สายอนุมัติ 3 ขั้น — ตอนนี้ปิดไว้ตามที่ตกลงกันว่ายังไม่จำเป็น
  //   false = สร้างเอกสารแล้วผ่านเลย บันทึกไว้ว่าใครเป็นคนทำ
  //   true  = เปิดสายอนุมัติ ADMIN แล้ว MANAGER แล้ว SECGEN เหมือนเดิม
  // เปลี่ยนค่านี้ค่าเดียว ไม่ต้องแก้ที่อื่น
  APPROVAL: false,

  // ตัวตนและสิทธิ์ — ยืนยันด้วยบัญชี Google อย่างเดียว ไม่มี PIN
  //   อีเมลในแท็บ MASTER_ผู้ใช้  = ตามบทบาทในชีต
  //   อีเมลลงท้าย STAFF_DOMAIN ที่ไม่อยู่ในชีต = เจ้าหน้าที่อัตโนมัติ
  //   อีเมลอื่น (Gmail ทั่วไป) = ผู้ใช้ภายนอก ต้องกรอกแบบสอบถามก่อน แล้วใช้ได้เฉพาะ เบิก / รอรับ / คืน
  AUTH_MODE: 'GOOGLE',
  // โดเมนอีเมลเจ้าหน้าที่ (Script Property STAFF_DOMAIN เช่น example.org) · ว่าง = ไม่มีเจ้าหน้าที่อัตโนมัติ
  get STAFF_DOMAIN() { const d = prop_('STAFF_DOMAIN').trim().toLowerCase().replace(/^@+/, ''); return d ? '@' + d : ''; },

  TABS: {
    REGISTER: 'ทะเบียนพัสดุ',
    REQ_H:    'REQ_หัวเรื่อง',
    REQ_L:    'REQ_รายการ',
    DIS_H:    'DIS_หัวเรื่อง',
    DIS_L:    'DIS_รายการ',
    MOV:      'MOV_ย้าย',
    APV:      'APV_อนุมัติ',
    LEDGER:   'LEDGER_เคลื่อนไหว',
    USERS:    'MASTER_ผู้ใช้',
    PLACES:   'MASTER_สถานที่'
  },

  // คอลัมน์ในแท็บทะเบียนพัสดุ (F จำนวนตั้งต้น · G ยอดยกมา) อ่านอย่างเดียว ยกเว้น location ตอนย้ายถาวร
  REG: { code:1, name:2, subCat:3, size:4, mainCat:5,
         qtyStart:6, qtyOld:7, qtyNew:8, onShelf:9, diff:10,
         location:11, condition:12, photo:13, qtyKind:14,
         lastInsp:15, inspDate:16, counter:17, note:18 },

  CONDITIONS: ['ใหม่','พร้อมใช้งาน','ใช้งานได้ มีรอยสึก','ชำรุด / รอซ่อม','หาไม่พบ','ยังไม่ตรวจ'],
  DEPARTMENTS: ['การเงิน','บัญชี','ธุรการ','จัดกิจกรรม','อื่นๆ'],
  RECEIVER_TYPES: ['บุคคล','เจ้าหน้าที่','หน่วยงานภายใน','หน่วยงานภายนอก','อื่น ๆ'],

  get ORG() { return prop_('ORG_NAME') || 'ชื่อหน่วยงานของคุณ'; },      // Script Property ORG_NAME
  get APP() { return prop_('APP_NAME') || 'ระบบ Stock'; },              // Script Property APP_NAME
  get PREFIX() { return (prop_('ITEM_PREFIX') || 'ITEM').toUpperCase().replace(/[^A-Z0-9]/g, '') || 'ITEM'; },   // รหัสพัสดุ เช่น ITEM-001
  TZ: 'Asia/Bangkok'
};

/** รหัสพัสดุถูกรูปแบบไหม: <ITEM_PREFIX>-ตัวเลขอย่างน้อย 3 หลัก เช่น ITEM-001 */
function codeRe_() { return new RegExp('^' + CFG.PREFIX + '-\\d{3,}$', 'i'); }
function codeOk_(code) { return codeRe_().test(String(code || '').trim()); }

/** หัวตารางของแต่ละแท็บ ใช้ตอนสร้างแท็บอัตโนมัติ */
const HEAD = {
  REQ_H: ['REQ_ID','วันที่สร้าง','ผู้ขอเบิก_อีเมล','ผู้ขอเบิก_ชื่อ','ฝ่าย','ประเภทการเบิก',
          'หน่วยงานภายนอก','งาน_กิจกรรม','วัตถุประสงค์','วันที่เบิก','กำหนดคืน',
          'ไฟล์แนบ_ลิงก์','สถานะ','APV_ID','หมายเหตุ'],
  REQ_L: ['LINE_ID','REQ_ID','รหัสรายการ','ชื่อรายการ','จำนวนที่เบิก','หน่วย','สภาพก่อนเบิก',
          'วันที่คืนจริง','จำนวนที่คืน','สภาพตอนคืน','จำนวนเสียหาย','จำนวนสูญหาย','ผู้ตรวจรับคืน'],
  DIS_H: ['DIS_ID','วันที่จ่าย','ผู้จ่าย_อีเมล','ผู้รับ_ชื่อ','ผู้รับ_ประเภท','สถานที่',
          'วัตถุประสงค์','หลักฐาน_ลิงก์','สถานะ','APV_ID','หมายเหตุ'],
  DIS_L: ['LINE_ID','DIS_ID','รหัสรายการ','ชื่อรายการ','จำนวนที่จ่าย','หน่วย',
          'ราคาต้นทุน_ต่อหน่วย','มูลค่ารวม'],
  MOV:   ['MOV_ID','ประเภทการย้าย','รหัสรายการ','ชื่อรายการ','จำนวนที่ย้าย','จาก_สถานที่',
          'ไป_สถานที่','วันที่ย้าย','กำหนดย้ายกลับ','ผู้สั่งการ_อีเมล','ผู้ขนย้ายจริง',
          'อัปเดตทะเบียนแล้ว','สถานะ','APV_ID','หมายเหตุ'],
  APV:   ['APV_ID','TXN_ประเภท','TXN_ID',
          'ขั้น1_ผู้ดูแลระบบ','ขั้น1_ผล','ขั้น1_เวลา','ขั้น1_ความเห็น',
          'ขั้น2_ผู้จัดการ','ขั้น2_ผล','ขั้น2_เวลา','ขั้น2_ความเห็น',
          'ขั้น3_ผู้บริหาร','ขั้น3_ผล','ขั้น3_เวลา','ขั้น3_ความเห็น',
          'ข้ามขั้น','ข้ามขั้น_โดย','ข้ามขั้น_ตำแหน่ง','ข้ามขั้น_เวลา',
          'แจ้งผู้บริหารแล้ว','สถานะรวม','ล็อกโดยผู้บริหาร'],
  LEDGER:['LED_ID','วันที่เวลา','รหัสรายการ','ชื่อรายการ','ประเภทรายการ','จำนวน_เข้า','จำนวน_ออก',
          'TXN_ประเภท','TXN_ID','ผู้บันทึก','หมายเหตุ'],
  USERS: ['อีเมล','ชื่อ','ตำแหน่ง','บทบาท','อนุมัติขั้น','สิทธิ์ขาด','ใช้งาน','ว่าง (สำรอง)','หมายเหตุ'],
  PLACES:['รหัสสถานที่','ชื่อสถานที่','ประเภท','อาคาร / ชั้น','ผู้ดูแล','ใช้งาน','หมายเหตุ']
};

// ดัชนีคอลัมน์ APV ที่ใช้บ่อย (1-based)
const A = { id:1, type:2, txn:3,
            s1who:4, s1res:5, s1at:6, s1note:7,
            s2who:8, s2res:9, s2at:10, s2note:11,
            s3who:12, s3res:13, s3at:14, s3note:15,
            byp:16, bypWho:17, bypRole:18, bypAt:19,
            notified:20, overall:21, locked:22 };


// ═══════════════════════════════════════════════════════════════
//  จุดเข้าเว็บแอป
// ═══════════════════════════════════════════════════════════════
// สิทธิ์เข้าแต่ละหน้า (ตรวจที่ฝั่งเซิร์ฟเวอร์ทุกครั้ง ไม่ใช่แค่ซ่อนเมนู)
const PAGE_ACL_ = {
  ADMIN:    ['home', 'stock', 'index', 'count', 'dash', 'admin', 'my'],
  STAFF:    ['home', 'stock', 'index', 'count', 'dash', 'my'],
  AUDITOR:  ['home', 'stock', 'dash'],
  EXTERNAL: ['stock', 'index', 'my']
};
const ROLE_LABEL_ = { ADMIN: 'ผู้ดูแลระบบ', STAFF: 'เจ้าหน้าที่', AUDITOR: 'ผู้ตรวจสอบ', EXTERNAL: 'ผู้ใช้ภายนอก' };

function doGet() {
  // หลังบ้านไม่มีหน้าเว็บ หน้าเว็บอยู่บน GitHub Pages (Script Property FRONT_URL)
  const u = prop_('FRONT_URL');
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const body = u
    ? '<p>' + esc(CFG.APP) + ' เปิดใช้ที่ลิงก์นี้ · Open the web app here</p><p><a target="_top" href="' + esc(u) + '">' + esc(u) + '</a></p>'
    : '<p>' + esc(CFG.APP) + ' API</p>';
  return HtmlService.createHtmlOutput('<div style="font:16px system-ui;padding:24px">' + body + '</div>')
    .setTitle(CFG.APP).addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/** รายการเมนูที่แต่ละบทบาทเห็น [page, ป้าย] */
function navItems_(me) {
  const all = [
    ['home',    'หน้าแรก'],
    ['stock',   'รายการพัสดุ'],
    ['index',   me.role === 'EXTERNAL' ? 'ขอเบิก / แจ้งคืน' : 'เบิก · จ่าย · คืน · ย้าย'],
    ['count',   'ตรวจนับ'],
    ['dash',    'สรุปภาพรวม'],
    ['admin',   'ผู้ดูแลระบบ'],
    ['my',      'คำขอของฉัน']
  ];
  const acl = PAGE_ACL_[me.role] || [];
  return all.filter(x => acl.indexOf(x[0]) >= 0);
}

// แถบเมนูสร้างที่หน้าเว็บ (assets/shell.js) จาก meInfo

function wrapHtml_(html, title) {
return HtmlService.createHtmlOutput(html)
.setTitle(title + ' — ' + CFG.APP)
.addMetaTag('viewport', 'width=device-width, initial-scale=1')
.setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

/** ค่าตั้งต้นที่หน้าเว็บต้องใช้ */
function getBoot(tok) {
  const me = whoAmI(tok);
  return {
    org: CFG.ORG,
    me: me,
    conditions: CFG.CONDITIONS,
    departments: CFG.DEPARTMENTS,
    receiverTypes: CFG.RECEIVER_TYPES,
    places: listPlaces(),
    myUrl: appBase_() + '?page=my',
    review: reviewOn_(),                                    // 
    canApprove: !!(me && ['ADMIN','MANAGER','SECGEN'].indexOf(me.role) >= 0)
  };
}



/**
 * นำยอดยกมาจากคอลัมน์ G (ยอดยกมา) ของทุกรายการในทะเบียน ลงบัญชีเคลื่อนไหวเป็นบรรทัด "ยอดยกมา"
 * ใช้ครั้งเดียวหลังวางรายการพัสดุเดิมลงแท็บทะเบียนพัสดุด้วยมือ · รันจาก Editor
 * ไม่ทำถ้าบัญชีเคลื่อนไหวมีข้อมูลแล้ว (กันลงซ้ำ) · ข้ามรายการที่ยอดเป็น 0 · ตั้งสถานะว่าง = ใช้งาน
 */
function SETUP_importOpeningBalances() {
  const led = sheet_(CFG.TABS.LEDGER);
  if (led.getLastRow() > 1) throw new Error('บัญชีเคลื่อนไหวมีข้อมูลแล้ว ไม่ลงซ้ำ');

  const reg = sheet_(CFG.TABS.REGISTER);
  const n = reg.getLastRow() - 1;
  if (n < 1) throw new Error('แท็บทะเบียนพัสดุยังว่าง วางรายการพัสดุก่อน');
  const vals = reg.getRange(2, 1, n, CFG.REG.note).getValues();
  const now = new Date();
  const who = safeEmail_() || 'SETUP';
  const tag = 'INIT-' + Utilities.formatDate(now, CFG.TZ, 'yyyyMMdd');
  const rows = [], bad = [];

  vals.forEach(r => {
    const code = String(r[CFG.REG.code - 1] || '').trim();
    if (!code) return;
    if (!codeOk_(code)) bad.push(code);
    const qty = toNum_(r[CFG.REG.qtyOld - 1]);
    if (qty <= 0) return;
    rows.push(['LED-' + ('00000' + (rows.length + 1)).slice(-5), now, code,
               cleanText_(r[CFG.REG.name - 1]), 'ยอดยกมา', qty, 0,
               'INIT', tag, who, 'ยอดยกมาจากทะเบียน (คอลัมน์ G)']);
  });
  if (bad.length) throw new Error('รหัสไม่ตรงรูปแบบ ' + CFG.PREFIX + '-001: ' + bad.slice(0, 10).join(', ') +
                                  ' · แก้รหัส หรือแก้ Script Property ITEM_PREFIX ก่อน');
  if (rows.length) led.getRange(2, 1, rows.length, HEAD.LEDGER.length).setValues(rows);
  SETUP_addStatusColumn();
  SpreadsheetApp.flush();
  bumpData_();
  Logger.log('ลงยอดยกมาแล้ว %s รายการ', rows.length);
  return rows.length;
}




function lookupUser_(email) {
  const sh = sheet_(CFG.TABS.USERS);
  const last = sh.getLastRow();
  if (last < 2) return null;
  const rows = sh.getRange(2, 1, last - 1, HEAD.USERS.length).getValues();
  const t = String(email).trim().toLowerCase();

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (String(r[0]).trim().toLowerCase() !== t) continue;
    if (String(r[6]).trim() !== 'ใช่') return null;      // ปิดการใช้งาน
    return {
      row: i + 2,
      email: String(r[0]).trim(),
      name: cleanText_(r[1]) || String(r[0]).split('@')[0],
      position: cleanText_(r[2]),
      role: String(r[3]).trim().toUpperCase(),
      step: toNum_(r[4]),
      absolute: String(r[5]).trim() === 'ใช่',
      active: true
    };
  }
  return null;
}



/**
 * เพิ่มหรือแก้ผู้ใช้ในทะเบียนสิทธิ์ — รันมือจาก Editor
 * role: ADMIN ขั้น 1 · MANAGER ขั้น 2 · SECGEN ขั้น 3 มีสิทธิ์ขาด · STAFF สร้างเอกสารได้ ไม่อนุมัติ
 */
function SETUP_addUser(email, name, position, role, step, absolute) {
  const sh = sheet_(CFG.TABS.USERS);
  const e = String(email || '').trim().toLowerCase();
  if (!e) throw new Error('ต้องระบุอีเมล');
  const R = String(role || 'STAFF').trim().toUpperCase();
  const abs = (absolute === true || absolute === 'ใช่') ? 'ใช่' : 'ไม่';
  const last = sh.getLastRow();
  const rows = last < 2 ? [] : sh.getRange(2, 1, last - 1, HEAD.USERS.length).getValues();

  for (let i = 0; i < rows.length; i++) {                     // มีอีเมลนี้แล้ว แก้แถวเดิม
    if (String(rows[i][0]).trim().toLowerCase() === e) {
      sh.getRange(i + 2, 1, 1, 7).setValues([[e, name || '', position || '', R, step || '', abs, 'ใช่']]);
      Logger.log('แก้ผู้ใช้เดิม %s เป็นบทบาท %s', e, R);
      return 'updated';
    }
  }
  for (let i = 0; i < rows.length; i++) {                     // มีแถวบทบาทนี้รออยู่ เติมอีเมลลงไป
    if (!String(rows[i][0]).trim() && String(rows[i][3]).trim().toUpperCase() === R) {
      sh.getRange(i + 2, 1, 1, 2).setValues([[e, name || '']]);
      Logger.log('เติมอีเมล %s ลงแถวบทบาท %s', e, R);
      return 'filled';
    }
  }
  sh.appendRow([e, name || '', position || '', R, step || '', abs, 'ใช่', '', '']);
  Logger.log('เพิ่มผู้ใช้ใหม่ %s บทบาท %s', e, R);
  return 'added';
}

/** ตั้งบัญชีที่กดรันอยู่ให้เป็นผู้ดูแลระบบคนแรก — รันครั้งเดียวจาก Editor */
function SETUP_firstAdmin() {
  const me = safeEmail_();
  if (!me) throw new Error('อ่านอีเมลไม่ได้ ต้องรันจากหน้า Editor เท่านั้น');
  SETUP_addUser(me, me.split('@')[0], 'ผู้ดูแลระบบ', 'ADMIN', 1, false);
  Logger.log('ตั้ง %s เป็น ADMIN เรียบร้อย เปิดลิงก์เว็บแอปได้เลย', me);
  return me;
}

/** AUDITOR ดูได้อย่างเดียว ห้ามสร้างหรือแก้เอกสาร */
function denyAudit_(me) {
  if (me && String(me.role).toUpperCase() === 'AUDITOR')
    throw new Error('บัญชีนี้เป็นผู้ตรวจสอบ ดูข้อมูลได้อย่างเดียว แก้ไขหรือสร้างเอกสารไม่ได้');
  return me;
}



// ═══════════════════════════════════════════════════════════════
//  คงเหลือ — คำนวณจากบัญชีเคลื่อนไหวเสมอ
// ═══════════════════════════════════════════════════════════════
/** คืน map รหัสรายการ -> คงเหลือปัจจุบัน */
function balanceMap_() {
  const sh = sheet_(CFG.TABS.LEDGER);
  const last = sh.getLastRow();
  const m = {};
  if (last < 2) return m;
  const rows = sh.getRange(2, 3, last - 1, 5).getValues();   // C..G
  rows.forEach(r => {
    const code = String(r[0] || '').trim();
    if (!code) return;
    m[code] = (m[code] || 0) + toNum_(r[3]) - toNum_(r[4]);  // เข้า - ออก
  });
  return m;
}

function getBalance(code) {
  return balanceMap_()[String(code).trim()] || 0;
}

/** รายการพัสดุพร้อมคงเหลือปัจจุบัน สำหรับช่องค้นหา */
function listItems() {
  requireUser_();
  return listItemsCached_();                                         // แคช (ตอนส่งคำขอตรวจยอดสดเสมอ)
}
function listItemsCached_(fresh) {
  if (!fresh) { const hit = cacheGet_('items'); if (hit) return hit; }
  const out = listItemsFresh_(); cachePut_('items', out); return out;
}
function listItemsFresh_() {
  const reg = sheet_(CFG.TABS.REGISTER);
  const last = reg.getLastRow();
  if (last < 2) return [];
  const vals = reg.getRange(2, 1, last - 1, CFG.REG.note).getValues();
  const bal = balanceMap_();

  const en = nameEnMap_();
  const stNow = statusMap_(); return vals.filter(r => { const c = String(r[CFG.REG.code - 1] || '').trim(); return c && (stNow[c] || 'ใช้งาน') === 'ใช้งาน'; })
    .map(r => {
      const code = String(r[CFG.REG.code - 1]).trim();
      return {
        code: code,
        name: cleanText_(r[CFG.REG.name - 1]),
        nameEn: en[code] || '',
        mainCat: cleanText_(r[CFG.REG.mainCat - 1]),
        size: cleanText_(r[CFG.REG.size - 1]),
        unit: '',
        location: cleanText_(r[CFG.REG.location - 1]),
        condition: cleanText_(r[CFG.REG.condition - 1]),
        balance: bal[code] === undefined ? toNum_(r[CFG.REG.qtyOld - 1]) : bal[code]
      };
    });
}

function listPlaces() {
  requireUser_();
  const sh = ss_().getSheetByName(CFG.TABS.PLACES);
  if (!sh || sh.getLastRow() < 2) return [];
  return sh.getRange(2, 1, sh.getLastRow() - 1, 7).getValues()
    .filter(r => String(r[1] || '').trim() && String(r[5]).trim() !== 'ไม่')
    .map(r => cleanText_(r[1]));
}

/** ลงบรรทัดในบัญชีเคลื่อนไหว ไม่มีการแก้ย้อนหลัง */
function ledger_(code, name, kind, qtyIn, qtyOut, txnType, txnId, who, note) {
  const sh = sheet_(CFG.TABS.LEDGER);
  sh.appendRow(['LED-' + ('00000' + sh.getLastRow()).slice(-5), new Date(),
                code, name, kind, qtyIn || 0, qtyOut || 0,
                txnType, txnId, who, note || '']);
}


// ═══════════════════════════════════════════════════════════════
//  เบิก — Requisition
// ═══════════════════════════════════════════════════════════════
/**
 * payload = { type:'ภายในองค์กร'|'ภายนอกองค์กร', org, event, purpose,
 *             dateOut, dueDate, fileUrl, dept, lines:[{code,qty,condition}] }
 */
function createRequisition(payload) {
  const lock = lock_();
  try {
    return createReq_(denyAudit_(requireUser_((payload || {}).tok)), payload || {});
  } finally { lock.releaseLock(); }
}

/** สร้างเอกสารเบิก · ผู้เรียกต้องตรวจสิทธิ์และถือ lock มาก่อน */
function createReq_(me, p) {
  {
    if (isExternal_(me)) {                              // ผู้ใช้ภายนอก: ล็อกเป็นเบิกภายนอก ใส่ข้อมูลติดต่อให้อัตโนมัติ
      p.type = 'ภายนอกองค์กร'; p.org = me.org || p.org;
      p.note = 'ผู้ขอภายนอก โทร ' + (me.phone || '-') + (p.note ? ' · ' + p.note : '');
    }
    // ไม่บังคับกรอก — เว้นว่างได้ ระบบเติมค่าตั้งต้นให้ บังคับเฉพาะเรื่องที่ทำให้ยอดเพี้ยน
    const type = ['ภายในองค์กร','ภายนอกองค์กร'].indexOf(String(p.type || '').trim()) >= 0
               ? String(p.type).trim() : 'ภายในองค์กร';
    if (!p.dateOut) p.dateOut = new Date();
    const kind = reqKind_(p.kind);                    // เบิก-คืน | จ่ายออก
    if (kind === FLOW_.GIVE) p.dueDate = '';           // จ่ายออกไม่มีกำหนดคืน
    giveRules_(me, kind, p);                           // แบบ ข.: ภายนอกขอจ่ายออกเองไม่ได้ · ให้หน่วยงานภายนอกต้องแนบหนังสือ          // ไม่กรอกวันที่ ถือว่าวันนี้
    // กำหนดคืนเว้นว่างได้ เตือนเฉพาะตอนกรอกมาแล้วขัดกันเอง
    if (p.dueDate && new Date(p.dueDate) <= new Date(p.dateOut))
      throw new Error('กำหนดคืนต้องหลังวันที่เบิก');

    const lines = (p.lines || []).filter(l => l && l.code && toNum_(l.qty) > 0);
    if (!lines.length) throw new Error('กรุณาเพิ่มรายการที่จะเบิกอย่างน้อยหนึ่งรายการ');

    const items = indexItems_();
    const bal = balanceMap_();
    const RES = reservedMap_('');                     // หักของที่อนุมัติ (จอง) แล้วแต่ยังไม่จ่าย
    const RAD = radioRows_();
    lines.forEach(l => {
      const it = items[String(l.code).trim()];
      if (!it) throw new Error('ไม่พบรหัส ' + l.code + ' ในทะเบียน');
      const have = (bal[it.code] === undefined ? it.qtyOld : bal[it.code]) - (RES[it.code] || 0);
      if (toNum_(l.qty) > have)
        throw new Error('รหัส ' + it.code + ' ว่างให้ขอ ' + Math.max(0, have) + (RES[it.code] ? ' (จองไว้แล้ว ' + RES[it.code] + ')' : '') + ' ขอ ' + l.qty + ' ไม่ได้');
      radioCheck_(RAD, it.code, l.units, toNum_(l.qty));          // อุปกรณ์รายเครื่อง: ต้องระบุเลขเครื่องที่ว่างให้ครบ
    });

    const now = new Date();
    const hs = sheet_(CFG.TABS.REQ_H);
    const id = nextId_(hs, 'REQ');
    const apv = openApproval_('REQ', id, me);

    hs.appendRow([id, now, me.email, me.name, p.dept || '', type,
                  p.org || '', p.event || '', p.purpose,
                  p.dateOut, p.dueDate, p.fileUrl || '',
                  apv.overall === 'อนุมัติแล้ว' ? 'อนุมัติแล้ว' : 'รออนุมัติ',
                  apv.id, p.note || '']);

    const ls = sheet_(CFG.TABS.REQ_L);
    lines.forEach((l, i) => {
      const it = items[String(l.code).trim()];
      ls.appendRow([id + '-' + ('0' + (i + 1)).slice(-2), id, it.code, it.name,
                    toNum_(l.qty), l.unit || '', l.condition || it.condition || 'ยังไม่ตรวจ',
                    '', '', '', '', '', '', radioList_(l.units).join(', ')]);
      if (radioList_(l.units).length)
        radioMark_(RAD, radioList_(l.units), RADIO_.OUT, p.org || me.name || me.email, id);
    });

    const st0 = reqAfterCreate_(id, kind, me, apv.overall === 'อนุมัติแล้ว' ? 'อนุมัติแล้ว' : 'รออนุมัติ');   // 
    SpreadsheetApp.flush();
    return { ok: true, id: id, apvId: apv.id, status: st0, kind: kind, lines: lines.length };
  }
}

/**
 * ดึงเอกสารเบิกหนึ่งฉบับพร้อมรายการ สำหรับหน้าคืนของ
 * คืนเฉพาะรายการที่ยังคืนไม่ครบ พร้อมยอดที่คืนไปแล้ว
 */
function getRequisition(reqId, tok) {
  requireUser_(tok);
  const id = String(reqId || '').trim().toUpperCase();
  if (!id) throw new Error('กรุณากรอกเลขที่เอกสารเบิก');

  const hs = sheet_(CFG.TABS.REQ_H);
  const hrow = findRow_(hs, 1, id);
  if (!hrow) throw new Error('ไม่พบเอกสาร ' + id + ' ตรวจเลขที่อีกครั้ง');
  const h = hs.getRange(hrow, 1, 1, HEAD.REQ_H.length).getValues()[0];
  const meX = whoAmI();
  if (isExternal_(meX) && (String(h[2]).trim().toLowerCase() !== String(meX.email).toLowerCase() ||
      ['จ่ายของออกแล้ว', 'คืนไม่ครบ'].indexOf(cleanText_(h[12])) < 0))
    throw new Error('ไม่พบเอกสาร ' + id + ' ของบัญชีนี้ หรือยังไม่ได้รับของ');

  const status = cleanText_(h[12]);
  if (status === 'รออนุมัติ')  throw new Error('เอกสาร ' + id + ' ยังรออนุมัติ ยังคืนของไม่ได้');
  if (status === 'ไม่อนุมัติ') throw new Error('เอกสาร ' + id + ' ไม่ได้รับอนุมัติ จึงไม่มีของให้คืน');
  if (status === 'คืนครบ')     throw new Error('เอกสาร ' + id + ' คืนครบแล้ว ไม่ต้องบันทึกซ้ำ');
  if (status === FLOW_.ST.REVIEW || status === FLOW_.ST.OK) throw new Error('เอกสาร ' + id + ' ยังไม่ได้รับของ (' + status + ') ยังคืนไม่ได้');   // 
  if (status === FLOW_.ST.CANCEL) throw new Error('เอกสาร ' + id + ' ถูกยกเลิกแล้ว');
  if (status === FLOW_.ST.GIVEN) throw new Error('เอกสาร ' + id + ' เป็นจ่ายออก ไม่มีการคืน ถ้าต้องคืนให้แจ้งแอดมิน');

  const ls = sheet_(CFG.TABS.REQ_L);
  const last = ls.getLastRow();
  const lines = last < 2 ? [] :
    ls.getRange(2, 1, last - 1, Math.min(ls.getMaxColumns(), HEAD.REQ_L.length + 1)).getValues()
      .filter(r => String(r[1]).trim() === id)
      .map(r => {
        const out = toNum_(r[4]);
        const RADX = radioRows_();
        const units = radioList_(r[13]).filter(c => RADX.rows.some(u => u.code === c && u.st === RADIO_.OUT && u.doc === id));
        const back = toNum_(r[8]), dmg = toNum_(r[10]), lost = toNum_(r[11]);
        return {
          lineId: String(r[0]).trim(), code: String(r[2]).trim(), name: cleanText_(r[3]),
          qtyOut: out, unit: cleanText_(r[5]), condOut: cleanText_(r[6]),
          qtyBack: back, qtyDamaged: dmg, qtyLost: lost,
          settled: (back + dmg + lost) >= out && (back + dmg + lost) > 0,
          remaining: Math.max(0, out - back - dmg - lost),
          units: units
        };
      });

  if (!lines.length) throw new Error('เอกสาร ' + id + ' ไม่มีรายการพัสดุ');

  return {
    id: id, status: status,
    requester: cleanText_(h[3]), dept: cleanText_(h[4]), type: cleanText_(h[5]),
    org: cleanText_(h[6]), event: cleanText_(h[7]), purpose: cleanText_(h[8]),
    dateOut: fmtD_(h[9]), dueDate: fmtD_(h[10]),
    overdue: h[10] instanceof Date && h[10] < new Date(),
    conditions: CFG.CONDITIONS,
    lines: lines
  };
}

/** คืนของ ปิดรายการเบิก ไม่ต้องอนุมัติ แต่ต้องมีผู้ตรวจรับ */
function returnItems(payload) {
  const lock = lock_();
  try {
    const me = denyAudit_(requireUser_((payload || {}).tok));
    const p = payload || {};
    if (isExternal_(me) || (reviewOn_() && String(me.role).toUpperCase() !== 'ADMIN')) return queueReturn_(me, p);   // // ผู้ใช้ภายนอก: แจ้งคืนเท่านั้น รอแอดมินตรวจรับ ยังไม่ตัดยอด
    const reqId = String(p.reqId || '').trim();
    if (!reqId) throw new Error('กรุณาเลือกเอกสารเบิก');

    const hs = sheet_(CFG.TABS.REQ_H);
    const hrow = findRow_(hs, 1, reqId);
    if (!hrow) throw new Error('ไม่พบเอกสาร ' + reqId);
    if (reqRead_(reqId).kind === FLOW_.GIVE) throw new Error('เอกสาร ' + reqId + ' เป็นจ่ายออก ไม่มีการคืน ถ้าต้องคืนให้แจ้งแอดมิน');   // 

    const ls = sheet_(CFG.TABS.REQ_L);
    const last = ls.getLastRow();
    if (last < 2) throw new Error('ไม่พบรายการในเอกสารนี้');
    const rows = ls.getRange(2, 1, last - 1, HEAD.REQ_L.length).getValues();

    const now = new Date();
    let touched = 0, allBack = true;
    const RAD = radioRows_();

    // บันทึกแบบสะสม คืนทีละงวดได้ ไม่ทับยอดที่คืนไปแล้ว
    (p.lines || []).forEach(inp => {
      const idx = rows.findIndex(r => String(r[0]).trim() === String(inp.lineId).trim());
      if (idx < 0) return;
      const r = rows[idx];
      const rowNo = idx + 2;

      const out     = toNum_(r[4]);
      const wasBack = toNum_(r[8]), wasDmg = toNum_(r[10]), wasLost = toNum_(r[11]);
      const left    = out - wasBack - wasDmg - wasLost;      // ยอดค้างคืนก่อนงวดนี้
      const back    = toNum_(inp.qtyBack);
      const dmg     = toNum_(inp.qtyDamaged);

      if (back < 0 || dmg < 0) throw new Error('จำนวนคืนและจำนวนชำรุดต้องไม่ติดลบ');
      if (back + dmg > left)
        throw new Error('รหัส ' + r[2] + ' ค้างคืน ' + left + ' ชิ้น คืน ' + back + ' ชำรุด ' + dmg + ' รวมเกินยอดค้าง');
      if (back + dmg === 0) return;                          // ไม่ได้กรอกอะไร ข้ามไป
      // สภาพตอนคืนไม่บังคับ เว้นว่างได้

      // ส่วนที่เหลือหลังงวดนี้ ถือเป็นสูญหายเมื่อผู้ตรวจรับปิดยอด
      const lost = inp.closeLine ? (left - back - dmg) : 0;

      ls.getRange(rowNo, 8).setValue(now);
      ls.getRange(rowNo, 9).setValue(wasBack + back);
      ls.getRange(rowNo, 10).setValue(inp.condition);
      ls.getRange(rowNo, 11).setValue(wasDmg + dmg);
      ls.getRange(rowNo, 12).setValue(wasLost + lost);
      ls.getRange(rowNo, 13).setValue(me.email);

      const ub = radioList_(inp.unitsBack), ud = radioList_(inp.unitsDamaged);
      const outUnits = RAD.rows.filter(u => u.model === String(r[2]).trim() && u.doc === reqId && u.st === RADIO_.OUT);
      if (outUnits.length) {
        if (ub.length !== back || ud.length !== dmg)
          throw new Error('รหัส ' + r[2] + ' กรุณาเลือกเลขเครื่องที่คืน ' + back + ' เครื่อง และชำรุด ' + dmg + ' เครื่อง');
        ub.concat(ud).forEach(c => { if (!outUnits.some(u => u.code === c)) throw new Error('เครื่อง ' + c + ' ไม่ได้ยืมอยู่ในเอกสาร ' + reqId); });
        radioMark_(RAD, ub, RADIO_.IN, '', '');
        radioMark_(RAD, ud, RADIO_.BAD, '', '', 'ชำรุดตอนคืน ' + reqId);
        if (lost > 0) radioMark_(RAD, outUnits.map(u => u.code).filter(c => ub.indexOf(c) < 0 && ud.indexOf(c) < 0),
                                 RADIO_.BAD, '', '', 'ไม่ได้คืนจาก ' + reqId);
      }
      if (back > 0) ledger_(r[2], r[3], 'คืนกลับ', back, 0, 'REQ', reqId, me.email, 'คืนจาก ' + reqId);
      if (dmg  > 0) ledger_(r[2], r[3], 'เสียหาย', 0, dmg, 'REQ', reqId, me.email, 'เสียหายจาก ' + reqId);
      if (lost > 0) ledger_(r[2], r[3], 'ตรวจนับไม่พบ', 0, lost, 'REQ', reqId, me.email, 'ตรวจนับไม่พบจาก ' + reqId);

      if (left - back - dmg - lost > 0 || lost > 0) allBack = false;
      touched++;
    });

    if (!touched) throw new Error('ไม่มีรายการที่บันทึกการคืน กรุณากรอกจำนวนอย่างน้อยหนึ่งรายการ');
    hs.getRange(hrow, 13).setValue(allBack ? 'คืนครบ' : 'คืนไม่ครบ');
    SpreadsheetApp.flush();
    return { ok: true, id: reqId, lines: touched, status: allBack ? 'คืนครบ' : 'คืนไม่ครบ' };
  } finally { lock.releaseLock(); }
}


// ═══════════════════════════════════════════════════════════════
//  จ่ายขาด — Disbursement
// ═══════════════════════════════════════════════════════════════
function createDisbursement(payload) {
  const lock = lock_();
  try {
    const me = denyAudit_(admOnly_((payload || {}).tok));
    const p = payload || {};

    // ผู้รับยังบังคับอยู่ตัวเดียว เพราะจ่ายขาดคือของออกจากคลังแล้วไม่กลับมา
    // ถ้าไม่รู้ว่าใครเอาไป ก็ตอบคำถามที่ตั้งใจจะตอบไม่ได้เลย
    if (!String(p.receiver || '').trim()) throw new Error('กรุณาระบุผู้รับ');
    if (!p.date) p.date = new Date();                // ไม่กรอกวันที่ ถือว่าวันนี้

    const lines = (p.lines || []).filter(l => l && l.code && toNum_(l.qty) > 0);
    if (!lines.length) throw new Error('กรุณาเพิ่มรายการที่จะจ่าย');

    const items = indexItems_();
    const bal = balanceMap_();
    const RES = reservedMap_('');                     // 
    lines.forEach(l => {
      const it = items[String(l.code).trim()];
      if (!it) throw new Error('ไม่พบรหัส ' + l.code);
      const have = (bal[it.code] === undefined ? it.qtyOld : bal[it.code]) - (RES[it.code] || 0);
      if (toNum_(l.qty) > have)
        throw new Error('รหัส ' + it.code + ' คงเหลือ ' + have + ' จ่าย ' + l.qty + ' ไม่ได้');
    });

    const hs = sheet_(CFG.TABS.DIS_H);
    const id = nextId_(hs, 'DIS');
    const apv = openApproval_('DIS', id, me);

    hs.appendRow([id, p.date, me.email, p.receiver, p.receiverType || '',
                  p.place, p.purpose, p.proofUrl,
                  apv.overall === 'อนุมัติแล้ว' ? 'อนุมัติแล้ว' : 'รออนุมัติ',
                  apv.id, p.note || '']);

    const ls = sheet_(CFG.TABS.DIS_L);
    lines.forEach((l, i) => {
      const it = items[String(l.code).trim()];
      const qty = toNum_(l.qty), cost = toNum_(l.cost);
      ls.appendRow([id + '-' + ('0' + (i + 1)).slice(-2), id, it.code, it.name,
                    qty, l.unit || '', cost, qty * cost]);
    });

    // ถ้าข้ามขั้นอนุมัติทันที ตัดสต็อกเลย ไม่งั้นรอจนอนุมัติครบ
    if (apv.overall === 'อนุมัติแล้ว') dispatchDisbursement_(id, me.email);

    SpreadsheetApp.flush();
    return { ok: true, id: id, apvId: apv.id, status: apv.overall, lines: lines.length };
  } finally { lock.releaseLock(); }
}

/** ตัดสต็อกจริงของเอกสารจ่าย เรียกเมื่ออนุมัติครบ */
function dispatchDisbursement_(disId, who) {
  const ls = sheet_(CFG.TABS.DIS_L);
  const last = ls.getLastRow();
  if (last < 2) return;
  ls.getRange(2, 1, last - 1, HEAD.DIS_L.length).getValues()
    .filter(r => String(r[1]).trim() === disId)
    .forEach(r => ledger_(r[2], r[3], 'จ่ายขาด', 0, toNum_(r[4]), 'DIS', disId, who, 'จ่ายตาม ' + disId));
}


// ═══════════════════════════════════════════════════════════════
//  ย้ายสถานที่ — Transfer
// ═══════════════════════════════════════════════════════════════
function createTransfer(payload) {
  const lock = lock_();
  try {
    const me = denyAudit_(staffOnly_((payload || {}).tok));
    const p = payload || {};
    // บังคับเฉพาะปลายทาง เพราะถ้าไม่รู้ว่าย้ายไปไหนก็ตามของไม่ได้
    // ต้นทางเว้นว่างได้ เพราะของ 369 รายการยังไม่มีข้อมูลสถานที่เก็บเดิมอยู่แล้ว
    const kind = ['ชั่วคราว','ถาวร'].indexOf(String(p.kind || '').trim()) >= 0
               ? String(p.kind).trim() : 'ชั่วคราว';
    if (!p.to) throw new Error('กรุณาระบุสถานที่ปลายทางที่จะย้ายไป');
    if (p.from && String(p.from).trim() === String(p.to).trim())
      throw new Error('ต้นทางกับปลายทางต้องไม่ซ้ำกัน');
    if (!p.date) p.date = new Date();                // ไม่กรอกวันที่ ถือว่าวันนี้
    // ผู้ขนย้ายไม่บังคับ เว้นว่างได้

    const items = indexItems_();
    const it = items[String(p.code || '').trim()];
    if (!it) throw new Error('ไม่พบรหัส ' + p.code);
    if (toNum_(p.qty) <= 0) throw new Error('จำนวนที่ย้ายต้องมากกว่าศูนย์');

    const sh = sheet_(CFG.TABS.MOV);
    const id = nextId_(sh, 'MOV');
    const apv = openApproval_('MOV', id, me, p.ordererEmail);

    sh.appendRow([id, kind, it.code, it.name, toNum_(p.qty), p.from, p.to,
                  p.date, p.backDate || '', p.ordererEmail || me.email, p.mover,
                  'ไม่',
                  apv.overall === 'อนุมัติแล้ว' ? 'อนุมัติแล้ว' : 'รออนุมัติ',
                  apv.id, p.note || '']);

    if (apv.overall === 'อนุมัติแล้ว') applyTransfer_(id, me.email);

    SpreadsheetApp.flush();
    return { ok: true, id: id, apvId: apv.id, status: apv.overall };
  } finally { lock.releaseLock(); }
}

/** ย้ายถาวรเขียนสถานที่ใหม่ลงทะเบียน ย้ายชั่วคราวไม่เขียน ยอดรวมไม่เปลี่ยนทั้งสองแบบ */
function applyTransfer_(movId, who) {
  const sh = sheet_(CFG.TABS.MOV);
  const row = findRow_(sh, 1, movId);
  if (!row) return;
  const r = sh.getRange(row, 1, 1, HEAD.MOV.length).getValues()[0];
  if (String(r[1]).trim() !== 'ถาวร') return;

  const reg = sheet_(CFG.TABS.REGISTER);
  const rrow = findRow_(reg, CFG.REG.code, String(r[2]).trim());
  if (!rrow) return;
  reg.getRange(rrow, CFG.REG.location).setValue(r[6]);
  sh.getRange(row, 12).setValue('ใช่');
  ledger_(r[2], r[3], 'ปรับยอด', 0, 0, 'MOV', movId, who,
          'ย้ายถาวร ' + r[5] + ' ไป ' + r[6] + ' ยอดรวมไม่เปลี่ยน');
}


// ═══════════════════════════════════════════════════════════════
//  สายอนุมัติ
// ═══════════════════════════════════════════════════════════════
/** เปิดใบอนุมัติใหม่ ถ้าผู้สั่งการมีสิทธิ์ขาดจะอนุมัติทันที */
function openApproval_(type, txnId, actor, ordererEmail) {
  const sh = sheet_(CFG.TABS.APV);
  const id = nextId_(sh, 'APV');
  const now = new Date();

  // สายอนุมัติปิดอยู่ บันทึกว่าใครเป็นคนทำรายการ แล้วผ่านทันที
  if (CFG.APPROVAL === false) {
    const r0 = new Array(HEAD.APV.length).fill('');
    r0[A.id - 1] = id; r0[A.type - 1] = type; r0[A.txn - 1] = txnId;
    r0[A.byp - 1] = 'ไม่ใช้สายอนุมัติ';
    r0[A.bypWho - 1] = actor ? actor.email : '';
    r0[A.bypRole - 1] = actor ? actor.position : '';
    r0[A.bypAt - 1] = now;
    r0[A.notified - 1] = 'ไม่';
    r0[A.overall - 1] = 'อนุมัติแล้ว'; r0[A.locked - 1] = 'ใช่';
    sh.appendRow(r0);
    return { id: id, overall: 'อนุมัติแล้ว', bypass: true, noChain: true };
  }

  const orderer = ordererEmail ? lookupUser_(ordererEmail) : null;
  const fast = (actor && actor.absolute) ? actor : (orderer && orderer.absolute ? orderer : null);

  if (fast) {
    const row = new Array(HEAD.APV.length).fill('');
    row[A.id - 1] = id; row[A.type - 1] = type; row[A.txn - 1] = txnId;
    row[A.byp - 1] = 'ใช่'; row[A.bypWho - 1] = fast.email;
    row[A.bypRole - 1] = fast.position; row[A.bypAt - 1] = now;
    row[A.notified - 1] = 'ไม่'; row[A.overall - 1] = 'อนุมัติแล้ว'; row[A.locked - 1] = 'ใช่';
    sh.appendRow(row);
    notifySecGen_(id, type, txnId, fast);
    return { id: id, overall: 'อนุมัติแล้ว', bypass: true };
  }

  const row = new Array(HEAD.APV.length).fill('');
  row[A.id - 1] = id; row[A.type - 1] = type; row[A.txn - 1] = txnId;
  row[A.s1res - 1] = 'รอ'; row[A.s2res - 1] = 'รอ'; row[A.s3res - 1] = 'รอ';
  row[A.byp - 1] = 'ไม่'; row[A.overall - 1] = 'รออนุมัติ'; row[A.locked - 1] = 'ไม่';
  sh.appendRow(row);
  return { id: id, overall: 'รออนุมัติ', bypass: false };
}

/**
 * อนุมัติหนึ่งขั้น
 * ผู้บริหารลัดคิวได้ ตัดสินได้ทุกเมื่อ และคำตัดสินเป็นที่สุด
 */
function approve(apvId, decision, comment, tok) {
  const lock = lock_();
  try {
    const me = denyAudit_(staffOnly_(tok));
    const sh = sheet_(CFG.TABS.APV);
    const row = findRow_(sh, A.id, String(apvId).trim());
    if (!row) throw new Error('ไม่พบใบอนุมัติ ' + apvId);

    const r = sh.getRange(row, 1, 1, HEAD.APV.length).getValues()[0];
    const dec = String(decision || '').trim();
    if (['อนุมัติ','ไม่อนุมัติ'].indexOf(dec) < 0) throw new Error('ผลการพิจารณาไม่ถูกต้อง');
    if (dec === 'ไม่อนุมัติ' && !String(comment || '').trim())
      throw new Error('การไม่อนุมัติต้องระบุเหตุผล');

    const now = new Date();

    // ── สิทธิ์ขาดของผู้บริหาร ──
    if (me.role === 'SECGEN') {
      sh.getRange(row, A.s3who).setValue(me.email);
      sh.getRange(row, A.s3res).setValue(dec);
      sh.getRange(row, A.s3at).setValue(now);
      sh.getRange(row, A.s3note).setValue(comment || '');
      const skipped = String(r[A.s1res - 1]).trim() === 'รอ' || String(r[A.s2res - 1]).trim() === 'รอ';
      const overall = dec === 'อนุมัติ' ? 'อนุมัติแล้ว' : 'ไม่อนุมัติ';
      sh.getRange(row, A.overall).setValue(overall);
      sh.getRange(row, A.locked).setValue('ใช่');
      if (skipped) sh.getRange(row, A.s3note)
        .setValue('[ลัดคิว ขั้น 1 หรือ 2 ยังไม่เสร็จ] ' + (comment || ''));
      finalize_(r[A.type - 1], r[A.txn - 1], overall, me.email);
      SpreadsheetApp.flush();
      return { ok: true, overall: overall, final: true, skipped: skipped };
    }

    // ── เส้นทางปกติ ──
    if (String(r[A.locked - 1]).trim() === 'ใช่')
      throw new Error('ผู้บริหารตัดสินแล้ว แก้ไม่ได้');
    if (String(r[A.byp - 1]).trim() === 'ใช่')
      throw new Error('เอกสารนี้อนุมัติด้วยสิทธิ์พิเศษแล้ว');

    let step = null, cols = null;
    if (String(r[A.s1res - 1]).trim() === 'รอ')      { step = 'ADMIN';   cols = [A.s1who, A.s1res, A.s1at, A.s1note]; }
    else if (String(r[A.s2res - 1]).trim() === 'รอ') { step = 'MANAGER'; cols = [A.s2who, A.s2res, A.s2at, A.s2note]; }
    else throw new Error('รอผู้บริหารตัดสิน');

    if (me.role !== step) throw new Error('ยังไม่ถึงคิวของบทบาทนี้ ขณะนี้รอ ' + step);

    sh.getRange(row, cols[0]).setValue(me.email);
    sh.getRange(row, cols[1]).setValue(dec);
    sh.getRange(row, cols[2]).setValue(now);
    sh.getRange(row, cols[3]).setValue(comment || '');

    if (dec === 'ไม่อนุมัติ') {
      sh.getRange(row, A.overall).setValue('ไม่อนุมัติ');
      finalize_(r[A.type - 1], r[A.txn - 1], 'ไม่อนุมัติ', me.email);
      SpreadsheetApp.flush();
      return { ok: true, overall: 'ไม่อนุมัติ', final: true };
    }

    SpreadsheetApp.flush();
    return { ok: true, overall: 'รออนุมัติ', final: false, next: step === 'ADMIN' ? 'MANAGER' : 'SECGEN' };
  } finally { lock.releaseLock(); }
}

/** กลับคำตัดสินที่ปิดไปแล้ว เฉพาะผู้บริหาร ต้องมีเหตุผลเสมอ */
function secGenOverride(apvId, decision, reason, tok) {
  const lock = lock_();
  try {
    const me = denyAudit_(staffOnly_(tok));
    if (me.role !== 'SECGEN') throw new Error('เฉพาะผู้บริหารเท่านั้น');
    if (!String(reason || '').trim()) throw new Error('การกลับคำตัดสินต้องระบุเหตุผล');

    const sh = sheet_(CFG.TABS.APV);
    const row = findRow_(sh, A.id, String(apvId).trim());
    if (!row) throw new Error('ไม่พบใบอนุมัติ ' + apvId);
    const r = sh.getRange(row, 1, 1, HEAD.APV.length).getValues()[0];

    const was = String(r[A.overall - 1]).trim();
    const dec = String(decision).trim();
    const overall = dec === 'อนุมัติ' ? 'อนุมัติแล้ว' : 'ไม่อนุมัติ';
    const type = r[A.type - 1], txn = r[A.txn - 1];

    // ถ้าของออกจากคลังไปแล้วแล้วกลับเป็นไม่อนุมัติ ต้องลงบรรทัดกลับรายการ
    if (was === 'อนุมัติแล้ว' && overall === 'ไม่อนุมัติ') reverseLedger_(type, txn, me.email, reason);

    sh.getRange(row, A.s3who).setValue(me.email);
    sh.getRange(row, A.s3res).setValue(dec);
    sh.getRange(row, A.s3at).setValue(new Date());
    sh.getRange(row, A.s3note).setValue('[กลับคำตัดสิน ' + was + ' → ' + overall + '] ' + reason);
    sh.getRange(row, A.overall).setValue(overall);
    sh.getRange(row, A.locked).setValue('ใช่');
    setTxnStatus_(type, txn, overall);

    SpreadsheetApp.flush();
    return { ok: true, from: was, to: overall };
  } finally { lock.releaseLock(); }
}

/** เมื่อผลสุดท้ายออก ให้ตัดสต็อกหรือย้ายของจริง */
function finalize_(type, txnId, overall, who) {
  setTxnStatus_(type, txnId, overall);
  if (type === 'REQ' && overall === 'ไม่อนุมัติ') radioReleaseDoc_(txnId);
  if (overall !== 'อนุมัติแล้ว') return;
  if (type === 'DIS') dispatchDisbursement_(txnId, who);
  if (type === 'MOV') applyTransfer_(txnId, who);
  // REQ ตัดสต็อกตอนจ่ายของออกจริง ไม่ใช่ตอนอนุมัติ เพราะของอาจยังไม่ได้ไปรับ
}

function setTxnStatus_(type, txnId, status) {
  const map = { REQ: [CFG.TABS.REQ_H, 13], DIS: [CFG.TABS.DIS_H, 9], MOV: [CFG.TABS.MOV, 13] };
  const m = map[type];
  if (!m) return;
  const sh = sheet_(m[0]);
  const row = findRow_(sh, 1, String(txnId).trim());
  if (row) sh.getRange(row, m[1]).setValue(status);
}

function reverseLedger_(type, txnId, who, reason) {
  if (type === 'REQ') radioReleaseDoc_(txnId);
  const sh = sheet_(CFG.TABS.LEDGER);
  const last = sh.getLastRow();
  if (last < 2) return;
  sh.getRange(2, 1, last - 1, HEAD.LEDGER.length).getValues()
    .filter(r => String(r[8]).trim() === String(txnId).trim() && String(r[7]).trim() === type)
    .forEach(r => ledger_(r[2], r[3], 'กลับรายการ', toNum_(r[6]), toNum_(r[5]),
                          type, txnId, who, 'กลับรายการ: ' + reason));
}

/** จ่ายของออกจากคลังจริงหลังอนุมัติ สำหรับเอกสารเบิก */
function dispatchRequisition(reqId, tok) {
  const lock = lock_();
  try {
    const me = denyAudit_(staffOnly_(tok));
    const R = reqRead_(reqId);
    if (R.status !== FLOW_.ST.OK) throw new Error('เอกสารยังไม่อนุมัติ สถานะปัจจุบัน ' + R.status);
    const hash = docHash_(R);
    if (reviewOn_()) {                                     // จ่ายได้เมื่อลงนามครบ
      const sg = signState_(R, hash);
      if (sg.changed && !sg.upload) throw new Error('เอกสาร ' + R.id + ' ถูกแก้หลังลงนาม ต้องลงนามใหม่');
      if (!sg.ready) throw new Error('เอกสาร ' + R.id + ' ยังลงนามไม่ครบ: ' +
        (sg.eApv ? '' : 'ผู้อนุมัติ ') + (sg.eReq ? '' : 'ผู้ขอ ') + '(หรือแนบใบที่ลงนามแล้ว)');
    }
    const lines = reqLines_(R.id);
    const bal = balanceMap_(), items = indexItems_();
    lines.forEach(l => {                                   // ตัดยอดเกินของจริงไม่ได้
      const it = items[l.code];
      const have = bal[l.code] === undefined ? (it ? it.qtyOld : 0) : bal[l.code];
      if (l.qty > have) throw new Error('รหัส ' + l.code + ' คงเหลือ ' + have + ' จ่าย ' + l.qty + ' ไม่ได้');
    });
    const give = R.kind === FLOW_.GIVE;
    lines.forEach(l => ledger_(l.code, l.name, give ? 'จ่ายออก' : 'เบิกออก', 0, l.qty, 'REQ', R.id, me.email,
                               (give ? 'จ่ายออกตาม ' : 'เบิกตาม ') + R.id));
    const to = give ? FLOW_.ST.GIVEN : FLOW_.ST.OUT;
    setStatus_(R, to);
    docLog_(R.id, R.status, to, me, give ? 'จ่ายออก (ไม่ต้องคืน)' : 'จ่ายของออก', hash);
    SpreadsheetApp.flush();
    return { ok: true, id: R.id, status: to };
  } finally { lock.releaseLock(); }
}


// ═══════════════════════════════════════════════════════════════
//  รายการรออนุมัติ สำหรับหน้าอนุมัติ
// ═══════════════════════════════════════════════════════════════
/**
 * เอกสารที่รออนุมัติ พร้อมรายละเอียดครบสำหรับหน้า Approve.html
 * คืนทุกฉบับที่ยังรออนุมัติ ไม่กรองตามขั้นของผู้ใช้ เพราะหน้าเว็บต้องเห็นทั้งคิว
 * แต่ปุ่มตัดสินจะขึ้นเฉพาะฉบับที่ถึงขั้นของผู้ใช้ หรือเมื่อผู้ใช้มีสิทธิ์ขาด
 */
function listPending(tok) {
  staffOnly_(tok);
  const sh = sheet_(CFG.TABS.APV);
  const last = sh.getLastRow();
  if (last < 2) return [];

  const rows = sh.getRange(2, 1, last - 1, HEAD.APV.length).getValues();
  const bal = balanceMap_();
  const KIND = { REQ: 'เบิก', DIS: 'จ่ายขาด', MOV: 'ย้าย' };
  const out = [];

  rows.forEach(r => {
    if (String(r[A.overall - 1]).trim() !== 'รออนุมัติ') return;

    let step = 3;
    if (String(r[A.s1res - 1]).trim() === 'รอ') step = 1;
    else if (String(r[A.s2res - 1]).trim() === 'รอ') step = 2;

    const type = String(r[A.type - 1]).trim();
    const d = txnDetail_(type, r[A.txn - 1], bal);

    out.push({
      id:          r[A.id - 1],
      txnId:       r[A.txn - 1],
      type:        type,
      kind:        KIND[type] || type,
      currentStep: step,
      ageDays:     d.created ? Math.floor((Date.now() - d.created.getTime()) / 864e5) : 0,
      requester:   d.requester,
      dept:        d.dept,
      subType:     d.subType,
      org:         d.org,
      event:       d.event,
      purpose:     d.purpose,
      dueDate:     d.dueDate,
      fileUrl:     d.fileUrl,
      lines:       d.lines,
      s1who: r[A.s1who - 1], s1res: String(r[A.s1res - 1]).trim(),
      s2who: r[A.s2who - 1], s2res: String(r[A.s2res - 1]).trim(),
      s3who: r[A.s3who - 1], s3res: String(r[A.s3res - 1]).trim()
    });
  });

  // เก่าสุดขึ้นก่อน
  return out.sort((a, b) => b.ageDays - a.ageDays);
}

/** อ่านหัวเรื่องและรายการของเอกสารหนึ่งฉบับ ให้รูปแบบแบนพร้อมใช้บนหน้าเว็บ */
function txnDetail_(type, txnId, bal) {
  const blank = { lines: [], created: null };
  const map = { REQ: CFG.TABS.REQ_H, DIS: CFG.TABS.DIS_H, MOV: CFG.TABS.MOV };
  const sh = ss_().getSheetByName(map[type]);
  if (!sh) return blank;
  const row = findRow_(sh, 1, String(txnId).trim());
  if (!row) return blank;
  const r = sh.getRange(row, 1, 1, sh.getLastColumn()).getValues()[0];
  const b = bal || balanceMap_();

  if (type === 'REQ') {
    return {
      created: asDate_(r[1]), requester: cleanText_(r[3]), dept: cleanText_(r[4]),
      subType: cleanText_(r[5]), org: cleanText_(r[6]), event: cleanText_(r[7]),
      purpose: cleanText_(r[8]), dueDate: fmtD_(r[10]), fileUrl: cleanText_(r[11]),
      lines: txnLines_(CFG.TABS.REQ_L, txnId, b)
    };
  }
  if (type === 'DIS') {
    return {
      created: asDate_(r[1]), requester: cleanText_(r[3]), dept: cleanText_(r[4]),
      subType: 'จ่ายขาด', org: '', event: cleanText_(r[5]),
      purpose: cleanText_(r[6]), dueDate: '', fileUrl: cleanText_(r[7]),
      lines: txnLines_(CFG.TABS.DIS_L, txnId, b)
    };
  }
  // MOV — หนึ่งเอกสารหนึ่งรายการ
  const code = String(r[2] || '').trim();
  return {
    created: asDate_(r[7]), requester: cleanText_(r[10]), dept: '',
    subType: 'ย้าย' + cleanText_(r[1]), org: '',
    event: cleanText_(r[5]) + ' → ' + cleanText_(r[6]),
    purpose: 'ย้ายที่เก็บ จาก ' + cleanText_(r[5]) + ' ไป ' + cleanText_(r[6]),
    dueDate: fmtD_(r[8]), fileUrl: '',
    lines: [{ code: code, name: cleanText_(r[3]), qty: toNum_(r[4]),
              balance: b[code] === undefined ? 0 : b[code] }]
  };
}

function txnLines_(tabName, txnId, bal) {
  const sh = ss_().getSheetByName(tabName);
  if (!sh) return [];
  const last = sh.getLastRow();
  if (last < 2) return [];
  const t = String(txnId).trim();
  return sh.getRange(2, 1, last - 1, 5).getValues()
    .filter(r => String(r[1]).trim() === t)
    .map(r => {
      const code = String(r[2] || '').trim();
      return { code: code, name: cleanText_(r[3]), qty: toNum_(r[4]),
               balance: bal[code] === undefined ? 0 : bal[code] };
    });
}

function asDate_(v) {
  if (v instanceof Date) return v;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d;
}

function notifySecGen_(apvId, type, txnId, by) {
  try {
    const sh = sheet_(CFG.TABS.USERS);
    const last = sh.getLastRow();
    if (last < 2) return;
    const sec = sh.getRange(2, 1, last - 1, HEAD.USERS.length).getValues()
      .find(r => String(r[3]).trim().toUpperCase() === 'SECGEN' && String(r[6]).trim() === 'ใช่');
    if (!sec || !String(sec[0]).trim()) return;

    MailApp.sendEmail({
      to: String(sec[0]).trim(),
      subject: '[' + CFG.APP + '] ใช้สิทธิ์ข้ามขั้นอนุมัติเอกสาร ' + txnId,
      body: 'เรียน ผู้บริหาร\n\n' +
            'มีการใช้สิทธิ์พิเศษอนุมัติเอกสารโดยข้ามสายอนุมัติสามขั้น\n\n' +
            'เลขที่ใบอนุมัติ : ' + apvId + '\n' +
            'เอกสาร         : ' + type + ' ' + txnId + '\n' +
            'ผู้ใช้สิทธิ์      : ' + by.name + ' (' + by.position + ')\n' +
            'อีเมล          : ' + by.email + '\n' +
            'เวลา           : ' + fmtDT_(new Date()) + '\n\n' +
            'แจ้งเพื่อทราบจากระบบคลังพัสดุ ' + CFG.ORG
    });
    const apv = sheet_(CFG.TABS.APV);
    const row = findRow_(apv, A.id, apvId);
    if (row) apv.getRange(row, A.notified).setValue('ใช่');
  } catch (e) {
    Logger.log('แจ้งผู้บริหารไม่สำเร็จ: %s', e.message);
  }
}


// ═══════════════════════════════════════════════════════════════
//  ตัวช่วย
// ═══════════════════════════════════════════════════════════════
let SS_ = null;                 // เปิดไฟล์ชีตครั้งเดียวต่อคำสั่ง (เดิมเปิดใหม่ทุกครั้งที่อ่านแท็บ ไฟล์จริงใหญ่ 7 MB)
const SH_ = {};
function ss_() {
  if (!CFG.SHEET_ID) throw new Error('ยังไม่ได้ตั้งค่า SHEET_ID');
  return SS_ || (SS_ = SpreadsheetApp.openById(CFG.SHEET_ID));
}

function sheet_(name) {
  if (SH_[name]) return SH_[name];
  const sh = ss_().getSheetByName(name);
  if (sh) SH_[name] = sh;
  if (!sh) throw new Error('ไม่พบแท็บ "' + name + '" กรุณารัน SETUP_1_start ก่อน');
  return sh;
}

function lock_() {
  regGuard_();                                                       // คอลัมน์ทะเบียนเลื่อน = หยุดบันทึก
  const l = LockService.getScriptLock();
  if (!l.tryLock(20000)) throw new Error('ระบบกำลังบันทึกรายการอื่น ลองอีกครั้งใน 2–3 วินาที');
  return l;
}

function findRow_(sh, col, value) {
  const last = sh.getLastRow();
  if (last < 2) return null;
  const hit = sh.getRange(2, col, last - 1, 1)
    .createTextFinder(String(value)).matchEntireCell(true).findNext();
  return hit ? hit.getRow() : null;
}

function nextId_(sh, prefix) {
  const n = Math.max(0, sh.getLastRow() - 1) + 1;
  const yr = Number(Utilities.formatDate(new Date(), CFG.TZ, 'yyyy')) + 543;
  return prefix + '-' + yr + '-' + ('0000' + n).slice(-4);
}

function indexItems_() {
  const reg = sheet_(CFG.TABS.REGISTER);
  const last = reg.getLastRow();
  const out = {};
  if (last < 2) return out;
  reg.getRange(2, 1, last - 1, CFG.REG.note).getValues().forEach(r => {
    const code = String(r[CFG.REG.code - 1] || '').trim();
    if (!code) return;
    out[code] = {
      code: code,
      name: cleanText_(r[CFG.REG.name - 1]),
      qtyOld: toNum_(r[CFG.REG.qtyOld - 1]),
      condition: cleanText_(r[CFG.REG.condition - 1]),
      location: cleanText_(r[CFG.REG.location - 1])
    };
  });
  return out;
}

function safeEmail_() {
  try { return (Session.getActiveUser().getEmail() || '').toLowerCase(); }
  catch (e) { return ''; }
}

function toNum_(v) {
  if (v === '' || v === null || v === undefined) return 0;
  const n = Number(String(v).replace(/,/g, '').trim());
  return isFinite(n) ? n : 0;
}

function cleanText_(v) {
  return v === null || v === undefined ? '' : String(v).replace(/\s+/g, ' ').trim();
}

function fmtD_(d)  { return d instanceof Date ? Utilities.formatDate(d, CFG.TZ, 'dd/MM/yyyy') : String(d || ''); }
function fmtDT_(d) { return Utilities.formatDate(d, CFG.TZ, 'dd/MM/yyyy HH:mm'); }


// ═══════════════════════════════════════════════════════════════
//  ทดสอบ — รันจาก Editor
// ═══════════════════════════════════════════════════════════════
function TEST_phase2() {
  Logger.log('ไฟล์: %s', ss_().getName());
  Object.keys(CFG.TABS).forEach(k => {
    const sh = ss_().getSheetByName(CFG.TABS[k]);
    Logger.log('  %-22s %s', CFG.TABS[k], sh ? ('มี ' + (sh.getLastRow() - 1) + ' แถว') : '✕ ยังไม่มี');
  });
  const me = whoAmI();
  Logger.log('ผู้ใช้ปัจจุบัน: %s', me ? (me.name + ' / ' + me.role + (me.absolute ? ' / สิทธิ์ขาด' : '')) : 'ไม่อยู่ในทะเบียนสิทธิ์');
  const items = listItems();
  Logger.log('รายการพัสดุ %s รายการ ตัวอย่าง: %s', items.length, JSON.stringify(items[8] || {}));
}






// ═══════════════════════════════════════════════════════════════
//  ตั้งทะเบียนสิทธิ์ตั้งต้น — ผู้ดูแลระบบ 2 คน และผู้ตรวจสอบ
//  ต่อท้ายไฟล์ Code.gs ของเฟส 2 ได้เลย
//
//  หมายเหตุสำคัญเรื่องบทบาท
//    โค้ดอนุมัติเทียบบทบาทแบบตรงตัว 'ADMIN' 'MANAGER' 'SECGEN'
//    ถ้าใส่ 'ADMIN_1' ลงช่องบทบาท ระบบจะไม่รู้จักและอนุมัติไม่ได้
//    จึงให้ทั้งสองคนเป็นบทบาท ADMIN เหมือนกัน แล้วแยกคนที่ 1 คนที่ 2
//    ไว้ในช่องตำแหน่งแทน ผลลัพธ์ที่ได้เหมือนกันทุกอย่าง
// ═══════════════════════════════════════════════════════════════



/** กดรันดูได้ปลอดภัย ไม่เขียนอะไร แสดงทะเบียนสิทธิ์ทั้งหมด */
function CHECK_roles() {
  const sh = sheet_(CFG.TABS.USERS);
  const last = sh.getLastRow();
  if (last < 2) { Logger.log('ทะเบียนสิทธิ์ยังว่าง ให้รัน SETUP_seedUsers ก่อน'); return 0; }
  const rows = sh.getRange(2, 1, last - 1, HEAD.USERS.length).getValues();
  Logger.log('ทะเบียนสิทธิ์ทั้งหมด %s แถว', rows.length);
  Logger.log('%s | %s | %s | %s | %s | %s',
             'อีเมล', 'ชื่อ', 'ตำแหน่ง', 'บทบาท', 'ใช้งาน', 'ตั้งรหัสแล้ว');
  rows.forEach(function (r) {
    Logger.log('%s | %s | %s | %s | %s | %s',
               String(r[0]).trim() || '(ว่าง)', r[1] || '-', r[2] || '-',
               r[3] || '-', r[6] || '-', String(r[7]).trim() ? 'ใช่' : 'ยัง');
  });
  const need = rows.filter(function (r) { return !String(r[0]).trim(); }).length;
  if (need) Logger.log('');
  if (need) Logger.log('ยังมี %s แถวที่รอเติมอีเมล', need);
  return rows.length;
}


// ═══════════════════════════════════════════════════════════════
//  หน้าผู้ดูแลระบบ — เพิ่มรายการ รับของเข้า ปรับยอด ปิดรายการ
//
//  หลักการเดิมที่ยังยึดไว้
//    ไม่มีฟังก์ชันไหนเขียนทับคอลัมน์ F จำนวนตั้งต้น หรือ G ยอดยกมา ของรายการเดิม
//    ทุกการเปลี่ยนจำนวนลงเป็นบรรทัดในบัญชีเคลื่อนไหว คงเหลือยังคำนวณจากบัญชี
//    การปิดรายการไม่ลบแถว แค่เปลี่ยนสถานะ ประวัติยังอยู่ครบ
// ═══════════════════════════════════════════════════════════════

const ADM = {
// คอลัมน์ Y เว้นช่วง S ถึง X ไว้ให้ช่องแตกรายการของเฟส 1 ไม่ชนกัน
STATUS_COL: 25,
STATUS_HEAD: 'สถานะรายการ',
LOG_TAB: 'STATUS_LOG',
LOG_HEAD: ['เวลา', 'รหัสรายการ', 'ชื่อรายการ', 'สถานะเดิม', 'สถานะใหม่',
'ยอดคงเหลือขณะนั้น', 'จัดการยอด', 'เหตุผล', 'ผู้ทำ', 'หมายเหตุ'],

ACTIVE:  'ใช้งาน',
RETIRED: 'เลิกใช้',
PENDING: 'รอจำหน่าย',

STATUSES: ['ใช้งาน', 'เลิกใช้', 'รอจำหน่าย'],

UNITS: ['เครื่อง', 'ชิ้น', 'ตัว', 'ใบ', 'ชุด', 'กล่อง', 'อัน', 'คู่', 'ม้วน', 'แพ็ค'],

SOURCES: ['จัดซื้อ', 'ได้รับบริจาค', 'ได้รับจากผู้สนับสนุน', 'โอนจากหน่วยงานอื่น'],

ADJUST_REASONS: ['ตรวจนับไม่พบ', 'ชำรุด ใช้การไม่ได้', 'แจกไปแล้วไม่ได้ลงระบบ',
'รับเข้าไม่ได้ลงระบบ', 'นับผิดรอบก่อน', 'จำหน่ายออกจากคลัง'],

RETIRE_REASONS: ['เลิกใช้ จบงานแล้ว', 'ชำรุด ใช้การไม่ได้', 'แจกไปแล้วไม่ได้ลงระบบ',
'ตรวจนับไม่พบ', 'จำหน่ายออกจากคลัง']
};

// ── สิทธิ์ ──────────────────────────────────────────────────────

// เฉพาะผู้ดูแลระบบเท่านั้น ผู้ตรวจสอบและเจ้าหน้าที่ทั่วไปเข้าไม่ได้
function admOnly_(tok) {
const me = denyAudit_(requireUser_(tok));
if (String(me.role).toUpperCase() !== 'ADMIN')
throw new Error('หน้านี้สำหรับผู้ดูแลระบบเท่านั้น บัญชีของคุณเป็น ' + me.role);
return me;
}

// ── คอลัมน์สถานะรายการ ────────────────────────────────────────

//
// เพิ่มคอลัมน์ สถานะรายการ ท้ายทะเบียน ตั้งทุกแถวเป็น ใช้งาน
// ไม่แทรกกลาง ไม่ขยับคอลัมน์เดิมสักช่อง รันซ้ำได้ ของที่ตั้งค่าไว้แล้วไม่ถูกทับ
// รันมือจากหน้า Editor ครั้งเดียว
//
function SETUP_addStatusColumn() {
const sh   = sheet_(CFG.TABS.REGISTER);
const last = sh.getLastRow();
if (sh.getMaxColumns() < ADM.STATUS_COL)
sh.insertColumnsAfter(sh.getMaxColumns(), ADM.STATUS_COL - sh.getMaxColumns());

sh.getRange(1, ADM.STATUS_COL).setValue(ADM.STATUS_HEAD);
if (last < 2) { Logger.log('ทะเบียนยังว่าง'); return 0; }

const n    = last - 1;
const rng  = sh.getRange(2, ADM.STATUS_COL, n, 1);
const cur  = rng.getValues();
const code = sh.getRange(2, CFG.REG.code, n, 1).getValues();

let filled = 0, kept = 0;
for (let i = 0; i < n; i++) {
if (!String(code[i][0]).trim()) { cur[i][0] = ''; continue; }
if (String(cur[i][0]).trim()) { kept++; continue; }
cur[i][0] = ADM.ACTIVE;
filled++;
}
rng.setValues(cur);

Logger.log('เขียนคอลัมน์ %s ที่คอลัมน์ลำดับ %s แล้ว', ADM.STATUS_HEAD, ADM.STATUS_COL);
Logger.log('ตั้งเป็น "%s" ใหม่ %s แถว · ที่ตั้งค่าไว้แล้วคงเดิม %s แถว', ADM.ACTIVE, filled, kept);
Logger.log('คอลัมน์ A ถึง X ไม่ถูกแตะ รวมถึง F จำนวนตั้งต้น และ G ยอดยกมา');
return filled;
}

// map รหัสรายการ -> สถานะ ถ้ายังไม่มีคอลัมน์ ถือว่าใช้งานทุกแถว
function statusMap_() {
const sh   = sheet_(CFG.TABS.REGISTER);
const last = sh.getLastRow();
const m    = {};
if (last < 2) return m;
if (sh.getLastColumn() < ADM.STATUS_COL) return m;

const n    = last - 1;
const code = sh.getRange(2, CFG.REG.code, n, 1).getValues();
const st   = sh.getRange(2, ADM.STATUS_COL, n, 1).getValues();
for (let i = 0; i < n; i++) {
const c = String(code[i][0] || '').trim();
if (c) m[c] = cleanText_(st[i][0]) || ADM.ACTIVE;
}
return m;
}

function statusLog_() {
let sh = ss_().getSheetByName(ADM.LOG_TAB);
if (!sh) {
  sh = ss_().insertSheet(ADM.LOG_TAB);
  sh.appendRow(ADM.LOG_HEAD);
  sh.setFrozenRows(1);
  }
  return sh;
  }

  // ── ข้อมูลตั้งต้นของหน้า ───────────────────────────────────────

  // รหัสรายการถัดไป เช่น ITEM-011 (คำนำหน้าจาก Script Property ITEM_PREFIX)
  function adminNextCode() {
  const sh   = sheet_(CFG.TABS.REGISTER);
  const last = sh.getLastRow();
  let max = 0;
  if (last >= 2) {
  sh.getRange(2, CFG.REG.code, last - 1, 1).getValues().forEach(function (r) {
  const m = String(r[0] || '').trim().match(new RegExp('^' + CFG.PREFIX + '-0*([0-9]+)$', 'i'));
  if (m) max = Math.max(max, Number(m[1]));
  });
  }
  const num = String(max + 1);
  return CFG.PREFIX + '-' + (num.length < 3 ? ('000' + num).slice(-3) : num);
  }

  //
  // ข้อมูลทั้งหมดที่หน้าผู้ดูแลระบบต้องใช้ โหลดรอบเดียว
  // ส่งรายการทุกแถวพร้อมสถานะและคงเหลือปัจจุบัน แล้วให้หน้าเว็บกรองเอง
  //
  function adminBoot(tok) {
  const me  = admOnly_(tok);
  const reg = sheet_(CFG.TABS.REGISTER);
  const last = reg.getLastRow();
  const bal = balanceMap_();
  const st  = statusMap_();

  const items = [];
  const cats = {}, subs = {}, locs = {};
  const enMap = nameEnMap_();
  let active = 0, retired = 0;

  if (last >= 2) {
  const wide = reg.getLastColumn() >= 24;
  const vals = reg.getRange(2, 1, last - 1, wide ? 24 : CFG.REG.note).getValues();

  vals.forEach(function (r) {
  const code = String(r[CFG.REG.code - 1] || '').trim();
  if (!code) return;
  const name = cleanText_(r[CFG.REG.name - 1]);
  const cat  = cleanText_(r[CFG.REG.mainCat - 1]);
  const sub  = cleanText_(r[CFG.REG.subCat - 1]);
  const loc  = cleanText_(r[CFG.REG.location - 1]);
  const s    = st[code] || ADM.ACTIVE;

  if (cat) cats[cat] = 1;
  if (sub) subs[sub] = 1;
  if (loc) locs[loc] = 1;
  if (s === ADM.RETIRED) retired++; else active++;

  items.push({
  code: code,
  name: name,
  cat:  cat,
  sub:  sub,
  loc:  loc,
  size: cleanText_(r[CFG.REG.size - 1]),
  xsize: wide ? cleanText_(r[23]) : '',        // คอลัมน์ X ไซส์ (ใช้จัดกลุ่มเสื้อ)
  en:   enMap[code] || '',
  unit: cleanText_(r[CFG.REG.qtyKind - 1]),
  year: wide ? cleanText_(r[20]) : '',        // คอลัมน์ U ปี จากเฟส 1
  status: s,
  bal: bal[code] === undefined ? toNum_(r[CFG.REG.qtyOld - 1]) : bal[code]
  });
  });
  }

  const keys = function (o) { return Object.keys(o).sort(); };

  return {
  me: { name: me.name, email: me.email, position: me.position, role: me.role },
  nextCode: adminNextCode(),
  items: items,
  counts: { all: items.length, active: active, retired: retired },
  cats: keys(cats),
  subs: keys(subs),
  locs: keys(locs),
  units: ADM.UNITS,
  sources: ADM.SOURCES,
  adjustReasons: ADM.ADJUST_REASONS,
  retireReasons: ADM.RETIRE_REASONS,
  recent: adminRecent_(8)
  };
  }

  // การเคลื่อนไหวล่าสุด n บรรทัด เรียงใหม่ไปเก่า
  function adminRecent_(n) {
  const sh = sheet_(CFG.TABS.LEDGER);
  const last = sh.getLastRow();
  if (last < 2) return [];
  const take = Math.min(n, last - 1);
  const rows = sh.getRange(last - take + 1, 1, take, HEAD.LEDGER.length).getValues();
  return rows.reverse().map(function (r) {
  const qin = toNum_(r[5]), qout = toNum_(r[6]);
  return {
  time: r[1] instanceof Date ? fmtDT_(r[1]) : String(r[1] || ''),
  code: cleanText_(r[2]),
  name: cleanText_(r[3]),
  kind: cleanText_(r[4]),
  qty:  qin > 0 ? '+' + qin : (qout > 0 ? '−' + qout : '0'),
  by:   cleanText_(r[9])
  };
  });
  }

  // ── 1 · เพิ่มรายการใหม่ ────────────────────────────────────────

  //
  // เพิ่มของชนิดใหม่ลงทะเบียน แล้วลงจำนวนตั้งต้นในบัญชีเคลื่อนไหว
  // ไม่เขียนคอลัมน์ F และ G จำนวนตั้งต้นลงบัญชีอย่างเดียว คงเหลือจึงถูกต้อง
  //
  function adminAddItem(p) {
  const me = admOnly_((p || {}).tok);
  const name = cleanText_((p || {}).name);
  if (!name) throw new Error('ต้องระบุชื่อรายการ');
  if (!cleanText_((p || {}).cat)) throw new Error('ต้องระบุหมวดหลัก');

  const lock = lock_();
  try {
  const sh   = sheet_(CFG.TABS.REGISTER);
  const code = adminNextCode();
  const qty  = Math.max(0, toNum_(p.qty));
  const row  = sh.getLastRow() + 1;

  sh.getRange(row, CFG.REG.code).setValue(code);
  sh.getRange(row, CFG.REG.name).setValue(name);
  sh.getRange(row, CFG.REG.subCat).setValue(cleanText_(p.sub));
  sh.getRange(row, CFG.REG.mainCat).setValue(cleanText_(p.cat));
  sh.getRange(row, CFG.REG.location).setValue(cleanText_(p.loc));
  sh.getRange(row, CFG.REG.qtyKind).setValue(cleanText_(p.unit));
  sh.getRange(row, CFG.REG.qtyStart).setValue(qty);                // F จำนวนตั้งต้น (อ้างอิง)
  sh.getRange(row, CFG.REG.qtyOld).setValue(qty);                  // G ยอดยกมา (อ้างอิง) · คงเหลือจริงคิดจาก LEDGER
  if (cleanText_(p.note)) sh.getRange(row, CFG.REG.note).setValue(cleanText_(p.note));
  sh.getRange(row, ADM.STATUS_COL).setValue(ADM.ACTIVE);

  if (qty > 0)
  ledger_(code, name, 'รับเข้า', qty, 0, 'ADMIN', 'เพิ่มรายการใหม่', me.email,
  'จำนวนตั้งต้นตอนเพิ่มรายการ');

  logStatus_(code, name, '', ADM.ACTIVE, qty, '', 'เพิ่มรายการใหม่', me.email, '');

  return { ok: true, code: code, name: name, bal: qty, nextCode: adminNextCode() };
  } finally {
  lock.releaseLock();
  }
  }

  // ── 2 · รับของเข้า ─────────────────────────────────────────────

  // ของชนิดเดิมที่ซื้อเพิ่มหรือได้รับบริจาค ลงรับเข้าอย่างเดียว ไม่แตะทะเบียน
  function adminReceive(p) {
  const me = admOnly_((p || {}).tok);
  const code = cleanText_((p || {}).code);
  const qty  = toNum_((p || {}).qty);
  if (!code) throw new Error('ต้องเลือกรายการ');
  if (qty <= 0) throw new Error('จำนวนที่รับเข้าต้องมากกว่า 0');

  const lock = lock_();
  try {
  const it = indexItems_()[code];
  if (!it) throw new Error('ไม่พบรหัส ' + code + ' ในทะเบียน');

  const note = [cleanText_(p.source), cleanText_(p.doc), cleanText_(p.note)]
  .filter(function (s) { return s; }).join(' · ');

  ledger_(code, it.name, 'รับเข้า', qty, 0, 'ADMIN', 'รับของเข้า', me.email, note);

  return { ok: true, code: code, name: it.name, bal: getBalance(code) };
  } finally {
  lock.releaseLock();
  }
  }

  // ── 3 · ปรับยอดให้เป็นปัจจุบัน ─────────────────────────────────

  //
  // กรอกยอดที่นับได้จริง ระบบลงเฉพาะส่วนต่างพร้อมเหตุผล
  // ยอดตรงกันอยู่แล้วจะไม่ลงบรรทัดเปล่า
  //
  function adminAdjust(p) {
  const me   = admOnly_((p || {}).tok);
  const code = cleanText_((p || {}).code);
  if (!code) throw new Error('ต้องเลือกรายการ');
  const reason = cleanText_((p || {}).reason);
  if (!reason) throw new Error('ต้องเลือกเหตุผล');

  const lock = lock_();
  try {
  const it = indexItems_()[code];
  if (!it) throw new Error('ไม่พบรหัส ' + code + ' ในทะเบียน');

  const sys  = getBalance(code);
  const real = toNum_((p || {}).real);
  if (real < 0) throw new Error('ยอดที่นับได้จริงติดลบไม่ได้');

  const d = real - sys;
  if (d === 0) return { ok: true, changed: false, bal: sys, msg: 'ยอดตรงกันอยู่แล้ว ไม่ได้บันทึกอะไร' };

  const note = [reason, cleanText_(p.note)].filter(function (s) { return s; }).join(' · ');
  ledger_(code, it.name, 'ปรับยอด', d > 0 ? d : 0, d < 0 ? -d : 0,
  'ADMIN', 'ปรับยอด', me.email, note);

  return { ok: true, changed: true, diff: d, bal: getBalance(code), name: it.name };
  } finally {
  lock.releaseLock();
  }
  }

  // ── 4 · ปิดหรือเปิดรายการ ──────────────────────────────────────

  //
  // ปิดรายการทีละหลายอัน
  // p.list = [{ code: 'ITEM-004', mode: 'keep' | 'zero' }, ...]
  // keep = เก็บยอดไว้ ของยังอยู่ในคลังแต่ไม่แจกแล้ว ยอดไม่เปลี่ยน
  // zero = ตัดเหลือ 0 ของแจกหมดแล้ว ลงตัดจำหน่ายเท่ากับยอดคงเหลือ
  // ไม่ลบแถว ไม่แตะคอลัมน์ F และ G
  //
  function adminRetire(p) {
  const me   = admOnly_((p || {}).tok);
  const list = ((p || {}).list) || [];
  if (!list.length) throw new Error('ยังไม่ได้เลือกรายการ');
  const reason = cleanText_((p || {}).reason);
  if (!reason) throw new Error('ต้องเลือกเหตุผล');

  const status = cleanText_((p || {}).status) || ADM.RETIRED;
  if (ADM.STATUSES.indexOf(status) < 0) throw new Error('สถานะไม่ถูกต้อง: ' + status);

  const lock = lock_();
  try {
  const sh  = sheet_(CFG.TABS.REGISTER);
  const idx = indexItems_();
  const st  = statusMap_();
  const out = { ok: true, closed: 0, zeroed: 0, pieces: 0, skipped: [], unchanged: [] };

  list.forEach(function (x) {
  const code = cleanText_(x && x.code);
  if (!code) return;
  const it = idx[code];
  const row = findRow_(sh, CFG.REG.code, code);
  if (!it || !row) { out.skipped.push(code); return; }

  const before = st[code] || ADM.ACTIVE;
  const bal    = getBalance(code);
  const mode   = (x.mode === 'zero') ? 'zero' : 'keep';

  // กดซ้ำ/ดับเบิลคลิก: อยู่ในสถานะนี้แล้ว และไม่มียอดให้ตัด → ข้าม ไม่ลง STATUS_LOG หรือ LEDGER ซ้ำ
  if (before === status && (mode !== 'zero' || bal <= 0)) { out.unchanged.push(code); return; }

  if (mode === 'zero' && bal > 0) {
  ledger_(code, it.name, 'ตัดจำหน่าย', 0, bal, 'ADMIN', 'ปิดรายการ', me.email, reason);
  out.zeroed++;
  out.pieces += bal;
  }

  sh.getRange(row, ADM.STATUS_COL).setValue(status);
  logStatus_(code, it.name, before, status, bal,
  mode === 'zero' ? 'ตัดเหลือ 0' : 'เก็บยอดไว้',
  reason, me.email, cleanText_(p.note));
  out.closed++;
  });

  return out;
  } finally {
  lock.releaseLock();
  }
  }

  // แก้รายละเอียดรายการเดิม: ชื่อ ชื่ออังกฤษ หมวดหลัก หมวดย่อย ไซส์/รายละเอียด ไซส์เสื้อ ที่เก็บ
  // ไม่แตะยอด (คอลัมน์ F G และบัญชีเคลื่อนไหว) ไม่แตะรหัส · ทุกการแก้บันทึกค่าเดิมกับค่าใหม่ใน STATUS_LOG
  const EDIT_FIELDS_ = [
    { k: 'name',  col: CFG.REG.name,     label: 'ชื่อ',            max: 200, req: true },
    { k: 'en',    col: 27,               label: 'ชื่อภาษาอังกฤษ',  max: 200 },
    { k: 'cat',   col: CFG.REG.mainCat,  label: 'หมวดหลัก',        max: 80,  req: true },
    { k: 'sub',   col: CFG.REG.subCat,   label: 'หมวดย่อย',        max: 80 },
    { k: 'size',  col: CFG.REG.size,     label: 'ไซส์ / รายละเอียด', max: 120 },
    { k: 'xsize', col: 24,               label: 'ขนาด (ไซส์)',         max: 20 },
    { k: 'loc',   col: CFG.REG.location, label: 'ที่เก็บ',          max: 120 }
  ];

  function adminEditItem(p) {
  const me   = admOnly_((p || {}).tok);
  const code = cleanText_((p || {}).code).toUpperCase();
  if (!codeOk_(code)) throw new Error('รหัสไม่ถูกต้อง');
  const val = {};
  EDIT_FIELDS_.forEach(function (f) {
    const v = cleanText_((p || {})[f.k]);
    if (f.req && !v) throw new Error('กรุณากรอก' + f.label);
    if (v.length > f.max) throw new Error(f.label + 'ยาวเกิน ' + f.max + ' ตัวอักษร');
    val[f.k] = v;
  });

  const lock = lock_();
  try {
  const sh  = sheet_(CFG.TABS.REGISTER);
  const row = findRow_(sh, CFG.REG.code, code);
  if (!row) throw new Error('ไม่พบรหัส ' + code + ' ในทะเบียน');
  if (sh.getMaxColumns() < 27) sh.insertColumnsAfter(sh.getMaxColumns(), 27 - sh.getMaxColumns());
  if (!String(sh.getRange(1, 27).getValue()).trim()) sh.getRange(1, 27).setValue(NAME_EN_.HEAD);
  const cur = sh.getRange(row, 1, 1, 27).getValues()[0];

  // หมวดหลักต้องเป็นหมวดที่มีอยู่แล้วในทะเบียน กันพิมพ์ผิดแล้วเกิดหมวดใหม่
  const last = sh.getLastRow();
  const cats = {};
  sh.getRange(2, CFG.REG.mainCat, last - 1, 1).getValues().forEach(function (r) { const c = cleanText_(r[0]); if (c) cats[c] = 1; });
  if (!cats[val.cat]) throw new Error('ไม่มีหมวดหลัก "' + val.cat + '" ในทะเบียน กรุณาเลือกจากรายการ');

  const changes = [];
  EDIT_FIELDS_.forEach(function (f) {
    const before = cleanText_(cur[f.col - 1]);
    if (before === val[f.k]) return;
    sh.getRange(row, f.col).setValue(safeCell_(val[f.k]));
    changes.push(f.label + ': ' + (before || '(ว่าง)') + ' → ' + (val[f.k] || '(ว่าง)'));
  });
  if (!changes.length) return { ok: true, code: code, changed: 0 };

  const st = statusMap_()[code] || ADM.ACTIVE;
  logStatus_(code, val.name, st, st, getBalance(code), 'แก้ไขรายละเอียด',
             changes.join(' · ').slice(0, 1800), me.email, cleanText_(p.note).slice(0, 300));
  CacheService.getScriptCache().remove(NAME_EN_.KEY);
  SpreadsheetApp.flush();
  return { ok: true, code: code, changed: changes.length, changes: changes,
           item: { code: code, name: val.name, en: val.en, cat: val.cat, sub: val.sub, size: val.size, xsize: val.xsize, loc: val.loc } };
  } finally {
  lock.releaseLock();
  }
  }

  // เปิดรายการกลับมาใช้งาน ไม่ยุ่งกับยอด
  function adminReopen(p) {
  const me   = admOnly_((p || {}).tok);
  const list = ((p || {}).list) || [];
  if (!list.length) throw new Error('ยังไม่ได้เลือกรายการ');

  const lock = lock_();
  try {
  const sh  = sheet_(CFG.TABS.REGISTER);
  const idx = indexItems_();
  const st  = statusMap_();
  let n = 0;

  list.forEach(function (x) {
  const code = cleanText_(x && (x.code || x));
  if (!code) return;
  const it = idx[code];
  const row = findRow_(sh, CFG.REG.code, code);
  if (!it || !row) return;
  const before = st[code] || ADM.ACTIVE;
  sh.getRange(row, ADM.STATUS_COL).setValue(ADM.ACTIVE);
  logStatus_(code, it.name, before, ADM.ACTIVE, getBalance(code), '',
  cleanText_(p.reason) || 'เปิดใช้งานอีกครั้ง', me.email, '');
  n++;
  });

  return { ok: true, reopened: n };
  } finally {
  lock.releaseLock();
  }
  }

  function logStatus_(code, name, before, after, bal, how, reason, who, note) {
  statusLog_().appendRow([new Date(), code, name, before, after, bal, how, reason, who, note || '']);
  }

  // ── ตรวจสอบ กดรันดูได้ปลอดภัย ไม่เขียนอะไร ───────────────────

  function CHECK_status() {
  const sh = sheet_(CFG.TABS.REGISTER);
  if (sh.getLastColumn() < ADM.STATUS_COL) {
  Logger.log('ยังไม่มีคอลัมน์ %s ให้รัน SETUP_addStatusColumn ก่อน', ADM.STATUS_HEAD);
  return 0;
  }
  Logger.log('หัวคอลัมน์ลำดับ %s คือ "%s"', ADM.STATUS_COL, sh.getRange(1, ADM.STATUS_COL).getValue());

  const m = statusMap_();
  const tally = {};
  Object.keys(m).forEach(function (c) { tally[m[c]] = (tally[m[c]] || 0) + 1; });
  Object.keys(tally).sort().forEach(function (s) { Logger.log('  %s : %s รายการ', s || '(ว่าง)', tally[s]); });
  Logger.log('รวม %s รายการ', Object.keys(m).length);
  Logger.log('รหัสถัดไปถ้าเพิ่มรายการใหม่ คือ %s', adminNextCode());
  return Object.keys(m).length;
  }

  // ═══ สะพานไปหน้าตรวจนับ (COUNTLIB ในไฟล์ CountLib.gs · เดิมเป็นไลบรารีแยก) ═══
  // ส่งรหัสชีต อีเมลผู้ใช้ที่ยืนยันแล้ว และตัวบอก "ยอดในระบบ" ให้ทุกครั้ง
  // ยอดในระบบ = คงเหลือจาก LEDGER ตอนนี้ · รายการที่นับแล้ว (หน้าสรุป) ใช้ยอดในระบบ ณ ตอนนับจาก RECON_LOG
  function countQtyOld_() {
    let bal = null, rl = null;
    return function (code, counted, forDash) {
      const c = String(code || '').trim();
      if (forDash && counted) {
        if (!rl) { try { rl = reconUndoLatest_(); } catch (e) { rl = {}; } }
        const x = rl[c.toUpperCase()];
        if (x) return x.oldQty;
      }
      if (!bal) bal = balanceMap_();
      return Number(bal[c] || 0);
    };
  }
  function countlib_(me) { COUNTLIB.useContext(CFG.SHEET_ID, me && me.email, { qtyOld: countQtyOld_(), org: CFG.ORG, app: CFG.APP }); return COUNTLIB; }
  function getBootstrapData() {
    const me = staffOnly_();
    const d = countlib_(me).getBootstrapData();
    // แถบความคืบหน้าตอนเปิดหน้าตรวจนับ นับเฉพาะรายการที่ "ใช้งาน" (เท่ากับ getProgress) · ถ้าคำนวณไม่ได้ ใช้ค่าเดิมจาก COUNTLIB
    try { if (d && typeof d === 'object') d.progress = activeProgress_(me); } catch (e) { console.log('getBootstrapData progress fallback: %s', e && e.message); }
    return d;
  }
  // หน้าตรวจนับแสดงเฉพาะรายการที่ "ใช้งาน" (ลบแล้ว = เลิกใช้ ไม่ขึ้น จนกว่าผู้ดูแลเปิดใช้งานอีกครั้ง)
  function activeCountItems_(me) {
    const st = statusMap_();
    return (countlib_(me).countListItems() || []).filter(function (it) {
      return (st[String(it.code || '').trim()] || ADM.ACTIVE) === ADM.ACTIVE;
    });
  }
  function countListItems() { const me = staffOnly_(); return activeCountItems_(me); }
  function getItem(code) { const me = staffOnly_(); return countlib_(me).getItem(code); }
  // ความคืบหน้าจากรายการที่ "ใช้งาน" ใช้ร่วมกันทุกจุด (เปิดหน้า · หลังบันทึก · หลังยกเลิกผลนับ · getProgress)
  function activeProgress_(me) {
    const list = activeCountItems_(me);
    const total = list.length, done = list.filter(function (x) { return x.counted !== null && x.counted !== undefined; }).length;
    return { total: total, done: done, pending: total - done, percent: total ? Math.round(done / total * 1000) / 10 : 0 };
  }
  function activeProgressOr_(me) {
    try { return activeProgress_(me); } catch (e) { console.log('activeProgress_ fallback: %s', e && e.message); return countlib_(me).getProgress(); }
  }
  function getProgress() { const me = staffOnly_(); return activeProgress_(me); }
  function saveRecon(payload) {
    const me = staffOnly_();
    const r = countlib_(me).saveRecon(payload);
    // ปรับคงเหลือในรายการพัสดุตามยอดนับอัตโนมัติ (ลงบรรทัด "ปรับยอด" ตามส่วนต่าง) · ลงไม่ได้ = ผลนับยังบันทึกแล้ว ลงย้อนหลังด้วย RECON_ledgerBackfill_apply
    if (r && typeof r === 'object' && r.reconId) {
      try { r.stock = reconLedgerApply_(r.reconId, r.code, r.name, r.counted, me.email); }
      catch (e) { console.log('reconLedgerApply_ failed %s: %s', r.reconId, e && e.message); r.stock = { changed: false, error: String((e && e.message) || e) }; }
    }
    // ความคืบหน้าหลังบันทึก นับเฉพาะรายการที่ "ใช้งาน" และหักรายการที่ยกเลิกผลนับ (เท่ากับ getProgress) · ถ้าคำนวณไม่ได้ ใช้ค่าเดิมจาก COUNTLIB
    try { if (r && typeof r === 'object' && r.progress) r.progress = reconUndoApplyProgress_(activeProgress_(me), me); } catch (e) { console.log('saveRecon progress fallback: %s', e && e.message); }
    return r;
  }
  function getPrintHtml(summary) { const me = staffOnly_(); return countlib_(me).getPrintHtml(summary); }
  // ตัวช่วยเลือกหมวดหน้าตรวจนับ แสดงเฉพาะรายการที่ "ใช้งาน" (เท่ากับรายการตรวจนับ) · ถ้ากรองไม่ได้ ใช้ค่าเดิมจาก COUNTLIB
  function facetData() {
    const me = staffOnly_();
    const d = countlib_(me).facetData();
    try {
      if (d && Array.isArray(d.items)) {
        const st = statusMap_();
        d.items = d.items.filter(function (it) { return (st[String(it.c || '').trim()] || ADM.ACTIVE) === ADM.ACTIVE; });
      }
    } catch (e) { console.log('facetData filter fallback: %s', e && e.message); }
    return d;
  }
  function dashData() { const me = staffOnly_(); return countlib_(me).dashData(); }




// ═══════════════════════════════════════════════════════════════
//  ตัวตนและสิทธิ์ — Google Sign-in อย่างเดียว ไม่มี PIN
//    Admin    = อีเมลในแท็บ MASTER_ผู้ใช้ บทบาท ADMIN
//    STAFF    = อีเมลลงท้าย STAFF_DOMAIN (ถ้าตั้งไว้) ได้บทบาทเจ้าหน้าที่อัตโนมัติ
//    EXTERNAL = อีเมลอื่น กรอกแบบสอบถามก่อน แล้วใช้ได้เฉพาะ เบิก / รอรับ / คืน
//               (Script Property EXTERNAL_SIGNUP = 0 → ปิด ใช้ได้เฉพาะอีเมลในทะเบียน)
// ═══════════════════════════════════════════════════════════════
const EXT_TAB  = 'MASTER_ผู้ขอภายนอก';
const EXT_HEAD = ['อีเมล','ชื่อ-นามสกุล','เบอร์โทร','หน่วยงาน/องค์กร','วัตถุประสงค์','ประเภทงานที่ต้องการ','วันที่กรอก','ใช้งาน','หมายเหตุ'];
const EXT_WANTS = ['ขอเบิก', 'รอรับ (จ่าย)', 'คืน'];
const RTN_TAB  = 'REQ_แจ้งคืน';
const RTN_HEAD = ['RTN_ID','เวลา','REQ_ID','อีเมลผู้คืน','ชื่อผู้คืน','รายการที่แจ้งคืน','หมายเหตุ','สถานะ','ตรวจรับโดย','ตรวจรับเมื่อ','ข้อมูลรายการ (JSON)'];

/** ตัวตนผู้ใช้ปัจจุบัน อ่านจากบัญชี Google เท่านั้น (พารามิเตอร์เดิมคงไว้ให้หน้าเว็บเก่าไม่พัง แต่ไม่ถูกใช้) */
function whoAmI(tok) {
  // ในโหมด API ใช้ตัวตนที่ตรวจบัตรแล้วจาก doPost เท่านั้น (AUTH_) ไม่อ่าน Session
  let email = '', by = '', t = '';
  if (AUTH_) { email = AUTH_.email; by = AUTH_.by; t = AUTH_.tok || ''; }
  else {
    email = safeEmail_(); by = 'GOOGLE';
    if (!email) { t = String(tok || SES_TOK_ || ''); email = sessionEmail_(t); by = 'EMAIL'; }
  }
  if (!email) return null;
  const u = resolveUser_(email);
  if (u) { u.authBy = by; if (by === 'EMAIL') u.tok = t; }
  return u;
}

/** เดิมหน้าเว็บถามว่าต้องขอ PIN ไหม ตอนนี้ไม่มี PIN แล้ว ตอบ false เสมอ */
function authNeedsPin() { return false; }

function login() { throw new Error('ระบบนี้ไม่ใช้ PIN แล้ว กรุณาเข้าด้วยบัญชี Google'); }

function userListed_(email) {
  const sh = sheet_(CFG.TABS.USERS);
  const last = sh.getLastRow();
  if (last < 2) return false;
  const t = String(email).trim().toLowerCase();
  return sh.getRange(2, 1, last - 1, 1).getValues().some(r => String(r[0]).trim().toLowerCase() === t);
}

function extSheet_(create) {
  const ss = ss_();
  let sh = ss.getSheetByName(EXT_TAB);
  if (!sh && create) {
    sh = ss.insertSheet(EXT_TAB);
    sh.appendRow(EXT_HEAD);
    sh.getRange(1, 1, 1, EXT_HEAD.length).setBackground('#0A2342').setFontColor('#FFFFFF')
      .setFontWeight('bold').setVerticalAlignment('middle').setWrap(true);
    sh.setFrozenRows(1); sh.setRowHeight(1, 34);
    sh.getRange(2, 3, 998, 1).setNumberFormat('@');
  }
  return sh || null;
}

function rtnSheet_() {
  const ss = ss_();
  let sh = ss.getSheetByName(RTN_TAB);
  if (!sh) {
    sh = ss.insertSheet(RTN_TAB);
    sh.appendRow(RTN_HEAD);
    sh.getRange(1, 1, 1, RTN_HEAD.length).setBackground('#0A2342').setFontColor('#FFFFFF')
      .setFontWeight('bold').setVerticalAlignment('middle').setWrap(true);
    sh.setFrozenRows(1); sh.setRowHeight(1, 34);
  }
  if (sh.getLastColumn() < RTN_HEAD.length)
    sh.getRange(1, RTN_HEAD.length).setValue(RTN_HEAD[RTN_HEAD.length - 1])
      .setBackground('#0A2342').setFontColor('#FFFFFF').setFontWeight('bold').setWrap(true);
  return sh;
}

function extProfile_(email) {
  const sh = extSheet_(false);
  if (!sh) return null;
  const last = sh.getLastRow();
  if (last < 2) return null;
  const t = String(email).trim().toLowerCase();
  const rows = sh.getRange(2, 1, last - 1, EXT_HEAD.length).getValues();
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (String(r[0]).trim().toLowerCase() !== t) continue;
    return { row: i + 2, email: String(r[0]).trim(), name: cleanText_(r[1]), phone: cleanText_(r[2]),
             org: cleanText_(r[3]), purpose: cleanText_(r[4]), want: cleanText_(r[5]),
             active: String(r[7]).trim() === 'ใช่' };
  }
  return null;
}

/** จำแนกบทบาทจากอีเมล Google ที่ยืนยันแล้ว */
/**
 * จำผลตรวจผู้ใช้: ในคำสั่งเดียวกันไม่อ่านแท็บผู้ใช้ซ้ำ (เดิม 3–4 รอบต่อคำสั่ง)
 * และจำข้ามคำสั่ง 10 นาที ผูกกับรุ่นข้อมูล (บันทึกอะไรผ่านเว็บ = ล้างทันที) · แก้แท็บผู้ใช้ในชีตด้วยมือ = มีผลภายใน 10 นาที
 */
const USR_ = {};
function resolveUser_(email) {
  const e = String(email || '').trim().toLowerCase();
  if (!e) return null;
  const copy = function (u) { return u ? JSON.parse(JSON.stringify(u)) : null; };
  if (Object.prototype.hasOwnProperty.call(USR_, e)) return copy(USR_[e]);
  let key = '';
  try { key = 'usr_' + dataVer_() + '_' + otpHash_(e).slice(0, 32); } catch (x) {}
  const c = CacheService.getScriptCache();
  const hit = key ? c.get(key) : null;
  if (hit) { try { USR_[e] = JSON.parse(hit); return copy(USR_[e]); } catch (x) {} }
  const u = resolveUserFresh_(e);
  USR_[e] = u;
  if (key) { try { c.put(key, JSON.stringify(u), 600); } catch (x) {} }
  return copy(u);
}
function resolveUserFresh_(e) {
  const listed = lookupUser_(e);
  if (listed) return listed;
  if (userListed_(e)) return null;                       // อยู่ในทะเบียนแต่ถูกปิดการใช้งาน
  const dom = String(CFG.STAFF_DOMAIN).toLowerCase();
  if (dom && e.length > dom.length && e.slice(-dom.length) === dom) {
    return { row: 0, email: e, name: e.split('@')[0], position: 'เจ้าหน้าที่', role: 'STAFF',
             step: 0, absolute: false, active: true, auto: true };
  }
  if (prop_('EXTERNAL_SIGNUP') === '0') return null;          // ปิดรับผู้ใช้ภายนอก
  const x = extProfile_(e);
  if (x && !x.active) return null;
  const base = { row: x ? x.row : 0, email: e, step: 0, absolute: false, active: true, external: true };
  if (!x) return Object.assign(base, { name: e.split('@')[0], position: 'ผู้ใช้ภายนอก', role: 'EXTERNAL_NEW' });
  return Object.assign(base, { name: x.name || e.split('@')[0], position: x.org || 'ผู้ใช้ภายนอก',
                               role: 'EXTERNAL', phone: x.phone, org: x.org });
}

function isExternal_(u) { return !!u && (u.role === 'EXTERNAL' || u.role === 'EXTERNAL_NEW'); }

/** งานทั่วไป: ต้องมีสิทธิ์ และถ้าเป็นผู้ใช้ภายนอกต้องกรอกแบบสอบถามแล้ว */
function requireUser_(tok) {
  const u = whoAmI(tok);
  if (!u) throw new Error('ยังไม่ได้ยืนยันตัวตน หรืออีเมลนี้ยังไม่มีสิทธิ์ กรุณาเข้าด้วยบัญชี Google');
  if (u.role === 'EXTERNAL_NEW') throw new Error('กรุณากรอกแบบสอบถามผู้ใช้งานก่อนใช้ระบบ');
  return u;
}

/** งานภายในเท่านั้น: ผู้ใช้ภายนอกทำไม่ได้ */
function staffOnly_(tok) {
  const u = whoAmI(tok);
  if (!u) throw new Error('ยังไม่ได้ยืนยันตัวตน หรืออีเมลนี้ยังไม่มีสิทธิ์ กรุณาเข้าด้วยบัญชี Google');
  if (isExternal_(u)) throw new Error('บัญชีนี้ใช้ได้เฉพาะ ขอเบิก ติดตามรอรับ และแจ้งคืนของ');
  return u;
}

function appUrl() { return appBase_(); }
function appBase_() { return prop_('FRONT_URL') || ScriptApp.getService().getUrl(); }   // ลิงก์ไปหน้าเว็บบน GitHub Pages

function safeCell_(v) {
  const s = String(v == null ? '' : v).replace(/[\r\n]+/g, ' ').trim();
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

// ── แบบสอบถามผู้ใช้ภายนอก ──
function surveyBoot() {
  const me = whoAmI();
  if (!me) throw new Error('อ่านอีเมล Google ไม่ได้ กรุณาเข้าด้วยบัญชี Google');
  if (!isExternal_(me)) throw new Error('บัญชีนี้ไม่ต้องกรอกแบบสอบถาม');
  return { org: CFG.ORG, email: me.email, wants: EXT_WANTS, homeUrl: appBase_() };
}

function submitSurvey(d) {
  const me = whoAmI();
  if (!me) throw new Error('อ่านอีเมล Google ไม่ได้ กรุณาเข้าด้วยบัญชี Google');
  if (!isExternal_(me)) throw new Error('บัญชีนี้ไม่ต้องกรอกแบบสอบถาม');
  const p = d || {};
  const name = safeCell_(p.name), org = safeCell_(p.org), purpose = safeCell_(p.purpose);
  const phone = String(p.phone || '').replace(/[\s\-()]/g, '');
  const want = (Array.isArray(p.want) ? p.want : []).filter(x => EXT_WANTS.indexOf(x) >= 0);
  if (name.length < 3 || name.indexOf(' ') < 0) throw new Error('กรุณากรอกชื่อและนามสกุล โดยเว้นวรรคระหว่างกัน');
  if (!/^\+?\d{9,12}$/.test(phone)) throw new Error('เบอร์โทรศัพท์ไม่ถูกต้อง กรอกตัวเลข 9 ถึง 12 หลัก');
  if (org.length < 2) throw new Error('กรุณากรอกชื่อหน่วยงานหรือองค์กร');
  if (purpose.length < 5) throw new Error('กรุณาบอกวัตถุประสงค์ที่ต้องการใช้ระบบ');
  if (!want.length) throw new Error('กรุณาเลือกประเภทงานอย่างน้อยหนึ่งอย่าง');
  const lock = lock_();
  try {
    const sh = extSheet_(true);
    const x = extProfile_(me.email);
    if (x && !x.active) throw new Error('บัญชีนี้ถูกปิดการใช้งาน กรุณาติดต่อผู้ดูแลระบบ');
    const row = x ? x.row : sh.getLastRow() + 1;
    sh.getRange(row, 3).setNumberFormat('@');
    sh.getRange(row, 1, 1, 8).setValues([[me.email, name, phone, org, purpose, want.join(', '), new Date(), 'ใช่']]);
    SpreadsheetApp.flush();
    return { ok: true, homeUrl: appBase_() };
  } finally { lock.releaseLock(); }
}

// ── คำขอของฉัน (ติดตามรอรับ / รอจ่าย) ──
function myRequests() {
  const me = requireUser_();
  const hs = sheet_(CFG.TABS.REQ_H);
  const last = hs.getLastRow();
  if (last < 2) return [];
  const mine = hs.getRange(2, 1, last - 1, HEAD.REQ_H.length).getValues()
    .filter(r => String(r[2]).trim().toLowerCase() === String(me.email).toLowerCase());
  if (!mine.length) return [];
  const ids = {};
  mine.forEach(r => { ids[String(r[0]).trim()] = true; });

  const lines = {};
  const ls = sheet_(CFG.TABS.REQ_L);
  const ll = ls.getLastRow();
  if (ll >= 2) ls.getRange(2, 1, ll - 1, HEAD.REQ_L.length).getValues().forEach(r => {
    const id = String(r[1]).trim();
    if (!ids[id]) return;
    const out = toNum_(r[4]), back = toNum_(r[8]), dmg = toNum_(r[10]), lost = toNum_(r[11]);
    (lines[id] = lines[id] || []).push({ code: String(r[2]).trim(), name: cleanText_(r[3]), qty: out,
                                         back: back, remaining: Math.max(0, out - back - dmg - lost) });
  });

  const pend = {};
  const rs = ss_().getSheetByName(RTN_TAB);
  if (rs && rs.getLastRow() >= 2) rs.getRange(2, 1, rs.getLastRow() - 1, RTN_HEAD.length).getValues().forEach(r => {
    if (String(r[7]).trim() !== 'รอแอดมินตรวจรับ') return;
    const k = String(r[2]).trim(); pend[k] = (pend[k] || 0) + 1;
  });

  const LABEL = { 'รออนุมัติ': 'รอแอดมินดำเนินการ', 'อนุมัติแล้ว': 'รอรับของ (แอดมินยังไม่จ่าย)',
                  'ไม่อนุมัติ': 'ไม่อนุมัติ', 'จ่ายของออกแล้ว': 'รับของแล้ว ค้างคืน',
                  'คืนไม่ครบ': 'คืนบางส่วน', 'คืนครบ': 'คืนครบแล้ว' };
  return flowEnrichMine_(mine.map(r => {
    const id = String(r[0]).trim(), st = cleanText_(r[12]);
    return { id: id, created: fmtD_(r[1]), status: st, label: LABEL[st] || st, purpose: cleanText_(r[8]),
             dueDate: fmtD_(r[10]), lines: lines[id] || [], returnPending: pend[id] || 0 };
  }).reverse().slice(0, 60));   // 
}

/** ผู้ใช้ภายนอกแจ้งคืน: บันทึกคำขอไว้รอแอดมินตรวจรับ ยังไม่แตะบัญชีเคลื่อนไหว */
function queueReturn_(me, p) {
  const reqId = String(p.reqId || '').trim();
  if (!reqId) throw new Error('กรุณาเลือกเอกสารเบิก');
  const hs = sheet_(CFG.TABS.REQ_H);
  const hrow = findRow_(hs, 1, reqId);
  const owner = hrow ? String(hs.getRange(hrow, 3).getValue()).trim().toLowerCase() : '';
  if (!hrow || owner !== String(me.email).toLowerCase()) throw new Error('ไม่พบเอกสาร ' + reqId + ' ของบัญชีนี้');
  if (reqRead_(reqId).kind === FLOW_.GIVE) throw new Error('เอกสาร ' + reqId + ' เป็นจ่ายออก ไม่มีการคืน ถ้าต้องคืนให้แจ้งแอดมิน');   // 

  const want = (p.lines || []).map(l => ({ id: String(l.lineId || '').trim(), back: toNum_(l.qtyBack),
                                           dmg: toNum_(l.qtyDamaged) })).filter(l => l.id && (l.back > 0 || l.dmg > 0));
  if (!want.length) throw new Error('กรุณากรอกจำนวนที่จะคืนอย่างน้อยหนึ่งรายการ');

  const ls = sheet_(CFG.TABS.REQ_L);
  const last = ls.getLastRow();
  const rows = last < 2 ? [] : ls.getRange(2, 1, last - 1, HEAD.REQ_L.length).getValues();
  const parts = [];
  want.forEach(w => {
    const r = rows.find(x => String(x[0]).trim() === w.id && String(x[1]).trim() === reqId);
    if (!r) throw new Error('ไม่พบรายการ ' + w.id + ' ในเอกสาร ' + reqId);
    if (w.back < 0 || w.dmg < 0) throw new Error('จำนวนต้องไม่ติดลบ');
    const left = toNum_(r[4]) - toNum_(r[8]) - toNum_(r[10]) - toNum_(r[11]);
    if (w.back + w.dmg > left) throw new Error('รหัส ' + r[2] + ' ค้างคืน ' + left + ' แจ้งคืนเกินยอดค้าง');
    parts.push(w.id + ' ' + r[3] + ': คืน ' + w.back + (w.dmg ? ' ชำรุด ' + w.dmg : ''));
  });

  const rs = rtnSheet_();
  const id = nextId_(rs, 'RTN');
  rs.appendRow([id, new Date(), reqId, me.email, me.name, parts.join(' | '), '', 'รอแอดมินตรวจรับ', '', '',
    JSON.stringify(want.map(w => ({ lineId: w.id, qtyBack: w.back, qtyDamaged: w.dmg })))]);
  SpreadsheetApp.flush();
  return { ok: true, id: id, pending: true, status: 'รอแอดมินตรวจรับ', lines: want.length };
}

function denyHtml_(msg) {
  return '<!DOCTYPE html><html lang="th"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">' +
    '<style>body{font-family:"IBM Plex Sans Thai",system-ui,sans-serif;background:#F2F8FC;color:#0E2033;margin:0;display:flex;min-height:100vh;align-items:center;justify-content:center}' +
    '.c{background:#fff;border:1px solid #CFE2EF;border-radius:10px;padding:28px;max-width:420px;text-align:center}h1{font-size:18px;margin:0 0 8px;color:#0A2342}p{font-size:14px;color:#50677D;margin:0}</style></head>' +
    '<body><div class="c"><h1>' + msg + '</h1><p>หากคิดว่าควรเข้าได้ กรุณาติดต่อผู้ดูแลระบบ</p></div></body></html>';
}


function SETUP_addAuditor(email, name) {
  return SETUP_addUser(email, name || '', 'ผู้ตรวจสอบ', 'AUDITOR', '', false);
}


// ═══════════════════════════════════════════════════════════
//  หน้าแรก (Home) — เมนูตามบทบาท + งานค้างของแอดมิน
// ═══════════════════════════════════════════════════════════
function homeBoot() {
  const me = requireUser_();
  if (isExternal_(me)) throw new Error('หน้านี้สำหรับเจ้าหน้าที่');
  const isAdmin = String(me.role).toUpperCase() === 'ADMIN';
  const out = {
    base: appBase_(),
    name: me.name || '', role: me.role, roleLabel: ROLE_LABEL_[me.role] || me.role,
    email: isAdmin ? '' : (me.email || ''),
    isAdmin: isAdmin,
    review: reviewOn_()                                     // 
  };
  const cfg = homeCfg_();
  out.greet = cfg.greet;
  out.notice = (cfg.notice.show && cfg.notice.text) ? cfg.notice.text : '';
  const allowed = navItems_(me).map(x => x[0]).filter(p => p !== 'home');
  out.menu = allowed.map(p => cfg.menu[p]).filter(x => x && x.show).sort((a, b) => a.order - b.order);
  if (isAdmin) {
    const cachedAdmin = cacheGet_('homeAdmin');
    if (cachedAdmin) {
      out.admin = cachedAdmin;
    } else {
      out.admin = homeAdminData_();
      flowAdminData_(out.admin);                              // รอตรวจ + การลงนาม
      cachePut_('homeAdmin', out.admin, 30);
    }
    out.edit = { menu: Object.keys(cfg.menu).map(p => cfg.menu[p]).sort((a, b) => a.order - b.order), notice: cfg.notice, greet: cfg.greet };
  }
  return out;
}

function homeAdminData_() {
  const now = new Date();
  const hs = sheet_(CFG.TABS.REQ_H), hl = hs.getLastRow();
  const ls = sheet_(CFG.TABS.REQ_L), ll = ls.getLastRow();
  const heads = hl < 2 ? [] : hs.getRange(2, 1, hl - 1, HEAD.REQ_H.length).getValues();
  const lines = {};
  if (ll >= 2) ls.getRange(2, 1, ll - 1, HEAD.REQ_L.length).getValues().forEach(r => {
    const k = String(r[1]).trim();
    (lines[k] = lines[k] || []).push({ code: String(r[2]).trim(), name: cleanText_(r[3]), qty: toNum_(r[4]) });
  });
  const toDispatch = [], overdue = [];
  heads.forEach(h => {
    const id = String(h[0]).trim(), st = String(h[12]).trim();
    if (!id) return;
    const row = { id: id, created: fmtD_(h[1]), requester: cleanText_(h[3]), org: cleanText_(h[6]), type: cleanText_(h[5]),
                  purpose: cleanText_(h[8]), dueDate: fmtD_(h[10]), lines: lines[id] || [] };
    if (st === 'อนุมัติแล้ว') toDispatch.push(row);
    if ((st === 'จ่ายของออกแล้ว' || st === 'คืนไม่ครบ') && h[10] instanceof Date && h[10] < now) overdue.push(row);
  });

  const rs = rtnSheet_(), rl = rs.getLastRow();
  const returns = [];
  if (rl >= 2) rs.getRange(2, 1, rl - 1, RTN_HEAD.length).getValues().forEach(r => {
    if (String(r[7]).trim() !== 'รอแอดมินตรวจรับ') return;
    returns.push({ id: String(r[0]).trim(), at: fmtD_(r[1]), reqId: String(r[2]).trim(), who: cleanText_(r[4]),
                   items: cleanText_(r[5]), hasData: !!String(r[10] || '').trim() });
  });

  const es = extSheet_(false), externals = [];
  if (es && es.getLastRow() >= 2) es.getRange(2, 1, es.getLastRow() - 1, EXT_HEAD.length).getValues().forEach(r => {
    if (!String(r[0]).trim()) return;
    externals.push({ email: String(r[0]).trim(), name: cleanText_(r[1]), phone: String(r[2]).trim(), org: cleanText_(r[3]),
                     purpose: cleanText_(r[4]), want: cleanText_(r[5]), at: fmtD_(r[6]), active: String(r[7]).trim() === 'ใช่' });
  });

  return { toDispatch: toDispatch.slice(0, 80), returns: returns.slice(0, 80), overdue: overdue.slice(0, 80), externals: externals.slice(0, 200) };
}

/** แอดมินกดจ่ายของออก (ตัดสต็อกจริงจากคลัง) */
function homeDispatch(reqId) {
  admOnly_();
  return dispatchRequisition(reqId);
}

/** แอดมินยืนยันรับคืนตามที่ผู้ใช้ภายนอกแจ้ง แล้วลงบัญชีเคลื่อนไหว */
function homeConfirmReturn(rtnId) {
  const me = admOnly_();
  const rs = rtnSheet_();
  const row = findRow_(rs, 1, String(rtnId).trim());
  if (!row) throw new Error('ไม่พบรายการแจ้งคืน ' + rtnId);
  const v = rs.getRange(row, 1, 1, RTN_HEAD.length).getValues()[0];
  if (String(v[7]).trim() !== 'รอแอดมินตรวจรับ') throw new Error('รายการนี้ดำเนินการไปแล้ว (' + v[7] + ')');
  let lines = [];
  try { lines = JSON.parse(String(v[10] || '[]')); } catch (err) { lines = []; }
  if (!lines.length) throw new Error('รายการแจ้งคืนนี้ไม่มีข้อมูลละเอียด (สร้างก่อนอัปเดตระบบ) กรุณากด "ไม่รับคืน" แล้วให้ผู้แจ้งส่งใหม่');
  rs.getRange(row, 8).setValue('กำลังตรวจรับ');
  try {
    returnItems({ reqId: String(v[2]).trim(),
      lines: lines.map(l => ({ lineId: l.lineId, qtyBack: l.qtyBack, qtyDamaged: l.qtyDamaged, condition: '' })) });
  } catch (err) {
    rs.getRange(row, 8).setValue('รอแอดมินตรวจรับ');
    throw err;
  }
  rs.getRange(row, 8, 1, 3).setValues([['ตรวจรับแล้ว', me.email, new Date()]]);
  SpreadsheetApp.flush();
  return { ok: true, id: String(rtnId) };
}

function homeRejectReturn(rtnId, reason) {
  const me = admOnly_();
  const why = String(reason || '').trim();
  if (why.length < 3) throw new Error('กรุณาระบุเหตุผลที่ไม่รับคืน');
  const rs = rtnSheet_();
  const row = findRow_(rs, 1, String(rtnId).trim());
  if (!row) throw new Error('ไม่พบรายการแจ้งคืน ' + rtnId);
  if (String(rs.getRange(row, 8).getValue()).trim() !== 'รอแอดมินตรวจรับ') throw new Error('รายการนี้ดำเนินการไปแล้ว');
  rs.getRange(row, 7).setValue(why);
  rs.getRange(row, 8, 1, 3).setValues([['ไม่รับคืน', me.email, new Date()]]);
  SpreadsheetApp.flush();
  return { ok: true, id: String(rtnId) };
}

/** เปิด/ปิดสิทธิ์ผู้ใช้ภายนอก */
function homeSetExternal(email, on) {
  admOnly_();
  const p = extProfile_(email);
  if (!p) throw new Error('ไม่พบผู้ใช้ ' + email);
  extSheet_(false).getRange(p.row, 8).setValue(on ? 'ใช่' : 'ไม่');
  SpreadsheetApp.flush();
  return { ok: true };
}

// ── ตั้งค่าหน้าแรก (แอดมินแก้เองได้จากหน้าเว็บ เก็บในชีต CONFIG_หน้าแรก) ──
const HOME_TAB = 'CONFIG_หน้าแรก';
const HOME_HEAD = ['หน้า', 'ไอคอน', 'ชื่อ', 'คำอธิบาย', 'แสดง', 'ลำดับ'];
const HOME_DEFAULT_ = [
  ['stock',   '🔎', 'รายการพัสดุ',               'ดูว่ามีของอะไรบ้าง ค้นหา ดูคงเหลือ และเลือกไปเบิก'],
  ['index',   '📦', 'เบิก · จ่าย · คืน · ย้าย', 'ทำรายการพัสดุ เบิก คืน และย้ายที่เก็บ'],
  ['count',   '🔢', 'ตรวจนับ',                   'นับของจริงเทียบกับยอดในระบบ'],
  ['dash',    '📊', 'สรุปภาพรวม',               'ยอดคงเหลือ และความเคลื่อนไหวพัสดุ'],
  ['admin',   '⚙️', 'ผู้ดูแลระบบ',               'ตั้งค่า ผู้ใช้ และงานดูแลระบบ'],
  ['my',      '📋', 'คำขอของฉัน',               'ติดตามเอกสารเบิกของฉัน']
];

function homeCfg_() {
  const menu = {};
  HOME_DEFAULT_.forEach((d, i) => { menu[d[0]] = { page: d[0], icon: d[1], title: d[2], desc: d[3], show: true, order: i + 1 }; });
  const cfg = { menu: menu, notice: { text: '', show: false }, greet: 'สวัสดี' };
  const sh = ss_().getSheetByName(HOME_TAB);
  if (!sh || sh.getLastRow() < 2) return cfg;
  sh.getRange(2, 1, sh.getLastRow() - 1, HOME_HEAD.length).getValues().forEach(r => {
    const k = String(r[0]).trim();
    if (k === '_ประกาศ') { cfg.notice = { text: cleanText_(r[2]), show: String(r[4]).trim() !== 'ไม่' }; return; }
    if (k === '_ทักทาย') { cfg.greet = cleanText_(r[2]) || 'สวัสดี'; return; }
    const m = cfg.menu[k];
    if (!m) return;
    m.icon = cleanText_(r[1]) || m.icon;
    m.title = cleanText_(r[2]) || m.title;
    m.desc = cleanText_(r[3]);
    m.show = String(r[4]).trim() !== 'ไม่';
    const o = toNum_(r[5]);
    if (o > 0) m.order = o;
  });
  return cfg;
}

function homeSaveConfig(c) {
  admOnly_();
  c = c || {};
  const known = HOME_DEFAULT_.map(d => d[0]);
  const cut = (s, n) => String(s == null ? '' : s).replace(/[\r\n]+/g, ' ').replace(/^[=+\-@\s]+/, '').trim().slice(0, n);
  const rows = [];
  (c.menu || []).forEach((m, i) => {
    if (!m || known.indexOf(m.page) < 0) return;
    const title = cut(m.title, 40);
    if (!title) throw new Error('ชื่อเมนูห้ามว่าง (' + m.page + ')');
    rows.push([m.page, cut(m.icon, 8), title, cut(m.desc, 120), m.show === false ? 'ไม่' : 'ใช่', i + 1]);
  });
  rows.push(['_ประกาศ', '', cut(c.noticeText, 300), '', c.noticeShow ? 'ใช่' : 'ไม่', '']);
  rows.push(['_ทักทาย', '', cut(c.greet, 30) || 'สวัสดี', '', 'ใช่', '']);
  const lock = lock_();
  try {
    const ss = ss_();
    let sh = ss.getSheetByName(HOME_TAB);
    if (!sh) {
      sh = ss.insertSheet(HOME_TAB);
      sh.appendRow(HOME_HEAD);
      sh.getRange(1, 1, 1, HOME_HEAD.length).setBackground('#0A2342').setFontColor('#FFFFFF').setFontWeight('bold');
      sh.setFrozenRows(1);
    }
    if (sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, HOME_HEAD.length).clearContent();
    sh.getRange(2, 1, rows.length, HOME_HEAD.length).setValues(rows);
    SpreadsheetApp.flush();
  } finally { lock.releaseLock(); }
  return { ok: true };
}

function homeResetConfig() {
  admOnly_();
  const sh = ss_().getSheetByName(HOME_TAB);
  if (sh && sh.getLastRow() > 1) sh.getRange(2, 1, sh.getLastRow() - 1, HOME_HEAD.length).clearContent();
  SpreadsheetApp.flush();
  return { ok: true };
}








// ═══════════════════════════════════════════════════════════════
//  หน้ารายการพัสดุ (Stock) — ค้นหา ดูคงเหลือ ดูรูป และเลือกส่งไปหน้าเบิก
//  รูปเก็บเป็นภาพย่อในแท็บ MASTER_รูป (รหัส, ลำดับ, ชื่อไฟล์, ภาพ, เวลา)
//  ไม่ใช้ Google Drive จึงไม่ต้องขอสิทธิ์เพิ่ม และย้ายบัญชีได้พร้อมไฟล์ชีต
// ═══════════════════════════════════════════════════════════════
const TAB_PHOTO_ = 'MASTER_รูป';
const PHOTO_IDX_KEY_ = 'photoidx_v3';                 // มีเวลาบันทึก (t) · จำจำนวนแถวไว้ตรวจว่ามีคนลบ/แทรกแถวในแท็บรูป

function photoSheet_(create) {
  let sh = ss_().getSheetByName(TAB_PHOTO_);
  if (!sh && create) {
    sh = ss_().insertSheet(TAB_PHOTO_);
    sh.getRange(1, 1, 1, 5).setValues([['รหัส', 'ลำดับ', 'ชื่อไฟล์', 'ภาพ (data URL)', 'เวลา']])
      .setBackground('#0A2342').setFontColor('#FFFFFF').setFontWeight('bold');
    sh.setFrozenRows(1);
    sh.setColumnWidth(4, 160);
    sh.getRange('D2:D5000').setWrapStrategy(SpreadsheetApp.WrapStrategy.CLIP);
  }
  return sh;
}

/**
 * แผนที่ รหัส -> [{i: ลำดับ, row: แถว, t: เวลา}] เก็บแคช 6 ชั่วโมง ล้างเมื่อมีการบันทึกรูป
 * กันรูปเพี้ยน: รูปผูกกับรหัส (คอลัมน์ A) ไม่ได้ผูกกับตำแหน่งแถว แต่ดัชนีจำแถวไว้
 *   ถ้ามีคนลบ/แทรกแถวในแท็บรูปด้วยมือ จำนวนแถวจะไม่ตรงกับที่จำไว้ → สร้างดัชนีใหม่ทันที
 *   ถ้ามีคนเรียงแถวใหม่ (จำนวนแถวเท่าเดิม) photoAt_ ตรวจรหัสในแถวก่อนอ่านรูปทุกครั้ง ไม่ตรง → สร้างดัชนีใหม่
 */
function photoIndex_(fresh) {
  const cache = CacheService.getScriptCache();
  const sh = photoSheet_(false), last = sh ? sh.getLastRow() : 0;
  if (!fresh) {
    const hit = cache.get(PHOTO_IDX_KEY_);
    if (hit) { try { const o = JSON.parse(hit); if (o && o.n === last && o.m) return o.m; } catch (e) {} }
  }
  const m = {};
  if (sh && last > 1) {
    const n = last - 1, ts = sh.getRange(2, 5, n, 1).getValues();   // คอลัมน์ E เวลา (ไม่อ่านคอลัมน์รูป)
    sh.getRange(2, 1, n, 2).getValues().forEach(function (r, i) {
      const c = String(r[0] || '').trim();
      if (!c) return;
      const v = ts[i][0], t = v && typeof v.getTime === 'function' ? v.getTime() : 0;
      (m[c] = m[c] || []).push({ i: Number(r[1]) || 1, row: i + 2, t: t });
    });
    Object.keys(m).forEach(function (k) { m[k].sort(function (a, b) { return a.i - b.i; }); });
  }
  try { cache.put(PHOTO_IDX_KEY_, JSON.stringify({ n: last, m: m }), 21600); } catch (e) {}
  return m;
}

/** รูปลำดับที่ k ของรหัส · ตรวจว่าแถวนั้นยังเป็นรหัสและลำดับเดิมก่อนใช้ ไม่ตรง = ดัชนีเก่า สร้างใหม่แล้วอ่านอีกรอบ */
function photoAt_(sh, code, k) {
  for (let round = 0; round < 2; round++) {
    const e = (photoIndex_(round > 0)[code] || [])[k];
    if (!e) return null;
    const v = sh.getRange(e.row, 1, 1, 4).getValues()[0];
    if (String(v[0]).trim() === code && (Number(v[1]) || 1) === e.i) return { url: String(v[3]), t: e.t, row: e.row };
  }
  return null;
}

function stockList() {
  const me = requireUser_();
  return { items: stockItems_(), app: appBase_(), admin: String(me.role).toUpperCase() === 'ADMIN' };
}
/** รายการพัสดุที่ทุกคนเห็นเหมือนกัน (แคช · ตัวอุ่นระบบสร้างไว้ล่วงหน้า) */
function stockItems_(fresh) {
  if (!fresh) { const hit = cacheGet_('stock'); if (hit) return hit; }
  const reg = sheet_(CFG.TABS.REGISTER);
  const last = reg.getLastRow();
  const out = { items: [] };
  if (last < 2) return out.items;
  const vals = reg.getRange(2, 1, last - 1, Math.min(reg.getMaxColumns(), 26)).getValues();   // ถึงคอลัมน์ Z (รหัสสินค้า)
  const bal = balanceMap_(), st = statusMap_(), pix = photoIndex_(), en = nameEnMap_();
  const rsum = {}; radioRows_().rows.forEach(function (u) { const m = rsum[u.model] = rsum[u.model] || { f: 0, t: 0 }; m.t++; if (u.st === RADIO_.IN) m.f++; });
  vals.forEach(function (r) {
    const code = String(r[CFG.REG.code - 1] || '').trim();
    if (!code || (st[code] || 'ใช้งาน') !== 'ใช้งาน') return;
    out.items.push({
      c: code,
      n: cleanText_(r[CFG.REG.name - 1]),
      e: en[code] || '',                              // AA ชื่อภาษาอังกฤษ
      m: cleanText_(r[CFG.REG.mainCat - 1]),
      s: cleanText_(r[CFG.REG.subCat - 1]),
      z: cleanText_(r[CFG.REG.size - 1]),
      l: cleanText_(r[CFG.REG.location - 1]),
      k: cleanText_(r[CFG.REG.condition - 1]),
      b: bal[code] === undefined ? toNum_(r[CFG.REG.qtyOld - 1]) : bal[code],
      p: (pix[code] || []).length,
      pv: (pix[code] && pix[code][0] && pix[code][0].t) || 0,       // เวลาบันทึกรูปแรก ให้หน้าเว็บรู้ว่ารูปที่จำไว้ยังใช้ได้
      t: cleanText_(r[18]),                           // S ทรง
      y: cleanText_(r[20]),                           // U ปี
      x: cleanText_(r[23]),                           // X ไซส์
      sk: cleanText_(r[25]),                          // Z รหัสสินค้า
      r: rsum[code] || null                           // อุปกรณ์รายเครื่อง: เครื่องว่าง / ทั้งหมด
    });
  });
  cachePut_('stock', out.items);
  return out.items;
}

/** ภาพย่อรูปแรกของแต่ละรหัส (ครั้งละไม่เกิน 12 รหัส) */
function stockPhotos(codes) {
  requireUser_();
  const out = {}, sh = photoSheet_(false);
  if (!sh) return out;
  const idx = photoIndex_();
  const c = CacheService.getScriptCache();
  (codes || []).slice(0, 12).forEach(function (code) {
    code = String(code);
    const list = idx[code];
    if (!list || !list.length) return;
    let u = list[0].t ? c.get('ph_' + code + '_' + list[0].t) : null;   // เปลี่ยนรูป = เวลาเปลี่ยน = คีย์ใหม่
    if (!u) {
      const p = photoAt_(sh, code, 0);                                   // ตรวจรหัสในแถวก่อนอ่าน กันรูปเพี้ยน
      if (!p) return;
      u = p.url;
      if (p.t) { try { c.put('ph_' + code + '_' + p.t, u, 21600); } catch (e) {} }
    }
    out[code] = u;
  });
  return out;
}

/** รูปทั้งหมดของรหัสเดียว สำหรับหน้ารายละเอียด */
function stockPhotoSet(code) {
  requireUser_();
  const sh = photoSheet_(false);
  if (!sh) return [];
  code = String(code);
  const n = Math.min(8, (photoIndex_()[code] || []).length), out = [];
  for (let k = 0; k < n; k++) { const p = photoAt_(sh, code, k); if (p) out.push(p.url); }   // ตรวจรหัสทุกรูป
  return out;
}

/** ผู้ดูแลอัปโหลดรูป (ย่อมาจากเบราว์เซอร์แล้ว) รหัสและลำดับเดิมจะถูกแทนที่ */
function adminSavePhotos(batch) {
  admOnly_();
  const items = (batch || []).filter(function (b) {
    return b && codeOk_(b.code) && /^data:image\/jpeg;base64,[A-Za-z0-9+\/=]+$/.test(String(b.data)) && String(b.data).length < 49000;
  });
  if (!items.length) return { saved: 0 };
  const lock = lock_();
  try {
    const sh = photoSheet_(true), last = sh.getLastRow(), keys = {};
    if (last > 1) sh.getRange(2, 1, last - 1, 2).getValues().forEach(function (r, i) {
      keys[String(r[0]).trim() + '|' + (Number(r[1]) || 1)] = i + 2;
    });
    const now = new Date(), add = [];
    items.forEach(function (b) {
      const idx = Math.max(1, Math.min(20, Number(b.idx) || 1));
      const row = [b.code, idx, String(b.name || '').replace(/[^\w.\-]/g, '_').slice(0, 80), b.data, now];
      const k = b.code + '|' + idx;
      if (keys[k]) sh.getRange(keys[k], 1, 1, 5).setValues([row]); else add.push(row);
    });
    if (add.length) {
      const start = sh.getLastRow() + 1;
      if (sh.getMaxRows() < start + add.length - 1) sh.insertRowsAfter(sh.getMaxRows(), start + add.length - 1 - sh.getMaxRows());
      sh.getRange(start, 1, add.length, 5).setValues(add);
    }
    CacheService.getScriptCache().remove(PHOTO_IDX_KEY_);
    return { saved: items.length };
  } finally { lock.releaseLock(); }
}

/** ผู้ดูแลลบรายการออกจากทะเบียน: ตัดยอดเหลือ 0 ลงบันทึกตัดจำหน่าย แล้วตั้งสถานะเลิกใช้ ไม่ลบแถว ประวัติยังอยู่ ถ้าต้องการกลับมาใช้ได้ที่หน้าผู้ดูแลระบบ */
function adminDeleteItem(code, reason) {
  admOnly_();
  code = cleanText_(code);
  if (!codeOk_(code)) throw new Error('รหัสไม่ถูกต้อง');
  const r = adminRetire({ list: [{ code: code, mode: 'zero' }], reason: cleanText_(reason) || 'ผู้ดูแลลบรายการ', note: 'ลบจากหน้ารายการพัสดุ' });
  if (r.skipped && r.skipped.length) throw new Error('ไม่พบรหัส ' + code + ' ในทะเบียน');
  return r;
}

/** ผู้ดูแลลบรูปทั้งหมดของรหัสเดียว (ลบเฉพาะรูปในแท็บ MASTER_รูป ไม่แตะข้อมูลพัสดุ) */
function adminDeletePhotos(code) {
  admOnly_();
  code = String(code || '').trim();
  if (!codeOk_(code)) throw new Error('รหัสไม่ถูกต้อง');
  const lock = lock_();
  try {
    const sh = photoSheet_(false);
    if (!sh || sh.getLastRow() < 2) return { deleted: 0 };
    const vals = sh.getRange(2, 1, sh.getLastRow() - 1, 1).getValues(), rows = [];
    vals.forEach(function (r, i) { if (String(r[0]).trim() === code) rows.push(i + 2); });
    rows.reverse().forEach(function (r) { sh.deleteRow(r); });
    CacheService.getScriptCache().remove(PHOTO_IDX_KEY_);
    return { deleted: rows.length };
  } finally { lock.releaseLock(); }
}

/**
 * กันคอลัมน์ทะเบียนเลื่อน: ถ้ามีคนลบ/แทรกคอลัมน์ในแท็บทะเบียนด้วยมือ ข้อมูลทุกช่องจะเลื่อน
 * ตรวจก่อนบันทึกทุกครั้ง (จำผล 30 วินาที): หัวคอลัมน์ Y ต้องเป็น "สถานะรายการ" (ถ้ามีหัว) และคอลัมน์ A ต้องเป็นรหัสพัสดุ (ITEM_PREFIX-xxx)
 * ไม่ผ่าน = ไม่บันทึกอะไร แจ้งให้ย้อนการแก้ในชีต
 */
function regGuard_() {
  const c = CacheService.getScriptCache();
  if (c.get('regok_v1') || prop_('REG_GUARD') === '0') return;      // REG_GUARD=0 ใน Script Properties = ปิดการตรวจ (ฉุกเฉิน)
  const sh = sheet_(CFG.TABS.REGISTER), last = sh.getLastRow(), maxc = sh.getMaxColumns();
  const head = sh.getRange(1, 1, 1, maxc).getValues()[0].map(function (v) { return String(v).trim(); });
  const at = head[ADM.STATUS_COL - 1] === ADM.STATUS_HEAD ? ADM.STATUS_COL   // หัว "สถานะรายการ" ต้องอยู่คอลัมน์ Y (25) ถ้ามี
           : head.indexOf(ADM.STATUS_HEAD) + 1;
  const codes = last > 1 ? sh.getRange(2, CFG.REG.code, Math.min(20, last - 1), 1).getValues()
    .map(function (r) { return String(r[0]).trim(); }).filter(String) : [];
  const okn = codes.filter(function (v) { return codeOk_(v); }).length;
  const moved = (at > 0 && at !== ADM.STATUS_COL) || (last > 1 && (!codes.length || okn * 2 < codes.length));
  if (moved)
    throw new Error('โครงสร้างแท็บทะเบียนในชีตเปลี่ยน (มีการลบหรือแทรกคอลัมน์) ระบบหยุดบันทึกไว้ก่อน กันข้อมูลลงผิดช่อง · ' +
                    'ให้ย้อนการแก้ในชีต (Cmd/Ctrl + Z หรือ ประวัติเวอร์ชัน) หรือแจ้งผู้ดูแลระบบ');
  c.put('regok_v1', '1', 30);
}

/**
 * รันมือครั้งเดียวใน Editor (SETUP_1_start เรียกให้แล้ว): ใส่ป้องกันแบบ "เตือนก่อนแก้" ให้แท็บที่ระบบดูแลเอง
 * แก้ด้วยมือได้ แต่ Google จะถามยืนยันก่อน กันเผลอลบแถว/คอลัมน์ · สคริปต์ของระบบไม่ถูกกระทบ
 * ทะเบียน: เฉพาะแถวหัวตาราง (ลบ/แทรกคอลัมน์จะถูกเตือน) · แท็บรูป บัญชีเคลื่อนไหว ประวัติสถานะ: ทั้งแท็บ
 */
function SETUP_protectStructure() {
  const out = [];
  const warn = function (p, d) { p.setDescription(d).setWarningOnly(true); };
  const reg = sheet_(CFG.TABS.REGISTER);
  warn(reg.getRange(1, 1, 1, reg.getMaxColumns()).protect(), CFG.APP + ': หัวตารางทะเบียน ห้ามลบ/แทรกคอลัมน์ (ระบบอ่านตามตำแหน่งคอลัมน์)');
  out.push(CFG.TABS.REGISTER + ' แถวหัวตาราง');
  [TAB_PHOTO_, CFG.TABS.LEDGER, ADM.LOG_TAB].forEach(function (n) {
    const sh = ss_().getSheetByName(n);
    if (!sh) return;
    warn(sh.protect(), CFG.APP + ': แท็บนี้ระบบดูแลเอง แก้ผ่านหน้าเว็บ (รูปผูกกับรหัสในคอลัมน์ A)');
    out.push(n + ' ทั้งแท็บ');
  });
  Logger.log('ใส่ป้องกันแบบเตือนแล้ว: %s', out.join(' · '));
  return out;
}

/** รันมือครั้งเดียว: สร้างแท็บ MASTER_รูป */
function SETUP_createPhotoTab() { photoSheet_(true); return 'พร้อม'; }


// ═══════════════════════════════════════════════════════════════
//  อัปโหลดไฟล์แนบ — ช่องไฟล์แนบหน้าเบิก และช่องหลักฐานหน้าจ่าย
//  ไฟล์เก็บในโฟลเดอร์ Drive ของบัญชีที่รันเว็บ ระบบสร้างโฟลเดอร์ให้เองครั้งแรก
//  แชร์ให้ ADMIN ในแท็บ MASTER_ผู้ใช้ เปิดดูได้ ลิงก์ที่ได้บันทึกลงคอลัมน์ลิงก์เดิม
// ═══════════════════════════════════════════════════════════════
const UPLOAD_ = {
  get FOLDER_NAME() { return prop_('UPLOAD_FOLDER_NAME') || (CFG.APP + ' — ไฟล์แนบ'); },
  MAX_BYTES: 10 * 1024 * 1024,
  TYPES: { 'application/pdf': 'pdf', 'image/jpeg': 'jpg', 'image/png': 'png' }
};

/** file = { name, mimeType, data (base64 ไม่มีส่วนหัว data:), tok } คืน { url, name } */
function uploadAttachment(file) {
  const me = denyAudit_(requireUser_((file || {}).tok));
  const f = file || {};
  const mime = String(f.mimeType || '');
  const ext = UPLOAD_.TYPES[mime];
  if (!ext) throw new Error('รับเฉพาะไฟล์ PDF, JPG, PNG');
  const data = String(f.data || '');
  if (!data || !/^[A-Za-z0-9+\/]+={0,2}$/.test(data)) throw new Error('ไฟล์ไม่สมบูรณ์ ลองเลือกไฟล์ใหม่');
  const bytes = Utilities.base64Decode(data);
  if (!bytes.length) throw new Error('ไฟล์ว่าง ลองเลือกไฟล์ใหม่');
  if (bytes.length > UPLOAD_.MAX_BYTES) throw new Error('ไฟล์ใหญ่เกิน 10 MB');

  const base = cleanText_(f.name).replace(/\.[^.]*$/, '')
                 .replace(/[\\\/:*?"<>|#%]+/g, ' ').trim().slice(0, 80) || 'ไฟล์แนบ';
  const name = Utilities.formatDate(new Date(), CFG.TZ, 'yyyyMMdd-HHmmss') +
               ' ' + me.email + ' ' + base + '.' + ext;

  const lock = lock_();
  let folder;
  try { folder = uploadFolder_(); } finally { lock.releaseLock(); }

  const out = folder.createFile(Utilities.newBlob(bytes, mime, name));
  out.setDescription('อัปโหลดโดย ' + me.email + ' ผ่าน ' + CFG.APP);
  return { url: out.getUrl(), name: name };
}

/** โฟลเดอร์เก็บไฟล์แนบ แยกตามบัญชีที่รันสคริปต์ จำรหัสไว้ใน Script Properties */
function uploadFolder_() {
  const props = PropertiesService.getScriptProperties();
  const key = 'UPLOAD_FOLDER_ID:' + String(Session.getEffectiveUser().getEmail() || '').toLowerCase();
  const id = props.getProperty(key);
  let folder = null;
  if (id) {
    try { folder = DriveApp.getFolderById(id); if (folder.isTrashed()) folder = null; }
    catch (e) { folder = null; }
  }
  if (!folder) {
    const parentId = prop_('DRIVE_FOLDER_ID');                 // สร้างในโฟลเดอร์นี้ถ้าตั้งไว้ (ว่าง = My Drive)
    folder = (parentId ? DriveApp.getFolderById(parentId) : DriveApp.getRootFolder()).createFolder(UPLOAD_.FOLDER_NAME);
    props.setProperty(key, folder.getId());
  }
  shareUploadsWithAdmins_(folder);
  return folder;
}

/** ให้ ADMIN ที่ยังใช้งานอยู่ เปิดดูไฟล์ในโฟลเดอร์ได้ แชร์ไม่สำเร็จไม่ทำให้อัปโหลดล้ม */
function shareUploadsWithAdmins_(folder) {
  try {
    const sh = sheet_(CFG.TABS.USERS);
    const last = sh.getLastRow();
    if (last < 2) return;
    const have = {};
    folder.getViewers().concat(folder.getEditors()).forEach(function (u) {
      have[String(u.getEmail()).toLowerCase()] = true;
    });
    try { have[String(folder.getOwner().getEmail()).toLowerCase()] = true; } catch (e) {}
    sh.getRange(2, 1, last - 1, HEAD.USERS.length).getValues()
      .filter(function (r) { return String(r[3]).trim().toUpperCase() === 'ADMIN' && String(r[6]).trim() === 'ใช่'; })
      .map(function (r) { return String(r[0]).trim().toLowerCase(); })
      .filter(function (e) { return e && !have[e]; })
      .forEach(function (e) { try { folder.addViewer(e); } catch (err) {} });
  } catch (e) { /* ข้ามไป */ }
}



// ═══════════════════════════════════════════════════════════════
//  อุปกรณ์รายเครื่องรายเครื่อง — ใช้แท็บ STOCK_อุปกรณ์รายเครื่อง (หัวตารางแถว 12)
//  ยอดรวมของรุ่นยังอยู่ที่รหัสพัสดุของรุ่นใน LEDGER ตามเดิม แท็บนี้เก็บสถานะรายเครื่อง (ไม่ใช้ก็ปล่อยว่างได้)
//  คอลัมน์: A กลุ่ม B ยี่ห้อ C รหัสเดิม(ไฟล์ IT) D แท่นชาร์จ E สายชาร์จ F สถานะ G ผู้ยืม H วันที่ I หมายเหตุ
//           J ที่มา K รหัสเครื่อง L รหัสรุ่น (รหัสพัสดุ เช่น ITEM-001) M เอกสาร
// ═══════════════════════════════════════════════════════════════
const RADIO_ = { TAB: 'STOCK_รายเครื่อง', HR: 12, IN: 'คงคลัง', OUT: 'นำไปใช้ (ยืมอยู่)', BAD: 'ขาดหรือชำรุด' };

function radioRows_() {
  const sh = ss_().getSheetByName(RADIO_.TAB);
  if (!sh || sh.getLastRow() <= RADIO_.HR) return { sh: sh, rows: [] };
  const v = sh.getRange(RADIO_.HR + 1, 1, sh.getLastRow() - RADIO_.HR, Math.min(sh.getMaxColumns(), 13)).getValues();
  const rows = [];
  v.forEach(function (r, i) {
    const code = cleanText_(r[10]), model = cleanText_(r[11]);
    if (!code || !model) return;
    rows.push({ row: RADIO_.HR + 1 + i, code: code, old: cleanText_(r[2]), model: model,
                st: cleanText_(r[5]), who: cleanText_(r[6]), doc: cleanText_(r[12]) });
  });
  return { sh: sh, rows: rows };
}

function radioList_(v) {
  if (Array.isArray(v)) return v.map(function (x) { return cleanText_(x); }).filter(String);
  return String(v == null ? '' : v).split(/[,\s]+/).map(function (x) { return x.trim(); }).filter(String);
}

/** อุปกรณ์รายเครื่อง: ถ้ารหัสนี้มีเครื่องรายตัว ต้องเลือกเลขเครื่องที่ว่างให้ครบตามจำนวน */
function radioCheck_(R, model, units, qty) {
  const mine = R.rows.filter(function (u) { return u.model === model; });
  if (!mine.length) return;
  const us = radioList_(units);
  if (us.length !== qty) throw new Error('รหัส ' + model + ' กรุณาเลือกเลขเครื่องให้ครบ ' + qty + ' เครื่อง (เลือกไว้ ' + us.length + ')');
  const seen = {};
  us.forEach(function (c) {
    if (seen[c]) throw new Error('เลือกเครื่อง ' + c + ' ซ้ำ'); seen[c] = 1;
    const u = mine.find(function (x) { return x.code === c; });
    if (!u) throw new Error('ไม่พบเครื่อง ' + c + ' ในรุ่น ' + model);
    if (u.st !== RADIO_.IN) throw new Error('เครื่อง ' + c + ' ไม่ว่าง (' + u.st + (u.doc ? ' ' + u.doc : '') + ')');
  });
}

function radioMark_(R, codes, st, who, doc, note) {
  codes.forEach(function (c) {
    const u = R.rows.find(function (x) { return x.code === c; });
    if (!u) return;
    R.sh.getRange(u.row, 6).setValue(st);
    R.sh.getRange(u.row, 7).setValue(who || '');
    R.sh.getRange(u.row, 8).setValue(st === RADIO_.OUT ? new Date() : '');
    R.sh.getRange(u.row, 13).setValue(doc || '');
    if (note) R.sh.getRange(u.row, 9).setValue(note);
    u.st = st; u.who = who || ''; u.doc = doc || '';
  });
}

/** ปล่อยเครื่องที่จองไว้กับเอกสาร (เอกสารไม่อนุมัติหรือกลับรายการ) */
function radioReleaseDoc_(reqId) {
  const R = radioRows_();
  radioMark_(R, R.rows.filter(function (u) { return u.doc === String(reqId).trim() && u.st === RADIO_.OUT; })
                      .map(function (u) { return u.code; }), RADIO_.IN, '', '');
}

/** รายการเครื่องทั้งหมด สำหรับหน้าเบิกและหน้ารายการพัสดุ */
function radioUnitList() {
  requireUser_();
  return radCached_();
}
function radCached_(fresh) {
  if (!fresh) { const hit = cacheGet_('rad'); if (hit) return hit; }  // แคช
  const out = {};
  radioRows_().rows.forEach(function (u) {
    const m = out[u.model] = out[u.model] || { total: 0, free: 0, units: [] };
    m.total++; if (u.st === RADIO_.IN) m.free++;
    m.units.push({ c: u.code, s: u.st, d: u.doc });
  });
  cachePut_('rad', out);
  return out;
}


// ═══════════════════════════════════════════════════════════════
//  ชื่อสินค้าภาษาอังกฤษ — ทะเบียนคอลัมน์ AA (27) ชื่อภาษาอังกฤษ
//  หน้าเว็บโหมด English แสดงชื่อนี้แทนชื่อไทย · แบบฟอร์มพิมพ์แสดงทั้ง 2 ภาษา
// ═══════════════════════════════════════════════════════════════
const NAME_EN_ = { COL: 27, HEAD: 'ชื่อภาษาอังกฤษ', KEY: 'names_en_v1' };

/** [[รหัส, ชื่อไทย, ชื่ออังกฤษ]] เฉพาะแถวที่มีชื่ออังกฤษ · แคช 10 นาที */
function namesEn_() {
  const c = CacheService.getScriptCache();
  try { const v = c.get(NAME_EN_.KEY); if (v) return JSON.parse(v); } catch (e) {}
  const reg = sheet_(CFG.TABS.REGISTER), last = reg.getLastRow(), out = [];
  if (last >= 2 && reg.getMaxColumns() >= NAME_EN_.COL) {
    const cn = reg.getRange(2, 1, last - 1, 2).getValues();                 // A รหัส · B ชื่อ
    const en = reg.getRange(2, NAME_EN_.COL, last - 1, 1).getValues();
    en.forEach(function (r, i) {
      const e = cleanText_(r[0]), code = String(cn[i][0] || '').trim();
      if (e && code) out.push([code, cleanText_(cn[i][1]), e]);
    });
  }
  try { c.put(NAME_EN_.KEY, JSON.stringify(out), 600); } catch (e) {}
  return out;
}

function nameEnMap_() {
  const m = {};
  try { namesEn_().forEach(function (x) { m[x[0]] = x[2]; }); } catch (e) {}
  return m;
}



// ═══════════════════════════════════════════════════════════════
//  เข้าระบบด้วยรหัสทางอีเมล — ใช้เมื่อ Google ไม่ส่งอีเมลผู้ใช้ให้สคริปต์
//  เหตุผล: เว็บแอปที่เจ้าของเป็นบัญชี Gmail ทั่วไปและรันในนามเจ้าของ อ่านอีเมลผู้เข้าชมคนอื่นไม่ได้
//  รหัส 6 หลักส่งเข้าอีเมล ใช้ได้ 10 นาที ใส่ผิดได้ 5 ครั้ง · บัตรผ่านอยู่ได้ 6 ชั่วโมง
//  ขอรหัสได้ 3 ครั้ง ต่ออีเมล ต่อ 15 นาที และรวมไม่เกิน OTP_.DAY_MAX ฉบับต่อวัน
//  สิทธิ์ยังตรวจตามทะเบียนผู้ใช้เหมือนเข้าด้วย Google ทุกอย่าง
// ═══════════════════════════════════════════════════════════════
const OTP_ = { TTL: 600, MAX_TRY: 5, SES_TTL: 21600, PER_MAIL: 3, DAY_MAX: 80 };   // SES_TTL: อายุบัตรรุ่นเก่าใน cache (ก่อน 
let SES_TOK_ = '';

// ═══════════════════════════════════════════════════════════════
//  บัตรผ่านไม่หมดอายุ: เข้าสู่ระบบครั้งเดียว ใช้ได้จนกว่าจะกด "ออกจากระบบ"
//  · เก็บถาวรใน Script Properties ชื่อ ses_<บัตร> = { e: อีเมล, g: 1 ถ้าเข้าด้วย Google, c: เวลาออกบัตร, d: วันที่ใช้ล่าสุด }
//    (cache ของ Google เก็บได้นานสุด 6 ชม. จึงใช้แทนไม่ได้)
//  · สิทธิ์ยังตรวจจากทะเบียนผู้ใช้ทุกคำขอเหมือนเดิม → ปิดการใช้งานในทะเบียน = ใช้ไม่ได้ทันที (ไม่เกิน 10 นาที)
//  · บัตรเกิน MAX ใบ → ลบเครื่องที่ไม่ได้ใช้นานที่สุดจนเหลือ KEEP ใบ (กันพื้นที่ Script Properties 500KB เต็ม)
//  · ผู้ดูแลรันใน Editor: SESSIONS_report (นับบัตร) · SESSIONS_signOutAll (ทุกเครื่องออกจากระบบทันที เช่น เครื่องหาย)
// ═══════════════════════════════════════════════════════════════
const SES_ = { P: 'ses_', MAX: 2000, KEEP: 1500 };

function sesValid_(tok) { return !!tok && /^[0-9a-f-]{36}$/.test(String(tok)); }
function sesDay_() { return Utilities.formatDate(new Date(), CFG.TZ, 'yyyyMMdd'); }

/** ข้อมูลบัตรผ่าน { e, g, c, d } หรือ null ถ้าไม่มี/ออกจากระบบแล้ว */
function sessionInfo_(tok) {
  if (!sesValid_(tok)) return null;
  tok = String(tok);
  const props = PropertiesService.getScriptProperties(), k = SES_.P + tok;
  let o = null;
  try { o = JSON.parse(props.getProperty(k) || 'null'); } catch (x) { o = null; }
  if (!o || !o.e) {
    // บัตรรุ่นเก่าใน cache (ออกก่อน และยังไม่ครบ 6 ชม.) → ย้ายมาเก็บถาวร ผู้ใช้ไม่ต้องเข้าใหม่
    const c = CacheService.getScriptCache(), m = c.getAll(['ses_' + tok, 'sesg_' + tok]) || {};
    if (!m['ses_' + tok]) return null;
    o = sessionPut_(tok, m['ses_' + tok], m['sesg_' + tok] === '1');
    try { c.removeAll(['ses_' + tok, 'sesg_' + tok]); } catch (x) {}
    return o;
  }
  const d = sesDay_();
  if (o.d !== d) { o.d = d; try { props.setProperty(k, JSON.stringify(o)); } catch (x) {} }   // จดวันที่ใช้ล่าสุด วันละครั้ง
  return o;
}

function sessionEmail_(tok) { const o = sessionInfo_(tok); return o ? o.e : ''; }

/** ออกบัตรผ่านใหม่ (ไม่หมดอายุ) คืนรหัสบัตร */
function sessionNew_(email, google) {
  const tok = Utilities.getUuid();
  sessionPut_(tok, String(email).trim().toLowerCase(), google);
  sessionPrune_(false);
  return tok;
}

function sessionPut_(tok, email, google) {
  const o = { e: email, g: google ? 1 : 0, c: Date.now(), d: sesDay_() };
  const props = PropertiesService.getScriptProperties(), v = JSON.stringify(o);
  try { props.setProperty(SES_.P + tok, v); }
  catch (x) { sessionPrune_(true); props.setProperty(SES_.P + tok, v); }   // พื้นที่เต็ม: ลบเครื่องที่ไม่ได้ใช้นานที่สุดแล้วลองใหม่
  return o;
}

/** ลบบัตรของเครื่องที่ไม่ได้ใช้นานที่สุด · force = พื้นที่เต็ม ลบ 1 ใน 4 · ปกติลบเมื่อเกิน MAX ให้เหลือ KEEP */
function sessionPrune_(force) {
  const props = PropertiesService.getScriptProperties();
  const keys = props.getKeys().filter(function (k) { return k.indexOf(SES_.P) === 0; });
  const n = keys.length, target = force ? Math.floor(n * 0.75) : (n > SES_.MAX ? SES_.KEEP : n);
  if (n - target <= 0) return 0;
  const all = props.getProperties();
  const list = keys.map(function (k) {
    let o = {}; try { o = JSON.parse(all[k]) || {}; } catch (x) {}
    return { k: k, d: String(o.d || ''), c: Number(o.c) || 0 };
  }).sort(function (a, b) { return a.d < b.d ? -1 : a.d > b.d ? 1 : a.c - b.c; });
  list.slice(0, n - target).forEach(function (x) { props.deleteProperty(x.k); });
  console.log('ลบบัตรผ่านเครื่องที่ไม่ได้ใช้นาน %s ใบ เหลือ %s ใบ', n - target, target);
  return n - target;
}

/** ผู้ดูแล (รันใน Editor): จำนวนบัตรผ่านที่เก็บไว้ · ไม่แสดงอีเมล */
function SESSIONS_report() {
  const props = PropertiesService.getScriptProperties(), all = props.getProperties();
  const keys = Object.keys(all).filter(function (k) { return k.indexOf(SES_.P) === 0; });
  let g = 0, oldest = '';
  keys.forEach(function (k) { try { const o = JSON.parse(all[k]); if (o.g) g++; if (!oldest || String(o.d) < oldest) oldest = String(o.d); } catch (x) {} });
  Logger.log('บัตรผ่าน %s ใบ (Google %s · รหัสอีเมล %s) · ใช้ล่าสุดเก่าสุดวันที่ %s · ลบอัตโนมัติเมื่อเกิน %s ใบ',
             keys.length, g, keys.length - g, oldest || '-', SES_.MAX);
}

/** ผู้ดูแล (รันใน Editor): ทุกเครื่องของทุกคนออกจากระบบทันที เช่น เครื่องหาย · ทุกคนต้องเข้าสู่ระบบใหม่ */
function SESSIONS_signOutAll() {
  const props = PropertiesService.getScriptProperties();
  const keys = props.getKeys().filter(function (k) { return k.indexOf(SES_.P) === 0; });
  keys.forEach(function (k) { props.deleteProperty(k); });
  Logger.log('ออกจากระบบทุกเครื่องแล้ว %s ใบ', keys.length);
}

function otpHash_(s) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(s))
    .map(function (b) { return ('0' + (b & 255).toString(16)).slice(-2); }).join('');
}

/** ขอรหัสเข้าระบบทางอีเมล */
function otpRequest(email) {
  const e = String(email || '').trim().toLowerCase();
  if (e.length > 120 || !/^[^\s@<>()]+@[^\s@<>()]+\.[a-z]{2,}$/.test(e)) throw new Error('รูปแบบอีเมลไม่ถูกต้อง');
  if (userListed_(e) && !lookupUser_(e)) throw new Error('บัญชีนี้ถูกปิดการใช้งาน กรุณาติดต่อผู้ดูแลระบบ');
  const c = CacheService.getScriptCache(), props = PropertiesService.getScriptProperties();
  const n = Number(c.get('otpn_' + e) || 0);
  if (n >= OTP_.PER_MAIL) throw new Error('ขอรหัสบ่อยเกินไป รอ 15 นาทีแล้วลองใหม่');
  const day = 'otpday_' + Utilities.formatDate(new Date(), CFG.TZ, 'yyyyMMdd');
  const dn = Number(props.getProperty(day) || 0);
  if (dn >= OTP_.DAY_MAX || MailApp.getRemainingDailyQuota() < 5)
    throw new Error('วันนี้ส่งรหัสครบจำนวนแล้ว กรุณาลองใหม่พรุ่งนี้ หรือติดต่อผู้ดูแลระบบ');
  const code = String(100000 + (parseInt(Utilities.getUuid().replace(/-/g, '').slice(0, 12), 16) % 900000));
  c.put('otp_' + e, JSON.stringify({ h: otpHash_(e + '|' + code), t: 0 }), OTP_.TTL);
  c.put('otpn_' + e, String(n + 1), 900);
  props.setProperty(day, String(dn + 1));
  MailApp.sendEmail({
    to: e, name: CFG.APP,
    subject: 'รหัสเข้าสู่ระบบ ' + CFG.APP + ': ' + code,
    body: 'รหัสเข้าสู่ระบบ ' + CFG.APP + ' ของคุณคือ ' + code + '\n' +
          'ใช้ได้ 10 นาที ห้ามบอกรหัสนี้กับผู้อื่น ถ้าไม่ได้ขอรหัส ไม่ต้องทำอะไร\n\n' +
          'Your ' + CFG.APP + ' sign-in code is ' + code + '\n' +
          'It is valid for 10 minutes. Do not share it. If you did not request it, ignore this email.\n\n' +
          CFG.ORG
  });
  return { sent: true, email: e };
}

/** ยืนยันรหัส ได้บัตรผ่าน ไม่หมดอายุ จนกว่าจะออกจากระบบ) */
function otpVerify(email, code) {
  const e = String(email || '').trim().toLowerCase(), c = CacheService.getScriptCache();
  const v = c.get('otp_' + e);
  if (!v) throw new Error('รหัสหมดอายุแล้ว กรุณาขอรหัสใหม่');
  const o = JSON.parse(v);
  if (o.t >= OTP_.MAX_TRY) { c.remove('otp_' + e); throw new Error('ใส่รหัสผิดหลายครั้ง กรุณาขอรหัสใหม่'); }
  if (otpHash_(e + '|' + String(code || '').replace(/\D/g, '')) !== o.h) {
    o.t++; c.put('otp_' + e, JSON.stringify(o), OTP_.TTL);
    throw new Error('รหัสไม่ถูกต้อง');
  }
  c.remove('otp_' + e);
  if (!resolveUser_(e)) throw new Error('บัญชีนี้ยังไม่มีสิทธิ์เข้าระบบ กรุณาติดต่อผู้ดูแลระบบ');
  const tok = sessionNew_(e, false);
  return { tok: tok, url: appBase_() };
}

/** หน้าเข้าสู่ระบบตรวจบัตรผ่านที่จำไว้ในเบราว์เซอร์ */
function sessionCheck(tok) {
  const e = sessionEmail_(tok);
  return e ? { email: e, url: appBase_() } : null;
}

function otpLogout(tok) {
  if (sesValid_(tok)) {
    CacheService.getScriptCache().removeAll(['ses_' + tok, 'sesg_' + tok]);              // บัตรรุ่นเก่าใน cache
    try { PropertiesService.getScriptProperties().deleteProperty(SES_.P + tok); } catch (x) {}   // บัตรถาวร
  }
  return true;
}

/** ผู้เข้าด้วยรหัสอีเมล: หน้าเว็บเรียกเซิร์ฟเวอร์ผ่านตัวนี้พร้อมบัตรผ่าน · เรียกได้เฉพาะรายชื่อด้านล่าง ทุกตัวตรวจสิทธิ์ในตัวเองอีกชั้น */
function appCall(tok, fn, args) {
  // รายชื่อคำสั่งชุดเดียวกับ API อยู่ใน callAllowed_ (Api.js)
  if (!sessionEmail_(tok)) throw new Error('หมดเวลาการเข้าใช้ กรุณาเข้าสู่ระบบใหม่');
  SES_TOK_ = String(tok);
  return callAllowed_(String(fn), Array.isArray(args) ? args : []);
}

// ตัวครอบ google.script.run อยู่ที่หน้าเว็บ assets/api.js

/** รันจาก Editor ครั้งเดียวเพื่อให้เจ้าของกดอนุญาตการส่งอีเมล (ไม่ส่งอีเมลจริง) */
function CHECK_mail() {
  const q = MailApp.getRemainingDailyQuota();
  Logger.log('ส่งอีเมลได้อีก %s ฉบับวันนี้', q);
  return q;
}

















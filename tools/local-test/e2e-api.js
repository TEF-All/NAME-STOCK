/**
 * ทดสอบครบรอบผ่าน API (เหมือนหน้าเว็บเรียก) บนบริการจำลอง · ข้อมูลสมมติเท่านั้น (อีเมล @example.com/.org)
 * รัน: node tools/local-test/e2e-api.js
 */
'use strict';
const { load } = require('./mock-gas');
const G = load({ owner: 'owner@example.com' });
let pass = 0, fail = 0;
function ok(cond, msg) { if (cond) { pass++; console.log('  ✓ ' + msg); } else { fail++; console.log('  ✗ ' + msg); } }
function step(t) { console.log('\n■ ' + t); }
function call(tok, fn, ...args) {
  const r = G.post({ v: 1, fn: fn, args: args, ses: tok || undefined });
  if (!r.ok) throw new Error(fn + ' → ' + r.code + ': ' + r.error);
  return r.data;
}
function fails(tok, fn, args, re, msg) {
  const r = G.post({ v: 1, fn: fn, args: args || [], ses: tok || undefined });
  ok(!r.ok && (!re || re.test(r.error + ' ' + r.code)), msg + (r.ok ? ' (ผ่านทั้งที่ไม่ควร)' : ' → ' + r.error));
}
function otpLogin(email) {
  call(null, 'otpRequest', email);
  const m = G.mails[G.mails.length - 1];
  const code = /(\d{6})/.exec(m.subject)[1];
  return call(null, 'otpVerify', email, code).tok;
}
function googleLogin(email) {
  const idt = 'test.' + Buffer.from(email).toString('base64url') + '.sig';
  return call(null, 'googleSession', idt).tok;
}
const ss = () => G.ctx.SpreadsheetApp.openById(G.props.SHEET_ID);
const tab = n => ss().getSheetByName(n);
const rows = n => { const s = tab(n); return s.getLastRow() < 2 ? [] : s.getRange(2, 1, s.getLastRow() - 1, s.getLastColumn()).getValues(); };
const bal = (tok, code) => { const it = call(ADM_ || tok, 'adminBoot').items.find(x => x.code === code); return it ? it.bal : undefined; };
let ADM_ = null;

// ───────────────────────────────────────────────────────────────
step('1 ตั้งค่าครั้งแรก (SETUP_1_start) + ค่าตั้ง');
G.ctx.SETUP_1_start();
Object.assign(G.props, { FRONT_URL: 'http://localhost:8765/', GIS_CLIENT_ID: 'test-client', STAFF_DOMAIN: 'example.org',
                         ORG_NAME: 'ชมรมทดสอบระบบ', ITEM_PREFIX: 'ITEM' });
ok(ss().getSpreadsheetTimeZone() === 'Asia/Bangkok', 'โซนเวลาชีต = Asia/Bangkok (fix 4)');
ok(ss().getSheets().length === 24, 'ชีตมี 24 แท็บ');
ok(rows('LEDGER_เคลื่อนไหว').length === 0 && rows('ทะเบียนพัสดุ').length === 0, 'ไม่มีข้อมูลติดมา (ทะเบียน/บัญชีว่าง)');
ok(G.ctx.SETUP_2_check().ok, 'SETUP_2_check พร้อมใช้งาน');
// ผู้ใช้สมมติ (ไม่ใช่อีเมลจริง)
G.ctx.SETUP_addUser('admin2@example.com', 'ผู้ดูแลคนที่ 2', 'ผู้ดูแลระบบ', 'ADMIN', 1, false);
G.ctx.SETUP_addUser('auditor@example.com', 'ผู้ตรวจสอบ', 'ผู้ตรวจสอบ', 'AUDITOR', '', false);
G.ctx.bumpData_();
const again = G.ctx.SETUP_1_start();
ok(rows('MASTER_ผู้ใช้').length === 3 && ss().getSheets().length === 24, 'รัน SETUP_1_start ซ้ำ ไม่สร้างซ้ำ/ไม่ทับข้อมูล');

step('2 เข้าสู่ระบบ (รหัสทางอีเมล + Google) และบทบาท');
const ADM = otpLogin('owner@example.com'); ADM_ = ADM;
const ADM2 = otpLogin('admin2@example.com');
const STF = googleLogin('somsri@example.org');
const EXT = otpLogin('club.one@example.com');
const AUD = otpLogin('auditor@example.com');
ok(call(ADM, 'meInfo').role === 'ADMIN', 'owner = ADMIN (ผู้ดูแลคนแรกจาก SETUP)');
ok(call(STF, 'meInfo').role === 'STAFF', 'อีเมลโดเมน STAFF_DOMAIN = STAFF อัตโนมัติ (เข้าด้วย Google)');
ok(call(EXT, 'meInfo').role === 'EXTERNAL_NEW', 'คนนอกครั้งแรก = ต้องกรอกแบบสอบถาม');
ok(call(AUD, 'meInfo').role === 'AUDITOR', 'auditor = AUDITOR');
fails(null, 'stockList', [], /AUTH_REQUIRED/, 'ไม่มีบัตรผ่าน เรียกข้อมูลไม่ได้');
call(EXT, 'submitSurvey', { name: 'สมชาย ทดสอบ', phone: '0800000000', org: 'สโมสรทดสอบหนึ่ง', purpose: 'ขอยืมอุปกรณ์จัดกิจกรรม', want: ['ขอเบิก', 'คืน'] });
G.ctx.bumpData_();
ok(call(EXT, 'meInfo').role === 'EXTERNAL', 'กรอกแบบสอบถามแล้ว = EXTERNAL');

step('3 ผู้ดูแล: เพิ่มรายการ · รับของเข้า · ปรับยอด');
const a1 = call(ADM, 'adminAddItem', { tok: ADM, name: 'กรวยจราจร', cat: 'อุปกรณ์กิจกรรม', sub: 'กรวย', loc: 'คลังหลัก', unit: 'อัน', qty: 10 });
const a2 = call(ADM, 'adminAddItem', { tok: ADM, name: 'เสื้อทีม สีฟ้า', cat: 'เครื่องแต่งกาย', sub: 'เสื้อ', loc: 'คลังหลัก', unit: 'ตัว', qty: 5 });
const a3 = call(ADM, 'adminAddItem', { tok: ADM, name: 'วิทยุสื่อสาร', cat: 'อุปกรณ์สื่อสาร', sub: 'วิทยุ', loc: 'คลังหลัก', unit: 'เครื่อง', qty: 0 });
ok(a1.code === 'ITEM-001' && a2.code === 'ITEM-002' && a3.code === 'ITEM-003', 'รหัสต่อเนื่อง ITEM-001..003 ตาม ITEM_PREFIX');
call(ADM, 'adminReceive', { tok: ADM, code: 'ITEM-003', qty: 4, source: 'จัดซื้อ', doc: 'PO-1', note: '' });
ok(bal(ADM, 'ITEM-001') === 10 && bal(ADM, 'ITEM-002') === 5 && bal(ADM, 'ITEM-003') === 4, 'คงเหลือ 10 / 5 / 4 (จาก LEDGER)');
const adj = call(ADM, 'adminAdjust', { tok: ADM, code: 'ITEM-001', real: 12, reason: 'รับเข้าไม่ได้ลงระบบ', note: '' });
ok(adj.changed && bal(ADM, 'ITEM-001') === 12, 'ปรับยอด ITEM-001 → 12');
const ab = call(ADM, 'adminBoot');
ok(ab && Array.isArray(ab.items) && ab.items.length === 3, 'adminBoot เห็น 3 รายการ');
fails(STF, 'adminAddItem', [{ name: 'x', cat: 'x' }], /ผู้ดูแลระบบเท่านั้น/, 'STAFF เพิ่มรายการไม่ได้');
fails(AUD, 'adminReceive', [{ code: 'ITEM-001', qty: 1 }], /ผู้ตรวจสอบ|ผู้ดูแล/, 'AUDITOR รับของเข้าไม่ได้');

step('4 คนนอก: ขอเบิก-คืน → ผู้ดูแลอนุมัติ → ผู้ขอลงนาม → จ่าย → แจ้งคืน → ตรวจรับคืน');
const boot = call(EXT, 'requestBoot');
ok(boot && boot.items && boot.items.length >= 3, 'requestBoot ได้รายการพัสดุ');
const today = new Date().toISOString().slice(0, 10);
const due = new Date(Date.now() + 7 * 864e5).toISOString().slice(0, 10);
const r1 = call(EXT, 'createRequisition', { kind: 'เบิก-คืน', type: '', org: '', event: 'กิจกรรมทดสอบ', purpose: 'ใช้ในกิจกรรม',
  dateOut: today, dueDate: due, fileUrl: '', dept: '', lines: [{ code: 'ITEM-001', qty: 3, units: [] }] });
const REQ1 = r1.id || r1.reqId;
ok(/^REQ-\d{4}-\d{4}$/.test(REQ1), 'สร้างคำขอ ' + REQ1 + ' สถานะ ' + (r1.status || ''));
fails(EXT, 'homeDispatch', [REQ1], /ผู้ดูแลระบบเท่านั้น|เจ้าหน้าที่/, 'คนนอกจ่ายของเองไม่ได้');
const hb = call(ADM, 'homeBoot');
ok(hb.isAdmin && JSON.stringify(hb.admin).indexOf(REQ1) >= 0, 'หน้าแรกผู้ดูแลเห็นคำขอรอตรวจ');
call(ADM, 'reviewRequest', REQ1, 'approve', '');
call(EXT, 'signRequest', REQ1);
call(ADM, 'homeDispatch', REQ1);
ok(bal(ADM, 'ITEM-001') === 9, 'จ่ายแล้ว ITEM-001 เหลือ 9');
const doc = call(EXT, 'getRequisition', REQ1, EXT);
const line = (doc.lines || [])[0];
ok(line && line.lineId, 'อ่านเอกสารได้ มีรหัสบรรทัด');
call(EXT, 'returnItems', { reqId: REQ1, tok: EXT, lines: [{ lineId: line.lineId, qtyBack: 3, qtyDamaged: 0, condition: '' }] });
const rtn = rows('REQ_แจ้งคืน');
ok(rtn.length === 1 && rtn[0][7] === 'รอแอดมินตรวจรับ', 'แจ้งคืนแล้ว รอตรวจรับ');
call(ADM, 'homeConfirmReturn', rtn[0][0]);
ok(bal(ADM, 'ITEM-001') === 12, 'ตรวจรับคืนแล้ว ITEM-001 กลับเป็น 12');
const my = call(EXT, 'myRequests');
ok(JSON.stringify(my).indexOf(REQ1) >= 0, 'คำขอของฉัน เห็น ' + REQ1);

step('5 เจ้าหน้าที่: ขอจ่ายออก (ภายใน) → อนุมัติ → ลงนาม → จ่าย · ผู้ดูแลจ่ายตรง (DIS) · ย้ายที่เก็บ');
const r2 = call(STF, 'createRequisition', { kind: 'จ่ายออก', type: 'ภายในองค์กร', org: '', event: 'แจกทีม', purpose: 'แจกเสื้อทีม',
  dateOut: today, dueDate: '', fileUrl: '', dept: 'ธุรการ', lines: [{ code: 'ITEM-002', qty: 2, units: [] }] });
const REQ2 = r2.id || r2.reqId;
fails(ADM2, 'homeDispatch', [REQ2], /อนุมัติ|ลงนาม|สถานะ|รอตรวจ/, 'ยังไม่อนุมัติ จ่ายไม่ได้');
call(ADM2, 'reviewRequest', REQ2, 'approve', '');
call(STF, 'signRequest', REQ2);
call(ADM2, 'homeDispatch', REQ2);
ok(bal(ADM, 'ITEM-002') === 3, 'จ่ายออกแล้ว ITEM-002 เหลือ 3');
const dis = call(ADM, 'createDisbursement', { receiver: 'สโมสรทดสอบสอง', receiverType: 'สโมสร / ชมรม', place: 'คลังหลัก', date: today,
  purpose: 'สนับสนุนกิจกรรม', proofUrl: '', lines: [{ code: 'ITEM-003', qty: 1, cost: 0 }] });
ok(dis && bal(ADM, 'ITEM-003') === 3, 'จ่ายตรง (DIS) ITEM-003 เหลือ 3');
fails(ADM, 'createDisbursement', [{ receiver: 'x', lines: [{ code: 'ITEM-003', qty: 99 }] }], /คงเหลือ/, 'จ่ายเกินคงเหลือไม่ได้');
call(ADM, 'homeBoot');
const places = call(STF, 'getBoot').places || [];
call(STF, 'createTransfer', { kind: 'ชั่วคราว', code: 'ITEM-001', qty: 2, from: 'คลังหลัก', to: 'ห้องประชุม', date: today, mover: 'สมศรี' });
ok(rows('MOV_ย้าย').length === 1, 'ย้ายที่เก็บ บันทึกใน MOV_ย้าย');
fails(EXT, 'createTransfer', [{ code: 'ITEM-001', qty: 1, to: 'x' }], /เฉพาะ|ภายนอก/, 'คนนอกย้ายของไม่ได้');

step('6 ตรวจนับ: บันทึกผลนับ → คงเหลือปรับตามยอดนับ · ยกเลิกผลนับ → คงเหลือกลับ');
const bs = call(STF, 'getBootstrapData');
ok(bs.progress && bs.progress.total === 3 && bs.progress.done === 0, 'ความคืบหน้า 0/3');
const it2 = call(STF, 'getItem', 'ITEM-002');
ok(it2.qtyOld === 3, 'หน้าตรวจนับแสดงยอดในระบบ = 3 (จาก LEDGER ไม่ใช่คอลัมน์ G)');
fails(STF, 'saveRecon', [{ code: 'ITEM-002', countedQty: 2, status: 'ขาด — หาไม่พบ', counter: 'สมศรี', note: '' }], /หมายเหตุ/, 'นับไม่ตรงต้องมีหมายเหตุ');
const sr = call(STF, 'saveRecon', { code: 'ITEM-002', countedQty: 2, status: 'ขาด — หาไม่พบ', onShelf: 'ขึ้นชั้นแล้ว', location: 'คลังหลัก',
  condition: 'พร้อมใช้งาน', counter: 'สมศรี', note: 'ตรวจพบ 2 ตัว' });
ok(sr.reconId && sr.diff === -1, 'บันทึกผลนับ ' + sr.reconId + ' ส่วนต่าง −1');
ok(bal(ADM, 'ITEM-002') === 2, 'คงเหลือปรับเป็นยอดนับ 2 อัตโนมัติ');
ok(call(STF, 'getProgress').done === 1, 'ความคืบหน้า 1/3');
const dd = call(STF, 'dashData');
ok(dd.done === 1 && dd.shortRows === 1, 'สรุปภาพรวม: นับแล้ว 1 · ขาด 1 รายการ');
const fd = call(STF, 'facetData');
ok(fd.items.length === 3, 'ตัวช่วยเลือกหมวดเห็น 3 รายการ');
const pr = call(STF, 'getPrintHtml', sr);
ok(/ชมรมทดสอบระบบ/.test(pr) && /ยอดในระบบ/.test(pr), 'ใบพิมพ์ตรวจนับมีชื่อหน่วยงานจากค่าตั้ง');
fails(STF, 'undoRecon', [{ reconId: sr.reconId }], /ADMIN/, 'STAFF ยกเลิกผลนับไม่ได้');
call(ADM, 'undoRecon', { reconId: sr.reconId, reason: 'ทดสอบ' });
ok(bal(ADM, 'ITEM-002') === 3, 'ยกเลิกผลนับแล้ว คงเหลือกลับเป็น 3');
ok(call(STF, 'getProgress').done === 0, 'ความคืบหน้ากลับเป็น 0/3');

step('7 ปิดรายการ / ลบ / เปิดใหม่ (fix 2 และ fix 5)');
const logN = () => rows('STATUS_LOG').length;
const ledN = () => rows('LEDGER_เคลื่อนไหว').length;
let n0 = logN(), l0 = ledN();
const rt = call(ADM, 'adminRetire', { tok: ADM, reason: 'เลิกใช้ จบงานแล้ว', list: [{ code: 'ITEM-003', mode: 'zero' }] });
ok(rt.closed === 1 && bal(ADM, 'ITEM-003') === 0 && logN() === n0 + 1 && ledN() === l0 + 1, 'ปิดรายการ ITEM-003 ตัดเหลือ 0');
const rt2 = call(ADM, 'adminRetire', { tok: ADM, reason: 'เลิกใช้ จบงานแล้ว', list: [{ code: 'ITEM-003', mode: 'zero' }] });
ok(rt2.closed === 0 && rt2.unchanged.length === 1 && logN() === n0 + 1 && ledN() === l0 + 1, 'กดซ้ำ ไม่ลง STATUS_LOG/LEDGER ซ้ำ (fix 5)');
const cl = call(STF, 'countListItems');
ok(cl.length === 2 && !cl.some(x => x.code === 'ITEM-003'), 'หน้าตรวจนับไม่แสดงรายการเลิกใช้ (fix 2)');
ok(call(STF, 'getProgress').total === 2 && call(STF, 'getBootstrapData').progress.total === 2, 'ความคืบหน้านับเฉพาะรายการใช้งาน (fix 2)');
ok(call(STF, 'facetData').items.length === 2, 'ตัวช่วยเลือกหมวดไม่แสดงรายการเลิกใช้');
call(ADM, 'adminReopen', { tok: ADM, list: [{ code: 'ITEM-003' }], reason: 'เปิดใช้อีกครั้ง' });
ok(call(STF, 'countListItems').length === 3, 'เปิดใช้งานอีกครั้ง กลับมาในหน้าตรวจนับ');
n0 = logN(); l0 = ledN();
call(ADM, 'adminDeleteItem', 'ITEM-002', 'ผู้ดูแลลบรายการ (ไม่มีของแล้ว)');
ok(bal(ADM, 'ITEM-002') === 0 && rows('ทะเบียนพัสดุ').length === 3, 'ลบรายการ = เลิกใช้ + ตัดยอด 0 แถวยังอยู่');
const del2 = G.post({ v: 1, fn: 'adminDeleteItem', args: ['ITEM-002', 'กดซ้ำ'], ses: ADM });
ok(logN() === n0 + 1 && ledN() === l0 + 1, 'ลบซ้ำ (ดับเบิลคลิก) ไม่เกิดบรรทัดซ้ำ (fix 5)' + (del2.ok ? '' : ' · ' + del2.error));

step('8 สำเนา Firestore (fix 1) · ปิดอยู่ค่าเริ่มต้น · ใช้สำเนาเฉพาะที่ใหม่กว่าการบันทึกล่าสุด');
ok(!G.ctx.firestoreOn_(), 'ไม่ตั้ง FIRESTORE_PROJECT = ปิด');
const ver = Number(G.ctx.dataVer_());
ok(G.ctx.firestoreFresh_({ generatedAt: new Date(ver - 60000).toISOString() }) === false, 'สำเนาเก่ากว่าการบันทึกล่าสุด → ไม่ใช้ (อ่านชีต)');
ok(G.ctx.firestoreFresh_({ generatedAt: new Date(ver + 1000).toISOString() }) === true, 'สำเนาใหม่กว่า → ใช้ได้');

step('9 ความปลอดภัยพื้นฐาน');
fails(AUD, 'createRequisition', [{ kind: 'เบิก-คืน', lines: [{ code: 'ITEM-001', qty: 1 }] }], /ผู้ตรวจสอบ/, 'AUDITOR สร้างคำขอไม่ได้');
fails(ADM, 'eval', [], /NOT_ALLOWED/, 'คำสั่งที่ไม่อยู่ในรายชื่อ เรียกไม่ได้');
ADM_ = ADM2; call(ADM, 'otpLogout', ADM);
fails(ADM, 'meInfo', [], /AUTH_EXPIRED/, 'ออกจากระบบแล้ว บัตรผ่านใช้ไม่ได้');
G.props.EXTERNAL_SIGNUP = '0'; G.ctx.bumpData_();
fails(null, 'otpVerify', ['new.person@example.com', '000000'], /หมดอายุ|ไม่ถูกต้อง|สิทธิ์/, 'EXTERNAL_SIGNUP=0 คนนอกใหม่เข้าไม่ได้');
G.props.EXTERNAL_SIGNUP = '1';

console.log('\nตาราง: ' + ss().getSheets().filter(s => s.getLastRow() > 1 && /^(LEDGER|REQ|DIS|MOV|STATUS|RECON|DOC|MASTER|ทะเบียน)/.test(s.getName()))
  .map(s => s.getName() + ' ' + (s.getLastRow() - 1)).join(' · '));
if (G.unknown.size) console.log('เมธอดที่ตัวจำลองไม่รู้จัก: ' + [...G.unknown].join(', '));
console.log('\nผล: ผ่าน ' + pass + ' · ไม่ผ่าน ' + fail);
process.exit(fail ? 1 : 0);

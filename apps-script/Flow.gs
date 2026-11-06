/**
 * Flow.gs — workflow เบิก-คืน / จ่ายออก
 * เปิดด้วย Script Property REVIEW_FLOW=1 · ไม่ตั้ง = ทำงานแบบ เดิม (อนุมัติทันที)
 *
 *   ส่งคำขอ → รอตรวจ → แอดมินอนุมัติ (จองของ + ลงนามผู้อนุมัติ) / ไม่อนุมัติ (มีเหตุผล) / ผู้ขอยกเลิก
 *   → ผู้ขอลงนามอิเล็กทรอนิกส์ หรืออัปโหลดใบที่ลงนามแล้ว → แอดมินจ่ายของ (ตัดยอด)
 *   → เบิก-คืน: แจ้งคืน → แอดมินตรวจรับ · จ่ายออก: ปิดเมื่อจ่าย
 *
 * คอลัมน์เพิ่มท้ายแท็บ REQ_หัวเรื่อง (P–V) ไม่แตะคอลัมน์เดิม · ประวัติทุกขั้นลงแท็บ DOC_LOG (เพิ่มอย่างเดียว ไม่ลบแถว)
 */
const FLOW_ = {
  COL: { kind: 16, by: 17, at: 18, note: 19, sigReq: 20, sigApv: 21, signed: 22 },
  HEAD: ['ลักษณะคำขอ', 'ตรวจโดย', 'ตรวจเมื่อ', 'ความเห็นผู้ตรวจ', 'ลงนามผู้ขอ', 'ลงนามผู้อนุมัติ', 'ใบลงนาม_ลิงก์'],
  LOG_TAB: 'DOC_LOG',
  LOG_HEAD: ['เวลา', 'เอกสาร', 'จาก', 'เป็น', 'ผู้ทำ', 'เข้าระบบด้วย', 'หมายเหตุ', 'รหัสตรวจสอบ'],
  BORROW: 'เบิก-คืน', GIVE: 'จ่ายออก',
  ST: { REVIEW: 'รอตรวจ', OK: 'อนุมัติแล้ว', NO: 'ไม่อนุมัติ', CANCEL: 'ยกเลิก',
        OUT: 'จ่ายของออกแล้ว', GIVEN: 'จ่ายออกแล้ว', PART: 'คืนไม่ครบ', DONE: 'คืนครบ' },
  CONSENT: 'ข้าพเจ้ายืนยันรายการในเอกสารนี้ และตกลงลงนามด้วยวิธีอิเล็กทรอนิกส์ (พ.ร.บ.ธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. 2544)'
};

function reviewOn_() { return prop_('REVIEW_FLOW') === '1'; }
function reqKind_(v) { return String(v || '').trim() === FLOW_.GIVE ? FLOW_.GIVE : FLOW_.BORROW; }

/** หัวคอลัมน์ P–V ของ REQ_หัวเรื่อง (เติมครั้งแรก ไม่แตะข้อมูลเดิม) */
function ensureReqCols_(hs) {
  const c0 = FLOW_.COL.kind, n = FLOW_.HEAD.length;
  if (hs.getMaxColumns() < c0 + n - 1) hs.insertColumnsAfter(hs.getMaxColumns(), c0 + n - 1 - hs.getMaxColumns());
  const cur = hs.getRange(1, c0, 1, n).getValues()[0];
  if (cur.join('|') !== FLOW_.HEAD.join('|'))
    hs.getRange(1, c0, 1, n).setValues([FLOW_.HEAD]).setBackground('#0A2342').setFontColor('#FFFFFF').setFontWeight('bold').setWrap(true);
}

function docLogSheet_() {
  const ss = ss_();
  let sh = ss.getSheetByName(FLOW_.LOG_TAB);
  if (!sh) {
    sh = ss.insertSheet(FLOW_.LOG_TAB);
    sh.appendRow(FLOW_.LOG_HEAD);
    sh.getRange(1, 1, 1, FLOW_.LOG_HEAD.length).setBackground('#0A2342').setFontColor('#FFFFFF').setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

function docLog_(id, from, to, me, note, hash) {
  docLogSheet_().appendRow([new Date(), id, from || '', to || '', (me && me.email) || '',
                            (me && me.authBy) || '', note || '', hash || '']);
}

/** อ่านเอกสารเบิก 1 ใบ: หัวเรื่อง 15 คอลัมน์เดิม + คอลัมน์ P–V */
function reqRead_(reqId) {
  const id = String(reqId || '').trim().toUpperCase();
  if (!id) throw new Error('กรุณาระบุเลขที่เอกสาร');
  const hs = sheet_(CFG.TABS.REQ_H);
  ensureReqCols_(hs);
  const row = findRow_(hs, 1, id);
  if (!row) throw new Error('ไม่พบเอกสาร ' + id);
  const h = hs.getRange(row, 1, 1, FLOW_.COL.signed).getValues()[0];
  const C = FLOW_.COL;
  return { id: id, hs: hs, row: row, h: h, status: cleanText_(h[12]), owner: String(h[2]).trim().toLowerCase(),
           kind: reqKind_(h[C.kind - 1]), sigReq: sigParse_(h[C.sigReq - 1]), sigApv: sigParse_(h[C.sigApv - 1]),
           signed: String(h[C.signed - 1] || '').trim(), note: cleanText_(h[C.note - 1]) };
}

/** รายการทุกเอกสาร {REQ_ID: [lines]} อ่านแท็บครั้งเดียว ใช้ในหน้ารวม */
function linesIndex_() {
  const ls = sheet_(CFG.TABS.REQ_L), last = ls.getLastRow(), m = {};
  if (last < 2) return m;
  ls.getRange(2, 1, last - 1, HEAD.REQ_L.length).getValues().forEach(r => {
    const id = String(r[1]).trim(); if (!id) return;
    (m[id] = m[id] || []).push({ lineId: String(r[0]).trim(), code: String(r[2]).trim(), name: cleanText_(r[3]), qty: toNum_(r[4]),
                                 unit: cleanText_(r[5]), back: toNum_(r[8]), dmg: toNum_(r[10]), lost: toNum_(r[11]) });
  });
  return m;
}
function reqLines_(id, idx) { return ((idx || linesIndex_())[id]) || []; }

function setStatus_(R, to) { R.hs.getRange(R.row, 13).setValue(to); }
function setCol_(R, col, v) { R.hs.getRange(R.row, col).setValue(v); }

/** ของที่จองไว้: เอกสาร "อนุมัติแล้ว" ที่ยังไม่จ่าย {รหัส: จำนวน} */
function reservedMap_(excludeId) {
  const hs = sheet_(CFG.TABS.REQ_H), hl = hs.getLastRow();
  const ids = {};
  if (hl >= 2) hs.getRange(2, 1, hl - 1, 13).getValues().forEach(r => {
    const id = String(r[0]).trim();
    if (id && id !== excludeId && String(r[12]).trim() === FLOW_.ST.OK) ids[id] = true;
  });
  const m = {}, ls = sheet_(CFG.TABS.REQ_L), ll = ls.getLastRow();
  if (ll >= 2) ls.getRange(2, 1, ll - 1, 5).getValues().forEach(r => {
    if (!ids[String(r[1]).trim()]) return;
    const c = String(r[2]).trim(); m[c] = (m[c] || 0) + toNum_(r[4]);
  });
  return m;
}

/** ลายนิ้วมือเนื้อหาเอกสาร ณ ตอนลงนาม: เลขที่ ผู้ขอ ลักษณะ วันที่ และรายการ — เนื้อหาเปลี่ยน = ลายเซ็นใช้ไม่ได้ */
function docHash_(R, idx) {
  const lines = reqLines_(R.id, idx).map(l => [l.code, l.qty]).sort();
  return otpHash_(JSON.stringify([R.id, R.owner, R.kind, fmtD_(R.h[9]), fmtD_(R.h[10]), lines]));
}

function sigMake_(me, hash) {
  return JSON.stringify({ n: String(me.name || ''), e: String(me.email || ''), t: new Date().toISOString(),
                          via: me.authBy || '', h: hash });
}
function sigParse_(v) {
  const s = String(v || '').trim();
  if (!s) return null;
  try { const o = JSON.parse(s); return o && o.e ? o : null; } catch (e) { return null; }
}
function sigText_(o) {
  if (!o) return '';
  return o.n + ' (' + o.e + ') · ' + Utilities.formatDate(new Date(o.t), CFG.TZ, 'dd/MM/yyyy HH:mm') + ' · รหัส ' + String(o.h).slice(0, 8);
}

/** พร้อมจ่ายหรือยัง: ลงนามอิเล็กทรอนิกส์ครบ 2 ฝ่ายและเนื้อหาไม่เปลี่ยน หรือมีใบลงนามที่อัปโหลดแล้ว */
function signState_(R, hash, idx) {
  if (!R.sigReq && !R.sigApv) return { eReq: false, eApv: false, upload: !!R.signed, ready: !!R.signed, changed: false };
  const h = hash || docHash_(R, idx);
  const eReq = !!(R.sigReq && R.sigReq.h === h), eApv = !!(R.sigApv && R.sigApv.h === h);
  const changed = !!((R.sigReq && R.sigReq.h !== h) || (R.sigApv && R.sigApv.h !== h));
  return { eReq: eReq, eApv: eApv, upload: !!R.signed, ready: (eReq && eApv) || !!R.signed, changed: changed };
}

/**
 * จ่ายออก : ผู้ใช้ภายนอกขอจ่ายออกเองไม่ได้ ให้ทำหนังสือถึงหน่วยงาน
 * เจ้าหน้าที่หรือแอดมินเป็นผู้ทำเรื่องแทน · จ่ายออกให้หน่วยงานภายนอกต้องระบุชื่อหน่วยงานและแนบหนังสือ
 */
function giveRules_(me, kind, p) {
  if (kind !== FLOW_.GIVE) return;
  if (isExternal_(me))
    throw new Error('ผู้ใช้ภายนอกขอจ่ายออกเองไม่ได้ กรุณาทำหนังสือขอรับการสนับสนุนถึงหน่วยงาน เจ้าหน้าที่จะทำเรื่องให้');
  if (String(p.type || '').trim() === 'ภายนอกองค์กร') {
    if (!cleanText_(p.org)) throw new Error('จ่ายออกให้หน่วยงานภายนอก กรุณาระบุชื่อหน่วยงาน');
    if (!/^https?:\/\//.test(String(p.fileUrl || '').trim()))
      throw new Error('จ่ายออกให้หน่วยงานภายนอก ต้องแนบหนังสือขอรับการสนับสนุน (ไฟล์หรือลิงก์)');
  }
}

/** createReq_ เรียกหลังบันทึกเอกสาร: ใส่ลักษณะคำขอ ตั้งสถานะ และลงประวัติ */
function reqAfterCreate_(id, kind, me, status) {
  const R = reqRead_(id);
  setCol_(R, FLOW_.COL.kind, kind);
  if (reviewOn_()) setStatus_(R, FLOW_.ST.REVIEW);
  const st = reviewOn_() ? FLOW_.ST.REVIEW : status;
  docLog_(id, '', st, me, 'สร้างคำขอ ' + kind);
  return st;
}

// ═══ คำสั่งที่หน้าเว็บเรียก (อยู่ในรายชื่อ callAllowed_) ═══

/** แอดมินตรวจคำขอ: decision 'approve' | 'reject' · อนุมัติ = จองของ + ลงนามผู้อนุมัติ */
function reviewRequest(reqId, decision, note) {
  const me = admOnly_();
  const lock = lock_();
  try {
    const R = reqRead_(reqId);
    if (R.status !== FLOW_.ST.REVIEW) throw new Error('เอกสาร ' + R.id + ' ไม่ได้อยู่ในสถานะรอตรวจ (ตอนนี้: ' + R.status + ')');
    if (R.owner === String(me.email).toLowerCase()) throw new Error('อนุมัติคำขอของตัวเองไม่ได้ ให้แอดมินอีกคนตรวจ');
    const why = cleanText_(note).slice(0, 300);
    const C = FLOW_.COL;
    if (decision === 'reject') {
      if (why.length < 3) throw new Error('กรุณาระบุเหตุผลที่ไม่อนุมัติ');
      setStatus_(R, FLOW_.ST.NO);
      R.hs.getRange(R.row, C.by, 1, 3).setValues([[me.email, new Date(), why]]);
      radioReleaseDoc_(R.id);
      docLog_(R.id, R.status, FLOW_.ST.NO, me, why);
      SpreadsheetApp.flush();
      return { ok: true, id: R.id, status: FLOW_.ST.NO };
    }
    if (decision !== 'approve') throw new Error('คำสั่งไม่ถูกต้อง');
    // ของต้องว่างพอ ณ ตอนอนุมัติ (หักที่อนุมัติไปแล้วของใบอื่น)
    const bal = balanceMap_(), res = reservedMap_(R.id), items = indexItems_();
    reqLines_(R.id).forEach(l => {
      const it = items[l.code];
      const have = (bal[l.code] === undefined ? (it ? it.qtyOld : 0) : bal[l.code]) - (res[l.code] || 0);
      if (l.qty > have) throw new Error('รหัส ' + l.code + ' ว่างเหลือ ' + Math.max(0, have) + ' ไม่พอ ' + l.qty + ' ไม่อนุมัติหรือรอของเข้าก่อน');
    });
    const hash = docHash_(R);
    setStatus_(R, FLOW_.ST.OK);
    R.hs.getRange(R.row, C.by, 1, 3).setValues([[me.email, new Date(), why]]);
    setCol_(R, C.sigApv, sigMake_(me, hash));
    docLog_(R.id, R.status, FLOW_.ST.OK, me, 'อนุมัติและลงนามผู้อนุมัติ' + (why ? ' · ' + why : ''), hash);
    SpreadsheetApp.flush();
    return { ok: true, id: R.id, status: FLOW_.ST.OK };
  } finally { lock.releaseLock(); }
}

/** ยกเลิกคำขอ: เจ้าของหรือแอดมิน ก่อนจ่ายของ */
function cancelRequest(reqId, reason) {
  const me = denyAudit_(requireUser_());
  const lock = lock_();
  try {
    const R = reqRead_(reqId);
    const isAdmin = String(me.role).toUpperCase() === 'ADMIN';
    if (R.owner !== String(me.email).toLowerCase() && !isAdmin) throw new Error('ไม่พบเอกสาร ' + R.id + ' ของบัญชีนี้');
    if ([FLOW_.ST.REVIEW, FLOW_.ST.OK].indexOf(R.status) < 0) throw new Error('ยกเลิกได้เฉพาะก่อนรับของ (ตอนนี้: ' + R.status + ')');
    const why = cleanText_(reason).slice(0, 300) || 'ผู้ขอยกเลิก';
    setStatus_(R, FLOW_.ST.CANCEL);
    radioReleaseDoc_(R.id);
    docLog_(R.id, R.status, FLOW_.ST.CANCEL, me, why);
    SpreadsheetApp.flush();
    return { ok: true, id: R.id, status: FLOW_.ST.CANCEL };
  } finally { lock.releaseLock(); }
}

/** ผู้ขอลงนามอิเล็กทรอนิกส์ (หลังอนุมัติ) */
function signRequest(reqId) {
  const me = denyAudit_(requireUser_());
  const lock = lock_();
  try {
    const R = reqRead_(reqId);
    if (R.owner !== String(me.email).toLowerCase()) throw new Error('ลงนามได้เฉพาะผู้ขอของเอกสาร ' + R.id);
    if (R.status !== FLOW_.ST.OK) throw new Error('ลงนามได้หลังแอดมินอนุมัติ (ตอนนี้: ' + R.status + ')');
    const hash = docHash_(R);
    if (R.sigReq && R.sigReq.h === hash) return { ok: true, id: R.id, already: true };
    setCol_(R, FLOW_.COL.sigReq, sigMake_(me, hash));
    docLog_(R.id, R.status, R.status, me, 'ผู้ขอลงนามอิเล็กทรอนิกส์', hash);
    SpreadsheetApp.flush();
    return { ok: true, id: R.id };
  } finally { lock.releaseLock(); }
}

/** แนบใบที่ลงนามแล้ว (อัปโหลดด้วย uploadAttachment ก่อน แล้วส่งลิงก์มา) · เจ้าของหรือแอดมิน */
function attachSigned(reqId, url) {
  const me = denyAudit_(requireUser_());
  const u = String(url || '').trim();
  if (!/^https:\/\/(drive|docs)\.google\.com\/[\w\-./?=&%]+$/.test(u)) throw new Error('ลิงก์ไฟล์ไม่ถูกต้อง กรุณาอัปโหลดใหม่');
  const lock = lock_();
  try {
    const R = reqRead_(reqId);
    const isAdmin = String(me.role).toUpperCase() === 'ADMIN';
    if (R.owner !== String(me.email).toLowerCase() && !isAdmin) throw new Error('ไม่พบเอกสาร ' + R.id + ' ของบัญชีนี้');
    if ([FLOW_.ST.REVIEW, FLOW_.ST.NO, FLOW_.ST.CANCEL].indexOf(R.status) >= 0) throw new Error('แนบใบลงนามได้หลังอนุมัติ (ตอนนี้: ' + R.status + ')');
    setCol_(R, FLOW_.COL.signed, u);
    docLog_(R.id, R.status, R.status, me, 'แนบใบลงนาม', u);
    SpreadsheetApp.flush();
    return { ok: true, id: R.id };
  } finally { lock.releaseLock(); }
}

/** ข้อมูลใบเอกสารสำหรับพิมพ์ (ใบคำขอ/ใบอนุมัติ) · เจ้าของ หรือเจ้าหน้าที่ */
function reqDocument(reqId) {
  const me = requireUser_();
  const R = reqRead_(reqId);
  if (isExternal_(me) && R.owner !== String(me.email).toLowerCase()) throw new Error('ไม่พบเอกสาร ' + R.id + ' ของบัญชีนี้');
  const h = R.h, s = signState_(R);
  return {
    id: R.id, status: R.status, kind: R.kind,
    requester: cleanText_(h[3]), dept: cleanText_(h[4]), type: cleanText_(h[5]), org: cleanText_(h[6]),
    event: cleanText_(h[7]), purpose: cleanText_(h[8]), dateOut: fmtD_(h[9]), dueDate: fmtD_(h[10]),
    reviewer: String(h[FLOW_.COL.by - 1] || ''), reviewNote: R.note,
    sigReq: s.eReq ? sigText_(R.sigReq) : '', sigApv: s.eApv ? sigText_(R.sigApv) : '',
    signedUrl: R.signed, changed: s.changed, consent: FLOW_.CONSENT, letterUrl: String(h[11] || '').trim(),
    lines: reqLines_(R.id).map(l => ({ code: l.code, name: l.name, qty: l.qty }))
  };
}

// ═══ เติมข้อมูลให้หน้าเว็บเดิม ═══

/** หน้าแรกแอดมิน: เพิ่ม "รอตรวจ" และสถานะการลงนามของใบที่รอจ่าย */
function flowAdminData_(A) {
  const hs = sheet_(CFG.TABS.REQ_H), hl = hs.getLastRow();
  if (hl < 2) { A.toReview = []; return A; }
  ensureReqCols_(hs);
  const rows = hs.getRange(2, 1, hl - 1, FLOW_.COL.signed).getValues();
  const byId = {}, review = [];
  rows.forEach(r => { byId[String(r[0]).trim()] = r; });
  const res = reservedMap_(''), bal = balanceMap_(), items = indexItems_(), idx = linesIndex_();
  rows.forEach(r => {
    if (String(r[12]).trim() !== FLOW_.ST.REVIEW) return;
    const id = String(r[0]).trim();
    const lines = reqLines_(id, idx).map(l => {
      const it = items[l.code];
      const free = (bal[l.code] === undefined ? (it ? it.qtyOld : 0) : bal[l.code]) - (res[l.code] || 0);
      return { name: l.name, qty: l.qty, short: l.qty > free };
    });
    review.push({ id: id, created: fmtD_(r[1]), requester: cleanText_(r[3]), email: String(r[2]).trim(), file: String(r[11] || '').trim(),
                  org: cleanText_(r[6]), purpose: cleanText_(r[8] || r[7]), dueDate: fmtD_(r[10]),
                  kind: reqKind_(r[FLOW_.COL.kind - 1]), lines: lines });
  });
  A.toReview = review.slice(0, 80);
  (A.toDispatch || []).forEach(d => {
    const r = byId[d.id]; if (!r) return;
    const R = { id: d.id, h: r, owner: String(r[2]).trim().toLowerCase(), kind: reqKind_(r[FLOW_.COL.kind - 1]),
                sigReq: sigParse_(r[FLOW_.COL.sigReq - 1]), sigApv: sigParse_(r[FLOW_.COL.sigApv - 1]),
                signed: String(r[FLOW_.COL.signed - 1] || '').trim() };
    const s = signState_(R, null, idx);
    d.kind = R.kind; d.eReq = s.eReq; d.eApv = s.eApv; d.signedUrl = R.signed; d.ready = s.ready; d.changed = s.changed;
    d.printUrl = appBase_() + '?page=index&print=' + encodeURIComponent(d.id);
  });
  return A;
}

/** คำขอของฉัน: เพิ่มลักษณะคำขอ การลงนาม ปุ่มที่ทำได้ */
function flowEnrichMine_(list) {
  if (!list.length) return list;
  const hs = sheet_(CFG.TABS.REQ_H), hl = hs.getLastRow();
  ensureReqCols_(hs);
  const ext = {};
  hs.getRange(2, 1, hl - 1, FLOW_.COL.signed).getValues().forEach(r => { ext[String(r[0]).trim()] = r; });
  const on = reviewOn_(), idx = linesIndex_();
  return list.map(x => {
    const r = ext[x.id]; if (!r) return x;
    const R = { id: x.id, h: r, owner: String(r[2]).trim().toLowerCase(), kind: reqKind_(r[FLOW_.COL.kind - 1]),
                sigReq: sigParse_(r[FLOW_.COL.sigReq - 1]), sigApv: sigParse_(r[FLOW_.COL.sigApv - 1]),
                signed: String(r[FLOW_.COL.signed - 1] || '').trim() };
    const s = signState_(R, null, idx), st = x.status;
    x.kind = R.kind; x.reviewNote = cleanText_(r[FLOW_.COL.note - 1]);
    x.eReq = s.eReq; x.eApv = s.eApv; x.signedUrl = R.signed; x.ready = s.ready;
    x.printUrl = appBase_() + '?page=index&print=' + encodeURIComponent(x.id);
    x.canCancel = [FLOW_.ST.REVIEW, FLOW_.ST.OK].indexOf(st) >= 0;
    x.canSign = on && st === FLOW_.ST.OK && !s.eReq;
    x.canUpload = on && st === FLOW_.ST.OK && !R.signed;
    x.canPrint = [FLOW_.ST.REVIEW, FLOW_.ST.NO, FLOW_.ST.CANCEL].indexOf(st) < 0;
    if (st === FLOW_.ST.REVIEW) x.label = 'รอแอดมินตรวจ';
    else if (st === FLOW_.ST.CANCEL) x.label = 'ยกเลิกแล้ว';
    else if (st === FLOW_.ST.GIVEN) x.label = 'รับของแล้ว (จ่ายออก ไม่ต้องคืน)';
    else if (st === FLOW_.ST.OK && on) x.label = s.ready ? 'ลงนามครบ รอรับของ' : 'อนุมัติแล้ว รอลงนาม';
    return x;
  });
}

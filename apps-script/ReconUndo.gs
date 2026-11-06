function undoRecon(payload) {
  const me = staffOnly_();
  if (!me || String(me.role || '').toUpperCase() !== 'ADMIN') throw apiErr_('NO_ACCESS', 'คำสั่งนี้ใช้ได้เฉพาะ ADMIN');
  return reconUndo_(payload, me);
}

const RECON_UNDO_SHEET_ = 'RECON_UNDO_LOG';
function reconUndoSheet_() {
  const ss = SpreadsheetApp.openById(CFG.SHEET_ID);
  let sh = ss.getSheetByName(RECON_UNDO_SHEET_);
  if (!sh) {
    sh = ss.insertSheet(RECON_UNDO_SHEET_);
    sh.getRange(1, 1, 1, 8).setValues([['UNDO_ID','UNDONE_AT','RECON_ID','รหัสรายการ','ชื่อรายการ','อีเมลผู้ดำเนินการ','สถานะ','หมายเหตุ']]);
  }
  return sh;
}
function reconUndoLatest_() {
  const sh = SpreadsheetApp.openById(CFG.SHEET_ID).getSheetByName('RECON_LOG'), out = {};
  if (!sh || sh.getLastRow() < 2) return out;
  sh.getRange(2,1,sh.getLastRow()-1,15).getValues().forEach((r,i) => {
    const code = String(r[2] == null ? '' : r[2]).trim().toUpperCase();
    if (code) out[code] = {reconId:String(r[0] == null ? '' : r[0]).trim(), code:code, name:String(r[3] == null ? '' : r[3]), oldQty:Number(r[5])||0, newQty:Number(r[6])||0, diff:Number(r[7])||0, row:i+2};
  });
  return out;
}
function reconUndoActive_() {
  const latest = reconUndoLatest_(), sh = SpreadsheetApp.openById(CFG.SHEET_ID).getSheetByName(RECON_UNDO_SHEET_), out = {};
  if (!sh || sh.getLastRow() < 2) return out;
  sh.getRange(2,1,sh.getLastRow()-1,8).getValues().forEach(r => {
    const code=String(r[3] == null ? '' : r[3]).trim().toUpperCase(), rid=String(r[2] == null ? '' : r[2]).trim(), st=String(r[6] == null ? '' : r[6]).trim().toUpperCase();
    if (code && rid && st === 'OPEN' && latest[code] && latest[code].reconId === rid) out[code] = {undoId:String(r[0] == null ? '' : r[0]), reconId:rid, code:code, name:String(r[4] == null ? '' : r[4]), oldQty:latest[code].oldQty, newQty:latest[code].newQty, diff:latest[code].diff};
  });
  return out;
}
function reconUndoTarget_(payload) {
  const p=payload&&typeof payload==='object'?payload:{reconId:payload}, rid=String(p.reconId||p.id||'').trim(), code=String(p.code||'').trim().toUpperCase();
  const sh=SpreadsheetApp.openById(CFG.SHEET_ID).getSheetByName('RECON_LOG');
  if (!sh || sh.getLastRow()<2) throw apiErr_('NOT_FOUND','ไม่พบประวัติการนับ');
  let hit=null; sh.getRange(2,1,sh.getLastRow()-1,15).getValues().forEach((r,i)=>{const x=String(r[0] == null ? '' : r[0]).trim(), c=String(r[2] == null ? '' : r[2]).trim().toUpperCase(); if((rid&&x===rid)||(!rid&&code&&c===code)) hit={row:i+2,values:r};});
  if(!hit) throw apiErr_('NOT_FOUND','ไม่พบรายการที่ต้องการ Undo');
  const r=hit.values, t={row:hit.row,reconId:String(r[0] == null ? '' : r[0]).trim(),code:String(r[2] == null ? '' : r[2]).trim().toUpperCase(),name:String(r[3] == null ? '' : r[3]),oldQty:Number(r[5])||0,newQty:Number(r[6])||0,diff:Number(r[7])||0};
  const latest=reconUndoLatest_()[t.code]; if(!latest||latest.reconId!==t.reconId) throw apiErr_('STALE','รายการนี้ไม่ใช่ผลนับล่าสุดของรหัสนี้แล้ว'); return t;
}
function reconUndo_(payload, me) {
  const lock=LockService.getScriptLock(); lock.waitLock(30000);
  try { const t=reconUndoTarget_(payload), active=reconUndoActive_(); if(active[t.code]) throw apiErr_('ALREADY_UNDONE','รายการนี้ถูกเปิดให้นับใหม่แล้ว'); const id='RU-'+Utilities.getUuid().slice(0,8).toUpperCase(), reason=payload&&typeof payload==='object'?String(payload.reason||'').trim():''; reconLedgerReverse_(t.reconId, me.email); reconUndoSheet_().appendRow([id,new Date(),t.reconId,t.code,t.name,me.email,'OPEN',reason||'ADMIN เปิดให้นับใหม่']); return {ok:true,undoId:id,reconId:t.reconId,code:t.code,name:t.name,status:'เปิดให้นับใหม่',progress:reconUndoApplyProgress_(activeProgressOr_(me),me)}; }
  finally { lock.releaseLock(); }
}
function reconUndoApplyProgress_(progress, me) { if(!progress)return progress; const p=Object.assign({},progress), n=Object.keys(reconUndoActive_()).length; if(!n)return p; p.done=Math.max(0,(Number(p.done)||0)-n); p.pending=(Number(p.pending)||0)+n; p.percent=p.total?Math.round(p.done*1000/Number(p.total))/10:0; return p; }
function reconUndoApplyList_(list, me) { const out=Array.isArray(list)?list.slice():[], active=reconUndoActive_(); Object.keys(active).forEach(code=>{let found=false; out.forEach(item=>{if(String(item&&item.code||'').trim().toUpperCase()!==code)return; found=true; if(Object.prototype.hasOwnProperty.call(item,'counted'))item.counted=null; if(Object.prototype.hasOwnProperty.call(item,'qtyNew'))item.qtyNew=null;}); if(!found){try{const item=countlib_(me).getItem(code); if(item){if(Object.prototype.hasOwnProperty.call(item,'counted'))item.counted=null; if(Object.prototype.hasOwnProperty.call(item,'qtyNew'))item.qtyNew=null; out.push(item);}}catch(e){}}}); return out; }
function reconUndoApplyBootstrap_(data, me) { if(!data)return data; const d=Object.assign({},data); d.progress=reconUndoApplyProgress_(d.progress,me); return d; }
function reconUndoApplyDash_(data, me) { if(!data)return data; const d=JSON.parse(JSON.stringify(data)), active=reconUndoActive_(), codes=Object.keys(active); if(!codes.length)return d; const has=r=>!!active[String(r&&r.code||'').trim().toUpperCase()]; let oldBack=0,newBack=0; codes.forEach(c=>{oldBack+=active[c].oldQty;newBack+=active[c].newQty;}); d.done=Math.max(0,(Number(d.done)||0)-codes.length); d.pending=(Number(d.pending)||0)+codes.length; d.percent=d.total?Math.round(d.done*1000/Number(d.total))/10:0; if(d.oldDone!=null)d.oldDone=Math.max(0,(Number(d.oldDone)||0)-oldBack); if(d.newSum!=null)d.newSum=Math.max(0,(Number(d.newSum)||0)-newBack); d.short=(d.short||[]).filter(r=>!has(r)); d.over=(d.over||[]).filter(r=>!has(r)); d.shortRows=d.short.length; d.overRows=d.over.length; d.shortQty=d.short.reduce((n,r)=>n+Math.max(0,-(Number(r.diff)||0)),0); d.overQty=d.over.reduce((n,r)=>n+Math.max(0,Number(r.diff)||0),0); d.recent=(d.recent||[]).map(r=>{if(!has(r))return r;const x=Object.assign({},r);x.status='ยกเลิกผลนับ · เปิดให้นับใหม่';x.undoable=false;return x;}); return d; }


// ═══ ปรับคงเหลือ (LEDGER) ตามยอดนับอัตโนมัติ ═══
// บันทึกผลนับ → ลงบรรทัด "ปรับยอด" ตามส่วนต่าง (ยอดนับ − คงเหลือในระบบ) · txnType RECON · txnId = เลขที่ผลนับ
// ยกเลิกผลนับ → ลงบรรทัด "กลับรายการ" หักล้างของเลขที่นั้น · เพิ่มบรรทัดเท่านั้น ไม่แก้/ไม่ลบแถวเดิม · เรียกซ้ำไม่ลงซ้ำ
const RECON_LEDGER_TYPE_ = 'RECON';
function reconLedgerRows_() {
  const sh = sheet_(CFG.TABS.LEDGER), last = sh.getLastRow();
  return last < 2 ? [] : sh.getRange(2, 1, last - 1, 11).getValues();
}
function reconLedgerHas_(rows, rid) {
  return rows.some(function (r) { return String(r[7] || '').trim() === RECON_LEDGER_TYPE_ && String(r[8] || '').trim() === rid; });
}
function reconLedgerBal_(rows, code, asOf) {
  const t = asOf instanceof Date ? asOf.getTime() : 0;
  return rows.reduce(function (s, r) {
    if (String(r[2] || '').trim() !== code) return s;
    if (t && r[1] instanceof Date && r[1].getTime() > t) return s;
    return s + toNum_(r[5]) - toNum_(r[6]);
  }, 0);
}
function reconLedgerApply_(reconId, code, name, counted, who, asOf, dry) {
  const rid = String(reconId || '').trim(), c = String(code || '').trim();
  const blank = counted === '' || counted === null || counted === undefined, n = Number(counted);
  if (!rid || !c || blank || !isFinite(n) || n < 0) return { changed: false, reconId: rid, code: c, skip: 'ข้อมูลไม่ครบ' };
  const lock = dry ? null : lock_();
  try {
    const rows = reconLedgerRows_();
    if (reconLedgerHas_(rows, rid)) return { changed: false, reconId: rid, code: c, skip: 'ปรับแล้ว' };
    const sys = reconLedgerBal_(rows, c, asOf), now = reconLedgerBal_(rows, c), d = n - sys;
    const out = { changed: d !== 0, reconId: rid, code: c, counted: n, sys: sys, before: now, diff: d, after: now + d };
    if (out.after < 0) { out.changed = false; out.skip = 'คงเหลือจะติดลบ'; return out; }
    if (!d || dry) return out;
    ledger_(c, name, 'ปรับยอด', d > 0 ? d : 0, d < 0 ? -d : 0, RECON_LEDGER_TYPE_, rid, who,
            'ตรวจนับ ' + rid + ': ยอดนับ ' + n + ' (ระบบ ' + sys + ')' + (asOf ? ' · ปรับย้อนหลัง' : ''));
    return out;
  } finally { if (lock) lock.releaseLock(); }
}
function reconLedgerReverse_(reconId, who) {
  const rid = String(reconId || '').trim();
  if (!rid) return { changed: false };
  const net = {};
  reconLedgerRows_().forEach(function (r) {
    if (String(r[7] || '').trim() !== RECON_LEDGER_TYPE_ || String(r[8] || '').trim() !== rid) return;
    const c = String(r[2] || '').trim(), o = net[c] || (net[c] = { name: r[3], q: 0 });
    o.q += toNum_(r[5]) - toNum_(r[6]);
  });
  let k = 0;
  Object.keys(net).forEach(function (c) {
    const q = net[c].q;
    if (!q) return;
    ledger_(c, net[c].name, 'กลับรายการ', q < 0 ? -q : 0, q > 0 ? q : 0, RECON_LEDGER_TYPE_, rid, who, 'กลับรายการ: ยกเลิกผลนับ ' + rid);
    k++;
  });
  return { changed: k > 0 };
}
// ผลนับที่บันทึกก่อน · รันในหน้าแก้ไขสคริปต์: ดูก่อน (ไม่เขียน) แล้วค่อยลงจริง
// เฉพาะผลนับล่าสุดของแต่ละรหัสที่ไม่ได้ยกเลิก · ส่วนต่างคิด ณ เวลานับ (การเบิก/จ่ายหลังนับยังนับอยู่) · รันซ้ำไม่ลงซ้ำ
function RECON_ledgerBackfill_preview() { return reconLedgerBackfill_(true); }
function RECON_ledgerBackfill_apply() { return reconLedgerBackfill_(false); }
function reconLedgerBackfill_(dry) {
  const who = Session.getActiveUser().getEmail();
  if (!who || who !== Session.getEffectiveUser().getEmail()) throw new Error('รันได้จากหน้าแก้ไขสคริปต์โดยเจ้าของโปรเจกต์เท่านั้น');
  const sh = SpreadsheetApp.openById(CFG.SHEET_ID).getSheetByName('RECON_LOG');
  if (!sh || sh.getLastRow() < 2) return [];
  const latest = {};
  sh.getRange(2, 1, sh.getLastRow() - 1, 7).getValues().forEach(function (r) {
    const c = String(r[2] || '').trim();
    if (c) latest[c] = r;
  });
  const undone = reconUndoActive_(), st = statusMap_(), out = [];
  Object.keys(latest).forEach(function (c) {
    const r = latest[c];
    if (undone[c.toUpperCase()]) { out.push({ changed: false, reconId: String(r[0]), code: c, skip: 'ยกเลิกผลนับอยู่' }); return; }
    if ((st[c] || ADM.ACTIVE) !== ADM.ACTIVE) { out.push({ changed: false, reconId: String(r[0]), code: c, skip: 'ไม่ได้อยู่ในสถานะใช้งาน (' + st[c] + ')' }); return; }
    out.push(reconLedgerApply_(r[0], c, r[3], r[6], who, r[1] instanceof Date ? r[1] : null, dry));
  });
  if (!dry && out.some(function (o) { return o.changed; })) bumpData_();
  console.log((dry ? 'PREVIEW' : 'APPLIED') + ' · LEDGER แถวสุดท้าย %s\n%s', reconLedgerRows_().length + 1, out.map(function (o) { return JSON.stringify(o); }).join('\n'));
  return out;
}
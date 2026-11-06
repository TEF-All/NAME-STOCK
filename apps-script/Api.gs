/**
 * ระบบ Stock สำเร็จรูป — API สำหรับหน้าเว็บบน GitHub Pages
 * ไฟล์นี้: doPost + ตรวจตัวตนทุกคำขอ + รายชื่อคำสั่งที่อนุญาต + meInfo/namesEn + แคชข้อมูล + ตัวอุ่นระบบ
 * ค่าตั้งอยู่ใน Script Properties (ดู Config.gs) · ไม่มีค่าลับในโค้ด
 */


// ═══════════════════════════════════════════════════════════════
//  A  API สำหรับหน้าเว็บบน GitHub Pages
//  หน้าเว็บส่ง POST แบบ text/plain (ไม่เกิด preflight) เนื้อหา JSON:
//    { v:1, fn:'stockList', args:[...], idt:'<Google ID token>' }   เข้าด้วย Google
//    { v:1, fn:'stockList', args:[...], ses:'<uuid>' }              บัตรผ่านของระบบ 6 ชม. (รหัสทางอีเมล หรือแลกจากบัตร Google ด้วย googleSession)
//  กดปุ่ม Google แล้วหน้าเว็บเรียก googleSession ครั้งเดียว ได้บัตรผ่าน 6 ชม. ไม่ต้องต่ออายุบัตร Google ทุกชั่วโมง
//  ตอบกลับ { ok:true, data } หรือ { ok:false, code, error }
//  code: AUTH_REQUIRED · AUTH_EXPIRED · AUTH_INVALID · NO_ACCESS · NOT_ALLOWED · MAINTENANCE · BUSY · ERROR
// ═══════════════════════════════════════════════════════════════
const API_ = {
  VER: 'template-1.0',
  ISS: { 'accounts.google.com': true, 'https://accounts.google.com': true },
  SKEW: 60,          // วินาที เผื่อนาฬิกาคลาดเคลื่อน
  BAD_MAX: 300,      // บัตรผิดได้กี่ครั้งต่อ 10 นาที (ทั้งระบบ) ก่อนพักการตรวจ กันการยิงเปลืองโควตา
  // คำสั่งที่เรียกได้ก่อนเข้าสู่ระบบ (ไม่มีข้อมูลพัสดุ)
  PRE_AUTH: { apiPing: true, otpRequest: true, otpVerify: true, sessionCheck: true, otpLogout: true, googleSession: true },
  // คำสั่งอ่านอย่างเดียว · คำสั่งอื่นทั้งหมดถือว่าอาจบันทึก จะล้างแคชข้อมูลหลังทำงาน (กันลืมเมื่อเพิ่มคำสั่งใหม่)
  READ: { meInfo: true, namesEn: true, appUrl: true, homeBoot: true, getBoot: true, myRequests: true, surveyBoot: true,
          stockList: true, stockPhotos: true, radioUnitList: true, listItems: true, requestBoot: true, getRequisition: true,
          getPrintHtml: true, listPending: true, getBootstrapData: true, countListItems: true, getItem: true, getProgress: true,
          facetData: true, dashData: true, adminBoot: true, reqDocument: true }
};
let AUTH_ = null;    // { email, by:'GOOGLE'|'EMAIL', tok } ตั้งค่าเฉพาะใน doPost หลังตรวจบัตรผ่านแล้ว

function prop_(k) { return PropertiesService.getScriptProperties().getProperty(k) || ''; }

function apiErr_(code, msg) { const e = new Error(msg); e.code = code; return e; }

function apiOut_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  resetMemo_();                                   // ของที่จำไว้ในคำสั่งก่อน (ถ้ารันต่อกันในเครื่องทดสอบ) ไม่ข้ามคำสั่ง
  let req = null;
  try { req = JSON.parse((e && e.postData && e.postData.contents) || 'null'); } catch (x) { req = null; }
  if (!req || typeof req !== 'object' || Array.isArray(req))
    return apiOut_({ ok: false, code: 'BAD_REQUEST', error: 'คำขอไม่ถูกต้อง' });
  const fn = String(req.fn || '').slice(0, 64);
  const args = Array.isArray(req.args) ? req.args : [];
  try {
    if (prop_('MAINTENANCE') === '1') throw apiErr_('MAINTENANCE', 'ระบบปิดปรับปรุงชั่วคราว กรุณาลองใหม่ภายหลัง');
    if (API_.PRE_AUTH[fn] === true) return apiOut_({ ok: true, data: preAuthCall_(fn, args) });
    const t0 = Date.now();
    AUTH_ = apiAuth_(req);                          // ไม่ผ่าน = โยน AUTH_* ออกไป ไม่เรียกคำสั่งใด ๆ
    try { return apiOut_({ ok: true, data: callAllowed_(fn, args) }); }
    finally {
      if (API_.READ[fn] !== true) bumpData_();      // คำสั่งที่อาจบันทึก → ข้อมูลที่จำไว้ใช้ไม่ได้ทันที
      console.log('API %s %s ms', fn, Date.now() - t0);   // ดูเวลาทำงานจริงใน Executions (ไม่บันทึกอีเมล)
    }
  } catch (err) {
    return apiOut_({ ok: false, code: (err && err.code) || 'ERROR', error: String((err && err.message) || err) });
  }
}

function preAuthCall_(fn, a) {
  switch (fn) {
    case 'apiPing':
      return { ok: true, ver: API_.VER, app: CFG.APP, org: CFG.ORG, google: !!prop_('GIS_CLIENT_ID'),
               ready: !!prop_('SHEET_ID') };    case 'otpRequest':   return otpRequest(a[0]);
    case 'otpVerify':    return otpVerify(a[0], a[1]);
    case 'sessionCheck': return sessionCheck(a[0]);
    case 'otpLogout':    return otpLogout(a[0]);
    case 'googleSession': return googleSession_(a[0]);   // 
  }
  throw apiErr_('NOT_ALLOWED', 'คำสั่งนี้ใช้ไม่ได้');
}

/** ยืนยันตัวตนของคำขอ: บัตร Google ก่อน ไม่มีค่อยดูบัตรผ่านรหัสทางอีเมล */
function apiAuth_(req) {
  if (req.ses) {                                                     // บัตรผ่านของระบบมาก่อน (Google ที่แลกแล้ว หรือรหัสทางอีเมล)
    const t = String(req.ses), o = sessionInfo_(t);                 // บัตรถาวร (ตรวจรูปแบบ uuid ในฟังก์ชัน)
    if (!o) throw apiErr_('AUTH_EXPIRED', 'การเข้าใช้สิ้นสุดแล้ว กรุณาเข้าสู่ระบบใหม่');
    SES_TOK_ = t;
    return { email: o.e, by: o.g ? 'GOOGLE' : 'EMAIL', tok: o.g ? '' : t };
  }
  if (req.idt) {                                                     // แบบเดิม: ส่งบัตร Google มาทุกคำขอ (หน้าเว็บรุ่นก่อน 
    const g = googleIdentity_(req.idt);
    return { email: g.email, by: 'GOOGLE', tok: '' };
  }
  throw apiErr_('AUTH_REQUIRED', 'กรุณาเข้าสู่ระบบ');
}

/** ตรวจบัตร Google + อีเมลโดเมนเจ้าหน้าที่ (STAFF_DOMAIN) ต้องเป็นบัญชี Google Workspace ขององค์กรจริง (มี hd) */
function googleIdentity_(idt) {
  const g = verifyIdToken_(String(idt || ''));
  // อีเมลโดเมนเจ้าหน้าที่ได้บทบาทเจ้าหน้าที่อัตโนมัติ → ต้องเป็นบัญชีขององค์กรจริง (มี hd)
  // ถ้าโดเมนอยู่ใต้องค์กรแม่ Google อาจส่ง hd เป็นโดเมนหลัก จึงรับได้หลายค่า (STAFF_HD คั่นด้วย ,)
  const dom = String(CFG.STAFF_DOMAIN).toLowerCase();              // '@example.org' หรือ ''
  const hds = (prop_('STAFF_HD') || dom.slice(1)).toLowerCase().split(',')
                .map(function (s) { return s.trim(); }).filter(String);
  if (dom && g.email.slice(-dom.length) === dom && hds.indexOf(g.hd) < 0) {
    console.log('ปฏิเสธบัญชี %s: hd="%s" ไม่อยู่ใน STAFF_HD', dom, g.hd);
    throw apiErr_('AUTH_INVALID', 'อีเมล ' + dom + ' ต้องเข้าด้วยบัญชีงานขององค์กร');
  }
  return g;
}

/**
 * แลกบัตร Google (อายุ 1 ชม.) เป็นบัตรผ่านของระบบ ครั้งเดียวตอนกดปุ่ม Google ไม่หมดอายุ จนกว่าจะออกจากระบบ)
 * เดิมหน้าเว็บต้องต่ออายุบัตร Google แบบเงียบทุกชั่วโมง ซึ่ง iPhone/Safari ทำไม่ได้ → ผู้ใช้เด้งไปหน้า Login
 * บัตรผ่านใช้กลไกเดียวกับรหัสทางอีเมล (ses_ ใน cache) + ป้าย sesg_ ให้รู้ว่ายืนยันด้วย Google (ใช้ในลายเซ็น via)
 */
function googleSession_(idt) {
  const g = googleIdentity_(idt);
  if (!resolveUser_(g.email)) throw apiErr_('NO_ACCESS', 'อีเมลนี้ยังไม่มีสิทธิ์เข้าระบบ หรือถูกปิดการใช้งาน กรุณาติดต่อผู้ดูแลระบบ');
  const tok = sessionNew_(g.email, true);
  console.log('googleSession ออกบัตรผ่าน (ไม่หมดอายุ จนกว่าจะออกจากระบบ)');   // ไม่บันทึกอีเมล
  return { tok: tok, hours: 0 };
}

/**
 * ตรวจ Google ID token กับ Google ทุกคำขอ (tokeninfo): aud = Client ID ของเรา, iss เป็น Google,
 * email_verified = true, ยังไม่หมดอายุ · ผลที่ผ่านแล้วจำไว้ในแคชตามลายนิ้วมือ SHA-256 ของบัตร
 * จนบัตรหมดอายุ (ไม่เกิน 1 ชม.) เพื่อไม่ต้องถาม Google ซ้ำทุกครั้ง · ไม่เก็บตัวบัตรเอง
 */
function verifyIdToken_(t) {
  if (t.length > 4096 || !/^[\w-]+\.[\w-]+\.[\w-]+$/.test(t)) throw apiErr_('AUTH_INVALID', 'บัตรผ่าน Google ไม่ถูกต้อง');
  const cid = prop_('GIS_CLIENT_ID');
  if (!cid) throw apiErr_('NOT_CONFIGURED', 'ระบบนี้ยังไม่เปิดเข้าด้วย Google (ไม่ได้ตั้ง GIS_CLIENT_ID) กรุณาใช้รหัสทางอีเมล');
  const c = CacheService.getScriptCache(), key = 'idt_' + otpHash_(t);
  const hit = c.get(key);
  if (hit) return JSON.parse(hit);
  const bad = Number(c.get('idt_bad') || 0);
  if (bad >= API_.BAD_MAX) throw apiErr_('BUSY', 'ตรวจบัตรผ่านไม่สำเร็จหลายครั้ง ระบบพักการตรวจ 10 นาที');

  const r = UrlFetchApp.fetch('https://oauth2.googleapis.com/tokeninfo',
    { method: 'post', payload: { id_token: t }, muteHttpExceptions: true });   // ส่งแบบ POST บัตรไม่ไปอยู่ใน URL
  let p = null;
  if (r.getResponseCode() === 200) { try { p = JSON.parse(r.getContentText()); } catch (x) { p = null; } }
  const now = Math.floor(Date.now() / 1000), exp = Number((p && p.exp) || 0);
  const ok = !!p && p.aud === cid && API_.ISS[p.iss] === true &&
             String(p.email_verified) === 'true' && !!p.email && exp > now - API_.SKEW;
  if (!ok) {
    c.put('idt_bad', String(bad + 1), 600);
    // tokeninfo ตอบ 400 เมื่อบัตรหมดอายุหรือเสีย → หน้าเว็บจะขอบัตรใหม่แบบเงียบก่อน 1 ครั้ง
    throw apiErr_(r.getResponseCode() === 400 ? 'AUTH_EXPIRED' : 'AUTH_INVALID',
                  'บัตรผ่าน Google หมดอายุหรือไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่');
  }
  const g = { email: String(p.email).trim().toLowerCase(), hd: String(p.hd || '').toLowerCase() };
  if (g.hd) console.log('บัตรบัญชีองค์กร hd="%s"', g.hd);   // ไม่บันทึกอีเมล · ใช้ดูค่า hd จริงสำหรับ STAFF_HD
  const ttl = Math.min(exp - now, 3600);
  if (ttl > 30) c.put(key, JSON.stringify(g), ttl);
  return g;
}

/**
 * รายชื่อคำสั่งที่หน้าเว็บเรียกได้ — ชุดเดียวกับ appCall ของ v32 + meInfo, namesEn + (ตรวจ ยกเลิก ลงนาม แนบใบ พิมพ์)
 * เป็นรายชื่อตายตัว ไม่มีการเรียกฟังก์ชันจากชื่อที่ส่งมาตรง ๆ · ทุกตัวตรวจบทบาทในตัวเองอีกชั้น
 * (ทุกคำสั่งตรวจสิทธิ์ซ้ำในตัวเอง: requireUser_ / staffOnly_ / admOnly_ / denyAudit_)
 */
function callAllowed_(fn, a) {
  if (firestoreOn_()) { const h = hybridCall_(String(fn), a); if (h !== undefined) return h; }   // Firestore.gs (ปิดอยู่ถ้าไม่ตั้ง FIRESTORE_PROJECT)
  switch (String(fn)) {
    case 'meInfo':             return meInfo();
    case 'namesEn':            return namesEn();
    case 'appUrl':             return appUrl();
    case 'homeBoot':           return homeBoot.apply(null, a);
    case 'homeDispatch':       return homeDispatch.apply(null, a);
    case 'homeConfirmReturn':  return homeConfirmReturn.apply(null, a);
    case 'homeRejectReturn':   return homeRejectReturn.apply(null, a);
    case 'homeSetExternal':    return homeSetExternal.apply(null, a);
    case 'homeSaveConfig':     return homeSaveConfig.apply(null, a);
    case 'homeResetConfig':    return homeResetConfig.apply(null, a);
    case 'requestBoot':        return requestBoot_.apply(null, a);      // หน้าเบิกครั้งเดียวจบ
    case 'getBoot':            return getBoot.apply(null, a);
    case 'myRequests':         return myRequests.apply(null, a);
    case 'surveyBoot':         return surveyBoot.apply(null, a);
    case 'submitSurvey':       return submitSurvey.apply(null, a);
    case 'stockList':          return stockList.apply(null, a);
    case 'stockPhotos':        return stockPhotos.apply(null, a);
    case 'stockPhotoSet':      return stockPhotoSet.apply(null, a);
    case 'radioUnitList':      return radioUnitList.apply(null, a);
    case 'listItems':          return listItems.apply(null, a);
    case 'getRequisition':     return getRequisition.apply(null, a);
    case 'createRequisition':  return createRequisition.apply(null, a);
    case 'createDisbursement': return createDisbursement.apply(null, a);
    case 'createTransfer':     return createTransfer.apply(null, a);
    case 'returnItems':        return returnItems.apply(null, a);
    case 'uploadAttachment':   return uploadAttachment.apply(null, a);
    case 'getPrintHtml':       return getPrintHtml.apply(null, a);
    case 'listPending':        return listPending.apply(null, a);
    case 'approve':            return approve.apply(null, a);
    case 'getBootstrapData':   return reconUndoApplyBootstrap_(getBootstrapData.apply(null, a), staffOnly_());
    case 'countListItems':     return reconUndoApplyList_(countListItems.apply(null, a), staffOnly_());
    case 'getItem':            return getItem.apply(null, a);
    case 'getProgress':        return reconUndoApplyProgress_(getProgress.apply(null, a), staffOnly_());
    case 'saveRecon':          return saveRecon.apply(null, a);
    case 'undoRecon':          return undoRecon.apply(null, a);
    case 'facetData':          return facetData.apply(null, a);
    case 'dashData':           return reconUndoApplyDash_(dashData.apply(null, a), staffOnly_());
    case 'adminBoot':          return adminBoot.apply(null, a);
    case 'adminAddItem':       return adminAddItem.apply(null, a);
    case 'adminReceive':       return adminReceive.apply(null, a);
    case 'adminAdjust':        return adminAdjust.apply(null, a);
    case 'adminRetire':        return adminRetire.apply(null, a);
    case 'adminReopen':        return adminReopen.apply(null, a);
    case 'adminEditItem':      return adminEditItem.apply(null, a);
    case 'adminSavePhotos':    return adminSavePhotos.apply(null, a);
    case 'adminDeleteItem':    return adminDeleteItem.apply(null, a);
    case 'adminDeletePhotos':  return adminDeletePhotos.apply(null, a);
    case 'reviewRequest':      return reviewRequest.apply(null, a);      // 
    case 'cancelRequest':      return cancelRequest.apply(null, a);      // 
    case 'signRequest':        return signRequest.apply(null, a);        // 
    case 'attachSigned':       return attachSigned.apply(null, a);       // 
    case 'reqDocument':        return reqDocument.apply(null, a);        // 
    default: throw apiErr_('NOT_ALLOWED', 'คำสั่งนี้ใช้ไม่ได้: ' + fn);
  }
}

/** แทน injectNav_: หน้าเว็บสร้างแถบเมนูเองจากข้อมูลนี้ (สิทธิ์จริงยังตรวจที่ทุกฟังก์ชันข้อมูล) */
function meInfo() {
  const me = whoAmI();
  if (!me) throw apiErr_('NO_ACCESS', 'อีเมลนี้ยังไม่มีสิทธิ์เข้าระบบ หรือถูกปิดการใช้งาน กรุณาติดต่อผู้ดูแลระบบ');
  const isNew = me.role === 'EXTERNAL_NEW';
  return {
    name: String(me.name || ''),
    role: me.role,
    roleLabel: ROLE_LABEL_[me.role] || (isNew ? 'ผู้ใช้ภายนอก (ยังไม่กรอกแบบสอบถาม)' : me.role),
    email: me.role === 'ADMIN' ? '' : me.email,          // แอดมินแสดงแค่ชื่อ
    pages: isNew ? ['survey'] : (PAGE_ACL_[me.role] || []),
    nav: isNew ? [] : navItems_(me),                      // [[page, ป้าย], ...]
    home: isNew ? 'survey' : (me.role === 'EXTERNAL' ? 'my' : 'home'),
    authBy: me.authBy
  };
}

/** ชื่อสินค้าภาษาอังกฤษ (หน้าเว็บโหมด English ใช้แทนชื่อไทย) */
function namesEn() { requireUser_(); return namesEn_(); }







// ═══════════════════════════════════════════════════════════════
//  ความเร็ว
//  ① requestBoot: หน้าเบิกเรียกครั้งเดียวได้ค่าตั้งต้น + รายการพัสดุ + อุปกรณ์รายเครื่อง (เดิม 3 รอบต่อกัน รอบละ ~3 วิ)
//  ② แคชข้อมูลที่ทุกคนเห็นเหมือนกัน (รายการพัสดุ คงเหลือ อุปกรณ์รายเครื่อง) 2 นาที บีบอัดแบ่งชิ้นใน CacheService
//     ล้างทันทีหลังคำสั่งที่อาจบันทึกทุกตัว (doPost) · แก้ชีตด้วยมือ = เห็นภายใน 2 นาที
//     การตรวจตอนส่งคำขอ/อนุมัติ/จ่าย ยังอ่านชีตสดเสมอ (ไม่ใช้แคชนี้)
// ═══════════════════════════════════════════════════════════════
const DCACHE_ = { TTL: 600, VER: 'dver_t1', CHUNK: 90000 };   // 10 นาที (ตัวอุ่นระบบสร้างใหม่ทุก 5 นาที)

function requestBoot_(tok) {
  return { boot: getBoot(tok), items: listItems(), rad: radioUnitList() };
}

function dataVer_() {
  const c = CacheService.getScriptCache();
  let v = c.get(DCACHE_.VER);
  if (!v) { v = String(Date.now()); try { c.put(DCACHE_.VER, v, 21600); } catch (e) {} }
  return v;
}
function bumpData_() { try { CacheService.getScriptCache().put(DCACHE_.VER, String(Date.now()), 21600); } catch (e) {} }

/** อ่านค่าที่จำไว้ (ไม่มี/เสีย → null) */
function cacheGet_(name) {
  try {
    const c = CacheService.getScriptCache(), k = 'dc_' + name + '_' + dataVer_();
    const n = Number(c.get(k + '_n') || 0);
    if (!n) return null;
    const keys = []; for (let i = 0; i < n; i++) keys.push(k + '_' + i);
    const m = c.getAll(keys); let b64 = '';
    for (let i = 0; i < n; i++) { const part = m[k + '_' + i]; if (part == null) return null; b64 += part; }
    const blob = Utilities.newBlob(Utilities.base64Decode(b64), 'application/x-gzip');
    return JSON.parse(Utilities.ungzip(blob).getDataAsString('UTF-8'));
  } catch (e) { return null; }
}
/** จำค่า (บีบอัด gzip แล้วแบ่งชิ้นละไม่เกิน 90 KB เพราะ CacheService รับค่าละ 100 KB) · จำไม่ได้ก็ไม่เป็นไร */
function cachePut_(name, obj, ttl) {
  try {
    const c = CacheService.getScriptCache(), k = 'dc_' + name + '_' + dataVer_();
    const b64 = Utilities.base64Encode(Utilities.gzip(Utilities.newBlob(JSON.stringify(obj), 'application/json')).getBytes());
    const parts = {}; let n = 0;
    for (let i = 0; i < b64.length; i += DCACHE_.CHUNK) parts[k + '_' + (n++)] = b64.slice(i, i + DCACHE_.CHUNK);
    parts[k + '_n'] = String(n);
    c.putAll(parts, ttl || DCACHE_.TTL);
  } catch (e) {}
}


// ═══════════════════════════════════════════════════════════════
//  ตัวอุ่นระบบ: ทุก 5 นาทีสร้างข้อมูลที่ทุกคนเห็นเหมือนกันไว้ล่วงหน้า (รายการพัสดุ คงเหลือ อุปกรณ์รายเครื่อง ดัชนีรูป)
//  ผู้ใช้เปิดหน้าแล้วได้จากที่จำไว้ ไม่ต้องรออ่านชีต 7 MB · แก้ชีตด้วยมือ = เห็นบนเว็บภายใน 5 นาที
//  SETUP_1_start ตั้งให้อัตโนมัติ · ตั้งใหม่เอง: SETUP_warmTrigger · เลิกใช้: STOP_warmTrigger
// ═══════════════════════════════════════════════════════════════
function resetMemo_() {
  Object.keys(USR_).forEach(function (k) { delete USR_[k]; });
  Object.keys(SH_).forEach(function (k) { delete SH_[k]; });
}
function WARM_tick() {
  const t0 = Date.now();
  if (!prop_('SHEET_ID')) return;                 // ยังไม่ได้ตั้งค่าชีต
  try { stockItems_(true); listItemsCached_(true); radCached_(true); photoIndex_(true); }
  catch (e) { console.log('อุ่นระบบไม่สำเร็จ: %s', e.message); }
  if (firestoreOn_()) { try { FIRESTORE_syncReadModels(); } catch (e) { console.log('Firestore sync skipped: %s', e.message); } }
  console.log('อุ่นระบบ %s ms', Date.now() - t0);
}
function SETUP_warmTrigger() {
  STOP_warmTrigger();
  ScriptApp.newTrigger('WARM_tick').timeBased().everyMinutes(5).create();
  WARM_tick();
  Logger.log('ตั้งตัวอุ่นระบบทุก 5 นาทีแล้ว');
}
function STOP_warmTrigger() {
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'WARM_tick') ScriptApp.deleteTrigger(t); });
}

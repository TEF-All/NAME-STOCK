
/**
 * สำเนาอ่านอย่างเดียวใน Firestore (ไม่บังคับ · ปิดอยู่จนกว่าจะตั้ง Script Property FIRESTORE_PROJECT)
 * เปิดใช้: ตั้ง FIRESTORE_PROJECT = รหัสโปรเจกต์ Google Cloud ที่มี Firestore · เพิ่มสิทธิ์
 *   "https://www.googleapis.com/auth/datastore" ใน appsscript.json → oauthScopes แล้ว Deploy ใหม่
 * กันข้อมูลค้าง: ใช้สำเนาเฉพาะเมื่อ generatedAt ≥ เวลาบันทึกล่าสุด (dataVer_) ไม่งั้นอ่านจากชีต
 * Firestore is a read-only mirror. Google Sheets remains the source of truth.
 * No stock writes are sent to Firestore from user actions.
 */
const FIRESTORE_ = {
  get PROJECT() { return prop_('FIRESTORE_PROJECT'); },   // ว่าง = ปิด
  DATABASE: '(default)',
  DOCUMENT: 'read_model/current',
  CACHE_KEY: 'firestore_read_model_v1',
  CACHE_TTL: 60,
  MAX_PAYLOAD: 900000
};

function firestoreOn_() { return !!FIRESTORE_.PROJECT; }

function firestoreUrl_() {
  return 'https://firestore.googleapis.com/v1/projects/' + encodeURIComponent(FIRESTORE_.PROJECT) +
    '/databases/' + encodeURIComponent(FIRESTORE_.DATABASE) + '/documents/' + FIRESTORE_.DOCUMENT;
}

function firestoreHeaders_() {
  return { Authorization: 'Bearer ' + ScriptApp.getOAuthToken() };
}

function firestoreReadModel_() {
  if (!firestoreOn_()) return null;
  const cache = CacheService.getScriptCache();
  const hit = cache.get(FIRESTORE_.CACHE_KEY);
  if (hit) {
    try { return JSON.parse(hit); } catch (e) {}
  }
  const res = UrlFetchApp.fetch(firestoreUrl_(), {
    method: 'get',
    headers: firestoreHeaders_(),
    muteHttpExceptions: true
  });
  const status = res.getResponseCode();
  if (status === 404) return null;
  if (status === 403) return null;
  if (status !== 200) throw new Error('Firestore read HTTP ' + status);
  const doc = JSON.parse(res.getContentText() || '{}');
  const field = doc.fields && doc.fields.payload && doc.fields.payload.stringValue;
  if (!field) return null;
  const model = JSON.parse(field);
  try { cache.put(FIRESTORE_.CACHE_KEY, JSON.stringify(model), FIRESTORE_.CACHE_TTL); } catch (e) {}
  return model;
}

function firestoreWriteReadModel_(model) {
  const payload = JSON.stringify(model);
  if (payload.length > FIRESTORE_.MAX_PAYLOAD) {
    throw new Error('Firestore read model ใหญ่เกินขนาดที่กำหนด: ' + payload.length);
  }
  const body = { fields: {
    schema: { stringValue: 'stock-read-model-v1' },
    updatedAt: { timestampValue: new Date().toISOString() },
    payload: { stringValue: payload }
  }};
  const res = UrlFetchApp.fetch(firestoreUrl_(), {
    method: 'patch',
    contentType: 'application/json',
    payload: JSON.stringify(body),
    headers: firestoreHeaders_(),
    muteHttpExceptions: true
  });
  const status = res.getResponseCode();
  if (status < 200 || status >= 300) throw new Error('Firestore write HTTP ' + status + ': ' + res.getContentText());
  try { CacheService.getScriptCache().remove(FIRESTORE_.CACHE_KEY); } catch (e) {}
  return JSON.parse(res.getContentText() || '{}');
}

function FIRESTORE_syncReadModels() {
  if (!firestoreOn_()) return { ok: false, off: true };
  const started = Date.now();
  const model = {
    schema: 'stock-read-model-v1',
    generatedAt: new Date().toISOString(),
    items: listItemsFresh_(),
    stock: stockItems_(true),
    rad: radCached_(true)
  };
  firestoreWriteReadModel_(model);
  return {
    ok: true,
    generatedAt: model.generatedAt,
    counts: { items: model.items.length, stock: model.stock.length, radioModels: Object.keys(model.rad).length },
    ms: Date.now() - started
  };
}

/** ใช้สำเนาใน Firestore ได้เฉพาะเมื่อสร้างหลังการบันทึกครั้งล่าสุด (ลบ/จ่าย/รับเข้า) ไม่งั้นอ่านชีตสด
 *  ตัวอุ่นระบบสร้างสำเนาใหม่ทุก 5 นาที แล้วกลับมาใช้ Firestore เอง */
function firestoreFresh_(model) {
  const made = Date.parse((model && model.generatedAt) || '') || 0;
  const lastWrite = Number(dataVer_()) || 0;
  return made > 0 && made >= lastWrite;
}

function firestoreReadOr_(key, fallback) {
  try {
    const model = firestoreReadModel_();
    if (model && firestoreFresh_(model) && model[key] !== undefined && model[key] !== null) return model[key];
  } catch (e) {
    console.log('Firestore read fallback (%s): %s', key, e.message);
  }
  return fallback();
}

function hybridRequestBoot_(tok) {
  let model = null;
  try { const m = firestoreReadModel_(); if (m && firestoreFresh_(m)) model = m; }
  catch (e) { console.log('Firestore read fallback (requestBoot): %s', e.message); }
  return {
    boot: getBoot(tok),
    items: model && model.items ? model.items : listItems(),
    rad: model && model.rad ? model.rad : radioUnitList()
  };
}

function hybridListItems_() { return firestoreReadOr_('items', function () { return listItems(); }); }
function hybridRadioUnitList_() { return firestoreReadOr_('rad', function () { return radioUnitList(); }); }
function hybridStockList_() {
  const me = requireUser_();
  const items = firestoreReadOr_('stock', function () { return stockItems_(); });
  return { items: items, app: appBase_(), admin: String(me.role).toUpperCase() === 'ADMIN' };
}

/** เรียกจาก callAllowed_ (Api.gs) เมื่อเปิด Firestore · คืน undefined = ไม่ใช่คำสั่งที่มีสำเนา */
function hybridCall_(fn, a) {
  if (fn === 'requestBoot') return hybridRequestBoot_(a[0]);
  if (fn === 'listItems') return hybridListItems_();
  if (fn === 'radioUnitList') return hybridRadioUnitList_();
  if (fn === 'stockList') return hybridStockList_();
  return undefined;
}

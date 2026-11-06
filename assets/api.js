/*
 * {{APP}} · api.js 
 *   1 StockAPI.call(fn, args)  ส่งคำสั่งไปหลังบ้าน Apps Script (POST text/plain) พร้อมบัตรผ่าน
 *   2 google.script.run      ตัวครอบ: โค้ดหน้าเว็บเดิมเรียกแบบเดิมได้ทุกบรรทัด
 *   3 StockAuth                ปุ่ม Sign in with Google · รหัสทางอีเมล (ทางสำรอง) · ออกจากระบบ
 *   กดปุ่ม Google แล้วแลกบัตร Google (1 ชม.) เป็นบัตรผ่านของระบบ 6 ชม. ทันที (googleSession)
 *        ไม่ต้องต่ออายุแบบเงียบทุกชั่วโมงอีก (iPhone/Safari ต่อไม่ได้ → เคยเด้งไปหน้า Login ตอนกดตะกร้า)
 * ใส่ใน <head> ก่อนสคริปต์อื่น: config.js → api.js → i18n.js → shell.js → accounts.google.com/gsi/client
 * ที่เก็บในเบราว์เซอร์: localStorage stk_ses (บัตรผ่านของระบบ 6 ชม.), stk_by (GOOGLE/EMAIL), stk_names (ชื่อสินค้าอังกฤษ)
 *                      stk_idt (บัตร Google แบบเดิม ≤ 1 ชม. เหลือเฉพาะเครื่องที่เข้าก่อน จะถูกแลกเป็นบัตรผ่านอัตโนมัติ)
 *                      sessionStorage stk_me (ชื่อ/บทบาท จำไว้ 5 นาที)
 *   StockAPI.mine(key) กุญแจข้อมูลส่วนตัวผูกกับบัตรผ่าน · StockAPI.remember(key, data) จำผลที่โหลดใหม่หลังบันทึก
 */
(function () {
  'use strict';
  var C = window.APP_CONFIG || (window.APP_CONFIG = {});
  if (!C.SITE) C.SITE = location.href.replace(/[?#].*$/, '').replace(/[^\/]*$/, '');   // ว่าง = โฟลเดอร์ของหน้านี้
  if (C.SITE.slice(-1) !== '/') C.SITE += '/';
  // ที่เก็บในเบราว์เซอร์แยกตามเว็บ (หลายระบบใน github.io เดียวกันไม่ชนกัน)
  window.APP_NS = window.APP_NS || ('stk' + location.pathname.replace(/[^\/]*$/, '').replace(/[^A-Za-z0-9]+/g, '_'));

  // ── ชื่อระบบ / หน่วยงาน / โลโก้ จาก config.js · แทนคำ {{APP}} {{ORG}} … ในหน้า ──
  var BR = window.BRAND = {
    app: C.APP_NAME || 'ระบบ Stock', appEn: C.APP_NAME_EN || C.APP_NAME || 'Stock System',
    org: C.ORG_NAME || '', orgEn: C.ORG_NAME_EN || C.ORG_NAME || '', logo: C.LOGO_URL || '',
    prefix: String(C.ITEM_PREFIX || 'ITEM').toUpperCase().replace(/[^A-Z0-9]/g, '') || 'ITEM',
    staffDomain: String(C.STAFF_DOMAIN || '').trim().replace(/^@+/, '').toLowerCase(),
    support: String(C.SUPPORT_EMAIL || '').trim(), google: !!C.CLIENT_ID
  };
  var F = BR.form = C.FORMS || {};
  BR.formH1 = String(F.HEADER_1 || BR.org); BR.formH2 = String(F.HEADER_2 || (BR.orgEn !== BR.org ? BR.orgEn : ''));
  BR.formH3 = String(F.HEADER_3 || ''); BR.formFoot = String(F.FOOTER || BR.app);
  BR.fill = function (s) {
    var m = { APP: BR.app, APP_EN: BR.appEn, ORG: BR.org, ORG_EN: BR.orgEn, PREFIX: BR.prefix,
              STAFF_DOMAIN: BR.staffDomain ? '@' + BR.staffDomain : '', SUPPORT: BR.support,
              FORM_H1: BR.formH1, FORM_H2: BR.formH2, FORM_H3: BR.formH3, FORM_FOOT: BR.formFoot };
    return String(s).replace(/\{\{(APP_EN|APP|ORG_EN|ORG|PREFIX|STAFF_DOMAIN|SUPPORT|FORM_H1|FORM_H2|FORM_H3|FORM_FOOT)\}\}/g, function (_, k) { return m[k]; });
  };
  BR.isStaff = function (email) {
    var e = String(email || '').toLowerCase(), d = '@' + BR.staffDomain;
    return !!BR.staffDomain && e.length > d.length && e.slice(-d.length) === d;
  };
  var IFS = { google: BR.google, nogoogle: !BR.google, staff: !!BR.staffDomain, support: !!BR.support, logo: !!BR.logo,
              formh2: !!BR.formH2, formh3: !!BR.formH3 };
  function brandNode(n) {
    if (n.nodeType === 3) { if (n.nodeValue.indexOf('{{') >= 0) n.nodeValue = BR.fill(n.nodeValue); return; }
    if (n.nodeType !== 1) return;
    ['placeholder', 'title', 'alt', 'aria-label', 'value', 'content'].forEach(function (a) {
      var v = n.getAttribute(a); if (v && v.indexOf('{{') >= 0) n.setAttribute(a, BR.fill(v));
    });
    var c = n.getAttribute('data-if');
    if (c && IFS.hasOwnProperty(c) && !IFS[c]) n.style.display = 'none';
    if (n.hasAttribute('data-brand-logo')) { if (BR.logo) n.setAttribute('src', BR.logo); else n.style.display = 'none'; }
  }
  BR.apply = function (root) {
    if (!root) return;
    brandNode(root);
    if (!root.querySelectorAll) return;
    var w = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, null), x;
    while ((x = w.nextNode())) brandNode(x);
  };
  if (document.title.indexOf('{{') >= 0) document.title = BR.fill(document.title);
  document.addEventListener('DOMContentLoaded', function () {
    document.title = BR.fill(document.title);
    if (!C.API_URL) {                      // ยังไม่ได้ตั้งค่า: บอกให้ชัด แทนที่จะโหลดค้าง
      var w = document.createElement('div');
      w.setAttribute('role', 'alert');
      w.style.cssText = 'position:fixed;left:0;right:0;top:0;z-index:99999;background:#fff4d6;color:#5b3b00;padding:10px 16px;font:14px/1.5 system-ui,sans-serif;border-bottom:1px solid #e8c96a';
      w.textContent = 'ยังไม่ได้ตั้งค่า API_URL ในไฟล์ assets/config.js · ดูคู่มือติดตั้ง ขั้นที่ 5 (Not configured: set API_URL in assets/config.js)';
      document.body.appendChild(w);
    }
    BR.apply(document.body);
    try {
      new MutationObserver(function (ms) {
        ms.forEach(function (m) {
          if (m.type === 'characterData') brandNode(m.target);
          else m.addedNodes.forEach(function (n) { BR.apply(n); });
        });
      }).observe(document.body, { childList: true, subtree: true, characterData: true });
    } catch (e) {}
  });
  var K_IDT = (window.APP_NS + 'idt'), K_SES = (window.APP_NS + 'ses'), K_BY = (window.APP_NS + 'by'), K_ME = (window.APP_NS + 'me'), K_NAMES = (window.APP_NS + 'names');
  var PRE = { apiPing: 1, otpRequest: 1, otpVerify: 1, sessionCheck: 1, otpLogout: 1, googleSession: 1 };
  // หน้าในระบบ (ชื่อเดิมของ ?page=) → ไฟล์บน GitHub Pages
  var PAGES = { home: 'home.html', stock: 'stock.html', index: 'request.html', count: 'count.html',
                dash: 'dash.html', admin: 'admin.html', my: 'my.html', survey: 'survey.html' };

  function store(area, k, v) {
    try {
      var s = window[area];
      if (v === undefined) return s.getItem(k) || '';
      if (v === null) s.removeItem(k); else s.setItem(k, v);
    } catch (e) { /* โหมดส่วนตัว/ปิดที่เก็บ: ใช้ได้ แต่ต้องเข้าระบบใหม่ทุกหน้า */ }
    return '';
  }
  function ls(k, v) { return store('localStorage', k, v); }
  function ss(k, v) { return store('sessionStorage', k, v); }
  function mkErr(code, msg) { var e = new Error(msg); e.code = code; return e; }

  // ชื่อสินค้าอังกฤษที่จำไว้ ให้ i18n.js ใช้ได้ทันทีตอนโหลดหน้า
  try { var nm = JSON.parse(ls(K_NAMES) || 'null'); if (nm && nm.d) window.APP_NAMES = nm.d; } catch (e) {}

  // อ่านเวลาหมดอายุจากบัตร (กะเวลาต่ออายุเท่านั้น ความถูกต้องจริงตรวจที่หลังบ้านทุกคำขอ)
  function jwtExp(t) {
    try {
      var p = t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      return Number(JSON.parse(atob(p + '==='.slice((p.length + 3) % 4))).exp) || 0;
    } catch (e) { return 0; }
  }
  function freshIdt() { var t = ls(K_IDT); return t && jwtExp(t) > Date.now() / 1000 + 60 ? t : ''; }
  function cred() {
    var s = ls(K_SES); if (s) return { ses: s };
    var t = freshIdt(); return t ? { idt: t } : {};
  }
  function forget() {
    ls(K_IDT, null); ls(K_SES, null); ls(K_BY, null); ss(K_ME, null);
    try { Object.keys(localStorage).forEach(function (k) { if (k.indexOf(K_C) === 0) localStorage.removeItem(k); }); } catch (e) {}
  }

  /** แลกบัตร Google เป็นบัตรผ่านของระบบ 6 ชม. */
  function exchange(t) {
    return postRetry('googleSession', [t]).then(function (r) {
      ls(K_SES, r.tok); ls(K_BY, 'GOOGLE'); ls(K_IDT, null); ss(K_ME, null);
      return r;
    });
  }
  /** เครื่องที่ยังเก็บบัตร Google แบบเดิม: ยังไม่หมดอายุ → แลกเป็นบัตรผ่าน · หมดแล้ว → ลบทิ้ง (ไปหน้า Login ทันที ไม่ต้องรอ) */
  function upgrade() {
    var t = ls(K_IDT);
    if (!t || ls(K_SES)) return Promise.resolve();
    if (!freshIdt()) { ls(K_IDT, null); return Promise.resolve(); }
    return exchange(t).catch(function () {});        // แลกไม่ได้ (หลังบ้านรุ่นเก่า/เน็ตหลุด) → ใช้บัตร Google ต่อไปจนหมดอายุ
  }

  function post(fn, args) {
    if (!C.API_URL) return Promise.reject(mkErr('NOT_CONFIGURED', 'ยังไม่ได้ตั้งค่า API_URL ใน assets/config.js'));
    var body = { v: 1, fn: fn, args: args || [] }, c = PRE[fn] ? {} : cred(), k;
    for (k in c) body[k] = c[k];
    return fetch(C.API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },   // simple request: ไม่มี preflight
      body: JSON.stringify(body),
      redirect: 'follow', credentials: 'omit', cache: 'no-store'
    }).then(function (r) {
      if (!r.ok) throw mkErr('NETWORK', 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ (' + r.status + ') กรุณาลองใหม่');
      return r.json().catch(function () {               // Google ตอบหน้า error แทน JSON (ขัดข้องชั่วคราว)
        throw mkErr('NETWORK', 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ ตรวจอินเทอร์เน็ตแล้วลองใหม่');
      });
    }, function () {
      throw mkErr('NETWORK', 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ ตรวจอินเทอร์เน็ตแล้วลองใหม่');
    }).then(function (res) {
      if (res && res.ok) return res.data;
      throw mkErr((res && res.code) || 'ERROR', (res && res.error) || 'เกิดข้อผิดพลาด');
    });
  }

  /**
   * ลองใหม่อัตโนมัติ: Apps Script บางช่วงตอบช้า 20–35 วิ หรือตอบหน้า error ของ Google
   * เฉพาะคำสั่งอ่านอย่างเดียว ลองอีก 2 ครั้ง (รอ 1.5 วิ และ 4 วิ) · คำสั่งบันทึกไม่ลองซ้ำ กันบันทึกซ้ำ
   */
  var SAFE = { apiPing: 1, sessionCheck: 1, googleSession: 1, meInfo: 1, namesEn: 1, appUrl: 1, homeBoot: 1, getBoot: 1,
               myRequests: 1, surveyBoot: 1, stockList: 1, stockPhotos: 1, radioUnitList: 1, listItems: 1, requestBoot: 1,
               getRequisition: 1, getPrintHtml: 1, listPending: 1, stockPhotoSet: 1, getBootstrapData: 1, countListItems: 1, getItem: 1,
               getProgress: 1, facetData: 1, dashData: 1, adminBoot: 1, reqDocument: 1 };
  var WAIT = [1500, 4000];
  /**
   * อ่านอย่างเดียวมีคำขอซ้ำซ้อนจากหลายตัวเริ่มต้นหน้าได้ จึงรวมคำขอเดียวกันระหว่างที่ยังรอผล
   * และคงการยิงคู่ไว้เพียงครั้งเดียวที่ 5 วิ เผื่อ Apps Script/googleusercontent ค้างแบบสุ่ม
   * คำสั่งบันทึกไม่รวมคำขอและไม่ยิงซ้ำ เพื่อป้องกันการบันทึกซ้ำ
   */
  var HEDGE_MS = [5000];
  var INFLIGHT = Object.create(null);
  function postHedged(fn, args) {
    if (!SAFE[fn]) return post(fn, args);
    var key = fn + '|' + JSON.stringify(args || []);
    if (INFLIGHT[key]) return INFLIGHT[key];
    var p = new Promise(function (ok, no) {
      var done = false, pending = 0, timers = [];
      var stop = function () { timers.forEach(clearTimeout); };
      var fire = function () {
        pending++;
        post(fn, args).then(function (d) {
          pending--;
          if (!done) { done = true; stop(); ok(d); }
        }, function (e) {
          pending--;
          if (done) return;
          if (!e || e.code !== 'NETWORK' || pending === 0) { done = true; stop(); no(e); }
        });
      };
      fire();
      HEDGE_MS.forEach(function (ms) { timers.push(setTimeout(function () { if (!done) fire(); }, ms)); });
    });
    INFLIGHT[key] = p.then(function (d) { delete INFLIGHT[key]; return d; }, function (e) { delete INFLIGHT[key]; throw e; });
    return INFLIGHT[key];
  }
  function postRetry(fn, args, n) {
    n = n || 0;
    return postHedged(fn, args).catch(function (e) {
      if (e && e.code === 'NETWORK' && SAFE[fn] && n < WAIT.length)
        return new Promise(function (ok) { setTimeout(ok, WAIT[n]); }).then(function () { return postRetry(fn, args, n + 1); });
      throw e;
    });
  }

  /** เรียกหลังบ้าน · บัตรหมดอายุหรือไม่มีบัตร → ลบบัตรในเครื่อง แล้วไปหน้าเข้าสู่ระบบพร้อมจำหน้าเดิม (ตะกร้าอยู่ใน ?add= ไม่หาย) */
  function call(fn, args) {
    if (PRE[fn]) return postRetry(fn, args);
    return upgrade().then(function () { return postRetry(fn, args); })
      .catch(function (e) {
        if (/^AUTH_/.test(e.code || '')) { forget(); Auth.toLogin('expired'); }
        throw e;
      });
  }

  // ── ความเร็ว: จำข้อมูลไว้ในเครื่อง แสดงทันที แล้วอัปเดตจากหลังบ้าน ─────────────
  // ข้อมูลพัสดุ/คงเหลือของหน้าเว็บ (ไม่ใช่รหัสผ่าน) · ลบทั้งหมดเมื่อออกจากระบบหรือหมดเวลาเข้าใช้ · ยอดจริงตรวจที่หลังบ้านตอนบันทึกเสมอ
  var K_C = (window.APP_NS + 'c_'), C_AGE = 24 * 3600000;
  function cacheRead(key) {
    try { var o = JSON.parse(ls(K_C + key) || 'null'); if (o && o.t > Date.now() - C_AGE) return o; } catch (e) {}
    return null;
  }
  function cacheForget(key) { try { localStorage.removeItem(K_C + key); } catch (e) {} }
  function cacheWrite(key, d) {
    try { localStorage.setItem(K_C + key, JSON.stringify({ t: Date.now(), d: d })); } catch (e) { /* ที่เก็บเต็ม: ข้าม */ }
  }
  /** onData(data, fromCache, savedAt) ถูกเรียกได้ 2 ครั้ง: ของที่จำไว้ (ถ้ามี) ทันที แล้วของใหม่จากหลังบ้าน
   *  onFail(err, hadCache) ถ้าโหลดใหม่ไม่ได้ */
  function fresh(key, fn, args, onData, onFail) {
    var c = cacheRead(key);
    if (c) { try { onData(c.d, true, c.t); } catch (e) { if (window.console) console.error('[stock] cache', key, e); } }
    return call(fn, args || []).then(function (d) {
      cacheWrite(key, d); onData(d, false, Date.now()); return d;
    }, function (e) { if (onFail) onFail(e, !!c); else if (window.console) console.error('[stock]', fn, e); });
  }
  /** กุญแจของข้อมูลส่วนตัว ผูกกับบัตรผ่านของคนที่เข้าระบบอยู่ · เข้าระบบใหม่ = กุญแจใหม่ คนถัดไปที่ใช้เครื่องเดียวกันไม่เห็นของคนก่อน */
  function mine(key) {
    var s = ls(K_SES) || ls(K_IDT) || '', h = 5381;
    for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
    return key + '_' + (h >>> 0).toString(36);
  }
  // รูปพัสดุ: จำใน IndexedDB ตามรหัส + เวลาบันทึกรูป (เปลี่ยนรูปแล้วโหลดใหม่เอง)
  var idbP = null;
  function idb() {
    if (!idbP) idbP = new Promise(function (ok, no) {
      try {
        var r = indexedDB.open(window.APP_NS + 'db', 1);
        r.onupgradeneeded = function () { r.result.createObjectStore('ph'); };
        r.onsuccess = function () { ok(r.result); };
        r.onerror = function () { no(r.error); };
      } catch (e) { no(e); }
    });
    return idbP;
  }
  /** list = [{c: รหัส, v: เวลารูป}] → Promise {รหัส: dataURL} เฉพาะที่จำไว้และยังเป็นรูปเดิม */
  function photoGet(list) {
    if (!list.length) return Promise.resolve({});
    return idb().then(function (d) {
      return new Promise(function (ok) {
        var out = {}, n = list.length, st = d.transaction('ph', 'readonly').objectStore('ph');
        list.forEach(function (x) {
          var q = st.get(x.c);
          q.onsuccess = function () { var v = q.result; if (v && x.v && v.v === x.v) out[x.c] = v.u; if (--n === 0) ok(out); };
          q.onerror = function () { if (--n === 0) ok(out); };
        });
      });
    }).catch(function () { return {}; });
  }
  function photoPut(m, vmap) {
    idb().then(function (d) {
      var st = d.transaction('ph', 'readwrite').objectStore('ph');
      Object.keys(m).forEach(function (c) { if (vmap[c]) st.put({ v: vmap[c], u: m[c] }, c); });
    }).catch(function () {});
  }

  // ── ตัวครอบ google.script.run ──────────────────────────────────
  function runner(okH, failH, uo) {
    return new Proxy({}, {
      get: function (_, k) {
        if (typeof k !== 'string' || k === 'then') return undefined;
        if (k === 'withSuccessHandler') return function (h) { return runner(h, failH, uo); };
        if (k === 'withFailureHandler') return function (h) { return runner(okH, h, uo); };
        if (k === 'withUserObject') return function (o) { return runner(okH, failH, o); };
        return function () {
          var a = Array.prototype.slice.call(arguments);
          call(k, a).then(
            function (d) { if (okH) okH(d, uo); },
            function (e) { if (failH) failH(e, uo); else if (window.console) console.error('[stock]', k, e); });
        };
      }
    });
  }
  function install() {
    var g = window.google = window.google || {};
    g.script = g.script || {};
    var d = Object.getOwnPropertyDescriptor(g.script, 'run');
    if (!d || !d.get || !d.get.__app) {
      var getter = function () { return runner(); };
      getter.__app = true;
      Object.defineProperty(g.script, 'run', { configurable: true, enumerable: true, get: getter });
    }
    if (!g.script.host) g.script.host = { close: function () { window.close(); }, setHeight: function () {}, setWidth: function () {} };
  }
  install();
  // ไลบรารีปุ่ม Google โหลดทีหลัง ถ้ามันสร้าง window.google ใหม่ ให้ใส่ตัวครอบกลับเข้าไป
  var prevLoad = window.onGoogleLibraryLoad;
  window.onGoogleLibraryLoad = function () { install(); if (typeof prevLoad === 'function') prevLoad(); };

  // ── เข้าสู่ระบบ ───────────────────────────────────────────────
  var inited = false;
  function gis() { return window.google && google.accounts && google.accounts.id; }
  function whenGis(ms) {
    return new Promise(function (ok, no) {
      var t0 = Date.now();
      (function wait() {
        if (gis()) return ok(gis());
        if (Date.now() - t0 > ms) return no(mkErr('AUTH_EXPIRED', 'โหลดปุ่ม Google ไม่สำเร็จ ลองใหม่ หรือใช้รหัสทางอีเมล'));
        setTimeout(wait, 100);
      })();
    });
  }
  function init(id) {
    if (inited) return;
    inited = true;
    id.initialize({
      client_id: C.CLIENT_ID,
      callback: onCredential,
      auto_select: true,              // เคยเข้าแล้ว กดปุ่มครั้งเดียวไม่ต้องเลือกบัญชีซ้ำ (ถ้าเบราว์เซอร์อนุญาต)
      cancel_on_tap_outside: false,
      use_fedcm_for_prompt: true,
      itp_support: true,
      context: 'signin'
    });
  }
  /** กดปุ่ม Google สำเร็จ → แลกเป็นบัตรผ่าน 6 ชม. แล้วค่อยไปต่อ */
  function onCredential(r) {
    var t = r && r.credential;
    if (!t) return;
    ss(K_ME, null);
    if (typeof Auth.onSignInStart === 'function') Auth.onSignInStart();
    exchange(t).then(function () {
      if (typeof Auth.onSignIn === 'function') Auth.onSignIn();
    }, function (e) {
      if (e && (e.code === 'NOT_ALLOWED' || e.code === 'AUTH_REQUIRED')) {   // หลังบ้านยังเป็นรุ่นก่อน (ไม่รู้จัก googleSession): ใช้บัตร Google แบบเดิม
        ls(K_IDT, t); ls(K_SES, null); ls(K_BY, null);
        if (typeof Auth.onSignIn === 'function') Auth.onSignIn();
        return;
      }
      if (typeof Auth.onSignInFail === 'function') Auth.onSignInFail(e);
      else if (window.console) console.error('[stock] googleSession', e);
    });
  }
  function pageKey() {
    var f = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    for (var k in PAGES) if (PAGES[k] === f) return k;
    return f === 'privacy.html' ? 'privacy' : 'login';
  }

  var Auth = {
    onSignIn: null,                   // หน้าเข้าสู่ระบบตั้งค่าเอง: เข้าได้แล้ว
    onSignInFail: null,               // หน้าเข้าสู่ระบบตั้งค่าเอง: แลกบัตรไม่สำเร็จ (ไม่มีสิทธิ์ เน็ตหลุด)
    googleSession: function (t) { return exchange(t); },

    renderButton: function (el, lang) {
      return whenGis(10000).then(function (id) {
        init(id);
        id.renderButton(el, { type: 'standard', theme: 'outline', size: 'large', text: 'signin_with',
                              shape: 'pill', width: 280, locale: lang === 'en' ? 'en' : 'th' });
      });
    },

    otpRequest: function (email) { return call('otpRequest', [email]); },
    otpVerify: function (email, code) {
      return call('otpVerify', [email, code]).then(function (r) {
        ls(K_SES, r.tok); ls(K_BY, 'EMAIL'); ls(K_IDT, null); ss(K_ME, null);
        return r;
      });
    },
    sessionCheck: function () { var s = ls(K_SES); return s ? call('sessionCheck', [s]) : Promise.resolve(null); },

    /** ชื่อ บทบาท หน้าที่เข้าได้ เมนู (จำไว้ 5 นาทีในแท็บนี้) */
    me: function (fresh) {
      var c = !fresh && ss(K_ME);
      if (c) { try { var o = JSON.parse(c); if (o.t > Date.now() - 300000) return Promise.resolve(o.d); } catch (e) {} }
      return call('meInfo', []).then(function (d) { ss(K_ME, JSON.stringify({ t: Date.now(), d: d })); return d; });
    },

    /** ชื่อสินค้าอังกฤษ: โหลดใหม่วันละครั้ง */
    names: function () {
      try { var o = JSON.parse(ls(K_NAMES) || 'null'); if (o && o.t > Date.now() - 86400000) return Promise.resolve(o.d); } catch (e) {}
      return call('namesEn', []).then(function (d) {
        ls(K_NAMES, JSON.stringify({ t: Date.now(), d: d || [] }));
        if (typeof window.APP_SET_NAMES === 'function') window.APP_SET_NAMES(d || []);
        return d;
      });
    },

    signedIn: function () { return !!(ls(K_SES) || freshIdt()); },
    authBy: function () { return ls(K_SES) ? (ls(K_BY) || 'EMAIL') : (freshIdt() ? 'GOOGLE' : ''); },

    /** ไปหน้าเข้าสู่ระบบ แล้วกลับมาหน้าเดิม (พร้อมค่าใน ?) หลังเข้าได้ */
    toLogin: function (reason) {
      var p = pageKey();
      if (p === 'login' || p === 'privacy') return;
      location.href = C.SITE + '?page=login&next=' + encodeURIComponent(p) +
        (location.search.length > 1 ? '&q=' + encodeURIComponent(location.search.slice(1)) : '') +
        (reason ? '&err=' + encodeURIComponent(reason) : '');
    },

    /** ล้างบัตรในเบราว์เซอร์นี้ (ใช้ทั้งออกจากระบบและสลับบัญชี) */
    clear: function () {
      var s = ls(K_SES);
      forget();
      try { if (gis()) gis().disableAutoSelect(); } catch (e) {}
      return s ? post('otpLogout', [s]).catch(function () {}) : Promise.resolve();
    },
    signOut: function () {
      var go = function () { location.href = C.SITE + '?page=login&out=1'; };
      Auth.clear().then(go, go);
    }
  };

  window.StockAPI = { call: call, fresh: fresh, cacheRead: cacheRead, remember: cacheWrite, invalidate: cacheForget, mine: mine, photoGet: photoGet, photoPut: photoPut,
                    PAGES: PAGES, pageKey: pageKey, url: function (page, q) {
    var f = PAGES[page] || 'index.html'; return C.SITE + f + (q ? '?' + q : '');
  } };
  window.StockAuth = Auth;
})();

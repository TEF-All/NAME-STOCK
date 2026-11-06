/*
 * {{APP}} · shell.js — แทน injectNav_ ฝั่งเซิร์ฟเวอร์เดิม
 *   ยังไม่เข้าสู่ระบบ → ไปหน้าเข้าสู่ระบบ · ผู้ใช้ภายนอกใหม่ → แบบสอบถาม
 *   วาดแถบเมนูตามบทบาท (meInfo) · หน้าที่บทบาทเข้าไม่ได้ → แจ้งไม่มีสิทธิ์ (ข้อมูลจริงตรวจสิทธิ์ที่หลังบ้านทุกคำสั่ง)
 *   โหลดชื่อสินค้าอังกฤษให้ i18n.js
 *   ธีมกระจกสว่าง (Liquid Glass แบบ B) ทุกหน้าในระบบ — ดู glassTheme ข้างล่าง
 */
(function () {
  'use strict';
  var A = window.StockAPI, Auth = window.StockAuth, C = window.APP_CONFIG || {};
  var page = A.pageKey();
  if (page === 'login' || page === 'privacy') return;

  // ── ธีมกระจกสว่าง (แบบ B ที่เลือกบน Claude Design) ──
  //   ใส่ตอนโหลดสคริปต์ในส่วนหัว ก่อนวาดหน้า จึงไม่กะพริบ · ทุกกฎขึ้นต้น html.app-glass จึงชนะ CSS เดิมของแต่ละหน้า
  //   อยู่ใน @media screen ทั้งหมด ใบพิมพ์ทุกใบเหมือนเดิม · เบราว์เซอร์ที่ไม่มีกระจกเบลอ / ตั้งลดความโปร่งใส ได้พื้นทึบแทน
  //   ปิดชั่วคราวได้ด้วย ?glass=0 ท้ายลิงก์ · ภาพพื้นหลัง assets/bg-warehouse.jpg
  (function glassTheme() {
    if (/[?&]glass=0(&|$)/.test(location.search)) return;
    var d = document.documentElement, head = document.head;
    if (!head || d.classList.contains('app-glass')) return;
    var src = (document.currentScript && document.currentScript.src) || '';
    var bg = (src ? src.replace(/[^\/?#]*([?#].*)?$/, '') : 'assets/') + 'bg-warehouse.jpg';
    d.classList.add('app-glass', 'p-' + page);

    var H = 'html.app-glass';
    var sel = function (list) { return list.map(function (s) { return H + s; }).join(','); };
    var FONT = "'IBM Plex Sans Thai','Noto Sans Thai',system-ui,sans-serif", HEAD = "Kanit,'IBM Plex Sans Thai',sans-serif";
    var BLUR = '-webkit-backdrop-filter:blur(16px) saturate(150%);backdrop-filter:blur(16px) saturate(150%);';
    var NAVY = 'background:rgba(10,35,66,.82);border:1.5px solid rgba(255,255,255,.32);' +
      'box-shadow:0 18px 40px rgba(10,35,66,.26),inset 0 1px 0 rgba(255,255,255,.45),inset 0 -1px 0 rgba(255,255,255,.1);' +
      '-webkit-backdrop-filter:blur(16px) saturate(160%);backdrop-filter:blur(16px) saturate(160%);';
    // กระจกพื้นผิวหลัก (หัวหน้า การ์ด แท็บ) · กระจกข้อมูลทึบกว่า (ตาราง) ให้อ่านตัวเลขง่าย
    var SURF = [' .app-card', ' .app-header', ' .app-shell-msg', '.p-index .app-tab', '.p-home .card', '.p-dash .card', '.p-dash .tile',
                '.p-dash .bar', '.p-admin .card', '.p-admin .act', '.p-stock .adm'];
    var DATA = ['.p-index .lines', '.p-my .lines', '.p-survey .lines', '.p-dash .scroll'];
    var G = 'background:linear-gradient(180deg,rgba(255,255,255,.72),rgba(255,255,255,.58));border:1.5px solid rgba(255,255,255,.92);' +
      'box-shadow:0 14px 36px rgba(10,35,66,.11),0 2px 6px rgba(10,35,66,.05),inset 0 1px 0 #fff;' + BLUR;
    var css = [
      H + '{background:#eaf6fc}',
      H + ' body{background:transparent;font-family:' + FONT + '}',
      H + ' body:before{content:"";position:fixed;inset:0;z-index:-1;pointer-events:none;' +
        'background:radial-gradient(760px 520px at 88% 0%,rgba(53,163,204,.3),rgba(53,163,204,0) 70%),' +
        'linear-gradient(180deg,rgba(234,246,252,.8) 0%,rgba(234,246,252,.88) 55%,rgba(234,246,252,.92) 100%),' +
        'url("' + bg + '") center 42%/cover no-repeat}',
      H + ' h1,' + H + ' h2{font-family:' + HEAD + '}',
      H + ' h1{font-weight:600}',
      // แถบเมนู: กระจกน้ำเงินกรมท่า
      H + ' .appnav{margin:12px 16px 0;padding:8px 10px 8px 18px;border-radius:24px;font-family:' + FONT + ';' + NAVY + '}',
      H + ' .appnav .tn-b{font-family:' + HEAD + ';font-weight:600;font-size:18px}',
      H + ' .appnav .tn-a{border-radius:999px;padding:7px 13px}',
      H + ' .appnav .tn-a.on{background:#fff;color:#0a2342;box-shadow:0 4px 12px rgba(2,10,28,.2),inset 0 1px 0 #fff}',
      H + ' .appnav .tn-x{border-radius:999px;border-color:rgba(255,255,255,.35)}',
      H + ' .appnav .tn-env{border-radius:999px;padding:3px 9px}',
      // พื้นผิวกระจก
      sel(SURF) + '{' + G + '}',
      sel([' .app-card', ' .app-shell-msg', '.p-dash .card', '.p-admin .card', '.p-admin .act']) + '{border-radius:22px}',
      sel(['.p-home .card', '.p-dash .tile', '.p-stock .adm']) + '{border-radius:20px}',
      sel(DATA) + '{background:rgba(255,255,255,.84);border:1.5px solid rgba(255,255,255,.95);border-radius:16px;' +
        'box-shadow:0 10px 28px rgba(10,35,66,.08),inset 0 1px 0 #fff}',
      sel(['.p-index .lines th', '.p-my .lines th', '.p-survey .lines th', '.p-dash th']) + '{background:rgba(234,246,252,.97);color:#33495c}',
      // หัวหน้าแต่ละหน้า: จากแถบน้ำเงินเต็มจอ เป็นการ์ดกระจกตัวอักษรกรมท่า
      H + ' .app-header{color:#16232e;border-radius:24px;width:calc(100% - 32px);max-width:calc(var(--app-maxwidth,720px) - 32px);margin:16px auto 22px;padding:16px 22px}',
      H + ' .app-header .inner{max-width:none}',
      H + ' .app-header .org{color:#5b7183;font-size:13px;font-weight:500;letter-spacing:.03em;text-transform:none;margin-bottom:2px}',
      H + ' .app-header h1{color:#0a2342}',
      H + ' .app-header p,' + H + ' .app-header .who,' + H + ' .app-header .tagline{color:#5b7183}',
      H + '.p-dash .bar{color:#16232e;border-radius:24px;width:calc(100% - 36px);max-width:1004px;margin:16px auto 0;padding:14px 22px}',
      H + '.p-dash .bar .wrap{max-width:none}',
      H + '.p-dash .bar h1{color:#0a2342}',
      H + '.p-dash .bar .org,' + H + '.p-dash .bar .right{opacity:1;color:#5b7183}',
      H + '.p-dash .tile.t-bad{background:rgba(253,236,234,.8)}',
      H + '.p-dash .tile.t-good{background:rgba(230,244,236,.8)}',
      // ปุ่ม แท็บ
      H + ' .btn-app{border-radius:12px;box-shadow:0 6px 16px rgba(10,35,66,.16),inset 0 1px 0 rgba(255,255,255,.25)}',
      H + ' .btn-app-ghost{background:rgba(255,255,255,.62);border-color:rgba(255,255,255,.95);border-radius:12px}',
      H + ' .btn-app-ghost:hover{background:rgba(234,246,252,.96)}',
      H + '.p-index .app-tab{border-radius:16px;border-top:3px solid rgba(27,127,168,.28)}',
      H + '.p-index .app-tab.on{background:rgba(234,246,252,.95);border-top-color:#1b7fa8}',
      // หน้าแรก
      H + '.p-home h1{color:#0a2342}',
      H + '.p-home h2{font-weight:600}',
      H + '.p-home a.mc:hover{box-shadow:0 20px 44px rgba(10,35,66,.17),inset 0 1px 0 #fff}',
      H + '.p-home .mc .ic{border-radius:50%;background:linear-gradient(180deg,rgba(27,127,168,.16),rgba(27,127,168,.07));' +
        'border:1px solid #fff;color:#176887;box-shadow:inset 0 1px 0 #fff}',
      H + '.p-home .notice{background:rgba(255,247,224,.88);border-color:rgba(243,217,139,.9)}',
      // รายการพัสดุ
      H + '.p-stock .sbar{background:rgba(234,246,252,.74);margin:0 0 6px;padding:12px 14px 10px;border-radius:22px;' +
        'border:1.5px solid rgba(255,255,255,.9);box-shadow:0 10px 26px rgba(10,35,66,.08);' + BLUR + '}',
      H + '.p-stock .ph,' + H + '.p-stock .ph.nop{background:rgba(255,255,255,.68);border:1.5px solid rgba(255,255,255,.95);' +
        'box-shadow:0 8px 22px rgba(10,35,66,.08),inset 0 1px 0 #fff}',
      H + '.p-stock .ph img{background:transparent}',
      H + '.p-stock .card:hover .ph{box-shadow:0 14px 30px rgba(10,35,66,.16),inset 0 1px 0 #fff}',
      H + '.p-stock .bask{background:rgba(255,255,255,.78);border-top:1.5px solid rgba(27,127,168,.45);' + BLUR + '}',
      // ผู้ดูแลระบบ
      H + '.p-admin header.top,' + H + '.p-admin header.sub{border-radius:24px;margin:12px 16px 0;' + NAVY + '}',
      H + '.p-admin .act:hover{border-color:rgba(29,63,133,.55)}',
      H + '.p-admin .bar{background:rgba(255,255,255,.8);border-top:1.5px solid rgba(255,255,255,.95);' + BLUR + '}',
      H + '.p-admin .tabs{background:rgba(255,255,255,.68);border-color:rgba(255,255,255,.95);' + BLUR + '}',
      H + '.p-admin th{background:rgba(242,245,249,.88)}',
      '@media (max-width:600px){' + H + ' .appnav{margin:8px 8px 0;padding:8px 8px 8px 14px;border-radius:20px}' +
        H + ' .appnav .tn-a{padding:6px 10px;font-size:13.5px}' + H + ' .appnav .tn-x{padding:5px 9px}' +
        H + ' .app-header{margin:12px auto 16px;padding:14px 18px;border-radius:20px}' +
        H + '.p-admin header.top,' + H + '.p-admin header.sub{margin:8px 8px 0;border-radius:20px}}'
    ];
    // ไม่มีกระจกเบลอ หรือผู้ใช้ตั้งลดความโปร่งใส → พื้นทึบอ่านง่าย
    var solid = sel(SURF) + '{background:rgba(255,255,255,.96)}' + H + ' .appnav,' + H + '.p-admin header.top,' + H + '.p-admin header.sub{background:#0a2342}' +
      H + '.p-stock .sbar{background:#eaf6fc}' + H + '.p-stock .bask,' + H + '.p-admin .bar{background:#fff}';
    var st = document.createElement('style');
    st.id = 'appGlass';
    st.textContent = '@media screen{' + css.join('\n') +
      '\n@supports not ((-webkit-backdrop-filter:blur(1px)) or (backdrop-filter:blur(1px))){' + solid + '}' +
      '\n@media (prefers-reduced-transparency:reduce){' + solid + '}}';
    var fl = document.createElement('link');
    fl.rel = 'stylesheet';
    fl.href = 'https://fonts.googleapis.com/css2?family=Kanit:wght@500;600&family=IBM+Plex+Sans+Thai:wght@400;500;600;700&display=swap';
    head.appendChild(fl);
    head.appendChild(st);
  })();

  if (!Auth.signedIn()) { Auth.toLogin(); return; }

  var esc = function (s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); };
  var CSS = '<style>' +
    '.appnav{background:#0A2342;color:#fff;font:14px/1.2 Sarabun,"Noto Sans Thai",system-ui,sans-serif;display:flex;flex-wrap:wrap;align-items:center;gap:6px 10px;padding:8px 14px;position:relative;z-index:50}' +
    '.appnav-main{display:flex;flex:1 1 760px;min-width:0;flex-wrap:wrap;align-items:center;gap:4px 6px}' +
    '.appnav-user{display:flex;flex:0 1 auto;min-width:0;align-items:center;justify-content:flex-end;gap:4px 6px;margin-left:auto}' +
    '.appnav .tn-b{flex:0 0 auto;font-weight:700;margin-right:4px}.appnav .tn-a{color:#cfe0f5;text-decoration:none;padding:7px 11px;border-radius:999px;white-space:nowrap}' +
    '.appnav .tn-a:hover{background:rgba(255,255,255,.14);color:#fff}.appnav .tn-a.on{background:#fff;color:#0A2342;font-weight:700}' +
    '.appnav .tn-w{font-size:12px;color:#9db7d6;max-width:220px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
    '.appnav .tn-x{color:#cfe0f5;text-decoration:none;font-size:12px;padding:5px 9px;border:1px solid rgba(255,255,255,.28);border-radius:999px;white-space:nowrap}' +
    '.appnav .tn-x:hover{background:rgba(255,255,255,.14);color:#fff}.appnav .tn-env{background:#f5b301;color:#0A2342;font-weight:700;font-size:11px;padding:3px 9px;border-radius:999px}' +
    '.app-shell-msg{max-width:560px;margin:40px auto;padding:24px;background:#fff;border:1px solid #CFE2EF;border-radius:10px;text-align:center;font-family:"IBM Plex Sans Thai",system-ui,sans-serif}' +
    '.app-shell-msg h1{font-size:18px;margin:0 0 8px;color:#0A2342}.app-shell-msg p{font-size:14px;color:#50677D;margin:0}' +
    '@media (max-width:1200px){.appnav{gap:6px 8px}.appnav-main{flex-basis:100%}.appnav-user{flex:1 1 100%;justify-content:flex-end;margin-left:0;border-top:1px solid rgba(255,255,255,.18);padding-top:6px}}' +
    '@media (max-width:600px){.appnav{padding:8px 10px;gap:5px}.appnav-main,.appnav-user{flex-basis:100%;justify-content:flex-start}.appnav-user{flex-wrap:wrap}.appnav .tn-w{flex:1 1 100%;max-width:100%;order:-1}.appnav .tn-a{padding:6px 9px;font-size:13.5px}.appnav .tn-x{padding:5px 8px}}' +
    '@media print{.appnav{display:none}}</style>';

  function navHtml(me) {
    var links = (me.nav || []).map(function (x) {
      return '<a class="tn-a' + (x[0] === page ? ' on' : '') + '" href="' + esc(A.url(x[0])) + '">' + esc(x[1]) + '</a>';
    }).join('');
    var who = esc(me.name || '') + ' · ' + esc(me.roleLabel || me.role) + (me.email ? ' · ' + esc(me.email) : '');
    var en = window.APP_LANG === 'en';
    return CSS + '<div class="appnav"><div class="appnav-main"><span class="tn-b">' + BRAND.app + '</span>' +
      (C.ENV === 'staging' ? '<span class="tn-env">ชุดทดสอบ</span>' : '') + links +
      '</div><div class="appnav-user"><span class="tn-w">' + who + '</span>' +
      '<a class="tn-x" id="appLang" data-noi18n href="' + esc(location.href) + '">' + (en ? 'ภาษาไทย' : 'English') + '</a>' +
      '<a class="tn-x" id="appSwitch" href="#">สลับบัญชี</a>' +
      '<a class="tn-x" id="appOut" href="#">ออกจากระบบ</a></div></div>';
  }

  function put(html) {
    var box = document.createElement('div');
    box.innerHTML = html;
    var b = document.body;
    while (box.lastChild) b.insertBefore(box.lastChild, b.firstChild);
  }

  function message(title, text) {
    Array.prototype.forEach.call(document.body.children, function (el) {
      if (!el.classList.contains('appnav') && el.tagName !== 'STYLE' && el.tagName !== 'SCRIPT') el.style.display = 'none';
    });
    var d = document.createElement('div');
    d.className = 'app-shell-msg';
    d.innerHTML = '<h1>' + esc(title) + '</h1><p>' + esc(text) + '</p>';
    document.body.appendChild(d);
  }

  document.addEventListener('click', function (e) {
    var t = e.target && e.target.closest && e.target.closest('#appSwitch, #appOut');
    if (!t) return;
    e.preventDefault();
    if (t.id === 'appOut') Auth.signOut();
    else Auth.clear().then(function () { location.href = C.SITE + '?page=login&switch=1'; });
  });

  document.addEventListener('DOMContentLoaded', function () {
    Auth.me().then(function (me) {
      if (me.role === 'EXTERNAL_NEW' && page !== 'survey') { location.replace(A.url('survey')); return; }
      if (page !== 'survey') put(navHtml(me));
      if (page !== 'survey' && (me.pages || []).indexOf(page) < 0)
        message('หน้านี้ไม่เปิดให้สิทธิ์ของคุณ (' + (me.roleLabel || me.role) + ')', 'หากคิดว่าควรเข้าได้ กรุณาติดต่อผู้ดูแลระบบ {{APP}}');
      Auth.names().catch(function () {});
    }, function (e) {
      if (e && e.code === 'NO_ACCESS') { Auth.toLogin('noaccess'); return; }
      if (e && /^AUTH_/.test(e.code || '')) return;            // api.js พาไปหน้าเข้าสู่ระบบแล้ว
      put(CSS);
      message('ยังเข้าสู่ระบบไม่ได้', String((e && e.message) || e));
    });
  });
})();

/**
 * เซิร์ฟเวอร์ทดสอบในเครื่อง: เสิร์ฟหน้าเว็บ + หลังบ้านจริงบนบริการจำลอง (mock-gas.js)
 * รัน: node tools/local-test/server.js [port]   แล้วเปิด http://localhost:8765/
 * ทดสอบหน้าเว็บกับหลังบ้านที่ Deploy แล้ว: node tools/local-test/server.js 8765 --api=https://script.google.com/macros/s/…/exec
 * เข้าสู่ระบบด้วยรหัสทางอีเมล: ดูรหัสล่าสุดที่ http://localhost:8765/__mail (ใช้ทดสอบในเครื่องเท่านั้น)
 * ข้อมูลอยู่ในหน่วยความจำ ปิดเซิร์ฟเวอร์แล้วข้อมูลถูกล้าง · ผู้ดูแลคนแรก = owner@example.com (ไม่ใช่อีเมลจริง)
 */
'use strict';
const http = require('http'), fs = require('fs'), path = require('path');
const { load } = require('./mock-gas');
const PORT = Number(process.argv[2] || process.env.PORT || 8765);
const LIVE = (process.argv.find(a => a.indexOf('--api=') === 0) || '').slice(6);   // ใช้หลังบ้านจริงแทนตัวจำลอง
const SITE = path.resolve(__dirname, '..', '..');
const G = LIVE ? null : load({ owner: 'owner@example.com', serviceUrl: 'http://localhost:' + PORT + '/api' });
if (G) {
  G.ctx.SETUP_1_start();
  Object.assign(G.props, { FRONT_URL: 'http://localhost:' + PORT + '/', ORG_NAME: 'ชมรมทดสอบระบบ', STAFF_DOMAIN: 'example.org' });
}
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css', '.jpg': 'image/jpeg', '.png': 'image/png', '.json': 'application/json' };

http.createServer((req, res) => {
  const u = new URL(req.url, 'http://x');
  if (G && u.pathname === '/api' && req.method === 'POST') {
    let b = ''; req.on('data', d => { b += d; }); req.on('end', () => {
      let out;
      try { out = G.ctx.doPost({ postData: { contents: b } }).getContent(); }
      catch (e) { out = JSON.stringify({ ok: false, code: 'ERROR', error: 'mock: ' + e.message }); }
      try { const q = JSON.parse(b); console.log('[api]', q.fn, '→', out.slice(0, 120)); } catch (e) {}
      res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(out);
    });
    return;
  }
  if (G && u.pathname === '/__mail') {
    const m = G.mails[G.mails.length - 1] || {};
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ to: m.to || '', subject: m.subject || '', code: (/(\d{6})/.exec(m.subject || '') || [])[1] || '' }));
    return;
  }
  if (G && u.pathname === '/__state') {
    const ss = G.ctx.SpreadsheetApp.openById(G.props.SHEET_ID);
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify({ tz: ss.getSpreadsheetTimeZone(), tabs: ss.getSheets().map(s => [s.getName(), s.getLastRow()]),
                             unknown: [...G.unknown], logs: G.logs.slice(-20) }));
    return;
  }
  if (u.pathname === '/assets/config.js') {
    let src = fs.readFileSync(path.join(SITE, 'assets', 'config.js'), 'utf8')
      .replace("API_URL: '',", "API_URL: '" + (LIVE || 'http://localhost:' + PORT + '/api') + "',")
      .replace("ORG_NAME: 'ชื่อหน่วยงานของคุณ',", "ORG_NAME: 'ชมรมทดสอบระบบ',")
      .replace("ORG_NAME_EN: 'Your Organization',", "ORG_NAME_EN: 'Test Club',")
      .replace("STAFF_DOMAIN: '',", "STAFF_DOMAIN: 'example.org',")
      .replace("SUPPORT_EMAIL: '',", "SUPPORT_EMAIL: 'help@example.org',")
      .replace("ENV: 'production'", "ENV: 'staging'");
    if (process.argv.indexOf('--forms-test') >= 0) src = src              // ทดสอบหัวแบบฟอร์มที่ตั้งเอง
      .replace("HEADER_3: '',", "HEADER_3: 'ที่อยู่ทดสอบ โทร 02-000-0000',")
      .replace("TITLE: ['ใบเบิกพัสดุ', 'Borrowing Form']", "TITLE: ['ใบยืมอุปกรณ์', 'Equipment Loan Form']")
      .replace("SIGNS: [['ผู้เบิก', 'Borrower'], ['ผู้จ่ายของ', 'Issued by'], ['ผู้อนุมัติ', 'Approved by']]", "SIGNS: [['ผู้ยืม', 'Borrower'], ['เจ้าหน้าที่คลัง', 'Store keeper'], ['หัวหน้างาน', 'Supervisor'], ['ผู้อนุมัติ', 'Approved by']]")
      .replace("TITLE: ['แบบฟอร์มตรวจนับพัสดุ', 'Stock Count Form']", "TITLE: ['ใบตรวจนับประจำปี', 'Annual Count Sheet']")
      .replace("FOOTER: '',", "FOOTER: 'ท้ายกระดาษทดสอบ',");
    res.writeHead(200, { 'Content-Type': TYPES['.js'], 'Cache-Control': 'no-store' }); res.end(src);
    return;
  }
  const f = path.join(SITE, decodeURIComponent(u.pathname === '/' ? '/index.html' : u.pathname));
  if (!f.startsWith(SITE) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end('not found'); return; }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  res.end(fs.readFileSync(f));
}).listen(PORT, () => console.log('ทดสอบในเครื่อง: http://localhost:' + PORT + '/' + (LIVE ? '  (หลังบ้านจริง ' + LIVE + ')' : '')));

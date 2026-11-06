/**
 * ระบบ Stock สำเร็จรูป — ค่าตั้งของระบบ (Script Properties)
 *
 * ทุกค่าอยู่ใน Apps Script > Project Settings (การตั้งค่าโปรเจกต์) > Script Properties
 * ไม่มีรหัสชีต อีเมล หรือค่าลับในโค้ด · SETUP_1_start ตั้งค่าเริ่มต้นให้เฉพาะช่องที่ยังว่าง (ไม่เขียนทับ)
 *
 * ชื่อ (พิมพ์ตามนี้)       ต้องมี   ความหมาย
 * SHEET_ID                ✓       รหัสไฟล์ชีตข้อมูล (ส่วนระหว่าง /d/ กับ /edit ใน URL) · ว่าง = SETUP_1_start สร้างชีตใหม่ให้
 * APP_NAME                        ชื่อระบบที่แสดงในอีเมลและเอกสาร (ค่าเริ่มต้น: ระบบ Stock)
 * ORG_NAME                        ชื่อหน่วยงาน แสดงบนใบเบิก/ใบจ่าย/ใบตรวจนับ
 * ITEM_PREFIX                     คำนำหน้ารหัสพัสดุ ตัวอักษรอังกฤษ/ตัวเลข (ค่าเริ่มต้น: ITEM → ITEM-001)
 * FRONT_URL               ✓       ลิงก์หน้าเว็บบน GitHub Pages เช่น https://<บัญชี>.github.io/<repo>/
 * GIS_CLIENT_ID                   OAuth Client ID สำหรับปุ่ม "Sign in with Google" · ว่าง = เข้าด้วยรหัสทางอีเมลอย่างเดียว
 * STAFF_DOMAIN                    โดเมนอีเมลเจ้าหน้าที่ เช่น example.org → ได้บทบาทเจ้าหน้าที่อัตโนมัติ · ว่าง = ปิด
 * STAFF_HD                        ค่า hd ของ Google Workspace ที่ยอมรับ (คั่นด้วย ,) · ว่าง = ใช้ค่าเดียวกับ STAFF_DOMAIN
 * EXTERNAL_SIGNUP                 1 = เปิดให้คนนอก (อีเมลอื่น) กรอกแบบสอบถามแล้วขอเบิกได้ · 0 = ใช้ได้เฉพาะอีเมลในทะเบียน
 * REVIEW_FLOW                     1 = คำขอเบิกต้องผ่านการตรวจ + ลงนาม · 0 = ปิดขั้นตรวจ
 * DRIVE_FOLDER_ID                 โฟลเดอร์ Drive ที่เก็บไฟล์แนบ · ว่าง = สร้างโฟลเดอร์ใน My Drive
 * UPLOAD_FOLDER_NAME              ชื่อโฟลเดอร์ไฟล์แนบ (ค่าเริ่มต้น: <APP_NAME> — ไฟล์แนบ)
 * FIRESTORE_PROJECT               (ไม่บังคับ) สำเนาอ่านเร็วใน Firestore · ว่าง = ปิด ดู Firestore.gs
 * MAINTENANCE                     1 = ปิดระบบชั่วคราว (หน้าเว็บแจ้งปิดปรับปรุง)
 * REG_GUARD                       0 = ปิดตัวตรวจคอลัมน์ทะเบียนเลื่อน (ใช้เฉพาะฉุกเฉิน)
 */
const SETTINGS_DEFAULTS_ = {
  APP_NAME: 'ระบบ Stock',
  ORG_NAME: 'ชื่อหน่วยงานของคุณ',
  ITEM_PREFIX: 'ITEM',
  EXTERNAL_SIGNUP: '1',
  REVIEW_FLOW: '1'
};

/** ตั้งค่าเริ่มต้นเฉพาะช่องที่ยังไม่มี · คืนรายชื่อที่ตั้งใหม่ */
function settingsDefaults_() {
  const p = PropertiesService.getScriptProperties(), made = [];
  Object.keys(SETTINGS_DEFAULTS_).forEach(function (k) {
    if (p.getProperty(k) === null) { p.setProperty(k, SETTINGS_DEFAULTS_[k]); made.push(k + ' = ' + SETTINGS_DEFAULTS_[k]); }
  });
  return made;
}

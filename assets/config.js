/* ค่าตั้งของหน้าเว็บ — แก้ไฟล์นี้ไฟล์เดียวหลัง Deploy หลังบ้าน (ดูคู่มือติดตั้ง ขั้นที่ 5)
   ไฟล์นี้เปิดเผยได้: ไม่มีรหัสลับ ไม่มีรหัสชีต ไม่มีรหัสผ่าน */
window.APP_CONFIG = {
  API_URL: '',                       // ลิงก์เว็บแอป Apps Script ที่ลงท้าย /exec (จำเป็น)
  CLIENT_ID: '',                     // OAuth Client ID ของปุ่ม Google (ไม่บังคับ · ว่าง = เข้าด้วยรหัสทางอีเมลอย่างเดียว)
  SITE: '',                          // ลิงก์หน้าเว็บนี้ เช่น https://<บัญชี>.github.io/<repo>/ · ว่าง = หาให้อัตโนมัติ

  APP_NAME: 'ระบบ Stock',            // ชื่อระบบ (ไทย)
  APP_NAME_EN: 'Stock System',       // ชื่อระบบ (อังกฤษ)
  ORG_NAME: 'ชื่อหน่วยงานของคุณ',      // ชื่อหน่วยงาน (ไทย) แสดงหัวหน้าและหัวกระดาษ
  ORG_NAME_EN: 'Your Organization',  // ชื่อหน่วยงาน (อังกฤษ)
  LOGO_URL: '',                      // โลโก้หัวกระดาษ เช่น 'assets/logo.png' (อัปโหลดรูปเข้าโฟลเดอร์ assets) · ว่าง = ไม่แสดง
  ITEM_PREFIX: 'ITEM',               // คำนำหน้ารหัสพัสดุ ต้องตรงกับ Script Property ITEM_PREFIX
  STAFF_DOMAIN: '',                  // โดเมนอีเมลเจ้าหน้าที่ ต้องตรงกับ Script Property STAFF_DOMAIN เช่น 'example.org' · ว่าง = ไม่มี
  SUPPORT_EMAIL: '',                 // อีเมลติดต่อผู้ดูแลที่แสดงหน้าเข้าสู่ระบบ · ว่าง = ไม่แสดง
  ENV: 'production',                 // 'staging' = แสดงป้าย "ชุดทดสอบ" หน้าเข้าสู่ระบบ

  /* ── แบบฟอร์มพิมพ์ (ใบเบิก ใบจ่าย ใบย้าย ใบตรวจนับ) · ว่าง = ใช้ค่าเริ่มต้น ──
     ข้อความทุกช่องใส่ได้ 2 ภาษา: ['ไทย', 'English'] · ช่องลงนามเรียงตามลำดับเดิม
     (ช่องแรกของใบเบิก = ผู้ขอ · ช่องสุดท้าย = ผู้อนุมัติ ใช้วางลายเซ็นอิเล็กทรอนิกส์) */
  FORMS: {
    HEADER_1: '',                    // หัวกระดาษบรรทัด 1 (ว่าง = ORG_NAME)
    HEADER_2: '',                    // บรรทัด 2 (ว่าง = ORG_NAME_EN) เช่น ชื่อภาษาอังกฤษ
    HEADER_3: '',                    // บรรทัด 3 (ไม่บังคับ) เช่น ที่อยู่ โทรศัพท์
    FOOTER: '',                      // ท้ายกระดาษ (ว่าง = ชื่อระบบ)
    PER_PAGE: 10,                    // จำนวนรายการต่อหน้า
    BORROW:   { TITLE: ['ใบเบิกพัสดุ', 'Borrowing Form'],
                SIGNS: [['ผู้เบิก', 'Borrower'], ['ผู้จ่ายของ', 'Issued by'], ['ผู้อนุมัติ', 'Approved by']] },
    GIVE:     { TITLE: ['ใบจ่ายพัสดุ (จ่ายออก ไม่ต้องคืน)', 'Issue Form (no return)'],
                SIGNS: [['ผู้ขอ (เจ้าหน้าที่)', 'Requested by (staff)'], ['ผู้รับของ (ผู้แทนหน่วยงาน)', 'Received by (representative)'],
                        ['ผู้จ่ายของ', 'Issued by'], ['ผู้อนุมัติ', 'Approved by']] },
    ISSUE:    { TITLE: ['ใบจ่ายพัสดุ', 'Issue Form'],
                SIGNS: [['ผู้รับของ', 'Received by'], ['ผู้จ่ายของ', 'Issued by'], ['ผู้อนุมัติ', 'Approved by']] },
    TRANSFER: { TITLE: ['ใบย้ายพัสดุ', 'Transfer Form'],
                SIGNS: [['ผู้ขนย้าย', 'Moved by'], ['ผู้รับปลายทาง', 'Received at destination'], ['ผู้อนุมัติ', 'Approved by']] },
    COUNT:    { TITLE: ['แบบฟอร์มตรวจนับพัสดุ', 'Stock Count Form'],
                SIGNS: [['ผู้นับ', 'Counted by'], ['ผู้ตรวจสอบ', 'Checked by'], ['ผู้อนุมัติ', 'Approved by']] }
  }
};

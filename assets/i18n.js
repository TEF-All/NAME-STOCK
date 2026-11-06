/* {{APP}} · i18n.js (จาก I18n.html v32) */
/* ═══════════════════════════════════════════════════════════════
   {{APP}} · ภาษาไทย / English
   สลับเฉพาะข้อความบนหน้าจอ ค่าที่ส่งเข้าชีตยังเป็นภาษาไทยเหมือนเดิม
   แปลข้อความที่ตรงพจนานุกรม หรือตรงรูปแบบด้านล่าง
   ชื่อสินค้าใช้ชื่อภาษาอังกฤษจากทะเบียนคอลัมน์ AA assets/api.js โหลดจาก API namesEn แล้วจำไว้ในเบราว์เซอร์)
   ═══════════════════════════════════════════════════════════════ */
(function () {
var LANG = 'th';
try { LANG = localStorage.getItem((window.APP_NS + 'lang')) || 'th'; } catch (e) {}
window.APP_LANG = LANG;

var D = {
// ── เทมเพลต: ข้อความใหม่ ──
'ขนาด': 'Size', 'ขนาดไหน': 'Which size?', 'แบบ': 'Type', 'รหัสป้าย': 'Tag code', 'ผู้บริหารสูงสุด': 'Chief executive',
'เข้าด้วยบัญชี Google หรือรับรหัสทางอีเมล': 'Sign in with Google or get a code by email',
'รับรหัสทางอีเมลเพื่อเข้าสู่ระบบ': 'Get a sign-in code by email',
'· เจ้าหน้าที่ใช้อีเมล {{STAFF_DOMAIN}}': '· Staff use their {{STAFF_DOMAIN}} email',
'เข้าด้วยอีเมล {{STAFF_DOMAIN}} ใช้งานได้ทันที': 'Sign in with your {{STAFF_DOMAIN}} email and start right away',
'เข้าด้วยอีเมลของคุณ ครั้งแรกจะมีแบบสอบถามสั้นๆ กรอกครั้งเดียว แล้วขอเบิกและแจ้งคืนได้': 'Sign in with your email. The first time, fill in a short form once, then you can request and return items',
'เลือกหรือพิมพ์หมวดใหม่': 'Pick or type a new category', 'ไม่บังคับ': 'Optional', 'เลือกหรือพิมพ์ที่เก็บ': 'Pick or type a location',
'ต้องระบุหมวดหลัก': 'Please enter a main category',
'ยอดในระบบทั้งทะเบียน': 'System balance, whole register',
'ค้นหาชื่อ หมวด หรือรหัส เช่น {{PREFIX}}-001': 'Search name, category or code, e.g. {{PREFIX}}-001',
'ระบบนี้ยังไม่เปิดเข้าด้วย Google (ไม่ได้ตั้ง GIS_CLIENT_ID) กรุณาใช้รหัสทางอีเมล': 'Google sign-in is not set up for this system. Please use an email code.',
'อีเมล {{STAFF_DOMAIN}} ต้องเข้าด้วยบัญชีงานขององค์กร': '{{STAFF_DOMAIN}} addresses must sign in with the organization work account.',
// ── workflow เบิก-คืน / จ่ายออก ──
'จ่ายออกให้หน่วยงานภายนอก: เลือกประเภท ภายนอกองค์กร ใส่ชื่อหน่วยงาน และแนบหนังสือขอรับการสนับสนุน': 'Issuing to a club or outside organization: choose External, enter the organization and attach its support request letter',
'จ่ายออกให้หน่วยงานภายนอก กรุณาระบุชื่อหน่วยงาน': 'Issuing to an outside organization: please enter the organization name',
'จ่ายออกให้หน่วยงานภายนอก ต้องแนบหนังสือขอรับการสนับสนุน (ไฟล์หรือลิงก์)': 'Issuing to an outside organization requires its support request letter (file or link)',
'ผู้ใช้ภายนอกขอจ่ายออกเองไม่ได้ กรุณาทำหนังสือขอรับการสนับสนุนถึงหน่วยงาน เจ้าหน้าที่จะทำเรื่องให้': 'External users cannot request an issue directly. Please send a support request letter to the organization; staff will file it for you.',
'ดูหนังสือที่แนบ': 'View attached letter',
'ไม่มีหนังสือแนบ': 'No letter attached',
'ลักษณะคำขอ': 'Request type',
'เบิก-คืน': 'Borrow & return',
'จ่ายออก': 'Issue (no return)',
'ยืมไปใช้แล้วนำมาคืน': 'Borrow and bring back',
'ให้ไปเลย ไม่ต้องคืน': 'Given out, no return',
'ส่งคำขอ': 'Submit request',
'รอตรวจคำขอ': 'Requests to review',
'ไม่มีคำขอรอตรวจ': 'No requests to review',
'อนุมัติและลงนาม': 'Approve & sign',
'ยืนยันไม่อนุมัติ': 'Confirm rejection',
'เหตุผลที่ไม่อนุมัติ': 'Reason for rejection',
'กดอีกครั้งเพื่ออนุมัติและลงนามอิเล็กทรอนิกส์': 'Tap again to approve and e-sign',
'✓ ผู้อนุมัติลงนาม': '✓ Approver signed',
'○ ผู้อนุมัติลงนาม': '○ Approver not signed',
'✓ ผู้ขอลงนาม': '✓ Requester signed',
'○ ผู้ขอลงนาม': '○ Requester not signed',
'✓ คุณลงนาม': '✓ You signed',
'○ คุณลงนาม': '○ You have not signed',
'✓ ใบลงนามที่แนบ': '✓ Signed copy attached',
'พิมพ์ใบ': 'Print form',
'แนบใบลงนาม': 'Attach signed copy',
'แนบใบที่ลงนามแล้ว': 'Attach signed copy',
'ลงนามอิเล็กทรอนิกส์': 'E-sign',
'ยกเลิกคำขอ': 'Cancel request',
'จ่ายออก (ไม่ต้องคืน)': 'Issue (no return)',
'รอแอดมินตรวจ': 'Awaiting admin review',
'อนุมัติแล้ว รอลงนาม': 'Approved, awaiting signature',
'ลงนามครบ รอรับของ': 'Fully signed, ready for pickup',
'ยกเลิกแล้ว': 'Cancelled',
'รับของแล้ว (จ่ายออก ไม่ต้องคืน)': 'Received (issued, no return)',
'เอกสารถูกแก้หลังลงนาม ต้องลงนามใหม่': 'Document changed after signing; sign again',
'กำลังอัปโหลด…': 'Uploading…',
'เหตุผลที่ยกเลิก': 'Reason for cancelling',
'ลงนามอิเล็กทรอนิกส์เอกสาร': 'E-sign document',
'ข้าพเจ้ายืนยันรายการในเอกสารนี้ และตกลงลงนามด้วยวิธีอิเล็กทรอนิกส์ (พ.ร.บ.ธุรกรรมทางอิเล็กทรอนิกส์ พ.ศ. 2544)': 'I confirm the items in this document and agree to sign electronically (Electronic Transactions Act B.E. 2544).',
'อนุมัติคำขอของตัวเองไม่ได้ ให้แอดมินอีกคนตรวจ': 'You cannot approve your own request. Ask another admin.',
'กรุณาระบุเหตุผลที่ไม่อนุมัติ': 'Please give a reason for rejection',
'ไฟล์ใหญ่เกิน 10 MB': 'File is larger than 10 MB',
// ── เข้าสู่ระบบด้วย Google / GitHub Pages ──
'ไม่มีบัญชี Google หรือปุ่มใช้ไม่ได้ รับรหัสทางอีเมลแทน': 'No Google account, or the button does not work? Get a code by email',
'คุณเปิดจากแอป LINE ซึ่ง Google ไม่อนุญาตให้ลงชื่อเข้าใช้ในแอป': 'You opened this inside the LINE app, where Google does not allow sign-in.',
'เปิดในเบราว์เซอร์': 'Open in browser', 'หรือใช้รหัสทางอีเมลด้านล่าง': 'or use an email code below',
'นโยบายความเป็นส่วนตัว': 'Privacy policy', 'ชุดทดสอบ': 'Staging', 'ข้าพเจ้ารับทราบ': 'I have read the ',
'กรุณาทำเครื่องหมายรับทราบนโยบายความเป็นส่วนตัว': 'Please tick to confirm you have read the privacy policy',
'เลือกบัญชีที่จะใช้ แล้วเข้าสู่ระบบ': 'Choose the account to use, then sign in', 'กรุณาเข้าสู่ระบบอีกครั้ง': 'Please sign in again',
'หมดเวลาการเข้าใช้ กรุณาเข้าสู่ระบบอีกครั้ง': 'Your session has timed out. Please sign in again.', 'หมดเวลาการเข้าใช้ กรุณาเข้าสู่ระบบอีกครั้ง รายการที่เลือกไว้ยังอยู่': 'Your session has timed out. Please sign in again. Your selected items are kept.', 'ยืนยันด้วยรหัสทางอีเมล': 'Verified by email code', 'ดึงรายการไม่ได้': 'Could not load the document', 'มีข้อมูลใหม่ · รีเฟรชหน้าเพื่อดู': 'New data available · refresh the page to see it', 'อัปเดตไม่สำเร็จ แสดงข้อมูลที่จำไว้': 'Could not update · showing saved data','มีสิทธิ์ขาด': 'Final authority',
'อีเมลที่ใช้เข้าสู่ระบบ': 'Email used to sign in', 'กรุณาเข้าสู่ระบบ': 'Please sign in',
'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ ตรวจอินเทอร์เน็ตแล้วลองใหม่': 'Cannot reach the server. Check your connection and try again.',
'บัตรผ่าน Google หมดอายุหรือไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่': 'Your Google sign-in has expired or is invalid. Please sign in again.',
'ระบบปิดปรับปรุงชั่วคราว กรุณาลองใหม่ภายหลัง': 'The system is temporarily closed for maintenance. Please try again later.',
'อีเมลนี้ยังไม่มีสิทธิ์เข้าระบบ หรือถูกปิดการใช้งาน กรุณาติดต่อผู้ดูแลระบบ': 'This email has no access or has been disabled. Please contact the administrator.',
'อีเมล {{STAFF_DOMAIN}} ต้องเข้าด้วยบัญชีงานขององค์กร': '{{STAFF_DOMAIN}} addresses must sign in with the organization work account.',
'โหลดปุ่ม Google ไม่สำเร็จ ลองใหม่ หรือใช้รหัสทางอีเมล': 'Could not load the Google button. Try again or use an email code.',
'ยังไม่ได้ตั้งค่า API_URL ใน assets/config.js': 'API_URL is not set in assets/config.js',
'หากคิดว่าควรเข้าได้ กรุณาติดต่อผู้ดูแลระบบ {{APP}}': 'If you think you should have access, contact the {{APP}} administrator.',

// ── เมนูและหัวเว็บ ──
'{{ORG}}': '{{ORG_EN}}',
'หน้าแรก': 'Home', 'รายการพัสดุ': 'Inventory', 'เบิก · จ่าย · คืน · ย้าย': 'Borrow · Issue · Return · Transfer',
'เบิก/จ่าย/คืน/ย้าย': 'Borrow / Issue / Return / Transfer', 'เบิก จ่าย คืน ย้าย': 'Borrow, Issue, Return, Transfer',
'ระบบเบิก จ่าย คืน ย้าย': 'Borrow, Issue, Return & Transfer', 'ตรวจนับ': 'Stock Count', 'ตรวจนับและกระทบยอด': 'Stock Count & Reconciliation',
'สรุปภาพรวม': 'Overview', 'ผู้ดูแลระบบ': 'Admin', 'คำขอของฉัน': 'My Requests', 'ขอเบิก / แจ้งคืน': 'Request / Report Return',
'สลับบัญชี': 'Switch account', 'ออกจากระบบ': 'Sign out', 'ผู้ใช้ภายนอก': 'External user', 'ผู้ตรวจสอบ': 'Auditor',
'ผู้จัดการ': 'Manager', 'ผู้บริหาร': 'Executive', 'ผู้อนุมัติ': 'Approver', 'ผู้ใช้': 'User', 'ผู้พัฒนา (ชั่วคราว)': 'Developer (temporary)',
'กำลังตรวจสิทธิ์…': 'Checking access…', 'กำลังโหลด…': 'Loading…', 'กำลังโหลด': 'Loading', 'กำลังดำเนินการ…': 'Processing…',
'กำลังโหลดรายการ…': 'Loading items…', 'กำลังดึงรายการ…': 'Fetching items…', 'กำลังดึงข้อมูล…': 'Fetching data…',
'ยังเข้าสู่ระบบไม่ได้': 'Unable to sign in', 'ไม่มีสิทธิ์เข้าหน้านี้': 'Access denied', 'หน้านี้ไม่เปิดให้สิทธิ์ของคุณ': 'This page is not available for your role',
'ระบบอ่านอีเมล Google ของคุณไม่ได้ หรือบัญชีนี้ถูกปิดสิทธิ์': 'The system could not read your Google email, or this account has been disabled.',
'กรุณาเข้าสู่ระบบด้วยบัญชี Google แล้วเปิดลิงก์นี้ใหม่ หากยังเข้าไม่ได้ให้ติดต่อผู้ดูแลระบบ {{APP}}': 'Please sign in with your Google account and reopen this link. If you still cannot access it, contact the {{APP}} administrator.',
'ยังเข้าสู่ระบบไม่ได้ กรุณาเปิดลิงก์ด้วยบัญชี Google ของคุณ (เจ้าหน้าที่ใช้ {{STAFF_DOMAIN}}) หรือติดต่อผู้ดูแลระบบ': 'Unable to sign in. Please open this link with your Google account (staff use {{STAFF_DOMAIN}}) or contact the administrator.',
'เข้าสู่ระบบด้วยบัญชี Google': 'Sign in with Google', 'เข้าสู่ระบบ': 'Sign in', 'ยืนยันด้วยบัญชี Google': 'Verified by Google account',

// ── หน้าแรก ──
'หน้าแรก - {{APP}}': 'Home - {{APP}}', 'สวัสดี': 'Hello', 'เมนูใช้งาน': 'Menu', 'แก้ไขหน้าแรก': 'Edit home page', 'แก้ไข': 'Edit',
'ทำรายการพัสดุ เบิก คืน และย้ายที่เก็บ': 'Borrow, return and move inventory', 'นับของจริงเทียบกับยอดในระบบ': 'Count physical stock against system balances',
'ยอดคงเหลือ และความเคลื่อนไหวพัสดุ': 'Balances and inventory movements', 'ตั้งค่า ผู้ใช้ และงานดูแลระบบ': 'Settings, users and administration',
'ติดตามเอกสารเบิกของฉัน': 'Track my requests', 'เปิดหน้าแรกไม่ได้': 'Could not open the home page',
'มีผลกับทุกคนที่เปิดหน้าแรก · การซ่อนการ์ดเป็นการซ่อนบนหน้าแรกเท่านั้น ไม่ได้ปิดสิทธิ์เข้าหน้านั้น': 'Applies to everyone who opens the home page · Hiding a card only hides it here; it does not remove access to that page.',
'คำทักทาย': 'Greeting', 'แสดงประกาศ': 'Show announcement', 'แสดง': 'Show', 'ชื่อเมนู': 'Menu name', 'คำอธิบายสั้น ๆ': 'Short description',
'หน้า': 'Page', 'ยกเลิก': 'Cancel', 'คืนค่าเริ่มต้น': 'Reset to default', 'กำลังบันทึก…': 'Saving…', 'บันทึกหน้าแรกแล้ว': 'Home page saved',
'กดอีกครั้งเพื่อคืนค่า': 'Click again to reset', 'คืนค่าเริ่มต้นแล้ว': 'Reset to default', 'งานที่รอแอดมินดำเนินการ': 'Pending admin tasks',
'งานที่รอแอดมิน': 'Pending admin tasks', 'รอจ่ายของออก': 'Awaiting dispatch', 'รอตรวจรับคืน': 'Awaiting return check', 'เกินกำหนดคืน': 'Overdue',
'ไม่มีเอกสารค้างจ่าย': 'No documents awaiting dispatch', 'วันที่ขอ': 'Requested', 'จ่ายของออก': 'Dispatch', 'กดอีกครั้งเพื่อยืนยันจ่าย': 'Click again to confirm dispatch',
'จ่ายของออกแล้ว': 'Dispatched', 'ไม่มีรายการแจ้งคืนค้างตรวจ': 'No returns awaiting check', 'เอกสาร': 'Document', 'ผู้แจ้ง': 'Reported by', 'แจ้งเมื่อ': 'Reported on',
'เหตุผลที่ไม่รับคืน': 'Reason for rejecting return', 'ยืนยันไม่รับคืน': 'Confirm rejection', 'ยืนยันรับคืน': 'Confirm return', 'ไม่รับคืน': 'Reject return',
'รายการเก่า ไม่มีข้อมูลละเอียด': 'Legacy entry, no details', 'กดอีกครั้งเพื่อลงบัญชีรับคืน': 'Click again to record the return', 'รับคืนแล้ว': 'Return received',
'กรุณาระบุเหตุผล': 'Please provide a reason', 'บันทึกไม่รับคืนแล้ว': 'Return rejected', 'ไม่มีเอกสารเกินกำหนด': 'No overdue documents',
'ยังไม่มีผู้กรอกแบบสอบถาม': 'No survey responses yet', 'ชื่อ': 'Name', 'หน่วยงาน / องค์กร': 'Organisation', 'เบอร์โทร': 'Phone', 'ต้องการ': 'Needs',
'วัตถุประสงค์': 'Purpose', 'ขอเบิก': 'Borrow', 'รอรับ (จ่าย)': 'Awaiting issue', 'คืน': 'Return', 'ใช้งานได้': 'Active', 'ปิดสิทธิ์': 'Disable access', 'เปิดสิทธิ์': 'Enable access', 'ยืนยัน': 'Confirm',
'ปิดสิทธิ์แล้ว': 'Access disabled', 'เปิดสิทธิ์แล้ว': 'Access enabled',

// ── หน้าเบิก จ่าย คืน ย้าย ──
'เบิก': 'Borrow', 'ยืมไปใช้ ต้องคืน': 'Borrow for use, to be returned', 'คืน': 'Return', 'ปิดรายการเบิก': 'Close a borrowing',
'จ่าย': 'Issue', 'จ่ายขาด ตัดสต็อก': 'Permanent issue, deducts stock', 'ย้าย': 'Transfer', 'เปลี่ยนที่เก็บ': 'Change location', 'แจ้งคืน': 'Report return',
'เลือกรายการพัสดุ': 'Select items', 'ค้นหาด้วยรหัสหรือชื่อ': 'Search by code or name', 'คงเหลือ': 'In stock', 'จำนวน': 'Qty',
'ราคาต้นทุน/หน่วย': 'Unit cost', 'เพิ่มเข้ารายการ': 'Add to list', 'รหัส': 'Code', 'รายการ': 'Item', 'มูลค่า': 'Value', 'ยังไม่มีรายการ': 'No items yet',
'รายละเอียดการเบิก': 'Borrowing details', 'ประเภทการเบิก': 'Borrowing type', 'ภายในองค์กร': 'Internal', 'ภายนอกองค์กร': 'External',
'ฝ่าย': 'Department', 'งาน / กิจกรรม': 'Event / Activity', 'หน่วยงานภายนอก': 'External organisation', 'ใช้ทำอะไร': 'Purpose',
'วันที่เบิก': 'Borrow date', 'กำหนดคืน': 'Due date', 'ไฟล์แนบ': 'Attachment', 'สร้างเอกสารเบิก': 'Create borrowing',
'บันทึกการคืน': 'Record return', 'เลขที่เอกสารเบิก': 'Borrowing no.', 'ดึงรายการ': 'Load items',
'รายละเอียดการจ่ายขาด': 'Issue details', 'ผู้รับ': 'Recipient', 'ประเภทผู้รับ': 'Recipient type', 'สถานที่จ่าย': 'Issue location',
'วันที่จ่าย': 'Issue date', 'เพื่ออะไร': 'Purpose', 'หลักฐาน': 'Proof', 'จ่ายขาดตัดสต็อกถาวร': 'Permanent issue — stock is deducted for good',
'สร้างเอกสารจ่าย': 'Create issue', 'รายละเอียดการย้าย': 'Transfer details', 'ประเภทการย้าย': 'Transfer type', 'ถาวร': 'Permanent', 'ชั่วคราว': 'Temporary',
'รหัสรายการ': 'Item code', 'จำนวนที่ย้าย': 'Qty to move', 'จาก สถานที่': 'From location', 'ไป สถานที่': 'To location', 'วันที่ย้าย': 'Move date',
'กำหนดย้ายกลับ': 'Return-by date', 'ผู้ขนย้าย': 'Mover', 'ผู้สั่งการ อีเมล': 'Authorised by (email)', 'ย้ายชั่วคราว': 'Temporary transfer',
'สร้างเอกสารย้าย': 'Create transfer', 'พิมพ์แบบฟอร์ม': 'Print form', 'เครื่อง': 'units', 'รอแอดมินตรวจรับ': 'Awaiting admin check',
'เลยกำหนดคืนแล้ว': 'Overdue', 'ทุกรายการในเอกสารนี้บันทึกการคืนครบแล้ว': 'All items in this document have been returned',
'ค้างคืน': 'Outstanding', 'เลขเครื่อง: กดสลับ ฟ้า = คืน · ส้ม = ชำรุด · ขาว = ยังไม่คืน': 'Unit numbers: tap to switch · blue = returned · orange = damaged · white = not yet returned',
'รหัส / รายการ': 'Code / Item', 'เบิกไป': 'Borrowed', 'ชำรุด': 'Damaged', 'สูญหาย': 'Lost', 'สภาพตอนคืน': 'Condition on return',
'ปิดยอดเอกสารนี้': 'Close this document', 'ติ๊กเฉพาะเมื่อแน่ใจว่าของไม่กลับมาแล้ว ตัดสต็อกถาวร ย้อนกลับไม่ได้': 'Tick only if you are sure the items will not come back. Stock is deducted permanently and cannot be undone.',
'{{PREFIX}}- หรือชื่อของ': '{{PREFIX}}- or item name', 'เช่น ประชุมประจำปี 2569': 'e.g. Annual meeting 2026', 'ชื่อหน่วยงานที่ขอยืม': 'Borrowing organisation',
'ไม่กรอกก็ได้': 'Optional', 'หรือวางลิงก์ Drive หนังสือขอความอนุเคราะห์': 'or paste a Drive link to the request letter',
'ชื่อบุคคลหรือหน่วยงาน': 'Person or organisation', 'จ่ายที่ไหน': 'Where issued', 'หรือวางลิงก์ Drive ใบเสร็จหรือภาพถ่าย ไม่มีก็ได้': 'or paste a Drive link to a receipt or photo (optional)',
'ต้นทาง': 'Origin', 'ปลายทาง': 'Destination', 'ชื่อผู้ขนย้าย': 'Mover name', 'เว้นว่างถ้าสั่งการเอง': 'Leave blank if you authorised it yourself', 'ลบ': 'Delete',
'คงคลัง': 'In store', 'ไม่ระบุ': 'Not specified', 'เพิ่ม': 'Add', 'ข้าม': 'Skipped', 'วิทยุ': 'Radio',
'กรุณาเลือกเลขเครื่องก่อน': 'please select unit numbers first', 'ในทะเบียน': 'in the register', 'จำนวนต้องมากกว่าศูนย์': 'Quantity must be greater than zero',
'รหัสนี้อยู่ในรายการแล้ว ลบออกก่อนถ้าจะแก้จำนวน': 'This code is already listed. Remove it first to change the quantity.',
'กรุณาเพิ่มรายการที่จะเบิกอย่างน้อยหนึ่งรายการ': 'Please add at least one item to borrow', 'กรุณาเพิ่มรายการที่จะจ่าย': 'Please add items to issue',
'อัปโหลดไฟล์ไม่สำเร็จ': 'Upload failed', 'กำลังอัปโหลดไฟล์…': 'Uploading file…', 'รับเฉพาะไฟล์ PDF, JPG, PNG': 'Only PDF, JPG and PNG files are accepted',
'ไฟล์ใหญ่เกิน 10 MB': 'File exceeds 10 MB', 'อ่านไฟล์ไม่ได้ ลองเลือกไฟล์ใหม่': 'Could not read the file. Please choose another.',
'เปิดรูปนี้ไม่ได้ ลองเลือกไฟล์ใหม่': 'Could not open this image. Please choose another.', 'กรุณากรอกเลขที่เอกสารเบิก': 'Please enter the borrowing number',
'กรุณากรอกจำนวนที่คืนอย่างน้อยหนึ่งรายการ': 'Please enter a return quantity for at least one item', 'ส่งคำขอคืนแล้ว': 'Return request sent',
'บันทึกการคืนแล้ว': 'Return recorded', 'ยังไม่ตัดยอดจนกว่าแอดมินจะตรวจรับของ ติดตามได้ที่คำขอของฉัน': 'Stock is not updated until an admin checks the items. Track it in My Requests.',
'บันทึก': 'Save', 'รายการเข้าบัญชีเคลื่อนไหวเรียบร้อย': 'items posted to the movement ledger', 'สถานะ': 'Status', 'อนุมัติแล้ว': 'Approved',
'อนุมัติทันทีด้วยสิทธิ์ขาด ระบบบันทึก log และแจ้งผู้บริหารแล้ว': 'Approved immediately under final authority; logged and the executive has been notified.',
'รอผู้ดูแลระบบพิจารณาเป็นขั้นแรก': 'awaiting the administrator as the first step', 'ผู้เบิก': 'Borrower', 'หน่วยงาน': 'Organisation', 'ผู้จ่าย': 'Issued by',
'สถานที่': 'Location', 'ประเภท': 'Type', 'บันทึกไม่ผ่าน': 'Not saved', 'เกิดข้อผิดพลาด': 'An error occurred',

// ── หน้ารายการพัสดุ ──
'ล้าง': 'Clear', 'แสดงเฉพาะที่มีของ': 'In stock only', 'โหลด Excel': 'Download Excel', 'เรียง': 'Sort',
'ชื่อ ก-ฮ / A-Z': 'Name A–Z', 'คงเหลือมากไปน้อย': 'Most in stock', 'แสดงเพิ่ม': 'Show more', 'ไปหน้าเบิก': 'Go to borrowing',
'ว่าง': 'Free', 'ยืมอยู่': 'On loan', 'ไม่พบรายการ': 'No items found', 'หมด': 'Out of stock', 'ลบรายการ': 'Remove item',
'เพิ่มรูปให้รายการนี้': 'Add photo to this item', 'รวมทุกไซส์': 'All sizes', 'สภาพ': 'Condition', 'จำนวนที่จะเบิก': 'Qty to borrow',
'สำหรับผู้ดูแล: อัปโหลดรูปพัสดุ': 'Admin: upload item photos', 'เริ่มอัปโหลด': 'Start upload',
'เลือกไฟล์ ZIP หรือรูปที่ตั้งชื่อตามรหัส เช่น {{PREFIX}}-001.jpg (รูปที่สอง {{PREFIX}}-001_2.jpg) · รูปเดิมของรหัสนั้นจะถูกแทนที่': 'Choose a ZIP file or images named by code, e.g. {{PREFIX}}-001.jpg (second photo {{PREFIX}}-001_2.jpg) · Existing photos for that code will be replaced.',
'ค้นหาชื่อ หมวด หรือรหัส เช่น {{PREFIX}}-001': 'Search name, category or code, e.g. {{PREFIX}}-001', 'ล้างคำค้น': 'Clear search',
'ตะกร้าเบิก': 'Cart', 'โหลดรายการไม่สำเร็จ': 'Could not load items', 'ทั้งหมด': 'All', 'ใส่ตะกร้า': 'Add to cart', 'ดูรายการ': 'View',
'ไม่พบรายการที่ตรงกับทุกคำ': 'No items match all words', 'ด้านล่างคือรายการที่ใกล้เคียงที่สุด': 'Closest matches are shown below',
'กำลังทำไฟล์…': 'Building file…', 'โหลดตัวสร้าง Excel ไม่สำเร็จ': 'Could not load the Excel builder', 'ไม่มีรายการให้โหลด': 'No items to download',
'ยังไม่มีของในตะกร้า กดปุ่ม ใส่ตะกร้า ที่รายการก่อน': 'Your cart is empty. Tap "Add to cart" on an item first.',
'ยังไม่ตรวจ': 'Not inspected', 'กดอีกครั้งเพื่อลบ': 'Click again to delete', 'ผิดพลาด': 'Error', 'กดอีกครั้งเพื่อลบรูป': 'Click again to delete the photo',
'ลบรูปแล้ว รีเฟรชหน้าเพื่อดูผล': 'Photo deleted. Refresh to see the change.', 'อ่านรูปไม่ได้': 'Could not read the image',
'ยังไม่ได้เลือกไฟล์': 'No file selected', 'กำลังอ่านไฟล์…': 'Reading file…', 'ไม่พบไฟล์ที่ชื่อตรงรูปแบบ {{PREFIX}}-001.jpg': 'No files named in the {{PREFIX}}-001.jpg format',
'กำลังโหลดหน้าใหม่…': 'Reloading…', 'กำลังทำ…': 'Working…', 'กำลังอัปโหลด…': 'Uploading…', 'บันทึกแล้ว รีเฟรชหน้าเพื่อดูรูปใหม่': 'Saved. Refresh to see the new photo.',
// หมวดและประเภท (ข้อมูลหมวดในชีต แสดงผลเท่านั้น)
'เครื่องแต่งกาย': 'Apparel', 'รางวัลและของที่ระลึก': 'Awards & Souvenirs', 'เบ็ดเตล็ดและอื่น ๆ': 'Miscellaneous', 'อุปกรณ์แข่งขัน': 'Competition Equipment',
'คอมพิวเตอร์และงานประชุม': 'Computers & Meetings', 'เอกสารและสำนักงาน': 'Documents & Office', 'เสื้อโปโล': 'Polo shirts', 'เสื้อยืด': 'T-shirts',
'หมวก': 'Caps', 'ปลอกแขน': 'Armbands', 'เสื้อกั๊ก / สะท้อนแสง': 'Vests / Hi-vis', 'เสื้ออื่นๆ': 'Other shirts', 'เสื้อ': 'Shirts', 'อื่นๆ': 'Other',
'วิทยุสื่อสาร': 'Two-way radios', 'คอมพิวเตอร์ / IT': 'Computers / IT', 'ไม่ระบุหมวด': 'Uncategorised', 'ธง': 'Flags', 'ถ้วย': 'Trophies', 'เหรียญ': 'Medals', 'กระเป๋า': 'Bags',
'นาฬิกาจับเวลา': 'Stopwatches', 'เครื่องพรินเตอร์': 'Printers', 'หมึกพิมพ์': 'Printer ink', 'อุปกรณ์จัดการแข่งขัน': 'Event equipment',

// ── สภาพและค่าที่เลือก (แสดงผลเท่านั้น) ──
'ใหม่': 'New', 'พร้อมใช้งาน': 'Ready to use', 'ใช้งานได้ มีรอยสึก': 'Usable, shows wear', 'ชำรุด / รอซ่อม': 'Damaged / awaiting repair', 'หาไม่พบ': 'Not located',
'การเงิน': 'Finance', 'บัญชี': 'Accounting', 'แอดมิน': 'Admin office', 'จัดการแข่งขัน': 'Competition management',
'นักกีฬา': 'Athlete', 'หน่วยงานภายใน': 'Internal unit', 'อื่น ๆ': 'Other', 'บุคคล': 'Individual', 'กรรมการ': 'Official', 'เจ้าหน้าที่': 'Staff', 'นำไปใช้ (ยืมอยู่)': 'In use (on loan)', 'ขาดหรือชำรุด': 'Missing or damaged',

// ── คำขอของฉัน / แบบสอบถาม ──
'กลับหน้าเบิก / แจ้งคืน': 'Back to request / return', 'ยังไม่มีคำขอ': 'No requests yet', 'มีคำขอคืน': 'Return requests', 'ฉบับ รอแอดมินตรวจรับ': 'awaiting admin check',
'กำลังดำเนินการ / ค้างคืน': 'Active / Outstanding', 'เสร็จสิ้น / ปิดแล้ว': 'Completed / Closed', 'ไม่มีคำขอในหมวดนี้': 'No requests in this filter',
'คืนแล้ว': 'Returned', 'รออนุมัติ': 'Pending approval', 'คืนไม่ครบ': 'Partially returned', 'คืนครบ': 'Fully returned', 'ไม่อนุมัติ': 'Rejected', 'สร้างเมื่อ': 'Created',
'แบบสอบถามผู้ใช้งาน': 'User survey', 'กรุณากรอกข้อมูลก่อนเข้าใช้งานระบบเบิก จ่าย คืน': 'Please complete this form before using the borrowing system',
'ข้อมูลผู้ขอใช้บริการ': 'Requester details', 'ชื่อ-นามสกุล': 'Full name', 'เบอร์โทรศัพท์': 'Phone number', 'หน่วยงาน / องค์กร': 'Organisation',
'ประเภทงานที่ต้องการ': 'Type of request', 'วัตถุประสงค์ที่จะเบิก / รับ / คืน': 'Purpose of borrowing / collection / return', 'บันทึกและเข้าใช้งานระบบ': 'Save and continue',
'บันทึกแล้ว': 'Saved', 'ขอบคุณครับ ข้อมูลของคุณถูกบันทึกเรียบร้อย เข้าใช้งานระบบได้เลย': 'Thank you. Your details have been saved. You can now use the system.',
'เข้าใช้งานระบบ': 'Enter the system', 'เช่น สมชาย ใจดี': 'e.g. Somchai Jaidee', 'เช่น ชื่อหน่วยงานหรือองค์กรที่สังกัด': 'e.g. your organisation',
'เช่น ยืมอุปกรณ์ไปใช้ในการแข่งขัน รายการ... วันที่': 'e.g. borrowing equipment for the … competition on …',

// ── หน้าอนุมัติ ──
'หน้าอนุมัติเอกสาร': 'Approvals', 'กำลังโหลดรายการรออนุมัติ…': 'Loading pending approvals…', 'คุณมีสิทธิ์ขาด': 'You have final authority',
'ไม่มีเอกสารรออนุมัติ': 'No documents pending approval', 'เรียงจากเก่าสุด เอกสารที่ค้างเกินเจ็ดวันจะขึ้นสีแดง': 'Oldest first. Documents pending over seven days are shown in red.',
'เปิดเอกสารแนบ': 'Open attachment', 'อนุมัติด้วยสิทธิ์ขาด ปิดเอกสารทันที': 'Approve with final authority and close', 'อนุมัติ': 'Approve',
'เหตุผล จำเป็นเมื่อไม่อนุมัติ': 'Reason (required when rejecting)', 'การไม่อนุมัติต้องระบุเหตุผล': 'A reason is required to reject',
'ยืนยันใช้สิทธิ์ขาด': 'Confirm final authority', 'คำตัดสินนี้ปิดเอกสารทันทีและเป็นที่สุด': 'This decision closes the document immediately and is final',
'ส่งต่อขั้นถัดไป': 'Forwarded to the next step', 'ผู้ขอ': 'Requester', 'งาน': 'Event',

// ── ผู้ดูแลระบบ ──
'หน้าผู้ดูแลระบบ': 'Admin', 'อีเมล': 'Email', 'รหัสผ่าน': 'Password', 'ระบบคลังพัสดุ · หน้าผู้ดูแลระบบ': 'Inventory · Admin',
'โปรดเลือกรายการที่ต้องการ': 'Choose a task', 'เพิ่มรายการใหม่': 'Add new item', 'รหัสถัดไป': 'Next code', 'รับของเข้า': 'Receive stock',
'ปรับยอดให้เป็นปัจจุบัน': 'Adjust to actual count', 'ลงเฉพาะส่วนต่าง': 'Posts the difference only', 'การเคลื่อนไหวล่าสุด': 'Recent movements', 'เวลา': 'Time',
'ผู้บันทึก': 'Recorded by', 'เพิ่มของเข้าคลัง': 'Add to inventory', 'ของชนิดที่ยังไม่เคยมีในทะเบียน': 'An item type not yet in the register', 'หน่วยนับ': 'Unit',
'ชื่อรายการ': 'Item name', 'หมวดหลัก': 'Main category', 'หมวดย่อย': 'Subcategory', 'จำนวนตั้งต้น': 'Opening qty', 'ที่เก็บ': 'Location', 'เพิ่มลงทะเบียน': 'Add to register',
'ของชนิดเดิมที่ซื้อเพิ่มหรือได้รับบริจาค': 'More of an existing item, purchased or donated', 'เลือกรายการที่มีอยู่แล้ว': 'Choose an existing item',
'คงเหลือตอนนี้': 'Current balance', 'จำนวนที่รับเข้า': 'Qty received', 'ที่มา': 'Source', 'เลขที่เอกสารอ้างอิง': 'Reference no.', 'หมายเหตุ': 'Notes',
'เลือกรายการก่อน': 'Choose an item first', 'บันทึกรับเข้า': 'Record receipt', '1 · เลือกรายการ': '1 · Choose item', 'ค้นหาด้วยรหัสหรือชื่อรายการ': 'Search by code or item name',
'ยังไม่ได้เลือกรายการ': 'No item selected', '2 · กรอกยอดที่นับได้จริง': '2 · Enter the actual count', 'ยอดในระบบตอนนี้': 'System balance',
'ยอดที่นับได้จริง': 'Actual count', 'ส่วนต่างที่จะบันทึก': 'Difference to post', 'เหตุผล': 'Reason', 'บันทึกการปรับยอด': 'Save adjustment',
'ปรับยอด': 'Adjustment', 'รับเข้า': 'Received', 'คืนเข้า': 'Returned in', 'ตัดจำหน่าย': 'Written off', 'ตรวจนับไม่พบ': 'Not found at count', 'คืนกลับ': 'Returned',
'เบิกออก': 'Borrowed out', 'กลับรายการ': 'Reversal', 'ปีของงาน': 'Event year', 'สถานะรายการ': 'Item status', 'ใช้งาน': 'Active', 'เลิกใช้': 'Retired',
'รอจำหน่าย': 'Pending disposal', 'ค้นหา': 'Search', 'ปี': 'Year', 'เก็บยอดไว้': 'Keep balance', 'ตัดเหลือ 0': 'Write down to 0', 'ล้างที่เลือก': 'Clear selection',
'เปิดใช้งานอีกครั้ง': 'Reactivate', 'ปิดรายการที่เลือก': 'Retire selected', 'ยังไม่มีการเคลื่อนไหว': 'No movements yet', 'หมวด': 'Category',
'ไม่พบรายการตามเงื่อนไขนี้': 'No items match these filters', 'กลับหน้าหลัก': 'Back', 'ทุกหมวด': 'All categories', 'ทุกปี': 'All years', 'ใช้งานอยู่': 'Active',
'เลิกใช้แล้ว': 'Retired', 'ตรงกัน': 'Matches', 'เลือก': 'Select', 'ปิด': 'Close',

// ── ตรวจนับ (เฟส 1) ──
'ระบบกระทบยอดสต็อก': 'Stock Reconciliation', 'ความคืบหน้าการกระทบยอด': 'Reconciliation progress', '1 · เลือกรายการที่จะนับ': '1 · Choose an item to count',
'ไซส์ / รายละเอียด': 'Size / Details', 'สถานะภาพถ่าย': 'Photo status', 'ยอดในระบบ': 'System balance', 'สถานะการกระทบยอด': 'Reconciliation status',
'ขึ้นชั้นแล้วหรือยัง': 'Shelved?', 'ขึ้นชั้นแล้ว': 'Shelved', 'ยังไม่ขึ้นชั้น': 'Not shelved', 'สภาพอุปกรณ์': 'Condition', 'สถานที่เก็บ': 'Storage location',
'ผู้นับ': 'Counted by', 'บันทึกลงชีต': 'Save to sheet', 'ล้างฟอร์ม': 'Clear form', 'บันทึกเรียบร้อย': 'Saved', 'ยอดส่วนต่าง': 'Difference',
'นับรายการต่อไป': 'Count next item', 'ชุดตรวจนับที่ใช้บ่อย': 'Frequent count sets', 'เลือกหมวดหลัก': 'Choose a main category', 'เริ่มเลือกใหม่': 'Start over',
'พิมพ์ {{PREFIX}}- หรือชื่อของ': 'Type {{PREFIX}}- or an item name', 'ชื่อผู้นับรอบนี้': 'Counter name', 'เลือกสถานะ': 'Choose status',
'กรุณาเลือกรายการก่อน': 'Please choose an item first', 'กำลังบันทึกลงชีต…': 'Saving to sheet…', 'ยอดในระบบขณะนับ': 'System balance at count time', 'ไม่ทราบ': 'Unknown',
'ดึงข้อมูลไม่สำเร็จ': 'Could not fetch data', 'ยังไม่มีในทะเบียน': 'Not in register', 'นับแล้ว': 'Counted',
'กำลังโหลดรูป': 'Loading photo', 'กำลังโหลดรูป…': 'Loading photo…', 'ไม่มีรูป': 'No photo',
'รูปภาพประกอบรายการ': 'Item photo', 'ยังไม่มีรูปของรายการนี้': 'No photo for this item',
'โหลดรูปไม่สำเร็จ ลองเลือกใหม่อีกครั้ง': 'Could not load photo. Try selecting again',
'ยอดส่วนต่าง — ระบบคำนวณให้อัตโนมัติ': 'Difference — calculated automatically', '* จำเป็นเมื่อยอดไม่ตรง': '* Required when counts differ',
'เลขที่รายการกระทบยอด': 'Reconciliation no.', 'บันทึกเมื่อ': 'Saved at', 'รหัส / ชื่อรายการ': 'Code / Item name', 'ขึ้นชั้น / สถานที่เก็บ': 'Shelved / Storage location',
'Undo · เปิดให้นับใหม่': 'Undo · Reopen for recount', 'ยกเลิกผลนับแล้ว': 'Count undone', 'กำลังเปิดให้นับใหม่…': 'Reopening for recount…',
'ยกเลิกผลการตรวจนับเรียบร้อยแล้ว': 'Count result undone', 'ยกเลิกผลนับ · เปิดให้นับใหม่': 'Count undone · Reopened for recount', 'ยกเลิกผลนับ': 'Count undone',
'ระบบได้บันทึกการยกเลิกผลนับแล้ว สามารถเลือก “นับรายการต่อไป” เพื่อดำเนินการต่อ': 'The count has been undone. Select “Count next item” to continue.',
'พิมพ์เก็บเป็นหลักฐานออฟไลน์ ข้อมูลถูกบันทึกลงแท็บ ทะเบียนพัสดุ และแท็บ RECON_LOG เรียบร้อยแล้ว': 'Print for offline records. Saved to the Inventory Register and RECON_LOG tabs.',
'เช่น ชั้น 11': 'e.g. Floor 11', 'ถ้ายอดไม่ตรง ระบุว่าของไปอยู่ที่ไหน เช่น เบิกไปใช้ในกิจกรรม, หาไม่พบ, ชำรุดทิ้งแล้ว': 'If the count differs, note where the items are, e.g. borrowed for an activity, not found, damaged/discarded',
'เป็นของประเภทไหน': 'What type of item?', 'ทรง': 'Style', 'แบบไหน': 'Which type?', 'ของงานไหน': 'Which event?', 'ปีไหน': 'Which year?',
'สี': 'Colour', 'สีอะไร': 'Which colour?', 'สีรอง': 'Secondary colour', 'สีรองอะไร': 'Which secondary colour?', 'ไซส์': 'Size', 'ไซส์ไหน': 'Which size?',
// ── สรุปภาพรวม (เฟส 1) ──
'แดชบอร์ดตรวจนับพัสดุ': 'Stock Count Dashboard', 'อ่านยอดใหม่': 'Refresh', 'ยอดของรายการที่ตรวจนับไปแล้ว': 'Totals for counted items',
'กำลังอ่านยอดจากชีต…': 'Reading balances from sheet…', 'ยอดในระบบ (รายการที่นับแล้ว ณ ตอนนับ)': 'System balance (counted items, at count time)', 'รูป': 'Photo', 'ไม่มีรูป': 'No photo', 'โหลด': 'Loading',
'นับได้จริงรอบนี้': 'Counted this round', 'นับได้เกินยอดในระบบ': 'Counted above system balance', 'แยกตามหมวดหลัก': 'By main category', 'นับได้': 'Counted',
'ส่วนต่าง': 'Difference', 'รายการที่ตรวจนับไม่พบ': 'Items not found at count', 'รายการที่นับได้เกินยอดในระบบ': 'Items counted above system balance',
'บันทึกการนับล่าสุด': 'Latest counts', 'ยังไม่มีข้อมูลในกลุ่มนี้': 'No data in this group', 'อ่านยอดไม่สำเร็จ': 'Could not read balances', 'ลองใหม่': 'Try again',
'ยืนยันการดำเนินการ': 'Confirm action', 'กรุณาระบุเหตุผลเพื่อดำเนินการต่อ': 'A reason is required to continue.', 'ยืนยันการยกเลิก': 'Confirm cancellation',
'กรุณาระบุเหตุผลก่อนยืนยันการยกเลิก': 'Please enter a reason before confirming cancellation.', 'มีข้อมูลใหม่ กดรีเฟรชหน้าเพื่อดู': 'New data available · refresh the page to see it',
'เลือกรหัสหรือชื่อรายการเพื่อดูรูปประกอบ': 'Select a code or item name to view its photo', 'กรอกรหัสรายการเพื่อดูรูปประกอบ': 'Enter an item code to view its photo',
'เช่น ยืมอุปกรณ์ไปใช้ในกิจกรรม... วันที่...': 'e.g. borrowing equipment for an activity on …', 'ระบบคลังพัสดุ': 'Inventory System',
'รายการคงค้าง (ไม่มีข้อมูล)': 'Legacy items (no data)', 'รายการคงค้างไม่มีข้อมูล': 'Legacy items (no data)', 'จัดการทั้งชุด': 'Manage all',
'⚠️ ข้อความแจ้งเตือนถึงผู้ดูแลระบบ': '⚠️ Admin notice', 'กำลังตรวจสอบรายการเก่า…': 'Checking legacy items…', 'ยอดที่เหลือจะทำอย่างไร': 'Action for remaining balance',
'เลือกทุกรายการที่แสดง': 'Select all shown items', 'ไม่จำเป็นต้องกรอก': 'Optional', 'เช่น ใบส่งของ PO-2569-104': 'e.g. Delivery note PO-2569-104',
'เช่น เครื่องพรินเตอร์ Ricoh IM C300 ห้องธุรการ': 'e.g. Ricoh IM C300 printer, admin office', 'เช่น ตัวหนีบด้านหลังหลุด 4 ตัว แยกไว้รอซ่อม': 'e.g. 4 clips detached, set aside for repair',
'สำหรับของที่ยังกองอยู่ในคลังแต่ไม่แจกแล้ว ยอดคงเหลือไม่เปลี่ยน ·': 'For items still in storage but no longer issued; balance stays the same ·',
'สำหรับของที่แจกหมดไปแล้ว ระบบลงตัดจำหน่ายเท่ากับยอดคงเหลือให้ พร้อมเหตุผลและชื่อผู้ทำ': 'For items already distributed; posts a write-off equal to the remaining balance with reason and user',
'สิ่งที่จะเกิดขึ้น': 'What will happen', 'เพิ่มแถวใหม่ท้ายทะเบียน': 'Appends a new row at the end of the register',
'ตั้งสถานะรายการเป็น ใช้งาน': 'Sets item status to Active', 'ลงรับเข้าจำนวนตั้งต้นในบัญชีเคลื่อนไหว': 'Posts the opening quantity to the movement ledger',
'ไม่แตะแถวเดิมสักแถว': 'Existing rows are not modified', 'ระบบจะบันทึกแบบนี้': 'How this will be recorded',
'แท็บ': 'Tab', 'LEDGER_เคลื่อนไหว': 'LEDGER_Movements', 'เข้า': 'In', 'ออก': 'Out',
'คอลัมน์ F จำนวนตั้งต้น และคอลัมน์ G ยอดยกมา ในทะเบียนไม่ถูกแตะ': 'Column F (opening qty) and Column G (opening balance) in the register are not touched',
'กลับรายการได้': 'Reversible', 'ถ้าลงผิด ลงปรับยอดกลับทางได้ ระบบเก็บร่องรอยทั้งสองครั้ง ไม่ต้องเข้าไปแก้ในชีต': 'If entered by mistake, post a reverse adjustment. Both entries remain in the audit trail without editing the sheet directly.',
'— ไม่ระบุ —': '— Unspecified —', 'ช่องพื้นเหลืองคือของที่ยังไม่มีข้อมูลช่องนี้ ไม่ใช่ว่าไม่มีของ': 'Yellow options indicate items without this field recorded yet (not out of stock)',
'ไม่เจอรายการที่ตรงเงื่อนไขนี้': 'No items match these criteria', 'กดเลือกรายการที่จะตรวจนับ': 'Select an item to count',
'ยังไม่มีข้อมูลรายการ': 'No item data available', 'ระบบจะไม่ลบประวัติเดิม แต่จะเปิดรายการกลับให้นับใหม่': 'Previous count history will be preserved, and this item will be reopened for recount.',
'กำลังอัปเดตยอดล่าสุด…': 'updating latest balances…', 'อัปเดตไม่สำเร็จ แสดงยอดที่จำไว้': 'update failed · showing saved balances',
'กำลังลงนาม': 'Signing', 'ลงนามแล้ว': 'Signed', 'กำลังอัปโหลดใบลงนาม': 'Uploading signed form', 'แนบใบลงนามแล้ว': 'Signed form attached',
'แดชบอร์ดตรวจนับ': 'Stock Count Dashboard', 'หน้าผู้ดูแลระบบ — {{APP}}': 'Admin — {{APP}}',
'ใบเบิกพัสดุ': 'Borrowing Form', 'ใบจ่ายพัสดุ': 'Issue Form', 'ใบย้ายพัสดุ': 'Transfer Form',

// ── ข้อความจากระบบ (ข้อผิดพลาดที่พบบ่อย) ──
'กำหนดคืนต้องหลังวันที่เบิก': 'Due date must be after the borrow date', 'กรุณาระบุผู้รับ': 'Please specify the recipient',
'ระบบกำลังบันทึกรายการอื่น ลองอีกครั้งใน 2–3 วินาที': 'Another entry is being saved. Please try again in 2–3 seconds.',
'ยังไม่ได้ยืนยันตัวตน หรืออีเมลนี้ยังไม่มีสิทธิ์ กรุณาเข้าด้วยบัญชี Google': 'Not signed in, or this email has no access. Please sign in with Google.',
'บัญชีนี้ใช้ได้เฉพาะ ขอเบิก ติดตามรอรับ และแจ้งคืนของ': 'This account can only request items, track collection and report returns.',
'บัญชีนี้เป็นผู้ตรวจสอบ ดูข้อมูลได้อย่างเดียว แก้ไขหรือสร้างเอกสารไม่ได้': 'This is an auditor account: view only, cannot create or edit documents.',
'จำนวนคืนและจำนวนชำรุดต้องไม่ติดลบ': 'Returned and damaged quantities cannot be negative', 'จำนวนที่ย้ายต้องมากกว่าศูนย์': 'Quantity to move must be greater than zero',
'ต้นทางกับปลายทางต้องไม่ซ้ำกัน': 'Origin and destination must be different', 'กรุณาระบุสถานที่ปลายทางที่จะย้ายไป': 'Please specify the destination',
'กรุณากรอกแบบสอบถามผู้ใช้งานก่อนใช้ระบบ': 'Please complete the user survey first',
'เลือกไว้': 'Selected', 'รายการ รวม': 'items · total', 'ชิ้น': 'pcs', 'ยืนยันหรือไม่': 'Confirm?', 'ยอดคงเหลือไม่เปลี่ยน': 'Balance stays the same',
'ข้ามขั้นที่ยังไม่พิจารณา': 'Pending steps skipped', 'ปิดเอกสารแล้ว': 'Document closed', 'ชั่วคราว': 'Temporary', 'ถาวร': 'Permanent',
'ยังไม่พบรายการที่ระบุปีเก่ากว่า 2 ปีและยังเปิดใช้งานอยู่': 'No items older than 2 years are still active',
'อนุมัติทันทีด้วยสิทธิ์ขาด ระบบบันทึก log และแจ้งผู้บริหารแล้ว': 'Approved immediately under final authority. Logged and the executive has been notified.',
'ผู้ทดสอบ': 'Tester',
'อีเมลของคุณ': 'Your email', 'ส่งรหัสเข้าอีเมล': 'Email me a sign-in code', 'รหัส 6 หลักจากอีเมล': '6-digit code from the email', 'ยืนยันรหัส แล้วเข้าระบบ': 'Verify code and sign in',
'เข้าใช้งาน': 'Continue', 'เข้าใช้งานต่อ': 'Continue as', 'หรือเข้าด้วยบัญชี Google': 'or sign in with Google', 'ออกจากระบบแล้ว': 'You have signed out',
'กำลังส่งรหัส…': 'Sending code…', 'ส่งรหัสอีกครั้ง': 'Send the code again', 'กำลังตรวจรหัส…': 'Checking code…', 'กรุณาใส่รหัส 6 หลัก': 'Please enter the 6-digit code',
'รูปแบบอีเมลไม่ถูกต้อง': 'Invalid email address',
'ขอรหัสบ่อยเกินไป รอ 15 นาทีแล้วลองใหม่': 'Too many code requests. Wait 15 minutes and try again.',
'วันนี้ส่งรหัสครบจำนวนแล้ว กรุณาลองใหม่พรุ่งนี้ หรือติดต่อผู้ดูแลระบบ': 'The daily code limit has been reached. Please try again tomorrow or contact the admin.',
'รหัสหมดอายุแล้ว กรุณาขอรหัสใหม่': 'The code has expired. Please request a new one.', 'ใส่รหัสผิดหลายครั้ง กรุณาขอรหัสใหม่': 'Too many wrong attempts. Please request a new code.',
'บัญชีนี้ยังไม่มีสิทธิ์เข้าระบบ กรุณาติดต่อผู้ดูแลระบบ': 'This account does not have access yet. Please contact the admin.',
'หมดเวลาการเข้าใช้ กรุณาเข้าสู่ระบบใหม่': 'Your session has expired. Please sign in again.',
'{{APP}} · ระบบคลังพัสดุ': '{{APP}} · Inventory System', 'บัญชีที่ใช้อยู่ตอนนี้': 'Signed in as', 'เข้าใช้งานด้วยบัญชีนี้': 'Continue with this account', 'เลือกบัญชี Google': 'Choose a Google account',
'เพิ่มบัญชีอื่น แล้วเข้าระบบ': 'Add another account and sign in', 'หรือ': 'or', 'ยังไม่มีบัญชี Google': "Don't have a Google account?", 'สร้างบัญชีใหม่': 'Create one',
'แล้วกลับมาเข้าระบบ': 'then come back to sign in', 'เข้าครั้งแรกต้องทำอะไร': 'First time here?', 'เจ้าหน้าที่': 'Staff', 'เข้าด้วยอีเมล {{STAFF_DOMAIN}} ใช้งานได้ทันที': 'Sign in with your {{STAFF_DOMAIN}} email and start right away',
'เข้าด้วย Gmail ครั้งแรกจะมีแบบสอบถามสั้นๆ กรอกครั้งเดียว แล้วขอเบิกและแจ้งคืนได้': 'Sign in with Gmail. The first time, fill in a short one-time survey, then you can request items and report returns',
'ต้องให้ผู้ดูแลระบบเพิ่มบัญชีในทะเบียนผู้ใช้ก่อน': 'An admin must add your account to the user list first',
'มีปัญหาการเข้าระบบ ติดต่อ {{SUPPORT}}': 'Trouble signing in? Contact {{SUPPORT}}',
'ยังอ่านบัญชี Google ไม่ได้ กรุณาเลือกบัญชีด้านล่าง': "We couldn't read your Google account. Please choose an account below.",
'บัญชีนี้ถูกปิดการใช้งาน กรุณาติดต่อผู้ดูแลระบบ หรือเข้าด้วยบัญชีอื่น': 'This account is disabled. Please contact the admin or sign in with another account.',
'บัญชีนี้ยังไม่มีสิทธิ์เข้าระบบ กรุณาเข้าด้วยบัญชีอื่น หรือติดต่อผู้ดูแลระบบ': 'This account does not have access yet. Please sign in with another account or contact the admin.',
'ผู้ใช้ภายนอก (ยังไม่กรอกแบบสอบถาม)': 'External user (survey not completed)',
'แก้ไขรายละเอียดรายการ': 'Edit item details', 'ชื่อ · หมวด · ไซส์ · ที่เก็บ': 'Name · Category · Size · Location', '2 · แก้ไขข้อมูล': '2 · Edit details',
'พิมพ์รหัสหรือชื่อรายการ': 'Type a code or item name', 'แสดงเมื่อสลับเป็น English': 'Shown when switched to English', 'ขนาด (ไซส์)': 'Size',
'เช่น M, XL, 38': 'e.g. M, XL, 38', 'หมายเหตุการแก้ไข': 'Edit note', 'เช่น แก้ชื่อให้ตรงป้ายบนกล่อง': 'e.g. Name corrected to match the box label',
'บันทึกการแก้ไข': 'Save changes', 'สิ่งที่จะเปลี่ยน': 'What will change', 'ยังไม่มีการแก้ไข': 'No changes yet', 'ไม่มีช่องที่เปลี่ยน': 'Nothing changed',
'แก้เฉพาะคำอธิบายของรายการ รหัส ยอดคงเหลือ และคอลัมน์ G ยอดยกมา ไม่ถูกแตะ ระบบเก็บค่าเดิมกับค่าใหม่ไว้ในแท็บ STATUS_LOG': 'Only the item description changes. The code, the balance and column G (opening balance) are not touched. Old and new values are kept in the STATUS_LOG tab.',
'รหัสไม่ถูกต้อง': 'Invalid code', '(ว่าง)': '(blank)', 'แก้ไขรายละเอียด': 'Details edited', 'ผู้ช่วยผู้จัดการ': 'Assistant Manager', 'ผู้พัฒนา ชั่วคราว': 'Developer (temporary)', 'ผู้ดูแลระบบ (ทดสอบ)': 'Admin (test)', 'ผู้ใช้ภายนอก': 'External users', 'ชื่อภาษาอังกฤษ': 'English name', 'บัญชีนี้ถูกปิดการใช้งาน กรุณาติดต่อผู้ดูแลระบบ': 'This account is disabled. Please contact the administrator.'
};

// รูปแบบข้อความที่มีตัวเลขหรือข้อมูลปน — แปลเฉพาะส่วนที่เป็นถ้อยคำ
var N = '([\\d,]+)';
function pl(n, one, many) { return n + ' ' + (String(n).replace(/,/g, '') === '1' ? one : many); }
var P = [
  [new RegExp('^' + N + ' รายการ$'), function (m) { return pl(m[1], 'item', 'items'); }],
  [new RegExp('^' + N + ' ไซส์$'), function (m) { return pl(m[1], 'size', 'sizes'); }],
  [new RegExp('^' + N + ' ชิ้น$'), function (m) { return m[1] + ' pcs'; }],
  [new RegExp('^คงเหลือ ' + N + '$'), function (m) { return m[1] + ' in stock'; }],
  [new RegExp('^เหลือ ' + N + '$'), function (m) { return m[1] + ' left'; }],
  [new RegExp('^ว่าง ' + N + '/' + N + ' เครื่อง$'), function (m) { return m[1] + '/' + m[2] + ' units free'; }],
  [new RegExp('^เลขเครื่อง · ว่าง ' + N + '/' + N + '$'), function (m) { return 'Unit numbers · ' + m[1] + '/' + m[2] + ' free'; }],
  [new RegExp('^เลือกเลขเครื่อง \\(ว่าง ' + N + ' เครื่อง\\)$'), function (m) { return 'Select unit numbers (' + m[1] + ' free)'; }],
  [new RegExp('^ซ่อนที่หมดแล้ว ' + N + ' รายการ \\(ติ๊กออกเพื่อดู\\)$'), function (m) { return pl(m[1], 'out-of-stock item', 'out-of-stock items') + ' hidden (untick to show)'; }],
  [new RegExp('^แสดงเพิ่ม \\(เหลืออีก ' + N + '\\)$'), function (m) { return 'Show more (' + m[1] + ' remaining)'; }],
  [new RegExp('^นับแล้ว ' + N + ' จาก ' + N + ' รายการ$'), function (m) { return m[1] + ' of ' + m[2] + ' items counted'; }],
  [new RegExp('^กลุ่มนี้ตรวจนับแล้ว ' + N + ' จาก ' + N + ' รายการ · เหลืออีก ' + N + ' รายการ$'), function (m) { return 'Group progress: ' + m[1] + ' of ' + m[2] + ' counted · ' + pl(m[3], 'item', 'items') + ' remaining'; }],
  [new RegExp('^นับแล้ว ' + N + '$'), function (m) { return 'Counted ' + m[1]; }],
  [new RegExp('^ยอดเดิม ' + N + '$'), function (m) { return 'Prev ' + m[1]; }],
  [new RegExp('^เหลือ ' + N + ' รายการ$'), function (m) { return pl(m[1], 'item', 'items') + ' remaining'; }],
  [new RegExp('^ยืนยัน Undo รายการ (\\S+)$'), function (m) { return 'Confirm Undo for ' + m[1]; }],
  [new RegExp('^ดึงข้อมูลไม่สำเร็จ (.+)$'), function (m) { return 'Could not fetch data: ' + T(m[1]); }],
  [new RegExp('^โหลดรายการไม่สำเร็จ (.+)$'), function (m) { return 'Could not load items: ' + T(m[1]); }],
  [new RegExp('^ความเห็นแอดมิน: (.+)$'), function (m) { return 'Admin note: ' + m[1]; }],
  [new RegExp('^(กำลังลงนาม|ลงนามแล้ว|กำลังอัปโหลดใบลงนาม|แนบใบลงนามแล้ว) (\\S+)(…)?$'), function (m) { return T(m[1]) + ' ' + m[2] + (m[3] || ''); }],
  [new RegExp('^(.+)  \\(นับแล้ว ' + N + '\\)$'), function (m) { return T(m[1]) + '  (counted ' + m[2] + ')'; }],
  [new RegExp('^ยังไม่ได้นับอีก ' + N + ' รายการ$'), function (m) { return pl(m[1], 'item', 'items') + ' remaining'; }],
  [new RegExp('^ยอดเดิมทั้งทะเบียน ' + N + ' ชิ้น$'), function (m) { return 'Previous register total: ' + m[1] + ' pcs'; }],
  [new RegExp('^เหลือ ' + N + '$'), function (m) { return m[1] + ' left'; }],
  [new RegExp('^เลขที่ (\\S+)$'), function (m) { return 'No. ' + m[1]; }],
  [new RegExp('^เกิน \\+' + N + '$'), function (m) { return 'Over +' + m[1]; }],
  [new RegExp('^ขาด -?' + N + '$'), function (m) { return 'Short -' + String(m[1]).replace(/^-/, ''); }],
  [new RegExp('^รายการ (.+) ถูกเปิดให้ตรวจนับใหม่แล้ว ประวัติการตรวจนับเดิมยังคงจัดเก็บไว้ในระบบและไม่ได้ถูกลบ$'), function (m) { return 'Item ' + T(m[1]) + ' has been reopened for recount. Previous count history is preserved.'; }],
  [new RegExp('^รวม ' + N + '$'), function (m) { return 'Total ' + m[1]; }],
  [/^เครื่อง (.+)$/, function (m) { return 'Units ' + m[1]; }],
  [/^ข้อมูล ณ (.+) \(ที่จำไว้ในเครื่อง · กำลังอ่านยอดใหม่…\)$/, function (m) { return 'As of ' + m[1] + ' (saved on this device · refreshing…)'; }],   // 
  [/^ข้อมูล ณ (.+) \(ที่จำไว้ในเครื่อง · อ่านยอดใหม่ไม่สำเร็จ\)$/, function (m) { return 'As of ' + m[1] + ' (saved on this device · refresh failed)'; }],
  [/^ข้อมูลที่จำไว้ (\d\d:\d\d) · กำลังอัปเดต…$/, function (m) { return 'Saved at ' + m[1] + ' · updating…'; }],
  [/^ข้อมูล ณ (.+)$/, function (m) { return 'As of ' + m[1]; }],
  [/^สวัสดี (.+)$/, function (m) { return 'Hello ' + m[1]; }],
  [/^บันทึกแล้ว เลขที่ (\S+) · สถานะ (.+)$/, function (m) { return 'Saved — no. ' + m[1] + ' · status ' + ST(m[2]); }],
  [/^ไม่พบรหัส (\S+)( ในทะเบียน)?$/, function (m) { return 'Code ' + m[1] + ' not found' + (m[2] ? ' in the register' : ''); }],
  [/^วิทยุ (\S+) กรุณาเลือกเลขเครื่องก่อน$/, function (m) { return 'Radio ' + m[1] + ': please select unit numbers first'; }],
  [/^ไม่พบเอกสาร (\S+) ตรวจเลขที่อีกครั้ง$/, function (m) { return 'Document ' + m[1] + ' not found. Please check the number.'; }],
  [/^บันทึกส่วนต่าง ([+-]?[\d,]+) แล้ว คงเหลือ ([\d,]+)$/, function (m) { return 'Difference ' + m[1] + ' posted. Balance ' + m[2]; }],
  [/^เกิดข้อผิดพลาด: (.+)$/, function (m) { return 'An error occurred: ' + T(m[1]); }],
  [/^อัปโหลดไฟล์ไม่สำเร็จ: (.+)$/, function (m) { return 'Upload failed: ' + T(m[1]); }]
];

var ID = '(\\S+)';
function R(x) { return new RegExp('^' + x + '$'); }
function stt(x) { var m = /^(.*?)(\s+[A-Z]+-\d{4}-\d{3,5})?$/.exec(x); return T(m[1]) + (m[2] || ''); }
function ST(x) { x = String(x).trim(); return x === 'อนุมัติ' ? 'Approved' : T(x); }
var VERB = { 'เบิก': 'borrow', 'จ่าย': 'issue', 'เบิกหรือจ่าย': 'borrow or issue' };
var P2 = [
  // ── ข้อความจากเซิร์ฟเวอร์ ──
  [R('รหัส ' + ID + ' คงเหลือ ' + N + ' (เบิกหรือจ่าย|เบิก|จ่าย) ' + N + ' ไม่ได้'), function (m) { return 'Code ' + m[1] + ': only ' + m[2] + ' in stock — cannot ' + VERB[m[3]] + ' ' + m[4]; }],
  [R('ไม่พบเอกสาร ' + ID + ' ของบัญชีนี้ หรือยังไม่ได้รับของ'), function (m) { return 'Document ' + m[1] + ' was not found for this account, or the items have not been received yet'; }],
  [R('ไม่พบเอกสาร ' + ID + ' ของบัญชีนี้'), function (m) { return 'Document ' + m[1] + ' was not found for this account'; }],
  [R('ไม่พบเอกสาร ' + ID), function (m) { return 'Document ' + m[1] + ' not found'; }],
  [R('เอกสาร ' + ID + ' ยังรออนุมัติ ยังคืนของไม่ได้'), function (m) { return 'Document ' + m[1] + ' is still pending approval — items cannot be returned yet'; }],
  [R('เอกสาร ' + ID + ' ไม่ได้รับอนุมัติ จึงไม่มีของให้คืน'), function (m) { return 'Document ' + m[1] + ' was not approved, so there is nothing to return'; }],
  [R('เอกสาร ' + ID + ' คืนครบแล้ว ไม่ต้องบันทึกซ้ำ'), function (m) { return 'Document ' + m[1] + ' is fully returned — no need to record it again'; }],
  [R('เอกสาร ' + ID + ' ไม่มีรายการพัสดุ'), function (m) { return 'Document ' + m[1] + ' has no items'; }],
  [R('รหัส ' + ID + ' ค้างคืน ' + N + ' ชิ้น คืน ' + N + ' ชำรุด ' + N + ' รวมเกินยอดค้าง'), function (m) { return 'Code ' + m[1] + ': ' + m[2] + ' outstanding — returned ' + m[3] + ' + damaged ' + m[4] + ' is more than outstanding'; }],
  [R('รหัส ' + ID + ' คืน ' + N + ' ชำรุด ' + N + ' รวมเกินยอดค้างคืน ' + N), function (m) { return 'Code ' + m[1] + ': returned ' + m[2] + ' + damaged ' + m[3] + ' is more than the ' + m[4] + ' outstanding'; }],
  [R('รหัส ' + ID + ' ค้างคืน ' + N + ' แจ้งคืนเกินยอดค้าง'), function (m) { return 'Code ' + m[1] + ': ' + m[2] + ' outstanding — the return is more than outstanding'; }],
  [R('วิทยุ ' + ID + ' กรุณาเลือกเลขเครื่องที่คืน ' + N + ' เครื่อง และชำรุด ' + N + ' เครื่อง'), function (m) { return 'Radio ' + m[1] + ': please select ' + pl(m[2], 'returned unit', 'returned units') + ' and ' + pl(m[3], 'damaged unit', 'damaged units'); }],
  [R('วิทยุ ' + ID + ' กรุณาเลือกเลขเครื่องให้ครบ ' + N + ' เครื่อง \\(เลือกไว้ ' + N + '\\)'), function (m) { return 'Radio ' + m[1] + ': please select all ' + pl(m[2], 'unit', 'units') + ' (' + m[3] + ' selected)'; }],
  [R('เครื่อง ' + ID + ' ไม่ได้ยืมอยู่ในเอกสาร ' + ID), function (m) { return 'Unit ' + m[1] + ' is not on loan under document ' + m[2]; }],
  [R('เครื่อง ' + ID + ' ไม่ว่าง \\((.+)\\)'), function (m) { return 'Unit ' + m[1] + ' is not available (' + stt(m[2]) + ')'; }],
  [R('เลือกเครื่อง ' + ID + ' ซ้ำ'), function (m) { return 'Unit ' + m[1] + ' was selected twice'; }],
  [R('ไม่พบเครื่อง ' + ID + ' ในรุ่น ' + ID), function (m) { return 'Unit ' + m[1] + ' not found in model ' + m[2]; }],
  [R('ไม่พบใบอนุมัติ ' + ID), function (m) { return 'Approval ' + m[1] + ' not found'; }],
  [R('ยังไม่ถึงคิวของบทบาทนี้ ขณะนี้รอ (.+)'), function (m) { return 'Not this role\'s turn yet — now waiting for ' + T(m[1]); }],
  [R('เอกสารยังไม่อนุมัติ สถานะปัจจุบัน (.+)'), function (m) { return 'The document is not approved yet. Current status: ' + ST(m[1]); }],
  [R('หน้านี้สำหรับผู้ดูแลระบบเท่านั้น บัญชีของคุณเป็น (\\S+)'), function (m) { return 'This page is for admins only. Your account role is ' + m[1]; }],
  [R('หน้านี้ไม่เปิดให้สิทธิ์ของคุณ \\((.+)\\)'), function (m) { return 'This page is not available for your role (' + T(m[1]) + ')'; }],
  [R('สถานะไม่ถูกต้อง: (.+)'), function (m) { return 'Invalid status: ' + T(m[1]); }],
  [R('ไม่พบรายการ ' + ID + ' ในเอกสาร ' + ID), function (m) { return 'Line ' + m[1] + ' not found in document ' + m[2]; }],
  [R('ไม่พบรายการแจ้งคืน ' + ID), function (m) { return 'Return notice ' + m[1] + ' not found'; }],
  [R('รายการนี้ดำเนินการไปแล้ว \\((.+)\\)'), function (m) { return 'This has already been processed (' + T(m[1]) + ')'; }],
  [R('ไม่พบผู้ใช้ (\\S+)'), function (m) { return 'User ' + m[1] + ' not found'; }],
  // ── ข้อความบนหน้าเว็บ ──
  [R('(\\S+) — (.+) \\(คงเหลือ ' + N + '\\)'), function (m) { return m[1] + ' — ' + T(m[2]) + ' (' + m[3] + ' in stock)'; }],
  [R('เพิ่ม ' + N + ' รายการจากหน้ารายการพัสดุแล้ว ตรวจจำนวนก่อนส่ง( \\(ข้าม ' + N + ' รายการที่หมด\\))?'), function (m) { return 'Added ' + pl(m[1], 'item', 'items') + ' from the Inventory page — please check quantities before submitting' + (m[2] ? ' (skipped ' + m[3] + ' out of stock)' : ''); }],
  [R('ปิดยอดเอกสาร ' + ID + ' จะลงพัสดุเป็นสูญหายรวม ' + N + ' ชิ้น ตัดออกจากสต็อกถาวรและย้อนกลับไม่ได้ ยืนยันหรือไม่'), function (m) { return 'Closing document ' + m[1] + ' will record ' + m[2] + ' pcs as lost and remove them from stock permanently. This cannot be undone. Continue?'; }],
  [R('ส่งคำขอคืนแล้ว ' + ID), function (m) { return 'Return request sent: ' + m[1]; }],
  [R('บันทึกการคืนแล้ว ' + ID), function (m) { return 'Return recorded: ' + m[1]; }],
  [R('บันทึก ' + N + ' รายการเข้าบัญชีเคลื่อนไหวเรียบร้อย'), function (m) { return pl(m[1], 'line', 'lines') + ' posted to the stock ledger'; }],
  [R('เข้าคิวอนุมัติ ใบอนุมัติเลขที่ ' + ID + ' รอผู้ดูแลระบบพิจารณาเป็นขั้นแรก'), function (m) { return 'Queued for approval — approval no. ' + m[1] + ', waiting for admin review (step 1)'; }],
  [R('ผู้ใช้ ([^·]+)'), function (m) { return 'User ' + m[1]; }],
  [R('ผู้อนุมัติ ([^·]+)'), function (m) { return 'Approver ' + m[1]; }],
  [R('อนุมัติขั้นที่ ' + N), function (m) { return 'Approval step ' + m[1]; }],
  [R('เบิก ([^·]+) กำหนดคืน ([^·]+)'), function (m) { return 'Borrowed ' + m[1] + ' · due ' + m[2]; }],
  [R('ค้างคืน ' + N), function (m) { return m[1] + ' outstanding'; }],
  [R('โหลดรายการไม่สำเร็จ: (.+)'), function (m) { return 'Could not load the list: ' + T(m[1]); }],
  [R('ไม่พบรายการที่ตรงกับทุกคำ \\(ไม่มีคำว่า (.+) ในทะเบียน\\)'), function (m) { return 'No items match every word (not in the register: ' + m[1] + ')'; }],
  [R('กดอีกครั้งเพื่อลบ ' + ID), function (m) { return 'Click again to delete ' + m[1]; }],
  [R('ผิดพลาด: (.+)'), function (m) { return 'Error: ' + T(m[1]); }],
  [R('เสร็จแล้ว บันทึก ' + N + ' รูป( ข้าม ' + N + ' รูป)? กำลังโหลดหน้าใหม่…'), function (m) { return 'Done — saved ' + pl(m[1], 'photo', 'photos') + (m[2] ? ', skipped ' + m[3] : '') + '. Reloading…'; }],
  [R('ลบรูปของ (.+)'), function (m) { return 'Delete photos of ' + m[1]; }],
  [R('รออนุมัติ ' + N + ' ฉบับ'), function (m) { return pl(m[1], 'document', 'documents') + ' pending approval'; }],
  [R('ค้าง ' + N + ' วัน'), function (m) { return 'Waiting ' + pl(m[1], 'day', 'days'); }],
  [R('ขั้นที่ ' + N + ' (.+)'), function (m) { return 'Step ' + m[1] + ' ' + T(m[2]); }],
  [R('ยังไม่ถึงขั้นของคุณ รอ (.+) พิจารณาก่อน'), function (m) { return 'Not your step yet — waiting for ' + T(m[1]); }],
  [R('ยืนยันใช้สิทธิ์ขาด (.+) เอกสาร ' + ID + ' คำตัดสินนี้ปิดเอกสารทันทีและเป็นที่สุด'), function (m) { return 'Confirm final authority — ' + T(m[1]) + ' document ' + m[2] + '. This decision closes the document immediately and is final.'; }],
  [R('ปิดเอกสารแล้ว สถานะ ([^·]+)'), function (m) { return 'Document closed — status ' + ST(m[1]); }],
  [R('เอกสาร ' + ID + ' · (อนุมัติ|ไม่อนุมัติ)( · .+)?'), function (m) { return 'Document ' + m[1] + ' · ' + ST(m[2]) + (m[3] ? ' · ' + T(m[3].slice(3)) : ''); }],
  [R('เอกสาร ' + ID), function (m) { return 'Document ' + m[1]; }],
  [R('สร้างเมื่อ ([^·]+)'), function (m) { return 'Created ' + m[1]; }],
  [R('กำหนดคืน ([^·]+)'), function (m) { return 'Due ' + m[1]; }],
  [R('มีคำขอคืน ' + N + ' ฉบับ รอแอดมินตรวจรับ'), function (m) { return pl(m[1], 'return request', 'return requests') + ' awaiting admin check'; }],
  [R('เปิดหน้าแรกไม่ได้: (.+)'), function (m) { return 'Could not open the home page: ' + T(m[1]); }],
  [R('หน้า: (.+)'), function (m) { return 'Page: ' + T(m[1]); }],
  [R('วันที่ขอ ([^·]+)'), function (m) { return 'Requested ' + m[1]; }],
  [R('จ่ายของออกแล้ว ' + ID), function (m) { return 'Dispatched ' + m[1]; }],
  [R('ผู้แจ้ง ([^·]+)'), function (m) { return 'Reported by ' + m[1]; }],
  [R('แจ้งเมื่อ ([^·]+)'), function (m) { return 'Reported ' + m[1]; }],
  [R('รับคืนแล้ว ' + ID), function (m) { return 'Return received ' + m[1]; }],
  [R('ใช้งานอยู่ ' + N + ' รายการ'), function (m) { return pl(m[1], 'active item', 'active items'); }],
  [R('เลิกใช้แล้ว ' + N + ' รายการ'), function (m) { return pl(m[1], 'retired item', 'retired items'); }],
  [R('พบรายการที่ระบุปีเก่ากว่า 2 ปีที่ยังเปิดใช้งานอยู่จำนวน ' + N + ' รายการ ซึ่งทำให้รายการเหล่านี้ยังคงแสดงอยู่ในหน้าเบิกจ่ายของพนักงาน'), function (m) { return 'Found ' + pl(m[1], 'item older than 2 years', 'items older than 2 years') + ' still active, so they still appear on the staff Borrow/Issue page'; }],
  [R('เพิ่ม ' + ID + ' เรียบร้อย คงเหลือ ' + N), function (m) { return 'Added ' + m[1] + ' — ' + m[2] + ' in stock'; }],
  [R('หลังบันทึก คงเหลือจะเปลี่ยนจาก ' + N + ' เป็น ' + N + ' ชิ้น'), function (m) { return 'After saving, the balance will change from ' + m[1] + ' to ' + m[2] + ' pcs'; }],
  [R('รับเข้า ' + ID + ' เรียบร้อย คงเหลือ ' + N), function (m) { return 'Received ' + m[1] + ' — ' + m[2] + ' in stock'; }],
  [R('พบ ' + N + ' รายการ'), function (m) { return pl(m[1], 'item', 'items') + ' found'; }],
  [R('แสดง ' + N + ' จาก ' + N + ' รายการ'), function (m) { return 'Showing ' + m[1] + ' of ' + m[2] + ' items'; }],
  [R('เลือก (\\S+-\\d+) (.+)'), function (m) { return 'Select ' + m[1] + ' ' + T(m[2]); }],
  [R('เลือกไว้ ' + N + ' รายการ'), function (m) { return m[1] + ' selected'; }],
  [R('เก็บยอดไว้ ' + N + ' รายการ'), function (m) { return 'Keep balance: ' + pl(m[1], 'item', 'items'); }],
  [R('ตัดเหลือ 0 จำนวน ' + N + ' รายการ รวม ' + N + '( ชิ้น)?'), function (m) { return 'Set to 0: ' + pl(m[1], 'item', 'items') + ', ' + m[2] + ' pcs in total'; }],
  [R('ปิด ' + N + ' รายการ'), function (m) { return 'Retire ' + pl(m[1], 'item', 'items'); }],
  [R('ชิ้น'), function () { return 'pcs'; }],
  [R('เหตุผล: (.*)'), function (m) { return 'Reason: ' + m[1]; }],
  [R('ตัดจำหน่าย ' + N + ' รายการ รวม ' + N + ' ชิ้น'), function (m) { return 'written off ' + pl(m[1], 'item', 'items') + ', ' + m[2] + ' pcs in total'; }],
  [R('เปิดใช้งาน ' + N + ' รายการอีกครั้ง'), function (m) { return 'Reactivate ' + pl(m[1], 'item', 'items'); }],
  [R('เปิดใช้งาน ' + N + ' รายการแล้ว'), function (m) { return pl(m[1], 'item', 'items') + ' reactivated'; }],
  [R('บันทึกการแก้ไข ' + ID + ' แล้ว ' + N + ' ช่อง'), function (m) { return 'Saved changes to ' + m[1] + ' (' + pl(m[2], 'field', 'fields') + ')'; }],
  [R('สถานะ (.+)'), function (m) { return 'Status ' + T(m[1]); }],
  [R('กรุณากรอก(.+)'), function (m) { return 'Please fill in ' + T(m[1]).toLowerCase(); }],
  [R('(.+)ยาวเกิน ' + N + ' ตัวอักษร'), function (m) { return T(m[1]) + ' is longer than ' + m[2] + ' characters'; }],
  [R('ไม่มีหมวดหลัก "(.+)" ในทะเบียน กรุณาเลือกจากรายการ'), function (m) { return 'Main category "' + m[1] + '" is not in the register. Please choose from the list.'; }],
  [R('ส่งรหัสไปที่ (\\S+) แล้ว ดูในกล่องจดหมาย \\(หรือจดหมายขยะ\\) รหัสใช้ได้ 10 นาที'), function (m) { return 'Code sent to ' + m[1] + '. Check your inbox (or spam). It is valid for 10 minutes.'; }],
  [R('เข้าสู่ระบบแล้ว (\\S+) · กดปุ่มด้านล่างเพื่อเข้าใช้งาน'), function (m) { return 'Signed in as ' + m[1] + ' · tap the button below to continue'; }],
  [R('คำสั่งนี้ใช้ไม่ได้: (.+)'), function (m) { return 'This action is not allowed: ' + m[1]; }],
  [R('เข้าสู่ระบบด้วยรหัสทางอีเมล (.+)'), function (m) { return 'Signed in with email code ' + m[1]; }],
  [R('เข้าสู่ระบบด้วยบัญชี Google (.+)'), function (m) { return 'Signed in with Google account ' + m[1]; }]
];

// ชื่อระบบ/หน่วยงานจาก config.js: คำ {{APP}} {{ORG}} … ในพจนานุกรม → ค่าจริง (ฝั่งอังกฤษใช้ชื่ออังกฤษ)
(function () {
  var B = window.BRAND; if (!B) return;
  Object.keys(D).forEach(function (k) {
    var v = String(D[k]);
    if (k.indexOf('{{') < 0 && v.indexOf('{{') < 0) return;
    delete D[k];
    D[B.fill(k)] = B.fill(v.replace(/\{\{ORG\}\}/g, '{{ORG_EN}}').replace(/\{\{APP\}\}/g, '{{APP_EN}}'));
  });
  if (B.org && B.orgEn && B.org !== B.orgEn) D[B.org] = B.orgEn;
  if (B.app && B.appEn && B.app !== B.appEn) D[B.app] = B.appEn;
})();

// ชื่อสินค้า: ไทย → อังกฤษ
var NM = {}, NC = {}, NL = [];
function setNames(rows) {                          // ชื่อสินค้าโหลดจาก API (namesEn) แล้วเรียกซ้ำได้
  NM = {}; NC = {};
  (rows || []).forEach(function (r) {
    var th = String(r[1] || '').replace(/\s+/g, ' ').trim();
    if (r[2]) { NC[r[0]] = r[2]; if (th) NM[th] = r[2]; }
  });
  NL = Object.keys(NM).filter(function (k) { return k.length >= 4; }).sort(function (a, b) { return b.length - a.length; });
}
setNames(window.APP_NAMES);
window.I18N_NAME_EN = function (code, name) { return NC[code] || NM[String(name || '').replace(/\s+/g, ' ').trim()] || ''; };

function T(s) {
  if (s.indexOf('\n') >= 0) return s.split('\n').map(function (x) { return x ? T(x) : x; }).join('\n');
  if (D.hasOwnProperty(s)) return D[s];
  if (NM.hasOwnProperty(s)) return NM[s];
  for (var j = 0; j < P2.length; j++) { var q = P2[j][0].exec(s); if (q) return P2[j][1](q); }
  for (var i = 0; i < P.length; i++) { var m = P[i][0].exec(s); if (m) return P[i][1](m); }
  if (s.indexOf(' · ') > 0) {                          // ข้อความหลายส่วนคั่นด้วย ·
    var parts = s.split(' · '), changed = false;
    parts = parts.map(function (p) { var t = T(p); if (t !== p) changed = true; return t; });
    if (changed) return parts.join(' · ');
  }
  var pc = /^(.+?) \(([\d,]+)\)$/.exec(s);                // หัวข้อพร้อมจำนวนในวงเล็บ
  if (pc) { var tt = T(pc[1]); if (tt !== pc[1]) return tt + ' (' + pc[2] + ')'; }
  if (NL.length && /[\u0E00-\u0E7F]/.test(s)) {           // ชื่อสินค้าที่อยู่กลางข้อความ
    var o = s;
    for (var k = 0; k < NL.length; k++) if (o.indexOf(NL[k]) >= 0) o = o.split(NL[k]).join(NM[NL[k]]);
    if (o !== s) return o;
  }
  return s;
}
window.APP_T = T;
window.APP_SET_NAMES = function (rows) {           // ได้ชื่อชุดใหม่ → แปลหน้าจอซ้ำ (ข้อความที่แปลแล้วไม่กระทบ)
  setNames(rows);
  if (LANG === 'en' && document.body) walk(document.body);
};

var TH = /[฀-๿]/, SKIP = { SCRIPT: 1, STYLE: 1, TEXTAREA: 1, NOSCRIPT: 1 };
function doText(n) {
  var v = n.nodeValue; if (!v || !TH.test(v)) return;
  var p = n.parentNode; if (!p || SKIP[p.nodeName] || (p.closest && p.closest('[data-noi18n]'))) return;
  var k = v.replace(/\s+/g, ' ').trim(), t = T(k);
  if (t !== k) n.nodeValue = v.replace(k.length === v.length ? v : v.trim(), t);
}
function doEl(el) {
  if (el.nodeType !== 1 || SKIP[el.nodeName]) return;
  ['placeholder', 'title', 'aria-label'].forEach(function (a) {
    var v = el.getAttribute && el.getAttribute(a); if (v && TH.test(v)) { var t = T(v.trim()); if (t !== v.trim()) el.setAttribute(a, t); }
  });
  if (el.nodeName === 'INPUT' && /^(button|submit)$/i.test(el.type) && TH.test(el.value)) el.value = T(el.value.trim());
}
function walk(root) {
  if (root.nodeType === 3) return doText(root);
  if (root.nodeType !== 1 || SKIP[root.nodeName]) return;
  doEl(root);
  var w = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT, null), n;
  while ((n = w.nextNode())) { if (n.nodeType === 3) doText(n); else doEl(n); }
}

if (LANG === 'en') {
  document.documentElement.lang = 'en';
  var mo = new MutationObserver(function (ms) {
    ms.forEach(function (m) {
      if (m.type === 'characterData') doText(m.target);
      else if (m.type === 'attributes') doEl(m.target);
      else m.addedNodes.forEach(function (x) { walk(x); });
    });
  });
  mo.observe(document.documentElement, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['placeholder', 'title', 'aria-label', 'value'] });
  document.addEventListener('DOMContentLoaded', function () { walk(document.body); if (TH.test(document.title)) var sx = ' — ' + (window.BRAND ? BRAND.app : ''); var tt = document.title; if (tt.slice(-sx.length) === sx) tt = tt.slice(0, -sx.length); document.title = T(tt) + ' — ' + (window.BRAND ? BRAND.appEn : ''); });
  // ข้อความ alert / confirm
  var _a = window.alert, _c = window.confirm;
  window.alert = function (s) { return _a.call(window, T(String(s))); };
  window.confirm = function (s) { return _c.call(window, T(String(s))); };
}

// ปุ่มสลับภาษาในแถบบน
// ลิงก์พาไปหน้าเดิม (target=_top) ก่อนไปให้จำภาษาที่เลือก
document.addEventListener('click', function (e) {
  var b = e.target && e.target.closest && e.target.closest('#appLang');
  if (!b) return;
  try { localStorage.setItem((window.APP_NS + 'lang'), LANG === 'en' ? 'th' : 'en'); } catch (x) {}
});
document.addEventListener('DOMContentLoaded', function () {
  var b = document.getElementById('appLang'); if (b) b.textContent = LANG === 'en' ? 'ภาษาไทย' : 'English';
});
})();

/**
 * =================================================================================================
 * Database Connection Pool Configuration (src/db.js)
 * =================================================================================================
 * ไฟล์นี้ทำหน้าที่สร้างและส่งออก (Export) MySQL Connection Pool ด้วยไลบรารี mysql2/promise
 * เพื่อให้ทุก Route ในระบบสามารถรันคำสั่ง SQL Query แบบ Asynchronous (async/await) ได้อย่างรวดเร็วและปลอดภัย
 * 
 * การเชื่อมต่อไปยังตารางฐานข้อมูลหลัก (Core Database Tables):
 * 1. `dorm_users`                   - บัญชีผู้ใช้งาน (เจ้าของหอพัก, ผู้เช่า) และรหัสผ่านที่เข้ารหัสด้วย Bcrypt
 * 2. `dorm_rooms`                   - ผังห้องพัก ราคาเช่า ชั้น อาคาร และสถานะห้อง (available, occupied, booked)
 * 3. `dorm_monthly_bills`           - บิลค่าเช่ารายเดือน มิเตอร์น้ำ-ไฟ และยอดสุ่มเศษสตางค์ (unique_satang)
 * 4. `dorm_payments`                - ประวัติการชำระเงิน ลิงก์สลิป และสถานะการตรวจสอบ (verified, pending, rejected)
 * 5. `dorm_bookings`                - รายการจองห้องพักใหม่ วันที่นัดย้ายเข้า และสถานะอนุมัติ
 * 6. `dorm_repairs`                 - ข้อมูลการแจ้งซ่อมบำรุง สถานะงาน และรูปถ่ายจุดที่ชำรุด
 * 7. `dorm_move_outs`               - รายการแจ้งย้ายออกล่วงหน้า วันที่ตรวจห้อง และบันทึกคืนเงินประกัน
 * 8. `dorm_notifications`          - ข้อความประกาศ ข่าวสาร และการแจ้งเตือนส่วนบุคคลของลูกบ้าน
 * 9. `dorm_initial_fee_settings`   - อัตราค่าแรกเข้า ค่าประกันสัญญา และเงื่อนไขการเข้าพัก
 * 10. `dorm_move_in_payments`      - หลักฐานการโอนเงินค่าแรกเข้าและเงินมัดจำสัญญา
 * 11. `dorm_resident_verifications`- ข้อมูลและเอกสารยืนยันตัวตนของผู้เช่า (บัตร ปชช., ทะเบียนบ้าน)
 * 12. `dorm_settings`              - การตั้งค่าบิลและข้อความประกาศท้ายใบเสร็จ
 * =================================================================================================
 */

import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

// สร้าง Connection Pool เพื่อบริหารจัดการการเชื่อมต่อฐานข้อมูลพร้อมกันสูงสุด 10 Connections
const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT || "3306", 10),
  user: process.env.DB_USER || "std6730202041",
  password: process.env.DB_PASSWORD || "s8*RgL1Z",
  database: process.env.DB_NAME || "ip_std6730202041",
  waitForConnections: true,  // รอคิวการเชื่อมต่อเมื่อ Connections เต็ม
  connectionLimit: 10,       // จำนวน Connection พร้อมกันสูงสุด
  queueLimit: 0,            // ไม่จำกัดคิวการรอ
});

export default pool;

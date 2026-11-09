/**
 * =================================================================================================
 * Authentication & Authorization Middleware (src/middleware/auth.js)
 * =================================================================================================
 * โมดูลรักษาความปลอดภัยของระบบ ทำหน้าที่ตรวจสอบ Token และสิทธิ์การเข้าถึง API ทุกเส้นทาง
 * 
 * การเชื่อมต่อในระบบ (System Connections):
 * 1. รับ Request Header: Authorization: Bearer <JWT_TOKEN> ซึ่งสร้างโดย Frontend (localStorage.getItem("token"))
 * 2. ตรวจสอบกับฐานข้อมูล: ตาราง `dorm_users` เพื่อดึงข้อมูลบัญชีล่าสุด (id, full_name, role)
 * 3. ส่งต่อข้อมูลผู้ใช้: ผูกไว้ใน `req.user` ให้ Route Handler อื่นๆ (เช่น payments.js, bills.js) ใช้งานต่อ
 * 4. จำกัดบทบาท (Role Protection): กั้นสิทธิ์เฉพาะ "owner" (เจ้าของหอพัก) หรือ "tenant" (ผู้เช่า)
 * =================================================================================================
 */

import jwt from "jsonwebtoken";
import db from "../db.js";

const JWT_SECRET = process.env.JWT_SECRET || "dormease_super_secret_jwt_key_2026";

/**
 * requireAuth: Middleware ตรวจสอบความถูกต้องของ JWT Token
 * - ดึง Bearer Token จาก Header Authorization
 * - ถอดรหัส (Decode) และค้นหาข้อมูลผู้ใช้ในตาราง dorm_users
 * - หากไม่ผ่าน จะส่ง HTTP Status 401 (Unauthorized) กลับไปยัง Frontend
 */
export async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: "ไม่พบ token กรุณาเข้าสู่ระบบ" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // ค้นหาบัญชีผู้ใช้ในฐานข้อมูล dorm_users
    const [rows] = await db.query(
      "SELECT id, full_name, email, phone, role FROM dorm_users WHERE id = ?",
      [decoded.id]
    );

    if (!rows || rows.length === 0) {
      return res.status(403).json({ error: "ไม่พบข้อมูลโปรไฟล์ผู้ใช้ กรุณาสมัครสมาชิกใหม่" });
    }

    // ฝากข้อมูลผู้ใช้ไว้ใน Request Object เพื่อให้ Handler ถัดไปเข้าถึงได้
    req.user = rows[0];
    next();
  } catch (err) {
    return res.status(401).json({ error: "session ไม่ถูกต้องหรือหมดอายุ กรุณาเข้าสู่ระบบใหม่" });
  }
}

/**
 * requireRole: Middleware ตรวจสอบสิทธิ์ระดับบทบาท (Role-Based Access Control)
 * @param {string} role - เช่น 'owner' หรือ 'tenant'
 * - ป้องกันไม่ให้ผู้เช่าแอบเข้าถึง API ส่วนของเจ้าของหอพัก (เช่น แก้ไขบิล, ลบห้องพัก)
 */
export function requireRole(role) {
  return (req, res, next) => {
    if (req.user?.role !== role) {
      return res.status(403).json({ error: "คุณไม่มีสิทธิ์เข้าถึงส่วนนี้" });
    }
    next();
  };
}

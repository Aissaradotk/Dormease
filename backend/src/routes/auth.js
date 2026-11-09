/**
 * =================================================================================================
 * Authentication API Routes (src/routes/auth.js)
 * =================================================================================================
 * ไฟล์นี้ดูแลระบบรักษาความปลอดภัยและการยืนยันตัวตนทั้งหมดของระบบ ได้แก่:
 * 1. POST /api/auth/register : สมัครสมาชิกใหม่ (Bcrypt Hash รหัสผ่าน และเชื่อมประวัติผู้เช่าอัตโนมัติ)
 * 2. POST /api/auth/login    : เข้าสู่ระบบ ตรวจสอบ Password Hash และออก JWT Bearer Token
 * 3. GET  /api/auth/me       : ตรวจสอบสถานะเซสชันและดึงข้อมูลโปรไฟล์ผู้ใช้ปัจจุบัน
 * 
 * การเชื่อมต่อไปยังส่วนอื่นๆ ของระบบ (System Connections):
 * - Frontend: เรียกใช้จาก `pages/Login.jsx` และ `context/AuthContext.jsx` ผ่าน `api.post('/auth/login')`
 * - Database: ตาราง `dorm_users` (บันทึกบัญชี) และ `dorm_tenants` (อัปเดต user_id อัตโนมัติเมื่ออีเมลตรงกัน)
 * - Middleware: ใช้งาน `src/middleware/auth.js` ในการตรวจสอบ Token ก่อนคืนข้อมูลใน /me
 * =================================================================================================
 */

import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || "dormease_super_secret_jwt_key_2026";

/**
 * -------------------------------------------------------------------------------------------------
 * 1. POST /api/auth/register : สมัครสมาชิกใหม่
 * -------------------------------------------------------------------------------------------------
 * Input Body: { email, password, full_name, role, phone }
 * Logic:
 * - ตรวจสอบว่ามีอีเมลซ้ำใน dorm_users หรือไม่
 * - แฮชรหัสผ่านด้วย bcrypt.hash (salt rounds = 10)
 * - บันทึกลง dorm_users
 * - กรณีเป็น tenant: ตรวจสอบและเชื่อมต่อกับ dorm_tenants โดยอัตโนมัติหากเจ้าของหอพักลงทะเบียนไว้ล่วงหน้า
 * - ออก JWT Token มีอายุ 7 วัน
 */
router.post("/register", async (req, res) => {
  try {
    const { email, password, full_name, role, phone } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน (อีเมล, รหัสผ่าน, ชื่อ-นามสกุล)" });
    }

    const assignedRole = role === "owner" ? "owner" : "tenant";

    // 1. ตรวจสอบว่ามีอีเมลนี้อยู่แล้วในตาราง dorm_users หรือไม่
    const [existing] = await db.query("SELECT id FROM dorm_users WHERE email = ?", [email.trim().toLowerCase()]);
    if (existing.length > 0) {
      return res.status(400).json({ error: "อีเมลนี้มีอยู่ในระบบแล้ว กรุณาเข้าสู่ระบบ" });
    }

    // 2. แฮชรหัสผ่านเพื่อความปลอดภัยขั้นสูง
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. บันทึกข้อมูลบัญชีใหม่ลงฐานข้อมูล
    const [result] = await db.query(
      "INSERT INTO dorm_users (full_name, email, password, phone, role) VALUES (?, ?, ?, ?, ?)",
      [full_name.trim(), email.trim().toLowerCase(), hashedPassword, phone || null, assignedRole]
    );

    const userId = result.insertId;

    // 4. ถ้าเป็นบทบาทผู้เช่า: เชื่อมอัตโนมัติกับตาราง dorm_tenants ตามอีเมลที่เจ้าของหอพักเคยบันทึกไว้
    if (assignedRole === "tenant") {
      await db.query(
        "UPDATE dorm_tenants SET user_id = ? WHERE email = ? AND user_id IS NULL",
        [userId, email.trim().toLowerCase()]
      );
    }

    // 5. สร้าง JWT Token อายุ 7 วัน
    const token = jwt.sign(
      { id: userId, email: email.trim().toLowerCase(), role: assignedRole },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    const user = {
      id: userId,
      full_name: full_name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone || null,
      role: assignedRole,
    };

    res.status(201).json({ token, user });
  } catch (err) {
    console.error("Register Error:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการลงทะเบียน: " + err.message });
  }
});

/**
 * -------------------------------------------------------------------------------------------------
 * 2. POST /api/auth/login : เข้าสู่ระบบ
 * -------------------------------------------------------------------------------------------------
 * Input Body: { email, password }
 * Logic:
 * - ค้นหาบัญชีในตาราง dorm_users
 * - เปรียบเทียบรหัสผ่านด้วย bcrypt.compare
 * - ถ้าเป็น tenant และยังไม่ได้ผูก user_id ใน dorm_tenants ให้ผูกทันที
 * - ส่ง JWT Token และ Object user กลับไปให้ Frontend บันทึกใน LocalStorage
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "กรุณากรอกอีเมลและรหัสผ่าน" });
    }

    // ค้นหาบัญชีผู้ใช้จาก dorm_users
    const [rows] = await db.query(
      "SELECT id, full_name, email, password, phone, role FROM dorm_users WHERE email = ?",
      [email.trim().toLowerCase()]
    );

    if (rows.length === 0) {
      return res.status(400).json({ error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });
    }

    const userRecord = rows[0];

    // เปรียบเทียบรหัสผ่านกับค่า Hash ในฐานข้อมูล
    const isMatch = await bcrypt.compare(password, userRecord.password);
    if (!isMatch) {
      return res.status(400).json({ error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });
    }

    // หากเป็นผู้เช่า และยังไม่ได้เชื่อม user_id ให้พยายามเชื่อมอัตโนมัติ
    if (userRecord.role === "tenant") {
      await db.query(
        "UPDATE dorm_tenants SET user_id = ? WHERE email = ? AND user_id IS NULL",
        [userRecord.id, userRecord.email]
      );
    }

    // ออก JWT Token สำหรับใช้ส่งใน Header Authorization ของคำขอถัดไป
    const token = jwt.sign(
      { id: userRecord.id, email: userRecord.email, role: userRecord.role },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    const user = {
      id: userRecord.id,
      full_name: userRecord.full_name,
      email: userRecord.email,
      phone: userRecord.phone,
      role: userRecord.role,
    };

    res.json({ token, user });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการเข้าสู่ระบบ: " + err.message });
  }
});

/**
 * -------------------------------------------------------------------------------------------------
 * 3. GET /api/auth/me : ตรวจสอบผู้ใช้ปัจจุบัน
 * -------------------------------------------------------------------------------------------------
 * ต้องผ่าน Middleware requireAuth
 * ส่งคืนข้อมูลผู้ใช้ที่ถอดรหัสได้จาก Token ปัจจุบัน เพื่อให้ AuthContext เช็กสถานะการล็อกอิน
 */
router.get("/me", requireAuth, (req, res) => {
  res.json(req.user);
});

export default router;

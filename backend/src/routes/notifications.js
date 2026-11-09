/**
 * =================================================================================================
 * Announcements & Notifications API (src/routes/notifications.js)
 * =================================================================================================
 * จัดการกล่องข้อความแจ้งเตือนส่วนตัวของผู้เช่า และระบบกระจายข่าวสารประกาศของหอพัก
 * 
 * หน้าที่หลัก (Core Functions):
 * 1. GET  /api/notifications          : ดึงรายการแจ้งเตือนตามบทบาท (Data Isolation: ผู้เช่าเห็นเฉพาะของตนเองและประกาศกลาง)
 * 2. PUT  /api/notifications/:id/read : ทำเครื่องหมายข้อความว่าอ่านแล้ว (Mark as Read)
 * 3. POST /api/notifications/broadcast : เจ้าของหอพักส่งประกาศข่าวสารรวมไปยังลูกบ้านทุกคน
 * 
 * การเชื่อมต่อในระบบ (System Connections):
 * - Frontend Pages:
 *   • `pages/Notifications.jsx`       (หน้าจัดการข่าวสารและประกาศของเจ้าของหอพัก)
 *   • `pages/TenantNotifications.jsx` (หน้ากล่องข้อความและการแจ้งเตือนของลูกบ้าน)
 * - Database Tables:
 *   • `dorm_notifications` (ตารางหลักเก็บหัวข้อ ข้อความ หมวดหมู่ และสถานะการอ่าน)
 *   • `dorm_users`         (เชื่อมกับบัญชีผู้รับ)
 * =================================================================================================
 */

import { Router } from "express";
import db from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

/**
 * -------------------------------------------------------------------------------------------------
 * 1. GET /api/notifications : ดึงการแจ้งเตือนและข่าวสารของตนเอง
 * -------------------------------------------------------------------------------------------------
 * เชื่อมกับ: pages/Notifications.jsx และ pages/TenantNotifications.jsx
 * Data Isolation Logic:
 * - เจ้าของหอพัก: เห็นการแจ้งเตือนคำขอใหม่ทั้งหมด (แจ้งซ่อม, บิล, ย้ายออก)
 * - ลูกบ้าน: เห็นเฉพาะที่ระบุ user_id ของตนเอง หรือประกาศทั่วไป (category = 'general')
 */
router.get("/", requireAuth, async (req, res) => {
  try {
    let rows;
    if (req.user.role === "owner") {
      // แอดมิน/เจ้าของหอ: เห็นการแจ้งเตือนของระบบทั้งหมด และข่าวสารหอพัก
      [rows] = await db.query(
        `SELECT * FROM dorm_notifications 
         WHERE user_id = ? OR user_id IS NULL 
         ORDER BY created_at DESC 
         LIMIT 60`,
        [req.user.id]
      );
    } else {
      // ลูกบ้าน: เห็นเฉพาะการแจ้งเตือนของบัญชี/ห้องตัวเอง (user_id = req.user.id)
      // หรือประกาศเบื้องต้นทั่วไปของหอพักเท่านั้น (user_id IS NULL AND category = 'general')
      // จะไม่เห็นการแจ้งเตือนของห้องอื่น หรือการแจ้งเตือนสำหรับผู้ดูแลระบบ
      [rows] = await db.query(
        `SELECT * FROM dorm_notifications 
         WHERE user_id = ? OR (user_id IS NULL AND category = 'general')
         ORDER BY created_at DESC 
         LIMIT 50`,
        [req.user.id]
      );
    }
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ลูกบ้าน/ผู้ใช้: ทำเครื่องหมายว่าอ่านแล้ว
router.put("/:id/read", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (req.user.role === "owner") {
      await db.query(
        "UPDATE dorm_notifications SET is_read = TRUE WHERE id = ?",
        [id]
      );
    } else {
      await db.query(
        "UPDATE dorm_notifications SET is_read = TRUE WHERE id = ? AND (user_id = ? OR (user_id IS NULL AND category = 'general'))",
        [id, req.user.id]
      );
    }
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// เจ้าของหอพัก: สร้างประกาศข่าวสารหรือการแจ้งเตือน
router.post("/", requireAuth, requireRole("owner"), async (req, res) => {
  try {
    const { title, message, category, user_id } = req.body;
    if (!title || !message) {
      return res.status(400).json({ error: "กรุณาระบุหัวข้อและเนื้อหาข้อความแจ้งเตือน" });
    }

    const [result] = await db.query(
      "INSERT INTO dorm_notifications (title, message, category, user_id) VALUES (?, ?, ?, ?)",
      [title.trim(), message.trim(), category || "general", user_id || null]
    );

    const [created] = await db.query("SELECT * FROM dorm_notifications WHERE id = ?", [result.insertId]);
    res.status(201).json(created[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// เจ้าของหอพัก: ดูรายการประกาศทั้งหมด
router.get("/all", requireAuth, requireRole("owner"), async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT n.*, u.full_name AS target_user_name 
       FROM dorm_notifications n
       LEFT JOIN dorm_users u ON n.user_id = u.id
       ORDER BY n.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// เจ้าของหอพัก: ลบประกาศ
router.delete("/:id", requireAuth, requireRole("owner"), async (req, res) => {
  try {
    const { id } = req.params;
    await db.query("DELETE FROM dorm_notifications WHERE id = ?", [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;

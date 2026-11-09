/**
 * =================================================================================================
 * Maintenance & Repair Requests API Routes (src/routes/repairs.js)
 * =================================================================================================
 * ไฟล์นี้จัดการคำขอแจ้งซ่อมบำรุง ติดตามสถานะงานช่าง และส่งการแจ้งเตือนสองทางระหว่างผู้เช่าและแอดมิน
 * 
 * หน้าที่หลัก (Core Functions):
 * 1. POST /api/repairs     : ผู้เช่าส่งคำขอแจ้งซ่อม (ระบุหมวดหมู่ อาการ ห้อง) + ส่ง Notification ถึงเจ้าของหอพักทุกคน
 * 2. GET  /api/repairs/my  : ผู้เช่าติดตามสถานะงานแจ้งซ่อมของตนเอง (รอดำเนินการ, กำลังซ่อม, ซ่อมเสร็จสิ้น)
 * 3. GET  /api/repairs     : เจ้าของหอพักดูรายการแจ้งซ่อมทั้งหมดในหอพัก กรองตามสถานะ
 * 4. PUT  /api/repairs/:id : เจ้าของหอพักอัปเดตสถานะงานช่าง (เช่น in_progress, completed) + ส่ง Notification กลับหาผู้เช่า
 * 
 * การเชื่อมต่อในระบบ (System Connections):
 * - Frontend Pages:
 *   • `pages/TenantRepairs.jsx` (ผู้เช่ายื่นแจ้งซ่อมและดูประวัติ)
 *   • `pages/Repairs.jsx`       (เจ้าของหอพักรับเรื่องและปรับสถานะงาน)
 * - Database Tables:
 *   • `dorm_repairs`       (ตารางหลักเก็บรายการแจ้งซ่อม)
 *   • `dorm_rooms`         (เชื่อมเลขห้อง)
 *   • `dorm_users`         (ผู้แจ้งซ่อม และเจ้าของหอพัก)
 *   • `dorm_notifications` (สร้างแจ้งเตือนอัตโนมัติลงกล่องข้อความ)
 * =================================================================================================
 */

import { Router } from "express";
import db from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

/**
 * -------------------------------------------------------------------------------------------------
 * 1. POST /api/repairs : ลูกบ้านส่งแจ้งซ่อมบำรุง
 * -------------------------------------------------------------------------------------------------
 * เชื่อมกับ: pages/TenantRepairs.jsx
 * Input Body: { category, title, description, room_id }
 * Logic:
 * - ดึงห้องพักปัจจุบันของผู้เช่าจาก dorm_tenants อัตโนมัติหากไม่ได้ส่ง room_id มา
 * - บันทึกลง dorm_repairs ด้วยสถานะ 'pending'
 * - วนลูปสร้างแจ้งเตือนใน dorm_notifications ส่งไปยังบัญชีเจ้าของหอพัก (role = 'owner') ทุกคน
 */
router.post("/", requireAuth, async (req, res) => {
  try {
    const { category, title, description, room_id } = req.body;
    if (!title) return res.status(400).json({ error: "กรุณาระบุหัวข้อปัญหาที่ต้องการแจ้งซ่อม" });

    let finalRoomId = room_id;
    // ถ้าไม่ได้ระบุ room_id ให้ค้นหาจากห้องที่ลูกบ้านพักอยู่ปัจจุบัน
    if (!finalRoomId) {
      const [tenantRows] = await db.query(
        "SELECT room_id FROM dorm_tenants WHERE user_id = ? AND status = 'active' LIMIT 1",
        [req.user.id]
      );
      if (tenantRows.length > 0) {
        finalRoomId = tenantRows[0].room_id;
      }
    }

    const [result] = await db.query(
      "INSERT INTO dorm_repairs (user_id, room_id, category, title, description, status) VALUES (?, ?, ?, ?, ?, 'pending')",
      [req.user.id, finalRoomId || null, category || "อื่นๆ", title.trim(), description || null]
    );

    // แจ้งเตือนไปยังเจ้าของหอพัก/แอดมินทุกคน
    try {
      const [owners] = await db.query("SELECT id FROM dorm_users WHERE role = 'owner'");
      for (const o of owners) {
        await db.query(
          "INSERT INTO dorm_notifications (user_id, title, message, category) VALUES (?, ?, ?, 'repair')",
          [
            o.id,
            "มีการแจ้งซ่อมใหม่",
            `ผู้เช่า ${req.user.full_name} แจ้งซ่อม: ${title} (${category || "ทั่วไป"})`,
          ]
        );
      }
      // แจ้งเตือนยืนยันให้ลูกบ้านผู้แจ้งซ่อมทราบในห้องของตนเอง
      await db.query(
        "INSERT INTO dorm_notifications (user_id, title, message, category) VALUES (?, ?, ?, 'repair')",
        [
          req.user.id,
          "ส่งคำร้องแจ้งซ่อมเรียบร้อยแล้ว",
          `คำร้องแจ้งซ่อม "${title}" ของคุณถูกบันทึกในระบบแล้ว อยู่ระหว่างรอเจ้าหน้าที่ดำเนินการ`,
        ]
      );
    } catch (notifErr) {
      console.error("Failed to send repair notification:", notifErr);
    }

    const [created] = await db.query("SELECT * FROM dorm_repairs WHERE id = ?", [result.insertId]);
    res.status(201).json(created[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ลูกบ้าน: ดูประวัติการแจ้งซ่อมของตนเอง
router.get("/my", requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT r.*, 
              rm.room_number
       FROM dorm_repairs r
       LEFT JOIN dorm_rooms rm ON r.room_id = rm.id
       WHERE r.user_id = ?
       ORDER BY r.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// เจ้าของหอพัก: ดูกล่องรับเรื่องแจ้งซ่อมทั้งหมด
router.get("/", requireAuth, requireRole("owner"), async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT r.*, 
              rm.room_number,
              u.full_name AS user_name, u.phone AS user_phone, u.email AS user_email
       FROM dorm_repairs r
       LEFT JOIN dorm_rooms rm ON r.room_id = rm.id
       JOIN dorm_users u ON r.user_id = u.id
       ORDER BY 
         CASE r.status 
           WHEN 'pending' THEN 1 
           WHEN 'in_progress' THEN 2 
           WHEN 'completed' THEN 3 
           ELSE 4 
         END,
         r.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// เจ้าของหอพัก: อัปเดตสถานะการซ่อม (เช่น 'กำลังดำเนินการ', 'แก้ไขแล้ว')
router.put("/:id", requireAuth, requireRole("owner"), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_note } = req.body;

    const [rows] = await db.query("SELECT * FROM dorm_repairs WHERE id = ?", [id]);
    if (rows.length === 0) return res.status(404).json({ error: "ไม่พบรายการแจ้งซ่อมนี้" });
    const repair = rows[0];

    await db.query(
      "UPDATE dorm_repairs SET status = COALESCE(?, status), admin_note = COALESCE(?, admin_note) WHERE id = ?",
      [status || null, admin_note !== undefined ? admin_note : repair.admin_note, id]
    );

    // ส่งแจ้งเตือนหาลูกบ้านเมื่อสถานะเปลี่ยน
    if (status && status !== repair.status) {
      const statusText =
        status === "completed"
          ? "แก้ไขเรียบร้อยแล้ว"
          : status === "in_progress"
          ? "ช่างกำลังเข้าดำเนินการซ่อม"
          : status;

      await db.query(
        "INSERT INTO dorm_notifications (user_id, title, message, category) VALUES (?, ?, ?, 'repair')",
        [
          repair.user_id,
          `อัปเดตงานแจ้งซ่อม: ${repair.title}`,
          `สถานะงานแจ้งซ่อมของคุณเปลี่ยนเป็น: ${statusText} ${admin_note ? `(หมายเหตุ: ${admin_note})` : ""}`,
        ]
      );
    }

    const [updated] = await db.query("SELECT * FROM dorm_repairs WHERE id = ?", [id]);
    res.json(updated[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// เจ้าของหอพัก: ลบรายการแจ้งซ่อม
router.delete("/:id", requireAuth, requireRole("owner"), async (req, res) => {
  try {
    const { id } = req.params;
    await db.query("DELETE FROM dorm_repairs WHERE id = ?", [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;

/**
 * =================================================================================================
 * Tenants Management API Routes (src/routes/tenants.js)
 * =================================================================================================
 * ไฟล์นี้จัดการข้อมูลทะเบียนผู้เช่า สัญญาเช่าห้อง และการเชื่อมต่อบัญชีผู้ใช้
 * 
 * หน้าที่หลัก (Core Functions):
 * 1. GET  /api/tenants/me     : ผู้เช่าดึงข้อมูลห้องพักและสัญญาปัจจุบันของตนเอง (Tenant Profile)
 * 2. GET  /api/tenants        : เจ้าของหอพักดูทะเบียนผู้เช่าทั้งหมด พร้อมเลขห้องและเบอร์โทร
 * 3. POST /api/tenants        : เจ้าของหอพักเพิ่มผู้เช่าใหม่ ระบุห้อง วันเริ่มสัญญา และเงินมัดจำ
 * 4. PUT  /api/tenants/:id    : แก้ไขข้อมูลผู้เช่า หรือเปลี่ยนห้องพัก
 * 5. DELETE /api/tenants/:id  : ลบผู้เช่า หรือปรับสถานะเป็นย้ายออก
 * 
 * การเชื่อมต่อในระบบ (System Connections):
 * - Frontend Pages:
 *   • `pages/Tenants.jsx`    (หน้าทะเบียนผู้เช่าของเจ้าของหอพัก)
 *   • `pages/TenantHome.jsx` (หน้าแดชบอร์ดหลักของลูกบ้าน แสดงรายละเอียดห้องพัก)
 * - Database Tables:
 *   • `dorm_tenants` (ตารางหลักเก็บประวัติสัญญาและข้อมูลการเช่า)
 *   • `dorm_rooms`   (เชื่อมกับห้องพัก room_id)
 *   • `dorm_users`   (เชื่อมกับบัญชีล็อกอิน user_id)
 * =================================================================================================
 */

import { Router } from "express";
import db from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

/**
 * -------------------------------------------------------------------------------------------------
 * 1. GET /api/tenants/me : ผู้เช่าดูข้อมูลห้องพักและสัญญาเช่าของตนเอง
 * -------------------------------------------------------------------------------------------------
 * เชื่อมกับ: pages/TenantHome.jsx
 * ค้นหาข้อมูลผู้เช่าที่ผูกกับ req.user.id หากย้ายออกแล้วจะไม่คืนค่าห้องพักที่ถูกปลดล็อก
 */
router.get("/me", requireAuth, requireRole("tenant"), async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT t.*, 
              r.room_number, r.room_type, r.price, r.floor, r.size
       FROM dorm_tenants t
       LEFT JOIN dorm_rooms r ON t.room_id = r.id
       WHERE t.user_id = ?
       ORDER BY CASE WHEN t.status = 'active' THEN 0 ELSE 1 END, t.id DESC
       LIMIT 1`,
      [req.user.id]
    );

    if (rows.length === 0) return res.json(null);

    const row = rows[0];
    const isMovedOut = row.status === "moved_out";

    const data = {
      id: row.id,
      user_id: row.user_id,
      full_name: row.full_name,
      phone: row.phone,
      email: row.email,
      room_id: isMovedOut ? null : row.room_id,
      start_date: row.start_date ? row.start_date.toISOString().split("T")[0] : null,
      end_date: row.end_date ? row.end_date.toISOString().split("T")[0] : null,
      status: row.status,
      created_at: row.created_at,
      rooms: (row.room_id && !isMovedOut)
        ? {
            room_number: row.room_number,
            room_type: row.room_type,
            price: row.price,
            floor: row.floor,
            size: row.size,
          }
        : null,
    };

    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.use(requireAuth, requireRole("owner"));

// เจ้าของหอพักดูรายชื่อผู้เช่าทั้งหมด
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT t.*, r.room_number, r.room_type
       FROM dorm_tenants t
       LEFT JOIN dorm_rooms r ON t.room_id = r.id
       ORDER BY t.created_at DESC`
    );

    const formatted = rows.map((row) => ({
      id: row.id,
      user_id: row.user_id,
      full_name: row.full_name,
      phone: row.phone,
      email: row.email,
      room_id: row.room_id,
      start_date: row.start_date ? (row.start_date instanceof Date ? row.start_date.toISOString().split("T")[0] : row.start_date) : null,
      end_date: row.end_date ? (row.end_date instanceof Date ? row.end_date.toISOString().split("T")[0] : row.end_date) : null,
      status: row.status,
      created_at: row.created_at,
      rooms: row.room_id
        ? {
            room_number: row.room_number,
            room_type: row.room_type,
          }
        : null,
    }));

    res.json(formatted);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// เพิ่มผู้เช่า
router.post("/", async (req, res) => {
  try {
    const { full_name, phone, email, room_id, start_date } = req.body;
    if (!full_name) return res.status(400).json({ error: "กรุณากรอกชื่อผู้เช่า" });

    // ตรวจสอบว่ามีผู้ใช้อีเมลนี้สมัครสมาชิกรออยู่แล้วหรือไม่ เพื่อเชื่อม user_id ทันที
    let linkedUserId = null;
    if (email) {
      const [userMatch] = await db.query("SELECT id FROM dorm_users WHERE email = ?", [email.trim().toLowerCase()]);
      if (userMatch.length > 0) {
        linkedUserId = userMatch[0].id;
      }
    }

    const [result] = await db.query(
      "INSERT INTO dorm_tenants (full_name, phone, email, room_id, start_date, user_id) VALUES (?, ?, ?, ?, ?, ?)",
      [
        full_name.trim(),
        phone || null,
        email ? email.trim().toLowerCase() : null,
        room_id || null,
        start_date || null,
        linkedUserId,
      ]
    );

    if (room_id) {
      await db.query("UPDATE dorm_rooms SET status = 'occupied' WHERE id = ?", [room_id]);
    }

    const [created] = await db.query("SELECT * FROM dorm_tenants WHERE id = ?", [result.insertId]);
    res.status(201).json(created[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// แก้ไขข้อมูลผู้เช่า
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { full_name, phone, email, room_id, start_date, end_date, status } = req.body;

    const [existingRows] = await db.query("SELECT room_id, email, user_id FROM dorm_tenants WHERE id = ?", [id]);
    if (existingRows.length === 0) return res.status(404).json({ error: "ไม่พบผู้เช่านี้" });
    const existing = existingRows[0];

    // ตรวจสอบการเชื่อม user_id ถ้ามีการเปลี่ยนหรือเพิ่มอีเมล
    let updatedUserId = existing.user_id;
    if (email && email.trim().toLowerCase() !== (existing.email || "").toLowerCase()) {
      const [userMatch] = await db.query("SELECT id FROM dorm_users WHERE email = ?", [email.trim().toLowerCase()]);
      updatedUserId = userMatch.length > 0 ? userMatch[0].id : null;
    }

    await db.query(
      `UPDATE dorm_tenants 
       SET full_name = COALESCE(?, full_name),
           phone = ?,
           email = ?,
           room_id = ?,
           start_date = ?,
           end_date = ?,
           status = COALESCE(?, status),
           user_id = ?
       WHERE id = ?`,
      [
        full_name || null,
        phone || null,
        email ? email.trim().toLowerCase() : null,
        room_id || null,
        start_date || null,
        end_date || null,
        status || null,
        updatedUserId,
        id,
      ]
    );

    // ปลดสถานะห้องเก่าถ้าเปลี่ยนห้อง หรือเมื่อย้ายออก
    if (existing.room_id && (existing.room_id !== (room_id || null) || status === "moved_out")) {
      await db.query("UPDATE dorm_rooms SET status = 'available' WHERE id = ?", [existing.room_id]);
    }

    // อัปเดตสถานะห้องใหม่
    if (room_id) {
      const newRoomStatus = status === "moved_out" ? "available" : "occupied";
      await db.query("UPDATE dorm_rooms SET status = ? WHERE id = ?", [newRoomStatus, room_id]);
    }

    // หากปรับเป็นย้ายออก: ล้างการจองและการชำระค่าแรกเข้าที่ค้างอยู่ทั้งหมด และอนุมัติคำร้องแจ้งย้ายออก
    if (status === "moved_out") {
      const targetUserId = updatedUserId || existing.user_id;
      const targetRoomId = room_id || existing.room_id;
      if (targetUserId) {
        await db.query(
          "UPDATE dorm_move_outs SET status = 'approved', admin_note = 'อนุมัติการย้ายออกผ่านระบบจัดการผู้เช่า' WHERE user_id = ? AND status = 'pending'",
          [targetUserId]
        );
        await db.query(
          "UPDATE dorm_bookings SET status = 'completed', admin_note = 'ย้ายออกเรียบร้อยแล้ว (Moved out)' WHERE user_id = ? AND status IN ('pending', 'approved', 'confirmed')",
          [targetUserId]
        );
        await db.query(
          "UPDATE move_in_payments SET payment_status = 'rejected', rejection_reason = 'ยกเลิกเนื่องจากผู้เช่าย้ายออกแล้ว (Moved out)' WHERE user_id = ? AND payment_status IN ('pending', 'submitted')",
          [targetUserId]
        );
      }
      if (targetRoomId) {
        await db.query(
          "UPDATE dorm_move_outs SET status = 'approved', admin_note = 'อนุมัติการย้ายออกผ่านระบบจัดการผู้เช่า' WHERE room_id = ? AND status = 'pending'",
          [targetRoomId]
        );
        await db.query(
          "UPDATE dorm_bookings SET status = 'completed', admin_note = 'ย้ายออกเรียบร้อยแล้ว (Moved out)' WHERE room_id = ? AND status IN ('pending', 'approved', 'confirmed')",
          [targetRoomId]
        );
        await db.query(
          "UPDATE move_in_payments SET payment_status = 'rejected', rejection_reason = 'ยกเลิกเนื่องจากผู้เช่าย้ายออกแล้ว (Moved out)' WHERE room_id = ? AND payment_status IN ('pending', 'submitted')",
          [targetRoomId]
        );
      }
    }

    const [updated] = await db.query("SELECT * FROM dorm_tenants WHERE id = ?", [id]);
    res.json(updated[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ลบผู้เช่า
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const [existingRows] = await db.query("SELECT room_id, user_id FROM dorm_tenants WHERE id = ?", [id]);
    const existing = existingRows[0];

    // ลบการชำระเงินของผู้เช่ารายนี้ด้วย
    await db.query("DELETE FROM dorm_payments WHERE tenant_id = ?", [id]);
    await db.query("DELETE FROM dorm_tenants WHERE id = ?", [id]);

    if (existing?.room_id) {
      await db.query("UPDATE dorm_rooms SET status = 'available' WHERE id = ?", [existing.room_id]);
    }
    if (existing?.user_id) {
      await db.query("UPDATE dorm_move_outs SET status = 'approved', admin_note = 'อนุมัติการย้ายออก (ลบผู้เช่า)' WHERE user_id = ? AND status = 'pending'", [existing.user_id]);
      await db.query("UPDATE dorm_bookings SET status = 'completed', admin_note = 'ลบผู้เช่าเรียบร้อยแล้ว' WHERE user_id = ? AND status IN ('pending', 'approved', 'confirmed')", [existing.user_id]);
      await db.query("UPDATE move_in_payments SET payment_status = 'rejected', rejection_reason = 'ยกเลิกเนื่องจากลบผู้เช่า' WHERE user_id = ? AND payment_status IN ('pending', 'submitted')", [existing.user_id]);
    }

    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;

/**
 * =================================================================================================
 * Room Bookings & Reservation API Routes (src/routes/bookings.js)
 * =================================================================================================
 * ไฟล์นี้จัดการกระบวนการจองห้องพักออนไลน์ ตรวจสอบห้องว่าง นโยบายวันย้ายเข้าล่วงหน้า และการอนุมัติของแอดมิน
 * 
 * หน้าที่หลัก (Core Functions):
 * 1. GET  /api/bookings/available-rooms : ดึงเฉพาะห้องที่สถานะว่าง ('available') ให้ผู้เช่าเลือกจอง
 * 2. POST /api/bookings                : ผู้เช่ายื่นจองห้องพัก ระบุวันที่ย้ายเข้า (ตรวจเงื่อนไขล่วงหน้าตาม dorm_settings)
 * 3. GET  /api/bookings/my             : ผู้เช่าดูประวัติและสถานะการจองของตนเอง
 * 4. GET  /api/bookings                : เจ้าของหอพักดูรายการคำขอจองห้องพักทั้งหมด
 * 5. PUT  /api/bookings/:id/status     : เจ้าของหอพักอนุมัติ (approved) หรือปฏิเสธ (rejected) คำขอจอง
 * 
 * การเชื่อมต่อในระบบ (System Connections):
 * - Frontend Pages:
 *   • `pages/BookRoom.jsx` (หน้าค้นหาห้องว่างและฟอร์มยื่นจองสำหรับผู้เช่า)
 *   • `pages/Bookings.jsx` (หน้าจัดการและอนุมัติการจองของเจ้าของหอพัก)
 * - Database Tables:
 *   • `dorm_bookings` (ตารางหลักเก็บคำขอจอง)
 *   • `dorm_rooms`    (อัปเดตสถานะห้องเป็น 'reserved' เมื่ออนุมัติ)
 *   • `dorm_settings` (อ่านเงื่อนไขวันย้ายเข้าล่วงหน้า move_in_notice_days)
 *   • `dorm_notifications` (แจ้งเตือนลูกบ้านเมื่อแอดมินอนุมัติหรือปฏิเสธ)
 * =================================================================================================
 */

import { Router } from "express";
import db from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

/**
 * -------------------------------------------------------------------------------------------------
 * 1. GET /api/bookings/available-rooms : ดึงรายชื่อห้องว่างที่สามารถจองได้
 * -------------------------------------------------------------------------------------------------
 * เชื่อมกับ: pages/BookRoom.jsx (แสดงการ์ดห้องว่างให้เลือกจอง)
 */
router.get("/available-rooms", requireAuth, async (req, res) => {
  try {
    const [rooms] = await db.query(
      "SELECT * FROM dorm_rooms WHERE status = 'available' ORDER BY room_number ASC"
    );
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * -------------------------------------------------------------------------------------------------
 * 2. POST /api/bookings : ผู้เช่ายื่นจองห้องพัก
 * -------------------------------------------------------------------------------------------------
 * Input Body: { room_id, check_in_date, contact_phone, note }
 * ตรวจสอบ:
 * - ห้องพักยังคงสถานะ 'available' อยู่จริง (ป้องกันการจองชนกัน)
 * - วันที่ย้ายเข้าต้องไม่น้อยกว่าวันที่กำหนดไว้ใน dorm_settings.move_in_notice_days
 */
router.post("/", requireAuth, async (req, res) => {
  try {
    const { room_id, check_in_date, contact_phone, note } = req.body;
    if (!room_id || !check_in_date) {
      return res.status(400).json({ error: "กรุณาเลือกห้องพักและวันที่ต้องการเข้าอยู่" });
    }

    // ตรวจสอบว่าห้องยังว่างอยู่หรือไม่
    const [roomRows] = await db.query("SELECT * FROM dorm_rooms WHERE id = ?", [room_id]);
    if (roomRows.length === 0) return res.status(404).json({ error: "ไม่พบห้องพักนี้" });
    if (roomRows[0].status !== "available") {
      return res.status(400).json({ error: "ห้องพักนี้ไม่ว่างแล้ว กรุณาเลือกห้องอื่น" });
    }

    // ตรวจสอบเงื่อนไขแจ้งเข้าพักล่วงหน้า (Move-in Notice Setting)
    try {
      const [settingsRows] = await db.query("SELECT move_in_notice_days FROM dorm_settings WHERE id = 1 LIMIT 1");
      const moveInDays = settingsRows[0]?.move_in_notice_days ?? 1;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const minCheckIn = new Date(today);
      minCheckIn.setDate(minCheckIn.getDate() + Number(moveInDays));

      const inputDate = new Date(check_in_date);
      inputDate.setHours(0, 0, 0, 0);

      if (inputDate < minCheckIn) {
        const minStr = minCheckIn.toISOString().split("T")[0];
        return res.status(400).json({
          error: `หอพักกำหนดให้แจ้งเข้าพักล่วงหน้าอย่างน้อย ${moveInDays} วัน (สามารถเลือกได้ตั้งแต่วันที่ ${minStr} เป็นต้นไป)`
        });
      }
    } catch (settingErr) {
      console.warn("Could not check move_in_notice_days:", settingErr);
    }

    const [result] = await db.query(
      "INSERT INTO dorm_bookings (user_id, room_id, check_in_date, contact_phone, note, status) VALUES (?, ?, ?, ?, ?, 'pending')",
      [req.user.id, room_id, check_in_date, contact_phone || req.user.phone || null, note || null]
    );

    // แจ้งเตือนไปยังเจ้าของหอพัก/แอดมินทุกคน
    try {
      const [owners] = await db.query("SELECT id FROM dorm_users WHERE role = 'owner'");
      for (const o of owners) {
        await db.query(
          "INSERT INTO dorm_notifications (user_id, title, message, category) VALUES (?, ?, ?, 'booking')",
          [
            o.id,
            "มีการจองห้องพักใหม่",
            `ผู้ใช้ ${req.user.full_name} ได้ทำการจองห้อง ${roomRows[0].room_number} วันที่เข้าพัก ${check_in_date}`,
          ]
        );
      }
      // แจ้งเตือนยืนยันให้ผู้จองทราบ
      await db.query(
        "INSERT INTO dorm_notifications (user_id, title, message, category) VALUES (?, ?, ?, 'booking')",
        [
          req.user.id,
          "ทำการจองห้องพักสำเร็จ",
          `คุณได้ส่งคำขอจองห้อง ${roomRows[0].room_number} เรียบร้อยแล้ว อยู่ระหว่างรอเจ้าของหอพักตรวจสอบและอนุมัติ`,
        ]
      );
    } catch (notifErr) {
      console.error("Failed to send booking notification:", notifErr);
    }

    const [created] = await db.query("SELECT * FROM dorm_bookings WHERE id = ?", [result.insertId]);
    res.status(201).json(created[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ลูกบ้าน: ดูประวัติการจองของตนเอง
router.get("/my", requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT b.*, 
              r.room_number, r.room_type, r.price, r.floor, r.size
       FROM dorm_bookings b
       JOIN dorm_rooms r ON b.room_id = r.id
       WHERE b.user_id = ?
       ORDER BY b.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ลูกบ้าน: ขอยกเลิกการจอง
router.put("/:id/cancel", requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await db.query("SELECT * FROM dorm_bookings WHERE id = ? AND user_id = ?", [id, req.user.id]);
    if (rows.length === 0) return res.status(404).json({ error: "ไม่พบข้อมูลการจองนี้" });
    if (rows[0].status !== "pending") {
      return res.status(400).json({ error: "สามารถยกเลิกได้เฉพาะรายการที่อยู่ในสถานะรอดำเนินการเท่านั้น" });
    }

    await db.query("UPDATE dorm_bookings SET status = 'cancelled' WHERE id = ?", [id]);
    res.json({ success: true, message: "ยกเลิกการจองเรียบร้อยแล้ว" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// เจ้าของหอพัก: ดูรายการจองทั้งหมด
router.get("/", requireAuth, requireRole("owner"), async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT b.*, 
              r.room_number, r.room_type, r.price,
              u.full_name AS user_name, u.email AS user_email, u.phone AS user_phone
       FROM dorm_bookings b
       JOIN dorm_rooms r ON b.room_id = r.id
       JOIN dorm_users u ON b.user_id = u.id
       ORDER BY b.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// เจ้าของหอพัก: อนุมัติ / ปฏิเสธการจอง
router.put("/:id/status", requireAuth, requireRole("owner"), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_note } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ error: "สถานะไม่ถูกต้อง ('approved' หรือ 'rejected')" });
    }

    const [rows] = await db.query("SELECT * FROM dorm_bookings WHERE id = ?", [id]);
    if (rows.length === 0) return res.status(404).json({ error: "ไม่พบรายการจองนี้" });
    const booking = rows[0];

    await db.query(
      "UPDATE dorm_bookings SET status = ?, admin_note = ? WHERE id = ?",
      [status, admin_note || null, id]
    );

    // ถ้าอนุมัติ: อัปเดตสถานะห้องเป็น occupied และเชื่อมข้อมูลผู้เช่า
    if (status === "approved") {
      await db.query("UPDATE dorm_rooms SET status = 'occupied' WHERE id = ?", [booking.room_id]);

      // ตรวจสอบว่ามีแถวใน dorm_tenants หรือยัง ถ้ายังไม่มีให้สร้างขึ้นอัตโนมัติ
      const [existingTenant] = await db.query(
        "SELECT id FROM dorm_tenants WHERE user_id = ? LIMIT 1",
        [booking.user_id]
      );

      const [userRows] = await db.query("SELECT * FROM dorm_users WHERE id = ?", [booking.user_id]);
      const user = userRows[0];

      if (existingTenant.length === 0) {
        await db.query(
          "INSERT INTO dorm_tenants (user_id, full_name, phone, email, room_id, start_date, status) VALUES (?, ?, ?, ?, ?, ?, 'active')",
          [user.id, user.full_name, booking.contact_phone || user.phone, user.email, booking.room_id, booking.check_in_date]
        );
      } else {
        await db.query(
          "UPDATE dorm_tenants SET room_id = ?, start_date = ?, status = 'active' WHERE id = ?",
          [booking.room_id, booking.check_in_date, existingTenant[0].id]
        );
      }

      // ส่งแจ้งเตือนให้ลูกบ้าน
      await db.query(
        "INSERT INTO dorm_notifications (user_id, title, message, category) VALUES (?, ?, ?, 'booking')",
        [
          booking.user_id,
          "การจองห้องพักได้รับการอนุมัติแล้ว!",
          `การจองห้องพักของคุณได้รับการอนุมัติเรียบร้อยแล้ว ยินดีต้อนรับสู่หอพัก!`,
        ]
      );
    } else if (status === "rejected") {
      await db.query(
        "INSERT INTO dorm_notifications (user_id, title, message, category) VALUES (?, ?, ?, 'booking')",
        [
          booking.user_id,
          "การจองห้องพักไม่ได้รับการอนุมัติ",
          `เหตุผล: ${admin_note || "ไม่ระบุ"}`,
        ]
      );
    }

    const [updated] = await db.query("SELECT * FROM dorm_bookings WHERE id = ?", [id]);
    res.json(updated[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;

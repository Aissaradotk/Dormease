/**
 * =================================================================================================
 * Move-In & Security Deposit Payments API (src/routes/moveInPayments.js)
 * =================================================================================================
 * จัดการกระบวนการชำระเงินค่าแรกเข้า เงินประกันสัญญา และการตรวจสอบสลิปก่อนส่งมอบกุญแจเข้าพัก
 * 
 * หน้าที่หลัก (Core Functions):
 * 1. POST /api/move-in-payments            : ผู้เช่าส่งหลักฐานสลิปโอนเงินค่าแรกเข้า/เงินประกัน
 * 2. GET  /api/move-in-payments/my         : ผู้เช่าตรวจสอบสถานะการชำระเงินค่าแรกเข้าของตนเอง
 * 3. GET  /api/admin/move-in-payments      : เจ้าของหอพักดูรายการชำระค่าแรกเข้าทั้งหมด
 * 4. PUT  /api/admin/move-in-payments/:id/verify : แอดมินอนุมัติสลิป ปรับสถานะเป็น 'approved'
 * 
 * การเชื่อมต่อในระบบ (System Connections):
 * - Frontend Pages:
 *   • `pages/MoveInPayment.jsx`       (หน้าจอชำระค่าแรกเข้า/สแกน QR สำหรับผู้เช่า)
 *   • `pages/AdminMoveInPayments.jsx` (หน้าจอตรวจสอบสลิปค่าแรกเข้าสำหรับแอดมิน)
 * - Database Tables:
 *   • `dorm_move_in_payments` (ตารางบันทึกการชำระเงินประกันและค่าแรกเข้า)
 *   • `dorm_bookings`         (ตรวจสอบสถานะการจองที่เกี่ยวข้อง)
 *   • `dorm_rooms`            (ดึงเรตราคาและข้อมูลห้อง)
 * =================================================================================================
 */

import { Router } from "express";
import db from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

/**
 * -------------------------------------------------------------------------------------------------
 * 1. POST /api/move-in-payments : ผู้เช่าส่งสลิปชำระเงินค่าแรกเข้าและเงินประกัน
 * -------------------------------------------------------------------------------------------------
 * Input Body: { booking_id, room_id, total_amount, paid_amount, payment_method, payment_slip, notes }
 * เชื่อมกับ: pages/MoveInPayment.jsx
 */
router.post("/", requireAuth, async (req, res) => {
  try {
    const { booking_id, room_id, total_amount, paid_amount, payment_method, payment_slip, notes } = req.body;
    if (paid_amount === undefined || !payment_slip) {
      return res.status(400).json({ error: "กรุณาระบุข้อมูลการชำระเงินและแนบสลิป" });
    }

    if (!booking_id && !room_id) {
      return res.status(400).json({ error: "กรุณาระบุรหัสการจองห้องพัก" });
    }

    let targetBooking = null;

    if (booking_id) {
      const [bookings] = await db.query(
        "SELECT * FROM dorm_bookings WHERE id = ? AND user_id = ? AND status IN ('pending', 'approved', 'confirmed')",
        [booking_id, req.user.id]
      );
      if (bookings.length > 0) {
        targetBooking = bookings[0];
      }
    } else if (room_id) {
      // ตรวจสอบว่ามี booking ที่กำลังเปิดใช้งานอยู่ของผู้ใช้หรือไม่
      const [existing] = await db.query(
        "SELECT * FROM dorm_bookings WHERE user_id = ? AND room_id = ? AND status IN ('pending', 'approved', 'confirmed') ORDER BY id DESC LIMIT 1",
        [req.user.id, room_id]
      );
      if (existing.length > 0) {
        targetBooking = existing[0];
      }
    }

    if (!targetBooking) {
      return res.status(400).json({
        error: "ไม่พบข้อมูลการจองห้องพักที่ถูกต้อง หรือการจองถูกยกเลิกแล้ว กรุณาทำการจองห้องพักก่อนชำระค่าแรกเข้า/ค่าประกัน"
      });
    }

    const finalBookingId = targetBooking.id;
    const finalRoomId = targetBooking.room_id;

    const [result] = await db.query(
      `INSERT INTO move_in_payments 
        (booking_id, user_id, room_id, total_amount, paid_amount, payment_method, payment_slip, payment_status, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'submitted', ?)`,
      [
        finalBookingId || null,
        req.user.id,
        finalRoomId || null,
        total_amount || paid_amount,
        paid_amount,
        payment_method || "promptpay",
        payment_slip,
        notes || null,
      ]
    );

    const [created] = await db.query("SELECT * FROM move_in_payments WHERE id = ?", [result.insertId]);

    // แจ้งเตือนไปยังเจ้าของหอพัก/แอดมินทุกคน
    try {
      const [owners] = await db.query("SELECT id FROM dorm_users WHERE role = 'owner'");
      for (const o of owners) {
        await db.query(
          "INSERT INTO dorm_notifications (user_id, title, message, category) VALUES (?, ?, ?, 'payment')",
          [
            o.id,
            "มีการชำระค่าแรกเข้า/ค่าประกันใหม่",
            `ผู้ใช้ ${req.user.full_name || req.user.email} ได้ส่งหลักฐานการชำระเงินค่าแรกเข้า/ค่าประกัน ยอด ${Number(paid_amount).toLocaleString()} บาท`,
          ]
        );
      }
    } catch (notifErr) {
      console.warn("Owner notification failed:", notifErr);
    }

    res.status(201).json(created[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper function to query admin payments
async function getAdminPayments(req, res) {
  try {
    const [rows] = await db.query(
      `SELECT 
         p.*, 
         COALESCE(u.full_name, 'ผู้เช่า') AS full_name, 
         u.email, 
         u.phone, 
         COALESCE(r.room_number, b_r.room_number, CONCAT('ห้อง ', p.room_id)) AS room_number, 
         COALESCE(r.room_type, b_r.room_type, '-') AS room_type, 
         COALESCE(r.size, b_r.size, '-') AS room_size,
         b.check_in_date
       FROM move_in_payments p
       LEFT JOIN dorm_users u ON p.user_id = u.id
       LEFT JOIN dorm_bookings b ON p.booking_id = b.id
       LEFT JOIN dorm_rooms r ON p.room_id = r.id
       LEFT JOIN dorm_rooms b_r ON b.room_id = b_r.id
       ORDER BY p.id DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// GET payments router root (if owner -> all payments; if tenant -> my payments)
router.get("/", requireAuth, async (req, res) => {
  if (req.user.role === "owner") {
    return getAdminPayments(req, res);
  }
  try {
    const [rows] = await db.query(
      `SELECT p.*, b.check_in_date, r.room_number, r.room_type, r.price, r.size
       FROM move_in_payments p
       LEFT JOIN dorm_bookings b ON p.booking_id = b.id
       LEFT JOIN dorm_rooms r ON p.room_id = r.id
       WHERE p.user_id = ?
       ORDER BY p.id DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET tenant's move-in / security deposit payments
router.get("/my", requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT p.*, b.check_in_date, b.status AS booking_status, r.room_number, r.room_type, r.price, r.size
       FROM move_in_payments p
       LEFT JOIN dorm_bookings b ON p.booking_id = b.id
       LEFT JOIN dorm_rooms r ON p.room_id = r.id
       WHERE p.user_id = ?
       ORDER BY p.id DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET all payments for admin explicitly
router.get("/admin", requireAuth, requireRole("owner"), getAdminPayments);

// PATCH approve payment (owner)
router.patch("/:id/approve", requireAuth, requireRole("owner"), async (req, res) => {
  try {
    const adminName = req.user.full_name || req.user.email || "Admin";
    await db.query(
      `UPDATE move_in_payments 
       SET payment_status = 'approved', approved_by = ?, approved_at = NOW() 
       WHERE id = ?`,
      [adminName, req.params.id]
    );

    // Fetch the payment details to activate booking/tenancy if applicable
    const [payments] = await db.query("SELECT * FROM move_in_payments WHERE id = ?", [req.params.id]);
    if (payments.length > 0) {
      const p = payments[0];
      if (p.booking_id) {
        await db.query("UPDATE dorm_bookings SET status = 'approved' WHERE id = ?", [p.booking_id]);
      }
      if (p.room_id) {
        await db.query("UPDATE dorm_rooms SET status = 'occupied' WHERE id = ?", [p.room_id]);
      }
      if (p.user_id && p.room_id) {
        const [existing] = await db.query("SELECT id FROM dorm_tenants WHERE user_id = ? LIMIT 1", [p.user_id]);
        const [u] = await db.query("SELECT * FROM dorm_users WHERE id = ?", [p.user_id]);
        const user = u[0] || {};
        if (existing.length === 0) {
          await db.query(
            "INSERT INTO dorm_tenants (user_id, full_name, phone, email, room_id, start_date, status) VALUES (?, ?, ?, ?, ?, CURDATE(), 'active')",
            [p.user_id, user.full_name || "-", user.phone || "-", user.email || "-", p.room_id]
          );
        } else {
          await db.query(
            "UPDATE dorm_tenants SET room_id = ?, status = 'active' WHERE id = ?",
            [p.room_id, existing[0].id]
          );
        }
      }
      // Send notification to tenant
      try {
        await db.query(
          "INSERT INTO dorm_notifications (user_id, title, message, category) VALUES (?, ?, ?, 'payment')",
          [
            p.user_id,
            "การชำระค่าแรกเข้า/ค่าประกันได้รับการอนุมัติ",
            "ผู้ดูแลหอพักได้ตรวจสอบและอนุมัติการชำระเงินค่าแรกเข้า/ค่าประกันของคุณแล้ว",
          ]
        );
      } catch (notifErr) {
        console.warn("Tenant notification failed:", notifErr);
      }
    }

    res.json({ success: true, message: "อนุมัติการชำระเงินเรียบร้อยแล้ว" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH reject payment (owner)
router.patch("/:id/reject", requireAuth, requireRole("owner"), async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ error: "กรุณาระบุเหตุผลในการปฏิเสธ" });
    await db.query(
      `UPDATE move_in_payments 
       SET payment_status = 'rejected', rejection_reason = ? 
       WHERE id = ?`,
      [reason, req.params.id]
    );

    const [payments] = await db.query("SELECT * FROM move_in_payments WHERE id = ?", [req.params.id]);
    if (payments.length > 0) {
      try {
        await db.query(
          "INSERT INTO dorm_notifications (user_id, title, message, category) VALUES (?, ?, ?, 'payment')",
          [
            payments[0].user_id,
            "การชำระค่าแรกเข้า/ค่าประกันไม่ผ่านการอนุมัติ",
            `เหตุผล: ${reason}`,
          ]
        );
      } catch (notifErr) {
        console.warn("Tenant notification failed:", notifErr);
      }
    }

    res.json({ success: true, message: "ปฏิเสธการชำระเงินเรียบร้อยแล้ว" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

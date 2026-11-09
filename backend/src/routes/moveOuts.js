/**
 * =================================================================================================
 * Move-Out Requests & Deposit Refund API (src/routes/moveOuts.js)
 * =================================================================================================
 * จัดการกระบวนการแจ้งย้ายออกล่วงหน้า การตรวจสอบห้องพัก และการคืนเงินประกันมัดจำ
 * 
 * หน้าที่หลัก (Core Functions):
 * 1. POST /api/move-outs            : ผู้เช่ายื่นเรื่องแจ้งย้ายออก (ตรวจเช็กเงื่อนไขล่วงหน้า 30 วัน จาก dorm_settings)
 * 2. GET  /api/move-outs/my         : ผู้เช่าดูสถานะคำขอย้ายออก วันนัดตรวจห้อง และยอดเงินประกันที่จะได้รับคืน
 * 3. GET  /api/move-outs            : เจ้าของหอพักดูรายการแจ้งย้ายออกทั้งหมด
 * 4. PUT  /api/move-outs/:id/status : เจ้าของหอพักอนุมัติ บันทึกยอดหักค่าเสียหาย/ทำความสะอาด และคืนเงินประกัน
 * 
 * การเชื่อมต่อในระบบ (System Connections):
 * - Frontend Pages:
 *   • `pages/TenantMoveOut.jsx` (หน้ายื่นแจ้งย้ายออกและระบุบัญชีรับเงินประกันคืน)
 *   • `pages/MoveOuts.jsx`      (หน้าแอดมินจัดการย้ายออก ตรวจสภาพห้อง และคำนวณเงินคืน)
 * - Database Tables:
 *   • `dorm_move_outs` (ตารางหลักเก็บคำขอย้ายออก บัญชีธนาคาร และยอดเงินประกัน)
 *   • `dorm_tenants`   (ปรับสถานะเป็น 'moved_out')
 *   • `dorm_rooms`     (ปลดล็อกสถานะห้องกลับเป็น 'available')
 * =================================================================================================
 */

import { Router } from "express";
import db from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

/**
 * -------------------------------------------------------------------------------------------------
 * 1. POST /api/move-outs : ลูกบ้านยื่นเรื่องแจ้งย้ายออก
 * -------------------------------------------------------------------------------------------------
 * Input Body: { move_out_date, reason, bank_account }
 * เชื่อมกับ: pages/TenantMoveOut.jsx
 * ตรวจสอบ:
 * - กำหนดวันย้ายออกต้องล่วงหน้าไม่น้อยกว่า dorm_settings.move_out_notice_days (ค่าเริ่มต้น 30 วัน)
 * - ผู้เช่าต้องมีสัญญา active อยู่จริง
 */
router.post("/", requireAuth, async (req, res) => {
  try {
    const { move_out_date, reason, bank_account } = req.body;
    if (!move_out_date) {
      return res.status(400).json({ error: "กรุณาระบุวันที่ต้องการย้ายออก" });
    }

    // ตรวจสอบเงื่อนไขแจ้งย้ายออกล่วงหน้า (Move-out Notice Setting)
    try {
      const [settingsRows] = await db.query("SELECT move_out_notice_days FROM dorm_settings WHERE id = 1 LIMIT 1");
      const moveOutDays = settingsRows[0]?.move_out_notice_days ?? 30;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const minMoveOut = new Date(today);
      minMoveOut.setDate(minMoveOut.getDate() + Number(moveOutDays));

      const inputDate = new Date(move_out_date);
      inputDate.setHours(0, 0, 0, 0);

      if (inputDate < minMoveOut) {
        const minStr = minMoveOut.toISOString().split("T")[0];
        return res.status(400).json({
          error: `หอพักกำหนดให้แจ้งย้ายออกล่วงหน้าอย่างน้อย ${moveOutDays} วัน (สามารถเลือกวันที่ย้ายออกได้ตั้งแต่วันที่ ${minStr} เป็นต้นไป)`
        });
      }
    } catch (settingErr) {
      console.warn("Could not check move_out_notice_days:", settingErr);
    }

    // ค้นหาข้อมูลห้องและผู้เช่าของลูกบ้านที่ล็อกอินอยู่
    const [tenantRows] = await db.query(
      "SELECT id, room_id FROM dorm_tenants WHERE user_id = ? AND status = 'active' LIMIT 1",
      [req.user.id]
    );

    if (tenantRows.length === 0 || !tenantRows[0].room_id) {
      return res.status(400).json({ error: "ไม่พบข้อมูลห้องพักที่กำลังเช่าอยู่ ไม่สามารถแจ้งย้ายออกได้" });
    }

    const tenant = tenantRows[0];

    const [result] = await db.query(
      "INSERT INTO dorm_move_outs (user_id, tenant_id, room_id, move_out_date, reason, bank_account, status) VALUES (?, ?, ?, ?, ?, ?, 'pending')",
      [req.user.id, tenant.id, tenant.room_id, move_out_date, reason || null, bank_account || null]
    );

    // ส่งแจ้งเตือนแอดมิน
    const [roomRows] = await db.query("SELECT room_number FROM dorm_rooms WHERE id = ?", [tenant.room_id]);
    const roomNum = roomRows[0]?.room_number || "-";

    // แจ้งเตือนไปยังเจ้าของหอพัก/แอดมินทุกคน
    try {
      const [owners] = await db.query("SELECT id FROM dorm_users WHERE role = 'owner'");
      for (const o of owners) {
        await db.query(
          "INSERT INTO dorm_notifications (user_id, title, message, category) VALUES (?, ?, ?, 'move_out')",
          [
            o.id,
            "มีการแจ้งย้ายออกจากห้อง " + roomNum,
            `ผู้เช่า ${req.user.full_name} (ห้อง ${roomNum}) ได้แจ้งย้ายออกวันที่ ${move_out_date} เหตุผล: ${reason || "ไม่ระบุ"}`,
          ]
        );
      }
      // แจ้งเตือนยืนยันให้ลูกบ้านผู้ขอย้ายออกทราบในห้องของตนเอง
      await db.query(
        "INSERT INTO dorm_notifications (user_id, title, message, category) VALUES (?, ?, ?, 'move_out')",
        [
          req.user.id,
          "ส่งคำร้องขอย้ายออกเรียบร้อยแล้ว",
          `คำร้องขอย้ายออกจากห้อง ${roomNum} ของคุณถูกบันทึกในระบบแล้ว อยู่ระหว่างรอเจ้าหน้าที่ตรวจสอบ`,
        ]
      );
    } catch (notifErr) {
      console.error("Failed to send move out notification:", notifErr);
    }

    const [created] = await db.query("SELECT * FROM dorm_move_outs WHERE id = ?", [result.insertId]);
    res.status(201).json(created[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ลูกบ้าน: ดูสถานะคำร้องย้ายออกของตนเอง
router.get("/my", requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT m.*, 
              r.room_number, r.room_type
       FROM dorm_move_outs m
       JOIN dorm_rooms r ON m.room_id = r.id
       WHERE m.user_id = ?
       ORDER BY m.created_at DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// เจ้าของหอพัก: ดูรายการแจ้งย้ายออกทั้งหมด
router.get("/", requireAuth, requireRole("owner"), async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT m.*, 
              r.room_number, r.room_type,
              u.full_name AS tenant_name, u.phone AS tenant_phone, u.email AS tenant_email
       FROM dorm_move_outs m
       JOIN dorm_rooms r ON m.room_id = r.id
       JOIN dorm_users u ON m.user_id = u.id
       ORDER BY 
         CASE m.status 
           WHEN 'pending' THEN 1 
           ELSE 2 
         END,
         m.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// เจ้าของหอพัก: อนุมัติ / ปฏิเสธการย้ายออก
router.put("/:id/status", requireAuth, requireRole("owner"), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_note } = req.body;

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ error: "สถานะไม่ถูกต้อง ('approved' หรือ 'rejected')" });
    }

    const [rows] = await db.query("SELECT * FROM dorm_move_outs WHERE id = ?", [id]);
    if (rows.length === 0) return res.status(404).json({ error: "ไม่พบคำร้องย้ายออกนี้" });
    const moveOut = rows[0];

    await db.query(
      "UPDATE dorm_move_outs SET status = ?, admin_note = ? WHERE id = ?",
      [status, admin_note || null, id]
    );

    // หากอนุมัติ: ปรับสถานะห้องเป็น available และผู้เช่าเป็น moved_out
    if (status === "approved") {
      // 1. ปลดห้องให้กลับมาว่าง
      await db.query("UPDATE dorm_rooms SET status = 'available' WHERE id = ?", [moveOut.room_id]);

      // 2. ปรับสถานะผู้เช่าทุกคนที่เชื่อมกับห้องนี้ หรือผู้ใช้นี้ ให้เป็น moved_out
      await db.query(
        `UPDATE dorm_tenants 
         SET status = 'moved_out', room_id = NULL, end_date = COALESCE(?, CURDATE()) 
         WHERE (user_id = ? AND (room_id = ? OR room_id IS NULL)) OR id = ? OR room_id = ?`,
        [moveOut.move_out_date, moveOut.user_id, moveOut.room_id, moveOut.tenant_id, moveOut.room_id]
      );

      // 3. ปรับสถานะการจองเดิมที่เกี่ยวข้องทั้งหมดให้เป็น 'completed' เพื่อไม่ให้ค้างในหน้ารออนุมัติ
      await db.query(
        `UPDATE dorm_bookings 
         SET status = 'completed', admin_note = 'ย้ายออกเรียบร้อยแล้ว (Moved out)' 
         WHERE ((user_id = ? AND room_id = ?) OR room_id = ? OR user_id = ?) 
           AND status IN ('pending', 'approved', 'confirmed')`,
        [moveOut.user_id, moveOut.room_id, moveOut.room_id, moveOut.user_id]
      );

      // 4. ยกเลิกรายการชำระค่าแรกเข้า / ค่าประกันที่ค้างอยู่ของห้องนี้และผู้ใช้นี้ ไม่ให้ค้างในหน้ารอตรวจสอบ
      await db.query(
        `UPDATE move_in_payments 
         SET payment_status = 'rejected', rejection_reason = 'ยกเลิกอัตโนมัติเนื่องจากผู้เช่าย้ายออกแล้ว (Moved out)' 
         WHERE ((user_id = ? AND room_id = ?) OR room_id = ? OR user_id = ?) 
           AND payment_status IN ('pending', 'submitted')`,
        [moveOut.user_id, moveOut.room_id, moveOut.room_id, moveOut.user_id]
      );

      // 5. แจ้งเตือนลูกบ้าน
      await db.query(
        "INSERT INTO dorm_notifications (user_id, title, message, category) VALUES (?, ?, ?, 'move_out')",
        [
          moveOut.user_id,
          "คำร้องแจ้งย้ายออกได้รับการอนุมัติแล้ว",
          `คำร้องขอย้ายออกของคุณได้รับการอนุมัติเรียบร้อยแล้ว ขอขอบคุณที่ใช้บริการหอพักของเรา`,
        ]
      );
    } else if (status === "rejected") {
      await db.query(
        "INSERT INTO dorm_notifications (user_id, title, message, category) VALUES (?, ?, ?, 'move_out')",
        [
          moveOut.user_id,
          "คำร้องแจ้งย้ายออกไม่ได้รับการอนุมัติ",
          `เหตุผล: ${admin_note || "กรุณาติดต่อเจ้าหน้าที่หอพัก"}`,
        ]
      );
    }

    const [updated] = await db.query("SELECT * FROM dorm_move_outs WHERE id = ?", [id]);
    res.json(updated[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;

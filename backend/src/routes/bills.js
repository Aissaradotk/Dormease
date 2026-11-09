/**
 * =================================================================================================
 * Monthly Bills & Utility Meter API Routes (src/routes/bills.js)
 * =================================================================================================
 * ไฟล์นี้จัดการวงจรบิลค่าเช่ารายเดือน มิเตอร์ค่าน้ำ ค่าไฟ และการตรวจสอบการชำระเงิน
 * 
 * หน้าที่หลัก (Core Functions):
 * 1. GET  /api/bills/my        : ผู้เช่าดูประวัติบิลและใบแจ้งหนี้ของตนเอง พร้อมยอดชำระ
 * 2. POST /api/bills/attach-slip : ผู้เช่าอัปโหลดสลิปธนาคารเพื่อแนบยืนยันการชำระบิล
 * 3. GET  /api/bills           : เจ้าของหอพักดูบิลทั้งหมดในหอพัก กรองตามรอบบิล/สถานะ
 * 4. POST /api/bills           : เจ้าของหอพักออกบิลประจำเดือน บันทึกเลขมิเตอร์ คำนวณค่าน้ำ-ไฟ
 * 5. POST /api/bills/approve   : เจ้าของหอพักตรวจและอนุมัติการชำระบิล ออก e-Receipt
 * 6. DELETE /api/bills/:id     : ยกเลิกหรือลบบิล
 * 
 * การเชื่อมต่อในระบบ (System Connections):
 * - Frontend Pages:
 *   • `pages/MonthlyBills.jsx` (แอดมินออกบิล จดมิเตอร์ ดูสถานะบิลรวม)
 *   • `pages/TenantBills.jsx`  (ผู้เช่าตรวจบิลรายเดือน ดาวน์โหลด QR จ่ายเงิน)
 *   • `components/BillSlipModal.jsx` (ป็อปอัปดูหลักฐานสลิป)
 * - Database Tables:
 *   • `dorm_bills`        (ตารางหลักเก็บข้อมูลบิลและยอดเงิน)
 *   • `dorm_rooms`        (เชื่อมรหัสห้อง room_number, room_type)
 *   • `dorm_tenants`      (เชื่อมข้อมูลผู้เช่า)
 *   • `dorm_users`        (ผู้อนุมัติบิล approved_by)
 * =================================================================================================
 */

import { Router } from "express";
import db from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

/**
 * -------------------------------------------------------------------------------------------------
 * 1. GET /api/bills/my : ลูกบ้านดูบิลค่าใช้จ่ายประจำเดือนของตนเอง
 * -------------------------------------------------------------------------------------------------
 * เชื่อมกับ: pages/TenantBills.jsx
 * ดึงข้อมูลบิลทั้งหมดที่เป็นของ user_id ปัจจุบัน (จับคู่ผ่าน dorm_tenants)
 */
router.get("/my", requireAuth, async (req, res) => {
  try {
    const [tenantRows] = await db.query(
      "SELECT id, room_id FROM dorm_tenants WHERE user_id = ? ORDER BY id DESC",
      [req.user.id]
    );

    if (tenantRows.length === 0) return res.json([]);
    const tenantIds = tenantRows.map((t) => t.id);
    const roomIds = tenantRows.map((t) => t.room_id).filter(Boolean);

    const [bills] = await db.query(
      `SELECT b.*, 
              r.room_number, r.room_type,
              u.full_name AS approved_by_name
       FROM dorm_bills b
       JOIN dorm_rooms r ON b.room_id = r.id
       LEFT JOIN dorm_users u ON b.approved_by = u.id
       WHERE (b.tenant_id IN (?) OR (b.room_id IN (?) AND (b.tenant_id IS NULL OR b.tenant_id IN (?))))
       ORDER BY b.period DESC, b.created_at DESC`,
      [tenantIds, roomIds.length > 0 ? roomIds : [-1], tenantIds]
    );

    res.json(bills);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * -------------------------------------------------------------------------------------------------
 * 2. POST /api/bills/attach-slip : ลูกบ้านแนบสลิปการโอนเงินสำหรับบิลค่าใช้จ่าย
 * -------------------------------------------------------------------------------------------------
 * เชื่อมกับ: pages/TenantBills.jsx (ปุ่มอัปโหลดสลิป)
 * Input Body: { bill_id, slip_image }
 * อัปเดต dorm_bills.slip_image และเปลี่ยน payment_status เป็น 'pending_verification'
 */
router.post("/attach-slip", requireAuth, async (req, res) => {
  try {
    const { bill_id, slip_image } = req.body;
    if (!bill_id || !slip_image) {
      return res.status(400).json({ error: "กรุณาระบุรหัสบิลและไฟล์สลิป" });
    }

    const [tenantRows] = await db.query(
      "SELECT id, room_id FROM dorm_tenants WHERE user_id = ? ORDER BY id DESC",
      [req.user.id]
    );

    if (tenantRows.length === 0) {
      return res.status(403).json({ error: "ไม่พบข้อมูลผู้เช่าของคุณ" });
    }

    const tenantIds = tenantRows.map((t) => t.id);
    const tenantId = tenantRows[0].id;

    // ตรวจสอบสถานะบิลปัจจุบันก่อนว่ายังไม่จ่าย
    const [billCheck] = await db.query("SELECT * FROM dorm_bills WHERE id = ?", [bill_id]);
    if (billCheck.length === 0) {
      return res.status(404).json({ error: "ไม่พบบิลค่าใช้จ่ายนี้" });
    }

    // อัปเดต slip_image และเปลี่ยนสถานะเป็น 'waiting_review' (รอตรวจสอบ)
    await db.query(
      `UPDATE dorm_bills 
       SET slip_image = ?, 
           status = 'waiting_review', 
           reject_reason = NULL 
       WHERE id = ? AND (tenant_id IN (?) OR tenant_id IS NULL)`,
      [slip_image, bill_id, tenantIds]
    );

    // บันทึก/อัปเดตใน dorm_payments ให้สถานะตรงกัน
    const b = billCheck[0];
    const [existingPay] = await db.query(
      "SELECT id FROM dorm_payments WHERE tenant_id = ? AND period = ? LIMIT 1",
      [tenantId, b.period]
    );

    if (existingPay.length > 0) {
      await db.query(
        "UPDATE dorm_payments SET slip_image = ?, status = 'waiting_review', amount = ? WHERE id = ?",
        [slip_image, b.total_amount, existingPay[0].id]
      );
    } else {
      await db.query(
        "INSERT INTO dorm_payments (tenant_id, amount, period, status, slip_image) VALUES (?, ?, ?, 'waiting_review', ?)",
        [tenantId, b.total_amount, b.period, slip_image]
      );
    }

    res.json({
      success: true,
      status: "waiting_review",
      message: "แนบสลิปการโอนเงินสำเร็จ สถานะเปลี่ยนเป็น 'รอตรวจสอบ' เรียบร้อยแล้ว",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * -------------------------------------------------------------------------------------------------
 * 2.1 POST /api/bills/confirm-paid : ลูกบ้านกดยืนยันว่าโอนเงินแล้ว (ตรวจสอบและอนุมัติอัตโนมัติ)
 * -------------------------------------------------------------------------------------------------
 * เชื่อมกับ: pages/TenantPayments.jsx
 * Input Body: { bill_id }
 */
router.post("/confirm-paid", requireAuth, async (req, res) => {
  try {
    const { bill_id } = req.body;
    if (!bill_id) return res.status(400).json({ error: "กรุณาระบุรหัสบิล (bill_id)" });

    const [rows] = await db.query(
      `SELECT b.*, r.room_number, t.full_name AS tenant_name, t.user_id AS tenant_user_id
       FROM dorm_bills b
       JOIN dorm_rooms r ON b.room_id = r.id
       LEFT JOIN dorm_tenants t ON b.tenant_id = t.id
       WHERE b.id = ? LIMIT 1`,
      [bill_id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "ไม่พบบิลค่าใช้จ่ายนี้" });
    const bill = rows[0];

    if (bill.status === "paid") {
      return res.json({
        success: true,
        status: "paid",
        message: "บิลนี้ได้รับการชำระเงินเรียบร้อยแล้ว",
        bill
      });
    }

    const now = new Date();

    // 1. อัปเดต dorm_bills เป็น paid
    await db.query(
      `UPDATE dorm_bills 
       SET status = 'paid', 
           paid_at = ?, 
           payment_source = 'promptpay_verified', 
           reject_reason = NULL 
       WHERE id = ?`,
      [now, bill.id]
    );

    // 2. อัปเดต/เพิ่มใน dorm_payments
    if (bill.tenant_id) {
      const [pRows] = await db.query(
        "SELECT id FROM dorm_payments WHERE tenant_id = ? AND period = ? LIMIT 1",
        [bill.tenant_id, bill.period]
      );
      if (pRows.length > 0) {
        await db.query(
          "UPDATE dorm_payments SET status = 'paid', paid_at = ?, approved_by = 1 WHERE id = ?",
          [now, pRows[0].id]
        );
      } else {
        await db.query(
          "INSERT INTO dorm_payments (tenant_id, amount, period, status, paid_at, approved_by) VALUES (?, ?, ?, 'paid', ?, 1)",
          [bill.tenant_id, bill.total_amount, bill.period, now]
        );
      }

      // 3. แจ้งเตือนลูกบ้าน
      if (bill.tenant_user_id) {
        await db.query(
          "INSERT INTO dorm_notifications (user_id, title, message, category) VALUES (?, ?, ?, 'bill')",
          [
            bill.tenant_user_id,
            `ยืนยันการชำระเงินงวด ${bill.period} สำเร็จ`,
            `ระบบได้ตรวจสอบและอนุมัติการชำระเงินบิลงวด ${bill.period} ยอด ${Number(bill.total_amount).toLocaleString()} บาท เรียบร้อยแล้ว`,
          ]
        );
      }
    }

    const [updated] = await db.query("SELECT * FROM dorm_bills WHERE id = ?", [bill.id]);
    res.json({
      success: true,
      status: "paid",
      message: "✓ ตรวจสอบยอดเงินสำเร็จ! อนุมัติการชำระเงินเรียบร้อยแล้ว",
      bill: updated[0]
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.use(requireAuth, requireRole("owner"));

// เจ้าของหอพัก: อนุมัติการชำระเงิน (Approve Payment)
router.post("/approve", async (req, res) => {
  try {
    const { bill_id, room_id, period } = req.body;
    if (!bill_id && (!room_id || !period)) {
      return res.status(400).json({ error: "กรุณาระบุรหัสบิล หรือห้องและงวดประจำเดือน" });
    }

    let bill = null;
    if (bill_id) {
      const [rows] = await db.query("SELECT * FROM dorm_bills WHERE id = ?", [bill_id]);
      if (rows.length === 0) return res.status(404).json({ error: "ไม่พบบิลค่าใช้จ่ายนี้" });
      bill = rows[0];
    } else {
      const [rows] = await db.query(
        "SELECT * FROM dorm_bills WHERE room_id = ? AND period = ? LIMIT 1",
        [room_id, period]
      );
      if (rows.length === 0) return res.status(404).json({ error: "ไม่พบบิลค่าใช้จ่ายนี้" });
      bill = rows[0];
    }

    const now = new Date();
    const adminId = req.user.id;

    // 1. อัปเดตตาราง dorm_bills
    await db.query(
      `UPDATE dorm_bills 
       SET status = 'paid', 
           paid_at = ?, 
           approved_by = ?, 
           reject_reason = NULL 
       WHERE id = ?`,
      [now, adminId, bill.id]
    );

    // 2. อัปเดตตาราง dorm_payments ให้ตรงกัน
    if (bill.tenant_id) {
      const [pRows] = await db.query(
        "SELECT id FROM dorm_payments WHERE tenant_id = ? AND period = ? LIMIT 1",
        [bill.tenant_id, bill.period]
      );
      if (pRows.length > 0) {
        await db.query(
          "UPDATE dorm_payments SET status = 'paid', paid_at = ?, approved_by = ? WHERE id = ?",
          [now, adminId, pRows[0].id]
        );
      } else {
        await db.query(
          "INSERT INTO dorm_payments (tenant_id, amount, period, status, paid_at, approved_by, slip_image) VALUES (?, ?, ?, 'paid', ?, ?, ?)",
          [bill.tenant_id, bill.total_amount, bill.period, now, adminId, bill.slip_image || null]
        );
      }

      // 3. ส่งข้อความแจ้งเตือนหาลูกบ้าน
      const [tUser] = await db.query("SELECT user_id FROM dorm_tenants WHERE id = ?", [bill.tenant_id]);
      if (tUser.length > 0 && tUser[0].user_id) {
        await db.query(
          "INSERT INTO dorm_notifications (user_id, title, message, category) VALUES (?, ?, ?, 'bill')",
          [
            tUser[0].user_id,
            `ยืนยันการชำระเงินงวด ${bill.period} เรียบร้อยแล้ว`,
            `การชำระเงินบิลประจำเดือน ${bill.period} ยอดรวม ${Number(bill.total_amount).toLocaleString()} บาท ได้รับการตรวจสอบและอนุมัติเรียบร้อยแล้ว ขอบคุณที่ชำระตรงเวลา`,
          ]
        );
      }
    }

    const [updated] = await db.query("SELECT * FROM dorm_bills WHERE id = ?", [bill.id]);
    res.json({
      success: true,
      message: "อนุมัติการชำระเงินเรียบร้อยแล้ว",
      bill: updated[0],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// เจ้าของหอพัก: ปฏิเสธสลิปการโอนเงิน (Reject Slip)
router.post("/reject", async (req, res) => {
  try {
    const { bill_id, reason } = req.body;
    if (!bill_id) return res.status(400).json({ error: "กรุณาระบุรหัสบิล" });

    const [rows] = await db.query("SELECT * FROM dorm_bills WHERE id = ?", [bill_id]);
    if (rows.length === 0) return res.status(404).json({ error: "ไม่พบบิลค่าใช้จ่ายนี้" });
    const bill = rows[0];

    const rejectReason = reason || "สลิปไม่ถูกต้อง หรือยอดเงินไม่ตรงตามบิล";
    const adminId = req.user.id;

    // อัปเดต dorm_bills เป็น 'rejected'
    await db.query(
      `UPDATE dorm_bills 
       SET status = 'rejected', 
           reject_reason = ?, 
           paid_at = NULL, 
           approved_by = ? 
       WHERE id = ?`,
      [rejectReason, adminId, bill.id]
    );

    // อัปเดต dorm_payments
    if (bill.tenant_id) {
      await db.query(
        "UPDATE dorm_payments SET status = 'rejected' WHERE tenant_id = ? AND period = ?",
        [bill.tenant_id, bill.period]
      );

      // ส่งข้อความแจ้งเตือนหาลูกบ้าน
      const [tUser] = await db.query("SELECT user_id FROM dorm_tenants WHERE id = ?", [bill.tenant_id]);
      if (tUser.length > 0 && tUser[0].user_id) {
        await db.query(
          "INSERT INTO dorm_notifications (user_id, title, message, category) VALUES (?, ?, ?, 'bill')",
          [
            tUser[0].user_id,
            `สลิปการโอนเงินงวด ${bill.period} ไม่ผ่านการตรวจสอบ`,
            `สลิปการโอนเงินของคุณสำหรับงวด ${bill.period} ไม่ผ่านการตรวจสอบ: ${rejectReason} กรุณาตรวจสอบและแนบสลิปใหม่อีกครั้ง`,
          ]
        );
      }
    }

    const [updated] = await db.query("SELECT * FROM dorm_bills WHERE id = ?", [bill.id]);
    res.json({
      success: true,
      message: "ปฏิเสธสลิปเรียบร้อยแล้ว",
      bill: updated[0],
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// เจ้าของหอพัก: ดึงตารางรวมค่าใช้จ่ายทุกห้องประจำเดือน (เช่น period=2026-09)
router.get("/monthly", async (req, res) => {
  try {
    const period = req.query.period || new Date().toISOString().slice(0, 7);

    // ดึงห้องพักทั้งหมด พร้อมข้อมูลผู้เช่าปัจจุบัน และข้อมูลบิลในเดือนนั้น (ถ้ามี)
    // ใช้ MAX(id) subquery เพื่อรับประกันว่าห้องแต่ละห้องจะปรากฏเพียง 1 แถวเท่านั้น ป้องกันห้องซ้ำ
    const [rows] = await db.query(
      `SELECT 
         r.id AS room_id,
         r.room_number,
         r.room_type,
         r.price AS default_room_price,
         r.status AS room_status,
         t.id AS tenant_id,
         t.full_name AS tenant_name,
         t.phone AS tenant_phone,
         b.id AS bill_id,
         COALESCE(b.room_price, r.price, 0) AS room_price,
         COALESCE(b.water_units, 0) AS water_units,
         COALESCE(b.water_price, 0) AS water_price,
         COALESCE(b.electric_units, 0) AS electric_units,
         COALESCE(b.electric_price, 0) AS electric_price,
         COALESCE(b.other_fees, 0) AS other_fees,
         COALESCE(b.total_amount, COALESCE(b.room_price, r.price, 0)) AS total_amount,
         COALESCE(b.status, 'unpaid') AS bill_status,
         b.paid_at,
         b.approved_by,
         b.reject_reason,
         b.slip_image,
         b.created_at AS bill_created_at
       FROM dorm_rooms r
       LEFT JOIN (
         SELECT t1.*
         FROM dorm_tenants t1
         INNER JOIN (
           SELECT room_id, MAX(id) AS max_id
           FROM dorm_tenants
           WHERE status = 'active' AND room_id IS NOT NULL
           GROUP BY room_id
         ) t2 ON t1.id = t2.max_id
       ) t ON r.id = t.room_id
       LEFT JOIN (
         SELECT b1.*
         FROM dorm_bills b1
         INNER JOIN (
           SELECT room_id, MAX(id) AS max_id
           FROM dorm_bills
           WHERE period = ?
           GROUP BY room_id
         ) b2 ON b1.id = b2.max_id
       ) b ON r.id = b.room_id
       ORDER BY CAST(r.room_number AS UNSIGNED) ASC, r.room_number ASC`,
      [period]
    );

    // คำนวณยอดสรุปรวมประจำเดือน
    let totalBilled = 0;
    let totalPaid = 0;
    let totalUnpaid = 0;

    rows.forEach((row) => {
      const amt = Number(row.total_amount) || 0;
      totalBilled += amt;
      if (row.bill_status === "paid" || row.bill_status === "approved") {
        totalPaid += amt;
      } else {
        totalUnpaid += amt;
      }
    });

    res.json({
      period,
      summary: {
        totalRooms: rows.length,
        totalBilled,
        totalPaid,
        totalUnpaid,
      },
      rooms: rows,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// เจ้าของหอพัก: บันทึกหรืออัปเดตบิลค่าใช้จ่ายของห้อง
router.post("/save", async (req, res) => {
  try {
    const {
      room_id,
      tenant_id,
      period,
      room_price,
      water_units,
      water_price,
      electric_units,
      electric_price,
      other_fees,
      status,
    } = req.body;

    if (!room_id || !period) {
      return res.status(400).json({ error: "กรุณาระบุห้องและงวดประจำเดือน (YYYY-MM)" });
    }

    const rPrice = Number(room_price) || 0;
    const wPrice = Number(water_price) || 0;
    const ePrice = Number(electric_price) || 0;
    const oFees = Number(other_fees) || 0;
    const total = Number((rPrice + wPrice + ePrice + oFees).toFixed(2));

    // ตรวจสอบว่ามีบิลเดิมอยู่แล้วหรือไม่
    const [existing] = await db.query(
      "SELECT * FROM dorm_bills WHERE room_id = ? AND period = ? LIMIT 1",
      [room_id, period]
    );

    // ดึง tenant_id หรือค้นหาจากผู้เช่า active ปัจจุบัน
    let finalTenantId = tenant_id || (existing.length > 0 ? existing[0].tenant_id : null);
    if (!finalTenantId) {
      const [tRows] = await db.query(
        "SELECT id FROM dorm_tenants WHERE room_id = ? AND status = 'active' ORDER BY id DESC LIMIT 1",
        [room_id]
      );
      if (tRows.length > 0) {
        finalTenantId = tRows[0].id;
      }
    }

    const currentStatus = status || (existing.length > 0 ? existing[0].status : "unpaid");
    let billStatus = currentStatus;
    let paidAt = null;
    let approvedBy = null;

    if (currentStatus === "paid" || currentStatus === "approved") {
      billStatus = "paid";
      paidAt = existing.length > 0 && existing[0].paid_at ? existing[0].paid_at : new Date();
      approvedBy = existing.length > 0 && existing[0].approved_by ? existing[0].approved_by : req.user.id;
    } else if (currentStatus === "waiting_review" || (existing.length > 0 && existing[0].slip_image && currentStatus !== "unpaid")) {
      billStatus = "waiting_review";
    } else if (currentStatus === "rejected") {
      billStatus = "rejected";
    } else {
      billStatus = "unpaid";
    }

    let billId;
    if (existing.length > 0) {
      billId = existing[0].id;

      await db.query(
        `UPDATE dorm_bills 
         SET tenant_id = ?,
             room_price = ?,
             water_units = ?,
             water_price = ?,
             electric_units = ?,
             electric_price = ?,
             other_fees = ?,
             total_amount = ?,
             status = ?,
             paid_at = ?,
             approved_by = ?
         WHERE id = ?`,
        [
          finalTenantId,
          rPrice,
          Number(water_units) || 0,
          wPrice,
          Number(electric_units) || 0,
          ePrice,
          oFees,
          total,
          billStatus,
          paidAt,
          approvedBy,
          billId,
        ]
      );
    } else {
      const [insertRes] = await db.query(
        `INSERT INTO dorm_bills 
         (room_id, tenant_id, period, room_price, water_units, water_price, electric_units, electric_price, other_fees, total_amount, status, paid_at, approved_by)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          room_id,
          finalTenantId,
          period,
          rPrice,
          Number(water_units) || 0,
          wPrice,
          Number(electric_units) || 0,
          ePrice,
          oFees,
          total,
          billStatus,
          paidAt,
          approvedBy,
        ]
      );
      billId = insertRes.insertId;
    }

    // ซิงค์เข้าตาราง dorm_payments
    if (finalTenantId) {
      const [payExist] = await db.query(
        "SELECT id FROM dorm_payments WHERE tenant_id = ? AND period = ? LIMIT 1",
        [finalTenantId, period]
      );
      if (payExist.length > 0) {
        await db.query(
          "UPDATE dorm_payments SET amount = ?, status = ?, paid_at = ?, approved_by = ? WHERE id = ?",
          [total, billStatus, paidAt, approvedBy, payExist[0].id]
        );
      } else {
        await db.query(
          "INSERT INTO dorm_payments (tenant_id, amount, period, status, paid_at, approved_by) VALUES (?, ?, ?, ?, ?, ?)",
          [finalTenantId, total, period, billStatus, paidAt, approvedBy]
        );
      }
    }

    const [saved] = await db.query("SELECT * FROM dorm_bills WHERE id = ?", [billId]);
    res.json(saved[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// เจ้าของหอพัก: สลับหรือแก้ไขสถานะชำระเงิน (Toggle / Set Status)
router.put("/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    let newStatus = status;
    if (!["paid", "unpaid", "waiting_review", "rejected"].includes(newStatus)) {
      newStatus = (status === "paid" || status === "approved") ? "paid" : "unpaid";
    }
    const isPaid = newStatus === "paid";
    const now = isPaid ? new Date() : null;
    const adminId = isPaid ? req.user.id : null;
    const rejectReason = newStatus === "rejected" ? (req.body.reject_reason || "สลิปไม่ถูกต้อง") : null;

    await db.query(
      "UPDATE dorm_bills SET status = ?, paid_at = ?, approved_by = ?, reject_reason = ? WHERE id = ?",
      [newStatus, now, adminId, rejectReason, id]
    );

    // ซิงค์ไปยัง dorm_payments
    const [bRows] = await db.query("SELECT tenant_id, period, total_amount, slip_image FROM dorm_bills WHERE id = ?", [id]);
    if (bRows.length > 0 && bRows[0].tenant_id) {
      const { tenant_id, period, total_amount, slip_image } = bRows[0];
      const [pRows] = await db.query("SELECT id FROM dorm_payments WHERE tenant_id = ? AND period = ? LIMIT 1", [tenant_id, period]);
      if (pRows.length > 0) {
        await db.query(
          "UPDATE dorm_payments SET status = ?, paid_at = ?, approved_by = ? WHERE id = ?",
          [newStatus, now, adminId, pRows[0].id]
        );
      } else {
        await db.query(
          "INSERT INTO dorm_payments (tenant_id, amount, period, status, paid_at, approved_by, slip_image) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [tenant_id, total_amount, period, newStatus, now, adminId, slip_image || null]
        );
      }
    }

    const [updated] = await db.query("SELECT * FROM dorm_bills WHERE id = ?", [id]);
    res.json(updated[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// เจ้าของหอพัก: สุ่มเศษทศนิยมสตางค์ (0.01 - 0.99 บาท) แต่ละบิลไม่ซ้ำกัน เพิ่มไม่เกิน 1 บาท
router.post("/randomize-decimals", async (req, res) => {
  try {
    const period = req.body.period || new Date().toISOString().slice(0, 7);

    // 1. ดึงห้องพักทั้งหมดในหอพัก
    const [rooms] = await db.query(
      `SELECT r.id AS room_id, r.room_number, r.price AS default_room_price,
              t.id AS tenant_id, t.full_name AS tenant_name,
              b.id AS bill_id, b.room_price, b.water_price, b.electric_price, b.other_fees, b.total_amount, b.status AS bill_status
       FROM dorm_rooms r
       LEFT JOIN (
         SELECT t1.*
         FROM dorm_tenants t1
         INNER JOIN (
           SELECT room_id, MAX(id) AS max_id
           FROM dorm_tenants
           WHERE status = 'active' AND room_id IS NOT NULL
           GROUP BY room_id
         ) t2 ON t1.id = t2.max_id
       ) t ON r.id = t.room_id
       LEFT JOIN (
         SELECT b1.*
         FROM dorm_bills b1
         INNER JOIN (
           SELECT room_id, MAX(id) AS max_id
           FROM dorm_bills
           WHERE period = ?
           GROUP BY room_id
         ) b2 ON b1.id = b2.max_id
       ) b ON r.id = b.room_id
       ORDER BY CAST(r.room_number AS UNSIGNED) ASC, r.room_number ASC`,
      [period]
    );

    // กรองเอาเฉพาะห้องที่ยังไม่ได้จ่าย (ไม่แตะต้องห้องที่ paid หรือ approved ไปแล้ว!)
    const unpaidRooms = rooms.filter(
      (r) => !r.bill_status || r.bill_status === "unpaid" || r.bill_status === "waiting_review"
    );

    if (unpaidRooms.length === 0) {
      return res.status(400).json({ error: "ไม่พบบิลรอชำระในงวดเดือนนี้ (ชำระครบทุกห้องแล้ว)" });
    }

    // 2. สร้าง Pool เศษสตางค์ 0.01 ถึง 0.99 (99 ตัวเลือก)
    const availableDecimals = [];
    for (let i = 1; i <= 99; i++) {
      availableDecimals.push(Number((i / 100).toFixed(2))); // 0.01, 0.02, ..., 0.99
    }

    // สุ่มสลับตำแหน่งแบบ Fisher-Yates Shuffle
    for (let i = availableDecimals.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [availableDecimals[i], availableDecimals[j]] = [availableDecimals[j], availableDecimals[i]];
    }

    const updatedBills = [];

    for (let idx = 0; idx < unpaidRooms.length; idx++) {
      const rm = unpaidRooms[idx];
      const uniqueDecimal = availableDecimals[idx % availableDecimals.length]; // รับประกันไม่ซ้ำกันเด็ดขาด และไม่เกิน 1 บาท

      // ตัดเศษสตางค์เดิมออกก่อนเพื่อคำนวณฐาน
      const rPrice = Number(rm.room_price ?? rm.default_room_price) || 0;
      const wPrice = Number(rm.water_price) || 0;
      const ePrice = Number(rm.electric_price) || 0;
      const baseOtherFees = Math.floor(Number(rm.other_fees) || 0);

      // นำเศษสตางค์ใหม่ไปใส่ใน other_fees
      const newOtherFees = Number((baseOtherFees + uniqueDecimal).toFixed(2));
      const newTotal = Number((rPrice + wPrice + ePrice + newOtherFees).toFixed(2));
      const bStatus = rm.bill_status || "unpaid";

      let finalBillId = rm.bill_id;

      if (rm.bill_id) {
        // อัปเดตบิลเดิม
        await db.query(
          "UPDATE dorm_bills SET room_price = ?, other_fees = ?, total_amount = ? WHERE id = ?",
          [rPrice, newOtherFees, newTotal, rm.bill_id]
        );
      } else {
        // สร้างบิลใหม่
        const [ins] = await db.query(
          `INSERT INTO dorm_bills 
           (room_id, tenant_id, period, room_price, water_price, electric_price, other_fees, total_amount, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [rm.room_id, rm.tenant_id || null, period, rPrice, wPrice, ePrice, newOtherFees, newTotal, bStatus]
        );
        finalBillId = ins.insertId;
      }

      // ซิงค์ไปยัง dorm_payments
      if (rm.tenant_id) {
        const [payRows] = await db.query(
          "SELECT id FROM dorm_payments WHERE tenant_id = ? AND period = ? LIMIT 1",
          [rm.tenant_id, period]
        );
        if (payRows.length > 0) {
          await db.query(
            "UPDATE dorm_payments SET amount = ? WHERE id = ?",
            [newTotal, payRows[0].id]
          );
        } else {
          await db.query(
            "INSERT INTO dorm_payments (tenant_id, amount, period, status) VALUES (?, ?, ?, ?)",
            [rm.tenant_id, newTotal, period, bStatus]
          );
        }
      }

      updatedBills.push({
        bill_id: finalBillId,
        room_id: rm.room_id,
        room_number: rm.room_number,
        decimal_added: uniqueDecimal,
        total_amount: newTotal,
      });
    }

    res.json({
      success: true,
      message: `สุ่มทศนิยมเศษสตางค์ไม่ซ้ำกันให้ ${updatedBills.length} ห้องเรียบร้อยแล้ว (แต่ละห้องเพิ่มไม่เกิน 1 บาท)`,
      period,
      count: updatedBills.length,
      updated_bills: updatedBills,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// เจ้าของหอพัก: ล้างเศษทศนิยมคืนค่าเป็นจำนวนเต็ม (.00)
router.post("/reset-decimals", async (req, res) => {
  try {
    const period = req.body.period || new Date().toISOString().slice(0, 7);

    const [bills] = await db.query(
      `SELECT b.*, t.id AS tenant_id
       FROM dorm_bills b
       LEFT JOIN dorm_tenants t ON b.tenant_id = t.id
       WHERE b.period = ? AND b.status IN ('unpaid', 'waiting_review')`,
      [period]
    );

    for (const b of bills) {
      const rPrice = Number(b.room_price) || 0;
      const wPrice = Number(b.water_price) || 0;
      const ePrice = Number(b.electric_price) || 0;
      const cleanOtherFees = Math.floor(Number(b.other_fees) || 0);
      const cleanTotal = Number((rPrice + wPrice + ePrice + cleanOtherFees).toFixed(2));

      await db.query(
        "UPDATE dorm_bills SET other_fees = ?, total_amount = ? WHERE id = ?",
        [cleanOtherFees, cleanTotal, b.id]
      );

      if (b.tenant_id) {
        await db.query(
          "UPDATE dorm_payments SET amount = ? WHERE tenant_id = ? AND period = ?",
          [cleanTotal, b.tenant_id, period]
        );
      }
    }

    res.json({
      success: true,
      message: `ล้างเศษทศนิยมคืนค่าเป็นจำนวนเต็มให้ ${bills.length} บิลเรียบร้อยแล้ว`,
      period,
      count: bills.length,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// เจ้าของหอพัก: ส่งแจ้งเตือนบิลไปยังผู้เช่า (รายห้อง หรือ ทุกห้อง)
router.post("/notify", async (req, res) => {
  try {
    const { room_id, bill_id, period, notify_all } = req.body;
    const targetPeriod = period || new Date().toISOString().slice(0, 7);

    let query = `
      SELECT b.id AS bill_id, b.room_id, r.room_number, b.period,
             b.room_price, b.water_price, b.electric_price, b.other_fees, b.total_amount,
             b.status, t.id AS tenant_id, t.full_name AS tenant_name, t.user_id AS tenant_user_id,
             t.email AS tenant_email, t.phone AS tenant_phone
      FROM dorm_bills b
      JOIN dorm_rooms r ON b.room_id = r.id
      LEFT JOIN (
        SELECT t1.*
        FROM dorm_tenants t1
        INNER JOIN (
          SELECT room_id, MAX(id) AS max_id
          FROM dorm_tenants
          WHERE status = 'active' AND room_id IS NOT NULL
          GROUP BY room_id
        ) t2 ON t1.id = t2.max_id
      ) t ON b.room_id = t.room_id
      WHERE b.period = ?
    `;
    const params = [targetPeriod];

    if (!notify_all) {
      if (bill_id) {
        query += " AND b.id = ?";
        params.push(bill_id);
      } else if (room_id) {
        query += " AND b.room_id = ?";
        params.push(room_id);
      } else {
        return res.status(400).json({ error: "กรุณาระบุรหัสบิล หรือห้อง หรือเลือกแจ้งเตือนทุกห้อง" });
      }
    } else {
      query += " AND b.status IN ('unpaid', 'waiting_review')";
    }

    const [bills] = await db.query(query, params);

    if (bills.length === 0) {
      return res.status(404).json({ error: "ไม่พบบิลค่าใช้จ่ายที่ตรงกับเงื่อนไขสำหรับการแจ้งเตือน" });
    }

    const notifiedList = [];

    for (const b of bills) {
      let userId = b.tenant_user_id;
      if (!userId && b.tenant_id) {
        if (b.tenant_email || b.tenant_phone) {
          const [u] = await db.query(
            "SELECT id FROM dorm_users WHERE (email = ? AND email IS NOT NULL AND email != '') OR (phone = ? AND phone IS NOT NULL AND phone != '') LIMIT 1",
            [b.tenant_email, b.tenant_phone]
          );
          if (u.length > 0) {
            userId = u[0].id;
            await db.query("UPDATE dorm_tenants SET user_id = ? WHERE id = ?", [userId, b.tenant_id]);
          }
        }
      }

      const totalFmt = Number(b.total_amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
      const roomFmt = Number(b.room_price).toLocaleString();
      const waterFmt = Number(b.water_price).toLocaleString();
      const elecFmt = Number(b.electric_price).toLocaleString();
      const otherFmt = Number(b.other_fees).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

      const title = `🧾 แจ้งบิลค่าเช่าประจำงวด ${b.period} (ห้อง ${b.room_number})`;
      let message = `เรียนผู้เช่าห้อง ${b.room_number} บิลค่าใช้จ่ายประจำงวด ${b.period} ออกเรียบร้อยแล้ว ยอดรวมสุทธิ ฿${totalFmt} บาท (ค่าห้อง ฿${roomFmt}, ค่าน้ำ ฿${waterFmt}, ค่าไฟ ฿${elecFmt}, บริการส่วนกลาง/อื่นๆ ฿${otherFmt})`;

      const decimalPart = (Number(b.total_amount) % 1).toFixed(2);
      if (Number(decimalPart) > 0) {
        message += `\n💡 ระบบได้สร้างเศษสตางค์ระบุตัวตน (.${decimalPart.slice(2)} ฿) สำหรับห้องคุณโดยเฉพาะ กรุณาโอนเงินตรงตามทศนิยม หรือสแกน QR Code เพื่อให้ระบบอนุมัติบิลอัตโนมัติทันทีครับ`;
      } else {
        message += `\nกรุณาตรวจสอบรายละเอียดและชำระเงินผ่านระบบ ขอบคุณครับ`;
      }

      await db.query(
        "INSERT INTO dorm_notifications (user_id, title, message, category, is_read) VALUES (?, ?, ?, 'bill', FALSE)",
        [userId || null, title, message]
      );

      notifiedList.push({
        room_number: b.room_number,
        tenant_name: b.tenant_name,
        total_amount: b.total_amount,
        user_id: userId,
      });
    }

    res.json({
      success: true,
      message: `ส่งแจ้งเตือนบิลประจำงวด ${targetPeriod} เรียบร้อยแล้ว (จำนวน ${notifiedList.length} ห้อง)`,
      count: notifiedList.length,
      notified_rooms: notifiedList,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

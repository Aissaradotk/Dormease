/**
 * =================================================================================================
 * Resident KYC & Identity Verification API (src/routes/residentVerifications.js)
 * =================================================================================================
 * จัดการกระบวนการยืนยันตัวตนของผู้พักอาศัย (KYC) ก่อนส่งมอบกุญแจห้อง
 * 
 * หน้าที่หลัก (Core Functions):
 * 1. POST /api/resident-verifications       : ผู้เช่ากรอกข้อมูลบัตรประชาชน (คนไทย) หรือพาสปอร์ต (ต่างชาติ)
 * 2. GET  /api/resident-verifications/my    : ผู้เช่าตรวจสอบสถานะการยืนยันตัวตน
 * 3. GET  /api/admin/resident-verifications : เจ้าของหอพักดูรายการเอกสารรอตรวจสอบ
 * 4. PUT  /api/admin/resident-verifications/:id/verify : แอดมินอนุมัติ (verified) หรือปฏิเสธเอกสาร
 * 
 * การเชื่อมต่อในระบบ (System Connections):
 * - Frontend Pages:
 *   • `pages/ResidentVerificationPage.jsx`   (หน้าฟอร์มกรอกข้อมูลและอัปโหลดรูปบัตรของผู้เช่า)
 *   • `pages/AdminResidentVerifications.jsx` (หน้าตรวจสอบและอนุมัติบัตรของแอดมิน)
 * - Database Tables:
 *   • `resident_verifications` (ตารางหลักเก็บประวัติ KYC และข้อมูลประจำตัว)
 *   • `dorm_bookings`          (เชื่อมต่อรหัสการจอง)
 * =================================================================================================
 */

import { Router } from "express";
import db from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

/**
 * -------------------------------------------------------------------------------------------------
 * 1. POST /api/resident-verifications : ผู้เช่ายื่นข้อมูลและหลักฐานยืนยันตัวตน
 * -------------------------------------------------------------------------------------------------
 * เชื่อมกับ: pages/ResidentVerificationPage.jsx
 * รองรับทั้ง resident_type: 'thai' (บัตร ปชช. 13 หลัก) และ 'foreigner' (พาสปอร์ต)
 */
router.post("/", requireAuth, async (req, res) => {
  try {
    const {
      booking_id,
      resident_type,
      first_name,
      last_name,
      national_id,
      passport_no,
      nationality,
      date_of_birth,
      phone,
    } = req.body;

    if (!booking_id || !first_name || !last_name || !phone) {
      return res.status(400).json({ error: "กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน" });
    }

    if (resident_type === "thai" && !national_id) {
      return res.status(400).json({ error: "กรุณาระบุเลขบัตรประชาชน 13 หลัก" });
    }

    if (resident_type === "foreigner" && (!passport_no || !nationality)) {
      return res.status(400).json({ error: "กรุณาระบุเลขหนังสือเดินทางและสัญชาติ" });
    }

    const [bookings] = await db.query("SELECT * FROM dorm_bookings WHERE id = ?", [booking_id]);
    if (!bookings.length) return res.status(404).json({ error: "ไม่พบการจองนี้" });

    const [result] = await db.query(
      `INSERT INTO resident_verifications 
        (user_id, booking_id, resident_type, first_name, last_name, national_id, passport_no, nationality, date_of_birth, phone, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')`,
      [
        req.user.id,
        booking_id,
        resident_type || "thai",
        first_name,
        last_name,
        resident_type === "thai" ? national_id : null,
        resident_type === "foreigner" ? passport_no : null,
        resident_type === "foreigner" ? nationality : "Thai",
        date_of_birth || null,
        phone,
      ]
    );

    const [created] = await db.query("SELECT * FROM resident_verifications WHERE id = ?", [result.insertId]);
    res.status(201).json(created[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET tenant's resident verifications
router.get("/my", requireAuth, async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT v.*, b.room_id, r.room_number, r.room_type, b.check_in_date
       FROM resident_verifications v
       JOIN dorm_bookings b ON v.booking_id = b.id
       LEFT JOIN dorm_rooms r ON b.room_id = r.id
       WHERE v.user_id = ?
       ORDER BY v.id DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET all resident verifications for admin
async function getAdminVerifs(req, res) {
  try {
    const [rows] = await db.query(
      `SELECT v.*, u.email, b.room_id, r.room_number, r.room_type, b.check_in_date
       FROM resident_verifications v
       JOIN dorm_users u ON v.user_id = u.id
       JOIN dorm_bookings b ON v.booking_id = b.id
       LEFT JOIN dorm_rooms r ON b.room_id = r.id
       ORDER BY v.id DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

router.get("/admin", requireAuth, requireRole("owner"), getAdminVerifs);

router.get("/", requireAuth, async (req, res) => {
  if (req.user.role === "owner") return getAdminVerifs(req, res);
  try {
    const [rows] = await db.query(
      `SELECT v.*, b.room_id, r.room_number, r.room_type, b.check_in_date
       FROM resident_verifications v
       JOIN dorm_bookings b ON v.booking_id = b.id
       LEFT JOIN dorm_rooms r ON b.room_id = r.id
       WHERE v.user_id = ?
       ORDER BY v.id DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH approve verification (owner)
router.patch("/:id/approve", requireAuth, requireRole("owner"), async (req, res) => {
  try {
    const adminName = req.user.full_name || req.user.email || "Admin";

    // อัปเดตสถานะยืนยันตัวตน
    await db.query(
      `UPDATE resident_verifications 
       SET status = 'verified', verified_by = ?, verified_at = NOW() 
       WHERE id = ?`,
      [adminName, req.params.id]
    );

    // ดึงข้อมูลเพื่อสร้างหรืออัปเดตผู้เช่าจริงเข้าห้อง
    const [verifs] = await db.query(
      "SELECT v.*, b.room_id, b.check_in_date, b.user_id FROM resident_verifications v JOIN dorm_bookings b ON v.booking_id = b.id WHERE v.id = ?",
      [req.params.id]
    );

    if (verifs.length > 0) {
      const v = verifs[0];
      // ปรับสถานะห้องเป็น occupied
      await db.query("UPDATE dorm_rooms SET status = 'occupied' WHERE id = ?", [v.room_id]);

      // เคลียร์ผู้เช่าเก่าในห้องนี้ที่สถานะยัง active อยู่ (ป้องกันห้องมีผู้เช่าซ้อน)
      await db.query(
        "UPDATE dorm_tenants SET status = 'moved_out', room_id = NULL WHERE room_id = ? AND user_id != ?",
        [v.room_id, v.user_id]
      );

      // ตรวจสอบว่ามีแถวผู้เช่าเดิมของ user_id นี้อยู่แล้วหรือไม่ ถ้ามีให้อัปเดต ถ้าไม่มีให้สร้างใหม่
      const [existingTenant] = await db.query(
        "SELECT id FROM dorm_tenants WHERE user_id = ? ORDER BY id DESC LIMIT 1",
        [v.user_id]
      );

      if (existingTenant.length > 0) {
        await db.query(
          "UPDATE dorm_tenants SET room_id = ?, full_name = ?, phone = ?, start_date = ?, status = 'active', end_date = NULL WHERE id = ?",
          [v.room_id, `${v.first_name} ${v.last_name}`, v.phone, v.check_in_date || new Date(), existingTenant[0].id]
        );
      } else {
        await db.query(
          "INSERT INTO dorm_tenants (user_id, room_id, full_name, phone, start_date, status) VALUES (?, ?, ?, ?, ?, 'active')",
          [v.user_id, v.room_id, `${v.first_name} ${v.last_name}`, v.phone, v.check_in_date || new Date()]
        );
      }
    }

    res.json({ success: true, message: "ยืนยันข้อมูลผู้เข้าพักและอนุมัติเข้าอยู่สำเร็จ" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH reject verification (owner)
router.patch("/:id/reject", requireAuth, requireRole("owner"), async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ error: "กรุณาระบุเหตุผลในการปฏิเสธ" });
    await db.query(
      `UPDATE resident_verifications 
       SET status = 'rejected', rejection_reason = ? 
       WHERE id = ?`,
      [reason, req.params.id]
    );
    res.json({ success: true, message: "ปฏิเสธข้อมูลผู้เข้าพักเรียบร้อยแล้ว" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

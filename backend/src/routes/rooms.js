/**
 * =================================================================================================
 * Room Management API Routes (src/routes/rooms.js)
 * =================================================================================================
 * ไฟล์นี้ดูแลระบบผังห้องพักและสถานะห้องพักทั้งหมด (เฉพาะ Role: owner)
 * 
 * หน้าที่หลัก (Core Functions):
 * 1. GET  /api/rooms     : ดึงรายการห้องพักทั้งหมด เรียงตามเลขห้อง (พร้อมสถานะ ว่าง, มีผู้เช่า, จองแล้ว)
 * 2. POST /api/rooms     : เพิ่มห้องพักใหม่เข้าสู่ระบบ (กำหนดประเภทห้อง ราคาเช่า ชั้น ขนาด)
 * 3. PUT  /api/rooms/:id : แก้ไขข้อมูลหรือสถานะห้องพัก (available, occupied, maintenance, reserved)
 * 4. DELETE /api/rooms/:id : ลบห้องพัก (ตรวจสอบว่าไม่มีผู้เช่าค้างอยู่)
 * 
 * การเชื่อมต่อในระบบ (System Connections):
 * - Frontend: `pages/Rooms.jsx` ผ่าน `api.get('/rooms')`, `api.post('/rooms')`, `api.put(...)`
 * - Database: ตาราง `dorm_rooms` (จัดเก็บข้อมูลสเปกห้องพัก สถานะ และราคา)
 * - Middleware: `requireAuth` + `requireRole('owner')` ล็อกสิทธิ์เฉพาะเจ้าของหอพักเท่านั้น
 * =================================================================================================
 */

import { Router } from "express";
import db from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();
// จำกัดสิทธิ์เฉพาะเจ้าของหอพัก (Owner Only)
router.use(requireAuth, requireRole("owner"));

/**
 * -------------------------------------------------------------------------------------------------
 * GET /api/rooms : ดึงรายการห้องพักทั้งหมด
 * -------------------------------------------------------------------------------------------------
 */
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM dorm_rooms ORDER BY room_number ASC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * -------------------------------------------------------------------------------------------------
 * POST /api/rooms : เพิ่มห้องพักใหม่
 * -------------------------------------------------------------------------------------------------
 * Input Body: { room_number, room_type, price, floor, size, description }
 */
router.post("/", async (req, res) => {
  try {
    const { room_number, room_type, price, floor, size, description } = req.body;
    if (!room_number) return res.status(400).json({ error: "กรุณากรอกหมายเลขห้อง" });

    const [result] = await db.query(
      "INSERT INTO dorm_rooms (room_number, room_type, price, floor, size, description) VALUES (?, ?, ?, ?, ?, ?)",
      [room_number.trim(), room_type || null, price || null, floor || null, size || null, description || null]
    );

    const [created] = await db.query("SELECT * FROM dorm_rooms WHERE id = ?", [result.insertId]);
    res.status(201).json(created[0]);
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ error: "หมายเลขห้องนี้มีอยู่ในระบบแล้ว" });
    }
    res.status(400).json({ error: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { room_number, room_type, price, floor, size, description, status } = req.body;

    await db.query(
      `UPDATE dorm_rooms 
       SET room_number = COALESCE(?, room_number),
           room_type = COALESCE(?, room_type),
           price = ?,
           floor = ?,
           size = COALESCE(?, size),
           description = COALESCE(?, description),
           status = COALESCE(?, status)
       WHERE id = ?`,
      [
        room_number || null,
        room_type || null,
        price || null,
        floor || null,
        size || null,
        description || null,
        status || null,
        id,
      ]
    );

    const [updated] = await db.query("SELECT * FROM dorm_rooms WHERE id = ?", [id]);
    if (updated.length === 0) return res.status(404).json({ error: "ไม่พบห้องพักนี้" });
    res.json(updated[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    const [activeTenants] = await db.query(
      "SELECT id FROM dorm_tenants WHERE room_id = ? AND status = 'active' LIMIT 1",
      [id]
    );

    if (activeTenants.length > 0) {
      return res.status(400).json({ error: "ลบไม่ได้ ห้องนี้ยังมีผู้เช่าอยู่ กรุณาย้ายผู้เช่าออกก่อน" });
    }

    await db.query("DELETE FROM dorm_rooms WHERE id = ?", [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;

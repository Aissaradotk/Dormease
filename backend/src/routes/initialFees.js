import { Router } from "express";
import db from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

// ฟังก์ชันวิเคราะห์ขนาดห้อง: เล็ก (1) หรือ ใหญ่ (2)
export function getRoomCategory(room) {
  const sizeNum = parseFloat(room.size) || 0;
  const isLarge = sizeNum > 26 ||
                  /suite|1-bedroom|corner|vip|deluxe|ใหญ่/i.test(room.room_type || "") ||
                  (Number(room.price) >= 4000);
  return isLarge
    ? { id: 2, key: "large", label: "ห้องขนาดใหญ่ (Large Room)" }
    : { id: 1, key: "small", label: "ห้องขนาดเล็ก (Small Room)" };
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/initial-fees
// ดึงอัตราค่าแรกเข้าแยกตามประเภทห้องขนาดเล็ก (1) และห้องขนาดใหญ่ (2)
// ─────────────────────────────────────────────────────────────────────────────
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM room_initial_fees ORDER BY room_type_id ASC, id ASC"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/initial-fees/calculate-by-room/:roomId
// คำนวณยอดรวมทุกอย่างในรอบเดียว (ค่าเช่างวดแรก + ค่าประกัน + ค่าคีย์การ์ด) ตามขนาดห้อง
// ─────────────────────────────────────────────────────────────────────────────
router.get("/calculate-by-room/:roomId", async (req, res) => {
  try {
    const [rooms] = await db.query("SELECT * FROM dorm_rooms WHERE id = ?", [req.params.roomId]);
    if (!rooms.length) return res.status(404).json({ error: "ไม่พบข้อมูลห้องพัก" });
    const room = rooms[0];

    const category = getRoomCategory(room);

    // ดึงค่าแรกเข้าที่ Admin กำหนดไว้สำหรับห้องประเภทนี้
    let [fees] = await db.query(
      "SELECT * FROM room_initial_fees WHERE room_type_id = ? AND is_active = 1",
      [category.id]
    );

    if (!fees.length) {
      // Default ค่าแรกเข้าตามขนาดห้อง
      fees = category.id === 2
        ? [
            { id: "def_l1", fee_name: "ค่าประกัน", amount: 5000, description: "ค่าประกันห้องขนาดใหญ่" },
            { id: "def_l2", fee_name: "ค่าคีย์การ์ด", amount: 500, description: "ค่าคีย์การ์ดเข้า-ออก (2 ใบ)" },
          ]
        : [
            { id: "def_s1", fee_name: "ค่าประกัน", amount: 3000, description: "ค่าประกันห้องขนาดเล็ก" },
            { id: "def_s2", fee_name: "ค่าคีย์การ์ด", amount: 300, description: "ค่าคีย์การ์ดเข้า-ออกประตู" },
          ];
    }

    // รวมค่าเช่างวดแรกเข้ากับค่าประกันและค่าคีย์การ์ดในรอบเดียว
    const roomRent = Number(room.price) || 0;
    const items = [
      {
        id: "rent",
        fee_name: "ค่าเช่าห้องพักงวดแรก (First Month Rent)",
        amount: roomRent,
        description: `ค่าห้องประจำเดือน ${room.room_number}`,
        is_rent: true,
      },
      ...fees.map(f => ({ ...f, amount: Number(f.amount) })),
    ];

    const total_amount = items.reduce((sum, item) => sum + Number(item.amount), 0);

    res.json({
      room,
      category,
      items,
      total_amount,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/initial-fees/booking/:bookingId
// หรือ GET /api/bookings/:bookingId/move-in-fees
// ─────────────────────────────────────────────────────────────────────────────
router.get("/booking/:bookingId", requireAuth, async (req, res) => {
  try {
    const [bookings] = await db.query(
      `SELECT b.*, r.room_number, r.room_type, r.price, r.size, r.floor
       FROM dorm_bookings b 
       JOIN dorm_rooms r ON b.room_id = r.id 
       WHERE b.id = ?`,
      [req.params.bookingId]
    );
    if (!bookings.length) return res.status(404).json({ error: "ไม่พบการจองนี้" });
    const b = bookings[0];

    if (req.user.role === "tenant" && b.user_id !== req.user.id) {
      return res.status(403).json({ error: "ไม่มีสิทธิ์เข้าถึงการจองนี้" });
    }

    const category = getRoomCategory(b);

    // ดึงค่าแรกเข้าสำหรับหมวดหมู่นี้
    let [fees] = await db.query(
      "SELECT * FROM room_initial_fees WHERE room_type_id = ? AND is_active = 1",
      [category.id]
    );

    if (!fees.length) {
      fees = category.id === 2
        ? [
            { id: "def_l1", fee_name: "ค่าประกัน", amount: 5000, description: "ค่าประกันห้องขนาดใหญ่" },
            { id: "def_l2", fee_name: "ค่าคีย์การ์ด", amount: 500, description: "ค่าคีย์การ์ดเข้า-ออก (2 ใบ)" },
          ]
        : [
            { id: "def_s1", fee_name: "ค่าประกัน", amount: 3000, description: "ค่าประกันห้องขนาดเล็ก" },
            { id: "def_s2", fee_name: "ค่าคีย์การ์ด", amount: 300, description: "ค่าคีย์การ์ดเข้า-ออกประตู" },
          ];
    }

    const roomRent = Number(b.price) || 0;
    const items = [
      {
        id: "rent",
        fee_name: "ค่าเช่าห้องพักงวดแรก (First Month Rent)",
        amount: roomRent,
        description: `ค่าห้องพัก ${b.room_number}`,
        is_rent: true,
      },
      ...fees.map(f => ({ ...f, amount: Number(f.amount) })),
    ];

    const total_amount = items.reduce((sum, item) => sum + Number(item.amount), 0);

    res.json({
      booking: b,
      category,
      items,
      total_amount,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/initial-fees (Owner only)
// เพิ่มรายการค่าใช้จ่ายสำหรับห้องขนาดเล็ก (1) หรือห้องขนาดใหญ่ (2)
// ─────────────────────────────────────────────────────────────────────────────
router.post("/", requireAuth, requireRole("owner"), async (req, res) => {
  try {
    const { room_type_id, fee_name, amount, description, is_active } = req.body;
    if (!fee_name || amount === undefined) {
      return res.status(400).json({ error: "กรุณาระบุชื่อค่าใช้จ่ายและจำนวนเงิน" });
    }

    const categoryId = Number(room_type_id) === 2 ? 2 : 1;

    const [result] = await db.query(
      "INSERT INTO room_initial_fees (room_type_id, fee_name, amount, description, is_active) VALUES (?, ?, ?, ?, ?)",
      [categoryId, fee_name, amount, description || null, is_active ?? 1]
    );

    const [created] = await db.query("SELECT * FROM room_initial_fees WHERE id = ?", [result.insertId]);
    res.status(201).json(created[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUT /api/initial-fees/:id (Owner only)
// ─────────────────────────────────────────────────────────────────────────────
router.put("/:id", requireAuth, requireRole("owner"), async (req, res) => {
  try {
    const { room_type_id, fee_name, amount, description, is_active } = req.body;
    await db.query(
      `UPDATE room_initial_fees 
       SET room_type_id = COALESCE(?, room_type_id),
           fee_name = COALESCE(?, fee_name),
           amount = COALESCE(?, amount),
           description = COALESCE(?, description),
           is_active = COALESCE(?, is_active)
       WHERE id = ?`,
      [room_type_id, fee_name, amount, description, is_active, req.params.id]
    );
    const [updated] = await db.query("SELECT * FROM room_initial_fees WHERE id = ?", [req.params.id]);
    res.json(updated[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/initial-fees/:id (Owner only)
// ─────────────────────────────────────────────────────────────────────────────
router.delete("/:id", requireAuth, requireRole("owner"), async (req, res) => {
  try {
    await db.query("DELETE FROM room_initial_fees WHERE id = ?", [req.params.id]);
    res.json({ message: "ลบรายการเรียบร้อยแล้ว" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

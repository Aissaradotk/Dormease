import { Router } from "express";
import db from "../db.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

// คืนข้อมูลโปรไฟล์ของผู้ใช้ที่ login อยู่
router.get("/me", requireAuth, async (req, res) => {
  res.json(req.user);
});

// อัปเดตข้อมูลโปรไฟล์
router.put("/me", requireAuth, async (req, res) => {
  try {
    const { full_name, phone } = req.body;
    await db.query(
      "UPDATE dorm_users SET full_name = COALESCE(?, full_name), phone = COALESCE(?, phone) WHERE id = ?",
      [full_name, phone, req.user.id]
    );

    const [rows] = await db.query(
      "SELECT id, full_name, email, phone, role FROM dorm_users WHERE id = ?",
      [req.user.id]
    );

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

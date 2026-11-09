import { Router } from "express";
import db from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

// GET notice settings (open to all users so tenants know calendar restrictions)
router.get("/notice-days", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM dorm_settings WHERE id = 1 LIMIT 1");
    if (rows.length === 0) {
      return res.json({ move_in_notice_days: 1, move_out_notice_days: 30 });
    }
    res.json({
      move_in_notice_days: Number(rows[0].move_in_notice_days) || 1,
      move_out_notice_days: Number(rows[0].move_out_notice_days) || 30,
      updated_at: rows[0].updated_at
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET / alias
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM dorm_settings WHERE id = 1 LIMIT 1");
    if (rows.length === 0) {
      return res.json({ move_in_notice_days: 1, move_out_notice_days: 30 });
    }
    res.json({
      move_in_notice_days: Number(rows[0].move_in_notice_days) || 1,
      move_out_notice_days: Number(rows[0].move_out_notice_days) || 30,
      updated_at: rows[0].updated_at
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Helper update function
async function updateNoticeSettings(req, res) {
  try {
    const { move_in_notice_days, move_out_notice_days } = req.body;

    let moveInDays = parseInt(move_in_notice_days, 10);
    let moveOutDays = parseInt(move_out_notice_days, 10);

    if (isNaN(moveInDays) || moveInDays < 0) {
      return res.status(400).json({ error: "กรุณาระบุจำนวนวันแจ้งเข้าล่วงหน้าเป็นตัวเลขตั้งแต่ 0 ขึ้นไป" });
    }
    if (isNaN(moveOutDays) || moveOutDays < 0) {
      return res.status(400).json({ error: "กรุณาระบุจำนวนวันแจ้งออกล่วงหน้าเป็นตัวเลขตั้งแต่ 0 ขึ้นไป" });
    }

    await db.query(
      `INSERT INTO dorm_settings (id, move_in_notice_days, move_out_notice_days)
       VALUES (1, ?, ?)
       ON DUPLICATE KEY UPDATE 
         move_in_notice_days = VALUES(move_in_notice_days), 
         move_out_notice_days = VALUES(move_out_notice_days)`,
      [moveInDays, moveOutDays]
    );

    const [updated] = await db.query("SELECT * FROM dorm_settings WHERE id = 1 LIMIT 1");
    res.json({
      success: true,
      message: "บันทึกเงื่อนไขระยะเวลาแจ้งเข้าและแจ้งออกเรียบร้อยแล้ว",
      data: {
        move_in_notice_days: Number(updated[0].move_in_notice_days),
        move_out_notice_days: Number(updated[0].move_out_notice_days),
        updated_at: updated[0].updated_at
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// PUT notice-days (owner/admin only)
router.put("/notice-days", requireAuth, requireRole("owner"), updateNoticeSettings);

// PUT / alias
router.put("/", requireAuth, requireRole("owner"), updateNoticeSettings);

export default router;

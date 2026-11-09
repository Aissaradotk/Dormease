import { Router } from "express";
import db from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

// ผู้เช่าดูประวัติค่าเช่าของตนเอง
router.get("/me", requireAuth, requireRole("tenant"), async (req, res) => {
  try {
    const [tenants] = await db.query("SELECT id FROM dorm_tenants WHERE user_id = ? LIMIT 1", [req.user.id]);
    if (tenants.length === 0) return res.json([]);

    const [rows] = await db.query(
      "SELECT * FROM dorm_payments WHERE tenant_id = ? ORDER BY period DESC, created_at DESC",
      [tenants[0].id]
    );

    res.json(rows);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.use(requireAuth, requireRole("owner"));

// เจ้าของหอพักดูรายการค่าเช่าทั้งหมด
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT p.*, 
              t.full_name,
              r.room_number
       FROM dorm_payments p
       LEFT JOIN dorm_tenants t ON p.tenant_id = t.id
       LEFT JOIN dorm_rooms r ON t.room_id = r.id
       ORDER BY p.period DESC, p.created_at DESC`
    );

    const formatted = rows.map((row) => ({
      id: row.id,
      tenant_id: row.tenant_id,
      amount: row.amount,
      period: row.period,
      status: row.status,
      paid_at: row.paid_at,
      slip_image: row.slip_image,
      payment_source: row.payment_source,
      created_at: row.created_at,
      tenants: {
        full_name: row.full_name || "-",
        rooms: row.room_number ? { room_number: row.room_number } : null,
      },
    }));

    res.json(formatted);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// บันทึกรายการชำระเงินใหม่
router.post("/", async (req, res) => {
  try {
    const { tenant_id, amount, period, status } = req.body;
    if (!tenant_id || !amount || !period) {
      return res.status(400).json({ error: "กรุณากรอกผู้เช่า จำนวนเงิน และงวดให้ครบ" });
    }

    const isPaid = status === "paid";
    const [result] = await db.query(
      "INSERT INTO dorm_payments (tenant_id, amount, period, status, paid_at) VALUES (?, ?, ?, ?, ?)",
      [tenant_id, amount, period.trim(), isPaid ? "paid" : "unpaid", isPaid ? new Date() : null]
    );

    const [created] = await db.query("SELECT * FROM dorm_payments WHERE id = ?", [result.insertId]);
    res.status(201).json(created[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// แก้ไขสถานะหรือข้อมูลการชำระเงิน
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, period, status } = req.body;

    const isPaid = status === "paid";
    await db.query(
      `UPDATE dorm_payments 
       SET amount = COALESCE(?, amount),
           period = COALESCE(?, period),
           status = COALESCE(?, status),
           paid_at = ?
       WHERE id = ?`,
      [amount || null, period || null, status || null, isPaid ? new Date() : null, id]
    );

    const [updated] = await db.query("SELECT * FROM dorm_payments WHERE id = ?", [id]);
    if (updated.length === 0) return res.status(404).json({ error: "ไม่พบรายการนี้" });
    res.json(updated[0]);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// ลบรายการชำระเงิน
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.query("DELETE FROM dorm_payments WHERE id = ?", [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;

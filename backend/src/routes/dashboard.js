/**
 * =================================================================================================
 * Owner Dashboard Statistics API (src/routes/dashboard.js)
 * =================================================================================================
 * ไฟล์นี้ทำหน้าที่รวบรวมสถิติภาพรวมสำคัญของหอพัก เพื่อแสดงผลบนแดชบอร์ดหลักของเจ้าของหอพัก
 * 
 * ข้อมูลที่ประมวลผล (Aggregated Metrics):
 * 1. totalRooms      : จำนวนห้องพักทั้งหมดในหอพัก
 * 2. availableRooms  : จำนวนห้องว่างพร้อมเปิดรับผู้เช่าใหม่
 * 3. occupiedRooms   : จำนวนห้องที่มีผู้พักอาศัยอยู่ปัจจุบัน
 * 4. totalTenants    : จำนวนผู้เช่าที่ยังมีสถานะ Active
 * 5. unpaidPayments  : จำนวนบิลค่าใช้จ่ายประจำเดือนที่ยังค้างชำระ
 * 6. pendingCerts    : จำนวนคำขอหนังสือรับรองที่พักที่รอการอนุมัติ
 * 
 * การเชื่อมต่อในระบบ (System Connections):
 * - Frontend: `pages/Dashboard.jsx` เรียกใช้งานผ่าน `api.get('/dashboard/stats')`
 * - Database Tables: `dorm_rooms`, `dorm_tenants`, `dorm_bills`, `residence_certificates`
 * - Middleware: `requireAuth` + `requireRole('owner')`
 * =================================================================================================
 */

import { Router } from "express";
import db from "../db.js";
import { requireAuth, requireRole } from "../middleware/auth.js";

const router = Router();

/**
 * GET /api/dashboard/stats : ดึงตัวเลขสรุปภาพรวมหอพักทั้งหมด
 * รันคำสั่ง SQL Query พร้อมกันด้วย Promise.all เพื่อลด Latency ในการตอบสนอง
 */
router.get("/stats", requireAuth, requireRole("owner"), async (req, res) => {
  try {
    const [
      [totalRoomsRow],
      [availableRoomsRow],
      [occupiedRoomsRow],
      [totalTenantsRow],
      [unpaidPaymentsRow],
      [pendingCertsRow],
    ] = await Promise.all([
      db.query("SELECT COUNT(*) AS count FROM dorm_rooms"),
      db.query("SELECT COUNT(*) AS count FROM dorm_rooms WHERE status = 'available'"),
      db.query("SELECT COUNT(*) AS count FROM dorm_rooms WHERE status = 'occupied'"),
      db.query("SELECT COUNT(*) AS count FROM dorm_tenants WHERE status = 'active'"),
      db.query("SELECT COUNT(*) AS count FROM dorm_bills WHERE status != 'paid' AND status != 'approved'"),
      db.query("SELECT COUNT(*) AS count FROM residence_certificates WHERE status = 'pending'").catch(() => [[{ count: 0 }]]),
    ]);

    res.json({
      totalRooms: totalRoomsRow[0]?.count || 0,
      availableRooms: availableRoomsRow[0]?.count || 0,
      occupiedRooms: occupiedRoomsRow[0]?.count || 0,
      totalTenants: totalTenantsRow[0]?.count || 0,
      unpaidPayments: unpaidPaymentsRow[0]?.count || 0,
      pendingCerts: pendingCertsRow[0]?.count || 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;

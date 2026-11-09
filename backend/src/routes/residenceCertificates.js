import express from "express";
import { requireAuth, requireRole } from "../middleware/auth.js";
import db from "../db.js";

const router = express.Router();

// ─── Helper: build PDF buffer ────────────────────────────────────────────────
function buildPDF(cert) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 72 });
    const chunks = [];
    doc.on("data", (c) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const lang = cert.language || "en";
    const isTH = lang === "th";

    // ── Header ──────────────────────────────────────────────────────────────
    doc.rect(72, 72, 451, 90).fill("#0f5144");
    doc.fillColor("#ffffff")
      .fontSize(22)
      .font("Helvetica-Bold")
      .text(
        isTH ? "ใบรับรองถิ่นที่อยู่" : "Certificate of Residence",
        72, 92, { align: "center", width: 451 }
      );
    doc.fontSize(11)
      .font("Helvetica")
      .text("DormEase Dormitory Management System", 72, 128, {
        align: "center",
        width: 451,
      });

    // ── Body ─────────────────────────────────────────────────────────────────
    const L = {
      th: {
        fullName: "ชื่อ-นามสกุล",
        passport: "เลขหนังสือเดินทาง",
        nationality: "สัญชาติ",
        dob: "วันเดือนปีเกิด",
        address: "ที่อยู่",
        checkin: "วันที่เข้าพัก",
        appDate: "วันที่ยื่นคำร้อง",
        phone: "เบอร์โทรศัพท์",
        signature: "ลายมือชื่อ",
        approvedDate: "วันที่อนุมัติ",
        authorizedBy: "อนุมัติโดย",
        footer: "เอกสารนี้ออกโดยระบบจัดการหอพัก DormEase",
      },
      en: {
        fullName: "Full Name",
        passport: "Passport No.",
        nationality: "Nationality",
        dob: "Date of Birth",
        address: "Address",
        checkin: "Check-in Date",
        appDate: "Application Date",
        phone: "Phone Number",
        signature: "Signature",
        approvedDate: "Approved Date",
        authorizedBy: "Authorized By",
        footer: "This document is issued by DormEase Dormitory Management System.",
      },
    };
    const lbl = isTH ? L.th : L.en;

    let y = 190;
    const left = 90;
    const valX = 280;
    const rowH = 28;

    doc.fillColor("#1a1a1a").fontSize(10.5).font("Helvetica");

    const fields = [
      [lbl.fullName, cert.full_name],
      [lbl.passport, cert.passport_no],
      [lbl.nationality, cert.nationality],
      [lbl.dob, cert.date_of_birth?.toString().slice(0, 10) || ""],
      [lbl.address, cert.address],
      [lbl.checkin, cert.check_in_date?.toString().slice(0, 10) || ""],
      [lbl.appDate, cert.application_date?.toString().slice(0, 10) || ""],
      [lbl.phone, cert.phone],
      [lbl.signature, cert.signature],
    ];

    fields.forEach(([label, value], i) => {
      if (i % 2 === 0) {
        doc.rect(left - 8, y - 4, 455, rowH).fill("#f4f7f5");
      }
      doc.fillColor("#3d564e").font("Helvetica-Bold").text(label + ":", left, y);
      doc.fillColor("#0f201b").font("Helvetica").text(String(value || ""), valX, y, {
        width: 240,
      });
      y += rowH;
    });

    // ── Approval section ─────────────────────────────────────────────────────
    y += 20;
    doc.moveTo(left, y).lineTo(521, y).strokeColor("#0f5144").lineWidth(1).stroke();
    y += 16;
    doc.fillColor("#0f5144").font("Helvetica-Bold").fontSize(11)
      .text(lbl.approvedDate + ":", left, y);
    doc.fillColor("#0f201b").font("Helvetica")
      .text(cert.approved_at?.toString().slice(0, 10) || "", valX, y);
    y += rowH;
    doc.fillColor("#0f5144").font("Helvetica-Bold")
      .text(lbl.authorizedBy + ":", left, y);
    doc.fillColor("#0f201b").font("Helvetica")
      .text(cert.approved_by || "Admin", valX, y);

    // ── Footer ───────────────────────────────────────────────────────────────
    doc.fontSize(8.5).fillColor("#888")
      .text(lbl.footer, 72, 750, { align: "center", width: 451 });
    doc.text("Generated: " + new Date().toISOString().slice(0, 10), 72, 762, {
      align: "center",
      width: 451,
    });

    doc.end();
  });
}

// ─── TENANT ROUTES ───────────────────────────────────────────────────────────

// POST /api/residence-certificates — submit new application
router.post("/", requireAuth, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      language, full_name, passport_no, nationality, date_of_birth,
      address, check_in_date, application_date, phone, signature,
    } = req.body;

    if (!full_name || !passport_no || !nationality || !date_of_birth ||
        !address || !check_in_date || !phone || !signature) {
      return res.status(400).json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน / Please fill all required fields." });
    }

    const [result] = await db.execute(
      `INSERT INTO residence_certificates
        (user_id, language, full_name, passport_no, nationality, date_of_birth,
         address, check_in_date, application_date, phone, signature)
       VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
      [userId, language || "en", full_name, passport_no, nationality,
       date_of_birth, address, check_in_date,
       application_date || new Date().toISOString().slice(0, 10),
       phone, signature]
    );

    // แจ้งเตือนไปยัง Admin/Owner ทุกคนเมื่อมีคำขอใหม่
    try {
      const [owners] = await db.query("SELECT id FROM dorm_users WHERE role = 'owner'");
      for (const o of owners) {
        await db.query(
          "INSERT INTO dorm_notifications (user_id, title, message, category) VALUES (?, ?, ?, 'residence_cert')",
          [
            o.id,
            "📄 มีคำร้องขอใบรับรองถิ่นที่อยู่ใหม่",
            `คุณ ${full_name} (${nationality}, Passport: ${passport_no}) ได้ส่งคำร้องขอใบรับรองถิ่นที่อยู่ รอดำเนินการตรวจสอบและอนุมัติ`,
            "residence_cert",
          ]
        );
      }
    } catch (notifErr) {
      console.error("Failed to notify owners of new residence cert:", notifErr);
    }

    res.status(201).json({
      message: "ส่งคำขอเรียบร้อยแล้ว กรุณารอ Admin ตรวจสอบและอนุมัติ",
      id: result.insertId,
      status: "pending",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/residence-certificates/my
router.get("/my", requireAuth, async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT id, language, full_name, passport_no, nationality, status,
              rejection_reason, approved_by, approved_at, application_date, created_at
       FROM residence_certificates
       WHERE user_id = ?
       ORDER BY id DESC`,
      [req.user.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/residence-certificates/:id
router.get("/:id", requireAuth, async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT * FROM residence_certificates WHERE id = ? AND user_id = ?`,
      [req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/residence-certificates/:id/download — MUST be approved, returns JSON for frontend print
router.get("/:id/download", requireAuth, async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT * FROM residence_certificates WHERE id = ? AND user_id = ?`,
      [req.params.id, req.user.id]
    );
    if (!rows.length) return res.status(404).json({ error: "Not found" });
    const cert = rows[0];

    if (cert.status !== "approved") {
      return res.status(403).json({
        error: "คำขอยังไม่ได้รับการอนุมัติ / Application not approved yet.",
      });
    }

    // Return cert data — frontend generates PDF via browser print
    res.json({ ...cert, _printReady: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// ─── ADMIN ROUTES ─────────────────────────────────────────────────────────────

// GET /api/residence-certificates/admin/list
router.get("/admin/list", requireAuth, requireRole("owner"), async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT rc.*, u.full_name AS user_display_name, u.email
       FROM residence_certificates rc
       LEFT JOIN dorm_users u ON rc.user_id = u.id
       ORDER BY rc.id DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// GET /api/residence-certificates/admin/detail/:id
router.get("/admin/detail/:id", requireAuth, requireRole("owner"), async (req, res) => {
  try {
    const [rows] = await db.execute(
      `SELECT rc.*, u.full_name AS user_display_name, u.email
       FROM residence_certificates rc
       LEFT JOIN dorm_users u ON rc.user_id = u.id
       WHERE rc.id = ?`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// PATCH /api/residence-certificates/admin/approve/:id
router.patch("/admin/approve/:id", requireAuth, requireRole("owner"), async (req, res) => {
  try {
    const adminName = req.user.full_name || req.user.email || "Admin";
    await db.execute(
      `UPDATE residence_certificates
       SET status='approved', approved_by=?, approved_at=NOW(), updated_at=NOW()
       WHERE id=?`,
      [adminName, req.params.id]
    );

    // แจ้งเตือนไปยังลูกบ้าน
    try {
      const [certRows] = await db.query(
        "SELECT user_id, full_name FROM residence_certificates WHERE id = ?",
        [req.params.id]
      );
      if (certRows.length) {
        await db.query(
          "INSERT INTO dorm_notifications (user_id, title, message, category) VALUES (?, ?, ?, 'residence_cert')",
          [
            certRows[0].user_id,
            "✅ ใบรับรองถิ่นที่อยู่ได้รับการอนุมัติแล้ว",
            `คำร้องขอใบรับรองถิ่นที่อยู่ของคุณได้รับการอนุมัติเรียบร้อยแล้ว สามารถดูและพิมพ์เอกสารได้ในระบบ`,
            "residence_cert",
          ]
        );
      }
    } catch (e) {
      console.error("Failed to notify tenant on approve:", e);
    }

    res.json({ message: "Approved successfully", status: "approved" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// PATCH /api/residence-certificates/admin/reject/:id
router.patch("/admin/reject/:id", requireAuth, requireRole("owner"), async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ error: "Rejection reason required" });
    await db.execute(
      `UPDATE residence_certificates
       SET status='rejected', rejection_reason=?, updated_at=NOW()
       WHERE id=?`,
      [reason, req.params.id]
    );

    // แจ้งเตือนไปยังลูกบ้าน
    try {
      const [certRows] = await db.query(
        "SELECT user_id, full_name FROM residence_certificates WHERE id = ?",
        [req.params.id]
      );
      if (certRows.length) {
        await db.query(
          "INSERT INTO dorm_notifications (user_id, title, message, category) VALUES (?, ?, ?, 'residence_cert')",
          [
            certRows[0].user_id,
            "❌ คำร้องขอใบรับรองถิ่นที่อยู่ถูกปฏิเสธ",
            `คำร้องขอใบรับรองถิ่นที่อยู่ของคุณถูกปฏิเสธ เนื่องจาก: ${reason}`,
            "residence_cert",
          ]
        );
      }
    } catch (e) {
      console.error("Failed to notify tenant on reject:", e);
    }

    res.json({ message: "Rejected", status: "rejected" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;

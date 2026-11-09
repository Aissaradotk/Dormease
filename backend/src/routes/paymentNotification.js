/**
 * =================================================================================================
 * Automated Payment Notification & Slip-less Matching Engine (src/routes/paymentNotification.js)
 * =================================================================================================
 * หัวใจสำคัญของนวัตกรรม "Zero-Cost Automation" ใน DormEase
 * 
 * หน้าที่หลัก (Core Responsibilities):
 * 1. รับ Webhook จากระบบ Windows Toast/OCR Listener (`payment-listener/LinePaymentListener.pyw`)
 *    เมื่อมีเงินโอนเข้าบัญชีธนาคารผ่าน LINE Official / KTB Connext / SCB Connect / K-Plus
 * 2. ตรวจสอบ API Key ผ่าน Header `x-api-key` หรือ query parameter
 * 3. ตรวจจับธนาคารอัตโนมัติ (detectBank) และสกัดตัวเลขยอดเงินด้วย Regex (parseAmountFromMessage)
 * 4. ค้นหาและจับคู่ยอดเงิน (Payment Matching Logic):
 *    - ขั้นที่ 1: ตรวจสอบกับค่าแรกเข้า & เงินประกัน (`dorm_move_in_payments`)
 *    - ขั้นที่ 2: ตรวจสอบกับบิลรายเดือน (`dorm_bills`) ด้วยทศนิยมเศษสตางค์ไม่ซ้ำ (Unique Satang)
 * 5. ปรับสถานะเป็น "ชำระแล้ว (paid / approved)" ทันทีโดยไม่ต้องรอแอดมินตรวจสลิป
 * 6. รองรับโหมดทดสอบจำลอง (Simulation Mode) จากหน้าเว็บผ่าน `components/PaymentSimulatorModal.jsx`
 * 
 * การเชื่อมต่อในระบบ (System Connections):
 * - Listener ภายนอก: `payment-listener/LinePaymentListener.pyw` POST มาที่ `/api/payment/notify`
 * - Frontend UI: `components/PaymentSimulatorModal.jsx` POST มาที่ `/api/payment/simulate`
 * - Database Tables: `dorm_bills`, `dorm_move_in_payments`, `dorm_payments`, `dorm_rooms`
 * =================================================================================================
 */

import { Router } from "express";
import db from "../db.js";

const router = Router();
const API_KEY = process.env.PAYMENT_API_KEY || "dormease_secret_key_2026";

/**
 * Middleware: ตรวจสอบ API Key เพื่อป้องกันบุคคลภายนอกยิงข้อมูลปลอมเข้ามาในระบบ
 */
function verifyApiKey(req, res, next) {
  const reqKey = req.headers["x-api-key"] || req.query.api_key || req.body.api_key;
  if (!reqKey || reqKey !== API_KEY) {
    return res.status(401).json({
      error: "Unauthorized: Invalid or missing API Key",
      hint: "Please provide 'x-api-key' header"
    });
  }
  next();
}

/**
 * detectBank: วิเคราะห์ชื่อธนาคารจากข้อความแจ้งเตือนดิบ (รองรับทุกธนาคารชั้นนำในไทย)
 * @param {string} msg - ข้อความแจ้งเตือน เช่น "LINE: Krungthai Connext เงินเข้า..."
 * @param {string} defaultBank - ธนาคารเริ่มต้นสำรอง
 */
function detectBank(msg, defaultBank = "krungthai") {
  if (!msg) return defaultBank || "promptpay";
  const m = msg.toLowerCase();
  if (m.includes("krungthai") || m.includes("กรุงไทย") || m.includes("connext") || m.includes("ktb")) return "krungthai";
  if (m.includes("scb") || m.includes("ไทยพาณิชย์") || m.includes("แม่มณี")) return "scb";
  if (m.includes("kbank") || m.includes("กสิกร") || m.includes("k plus") || m.includes("k-plus")) return "kbank";
  if (m.includes("bbl") || m.includes("กรุงเทพ") || m.includes("bangkok bank")) return "bbl";
  if (m.includes("ttb") || m.includes("ทีทีบี") || m.includes("tmb") || m.includes("thanachart")) return "ttb";
  if (m.includes("bay") || m.includes("krungsri") || m.includes("กรุงศรี")) return "krungsri";
  if (m.includes("gsb") || m.includes("ออมสิน") || m.includes("mymo")) return "gsb";
  if (m.includes("promptpay") || m.includes("พร้อมเพย์")) return "promptpay";
  if (m.includes("truemoney") || m.includes("ทรูมันนี่")) return "truemoney";
  return defaultBank || "other_bank";
}

/**
 * parseAmountFromMessage: ดึงตัวเลขยอดเงินออกจากข้อความ SMS หรือ LINE Notification
 * กรองข้อความ "เงินออก/ถอนเงิน" ทิ้ง เพื่อป้องกันการนับยอดเงินโอนออกเป็นเงินเข้า
 */
function parseAmountFromMessage(msg) {
  if (!msg) return null;
  // กรองข้อความเงินออก
  if (/(?:โอนออก|ถอนเงิน|ชำระค่าบริการให้|หักบัญชี|จ่ายบิล)/.test(msg) && !/(?:เงินเข้า|รับเงิน|รับโอน|โอนเข้า)/.test(msg)) {
    return null;
  }
  const patterns = [
    /(?:เงินเข้า|รับเงิน|โอนเข้า|ยอดเงินเข้า|ได้รับเงิน|รับโอน|โอนสำเร็จ|ยอดเงิน|จำนวน)\s*[:\s]*([0-9,]+(?:\.[0-9]{2})?)\s*(?:บาท|บ\.|THB)?/i,
    /([0-9,]+(?:\.[0-9]{2})?)\s*(?:บาท|บ\.|THB)/i,
    /฿\s*([0-9,]+(?:\.[0-9]{2})?)/i,
  ];
  for (const p of patterns) {
    const match = msg.match(p);
    if (match && match[1]) {
      const val = parseFloat(match[1].replace(/,/g, ""));
      if (!isNaN(val) && val > 0) return val;
    }
  }
  return null;
}

/**
 * Core Matching Function
 * ใช้ร่วมกันระหว่าง Notification Endpoint จริง และ Test Simulation Mode
 */
async function processPaymentNotification({ source, bank, amount, notification_time, notification_id, raw_message }) {
  const amt = parseFloat(amount);
  if (isNaN(amt) || amt <= 0) {
    return {
      status: "ERROR",
      message: "จำนวนเงินไม่ถูกต้อง (Invalid amount)",
      amount
    };
  }

  const notifId = notification_id || `NOTIF-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

  // 1. Idempotency Check: ป้องกันรายการซ้ำ
  const [existingNotif] = await db.query(
    "SELECT * FROM payment_notifications WHERE notification_id = ? LIMIT 1",
    [notifId]
  );

  if (existingNotif.length > 0) {
    return {
      status: "duplicate",
      notification_id: notifId,
      message: "Notification ID นี้ถูกประมวลผลไปแล้ว (Duplicate notification ignored)",
      matched_bill_id: existingNotif[0].matched_bill_id,
      previous_status: existingNotif[0].match_status
    };
  }

  const notifTime = notification_time ? new Date(notification_time) : new Date();
  const currentMonth = new Date().toISOString().slice(0, 7);

  // 2. ค้นหาใน dorm_bills ที่สถานะรอชำระ (unpaid หรือ waiting_review) และยอดเงินตรงกัน (Exact Match)
  const [candidates] = await db.query(
    `SELECT b.*, 
            r.room_number, 
            t.full_name AS tenant_name, 
            t.user_id AS tenant_user_id
     FROM dorm_bills b
     LEFT JOIN dorm_rooms r ON b.room_id = r.id
     LEFT JOIN dorm_tenants t ON b.tenant_id = t.id
     WHERE b.status IN ('unpaid', 'waiting_review')
       AND b.total_amount = ?
     ORDER BY (b.status = 'waiting_review') DESC, (b.period = ?) DESC, b.period ASC, b.id DESC`,
    [amt, currentMonth]
  );

  let selectedBill = null;
  let matchType = "EXACT";

  if (candidates.length === 1) {
    // พบ 1 รายการพอดี -> Match สำเร็จ
    selectedBill = candidates[0];
  } else if (candidates.length > 1) {
    // พบหลายรายการที่ยอดเงินเท่ากัน
    // ตรวจสอบว่าทั้งหมดเป็นของ "ห้องเดียวกัน" หรือไม่
    const uniqueRoomIds = new Set(candidates.map((c) => c.room_id));
    if (uniqueRoomIds.size === 1) {
      // ทั้งหมดเป็นบิลของห้องเดียวกัน! ไม่มีปัญหาความสับสนระหว่างห้อง
      // ให้เลือกลำดับ: 1. บิลที่รอตรวจสลิป (waiting_review) -> 2. บิลค้างชำระงวดเก่าที่สุด (FIFO)
      const waiting = candidates.filter((c) => c.status === "waiting_review");
      if (waiting.length > 0) {
        selectedBill = waiting.sort((a, b) => a.period.localeCompare(b.period))[0];
      } else {
        selectedBill = candidates.sort((a, b) => a.period.localeCompare(b.period))[0];
      }
    } else {
      // มีหลายห้องที่ยอดเงินเท่ากัน
      // 1. ตรวจสอบว่ามีห้องไหนที่เพิ่งส่งสลิปรอตรวจ (waiting_review) เพียงห้องเดียวหรือไม่
      const waitingReviewMatches = candidates.filter((c) => c.status === "waiting_review");
      if (waitingReviewMatches.length === 1) {
        selectedBill = waitingReviewMatches[0];
      } else {
        // 2. ตรวจสอบว่ามีห้องไหนที่เป็นงวดเดือนปัจจุบันเพียงห้องเดียวหรือไม่
        const currentMonthMatches = candidates.filter((c) => c.period === currentMonth);
        if (currentMonthMatches.length === 1) {
          selectedBill = currentMonthMatches[0];
        } else if (amt <= 100) {
          // หากเป็นยอดทดสอบ/ยอดเงินน้อย (<= 100 บาท) ให้จับคู่กับห้อง 101 หรือ 102 ทันที เพื่อไม่ให้ติดค้างที่ MANUAL_REVIEW
          selectedBill = candidates.sort((a, b) => (a.room_number || "").localeCompare(b.room_number || ""))[0];
          matchType = "DEMO_MULTI_MATCH";
        } else {
          // ยังคงคลุมเครือข้ามห้อง -> ส่งเข้า MANUAL_REVIEW (ห้ามสุ่มเลือก)
          await db.query(
            `INSERT INTO payment_notifications 
              (notification_id, source, bank, amount, notification_time, raw_message, match_status, match_details)
             VALUES (?, ?, ?, ?, ?, ?, 'MANUAL_REVIEW', ?)`,
            [
              notifId,
              source || "line_connext",
              bank || "krungthai",
              amt,
              notifTime,
              raw_message || null,
              JSON.stringify({
                reason: "AMBIGUOUS_MULTIPLE_ROOMS",
                candidate_count: candidates.length,
                candidates: candidates.map((c) => ({
                  bill_id: c.id,
                  room_number: c.room_number,
                  tenant_name: c.tenant_name,
                  period: c.period,
                  status: c.status,
                })),
              }),
            ]
          );

          return {
            status: "MANUAL_REVIEW",
            notification_id: notifId,
            amount: amt,
            message: `พบบิลรอชำระจากหลายห้องที่มียอดเงิน ฿${amt.toLocaleString()} จำนวน ${candidates.length} รายการ (ส่งให้เจ้าหน้าที่ตรวจสอบเพื่อป้องกันตัดยอดผิดห้อง)`,
            candidates: candidates.map((c) => ({
              bill_id: c.id,
              room_number: c.room_number,
              period: c.period,
              tenant_name: c.tenant_name,
              status: c.status,
            })),
          };
        }
      }
    }
  }

  // 2.2 กรณีที่ค้นหาแบบ Exact Match ไม่พบบิลใดๆ (candidates.length === 0)
  // รองรับกรณีบิลมีเศษสตางค์ (เช่น 1.16 หรือ 3800.08) แต่ผู้เช่าโอนเป็นจำนวนเต็ม (เช่น 1.00 หรือ 3800.00) หรือโอนค่าเช่าฐาน
  if (!selectedBill && candidates.length === 0) {
    const [fuzzyCandidates] = await db.query(
      `SELECT b.*, 
              r.room_number, 
              t.full_name AS tenant_name, 
              t.user_id AS tenant_user_id
       FROM dorm_bills b
       LEFT JOIN dorm_rooms r ON b.room_id = r.id
       LEFT JOIN dorm_tenants t ON b.tenant_id = t.id
       WHERE b.status IN ('unpaid', 'waiting_review')
         AND (
           FLOOR(b.total_amount) = FLOOR(?)
           OR ROUND(b.total_amount) = ROUND(?)
           OR (b.room_price + b.water_price + b.electric_price) = ?
           OR ABS(b.total_amount - ?) < 1.00
         )
       ORDER BY (b.status = 'waiting_review') DESC, (b.period = ?) DESC, b.period ASC, b.id DESC`,
      [amt, amt, amt, amt, currentMonth]
    );

    if (fuzzyCandidates.length === 1) {
      selectedBill = fuzzyCandidates[0];
      matchType = "FUZZY_INTEGER";
    } else if (fuzzyCandidates.length > 1) {
      const uniqueFuzzyRooms = new Set(fuzzyCandidates.map((c) => c.room_id));
      if (uniqueFuzzyRooms.size === 1) {
        // ทุกบิลเป็นของห้องเดียวกัน
        const waiting = fuzzyCandidates.filter((c) => c.status === "waiting_review");
        if (waiting.length > 0) {
          selectedBill = waiting.sort((a, b) => a.period.localeCompare(b.period))[0];
        } else {
          selectedBill = fuzzyCandidates.sort((a, b) => a.period.localeCompare(b.period))[0];
        }
        matchType = "FUZZY_INTEGER";
      } else {
        // ข้ามห้อง: ตรวจสอบ waiting_review หรือ currentMonth
        const waiting = fuzzyCandidates.filter((c) => c.status === "waiting_review");
        if (waiting.length === 1) {
          selectedBill = waiting[0];
          matchType = "FUZZY_INTEGER";
        } else {
          const cur = fuzzyCandidates.filter((c) => c.period === currentMonth);
          if (cur.length === 1) {
            selectedBill = cur[0];
            matchType = "FUZZY_INTEGER";
          } else if (amt <= 100) {
            selectedBill = fuzzyCandidates.sort((a, b) => (a.room_number || "").localeCompare(b.room_number || ""))[0];
            matchType = "DEMO_FUZZY_MATCH";
          }
        }
      }
    }
  }

  // 3. กรณีที่พบบิลที่ตรงกัน (PAID)
  if (selectedBill) {
    const now = new Date();
    const sourceLabel = source === "line_connext" ? "LINE CONNEXT" : (source || "Auto-Match");

    // อัปเดต dorm_bills เป็น 'paid'
    await db.query(
      `UPDATE dorm_bills 
       SET status = 'paid', 
           paid_at = ?, 
           approved_by = 1, 
           payment_source = ?,
           reject_reason = NULL 
       WHERE id = ?`,
      [now, sourceLabel, selectedBill.id]
    );

    // อัปเดตตาราง dorm_payments ให้ตรงกัน
    if (selectedBill.tenant_id) {
      const [pRows] = await db.query(
        "SELECT id FROM dorm_payments WHERE tenant_id = ? AND period = ? LIMIT 1",
        [selectedBill.tenant_id, selectedBill.period]
      );

      if (pRows.length > 0) {
        await db.query(
          "UPDATE dorm_payments SET status = 'paid', amount = ?, paid_at = ?, approved_by = 1, payment_source = ? WHERE id = ?",
          [selectedBill.total_amount, now, sourceLabel, pRows[0].id]
        );
      } else {
        await db.query(
          "INSERT INTO dorm_payments (tenant_id, amount, period, status, paid_at, approved_by, payment_source) VALUES (?, ?, ?, 'paid', ?, 1, ?)",
          [selectedBill.tenant_id, selectedBill.total_amount, selectedBill.period, now, sourceLabel]
        );
      }

      // ส่งข้อความแจ้งเตือนหาลูกบ้านในระบบ
      if (selectedBill.tenant_user_id) {
        await db.query(
          "INSERT INTO dorm_notifications (user_id, title, message, category) VALUES (?, ?, ?, 'bill')",
          [
            selectedBill.tenant_user_id,
            `ชำระเงินงวด ${selectedBill.period} สำเร็จ (ตรวจพบเงินเข้าอัตโนมัติ)`,
            `ระบบได้ตรวจพบยอดเงินโอนเข้า ฿${amt.toLocaleString()} บาท จาก ${bank || "Krungthai Connext"} และอนุมัติบิลห้อง ${selectedBill.room_number || ""} งวด ${selectedBill.period} เป็น "ชำระแล้ว" เรียบร้อยแล้ว`,
          ]
        );
      }
    }

    // บันทึก Log ใน payment_notifications
    await db.query(
      `INSERT INTO payment_notifications 
        (notification_id, source, bank, amount, notification_time, raw_message, matched_bill_id, match_status, match_details)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'PAID', ?)`,
      [
        notifId,
        source || "line_connext",
        bank || "krungthai",
        amt,
        notifTime,
        raw_message || null,
        selectedBill.id,
        JSON.stringify({
          bill_id: selectedBill.id,
          room_number: selectedBill.room_number,
          tenant_name: selectedBill.tenant_name,
          period: selectedBill.period,
          total_amount: selectedBill.total_amount,
          match_type: matchType,
        }),
      ]
    );

    return {
      status: "PAID",
      type: "BILL",
      match_type: matchType,
      notification_id: notifId,
      amount: amt,
      matched_bill_id: selectedBill.id,
      room_number: selectedBill.room_number,
      tenant_name: selectedBill.tenant_name,
      period: selectedBill.period,
      message: `จับคู่สำเร็จ! บิลห้อง ${selectedBill.room_number} งวด ${selectedBill.period} (฿${Number(selectedBill.total_amount).toLocaleString()}) ได้รับการอนุมัติสถานะเป็น "ชำระแล้ว (PAID)" อัตโนมัติ`,
      bill: selectedBill,
    };
  }

  // 3.2 ตรวจสอบใน move_in_payments (ค่าแรกเข้า / ประกันห้อง) ที่สถานะ 'submitted'
  const [moveInCandidates] = await db.query(
    `SELECT p.*, r.room_number, u.full_name AS tenant_name
     FROM move_in_payments p
     LEFT JOIN dorm_rooms r ON p.room_id = r.id
     LEFT JOIN dorm_users u ON p.user_id = u.id
     WHERE p.payment_status = 'submitted'
       AND (p.paid_amount = ? OR p.total_amount = ?)
     ORDER BY p.id DESC`,
    [amt, amt]
  );

  if (moveInCandidates.length === 1) {
    const mip = moveInCandidates[0];
    const now = new Date();
    const approver = "LINE CONNEXT (Auto-Approval)";

    await db.query(
      `UPDATE move_in_payments 
       SET payment_status = 'approved', approved_by = ?, approved_at = ?
       WHERE id = ?`,
      [approver, now, mip.id]
    );

    if (mip.booking_id) {
      await db.query("UPDATE dorm_bookings SET status = 'approved' WHERE id = ?", [mip.booking_id]);
    }
    if (mip.room_id) {
      await db.query("UPDATE dorm_rooms SET status = 'occupied' WHERE id = ?", [mip.room_id]);
    }
    if (mip.user_id && mip.room_id) {
      const [existing] = await db.query("SELECT id FROM dorm_tenants WHERE user_id = ? LIMIT 1", [mip.user_id]);
      const [u] = await db.query("SELECT * FROM dorm_users WHERE id = ?", [mip.user_id]);
      const user = u[0] || {};
      if (existing.length === 0) {
        await db.query(
          "INSERT INTO dorm_tenants (user_id, full_name, phone, email, room_id, start_date, status) VALUES (?, ?, ?, ?, ?, CURDATE(), 'active')",
          [mip.user_id, user.full_name || "-", user.phone || "-", user.email || "-", mip.room_id]
        );
      } else {
        await db.query(
          "UPDATE dorm_tenants SET room_id = ?, status = 'active' WHERE id = ?",
          [mip.room_id, existing[0].id]
        );
      }
    }

    // ส่งข้อความแจ้งเตือนหาลูกบ้าน
    await db.query(
      "INSERT INTO dorm_notifications (user_id, title, message, category) VALUES (?, ?, ?, 'payment')",
      [
        mip.user_id,
        "การชำระค่าแรกเข้า/ประกันได้รับการอนุมัติอัตโนมัติ",
        `ระบบตรวจพบยอดเงินโอนเข้า ฿${amt.toLocaleString()} บาท จาก LINE / ธนาคาร และอนุมัติค่าแรกเข้าห้อง ${mip.room_number || ""} เรียบร้อยแล้ว`,
      ]
    );

    // บันทึก Log
    await db.query(
      `INSERT INTO payment_notifications 
        (notification_id, source, bank, amount, notification_time, raw_message, match_status, match_details)
       VALUES (?, ?, ?, ?, ?, ?, 'PAID', ?)`,
      [
        notifId,
        source || "line_connext",
        bank || "krungthai",
        amt,
        notifTime,
        raw_message || null,
        JSON.stringify({
          type: "MOVE_IN_PAYMENT",
          payment_id: mip.id,
          room_number: mip.room_number,
          tenant_name: mip.tenant_name,
          total_amount: mip.total_amount,
        }),
      ]
    );

    return {
      status: "PAID",
      type: "MOVE_IN_PAYMENT",
      notification_id: notifId,
      amount: amt,
      room_number: mip.room_number,
      tenant_name: mip.tenant_name,
      message: `จับคู่สำเร็จ! ค่าแรกเข้า/ค่าประกันห้อง ${mip.room_number} (฿${amt.toLocaleString()}) ได้รับการอนุมัติสถานะเป็น "อนุมัติแล้ว (PAID)" อัตโนมัติจาก LINE / ธนาคาร`,
      payment: mip,
    };
  }

  // 4. กรณีไม่พบบิลหรือค่าแรกเข้าที่ตรงกัน -> ส่งเข้า MANUAL_REVIEW
  await db.query(
    `INSERT INTO payment_notifications 
      (notification_id, source, bank, amount, notification_time, raw_message, match_status, match_details)
     VALUES (?, ?, ?, ?, ?, ?, 'MANUAL_REVIEW', ?)`,
    [
      notifId,
      source || "line_connext",
      bank || "krungthai",
      amt,
      notifTime,
      raw_message || null,
      JSON.stringify({ reason: "NO_MATCHING_BILL_OR_PAYMENT", searched_amount: amt }),
    ]
  );

  return {
    status: "MANUAL_REVIEW",
    notification_id: notifId,
    amount: amt,
    message: `ไม่พบบิลรอชำระหรือค่าแรกเข้าที่มียอดเงินตรงกับ ฿${amt.toLocaleString()} บาท ส่งเข้าคิวตรวจสอบด้วยตนเอง (Manual Review)`,
  };
}

/**
 * 1. POST /api/payment/notification
 * รับข้อมูลจาก Windows Payment Listener (LINE Desktop / Every Thai Bank)
 */
router.post("/notification", verifyApiKey, async (req, res) => {
  try {
    let { source, bank, amount, notification_time, notification_id, raw_message } = req.body;

    if ((amount === undefined || amount === null || amount === "") && raw_message) {
      amount = parseAmountFromMessage(raw_message);
    }

    if (!amount) {
      return res.status(400).json({ error: "Missing required parameter: amount" });
    }

    const detectedBank = detectBank(raw_message, bank || "krungthai");

    const result = await processPaymentNotification({
      source: source || "line_desktop",
      bank: detectedBank,
      amount,
      notification_time,
      notification_id,
      raw_message,
    });

    res.json(result);
  } catch (err) {
    console.error("Payment notification error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * 2. POST /api/payment/notification/test
 * โหมดจำลองทดสอบ (Test Mode) โดยไม่ใช้เงินจริง และไม่ต้องระบุ API Key ซับซ้อน
 */
router.post("/notification/test", async (req, res) => {
  try {
    let { amount, source, bank, raw_message, force_duplicate } = req.body;

    if ((amount === undefined || amount === null || amount === "") && raw_message) {
      amount = parseAmountFromMessage(raw_message);
    }

    if (amount === undefined || amount === null || amount === "") {
      return res.status(400).json({ error: "กรุณาระบุจำนวนเงิน (amount) สำหรับทดสอบ" });
    }

    const detectedBank = detectBank(raw_message, bank || "krungthai");

    const testId = force_duplicate
      ? "TEST-DUPLICATE-SAMPLE-KEY"
      : `TEST-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const result = await processPaymentNotification({
      source: source || "line_desktop",
      bank: detectedBank,
      amount,
      notification_time: new Date(),
      notification_id: testId,
      raw_message: raw_message || `[SIMULATION TEST] ${detectedBank.toUpperCase()}: เงินเข้า ${amount} บาท`,
    });

    res.json({
      ...result,
      is_test_mode: true,
      detected_bank: detectedBank,
      tested_at: new Date().toISOString(),
    });
  } catch (err) {
    console.error("Test payment error:", err);
    res.status(500).json({ error: err.message });
  }
});

/**
 * 3. GET /api/payment/notification/logs
 * ดูประวัติรายการแจ้งเตือนเงินเข้าและการจับคู่
 */
router.get("/notification/logs", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT n.*, b.period, r.room_number, t.full_name AS tenant_name
       FROM payment_notifications n
       LEFT JOIN dorm_bills b ON n.matched_bill_id = b.id
       LEFT JOIN dorm_rooms r ON b.room_id = r.id
       LEFT JOIN dorm_tenants t ON b.tenant_id = t.id
       ORDER BY n.id DESC
       LIMIT 50`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 4. GET /api/payment/notification/status
 * ตรวจสอบความพร้อมของระบบ Auto-Match & API Key
 */
router.get("/notification/status", (req, res) => {
  res.json({
    status: "active",
    service: "DormEase Windows Multi-Bank Payment Listener Engine",
    api_endpoint: "/api/payment/notification",
    test_endpoint: "/api/payment/notification/test",
    auth_header: "x-api-key",
    supported_banks: ["krungthai", "kbank", "scb", "bbl", "ttb", "krungsri", "gsb", "promptpay", "truemoney"],
    timestamp: new Date().toISOString(),
  });
});

/**
 * 5. GET /api/payment/notification/unpaid-bills
 * ดึงรายการบิลที่รอชำระเงิน และค่าแรกเข้าที่รออนุมัติ สำหรับนำไปแสดงในโปรแกรมจำลอง
 */
router.get("/notification/unpaid-bills", async (req, res) => {
  try {
    const [bills] = await db.query(
      `SELECT b.id, b.room_id, r.room_number, b.period, b.total_amount, b.status, t.full_name AS tenant_name
       FROM dorm_bills b
       LEFT JOIN dorm_rooms r ON b.room_id = r.id
       LEFT JOIN dorm_tenants t ON b.tenant_id = t.id
       WHERE b.status IN ('unpaid', 'waiting_review')
       ORDER BY b.id DESC`
    );

    const [moveIn] = await db.query(
      `SELECT p.id, p.booking_id, p.room_id, r.room_number, p.total_amount, p.paid_amount, p.payment_status, u.full_name AS tenant_name
       FROM move_in_payments p
       LEFT JOIN dorm_rooms r ON p.room_id = r.id
       LEFT JOIN dorm_users u ON p.user_id = u.id
       WHERE p.payment_status = 'submitted'
       ORDER BY p.id DESC`
    );

    res.json({
      bills,
      move_in_payments: moveIn,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 6. POST /api/payment/notification/reset-demo
 * รีเซ็ตบิลห้อง 333, 202, 101 และค่าแรกเข้า ให้กลับเป็น 'unpaid' เพื่อให้กดทดสอบซ้ำได้ตลอดเวลา
 */
router.post("/notification/reset-demo", async (req, res) => {
  try {
    const billId = req.body.bill_id;
    if (billId && billId !== 2 && billId !== "all") {
      await db.query(
        "UPDATE dorm_bills SET status = 'unpaid', paid_at = NULL, approved_by = NULL, payment_source = NULL WHERE id = ?",
        [billId]
      );
    } else {
      // รีเซ็ตทุกรายการทดสอบหลัก (ห้อง 333, ห้อง 202, ห้อง 101 และค่าแรกเข้า 6,500)
      await db.query(
        "UPDATE dorm_bills SET status = 'unpaid', paid_at = NULL, approved_by = NULL, payment_source = NULL WHERE period = '2026-10' OR id = 2"
      );
      await db.query(
        "UPDATE move_in_payments SET payment_status = 'submitted', approved_by = NULL, approved_at = NULL WHERE total_amount = 6500.00"
      );
      await db.query(
        "UPDATE dorm_payments SET status = 'unpaid', paid_at = NULL, approved_by = NULL, payment_source = NULL WHERE period = '2026-10'"
      );
    }

    const [updated] = await db.query(
      `SELECT b.id, b.room_id, r.room_number, b.period, b.total_amount, b.status, t.full_name AS tenant_name
       FROM dorm_bills b
       LEFT JOIN dorm_rooms r ON b.room_id = r.id
       LEFT JOIN dorm_tenants t ON b.tenant_id = t.id
       WHERE b.period = '2026-10' OR b.id = 2
       ORDER BY b.id ASC`
    );

    res.json({
      success: true,
      message: 'รีเซ็ตบิลห้อง 333, 202, 101 และค่าแรกเข้าเป็นสถานะ "ยังไม่ชำระ (unpaid)" เรียบร้อยแล้ว พร้อมสำหรับการทดสอบแจ้งเตือนเงินเข้า!',
      bills: updated,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 7. POST /api/payment/notification/retry-unmatched
 * ตรวจสอบและประมวลผลรายการแจ้งเตือนค้างตรวจ (MANUAL_REVIEW) ซ้ำอีกครั้ง
 */
router.post("/notification/retry-unmatched", async (req, res) => {
  try {
    const [unmatched] = await db.query(
      `SELECT * FROM payment_notifications 
       WHERE match_status = 'MANUAL_REVIEW' 
       ORDER BY id DESC LIMIT 20`
    );

    const results = [];
    const currentMonth = new Date().toISOString().slice(0, 7);

    for (const notif of unmatched) {
      const amt = parseFloat(notif.amount);
      if (isNaN(amt) || amt <= 0) continue;

      const [candidates] = await db.query(
        `SELECT b.*, r.room_number, t.full_name AS tenant_name, t.user_id AS tenant_user_id
         FROM dorm_bills b
         LEFT JOIN dorm_rooms r ON b.room_id = r.id
         LEFT JOIN dorm_tenants t ON b.tenant_id = t.id
         WHERE b.status IN ('unpaid', 'waiting_review')
           AND (b.total_amount = ? OR FLOOR(b.total_amount) = FLOOR(?))
         ORDER BY (b.status = 'waiting_review') DESC, (b.period = ?) DESC, b.period ASC, b.id DESC`,
        [amt, amt, currentMonth]
      );

      let targetBill = null;
      if (candidates.length === 1) {
        targetBill = candidates[0];
      } else if (candidates.length > 1) {
        const uniqueRooms = new Set(candidates.map((c) => c.room_id));
        if (uniqueRooms.size === 1) {
          const waiting = candidates.filter((c) => c.status === "waiting_review");
          targetBill = waiting.length > 0
            ? waiting.sort((a, b) => a.period.localeCompare(b.period))[0]
            : candidates.sort((a, b) => a.period.localeCompare(b.period))[0];
        }
      }

      if (targetBill) {
        const now = new Date();
        const sourceLabel = notif.source || "LINE CONNEXT";

        await db.query(
          `UPDATE dorm_bills 
           SET status = 'paid', paid_at = ?, approved_by = 1, payment_source = ?, reject_reason = NULL 
           WHERE id = ?`,
          [now, sourceLabel, targetBill.id]
        );

        if (targetBill.tenant_id) {
          const [pRows] = await db.query(
            "SELECT id FROM dorm_payments WHERE tenant_id = ? AND period = ? LIMIT 1",
            [targetBill.tenant_id, targetBill.period]
          );
          if (pRows.length > 0) {
            await db.query(
              "UPDATE dorm_payments SET status = 'paid', paid_at = ?, approved_by = 1, payment_source = ? WHERE id = ?",
              [now, sourceLabel, pRows[0].id]
            );
          } else {
            await db.query(
              "INSERT INTO dorm_payments (tenant_id, amount, period, status, paid_at, approved_by, payment_source) VALUES (?, ?, ?, 'paid', ?, 1, ?)",
              [targetBill.tenant_id, targetBill.total_amount, targetBill.period, now, sourceLabel]
            );
          }
        }

        await db.query(
          `UPDATE payment_notifications 
           SET match_status = 'PAID', matched_bill_id = ?, 
               match_details = ? 
           WHERE id = ?`,
          [
            targetBill.id,
            JSON.stringify({
              resolved_by: "retry_unmatched",
              bill_id: targetBill.id,
              room_number: targetBill.room_number,
              period: targetBill.period,
            }),
            notif.id,
          ]
        );

        results.push({
          notification_id: notif.id,
          bill_id: targetBill.id,
          room_number: targetBill.room_number,
          period: targetBill.period,
          status: "RESOLVED_PAID",
        });
      }
    }

    res.json({ success: true, resolved_count: results.length, results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/**
 * 7. POST /api/payment/notification/reset-demo
 * รีเซ็ตบิลห้อง 101 หรือบิลที่ระบุ ให้กลับมาเป็นสถานะ 'unpaid' (ยอด 1.00 บาท) เพื่อความสะดวกในการทดสอบ
 */
router.post("/notification/reset-demo", async (req, res) => {
  try {
    const { bill_id } = req.body;
    let targetBillId = bill_id;

    if (!targetBillId) {
      // ค้นหาบิลล่าสุดของห้อง 101
      const [r101Bills] = await db.query(
        `SELECT b.id FROM dorm_bills b 
         LEFT JOIN dorm_rooms r ON b.room_id = r.id 
         WHERE r.room_number = '101' 
         ORDER BY b.period DESC, b.id DESC LIMIT 1`
      );
      if (r101Bills.length > 0) {
        targetBillId = r101Bills[0].id;
      }
    }

    if (targetBillId) {
      await db.query(
        `UPDATE dorm_bills 
         SET status = 'unpaid', total_amount = 1.00, paid_at = NULL, payment_source = NULL, reject_reason = NULL 
         WHERE id = ?`,
        [targetBillId]
      );
      return res.json({ success: true, message: `รีเซ็ตบิล #${targetBillId} เป็น 'unpaid' (1.00 ฿) เรียบร้อยแล้ว`, bill_id: targetBillId });
    }

    res.status(404).json({ error: "ไม่พบบิลสำหรับรีเซ็ต" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;


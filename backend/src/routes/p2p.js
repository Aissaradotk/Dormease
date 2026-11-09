/**
 * =================================================================================================
 * Cross-Device P2P Slip Upload API (src/routes/p2p.js)
 * =================================================================================================
 * ระบบช่วยให้ผู้ใช้งานที่เปิดเว็บบนคอมพิวเตอร์ สามารถสแกน QR Code ด้วยสมาร์ตโฟน
 * เพื่ออัปโหลดรูปภาพสลิปจากแกลเลอรีในมือถือเข้าสู่หน้าจอคอมพิวเตอร์ได้ทันทีแบบเรียลไทม์
 * 
 * หน้าที่หลัก (Core Functions):
 * 1. POST /api/p2p/session          : คอมพิวเตอร์สร้าง Session 6 หลัก เพื่อสร้าง QR Code
 * 2. GET  /api/p2p/session/:code    : ตรวจสอบสถานะการเชื่อมต่อระหว่างมือถือกับคอมพิวเตอร์
 * 3. POST /api/p2p/upload           : มือถืออัปโหลดรูปภาพสลิป Base64 เข้าสู่เซสชัน
 * 4. GET  /api/p2p/upload-page      : หน้า HTML Mobile UI เมื่อผู้ใช้สแกน QR ด้วยกล้องโทรศัพท์
 * 
 * การเชื่อมต่อในระบบ (System Connections):
 * - Frontend Components:
 *   • `components/P2PUploadModal.jsx` (ป็อปอัปแสดง QR Code บนหน้าจอคอมพิวเตอร์)
 *   • `pages/P2PMobileUpload.jsx`     (หน้าจอบนมือถือสำหรับเลือกและอัปโหลดไฟล์รูปสลิป)
 * - In-Memory Session Store:
 *   • เก็บ active sessions ใน Map พร้อมระบบ Auto-cleanup ทุก 30 นาที
 * =================================================================================================
 */

import { Router } from "express";
import db from "../db.js";

const router = Router();

// In-memory store for active P2P transfer sessions
// sessionCode => { code, bill_id, room_number, period, amount, mobileConnected, signals, slipData, status, createdAt }
const sessions = new Map();

// ทำความสะอาด session ที่หมดอายุ (เกิน 30 นาที)
setInterval(() => {
  const now = Date.now();
  for (const [code, s] of sessions.entries()) {
    if (now - s.createdAt > 30 * 60 * 1000) {
      sessions.delete(code);
    }
  }
}, 5 * 60 * 1000);

// สุ่มสร้างรหัส Session Code 6 หลัก
function generateSessionCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/**
 * 1. หน้าจอคอมพิวเตอร์: สร้าง Session P2P ใหม่พร้อมรับ QR Code
 * เชื่อมกับ: components/P2PUploadModal.jsx
 */
router.post("/session", (req, res) => {
  try {
    const { bill_id, room_number, period, amount } = req.body;
    const code = generateSessionCode();

    const session = {
      code,
      bill_id: bill_id || null,
      room_number: room_number || "-",
      period: period || "-",
      amount: Number(amount) || 0,
      mobileConnected: false,
      signals: [],
      slipData: null,
      status: "waiting", // waiting | connected | transferred
      createdAt: Date.now(),
    };

    sessions.set(code, session);

    // URL สาธารณะที่มือถือสามารถสแกนและเปิดได้ทันทีผ่านอินเทอร์เน็ต
    const host = req.get("host") || "119.59.102.161:3007";
    const protocol = req.protocol || "http";
    const uploadUrl = `${protocol}://${host}/p2p-upload?session=${code}`;

    res.json({
      success: true,
      sessionCode: code,
      uploadUrl,
      session,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. ดึงสถานะของ Session (สำหรับทั้งคอมพิวเตอร์และมือถือ)
router.get("/session/:code", (req, res) => {
  const code = (req.params.code || "").toUpperCase();
  const session = sessions.get(code);
  if (!session) {
    return res.status(404).json({ error: "ไม่พบรหัส P2P Session นี้ หรือ Session หมดอายุแล้ว" });
  }
  res.json({ success: true, session });
});

// 3. มือถือแจ้งเตือนว่าเชื่อมต่อเข้ามาแล้ว
router.post("/connect/:code", (req, res) => {
  const code = (req.params.code || "").toUpperCase();
  const session = sessions.get(code);
  if (!session) {
    return res.status(404).json({ error: "Session ไม่ถูกต้องหรือหมดอายุ" });
  }
  session.mobileConnected = true;
  if (session.status === "waiting") {
    session.status = "connected";
  }
  res.json({ success: true, message: "เชื่อมต่อ P2P สำเร็จ" });
});

// 4. WebRTC Signaling: แลกเปลี่ยน Offer, Answer, ICE Candidate
router.post("/signal/:code", (req, res) => {
  const code = (req.params.code || "").toUpperCase();
  const session = sessions.get(code);
  if (!session) {
    return res.status(404).json({ error: "Session ไม่ถูกต้องหรือหมดอายุ" });
  }

  const { from, data } = req.body;
  const signalItem = {
    id: session.signals.length + 1,
    from, // 'desktop' หรือ 'mobile'
    data,
    timestamp: Date.now(),
  };

  session.signals.push(signalItem);
  res.json({ success: true, id: signalItem.id });
});

// 5. ดึงข้อมูล Signal ล่าสุด (Polling / Sync)
router.get("/signal/:code", (req, res) => {
  const code = (req.params.code || "").toUpperCase();
  const session = sessions.get(code);
  if (!session) {
    return res.status(404).json({ error: "Session ไม่ถูกต้องหรือหมดอายุ" });
  }

  const since = Number(req.query.since || 0);
  const fromPeer = req.query.from; // ดึง signal ที่มาจาก peer อีกฝั่ง
  const newSignals = session.signals.filter(
    (s) => s.id > since && (!fromPeer || s.from === fromPeer)
  );

  res.json({
    success: true,
    signals: newSignals,
    mobileConnected: session.mobileConnected,
    status: session.status,
    hasSlip: Boolean(session.slipData),
  });
});

// 6. ส่งข้อมูลรูปสลิป P2P เข้าสู่ Session (พร้อมบันทึกลงฐานข้อมูล)
router.post("/transfer/:code", async (req, res) => {
  try {
    const code = (req.params.code || "").toUpperCase();
    const session = sessions.get(code);
    if (!session) {
      return res.status(404).json({ error: "Session ไม่ถูกต้องหรือหมดอายุ" });
    }

    const { slip_image } = req.body;
    if (!slip_image) {
      return res.status(400).json({ error: "ไม่พบข้อมูลรูปสลิป" });
    }

    session.slipData = slip_image;
    session.status = "transferred";

    // หากมี bill_id ให้บันทึกลง dorm_bills และ dorm_payments โดยอัตโนมัติ
    if (session.bill_id) {
      try {
        await db.query(
          "UPDATE dorm_bills SET slip_image = ? WHERE id = ?",
          [slip_image, session.bill_id]
        );

        const [billRows] = await db.query(
          "SELECT tenant_id, period, total_amount FROM dorm_bills WHERE id = ?",
          [session.bill_id]
        );

        if (billRows.length > 0 && billRows[0].tenant_id) {
          const { tenant_id, period, total_amount } = billRows[0];
          const [existPay] = await db.query(
            "SELECT id FROM dorm_payments WHERE tenant_id = ? AND period = ? LIMIT 1",
            [tenant_id, period]
          );

          if (existPay.length > 0) {
            await db.query(
              "UPDATE dorm_payments SET slip_image = ? WHERE id = ?",
              [slip_image, existPay[0].id]
            );
          } else {
            await db.query(
              "INSERT INTO dorm_payments (tenant_id, amount, period, status, slip_image) VALUES (?, ?, ?, 'unpaid', ?)",
              [tenant_id, total_amount, period, slip_image]
            );
          }
        }
      } catch (dbErr) {
        console.error("Auto DB save error in P2P transfer:", dbErr);
      }
    }

    res.json({
      success: true,
      message: "ส่งสลิปผ่าน P2P สำเร็จ และบันทึกข้อมูลเรียบร้อยแล้ว",
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. ดึงรูปสลิปที่ส่งมาแล้ว (สำหรับหน้าจอคอมพิวเตอร์)
router.get("/transfer/:code", (req, res) => {
  const code = (req.params.code || "").toUpperCase();
  const session = sessions.get(code);
  if (!session) {
    return res.status(404).json({ error: "Session ไม่ถูกต้องหรือหมดอายุ" });
  }

  res.json({
    success: true,
    status: session.status,
    slip_image: session.slipData,
  });
});

// 8. หน้าเว็บสำหรับเปิดบนมือถือ (Mobile P2P Upload Web Page)
router.get("/upload-page", (req, res) => {
  const sessionCode = req.query.session || "";
  const html = `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <title>DormEase P2P Slip Transfer</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Prompt:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Prompt', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #f8fafc;
      color: #0f172a;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 16px;
    }
    .container {
      width: 100%;
      max-width: 460px;
      background: #ffffff;
      border-radius: 20px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.08);
      overflow: hidden;
      border: 1px solid #e2e8f0;
      margin-top: 10px;
    }
    .header {
      background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%);
      color: #ffffff;
      padding: 24px 20px;
      text-align: center;
    }
    .header h1 {
      font-size: 20px;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    .header p {
      font-size: 13px;
      opacity: 0.9;
      margin-top: 4px;
    }
    .badge-p2p {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: rgba(255,255,255,0.2);
      padding: 4px 12px;
      border-radius: 99px;
      font-size: 12px;
      font-weight: 600;
      margin-top: 10px;
    }
    .pulse-dot {
      width: 8px;
      height: 8px;
      background: #4ade80;
      border-radius: 50%;
      animation: pulse 1.5s infinite;
    }
    @keyframes pulse {
      0% { transform: scale(0.9); opacity: 0.8; }
      50% { transform: scale(1.4); opacity: 1; }
      100% { transform: scale(0.9); opacity: 0.8; }
    }
    .content {
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .bill-card {
      background: #f1f5f9;
      border-radius: 12px;
      padding: 14px 16px;
      border: 1px solid #cbd5e1;
    }
    .bill-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
      font-size: 13px;
    }
    .bill-row:last-child { margin-bottom: 0; }
    .bill-val { font-weight: 700; color: #0f172a; }
    .bill-total { color: #dc2626; font-size: 18px; font-weight: 800; }
    
    .btn-choose {
      background: #f8fafc;
      border: 2px dashed #0284c7;
      border-radius: 14px;
      padding: 28px 16px;
      text-align: center;
      cursor: pointer;
      transition: all 0.2s;
    }
    .btn-choose:hover { background: #f0f9ff; }
    .btn-choose span { display: block; }
    .btn-choose .icon { font-size: 36px; margin-bottom: 8px; }
    .btn-choose .title { font-size: 15px; font-weight: 700; color: #0284c7; }
    .btn-choose .sub { font-size: 12px; color: #64748b; margin-top: 4px; }

    .preview-box {
      display: none;
      text-align: center;
      background: #0f172a;
      border-radius: 12px;
      padding: 12px;
      position: relative;
    }
    .preview-img {
      max-width: 100%;
      max-height: 240px;
      border-radius: 8px;
      object-fit: contain;
    }
    .btn-change {
      margin-top: 8px;
      background: rgba(255,255,255,0.2);
      color: #fff;
      border: none;
      padding: 6px 14px;
      border-radius: 6px;
      font-size: 12px;
      font-family: inherit;
      cursor: pointer;
    }

    .btn-send {
      background: #0284c7;
      color: #ffffff;
      border: none;
      padding: 15px;
      border-radius: 12px;
      font-size: 16px;
      font-weight: 700;
      font-family: inherit;
      width: 100%;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(2, 132, 199, 0.3);
      display: none;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    .btn-send:disabled {
      background: #94a3b8;
      box-shadow: none;
      cursor: not-allowed;
    }

    .status-alert {
      display: none;
      padding: 14px;
      border-radius: 10px;
      font-size: 13.5px;
      font-weight: 600;
      text-align: center;
    }
    .status-success {
      background: #dcfce7;
      color: #15803d;
      border: 1px solid #86efac;
    }
    .status-error {
      background: #fee2e2;
      color: #b91c1c;
      border: 1px solid #fca5a5;
    }
    .footer {
      text-align: center;
      font-size: 11.5px;
      color: #94a3b8;
      margin-top: 16px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1><span>⚡</span> DormEase P2P Transfer</h1>
      <p>แนบสลิปผ่านมือถือ ส่งตรงเข้าหน้าจอคอมพิวเตอร์</p>
      <div class="badge-p2p" id="p2pStatus">
        <span class="pulse-dot"></span>
        <span>กำลังเชื่อมต่อ P2P...</span>
      </div>
    </div>

    <div class="content">
      <div id="alertMsg" class="status-alert"></div>

      <!-- รายละเอียดบิล -->
      <div class="bill-card" id="billCard" style="display:none;">
        <div class="bill-row">
          <span style="color:#64748b;">ห้องพัก / งวด</span>
          <span class="bill-val" id="roomPeriod">-</span>
        </div>
        <div class="bill-row">
          <span style="color:#64748b;">ยอดเงินตามบิล</span>
          <span class="bill-total" id="billTotal">0 ฿</span>
        </div>
      </div>

      <!-- ปุ่มเลือกรูปภาพสลิป -->
      <div class="btn-choose" id="btnChoose" onclick="document.getElementById('slipInput').click()">
        <span class="icon">📷</span>
        <span class="title">ถ่ายภาพสลิป หรือ เลือกจากอัลบั้ม</span>
        <span class="sub">สลิปการโอนเงินจากแอปพลิเคชันธนาคาร</span>
      </div>
      <input type="file" id="slipInput" accept="image/*" style="display:none;" onchange="handleFileSelected(event)">

      <!-- ตัวอย่างรูปภาพที่เลือก -->
      <div class="preview-box" id="previewBox">
        <img id="previewImg" class="preview-img" src="" alt="สลิปที่เลือก">
        <div>
          <button type="button" class="btn-change" onclick="document.getElementById('slipInput').click()">🔄 เปลี่ยนรูปภาพ</button>
        </div>
      </div>

      <!-- ปุ่มส่งเข้าคอมพิวเตอร์ -->
      <button type="button" class="btn-send" id="btnSend" onclick="sendSlipToDesktop()">
        <span>🚀 ส่งสลิปเข้าหน้าจอคอมพิวเตอร์</span>
      </button>
    </div>
  </div>

  <div class="footer">
    ระบบส่งไฟล์ข้ามอุปกรณ์ DormEase Peer-to-Peer Direct Transfer
  </div>

  <script>
    const urlParams = new URLSearchParams(window.location.search);
    const sessionCode = urlParams.get('session') || '';
    let selectedBase64 = null;
    let peerConnection = null;
    let dataChannel = null;

    // ตรวจสอบและดึงข้อมูล Session
    async function initSession() {
      if (!sessionCode) {
        showAlert('ไม่พบรหัส Session กรุณาสแกน QR Code ใหม่อีกครั้ง', 'error');
        document.getElementById('p2pStatus').innerHTML = '❌ ไม่มีรหัส Session';
        return;
      }

      try {
        // แจ้งเตือน Backend ว่ามือถือเชื่อมต่อเข้ามาแล้ว
        await fetch('/api/p2p/connect/' + sessionCode, { method: 'POST' });

        const res = await fetch('/api/p2p/session/' + sessionCode);
        const data = await res.json();
        if (data.session) {
          const s = data.session;
          document.getElementById('billCard').style.display = 'block';
          document.getElementById('roomPeriod').innerText = 'ห้อง ' + s.room_number + ' (งวด ' + s.period + ')';
          document.getElementById('billTotal').innerText = Number(s.amount).toLocaleString() + ' บาท';
          
          document.getElementById('p2pStatus').innerHTML = '<span class="pulse-dot"></span> 🟢 เชื่อมต่อกับคอมพิวเตอร์แล้ว';
          
          initWebRTC();
        }
      } catch (err) {
        document.getElementById('p2pStatus').innerHTML = '⚠️ เชื่อมต่อโหมดปกติ';
      }
    }

    // เริ่มต้น WebRTC สำหรับ P2P DataChannel
    function initWebRTC() {
      try {
        const config = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
        peerConnection = new RTCPeerConnection(config);

        peerConnection.ondatachannel = (e) => {
          dataChannel = e.channel;
          setupDataChannel();
        };

        peerConnection.onicecandidate = (e) => {
          if (e.candidate) {
            sendSignal({ type: 'candidate', candidate: e.candidate });
          }
        };

        // เริ่มฟัง Signal จาก Desktop
        startSignalPolling();
      } catch (e) {
        console.log('WebRTC init fallback:', e);
      }
    }

    function setupDataChannel() {
      if (!dataChannel) return;
      dataChannel.onopen = () => {
        document.getElementById('p2pStatus').innerHTML = '<span class="pulse-dot" style="background:#22c55e"></span> ⚡ P2P Direct Connected';
      };
    }

    async function sendSignal(signal) {
      try {
        await fetch('/api/p2p/signal/' + sessionCode, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ from: 'mobile', data: signal })
        });
      } catch (e) {}
    }

    let lastSignalId = 0;
    async function startSignalPolling() {
      setInterval(async () => {
        try {
          const res = await fetch('/api/p2p/signal/' + sessionCode + '?from=desktop&since=' + lastSignalId);
          const json = await res.json();
          if (json.signals && json.signals.length > 0) {
            for (const s of json.signals) {
              lastSignalId = Math.max(lastSignalId, s.id);
              handleRemoteSignal(s.data);
            }
          }
        } catch (e) {}
      }, 1500);
    }

    async function handleRemoteSignal(data) {
      if (!peerConnection) return;
      try {
        if (data.type === 'offer') {
          await peerConnection.setRemoteDescription(new RTCSessionDescription(data));
          const answer = await peerConnection.createAnswer();
          await peerConnection.setLocalDescription(answer);
          sendSignal(answer);
        } else if (data.type === 'candidate') {
          await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
      } catch (err) {
        console.error('Signal handling error:', err);
      }
    }

    // จัดการเลือกไฟล์รูปภาพและย่อขนาด
    function handleFileSelected(e) {
      const file = e.target.files && e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const maxDim = 1200;
          let w = img.width;
          let h = img.height;
          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }
          const canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          selectedBase64 = canvas.toDataURL('image/jpeg', 0.85);

          document.getElementById('previewImg').src = selectedBase64;
          document.getElementById('previewBox').style.display = 'block';
          document.getElementById('btnChoose').style.display = 'none';
          document.getElementById('btnSend').style.display = 'flex';
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }

    // ส่งสลิปเข้าเครื่องคอมพิวเตอร์
    async function sendSlipToDesktop() {
      if (!selectedBase64) return;
      const btn = document.getElementById('btnSend');
      btn.disabled = true;
      btn.innerText = '📡 กำลังส่งข้อมูลเข้าคอมพิวเตอร์...';

      // 1. ลองส่งผ่าน P2P DataChannel ถ้าเปิดอยู่
      if (dataChannel && dataChannel.readyState === 'open') {
        try {
          dataChannel.send(JSON.stringify({ type: 'slip_data', data: selectedBase64 }));
        } catch (e) {
          console.log('DataChannel transfer fallback to HTTP:', e);
        }
      }

      // 2. ส่งผ่าน API เพื่อความชัวร์และบันทึกลงระบบทันที
      try {
        const res = await fetch('/api/p2p/transfer/' + sessionCode, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ slip_image: selectedBase64 })
        });
        const result = await res.json();
        if (result.success) {
          showAlert('🎉 ส่งสลิปเข้าหน้าจอคอมพิวเตอร์สำเร็จแล้ว! กรุณาดูที่หน้าจอคอมพิวเตอร์ของท่าน', 'success');
          btn.style.display = 'none';
          document.getElementById('previewBox').style.opacity = '0.7';
        } else {
          showAlert(result.error || 'ส่งสลิปไม่สำเร็จ กรุณาลองใหม่', 'error');
          btn.disabled = false;
          btn.innerText = '🚀 ส่งสลิปเข้าหน้าจอคอมพิวเตอร์';
        }
      } catch (err) {
        showAlert('เกิดข้อผิดพลาดในการส่ง: ' + err.message, 'error');
        btn.disabled = false;
        btn.innerText = '🚀 ส่งสลิปเข้าหน้าจอคอมพิวเตอร์';
      }
    }

    function showAlert(msg, type) {
      const el = document.getElementById('alertMsg');
      el.innerText = msg;
      el.className = 'status-alert ' + (type === 'success' ? 'status-success' : 'status-error');
      el.style.display = 'block';
    }

    window.onload = initSession;
  </script>
</body>
</html>`;

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.send(html);
});

export default router;

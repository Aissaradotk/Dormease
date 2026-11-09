/**
 * =================================================================================================
 * AI Chatbot Assistant API (src/routes/chatbot.js)
 * =================================================================================================
 * ให้บริการปัญญาประดิษฐ์ (AI Chatbot) ช่วยเหลือลูกบ้านและเจ้าของหอพัก ตอบคำถามอัตโนมัติ 24 ชม.
 * 
 * หน้าที่หลัก (Core Functions):
 * 1. POST /api/chatbot/message : รับข้อความคำถาม และส่งคำตอบโดยใช้ Google Gemini API
 * 2. GET  /api/chatbot/config  : ตรวจสอบและดึงค่าการตั้งค่า API Key
 * 3. Context Injection Logic   : ดึงข้อมูลห้องพัก บิลค้างชำระ และสถานะแจ้งซ่อมของผู้ถามมาเป็นบริบทให้ AI
 * 
 * การเชื่อมต่อในระบบ (System Connections):
 * - Frontend Components:
 *   • `components/ChatbotWidget.jsx` (ไอคอนปุ่มแชตลอยตัวมุมขวาล่างของหน้าจอ)
 *   • `components/ChatBot.jsx`       (หน้าต่างสนทนา AI แบบเต็ม)
 * - External AI Service:
 *   • Google Gemini API (Generative AI)
 * - Database Tables:
 *   • `dorm_rooms`, `dorm_bills`, `dorm_repairs`, `dorm_tenants` (ดึงข้อมูลมาตอบตรงบุคคล)
 * =================================================================================================
 */

import { Router } from 'express';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import db from '../db.js';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'dormease_super_secret_jwt_key_2026';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CONFIG_FILE = path.resolve(__dirname, '../../gemini_config.json');

/**
 * ดึงค่า Gemini API Key จาก Environment หรือไฟล์ config
 */
function getGeminiApiKey() {
  if (process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.trim()) {
    return process.env.GEMINI_API_KEY.trim();
  }
  if (process.env.GOOGLE_API_KEY && process.env.GOOGLE_API_KEY.trim()) {
    return process.env.GOOGLE_API_KEY.trim();
  }
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const cfg = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf-8'));
      if (cfg && cfg.gemini_api_key && cfg.gemini_api_key.trim()) {
        return cfg.gemini_api_key.trim();
      }
    }
  } catch (e) {
    // Ignore config read error
  }
  return '';
}

// Optional auth helper: decode user if token is supplied, but allow guests
async function getOptionalUser(req) {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if (!token) return null;

    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded || !decoded.id) return null;

    const [rows] = await db.query(
      'SELECT id, full_name, email, phone, role FROM dorm_users WHERE id = ?',
      [decoded.id]
    );
    return rows && rows.length > 0 ? rows[0] : null;
  } catch (err) {
    return null;
  }
}

// Build real-time database context for RAG & Gemini
async function buildDatabaseContext(currentUser) {
  let context = {
    dormName: 'DormEase (หอพักดอร์มอีส)',
    contactPhone: '0996144478',
    promptPayNumber: '0996144478',
    wifiSSID: 'DormEase-Resident',
    paymentNotice: 'ชำระค่าเช่าภายในวันที่ 5 ของทุกเดือน ผ่าน PromptPay 0996144478 และแนบสลิปผ่านหน้าเว็บหรือใช้ฟีเจอร์สแกน P2P ส่งสลิปจากมือถือ',
    rules: [
      'ห้ามส่งเสียงดังหลังเวลา 22:00 น.',
      'ห้ามสูบบุหรี่ภายในห้องพักและทางเดินส่วนกลาง',
      'ห้ามเลี้ยงสัตว์ในอาคาร',
      'รักษาความสะอาดบริเวณพื้นที่ส่วนกลางและทิ้งขยะในจุดที่กำหนด'
    ],
    roomsSummary: {},
    availableRooms: [],
    allRooms: [],
    allBills: [],
    allTenants: [],
    currentUserInfo: null,
    tenantBills: [],
    tenantRepairs: []
  };

  try {
    // 1. Rooms statistics and available list
    const [rooms] = await db.query(
      'SELECT id, room_number, room_type, price, floor, status, size, description FROM dorm_rooms ORDER BY CAST(room_number AS UNSIGNED) ASC, room_number ASC'
    );
    context.allRooms = rooms;
    const available = rooms.filter(r => r.status === 'available');
    const occupied = rooms.filter(r => r.status === 'occupied');
    
    context.roomsSummary = {
      total: rooms.length,
      availableCount: available.length,
      occupiedCount: occupied.length
    };
    context.availableRooms = available.map(r => ({
      room_number: r.room_number,
      type: r.room_type || 'Standard',
      price: Number(r.price),
      floor: r.floor,
      size: r.size,
      description: r.description
    }));

    // 2. Fetch all active tenants
    const [tenants] = await db.query(
      `SELECT t.id, t.room_id, r.room_number, t.user_id, t.full_name, t.phone, t.email, t.status
       FROM dorm_tenants t
       LEFT JOIN dorm_rooms r ON t.room_id = r.id
       WHERE t.status = 'active'`
    );
    context.allTenants = tenants;

    // 3. Fetch all bills with accurate columns
    const [bills] = await db.query(
      `SELECT b.id, b.room_id, r.room_number, r.room_type, b.tenant_id, t.full_name AS tenant_name,
              b.period, b.room_price, b.water_units, b.water_price, 
              b.electric_units, b.electric_price, b.other_fees, b.total_amount, 
              b.status, b.paid_at, b.payment_source
       FROM dorm_bills b
       LEFT JOIN dorm_rooms r ON b.room_id = r.id
       LEFT JOIN dorm_tenants t ON b.tenant_id = t.id
       ORDER BY b.period DESC, b.id DESC`
    );
    context.allBills = bills;

    // 4. Fetch move-in payments (ค่าแรกเข้า / จองห้องพัก)
    try {
      const [moveIns] = await db.query(
        `SELECT p.id, p.booking_id, p.user_id, p.room_id, p.total_amount, p.paid_amount,
                p.payment_status as status, p.created_at,
                COALESCE(u.full_name, 'ผู้เช่า') AS tenant_name,
                COALESCE(r.room_number, b_r.room_number) AS room_number,
                COALESCE(r.room_type, b_r.room_type, 'Standard') AS room_type
         FROM move_in_payments p
         LEFT JOIN dorm_users u ON p.user_id = u.id
         LEFT JOIN dorm_bookings b ON p.booking_id = b.id
         LEFT JOIN dorm_rooms r ON p.room_id = r.id
         LEFT JOIN dorm_rooms b_r ON b.room_id = b_r.id
         ORDER BY p.id DESC`
      );
      context.allMoveInPayments = moveIns;
    } catch (e) {
      context.allMoveInPayments = [];
    }

    // 5. If logged in, fetch tenant specific details
    if (currentUser) {
      context.currentUserInfo = {
        id: currentUser.id,
        name: currentUser.full_name,
        role: currentUser.role,
        phone: currentUser.phone,
        email: currentUser.email
      };

      // Match tenant record by user_id or email or phone
      const tenant = tenants.find(t => 
        Number(t.user_id) === Number(currentUser.id) ||
        (t.email && t.email.toLowerCase() === currentUser.email?.toLowerCase()) ||
        (t.phone && currentUser.phone && t.phone === currentUser.phone)
      );

      if (tenant) {
        const assignedRoom = rooms.find(r => r.id === tenant.room_id) || {};
        context.currentUserInfo.room = {
          id: tenant.room_id,
          number: tenant.room_number || assignedRoom.room_number,
          type: assignedRoom.room_type,
          price: assignedRoom.price,
          status: tenant.status
        };

        // Filter user bills
        context.tenantBills = bills.filter(b => 
          Number(b.tenant_id) === Number(tenant.id) || 
          Number(b.room_id) === Number(tenant.room_id)
        );

        // Fetch recent repairs
        const [repairs] = await db.query(
          `SELECT id, category, title, description, status, created_at
           FROM dorm_repairs
           WHERE user_id = ?
           ORDER BY id DESC LIMIT 5`,
          [currentUser.id]
        );
        context.tenantRepairs = repairs;
      }

      // Check move-in payment for current user
      const userMoveIn = (context.allMoveInPayments || []).find(m => Number(m.user_id) === Number(currentUser.id));
      if (userMoveIn) {
        context.tenantMoveIn = userMoveIn;
        if (!context.currentUserInfo.room && userMoveIn.room_number) {
          context.currentUserInfo.room = {
            id: userMoveIn.room_id,
            number: userMoveIn.room_number,
            type: userMoveIn.room_type,
            status: 'booking_' + userMoveIn.status
          };
        }
      }
    }
  } catch (err) {
    console.error('Error querying DB context for chatbot:', err.message);
  }

  return context;
}

// Call Google Gemini API
async function callGoogleGemini(apiKey, systemPrompt, history, userMessage) {
  const models = ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'];
  let lastError = null;

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

      const contents = [];
      // Add conversation history
      if (Array.isArray(history)) {
        for (const h of history.slice(-6)) {
          if (h.content && h.content.trim()) {
            contents.push({
              role: h.role === 'assistant' ? 'model' : 'user',
              parts: [{ text: String(h.content) }]
            });
          }
        }
      }
      // Add current user message
      contents.push({
        role: 'user',
        parts: [{ text: userMessage }]
      });

      const payload = {
        system_instruction: {
          parts: [{ text: systemPrompt }]
        },
        contents,
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 1200
        }
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 12000);

      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!resp.ok) {
        const errText = await resp.text();
        console.warn(`Gemini model ${model} HTTP ${resp.status}:`, errText);
        lastError = new Error(`Gemini ${model} HTTP ${resp.status}`);
        continue;
      }

      const data = await resp.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (text && text.trim()) {
        return { text: text.trim(), model };
      }
    } catch (e) {
      console.warn(`Gemini call ${model} failed:`, e.message);
      lastError = e;
    }
  }

  throw lastError || new Error('All Gemini models failed');
}

// Local smart engine that queries and formats room-specific data accurately
function generateSmartFallback(message, context) {
  const q = (message || '').toLowerCase();
  const isThai = /[ก-๙]/.test(message);
  const isChinese = /[\u4e00-\u9fff]/.test(message);

  // Extract room number if mentioned in message (e.g. "ห้อง 333", "room 202", "333")
  const roomMatch = message.match(/(?:ห้อง|room)\s*([0-9]{3,4})/i) || message.match(/\b([0-9]{3})\b/);
  const queriedRoomNumber = roomMatch ? roomMatch[1] : null;

  // 1. If user queries a specific room number or asks for bills of a room
  if (queriedRoomNumber) {
    const roomBills = context.allBills.filter(b => String(b.room_number) === String(queriedRoomNumber));
    const roomInfo = context.allRooms.find(r => String(r.room_number) === String(queriedRoomNumber));

    if (roomBills.length > 0) {
      const b = roomBills[0];
      const isPaid = (b.status || '').toLowerCase() === 'paid';
      const statusText = isPaid
        ? '✅ ชำระแล้ว (PAID)'
        : (b.status === 'waiting_review' ? '🟡 รอแอดมินตรวจสอบสลิป' : '⚠️ ยังไม่ชำระ (UNPAID)');

      let res = `📋 **ข้อมูลบิลห้อง ${b.room_number} (งวด ${b.period})**\n\n`;
      if (b.tenant_name) res += `- **ผู้เช่า:** คุณ ${b.tenant_name}\n`;
      res += `- **ค่าเช่าห้องพัก:** ${Number(b.room_price || 0).toLocaleString()} บาท\n`;
      res += `- **ค่าน้ำประปา:** ${Number(b.water_price || 0).toLocaleString()} บาท (${b.water_units || 0} หน่วย)\n`;
      res += `- **ค่าไฟฟ้า:** ${Number(b.electric_price || 0).toLocaleString()} บาท (${b.electric_units || 0} หน่วย)\n`;
      if (Number(b.other_fees || 0) > 0) res += `- **ค่าบริการอื่นๆ:** ${Number(b.other_fees).toLocaleString()} บาท\n`;
      res += `- **ยอดรวมสุทธิ:** **${Number(b.total_amount || 0).toLocaleString()} บาท**\n`;
      res += `- **สถานะ:** **${statusText}**\n`;
      if (b.payment_source) res += `- **ช่องทางชำระ:** ${b.payment_source}\n`;

      if (!isPaid) {
        res += `\n💡 **ช่องทางชำระเงิน:** PromptPay **${context.promptPayNumber}**\nเมื่อโอนแล้วสามารถแนบสลิปในระบบ หรือใช้ฟีเจอร์สแกนส่งสลิป P2P จากมือถือได้ทันทีครับ`;
      }
      return res;
    } else if (roomInfo) {
      const isVacant = roomInfo.status === 'available';
      return `ℹ️ **ข้อมูลห้อง ${roomInfo.room_number}**\n\n` +
             `- **ประเภท:** ${roomInfo.room_type || 'Standard'} (ชั้น ${roomInfo.floor || '-'})\n` +
             `- **อัตราค่าเช่า:** ${Number(roomInfo.price).toLocaleString()} บาท/เดือน\n` +
             `- **สถานะปัจจุบัน:** **${isVacant ? '🟢 ห้องว่าง (พร้อมเข้าอยู่)' : '🔴 มีผู้พักอาศัยแล้ว'}**\n` +
             (isVacant ? `\nหากสนใจจองห้องนี้ สามารถกดจองผ่านเมนู "จองห้องพัก" หรือติดต่อแอดมินโทร **${context.contactPhone}** ได้เลยครับ` : '\n(ขณะนี้ยังไม่มีรายการบิลค่าใช้จ่ายที่ค้างชำระสำหรับห้องนี้ครับ)');
    }
  }

  // 2. Available rooms inquiry
  if (q.includes('ห้องว่าง') || q.includes('ว่าง') || q.includes('available') || q.includes('ราคา') || q.includes('price') || q.includes('เท่าไหร่') || q.includes('rate') || q.includes('空房')) {
    const avail = context.availableRooms;
    if (avail.length === 0) {
      if (isChinese) return '抱歉，目前所有房间均已住满。如需排队预订请联系管理员：' + context.contactPhone;
      if (!isThai) return 'Sorry, all rooms are currently occupied. Please contact admin at ' + context.contactPhone + ' for waiting list updates.';
      return 'ขออภัยครับ ขณะนี้ห้องพักเต็มทุกห้อง หากมีห้องว่างจะอัปเดตในระบบทันที หรือติดต่อสอบถามแอดมินโทร **' + context.contactPhone + '** ครับ';
    }

    if (isChinese) {
      let res = `当前共有 **${avail.length}** 间空房：\n\n`;
      avail.slice(0, 5).forEach(r => {
        res += `- **房间号 ${r.room_number}** (${r.type}) 楼层: ${r.floor || '-'} | 租金: **${r.price?.toLocaleString()} 泰铢/月**\n`;
      });
      res += `\n如需看房或预订，请联系电话：**${context.contactPhone}**`;
      return res;
    }

    if (!isThai) {
      let res = `Currently we have **${avail.length}** available room(s):\n\n`;
      avail.slice(0, 5).forEach(r => {
        res += `- **Room ${r.room_number}** (${r.type}) Floor: ${r.floor || '-'} | Rate: **฿${r.price?.toLocaleString()}/month**\n`;
      });
      res += `\nTo book or inquire, please contact admin at **${context.contactPhone}**.`;
      return res;
    }

    let res = `ปัจจุบันมีห้องพักว่างทั้งหมด **${avail.length}** ห้องครับ:\n\n`;
    avail.forEach(r => {
      res += `- 🚪 **ห้อง ${r.room_number}** (ประเภท: ${r.type}) ชั้น ${r.floor || '-'} | ค่าเช่า: **${r.price?.toLocaleString()} บาท/เดือน**\n`;
    });
    res += `\nสามารถกดดูรายละเอียดและจองห้องพักผ่านหน้าเว็บ หรือติดต่อสอบถามได้ที่เบอร์ **${context.contactPhone}** ครับ`;
    return res;
  }

  // 3. User checking their personal bill (เช็คยอดบิลค่าเช่าเดือนนี้ของฉัน)
  if (q.includes('บิล') || q.includes('ค่าเช่า') || q.includes('ยอด') || q.includes('ค่าไฟ') || q.includes('ค่าน้ำ') || q.includes('bill') || q.includes('rent') || q.includes('账单')) {
    // If user is logged in as a tenant and has an assigned room
    if (context.currentUserInfo?.room) {
      const bills = context.tenantBills;
      if (bills.length > 0) {
        const b = bills[0];
        const isPaid = (b.status || '').toLowerCase() === 'paid';
        const st = isPaid ? '✅ ชำระแล้ว (PAID)' : (b.status === 'waiting_review' ? '🟡 รอตรวจสอบสลิป' : '⚠️ ยังไม่ชำระ (UNPAID)');

        return `สวัสดีครับคุณ **${context.currentUserInfo.name}** (ห้อง **${context.currentUserInfo.room.number}**):\n\n` +
               `📄 **บิลค่าใช้จ่ายงวดล่าสุด (${b.period})**\n` +
               `- **ค่าห้องพัก:** ${Number(b.room_price || 0).toLocaleString()} บาท\n` +
               `- **ค่าน้ำประปา:** ${Number(b.water_price || 0).toLocaleString()} บาท (${b.water_units || 0} หน่วย)\n` +
               `- **ค่าไฟฟ้า:** ${Number(b.electric_price || 0).toLocaleString()} บาท (${b.electric_units || 0} หน่วย)\n` +
               (Number(b.other_fees || 0) > 0 ? `- **ค่าบริการอื่นๆ:** ${Number(b.other_fees).toLocaleString()} บาท\n` : '') +
               `- **ยอดรวมที่ต้องชำระ:** **${Number(b.total_amount || 0).toLocaleString()} บาท**\n` +
               `- **สถานะ:** **${st}**\n\n` +
               (!isPaid
                 ? `💡 ช่องทางชำระเงิน PromptPay: **${context.promptPayNumber}** สามารถแนบสลิปผ่านเมนู "บิลค่าเช่า" หรือใช้ฟีเจอร์สแกนส่งสลิป P2P ได้ทันทีครับ`
                 : `🎉 บิลนี้ได้รับการชำระเรียบร้อยแล้วครับ (${b.payment_source || 'ตรวจพบเงินเข้าอัตโนมัติ'}) ขอบคุณครับ!`);
      } else {
        return `สวัสดีครับคุณ **${context.currentUserInfo.name}** (ห้อง **${context.currentUserInfo.room.number}**)\n\nขณะนี้ยังไม่มีบิลค้างชำระในระบบสำหรับห้องของคุณครับ หากมีข้อสงสัยสามารถติดต่อผู้ดูแลหอพักได้ตลอดเวลาครับ`;
      }
    }

    // If user is Admin / Owner
    if (context.currentUserInfo?.role === 'owner' || context.currentUserInfo?.role === 'admin') {
      const unpaid = context.allBills.filter(b => b.status === 'unpaid' || b.status === 'waiting_review');
      const paid = context.allBills.filter(b => b.status === 'paid');
      let text = `👑 **รายงานบิลงวดล่าสุดสำหรับผู้ดูแลระบบ:**\n\n` +
                 `- ห้องที่ชำระแล้ว: **${paid.length}** ห้อง\n` +
                 `- ห้องที่ค้างชำระ: **${unpaid.length}** ห้อง\n\n`;
      if (unpaid.length > 0) {
        text += `**รายการค้างชำระ:**\n`;
        unpaid.forEach(u => {
          text += `- ห้อง ${u.room_number} (${u.tenant_name || 'ผู้เช่า'}): **${Number(u.total_amount).toLocaleString()} ฿** (สถานะ: ${u.status})\n`;
        });
      }
      return text;
    }

    // Guest / Visitor asks for bill
    return `สวัสดีครับ! เนื่องจากคุณยังไม่ได้เข้าสู่ระบบ คุณพักอยู่ห้องไหนครับ?\n\n` +
           `👉 คุณสามารถพิมพ์บอกเลขห้องได้เลย เช่น **"ห้อง 333"** หรือ **"ห้อง 202"** หรือ **"ห้อง 101"** ผมจะตรวจสอบยอดบิลและค่าน้ำ-ค่าไฟให้ทันทีครับ!\n` +
           `*(หรือเข้าสู่ระบบ เพื่อให้ระบบจำห้องของคุณอัตโนมัติครับ)*`;
  }

  // 3.1 Move-in / Deposit / Booking inquiries (ค่าแรกเข้า / ค่าประกัน / เงินมัดจำ)
  if (q.includes('ค่าแรกเข้า') || q.includes('มัดจำ') || q.includes('ประกัน') || q.includes('จอง') || q.includes('deposit') || q.includes('move-in') || q.includes('move in')) {
    if (context.tenantMoveIn) {
      const m = context.tenantMoveIn;
      const st = m.status === 'approved' ? '✅ อนุมัติเรียบร้อยแล้ว' : (m.status === 'rejected' ? '❌ สลิปไม่ถูกต้อง' : '🟡 รอแอดมินตรวจสอบสลิป');
      return `🎉 **ข้อมูลค่าแรกเข้า/เงินประกันห้อง ${m.room_number} ของคุณ:**\n\n` +
             `- **ผู้เช่า:** คุณ ${m.tenant_name}\n` +
             `- **ยอดชำระค่าแรกเข้า:** **${Number(m.paid_amount || m.total_amount || 0).toLocaleString()} บาท**\n` +
             `- **สถานะการชำระ:** **${st}**\n\n` +
             (m.status === 'approved'
               ? 'ยินดีด้วยครับ สัญญาและค่าแรกเข้าของคุณได้รับอนุมัติแล้ว พร้อมเข้าพักตามกำหนดได้เลยครับ!'
               : `หากชำระผ่าน PromptPay **${context.promptPayNumber}** เรียบร้อยแล้ว แอดมินจะตรวจสอบและอนุมัติสัญญาให้อย่างรวดเร็วครับ`);
    } else if (context.currentUserInfo?.room) {
      return `สวัสดีครับคุณ **${context.currentUserInfo.name}** (ห้อง **${context.currentUserInfo.room.number}**)\n\nค่าแรกเข้าของคุณได้รับการจัดการเรียบร้อยแล้วตั้งแต่เริ่มทำสัญญา หากต้องการเช็คบิลค่าเช่าประจำเดือน สามารถพิมพ์ **"เช็คบิลของฉัน"** ได้เลยครับ`;
    } else {
      return `ℹ️ **ข้อมูลค่าแรกเข้าและเงินประกันหอพัก DormEase:**\n\n` +
             `- **เงินประกันความเสียหาย:** 3,500 บาท (คืนให้เมื่อย้ายออกตามเงื่อนไขสัญญา)\n` +
             `- **ค่าเช่าล่วงหน้า:** 1 เดือน (ตามอัตราค่าเช่าของแต่ละห้องพัก เช่น 3,000 - 3,600 บาท)\n` +
             `- **รวมค่าแรกเข้าเฉลี่ย:** ประมาณ **6,500 - 7,100 บาท**\n\n` +
             `👉 ท่านสามารถเลือกห้องที่ต้องการในเมนู "จองห้องพัก" เพื่อดูยอดชำระค่าแรกเข้าที่แน่นอนและชำระผ่านระบบได้ทันทีครับ`;
    }
  }

  // 4. Payment instructions & channels
  if (q.includes('จ่ายเงิน') || q.includes('โอน') || q.includes('ชำระ') || q.includes('สลิป') || q.includes('promptpay') || q.includes('บัญชี') || q.includes('pay')) {
    return `💳 **ช่องทางการชำระเงินหอพัก DormEase**\n\n` +
           `- **พร้อมเพย์ (PromptPay):** **${context.promptPayNumber}** (ชื่อบัญชี: หอพัก DormEase)\n` +
           `- **กำหนดชำระ:** ภายในวันที่ 5 ของทุกเดือน\n` +
           `- **วิธีแนบสลิป:**\n` +
           `  1. เข้าสู่ระบบ แล้วไปที่เมนู **"บิลค่าใช้จ่าย"** เพื่ออัปโหลดรูปสลิป\n` +
           `  2. หรือใช้ฟีเจอร์ **"สแกน QR Code (P2P)"** ส่งสลิปจากมือถือเข้าคอมพิวเตอร์ได้ทันที\n` +
           `  3. ระบบมีระบบตรวจจับเงินเข้าอัตโนมัติจาก LINE Connext เมื่อเงินเข้าตรงยอด บิลจะอนุมัติทันทีครับ!`;
  }

  // 5. Repair tickets
  if (q.includes('ซ่อม') || q.includes('พัง') || q.includes('ชำรุด') || q.includes('repair') || q.includes('fix')) {
    if (context.currentUserInfo?.room) {
      const repairs = context.tenantRepairs;
      if (repairs.length > 0) {
        let repText = repairs.map(r => `- **${r.title}** (${r.category}): สถานะ **${r.status === 'completed' ? 'ซ่อมเสร็จแล้ว' : (r.status === 'in_progress' ? 'กำลังดำเนินการ' : 'รอดำเนินการ')}**`).join('\n');
        return `🔧 **รายการแจ้งซ่อมล่าสุดของคุณ:**\n\n${repText}\n\nหากต้องการแจ้งซ่อมเพิ่มเติม สามารถกดที่เมนู **"แจ้งซ่อม"** ในระบบได้ทันที ช่างจะรีบเข้าดูแลครับ`;
      }
    }
    return `🔧 **การแจ้งซ่อมอุปกรณ์ในห้องพัก:**\n\nหากมีอุปกรณ์ชำรุด เช่น แอร์ ไฟ น้ำประปา สามารถเข้าสู่ระบบแล้วไปที่เมนู **"แจ้งซ่อม"** เพื่อแนบรูปถ่ายและส่งเรื่องได้เลยครับ ช่างจะนัดหมายเข้าซ่อมอย่างรวดเร็ว หรือโทรแจ้งแอดมินที่เบอร์ **${context.contactPhone}** ได้ตลอดเวลาครับ`;
  }

  // 6. Dorm Rules & General Contact
  return `สวัสดีครับ! ผมคือ **DormEase AI Assistant** ผู้ช่วยอัจฉริยะประจำหอพัก ยินดีให้บริการครับ ✨\n\n` +
         `- 📞 **เบอร์ติดต่อหอพัก / นิติ:** **${context.contactPhone}** (เวลาทำการ 08:30 - 18:00 น.)\n` +
         `- 📶 **Wi-Fi ส่วนกลาง:** SSID \`${context.wifiSSID}\` (รหัสผ่านดูได้ที่หน้าโปรไฟล์ของคุณ)\n` +
         `- 🚪 **ห้องว่างปัจจุบัน:** มีว่างทั้งหมด **${context.availableRooms.length}** ห้อง\n` +
         `- 📢 **กฎระเบียบหอพัก:** งดส่งเสียงดังหลัง 22:00 น., ห้ามสูบบุหรี่ในห้องพัก, ห้ามเลี้ยงสัตว์\n\n` +
         `💡 **คุณสามารถถามผมได้เลยครับ เช่น:**\n` +
         `- *"เช็คยอดบิลค่าเช่าเดือนนี้ของฉัน"*\n` +
         `- *"บิลห้อง 333" หรือ "ห้อง 202 ค้างจ่ายไหม"*\n` +
         `- *"มีห้องว่างไหม ราคาเท่าไหร่บ้าง"*\n` +
         `- *"ช่องทางการชำระเงินและพร้อมเพย์"*`;
}

// 1. GET /api/chatbot/quick-prompts
router.get('/quick-prompts', (req, res) => {
  res.json({
    th: [
      'มีห้องว่างไหม ราคาเท่าไหร่บ้าง?',
      'เช็คยอดบิลค่าเช่าเดือนนี้ของฉัน',
      'เช็คบิลห้อง 333',
      'เช็คบิลห้อง 202',
      'ช่องทางการชำระเงินและแนบสลิป',
      'สถานะการแจ้งซ่อมของฉัน',
      'กฎระเบียบและเบอร์ติดต่อหอพัก'
    ],
    en: [
      'Are there any available rooms and rates?',
      'Check my bill for this month',
      'Check Room 333 bill',
      'Check Room 202 bill',
      'How to pay rent & PromptPay details',
      'Check my repair request status',
      'Dormitory rules & contact information'
    ],
    zh: [
      '目前有空房间吗？租金是多少？',
      '查询我本月的租金账单',
      '查询333号房账单',
      '缴费方式与PromptPay账号',
      '查看我的报修进度',
      '宿舍守则及前台联系电话'
    ]
  });
});

// 2. GET /api/chatbot/config
router.get('/config', (req, res) => {
  const key = getGeminiApiKey();
  res.json({
    hasGeminiKey: Boolean(key),
    maskedKey: key ? key.slice(0, 6) + '...' + key.slice(-4) : '',
    defaultModel: 'gemini-1.5-flash',
    status: key ? 'ready' : 'fallback_engine'
  });
});

// 3. POST /api/chatbot/config (Save Gemini API Key)
router.post('/config', (req, res) => {
  try {
    const { gemini_api_key } = req.body;
    const key = (gemini_api_key || '').trim();
    const cfg = { gemini_api_key: key, updated_at: new Date().toISOString() };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(cfg, null, 2), 'utf-8');
    process.env.GEMINI_API_KEY = key;
    res.json({
      success: true,
      hasGeminiKey: Boolean(key),
      message: key ? 'บันทึก Google Gemini API Key สำเร็จแล้ว! ระบบจะใช้ Google Gemini AI ประมวลผลคำตอบ' : 'ล้าง API Key เรียบร้อยแล้ว'
    });
  } catch (err) {
    res.status(500).json({ error: 'ไม่สามารถบันทึก Config ได้: ' + err.message });
  }
});

// 3.1 POST /api/chatbot/test-gemini (Test Gemini Key connection)
router.post('/test-gemini', async (req, res) => {
  try {
    const { gemini_api_key } = req.body;
    const key = (gemini_api_key || '').trim() || getGeminiApiKey();
    if (!key) {
      return res.status(400).json({ success: false, error: 'กรุณาระบุ Gemini API Key ก่อนทำการทดสอบ' });
    }
    const testResult = await callGoogleGemini(
      key,
      'You are a testing assistant for DormEase Dormitory. Respond politely with 1 sentence in Thai confirming that Google Gemini is active.',
      [],
      'ทดสอบการเชื่อมต่อ Gemini AI'
    );
    res.json({
      success: true,
      message: 'เชื่อมต่อ Google Gemini สำเร็จ!',
      model: testResult.model,
      sampleReply: testResult.text
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: 'ไม่สามารถเชื่อมต่อ Gemini ได้: ' + (err.message || 'API Key อาจไม่ถูกต้องหรือโควตาหมด')
    });
  }
});

// 4. POST /api/chatbot/message
router.post('/message', async (req, res) => {
  try {
    const { message, history = [], gemini_api_key } = req.body;
    if (!message || typeof message !== 'string' || !message.trim()) {
      return res.status(400).json({ error: 'กรุณาระบุข้อความคำถาม (message)' });
    }

    const trimmedMsg = message.trim();
    const currentUser = await getOptionalUser(req);
    const dbContext = await buildDatabaseContext(currentUser);

    // Prepare system instructions with rich real-time DB Context
    const systemPrompt = `You are "DormEase AI", a polite, intelligent, and helpful AI assistant for the Dormitory Management System named "DormEase" (หอพักดอร์มอีส).
You are integrated with Google Gemini LLM and connected to the live database of DormEase.
Always answer in the SAME LANGUAGE as the user's inquiry (Thai if user asked in Thai, English if English, Chinese if Chinese).
Format your responses with clean Markdown (bullet points, bold text).
Never invent room numbers or fake balances that do not exist in the real-time context.

=== REAL-TIME DORMEASE DORMITORY DATABASE CONTEXT ===
- Dormitory Name: ${dbContext.dormName}
- Contact / Office Phone: ${dbContext.contactPhone}
- PromptPay Account: ${dbContext.promptPayNumber}
- Wi-Fi SSID: ${dbContext.wifiSSID}
- Payment Policy: ${dbContext.paymentNotice}
- Rules:
${dbContext.rules.map(r => '  * ' + r).join('\n')}

- Available Rooms in DB:
  Total rooms: ${dbContext.roomsSummary.total || 0}, Available: ${dbContext.roomsSummary.availableCount || 0}, Occupied: ${dbContext.roomsSummary.occupiedCount || 0}
  Available list:
${dbContext.availableRooms.length > 0 ? dbContext.availableRooms.map(r => `  * Room ${r.room_number}: Type: ${r.type}, Floor: ${r.floor || '-'}, Rate: ฿${r.price?.toLocaleString()}/month, Size: ${r.size || '-'}`).join('\n') : '  * Currently NO rooms available (100% occupied).'}

- All Room Bills in DB (Latest Period: 2026-10):
${dbContext.allBills.slice(0, 10).map(b => `  * Room ${b.room_number} (${b.tenant_name || 'Occupant'}): Period: ${b.period}, Rent: ฿${b.room_price}, Water: ฿${b.water_price}, Electric: ฿${b.electric_price}, Total: ฿${b.total_amount} -> Status: [${b.status?.toUpperCase()}] (Paid At: ${b.paid_at || 'Not paid'}, Source: ${b.payment_source || '-'})`).join('\n')}

- Current User Context:
  ${currentUser ? `User is logged in: Name: "${currentUser.full_name}", Role: "${currentUser.role}", Phone: "${currentUser.phone || '-'}"` : 'User is a guest / visitor (not logged in).'}
  ${dbContext.currentUserInfo?.room ? `Assigned Room: Room ${dbContext.currentUserInfo.room.number} (${dbContext.currentUserInfo.room.type || 'Standard'}), Monthly Rate: ฿${dbContext.currentUserInfo.room.price || '-'}` : ''}
  ${dbContext.tenantBills && dbContext.tenantBills.length > 0 ? `User's Own Bills:
${dbContext.tenantBills.map(b => `    * Period: ${b.period} | Rent: ฿${b.room_price} | Water: ฿${b.water_price} | Electric: ฿${b.electric_price} | Total: ฿${b.total_amount} | Status: ${b.status}`).join('\n')}` : 'No personal monthly bills found for this user.'}
  ${dbContext.tenantMoveIn ? `User's Move-In / Deposit Payment: Room ${dbContext.tenantMoveIn.room_number}, Amount: ฿${dbContext.tenantMoveIn.paid_amount || dbContext.tenantMoveIn.total_amount}, Status: ${dbContext.tenantMoveIn.status}` : ''}
  ${dbContext.tenantRepairs && dbContext.tenantRepairs.length > 0 ? `User's Own Repairs:
${dbContext.tenantRepairs.map(rep => `    * Ticket #${rep.id} [${rep.category}] "${rep.title}" - Status: ${rep.status}`).join('\n')}` : 'No repair requests found for this user.'}
=== END OF DATABASE CONTEXT ===

Instructions:
1. If the user asks to check their bill ("เช็คยอดบิลค่าเช่าเดือนนี้ของฉัน"):
   - If the user is logged in and has an assigned room, provide their exact room number, bill period, rent, water, electric, total, and status (PAID or UNPAID).
   - If the user is NOT logged in, politely explain they are not logged in and ask what room they stay in (e.g. "Room 333", "Room 202") or encourage them to log in.
2. If the user asks about a specific room (e.g. "ห้อง 333", "ห้อง 202", "ห้อง 101"):
   - Look up that room from "All Room Bills in DB" and report that room's bill breakdown and whether it is paid or unpaid.
3. If the user asks about available rooms, answer with the real available rooms from the context.
4. If the user asks about Move-in payment / deposit ("ค่าแรกเข้า", "มัดจำ", "เงินประกัน"):
   - If user has move-in payment, inform them of room, amount, and status.
   - Otherwise explain standard move-in deposit is 3,500 THB + 1st month rent.
5. If the user asks how to pay or PromptPay, provide 0996144478 and mention the P2P QR scan feature.
6. Answer concisely, politely, and warmly.`;

    const activeApiKey = (gemini_api_key || '').trim() || req.headers['x-gemini-key'] || getGeminiApiKey();

    let replyText = '';
    let usedProvider = 'local-smart-engine';

    // 1. Try Google Gemini if API Key is available
    if (activeApiKey) {
      try {
        const geminiResult = await callGoogleGemini(activeApiKey, systemPrompt, history, trimmedMsg);
        if (geminiResult && geminiResult.text) {
          replyText = geminiResult.text;
          usedProvider = `Google Gemini (${geminiResult.model})`;
        }
      } catch (geminiErr) {
        console.warn('Gemini execution error, falling back to local smart engine:', geminiErr.message);
      }
    }

    // 2. If Gemini not used or failed, use Enhanced Local Smart Engine with Real-Time DB Context
    if (!replyText || !replyText.trim()) {
      usedProvider = activeApiKey ? 'DormEase Smart AI (Gemini Fallback)' : 'DormEase Smart AI Engine';
      replyText = generateSmartFallback(trimmedMsg, dbContext);
    }

    return res.json({
      reply: replyText.trim(),
      provider: usedProvider,
      hasGeminiKey: Boolean(activeApiKey),
      contextUsed: {
        roomsAvailable: dbContext.availableRooms.length,
        hasTenantInfo: !!dbContext.currentUserInfo?.room,
        userRole: currentUser?.role || 'guest'
      }
    });

  } catch (err) {
    console.error('Chatbot route error:', err);
    res.status(500).json({ error: 'เกิดข้อผิดพลาดในการประมวลผลคำตอบ: ' + err.message });
  }
});

export default router;

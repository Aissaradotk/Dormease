/**
 * =================================================================================================
 * DormEase Backend Server Entry Point (src/index.js)
 * =================================================================================================
 * ไฟล์นี้เป็นศูนย์กลางหลักของฝั่ง Backend (Node.js + Express) ทำหน้าที่:
 * 1. กำหนดค่า Server และ Middleware (CORS, JSON Parser, URL-encoded)
 * 2. ลงทะเบียน (Register) API Routes ทั้งหมดของระบบ และชี้ทางไปยังไฟล์ Route ย่อยในโฟลเดอร์ src/routes/
 * 3. จัดการ Endpoint พิเศษสำหรับการอัปโหลดข้ามอุปกรณ์ (P2P Upload)
 * 
 * แผนผังการเชื่อมโยง (System Connection Architecture):
 * - Frontend (React/Vite): เรียกมาที่ http://localhost:4000/api ผ่าน frontend/src/lib/api.js
 * - Payment Listener (Python): ส่ง Webhook ตรวจจับเงินเข้าที่ /api/payment/notify
 * - Database (MySQL): จัดการ Connection Pool ผ่าน src/db.js
 * =================================================================================================
 */

import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// -------------------------------------------------------------------------------------------------
// นำเข้าโมดูล Routing ย่อย (Import Child Route Modules)
// -------------------------------------------------------------------------------------------------
import authRoutes from "./routes/auth.js";                         // เชื่อมกับ: หน้า Login/Register, ตาราง dorm_users
import profileRoutes from "./routes/profile.js";                   // เชื่อมกับ: ข้อมูลโปรไฟล์ผู้ใช้ปัจจุบัน
import dashboardRoutes from "./routes/dashboard.js";               // เชื่อมกับ: Dashboard.jsx (สถิติภาพรวมหอพัก)
import roomsRoutes from "./routes/rooms.js";                       // เชื่อมกับ: Rooms.jsx (ผังห้องพัก), ตาราง dorm_rooms
import tenantsRoutes from "./routes/tenants.js";                   // เชื่อมกับ: Tenants.jsx (ทะเบียนผู้เช่า), ตาราง dorm_users
import paymentsRoutes from "./routes/payments.js";                 // เชื่อมกับ: Payments.jsx, TenantPayments.jsx, ตาราง dorm_payments
import bookingsRoutes from "./routes/bookings.js";                 // เชื่อมกับ: Bookings.jsx, BookRoom.jsx, ตาราง dorm_bookings
import repairsRoutes from "./routes/repairs.js";                   // เชื่อมกับ: Repairs.jsx, TenantRepairs.jsx, ตาราง dorm_repairs
import billsRoutes from "./routes/bills.js";                       // เชื่อมกับ: MonthlyBills.jsx, TenantBills.jsx, ตาราง dorm_monthly_bills
import moveOutsRoutes from "./routes/moveOuts.js";                 // เชื่อมกับ: MoveOuts.jsx, TenantMoveOut.jsx, ตาราง dorm_move_outs
import notificationsRoutes from "./routes/notifications.js";       // เชื่อมกับ: Notifications.jsx, TenantNotifications.jsx, ตาราง dorm_notifications
import p2pRoutes from "./routes/p2p.js";                           // เชื่อมกับ: P2PUploadModal.jsx, P2PMobileUpload.jsx (อัปโหลดรูปผ่านมือถือ)
import chatbotRoutes from "./routes/chatbot.js";                   // เชื่อมกับ: ChatbotWidget.jsx, ChatBot.jsx (ระบบ AI ถาม-ตอบ)
import residenceCertRoutes from "./routes/residenceCertificates.js";// เชื่อมกับ: ResidenceCertificate.jsx, AdminResidenceCertificates.jsx
import initialFeesRoutes from "./routes/initialFees.js";           // เชื่อมกับ: AdminInitialFees.jsx, ตาราง dorm_initial_fee_settings
import moveInPaymentsRoutes from "./routes/moveInPayments.js";      // เชื่อมกับ: MoveInPayment.jsx, AdminMoveInPayments.jsx, ตาราง dorm_move_in_payments
import residentVerificationsRoutes from "./routes/residentVerifications.js"; // เชื่อมกับ: ResidentVerificationPage.jsx, AdminResidentVerifications.jsx
import settingsRoutes from "./routes/settings.js";                 // เชื่อมกับ: NoticeSettingsCard.jsx (การตั้งค่าบิลและประกาศ)
import paymentNotificationRoutes from "./routes/paymentNotification.js"; // เชื่อมกับ: LinePaymentListener.pyw (ระบบตรวจจับเงินโอนอัตโนมัติ)

// โหลดค่าตัวแปรสภาพแวดล้อมจากไฟล์ .env
dotenv.config();

const app = express();

// -------------------------------------------------------------------------------------------------
// Middleware Setup
// -------------------------------------------------------------------------------------------------
// อนุญาตให้ Frontend ข้ามโดเมนเรียกใช้งาน API ได้ (Cross-Origin Resource Sharing)
app.use(cors());

// รองรับ Payload ข้อมูลขนาดใหญ่สูงสุด 15MB สำหรับการส่งรูปภาพ Base64 เช่น สลิปโอนเงิน หรือรูปแจ้งซ่อม
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

// -------------------------------------------------------------------------------------------------
// API Route Registration (การผูก Base URL เข้ากับ Route Handler แต่ละส่วน)
// -------------------------------------------------------------------------------------------------
// 1. ระบบยืนยันตัวตนและการเข้าสู่ระบบ
app.use("/api/auth", authRoutes);

// 2. ข้อมูลส่วนตัวและโปรไฟล์ผู้ใช้
app.use("/api/profile", profileRoutes);

// 3. ข้อมูลสถิติแดชบอร์ดสำหรับเจ้าของหอพัก (สรุปยอดรายรับ อัตราการเข้าพัก กราฟ)
app.use("/api/dashboard", dashboardRoutes);

// 4. ระบบจัดการข้อมูลห้องพักและสถานะ (ว่าง, จองแล้ว, มีผู้พัก)
app.use("/api/rooms", roomsRoutes);

// 5. ระบบจัดการทะเบียนผู้เช่าและบันทึกประวัติ
app.use("/api/tenants", tenantsRoutes);

// 6. ระบบบันทึกและตรวจสอบสลิปการชำระเงิน
app.use("/api/payments", paymentsRoutes);

// 7. Webhook รับข้อมูลเงินโอนจากระบบตรวจจับภายนอก (Zero-Cost LINE Automation)
app.use("/api/payment", paymentNotificationRoutes);

// 8. ระบบจัดการคำขอจองห้องพัก
app.use("/api/bookings", bookingsRoutes);

// 9. ระบบแจ้งซ่อมบำรุง ติดตามสถานะงานช่าง
app.use("/api/repairs", repairsRoutes);

// 10. ระบบออกบิลรายเดือน มิเตอร์ค่าน้ำ ค่าไฟ และสุ่มเศษสตางค์
app.use("/api/bills", billsRoutes);

// 11. ระบบแจ้งย้ายออกล่วงหน้า และการคืนเงินมัดจำประกัน
app.use("/api/move-outs", moveOutsRoutes);

// 12. ระบบกระจายข่าวสารและกล่องแจ้งเตือนผู้พักอาศัย
app.use("/api/notifications", notificationsRoutes);

// 13. ระบบ P2P สแกน QR อัปโหลดไฟล์จากสมาร์ตโฟนขึ้นคอมพิวเตอร์แบบ Realtime
app.use("/api/p2p", p2pRoutes);

// 14. ระบบ AI Chatbot ถามตอบปัญหาหอพักและแนะนำการใช้งาน
app.use("/api/chatbot", chatbotRoutes);

// 15. ระบบออกหนังสือรับรองการพักอาศัย
app.use("/api/residence-certificates", residenceCertRoutes);

// 16. ระบบตั้งค่าและกำหนดอัตราค่าแรกเข้า / เงินประกัน
app.use("/api/initial-fees", initialFeesRoutes);

// 17. ระบบชำระเงินแรกเข้าและอนุมัติหลักฐาน
app.use("/api/move-in-payments", moveInPaymentsRoutes);
app.use("/api/admin/move-in-payments", moveInPaymentsRoutes);

// 18. ระบบอัปโหลดและตรวจสอบเอกสารยืนยันตัวตน (บัตร ปชช. / สัญญา)
app.use("/api/resident-verifications", residentVerificationsRoutes);
app.use("/api/admin/resident-verifications", residentVerificationsRoutes);

// 19. ระบบบันทึกการตั้งค่าระบบและข้อความแจ้งเตือนบิล
app.use("/api/settings", settingsRoutes);

// -------------------------------------------------------------------------------------------------
// Special Routes & Health Check
// -------------------------------------------------------------------------------------------------
// ตัวช่วย Redirect เมื่อผู้ใช้สแกน QR Code จากโทรศัพท์เข้าหน้าอัปโหลด P2P
app.get("/p2p-upload", (req, res) => {
  res.redirect(`/api/p2p/upload-page?session=${req.query.session || ""}`);
});

// Health check endpoint ตรวจสอบว่าเซิร์ฟเวอร์เปิดทำงานอยู่ปกติ
app.get("/", (req, res) => res.send("DormEase API (MySQL) is running"));

// เริ่มต้นรันเซิร์ฟเวอร์ตาม Port ที่ระบุใน .env (ค่าเริ่มต้น 4000)
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`DormEase backend running on http://localhost:${PORT}`));

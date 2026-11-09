import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import PageHeaderTabs from "../components/PageHeaderTabs";

const API = "http://119.59.102.161:3007";
const PROMPTPAY = "0996144478";

export default function MoveInPayment() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [allRooms, setAllRooms] = useState([]);
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [initialFeeRates, setInitialFeeRates] = useState([]);
  const [existingPayment, setExistingPayment] = useState(null);
  const [loading, setLoading] = useState(true);

  // ตัวเลือกรูปแบบการชำระ: "full" = รวมทุกอย่างในรอบเดียว, "deposit_only" = เฉพาะค่าประกัน+คีย์การ์ด
  const [payMode, setPayMode] = useState("full");

  const [paidAmount, setPaidAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("promptpay");
  const [slip, setSlip] = useState(null);
  const [slipPreview, setSlipPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function apiFetch(url) {
    const token = localStorage.getItem("token");
    const res = await fetch(`${API}${url}`, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return null;
    return res.json();
  }

  async function loadData() {
    setLoading(true);
    try {
      const [bookings, roomsData, feeRates] = await Promise.all([
        apiFetch("/api/bookings/my"),
        apiFetch("/api/rooms"),
        apiFetch("/api/initial-fees"),
      ]);

      setAllRooms(Array.isArray(roomsData) ? roomsData : []);
      setInitialFeeRates(Array.isArray(feeRates) ? feeRates : []);

      const searchParams = new URLSearchParams(window.location.search);
      const urlBookingId = searchParams.get("booking_id");
      const urlRoomId = searchParams.get("room_id");

      // Filter only active bookings (exclude completed, cancelled, rejected)
      const validBookings = Array.isArray(bookings)
        ? bookings.filter(b => b.status === "approved" || b.status === "confirmed" || b.status === "pending")
        : [];

      let activeBooking = null;
      if (urlBookingId) {
        activeBooking = (Array.isArray(bookings) ? bookings.find(b => String(b.id) === String(urlBookingId) && (b.status === "approved" || b.status === "confirmed" || b.status === "pending")) : null) || null;
      }
      if (!activeBooking) {
        activeBooking = validBookings[0] || null;
      }
      setBooking(activeBooking || null);

      const pays = await apiFetch("/api/move-in-payments/my");
      // STRICT MATCHING: Only match payment belonging to this specific booking_id.
      // Never fall back to room_id or pays[0] to prevent reusing old slips after move-out!
      let pay = null;
      if (activeBooking && Array.isArray(pays)) {
        pay = pays.find(p => Number(p.booking_id) === Number(activeBooking.id)) || null;
      }
      setExistingPayment(pay || null);

      if (activeBooking) {
        setSelectedRoomId(String(activeBooking.room_id));
      } else {
        setSelectedRoomId("");
      }
    } catch (err) {
      console.error("loadData MoveInPayment error:", err);
    }
    setLoading(false);
  }

  // หาห้องที่เลือกปัจจุบัน - ล็อคเฉพาะห้องที่ทำการจองเท่านั้น ป้องกันการชำระเงินโดยยังไม่ได้จองห้อง
  const currentRoom = booking
    ? (allRooms.find(r => String(r.id) === String(booking.room_id)) || {
        id: booking.room_id,
        room_number: booking.room_number || String(booking.room_id),
        room_type: booking.room_type,
        price: booking.price || 3500,
        size: booking.size || "24 ตร.ม.",
        floor: booking.floor,
      })
    : null;

  // คำนวณขนาดห้อง: เล็ก (1) หรือ ใหญ่ (2)
  function isLargeRoom(room) {
    if (!room) return false;
    const sizeNum = parseFloat(room.size) || 0;
    return sizeNum > 26 ||
           /suite|1-bedroom|corner|vip|deluxe|ใหญ่/i.test(room.room_type || "") ||
           (Number(room.price) >= 4000);
  }

  const isLarge = isLargeRoom(currentRoom);
  const categoryId = isLarge ? 2 : 1;
  const categoryName = isLarge ? "🏰 ห้องขนาดใหญ่ (Large Room)" : "🏢 ห้องขนาดเล็ก (Small Room)";
  const categoryDesc = isLarge ? "ห้องสวีท, 1 ห้องนอน หรือพื้นที่มากกว่า 26 ตร.ม." : "ห้องสตูดิโอ, สแตนดาร์ด หรือพื้นที่ไม่เกิน 26 ตร.ม.";

  // ดึงค่าประกันและค่าคีย์การ์ดตามขนาดห้อง
  const catFees = initialFeeRates.filter(f => Number(f.room_type_id) === categoryId && f.is_active);
  const depositFee = catFees.find(f => f.fee_name === "ค่าประกัน")?.amount ?? (isLarge ? 5000 : 3000);
  const keycardFee = catFees.find(f => f.fee_name === "ค่าคีย์การ์ด")?.amount ?? (isLarge ? 500 : 300);
  const roomRent = currentRoom ? Number(currentRoom.price || 3500) : 3500;

  // รายการคำนวณตามรูปแบบที่เลือก
  const lineItems = [
    ...(payMode === "full" ? [{
      id: "rent",
      icon: "🏠",
      title: lang === "en" ? "First Month Room Rent" : "ค่าเช่าห้องพักงวดแรก (เดือนแรก)",
      desc: lang === "en" ? `Room ${currentRoom?.room_number || ""}` : `ค่าห้องตามราคาจริง ห้อง ${currentRoom?.room_number || ""}`,
      amount: roomRent,
    }] : []),
    {
      id: "deposit",
      icon: "🛡️",
      title: lang === "en" ? `Security Deposit (${isLarge ? "Large" : "Small"} Room)` : `ค่าประกันห้องพัก (${isLarge ? "ห้องขนาดใหญ่" : "ห้องขนาดเล็ก"})`,
      desc: lang === "en" ? "Refundable upon move-out" : "คืนให้เมื่อย้ายออกและตรวจสภาพห้องเรียบร้อย",
      amount: Number(depositFee),
    },
    {
      id: "keycard",
      icon: "💳",
      title: lang === "en" ? "Keycard & Entry Device Fee" : "ค่าคีย์การ์ดเข้า-ออกอาคาร",
      desc: lang === "en" ? "Building & room entry" : isLarge ? "คีย์การ์ดเข้า-ออกประตู 2 ใบ" : "คีย์การ์ดเข้า-ออกประตู 1 ใบ",
      amount: Number(keycardFee),
    },
  ];

  // ยอดรวมสุทธิ
  const grandTotal = lineItems.reduce((sum, item) => sum + Number(item.amount), 0);

  // ตั้งค่ายอดเงินที่โอนอัตโนมัติเมื่อยอดรวมเปลี่ยน
  useEffect(() => {
    if (grandTotal) {
      setPaidAmount(String(grandTotal));
    }
  }, [grandTotal, payMode, selectedRoomId]);

  function handleSlip(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setSlip(ev.target.result);
      setSlipPreview(ev.target.result);
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!booking || !booking.id) {
      alert(lang === "en" ? "No active room booking found. Please book a room first." : "ไม่พบข้อมูลการจองห้องพัก กรุณาทำการจองห้องพักก่อนชำระเงิน");
      navigate("/book-room");
      return;
    }
    if (!slip) return alert(lang === "en" ? "Please upload payment slip" : "กรุณาแนบสลิปการโอนเงิน");
    if (!paidAmount) return alert(lang === "en" ? "Please enter paid amount" : "กรุณากรอกจำนวนเงิน");

    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/api/move-in-payments`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          booking_id: booking.id,
          room_id: currentRoom?.id || booking.room_id,
          total_amount: grandTotal,
          paid_amount: Number(paidAmount),
          payment_method: paymentMethod,
          payment_slip: slip,
          notes: `ชำระค่าประกัน (${categoryName} - โหมด: ${payMode === "full" ? "จ่ายรวมทุกอย่าง" : "เฉพาะค่าประกัน"}): ยอด ${grandTotal} ฿`,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        loadData();
      } else {
        alert(data.error || "เกิดข้อผิดพลาดในการบันทึก");
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="page-loading">⏳ กำลังโหลดข้อมูล...</div>;

  const isPaid = existingPayment?.payment_status === "approved";
  const isSubmitted = existingPayment?.payment_status === "submitted";
  const isRejected = existingPayment?.payment_status === "rejected";

  return (
    <div className="cert-page">
      <div className="page-head">
        <div className="page-head-info">
          <h1 className="page-title">🛡️ {lang === "en" ? "Security Deposit & Move-in Payment" : "ชำระค่าประกันและค่าแรกเข้า"}</h1>
          <p className="page-subtitle">
            {lang === "en"
              ? "Pay your security deposit, keycard, and first month rent in one easy step"
              : "ระบบคำนวณค่าประกันตามขนาดห้อง และรวมค่าใช้จ่ายรอบแรกเข้าให้ชำระได้อย่างสะดวกและรวดเร็ว"}
          </p>
        </div>
        <button className="btn-ghost btn-sm" onClick={() => navigate("/move-in")}>← {lang === "en" ? "Back to Move-in" : "กลับหน้าการเข้าอยู่"}</button>
      </div>

      <PageHeaderTabs
        tabs={[
          { path: "/move-in", label: lang === "th" ? "ขั้นตอนเข้าอยู่ & กุญแจ" : "Move-in Steps", icon: "🔑" },
          { path: "/deposit-payment", label: lang === "th" ? "ชำระค่าแรกเข้า & ค่าประกัน" : "Security Deposit", icon: "🛡️" },
          { path: "/move-in/verification", label: lang === "th" ? "ยืนยันตัวตนผู้พักอาศัย" : "Identity Verification", icon: "🪪" },
        ]}
      />

      {/* แบนเนอร์สถานะ */}
      {isPaid && (
        <div className="card-shadow" style={{
          marginBottom: 24,
          padding: "20px 24px",
          background: "linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(5, 150, 105, 0.05))",
          border: "1.5px solid #10b981",
          borderRadius: 12,
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16
        }}>
          <div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#065f46", marginBottom: 4 }}>
              ✅ {lang === "en" ? "Initial Payment & Deposit Approved!" : "อนุมัติการชำระค่าแรกเข้า / ค่าประกันเรียบร้อยแล้ว!"}
            </div>
            <div style={{ fontSize: 13, color: "#047857" }}>
              {lang === "en"
                ? "Your payment has been verified. You can now proceed to Identity Verification to finalize your move-in."
                : "เจ้าหน้าที่ได้ตรวจสอบและอนุมัติการชำระเงินของคุณแล้ว สามารถก้าวสู่ขั้นตอนยืนยันตัวตนเพื่อรับมอบกุญแจห้องได้ทันที"}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              className="btn-primary"
              onClick={() => navigate("/move-in/verification")}
              style={{ background: "#10b981", borderColor: "#10b981", fontWeight: 700, padding: "10px 20px" }}
            >
              {lang === "en" ? "Proceed to Identity Verification →" : "🪪 ยืนยันตัวตนผู้พักอาศัย (ขั้นตอนถัดไป) →"}
            </button>
            <button
              className="btn-ghost"
              onClick={() => navigate("/move-in")}
              style={{ background: "#fff" }}
            >
              {lang === "en" ? "Move-in Overview" : "🏠 ดูขั้นตอนทั้งหมด"}
            </button>
          </div>
        </div>
      )}
      {isSubmitted && (
        <div className="cert-status-card cert-status-pending" style={{ marginBottom: 20 }}>
          <div className="cert-status-header">
            <span className="cert-status-icon">🟡</span>
            <div>
              <div className="cert-status-label">{lang === "en" ? "Deposit Payment Under Review" : "ส่งหลักฐานการชำระค่าประกันแล้ว รอเจ้าหน้าที่ตรวจสอบ"}</div>
              <div className="cert-status-msg">{lang === "en" ? "Admin is verifying your slip." : "เจ้าหน้าที่กำลังตรวจสอบยอดเงินและสลิปการโอนเงินค่าประกันของคุณ"}</div>
            </div>
          </div>
        </div>
      )}
      {isRejected && (
        <div className="cert-status-card cert-status-rejected" style={{ marginBottom: 20 }}>
          <div className="cert-status-header">
            <span className="cert-status-icon">🔴</span>
            <div>
              <div className="cert-status-label">{lang === "en" ? "Payment Rejected" : "สลิปหรือยอดชำระไม่ผ่านการอนุมัติ"}</div>
              <div className="cert-status-msg">{existingPayment.rejection_reason || "กรุณาตรวจสอบสลิปและแนบใหม่อีกครั้ง"}</div>
            </div>
          </div>
        </div>
      )}
      {success && (
        <div className="cert-success-banner" style={{ marginBottom: 20 }}>
          ✅ {lang === "en" ? "Payment submitted! Please wait for admin approval." : "ส่งหลักฐานการชำระค่าประกันเรียบร้อยแล้ว กรุณารอเจ้าหน้าที่ตรวจสอบ"}
        </div>
      )}

      {!booking ? (
        <div
          className="card-shadow"
          style={{
            maxWidth: 640,
            margin: "32px auto",
            padding: "48px 28px",
            textAlign: "center",
            borderRadius: 16,
            background: "var(--surface, #fff)",
            border: "1.5px solid var(--border)",
          }}
        >
          <div style={{ fontSize: 60, marginBottom: 16, lineHeight: 1 }}>🛡️</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--ink-primary)", marginBottom: 10 }}>
            {lang === "en" ? "No Active Room Booking" : "คุณยังไม่ได้ทำการจองห้องพัก"}
          </h2>
          <p style={{ color: "var(--ink-secondary)", fontSize: 14.5, lineHeight: 1.6, maxWidth: 460, margin: "0 auto 26px" }}>
            {lang === "en"
              ? "You must reserve an available room before making a security deposit payment. Please choose and book a room first."
              : "การชำระค่าแรกเข้าและค่าประกันความเสียหายจะผูกกับห้องพักที่คุณจองไว้โดยตรง กรุณาเลือกและทำการจองห้องพักก่อน จึงจะสามารถชำระเงินได้"}
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              className="btn-primary"
              onClick={() => navigate("/book-room")}
              style={{ padding: "12px 24px", fontSize: 14.5, fontWeight: 700 }}
            >
              🔍 {lang === "en" ? "Explore & Book Room →" : "เลือกและจองห้องพัก →"}
            </button>
            <button
              className="btn-ghost"
              onClick={() => navigate("/move-in")}
              style={{ padding: "12px 20px", fontSize: 14.5 }}
            >
              🏠 {lang === "en" ? "Move-in Steps Overview" : "ดูขั้นตอนการเข้าพัก"}
            </button>
          </div>
        </div>
      ) : (
        <div className="move-in-pay-grid">
          {/* คอลัมน์ซ้าย: ข้อมูลห้องและสรุปยอดค่าประกัน */}
          <div className="card-shadow" style={{ padding: 24 }}>
            {/* ข้อมูลห้องพักที่เลือก */}
            <div style={{ marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid var(--border)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
                <div>
                  <span style={{ fontSize: 12, color: "var(--ink-muted)" }}>ห้องพักที่ทำการจอง:</span>
                  <h2 style={{ fontSize: 24, margin: "2px 0 4px", fontWeight: 700, color: "var(--ink-primary)", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                    <span>ห้อง {currentRoom?.room_number || "—"}</span>
                    {booking && (
                      <span style={{ fontSize: 12, background: "rgba(59, 130, 246, 0.12)", color: "#1d4ed8", padding: "3px 8px", borderRadius: 6, fontWeight: 600 }}>
                        📋 การจอง #{booking.id} ({booking.status === "approved" ? "อนุมัติแล้ว" : booking.status === "confirmed" ? "ยืนยันแล้ว" : "รอตรวจสอบ"})
                      </span>
                    )}
                  </h2>
                  <div style={{ fontSize: 13, color: "var(--ink-secondary)" }}>
                    {currentRoom?.room_type || "ห้องพัก"} {currentRoom?.floor ? `• ชั้น ${currentRoom.floor}` : ""} • {currentRoom?.size || "24 ตร.ม."}
                  </div>
                </div>

                {/* ป้ายแสดงหมวดหมู่ขนาดห้อง */}
                <div style={{ textAlign: "right" }}>
                  <span className={`pill ${isLarge ? "info" : "available"}`} style={{ fontSize: 12, padding: "4px 10px" }}>
                    <span className="status-dot" /> {categoryName}
                  </span>
                  <div style={{ fontSize: 11, color: "var(--ink-muted)", marginTop: 4 }}>
                    {categoryDesc}
                  </div>
                </div>
              </div>

              {/* ล็อคห้องตามรายการจอง ไม่ให้เลือกห้องอื่นมั่ว */}
              <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(59, 130, 246, 0.08)", borderRadius: 8, fontSize: 12.5, color: "#1e40af", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
                <span>🔒 ล็อคยอดค่าประกันตามห้องที่จอง: <strong>ห้อง {currentRoom?.room_number}</strong> (ไม่สามารถเปลี่ยนห้องขณะชำระเงินได้)</span>
                <button
                  type="button"
                  className="btn-ghost btn-sm"
                  onClick={() => navigate("/book-room")}
                  style={{ fontSize: 11.5, padding: "3px 8px" }}
                >
                  ดูการจองของฉัน
                </button>
              </div>
            </div>

          {/* สลับตัวเลือก: จ่ายรวมรอบเดียว หรือ จ่ายเฉพาะค่าประกัน */}
          <div style={{ marginBottom: 20, background: "var(--surface-alt)", padding: "12px 14px", borderRadius: 10, border: "1px solid var(--border-light)" }}>
            <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 8, color: "var(--ink-secondary)" }}>
              รูปแบบการชำระเงินที่ต้องการ:
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <button
                type="button"
                onClick={() => setPayMode("full")}
                style={{
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: payMode === "full" ? "2px solid var(--primary)" : "1px solid var(--border)",
                  background: payMode === "full" ? "var(--primary-light)" : "var(--surface)",
                  color: payMode === "full" ? "var(--primary)" : "var(--ink-primary)",
                  fontWeight: payMode === "full" ? 700 : 500,
                  fontSize: 12.5,
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <div>✨ จ่ายรวมทุกอย่างในรอบเดียว</div>
                <div style={{ fontSize: 11, color: "var(--ink-muted)", marginTop: 2 }}>ค่าห้อง + ประกัน + คีย์การ์ด</div>
              </button>

              <button
                type="button"
                onClick={() => setPayMode("deposit_only")}
                style={{
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: payMode === "deposit_only" ? "2px solid var(--primary)" : "1px solid var(--border)",
                  background: payMode === "deposit_only" ? "var(--primary-light)" : "var(--surface)",
                  color: payMode === "deposit_only" ? "var(--primary)" : "var(--ink-primary)",
                  fontWeight: payMode === "deposit_only" ? 700 : 500,
                  fontSize: 12.5,
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                <div>🛡️ จ่ายเฉพาะค่าประกัน</div>
                <div style={{ fontSize: 11, color: "var(--ink-muted)", marginTop: 2 }}>ประกัน + คีย์การ์ด (จ่ายค่าห้องทีหลัง)</div>
              </button>
            </div>
          </div>

          {/* รายการคำนวณค่าใช้จ่าย */}
          <div style={{ marginBottom: 20 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, margin: "0 0 12px", color: "var(--ink-primary)" }}>
              📋 รายละเอียดค่าใช้จ่าย ({payMode === "full" ? "รอบแรกเข้าครบวงจร" : "เฉพาะค่าประกันความเสียหาย"})
            </h3>

            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {lineItems.map(item => (
                <div key={item.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", background: "var(--surface-alt)", borderRadius: 8, border: "1px solid var(--border-light)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 20 }}>{item.icon}</span>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13.5 }}>{item.title}</div>
                      <div style={{ fontSize: 11.5, color: "var(--ink-muted)" }}>{item.desc}</div>
                    </div>
                  </div>
                  <strong style={{ fontSize: 15, color: "var(--ink-primary)" }}>
                    {item.amount.toLocaleString()} ฿
                  </strong>
                </div>
              ))}
            </div>
          </div>

          {/* กล่องสรุปยอดรวมสุทธิ */}
          <div style={{ padding: "16px 20px", background: "var(--primary-light)", borderRadius: 10, border: "2px solid var(--primary-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span style={{ fontSize: 12, fontWeight: 600, color: "var(--primary)", textTransform: "uppercase", letterSpacing: 0.5 }}>
                ยอดรวมที่ต้องโอนสุทธิ
              </span>
              <div style={{ fontSize: 13, color: "var(--ink-secondary)" }}>
                {payMode === "full" ? "รวมค่าเช่างวดแรกและค่าประกันครบจบในยอดเดียว" : "ยอดค่าประกันและคีย์การ์ดสำหรับล็อคห้องพัก"}
              </div>
            </div>
            <strong style={{ fontSize: 24, color: "var(--primary)" }}>
              {grandTotal.toLocaleString()} ฿
            </strong>
          </div>
        </div>

        {/* คอลัมน์ขวา: ช่องทางการโอนเงินและแนบสลิป */}
        {!isPaid && !isSubmitted && (
          <div className="card-shadow cert-form-card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 16px" }}>
              💳 ข้อมูลการโอนและแนบหลักฐานการชำระเงิน
            </h3>

            <form onSubmit={handleSubmit}>
              {/* ช่องทางชำระเงิน */}
              <div className="cert-field" style={{ marginBottom: 14 }}>
                <label className="cert-label">วิธีชำระเงิน</label>
                <div style={{ display: "flex", gap: 14, marginTop: 6 }}>
                  {[["promptpay", "PromptPay (พร้อมเพย์)"], ["bank_transfer", "Bank Transfer (โอนธนาคาร)"]].map(([val, lbl]) => (
                    <label key={val} style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 13, fontWeight: paymentMethod === val ? 700 : 400 }}>
                      <input type="radio" value={val} checked={paymentMethod === val} onChange={() => setPaymentMethod(val)} />
                      {lbl}
                    </label>
                  ))}
                </div>
              </div>

              {/* ข้อมูลบัญชีรับเงิน */}
              <div style={{ background: "var(--primary-light)", border: "1px solid var(--primary-border)", borderRadius: 8, padding: "14px 16px", marginBottom: 16, fontSize: 13 }}>
                <div>📱 <strong>พร้อมเพย์ (PromptPay):</strong> <span style={{ fontSize: 16, fontWeight: 700, color: "var(--primary)" }}>{PROMPTPAY}</span></div>
                <div style={{ fontSize: 12, color: "var(--ink-secondary)", marginTop: 4 }}>
                  ชื่อบัญชี: หอพัก DormEase • ยอดโอนที่ระบุ: <strong>{grandTotal.toLocaleString()} ฿</strong>
                </div>
              </div>

              {/* จำนวนเงินที่โอน */}
              <div className="cert-field" style={{ marginBottom: 14 }}>
                <label className="cert-label">จำนวนเงินที่โอน (บาท) *</label>
                <input
                  type="number"
                  className="cert-input"
                  value={paidAmount}
                  onChange={e => setPaidAmount(e.target.value)}
                  placeholder={grandTotal.toString()}
                  required
                />
                {paidAmount && Number(paidAmount) < grandTotal && (
                  <span className="cert-err-msg">
                    ⚠️ จำนวนเงินน้อยกว่ายอดรวมที่คำนวณ ({grandTotal.toLocaleString()} ฿)
                  </span>
                )}
              </div>

              {/* แนบสลิป */}
              <div className="cert-field" style={{ marginBottom: 16 }}>
                <label className="cert-label">หลักฐานการโอนเงิน (สลิปโอนเงิน) *</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleSlip}
                  className="cert-input"
                  style={{ padding: "8px 10px" }}
                  required={!isRejected}
                />
                {slipPreview && (
                  <div style={{ marginTop: 10, textAlign: "center" }}>
                    <img
                      src={slipPreview}
                      alt="slip preview"
                      style={{ maxWidth: "100%", maxHeight: 220, borderRadius: 8, border: "1px solid var(--border)" }}
                    />
                  </div>
                )}
              </div>

              <div className="cert-form-footer">
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ width: "100%", padding: "12px", fontSize: 15 }}
                  disabled={submitting}
                >
                  {submitting ? "⏳ กำลังบันทึกข้อมูล..." : `📤 ยืนยันการชำระค่าประกัน (${Number(paidAmount || grandTotal).toLocaleString()} ฿)`}
                </button>
              </div>
            </form>
          </div>
        )}

        {isPaid && (
          <div className="card-shadow" style={{ padding: 24, textAlign: "center" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎉</div>
            <h3 style={{ fontSize: 18, marginBottom: 8 }}>ชำระค่าประกันห้องพักเรียบร้อยแล้ว</h3>
            <p style={{ color: "var(--ink-muted)", fontSize: 14, marginBottom: 20 }}>
              ระบบได้บันทึกการชำระเงินของคุณเรียบร้อยแล้ว ขั้นตอนถัดไปคือการยืนยันตัวตนผู้พักอาศัยเพื่อเปิดใช้งานห้องพัก
            </p>
            <button className="btn-primary" onClick={() => navigate("/move-in/verification")}>
              🪪 ไปที่หน้ายืนยันตัวตนผู้เข้าพัก →
            </button>
          </div>
        )}
        </div>
      )}
    </div>
  );
}

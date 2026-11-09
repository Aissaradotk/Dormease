import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import PageHeaderTabs from "../components/PageHeaderTabs";

const API = "http://119.59.102.161:3007";

const STEPS = [
  { key: "booking",      stepNo: 1, icon: "📋", label_th: "1. จองห้องพัก",            label_en: "1. Room Booking" },
  { key: "payment",      stepNo: 2, icon: "💳", label_th: "2. ชำระค่าแรกเข้า/ประกัน", label_en: "2. Initial Payment" },
  { key: "verification", stepNo: 3, icon: "🪪", label_th: "3. ยืนยันตัวตนผู้เช่า",    label_en: "3. Resident Verification" },
  { key: "approved",     stepNo: 4, icon: "🔑", label_th: "4. อนุมัติเข้าอยู่ & กุญแจ", label_en: "4. Move-in & Keys" },
  { key: "certificate",  stepNo: 5, icon: "📄", label_th: "5. ใบรับรองถิ่นที่อยู่",   label_en: "5. Residence Cert" },
];

export default function MoveInFlow() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(null);
  const [payment, setPayment] = useState(null);
  const [verification, setVerification] = useState(null);
  const [certificate, setCertificate] = useState(null);
  const [showSlipModal, setShowSlipModal] = useState(null);

  const apiFetch = useCallback(async (url) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}${url}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }, []);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Load tenant bookings
      const bookings = await apiFetch("/api/bookings/my");
      // Match active booking: approved, confirmed, or pending (filter out completed / cancelled)
      const validBookings = Array.isArray(bookings)
        ? bookings.filter(b => b.status === "approved" || b.status === "confirmed" || b.status === "pending")
        : [];
      const activeBooking = validBookings[0] || null;
      setBooking(activeBooking || null);

      // 2. Load move-in / security deposit payment
      // STRICT MATCHING: Only match payment belonging to activeBooking.id.
      // Never fall back to room_id or pays[0] to prevent reusing old slips after move-out!
      const pays = await apiFetch("/api/move-in-payments/my");
      const pay = (activeBooking && Array.isArray(pays))
        ? (pays.find(p => Number(p.booking_id) === Number(activeBooking.id)) || null)
        : null;
      setPayment(pay || null);

      // 3. Load resident verification
      // Strictly match verification for this active booking
      const verifs = await apiFetch("/api/resident-verifications/my");
      const verif = (activeBooking && Array.isArray(verifs))
        ? (verifs.find(v => Number(v.booking_id) === Number(activeBooking.id)) || null)
        : null;
      setVerification(verif || null);

      // 4. Load residence certificate (if foreigner)
      const certs = await apiFetch("/api/residence-certificates/my");
      const cert = Array.isArray(certs) ? certs[0] : null;
      setCertificate(cert || null);
    } catch (err) {
      console.error("LoadAll MoveInFlow error:", err);
    } finally {
      setLoading(false);
    }
  }, [apiFetch, user?.id]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  // Determine status of each step: "done", "active", "error", "locked", "empty", "hidden"
  const stepStatuses = useMemo(() => {
    const statuses = {};

    // Step 1: Booking
    if (!booking) {
      statuses.booking = "empty";
    } else if (booking.status === "approved" || booking.status === "confirmed") {
      statuses.booking = "done";
    } else if (booking.status === "pending") {
      statuses.booking = "active";
    } else {
      statuses.booking = "error";
    }

    // Step 2: Payment
    if (!booking) {
      statuses.payment = "locked";
    } else if (!payment) {
      statuses.payment = "active";
    } else if (payment.payment_status === "approved") {
      statuses.payment = "done";
    } else if (payment.payment_status === "rejected") {
      statuses.payment = "error";
    } else {
      statuses.payment = "active"; // submitted / pending review
    }

    // Step 3: Verification
    if (payment?.payment_status !== "approved") {
      statuses.verification = "locked";
    } else if (!verification) {
      statuses.verification = "active";
    } else if (verification.status === "verified") {
      statuses.verification = "done";
    } else if (verification.status === "rejected") {
      statuses.verification = "error";
    } else {
      statuses.verification = "active"; // pending review
    }

    // Step 4: Approved & Keys
    if (verification?.status === "verified") {
      statuses.approved = "done";
    } else if (verification?.status === "pending") {
      statuses.approved = "active";
    } else {
      statuses.approved = "locked";
    }

    // Step 5: Certificate of residence (Foreigner only)
    const isForeigner = user?.nationality &&
      user.nationality.toLowerCase() !== "thai" &&
      user.nationality !== "ไทย";

    if (!isForeigner) {
      statuses.certificate = "hidden";
    } else if (verification?.status !== "verified") {
      statuses.certificate = "locked";
    } else if (!certificate) {
      statuses.certificate = "active";
    } else if (certificate.status === "approved") {
      statuses.certificate = "done";
    } else {
      statuses.certificate = "active";
    }

    return statuses;
  }, [booking, payment, verification, certificate, user?.nationality]);

  // Overall progress percentage
  const progressPercent = useMemo(() => {
    const isForeigner = user?.nationality && user.nationality.toLowerCase() !== "thai" && user.nationality !== "ไทย";
    const totalSteps = isForeigner ? 5 : 4;
    let completed = 0;
    if (stepStatuses.booking === "done") completed++;
    if (stepStatuses.payment === "done") completed++;
    if (stepStatuses.verification === "done") completed++;
    if (stepStatuses.approved === "done") completed++;
    if (isForeigner && stepStatuses.certificate === "done") completed++;
    return Math.round((completed / totalSteps) * 100);
  }, [stepStatuses, user?.nationality]);

  if (loading) {
    return (
      <div className="page-loading" style={{ textAlign: "center", padding: "80px 20px" }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>⏳</div>
        <div style={{ fontWeight: 600, fontSize: 16 }}>
          {lang === "en" ? "Loading move-in process..." : "กำลังโหลดข้อมูลกระบวนการเข้าอยู่..."}
        </div>
      </div>
    );
  }

  const isForeigner = user?.nationality && user.nationality.toLowerCase() !== "thai" && user.nationality !== "ไทย";
  const visibleSteps = STEPS.filter(s => s.key !== "certificate" || isForeigner);

  return (
    <div className="move-in-page" style={{ maxWidth: 1100, margin: "0 auto", paddingBottom: 60 }}>
      {/* Page Header */}
      <div className="page-head" style={{ marginBottom: 20 }}>
        <div className="page-head-info">
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 4 }}>
            <h1 className="page-title" style={{ margin: 0 }}>
              🏠 {lang === "en" ? "Move-in Process" : "ขั้นตอนและกระบวนการเข้าพักอาศัย"}
            </h1>
            <span style={{
              background: progressPercent === 100 ? "rgba(16, 185, 129, 0.15)" : "rgba(99, 102, 241, 0.12)",
              color: progressPercent === 100 ? "#059669" : "#4f46e5",
              fontWeight: 700,
              fontSize: 12,
              padding: "4px 10px",
              borderRadius: 20
            }}>
              {progressPercent === 100 ? "🎉 พร้อมเข้าอยู่ 100%" : `ความคืบหน้า ${progressPercent}%`}
            </span>
          </div>
          <p className="page-subtitle" style={{ margin: 0 }}>
            {lang === "en"
              ? "Follow each step to complete your room booking, deposit payment, verification, and receive room keys."
              : "ดำเนินการตามขั้นตอนจริง: จองห้องพัก → ชำระค่าแรกเข้า/ประกัน → ยืนยันตัวตน → อนุมัติเข้าอยู่และรับกุญแจห้อง"}
          </p>
        </div>
        <button className="btn-ghost btn-sm" onClick={loadAll} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span>🔄</span> {lang === "en" ? "Refresh" : "รีเฟรชข้อมูล"}
        </button>
      </div>

      <PageHeaderTabs
        tabs={[
          { path: "/my-room", label: lang === "th" ? "ห้องพักของฉัน" : "My Room", icon: "🏠" },
          { path: "/move-in", label: lang === "th" ? "ขั้นตอนเข้าอยู่ & กุญแจ" : "Move-in Steps", icon: "🔑" },
        ]}
      />

      {/* Progress Bar Container */}
      <div className="card-shadow move-in-steps-card" style={{ padding: "24px 20px 20px", marginBottom: 24, borderRadius: 14 }}>
        {/* Horizontal Stepper */}
        <div className="move-in-steps">
          {visibleSteps.map((step, i) => {
            const status = stepStatuses[step.key];
            if (status === "hidden") return null;
            return (
              <div
                key={step.key}
                className={`move-in-step step-${status}`}
                style={{ cursor: status !== "locked" ? "pointer" : "default" }}
                onClick={() => {
                  const el = document.getElementById(`step-card-${step.key}`);
                  if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                }}
              >
                <div className="step-connector-left" style={{ visibility: i === 0 ? "hidden" : "visible" }} />
                <div className="step-icon-wrap" style={{
                  boxShadow: status === "active" ? "0 0 0 4px rgba(99, 102, 241, 0.2)" : "none",
                  fontWeight: 700
                }}>
                  {status === "done" ? "✓" : status === "error" ? "✕" : step.icon}
                </div>
                <div className="step-connector-right" style={{ visibility: i === visibleSteps.length - 1 ? "hidden" : "visible" }} />
                <div className="step-label" style={{ fontWeight: status === "active" || status === "done" ? 700 : 500 }}>
                  {lang === "en" ? step.label_en : step.label_th}
                </div>
                <div className={`step-badge step-badge-${status}`}>
                  {status === "done" ? (lang === "en" ? "Done ✅" : "เสร็จสิ้น ✅")
                    : status === "active" ? (lang === "en" ? "In Progress 🟡" : "ดำเนินการ 🟡")
                    : status === "error" ? (lang === "en" ? "Action Needed ❌" : "ต้องแก้ไข ❌")
                    : status === "locked" ? (lang === "en" ? "Locked 🔒" : "รอขั้นตอนก่อน 🔒")
                    : (lang === "en" ? "Not Started" : "ยังไม่เริ่ม")}
                </div>
              </div>
            );
          })}
        </div>

        {/* Progress Bar Line */}
        <div style={{ marginTop: 20, background: "var(--border, #e2e8f0)", height: 6, borderRadius: 3, overflow: "hidden" }}>
          <div style={{
            height: "100%",
            width: `${progressPercent}%`,
            background: progressPercent === 100
              ? "linear-gradient(90deg, #10b981, #059669)"
              : "linear-gradient(90deg, #6366f1, #3b82f6)",
            transition: "width 0.4s ease"
          }} />
        </div>
      </div>

      {/* Main Multi-Step Details Grid */}
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        
        {/* ========================================================
            STEP 1: การจองห้องพัก (Room Booking)
        ======================================================== */}
        <div
          id="step-card-booking"
          className="card-shadow"
          style={{
            padding: 24,
            borderRadius: 12,
            borderLeft: stepStatuses.booking === "done" ? "5px solid #10b981" : "5px solid #f59e0b"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>
                {lang === "en" ? "Step 1 of 4" : "ขั้นตอนที่ 1 จาก 4"}
              </div>
              <h2 style={{ fontSize: 18, margin: "2px 0 0", display: "flex", alignItems: "center", gap: 8 }}>
                <span>📋</span>
                <span>{lang === "en" ? "Room Booking" : "การจองห้องพัก"}</span>
              </h2>
            </div>
            <div>
              {stepStatuses.booking === "done" && (
                <span className="pill available" style={{ fontSize: 12, fontWeight: 600 }}>
                  <span className="status-dot" /> {lang === "en" ? "Booking Confirmed" : "ยืนยันการจองเรียบร้อย"}
                </span>
              )}
              {stepStatuses.booking === "active" && (
                <span className="pill warning" style={{ fontSize: 12, fontWeight: 600 }}>
                  <span className="status-dot" /> {lang === "en" ? "Pending Approval" : "รออนุมัติการจอง"}
                </span>
              )}
              {stepStatuses.booking === "empty" && (
                <span className="pill occupied" style={{ fontSize: 12, fontWeight: 600 }}>
                  {lang === "en" ? "No Booking" : "ยังไม่ได้จองห้อง"}
                </span>
              )}
            </div>
          </div>

          {booking ? (
            <div>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: 14,
                padding: "16px 20px",
                background: "var(--bg-card, #f8fafc)",
                borderRadius: 10,
                border: "1px solid var(--border)",
                marginBottom: 14
              }}>
                <div>
                  <div style={{ fontSize: 12, color: "var(--ink-muted)" }}>{lang === "en" ? "Room Number" : "ห้องพักที่จอง"}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "var(--ink-primary)" }}>
                    {booking.room_number || `ห้อง ${booking.room_id}`}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--ink-secondary)" }}>
                    {booking.room_type || "-"} {booking.floor ? `(ชั้น ${booking.floor})` : ""}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 12, color: "var(--ink-muted)" }}>{lang === "en" ? "Monthly Rent" : "ค่าเช่ารายเดือน"}</div>
                  <div style={{ fontSize: 18, fontWeight: 700, color: "#2563eb" }}>
                    {Number(booking.price || 3500).toLocaleString()} ฿ <span style={{ fontSize: 12, fontWeight: 400, color: "var(--ink-muted)" }}>/ เดือน</span>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--ink-secondary)" }}>{booking.size || "24 ตร.ม."}</div>
                </div>

                <div>
                  <div style={{ fontSize: 12, color: "var(--ink-muted)" }}>{lang === "en" ? "Target Check-in Date" : "วันที่กำหนดเข้าอยู่"}</div>
                  <div style={{ fontSize: 16, fontWeight: 600 }}>
                    📅 {booking.check_in_date ? new Date(booking.check_in_date).toLocaleDateString("th-TH", { year: "numeric", month: "short", day: "numeric" }) : "—"}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--ink-muted)", marginTop: 2 }}>
                    เบอร์ติดต่อ: {booking.contact_phone || user?.phone || "—"}
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                <div style={{ fontSize: 13, color: "#059669", display: "flex", alignItems: "center", gap: 6 }}>
                  <span>✅</span>
                  <span>{lang === "en" ? "Room reserved for you. Please proceed to payment." : "การจองห้องพักสำเร็จ สามารถดำเนินการชำระค่าแรกเข้า/ค่าประกันในขั้นตอนถัดไป"}</span>
                </div>
                <button
                  className="btn-ghost btn-sm"
                  onClick={() => navigate("/book-room")}
                  style={{ fontSize: 12 }}
                >
                  {lang === "en" ? "View Available Rooms" : "ดูห้องพักทั้งหมด"}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <p style={{ color: "var(--ink-muted)", marginBottom: 14 }}>
                {lang === "en" ? "You have not reserved a room yet. Please choose your room to start the move-in process." : "คุณยังไม่มีการจองห้องพัก กรุณาเลือกห้องพักที่ต้องการเพื่อเริ่มต้นกระบวนการเข้าอยู่"}
              </p>
              <button className="btn-primary" onClick={() => navigate("/book-room")}>
                🏠 {lang === "en" ? "Choose and Reserve a Room →" : "เลือกและจองห้องพัก →"}
              </button>
            </div>
          )}
        </div>

        {/* ========================================================
            STEP 2: ชำระค่าแรกเข้า / ค่าประกัน (Initial Payment & Deposit)
        ======================================================== */}
        <div
          id="step-card-payment"
          className="card-shadow"
          style={{
            padding: 24,
            borderRadius: 12,
            borderLeft: stepStatuses.payment === "done" ? "5px solid #10b981"
                      : stepStatuses.payment === "error" ? "5px solid #ef4444"
                      : stepStatuses.payment === "active" ? "5px solid #f59e0b"
                      : "5px solid var(--border)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>
                {lang === "en" ? "Step 2 of 4" : "ขั้นตอนที่ 2 จาก 4"}
              </div>
              <h2 style={{ fontSize: 18, margin: "2px 0 0", display: "flex", alignItems: "center", gap: 8 }}>
                <span>💳</span>
                <span>{lang === "en" ? "Security Deposit & Initial Payment" : "การชำระค่าแรกเข้า / ค่าประกันห้องพัก"}</span>
              </h2>
            </div>
            <div>
              {stepStatuses.payment === "done" && (
                <span className="pill available" style={{ fontSize: 12, fontWeight: 600 }}>
                  <span className="status-dot" /> {lang === "en" ? "Payment Approved" : "อนุมัติการชำระเงินแล้ว"}
                </span>
              )}
              {stepStatuses.payment === "active" && payment && (
                <span className="pill warning" style={{ fontSize: 12, fontWeight: 600 }}>
                  <span className="status-dot" /> {lang === "en" ? "Under Review" : "รอเจ้าหน้าที่ตรวจสอบสลิป"}
                </span>
              )}
              {stepStatuses.payment === "active" && !payment && (
                <span className="pill warning" style={{ fontSize: 12, fontWeight: 600 }}>
                  {lang === "en" ? "Action Needed" : "รอการชำระเงิน"}
                </span>
              )}
              {stepStatuses.payment === "error" && (
                <span className="pill occupied" style={{ fontSize: 12, fontWeight: 600 }}>
                  {lang === "en" ? "Payment Rejected" : "สลิปไม่ผ่านการอนุมัติ"}
                </span>
              )}
              {stepStatuses.payment === "locked" && (
                <span className="pill" style={{ fontSize: 12, background: "rgba(0,0,0,0.06)", color: "var(--ink-muted)" }}>
                  🔒 {lang === "en" ? "Locked" : "รอขั้นตอนที่ 1"}
                </span>
              )}
            </div>
          </div>

          {stepStatuses.payment === "locked" ? (
            <div style={{ padding: "16px 20px", background: "rgba(0,0,0,0.02)", borderRadius: 8, color: "var(--ink-muted)", fontSize: 13 }}>
              🔒 {lang === "en" ? "Please complete Step 1 (Room Booking) first." : "กรุณาทำการจองห้องพักในขั้นตอนที่ 1 ให้เรียบร้อยก่อน"}
            </div>
          ) : payment ? (
            <div>
              {/* Payment Info Card */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                gap: 14,
                padding: "16px 20px",
                background: "var(--bg-card, #f8fafc)",
                borderRadius: 10,
                border: "1px solid var(--border)",
                marginBottom: 14
              }}>
                <div>
                  <div style={{ fontSize: 12, color: "var(--ink-muted)" }}>{lang === "en" ? "Paid Amount" : "ยอดเงินที่ชำระ"}</div>
                  <div style={{ fontSize: 22, fontWeight: 700, color: payment.payment_status === "approved" ? "#059669" : "#d97706" }}>
                    {Number(payment.paid_amount || payment.total_amount || 0).toLocaleString()} ฿
                  </div>
                  {Number(payment.total_amount) > Number(payment.paid_amount) && (
                    <div style={{ fontSize: 11, color: "var(--ink-muted)" }}>
                      จากยอดเต็ม {Number(payment.total_amount).toLocaleString()} ฿
                    </div>
                  )}
                </div>

                <div>
                  <div style={{ fontSize: 12, color: "var(--ink-muted)" }}>{lang === "en" ? "Payment Method" : "ช่องทางการชำระ"}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, textTransform: "capitalize", marginTop: 4 }}>
                    📱 {payment.payment_method === "promptpay" ? "พร้อมเพย์ (PromptPay)" : payment.payment_method || "โอนผ่านธนาคาร"}
                  </div>
                  <div style={{ fontSize: 11, color: "var(--ink-muted)", marginTop: 2 }}>
                    {payment.created_at ? new Date(payment.created_at).toLocaleString("th-TH") : "—"}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 12, color: "var(--ink-muted)" }}>{lang === "en" ? "Payment Status" : "สถานะการตรวจสอบ"}</div>
                  <div style={{ marginTop: 4 }}>
                    {payment.payment_status === "approved" ? (
                      <span style={{ color: "#059669", fontWeight: 700, fontSize: 14 }}>
                        ✅ อนุมัติแล้ว {payment.approved_by ? `(โดย ${payment.approved_by})` : ""}
                      </span>
                    ) : payment.payment_status === "rejected" ? (
                      <span style={{ color: "#dc2626", fontWeight: 700, fontSize: 14 }}>
                        ❌ ปฏิเสธ: {payment.rejection_reason || "สลิปไม่ถูกต้อง"}
                      </span>
                    ) : (
                      <span style={{ color: "#d97706", fontWeight: 600, fontSize: 14 }}>
                        ⏳ กำลังตรวจสอบสลิป...
                      </span>
                    )}
                  </div>
                </div>

                {payment.payment_slip && (
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: 12, color: "var(--ink-muted)", marginBottom: 4 }}>{lang === "en" ? "Attached Slip" : "สลิปที่แนบ"}</div>
                    <img
                      src={payment.payment_slip}
                      alt="Payment Slip"
                      onClick={() => setShowSlipModal(payment.payment_slip)}
                      style={{
                        width: 48,
                        height: 48,
                        objectFit: "cover",
                        borderRadius: 6,
                        cursor: "pointer",
                        border: "1px solid var(--border)",
                        display: "inline-block"
                      }}
                      title={lang === "en" ? "Click to enlarge" : "คลิกเพื่อดูรูปขยาย"}
                    />
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                {payment.payment_status === "approved" ? (
                  <>
                    <div style={{ fontSize: 13, color: "#059669" }}>
                      ✅ เจ้าหน้าที่ตรวจสอบสลิปและยอดเงินเรียบร้อยแล้ว ดำเนินการขั้นตอนยืนยันตัวตนต่อได้ทันที
                    </div>
                    <button
                      className="btn-primary"
                      onClick={() => navigate("/move-in/verification")}
                      style={{ background: "#10b981", borderColor: "#10b981" }}
                    >
                      🪪 {lang === "en" ? "Proceed to Verification →" : "ไปขั้นตอนยืนยันตัวตนผู้พักอาศัย (Step 3) →"}
                    </button>
                  </>
                ) : payment.payment_status === "rejected" ? (
                  <>
                    <div style={{ fontSize: 13, color: "#dc2626" }}>
                      ⚠️ สลิปการโอนเงินไม่ผ่านการอนุมัติ กรุณาตรวจสอบยอดเงินและแนบสลิปใหม่
                    </div>
                    <button
                      className="btn-danger"
                      onClick={() => navigate(booking ? `/move-in/payment?booking_id=${booking.id}` : "/move-in/payment")}
                    >
                      🔄 {lang === "en" ? "Resubmit Slip →" : "ส่งสลิปการชำระเงินใหม่ →"}
                    </button>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: 13, color: "var(--ink-secondary)" }}>
                      ⏳ เจ้าหน้าที่กำลังตรวจสอบยอดเงินและสลิปการโอนเงินของคุณ (โดยทั่วไปใช้เวลาไม่เกิน 15-30 นาที)
                    </div>
                    <button
                      className="btn-ghost btn-sm"
                      onClick={() => navigate(booking ? `/move-in/payment?booking_id=${booking.id}` : "/move-in/payment")}
                    >
                      👁️ {lang === "en" ? "View Payment Details" : "ดูรายละเอียดการชำระ"}
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "18px 0" }}>
              <p style={{ color: "var(--ink-secondary)", fontSize: 14, marginBottom: 14 }}>
                {lang === "en"
                  ? "Pay your security deposit, keycard fee, and first month rent to secure your room."
                  : "ชำระค่าแรกเข้า (ค่าประกันความเสียหายตามขนาดห้อง, ค่าคีย์การ์ด และค่าเช่าเดือนแรก) เพื่อดำเนินการเข้าพัก"}
              </p>
              <button
                className="btn-primary"
                onClick={() => navigate(booking ? `/move-in/payment?booking_id=${booking.id}` : "/move-in/payment")}
                style={{ padding: "10px 22px", fontSize: 14, fontWeight: 700 }}
              >
                💳 {lang === "en" ? "Pay Initial Fees / Deposit Now →" : "🛡️ ชำระค่าแรกเข้า / แนบสลิปการโอนเงิน →"}
              </button>
            </div>
          )}
        </div>

        {/* ========================================================
            STEP 3: ยืนยันตัวตนผู้พักอาศัย (Identity Verification)
        ======================================================== */}
        <div
          id="step-card-verification"
          className="card-shadow"
          style={{
            padding: 24,
            borderRadius: 12,
            borderLeft: stepStatuses.verification === "done" ? "5px solid #10b981"
                      : stepStatuses.verification === "error" ? "5px solid #ef4444"
                      : stepStatuses.verification === "active" ? "5px solid #f59e0b"
                      : "5px solid var(--border)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>
                {lang === "en" ? "Step 3 of 4" : "ขั้นตอนที่ 3 จาก 4"}
              </div>
              <h2 style={{ fontSize: 18, margin: "2px 0 0", display: "flex", alignItems: "center", gap: 8 }}>
                <span>🪪</span>
                <span>{lang === "en" ? "Resident Identity Verification" : "การยืนยันตัวตนผู้พักอาศัย"}</span>
              </h2>
            </div>
            <div>
              {stepStatuses.verification === "done" && (
                <span className="pill available" style={{ fontSize: 12, fontWeight: 600 }}>
                  <span className="status-dot" /> {lang === "en" ? "Verified" : "ยืนยันตัวตนสำเร็จ"}
                </span>
              )}
              {stepStatuses.verification === "active" && verification && (
                <span className="pill warning" style={{ fontSize: 12, fontWeight: 600 }}>
                  <span className="status-dot" /> {lang === "en" ? "Under Review" : "รอเจ้าหน้าที่ตรวจสอบ"}
                </span>
              )}
              {stepStatuses.verification === "active" && !verification && (
                <span className="pill warning" style={{ fontSize: 12, fontWeight: 600 }}>
                  {lang === "en" ? "Action Needed" : "รอส่งข้อมูล"}
                </span>
              )}
              {stepStatuses.verification === "error" && (
                <span className="pill occupied" style={{ fontSize: 12, fontWeight: 600 }}>
                  {lang === "en" ? "Rejected" : "ไม่ผ่านการตรวจสอบ"}
                </span>
              )}
              {stepStatuses.verification === "locked" && (
                <span className="pill" style={{ fontSize: 12, background: "rgba(0,0,0,0.06)", color: "var(--ink-muted)" }}>
                  🔒 {lang === "en" ? "Locked" : "รอขั้นตอนที่ 2"}
                </span>
              )}
            </div>
          </div>

          {stepStatuses.verification === "locked" ? (
            <div style={{ padding: "16px 20px", background: "rgba(0,0,0,0.02)", borderRadius: 8, color: "var(--ink-muted)", fontSize: 13 }}>
              🔒 {lang === "en"
                ? "This step unlocks after your initial payment is approved by the admin."
                : "ขั้นตอนนี้จะปลดล็อกโดยอัตโนมัติเมื่อการชำระเงินค่าแรกเข้า/ค่าประกันในขั้นตอนที่ 2 ได้รับการอนุมัติ"}
            </div>
          ) : verification ? (
            <div>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: 14,
                padding: "16px 20px",
                background: "var(--bg-card, #f8fafc)",
                borderRadius: 10,
                border: "1px solid var(--border)",
                marginBottom: 14
              }}>
                <div>
                  <div style={{ fontSize: 12, color: "var(--ink-muted)" }}>{lang === "en" ? "Resident Name" : "ชื่อ-นามสกุล ผู้พักอาศัย"}</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "var(--ink-primary)" }}>
                    {verification.first_name} {verification.last_name}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--ink-secondary)", marginTop: 2 }}>
                    📞 {verification.phone || user?.phone || "—"}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 12, color: "var(--ink-muted)" }}>{lang === "en" ? "Document Type" : "ประเภทเอกสาร"}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2 }}>
                    {verification.resident_type === "thai" ? "🇹🇭 บัตรประชาชนไทย (13 หลัก)" : "🌍 หนังสือเดินทาง (Passport)"}
                  </div>
                  <div style={{ fontSize: 12, fontFamily: "monospace", color: "var(--ink-muted)", marginTop: 2 }}>
                    {verification.national_id ? `ID: ${verification.national_id.slice(0, 3)}XXXXXX${verification.national_id.slice(-4)}` : verification.passport_no || "—"}
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: 12, color: "var(--ink-muted)" }}>{lang === "en" ? "Verification Status" : "สถานะการตรวจสอบ"}</div>
                  <div style={{ marginTop: 2 }}>
                    {verification.status === "verified" ? (
                      <span style={{ color: "#059669", fontWeight: 700, fontSize: 14 }}>
                        ✅ ผ่านการตรวจสอบแล้ว {verification.verified_by ? `(โดย ${verification.verified_by})` : ""}
                      </span>
                    ) : verification.status === "rejected" ? (
                      <span style={{ color: "#dc2626", fontWeight: 700, fontSize: 14 }}>
                        ❌ ไม่ผ่าน: {verification.rejection_reason || "ข้อมูลไม่ถูกต้อง"}
                      </span>
                    ) : (
                      <span style={{ color: "#d97706", fontWeight: 600, fontSize: 14 }}>
                        ⏳ เจ้าหน้าที่กำลังตรวจสอบเอกสาร...
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
                {verification.status === "verified" ? (
                  <div style={{ fontSize: 13, color: "#059669" }}>
                    ✅ ข้อมูลยืนยันตัวตนถูกต้อง คุณได้รับสิทธิ์อนุมัติเข้าพักอาศัยเรียบร้อยแล้ว
                  </div>
                ) : verification.status === "rejected" ? (
                  <>
                    <div style={{ fontSize: 13, color: "#dc2626" }}>
                      ⚠️ เอกสารไม่ผ่านการอนุมัติ กรุณาแก้ไขข้อมูลและส่งใหม่อีกครั้ง
                    </div>
                    <button
                      className="btn-danger"
                      onClick={() => navigate("/move-in/verification")}
                    >
                      ✏️ {lang === "en" ? "Edit and Resubmit →" : "แก้ไขข้อมูลและส่งใหม่ →"}
                    </button>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: 13, color: "var(--ink-secondary)" }}>
                      ⏳ ระบบได้รับข้อมูลแล้ว รอผู้ดูแลระบบตรวจสอบความถูกต้อง
                    </div>
                    <button
                      className="btn-ghost btn-sm"
                      onClick={() => navigate("/move-in/verification")}
                    >
                      ✏️ {lang === "en" ? "Edit Details" : "ดูหรือแก้ไขข้อมูล"}
                    </button>
                  </>
                )}
              </div>
            </div>
          ) : (
            <div style={{ textAlign: "center", padding: "18px 0" }}>
              <p style={{ color: "var(--ink-secondary)", fontSize: 14, marginBottom: 14 }}>
                {lang === "en"
                  ? "Please submit your Thai National ID or Passport details to verify your identity for room handover."
                  : "กรอกข้อมูลบัตรประชาชน 13 หลัก (คนไทย) หรือ หนังสือเดินทาง Passport (ชาวต่างชาติ) เพื่อยืนยันตัวตนและจัดทำสัญญาเข้าพัก"}
              </p>
              <button
                className="btn-primary"
                onClick={() => navigate("/move-in/verification")}
                style={{ padding: "10px 22px", fontSize: 14, fontWeight: 700 }}
              >
                🪪 {lang === "en" ? "Submit Identity Verification →" : "กรอกข้อมูลยืนยันตัวตนผู้พักอาศัย →"}
              </button>
            </div>
          )}
        </div>

        {/* ========================================================
            STEP 4: อนุมัติเข้าอยู่ & ข้อมูลการรับกุญแจห้อง (Move-in & Keys)
        ======================================================== */}
        <div
          id="step-card-approved"
          className="card-shadow"
          style={{
            padding: 24,
            borderRadius: 12,
            borderLeft: stepStatuses.approved === "done" ? "5px solid #10b981" : "5px solid var(--border)",
            background: stepStatuses.approved === "done"
              ? "linear-gradient(180deg, rgba(16, 185, 129, 0.04) 0%, rgba(255, 255, 255, 1) 100%)"
              : "inherit"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-muted)", textTransform: "uppercase", letterSpacing: 0.5 }}>
                {lang === "en" ? "Step 4 of 4" : "ขั้นตอนที่ 4 จาก 4"}
              </div>
              <h2 style={{ fontSize: 18, margin: "2px 0 0", display: "flex", alignItems: "center", gap: 8 }}>
                <span>🔑</span>
                <span>{lang === "en" ? "Move-in Approved & Key Handover" : "อนุมัติเข้าอยู่ & ข้อมูลการรับมอบกุญแจห้องพัก"}</span>
              </h2>
            </div>
            <div>
              {stepStatuses.approved === "done" ? (
                <span className="pill available" style={{ fontSize: 13, fontWeight: 700, padding: "4px 12px" }}>
                  🎉 {lang === "en" ? "Move-in Ready!" : "อนุมัติเข้าอยู่สำเร็จแล้ว!"}
                </span>
              ) : (
                <span className="pill" style={{ fontSize: 12, background: "rgba(0,0,0,0.06)", color: "var(--ink-muted)" }}>
                  🔒 {lang === "en" ? "Locked" : "รอขั้นตอนที่ 1-3"}
                </span>
              )}
            </div>
          </div>

          {stepStatuses.approved === "done" ? (
            <div>
              {/* Digital Resident Pass Banner */}
              <div style={{
                padding: "20px 24px",
                borderRadius: 12,
                background: "linear-gradient(135deg, #065f46 0%, #047857 50%, #059669 100%)",
                color: "#fff",
                marginBottom: 20,
                boxShadow: "0 10px 25px rgba(5, 150, 105, 0.25)"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
                  <div>
                    <div style={{ fontSize: 12, opacity: 0.85, textTransform: "uppercase", letterSpacing: 1 }}>
                      DormEase • Digital Resident Pass
                    </div>
                    <div style={{ fontSize: 24, fontWeight: 800, marginTop: 4 }}>
                      ห้อง {booking?.room_number || (payment?.room_id ? `ห้อง ${payment.room_id}` : "—")}
                    </div>
                    <div style={{ fontSize: 14, opacity: 0.9, marginTop: 2 }}>
                      {booking?.room_type || "ห้องพักมาตรฐาน"} {booking?.floor ? `• ชั้น ${booking.floor}` : ""}
                    </div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 12, opacity: 0.85 }}>ผู้พักอาศัย</div>
                    <div style={{ fontSize: 16, fontWeight: 700 }}>
                      {verification ? `${verification.first_name} ${verification.last_name}` : user?.full_name || "ลูกบ้าน"}
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.85, marginTop: 2 }}>
                      วันเริ่มสัญญา: {booking?.check_in_date ? new Date(booking.check_in_date).toLocaleDateString("th-TH") : "มีผลทันที"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Handover & Resident Guide Box */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: 16,
                marginBottom: 20
              }}>
                {/* Key Handover Guide */}
                <div style={{ padding: 18, background: "var(--bg-card, #f8fafc)", borderRadius: 10, border: "1px solid var(--border)" }}>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 10, display: "flex", alignItems: "center", gap: 8, color: "var(--ink-primary)" }}>
                    <span>🔑</span> {lang === "en" ? "Key & Keycard Handover" : "การรับกุญแจห้องและคีย์การ์ด"}
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, lineHeight: 1.7, color: "var(--ink-secondary)" }}>
                    <li><strong>สถานที่รับมอบ:</strong> สำนักงานนิติบุคคล ชั้น 1 ของอาคาร</li>
                    <li><strong>เวลาทำการ:</strong> ทุกวัน เวลา 08:30 - 18:00 น.</li>
                    <li><strong>เอกสารที่ต้องแสดง:</strong> เพียงแสดงหน้าจอนี้ หรือแจ้งชื่อ-นามสกุล และเลขห้องต่อเจ้าหน้าที่</li>
                    <li><strong>อุปกรณ์ที่จะได้รับ:</strong> กุญแจห้องพัก 2 ดอก + คีย์การ์ดเปิดประตูทางเข้าอาคาร</li>
                  </ul>
                </div>

                {/* Amenities & Facility Rules */}
                <div style={{ padding: 18, background: "var(--bg-card, #f8fafc)", borderRadius: 10, border: "1px solid var(--border)" }}>
                  <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 10, display: "flex", alignItems: "center", gap: 8, color: "var(--ink-primary)" }}>
                    <span>📶</span> {lang === "en" ? "Internet & Amenities" : "อินเทอร์เน็ตและสิ่งอำนวยความสะดวก"}
                  </div>
                  <ul style={{ margin: 0, paddingLeft: 20, fontSize: 13, lineHeight: 1.7, color: "var(--ink-secondary)" }}>
                    <li><strong>Wi-Fi หอพัก:</strong> SSID: <code>DormEase-Resident</code> (รหัสผ่านขอรับได้ที่เคาน์เตอร์นิติบุคคล)</li>
                    <li><strong>มิเตอร์น้ำและไฟ:</strong> เริ่มนับหน่วยตั้งแต่วันรับมอบกุญแจห้องเป็นต้นไป</li>
                    <li><strong>ที่จอดรถ:</strong> ติดต่อขอรับสติกเกอร์จอดรถยนต์/มอเตอร์ไซค์ที่เคาน์เตอร์ (ฟรี 1 คัน/ห้อง)</li>
                    <li><strong>จุดทิ้งขยะ:</strong> ด้านหลังอาคาร มีถังขยะแยกประเภทขยะรีไซเคิล</li>
                  </ul>
                </div>
              </div>

              {/* Rules & Emergency Contact */}
              <div style={{
                padding: "14px 18px",
                background: "rgba(59, 130, 246, 0.06)",
                borderRadius: 10,
                border: "1px solid rgba(59, 130, 246, 0.2)",
                fontSize: 13,
                marginBottom: 20
              }}>
                <div style={{ fontWeight: 700, color: "#1d4ed8", marginBottom: 6, display: "flex", alignItems: "center", gap: 6 }}>
                  <span>📢</span> กฎระเบียบสำคัญ & เบอร์ติดต่อนิติบุคคลฉุกเฉิน
                </div>
                <div style={{ color: "var(--ink-secondary)", lineHeight: 1.6 }}>
                  • งดใช้เสียงดังรบกวนหลังเวลา 22:00 น. | ห้ามสูบบุหรี่ภายในห้องพักและโถงทางเดิน | ห้ามเลี้ยงสัตว์ทุกชนิด<br />
                  • <strong>เบอร์ติดต่อนิติบุคคล / รปภ. 24 ชั่วโมง:</strong> 02-999-8888 หรือ 081-234-5678
                </div>
              </div>

              {/* Action Buttons to navigate system */}
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <button
                  className="btn-primary"
                  onClick={() => navigate("/my-room")}
                  style={{ background: "#10b981", borderColor: "#10b981", fontWeight: 700 }}
                >
                  🏠 {lang === "en" ? "Go to Resident Dashboard" : "ไปยังหน้าหลักผู้พักอาศัย (Tenant Home) →"}
                </button>
                <button
                  className="btn-ghost"
                  onClick={() => navigate("/my-bills")}
                >
                  💳 {lang === "en" ? "My Bills" : "ดูบิลค่าเช่าและค่าน้ำ-ไฟ"}
                </button>
                <button
                  className="btn-ghost"
                  onClick={() => navigate("/my-repairs")}
                >
                  🔧 {lang === "en" ? "Maintenance & Repairs" : "แจ้งซ่อมบำรุง"}
                </button>
                {isForeigner && (
                  <button
                    className="btn-ghost"
                    onClick={() => navigate("/residence-certificate")}
                  >
                    📄 {lang === "en" ? "Request Certificate of Residence" : "ขอใบรับรองถิ่นที่อยู่"}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div style={{ padding: "16px 20px", background: "rgba(0,0,0,0.02)", borderRadius: 8, color: "var(--ink-muted)", fontSize: 13 }}>
              🔒 {lang === "en"
                ? "This step unlocks after Steps 1, 2, and 3 are successfully approved. You will receive your digital pass, key collection instructions, Wi-Fi passwords, and dormitory guidelines."
                : "ขั้นตอนนี้จะปลดล็อกเมื่อการจองห้อง, การชำระเงินค่าแรกเข้า/ประกัน และการยืนยันตัวตนเสร็จสมบูรณ์ ระบบจะแสดงบัตรผู้พักอาศัยดิจิทัล, วิธีรับมอบกุญแจห้อง, ข้อมูล Wi-Fi และกฎระเบียบหอพัก"}
            </div>
          )}
        </div>

        {/* ========================================================
            STEP 5: ใบรับรองถิ่นที่อยู่ (Certificate of Residence - Foreigner Only)
        ======================================================== */}
        {isForeigner && (
          <div
            id="step-card-certificate"
            className="card-shadow"
            style={{
              padding: 24,
              borderRadius: 12,
              borderLeft: stepStatuses.certificate === "done" ? "5px solid #10b981" : "5px solid var(--border)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--ink-muted)", textTransform: "uppercase" }}>
                  Step 5 (Foreigners Only)
                </div>
                <h2 style={{ fontSize: 18, margin: "2px 0 0", display: "flex", alignItems: "center", gap: 8 }}>
                  <span>📄</span>
                  <span>Certificate of Residence (ใบรับรองถิ่นที่อยู่ / ตม.30)</span>
                </h2>
              </div>
              <div>
                {certificate?.status === "approved" ? (
                  <span className="pill available" style={{ fontSize: 12 }}>✅ Approved</span>
                ) : certificate ? (
                  <span className="pill warning" style={{ fontSize: 12 }}>⏳ Pending Review</span>
                ) : (
                  <span className="pill" style={{ fontSize: 12, background: "rgba(0,0,0,0.06)", color: "var(--ink-muted)" }}>Optional</span>
                )}
              </div>
            </div>

            <p style={{ fontSize: 13, color: "var(--ink-secondary)", margin: "0 0 14px" }}>
              Foreign tenants requiring official residence certificates for Thai Immigration (TM.30 / extension of stay) or opening bank accounts can request it directly.
            </p>

            <button
              className="btn-primary"
              onClick={() => navigate("/residence-certificate")}
            >
              📄 Request / View Certificate of Residence →
            </button>
          </div>
        )}
      </div>

      {/* Slip Image Fullscreen Modal */}
      {showSlipModal && (
        <div
          className="cert-detail-overlay"
          onClick={() => setShowSlipModal(null)}
          style={{ zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.85)" }}
        >
          <div style={{ position: "relative", maxWidth: "90vw", maxHeight: "90vh" }} onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setShowSlipModal(null)}
              style={{
                position: "absolute",
                top: -40,
                right: 0,
                background: "#fff",
                border: "none",
                borderRadius: "50%",
                width: 32,
                height: 32,
                fontWeight: 700,
                cursor: "pointer",
                fontSize: 16
              }}
            >
              ✕
            </button>
            <img
              src={showSlipModal}
              alt="Slip Full"
              style={{
                maxWidth: "100%",
                maxHeight: "85vh",
                borderRadius: 8,
                boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
                display: "block"
              }}
            />
            <div style={{ textAlign: "center", marginTop: 10 }}>
              <a
                href={showSlipModal}
                target="_blank"
                rel="noreferrer"
                style={{ color: "#fff", fontSize: 13, textDecoration: "underline" }}
              >
                🔗 {lang === "th" ? "เปิดรูปภาพในแท็บใหม่" : "Open in new tab"}
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

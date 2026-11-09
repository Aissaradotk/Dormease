import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import PageHeaderTabs from "../components/PageHeaderTabs";

const API = "http://119.59.102.161:3007";

export default function ResidentVerificationPage() {
  const { user } = useAuth();
  const { lang } = useLanguage();
  const navigate = useNavigate();

  const [booking, setBooking] = useState(null);
  const [existing, setExisting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [editing, setEditing] = useState(false);

  const [residentType, setResidentType] = useState("thai");
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    national_id: "",
    passport_no: "",
    nationality: "",
    date_of_birth: "",
    phone: ""
  });
  const [confirmed, setConfirmed] = useState(false);
  const [errors, setErrors] = useState({});

  const apiFetch = useCallback(async (url) => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}${url}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const bookings = await apiFetch("/api/bookings/my");
      const searchParams = new URLSearchParams(window.location.search);
      const urlBookingId = searchParams.get("booking_id");

      const validBookings = Array.isArray(bookings)
        ? bookings.filter(item => item.status === "confirmed" || item.status === "approved" || item.status === "pending")
        : [];

      let b = null;
      if (urlBookingId) {
        b = (Array.isArray(bookings) ? bookings.find(item => String(item.id) === String(urlBookingId)) : null) || null;
      }
      if (!b) {
        b = validBookings[0] || null;
      }
      setBooking(b);

      if (b) {
        const verifs = await apiFetch("/api/resident-verifications/my");
        // STRICT MATCHING: only match verification for this specific booking
        const v = Array.isArray(verifs) ? verifs.find(item => Number(item.booking_id) === Number(b.id)) : null;
        setExisting(v || null);

        const dataToFill = v || (Array.isArray(verifs) && verifs.length > 0 ? verifs[0] : null);
        if (dataToFill) {
          setResidentType(dataToFill.resident_type || "thai");
          setForm({
            first_name: dataToFill.first_name || "",
            last_name: dataToFill.last_name || "",
            national_id: dataToFill.national_id || "",
            passport_no: dataToFill.passport_no || "",
            nationality: dataToFill.nationality || "",
            date_of_birth: dataToFill.date_of_birth ? dataToFill.date_of_birth.slice(0, 10) : "",
            phone: dataToFill.phone || ""
          });
        }
      }
    } catch (err) {
      console.error("loadData error:", err);
    } finally {
      setLoading(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Standard controlled input change handler - NEVER causes input remount or focus loss
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear field error when user starts typing
    if (errors[name]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  function validate() {
    const e = {};
    if (!form.first_name.trim()) e.first_name = true;
    if (!form.last_name.trim()) e.last_name = true;
    if (!form.phone.trim()) e.phone = true;

    if (residentType === "thai") {
      if (!form.national_id.trim()) {
        e.national_id = true;
      } else if (!/^\d{13}$/.test(form.national_id.trim())) {
        e.national_id = "13digits";
      }
    } else {
      if (!form.passport_no.trim()) e.passport_no = true;
      if (!form.nationality.trim()) e.nationality = true;
      if (!form.date_of_birth) e.date_of_birth = true;
    }

    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!validate()) return;
    if (!confirmed) {
      return alert(lang === "en" ? "Please confirm the information is accurate" : "กรุณายืนยันว่าข้อมูลถูกต้อง");
    }
    if (!booking) {
      return alert(lang === "en" ? "No active booking found." : "ไม่พบข้อมูลการจองห้องพัก กรุณาจองห้องพักก่อนยืนยันตัวตน");
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${API}/api/resident-verifications`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          booking_id: booking.id,
          resident_type: residentType,
          first_name: form.first_name.trim(),
          last_name: form.last_name.trim(),
          national_id: residentType === "thai" ? form.national_id.trim() : null,
          passport_no: residentType === "foreigner" ? form.passport_no.trim() : null,
          nationality: residentType === "foreigner" ? form.nationality.trim() : "Thai",
          date_of_birth: form.date_of_birth || null,
          phone: form.phone.trim()
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        setEditing(false);
        loadData();
      } else {
        alert(data.error || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
      }
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <div className="page-loading">⏳</div>;

  const isVerified = existing?.status === "verified";
  const isRejected = existing?.status === "rejected";
  const isPending = existing?.status === "pending";
  const showForm = !existing || isRejected || editing;

  return (
    <div className="cert-page" style={{ maxWidth: 800, margin: "0 auto", paddingBottom: 60 }}>
      {/* Page Header */}
      <div className="page-head">
        <div className="page-head-info">
          <h1 className="page-title">
            🪪 {lang === "en" ? "Identity Verification" : "ยืนยันตัวตนก่อนเข้าอยู่"}
          </h1>
          <p className="page-subtitle">
            {lang === "en"
              ? "Submit your identity information for move-in approval"
              : "กรอกข้อมูลยืนยันตัวตนเพื่อขออนุมัติเข้าพักอาศัย"}
          </p>
        </div>
        <button className="btn-ghost btn-sm" onClick={() => navigate("/move-in")}>
          ← {lang === "en" ? "Back to Move-in" : "กลับหน้าขั้นตอนเข้าอยู่"}
        </button>
      </div>

      <PageHeaderTabs
        tabs={[
          { path: "/move-in", label: lang === "th" ? "ขั้นตอนเข้าอยู่ & กุญแจ" : "Move-in Steps", icon: "🔑" },
          { path: "/deposit-payment", label: lang === "th" ? "ชำระค่าแรกเข้า & ค่าประกัน" : "Security Deposit", icon: "🛡️" },
          { path: "/move-in/verification", label: lang === "th" ? "ยืนยันตัวตนผู้พักอาศัย" : "Identity Verification", icon: "🪪" },
        ]}
      />

      {/* Status Banners */}
      {isVerified && (
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
              ✅ {lang === "en" ? "Identity Verified Successfully!" : "ยืนยันตัวตนผู้พักอาศัยได้รับการอนุมัติแล้ว!"}
            </div>
            <div style={{ fontSize: 13, color: "#047857" }}>
              {lang === "en"
                ? "Your identity documents have been approved. You are ready to collect your keys and move in!"
                : "ข้อมูลและเอกสารของคุณได้รับการตรวจสอบเรียบร้อยแล้ว คุณพร้อมรับกุญแจห้องและเข้าพักอาศัยทันที"}
            </div>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button
              className="btn-primary"
              onClick={() => navigate("/move-in")}
              style={{ background: "#10b981", borderColor: "#10b981", fontWeight: 700, padding: "10px 20px" }}
            >
              {lang === "en" ? "Proceed to Move-in & Key Guide →" : "🔑 ข้อมูลการรับกุญแจห้อง & อนุมัติเข้าอยู่ →"}
            </button>
          </div>
        </div>
      )}
      {isPending && !editing && (
        <div className="cert-status-card cert-status-pending" style={{ marginBottom: 20 }}>
          <div className="cert-status-header">
            <span className="cert-status-icon">🟡</span>
            <div>
              <div className="cert-status-label">{lang === "en" ? "Pending Verification" : "รอผู้ดูแลหอพักตรวจสอบ"}</div>
              <div className="cert-status-msg">
                {lang === "en"
                  ? "Admin is currently reviewing your identity information."
                  : "ระบบได้รับข้อมูลของคุณแล้ว แอดมินกำลังตรวจสอบความถูกต้อง"}
              </div>
            </div>
          </div>
        </div>
      )}
      {isRejected && (
        <div className="cert-status-card cert-status-rejected" style={{ marginBottom: 20 }}>
          <div className="cert-status-header">
            <span className="cert-status-icon">🔴</span>
            <div>
              <div className="cert-status-label">{lang === "en" ? "Verification Rejected" : "ไม่ผ่านการตรวจสอบข้อมูล"}</div>
              <div className="cert-status-msg">
                {existing.rejection_reason || (lang === "en" ? "Please re-check your submitted details." : "กรุณาตรวจสอบข้อมูลและส่งใหม่อีกครั้ง")}
              </div>
            </div>
          </div>
        </div>
      )}
      {success && (
        <div className="cert-success-banner" style={{ marginBottom: 20 }}>
          ✅ {lang === "en" ? "Submitted successfully! Please wait for admin verification." : "ส่งข้อมูลเรียบร้อยแล้ว! กรุณารอแอดมินตรวจสอบ"}
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
          <div style={{ fontSize: 60, marginBottom: 16, lineHeight: 1 }}>📋</div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: "var(--ink-primary)", marginBottom: 10 }}>
            {lang === "en" ? "No Active Room Booking" : "คุณยังไม่ได้ทำการจองห้องพัก"}
          </h2>
          <p style={{ color: "var(--ink-secondary)", fontSize: 14.5, lineHeight: 1.6, maxWidth: 460, margin: "0 auto 26px" }}>
            {lang === "en"
              ? "Please book a room first before submitting resident identity verification."
              : "การยืนยันตัวตนผู้พักอาศัยจะผูกกับห้องพักที่คุณจองไว้ กรุณาเลือกและทำการจองห้องพักก่อน"}
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
        <>
          {/* Booking Room Info Card */}
          <div className="card-shadow" style={{ padding: "16px 20px", marginBottom: 20, background: "var(--bg-card, #fff)" }}>
            <div style={{ display: "flex", gap: 24, flexWrap: "wrap", fontSize: 13, alignItems: "center" }}>
              <span>📋 {lang === "en" ? "Room" : "ห้องพัก"}: <strong style={{ fontSize: 15 }}>{booking.room_number || `ห้อง ${booking.room_id}`}</strong></span>
              <span>📅 {lang === "en" ? "Check-in Date" : "วันที่เข้าพัก"}: <strong>{booking.check_in_date ? new Date(booking.check_in_date).toLocaleDateString("th-TH") : "—"}</strong></span>
              {booking.room_type && (
                <span style={{ color: "var(--ink-muted)" }}>• {booking.room_type}</span>
              )}
            </div>
          </div>

      {/* Resident Verification Form */}
      {showForm && (
        <div className="card-shadow cert-form-card" style={{ padding: 24 }}>
          {/* Resident Type Selection */}
          <div className="cert-field" style={{ marginBottom: 24 }}>
            <label className="cert-label" style={{ fontWeight: 600, marginBottom: 8, display: "block" }}>
              {lang === "en" ? "Resident Type" : "ประเภทผู้พักอาศัย"}
            </label>
            <div style={{ display: "flex", gap: 12 }}>
              <button
                type="button"
                className={`cert-lang-btn${residentType === "thai" ? " active" : ""}`}
                onClick={() => setResidentType("thai")}
                style={{ flex: 1, padding: "10px 16px", borderRadius: 8, fontSize: 14, fontWeight: residentType === "thai" ? 700 : 500 }}
              >
                🇹🇭 {lang === "en" ? "Thai Resident" : "คนไทย (ใช้บัตรประชาชน)"}
              </button>
              <button
                type="button"
                className={`cert-lang-btn${residentType === "foreigner" ? " active" : ""}`}
                onClick={() => setResidentType("foreigner")}
                style={{ flex: 1, padding: "10px 16px", borderRadius: 8, fontSize: 14, fontWeight: residentType === "foreigner" ? 700 : 500 }}
              >
                🌍 {lang === "en" ? "Foreigner (Passport)" : "ชาวต่างชาติ (ใช้พาสปอร์ต)"}
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="cert-form-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
              {/* First Name */}
              <div className="cert-field">
                <label htmlFor="first_name" className="cert-label">
                  {lang === "en" ? "First Name" : "ชื่อ"}
                  <span className="cert-required"> *</span>
                </label>
                <input
                  id="first_name"
                  type="text"
                  name="first_name"
                  className={`cert-input${errors.first_name ? " cert-input-err" : ""}`}
                  value={form.first_name}
                  onChange={handleInputChange}
                  placeholder={lang === "en" ? "e.g. John" : "เช่น สมชาย"}
                  autoComplete="given-name"
                />
                {errors.first_name && (
                  <span className="cert-err-msg">{lang === "en" ? "First name is required" : "กรุณาระบุชื่อ"}</span>
                )}
              </div>

              {/* Last Name */}
              <div className="cert-field">
                <label htmlFor="last_name" className="cert-label">
                  {lang === "en" ? "Last Name" : "นามสกุล"}
                  <span className="cert-required"> *</span>
                </label>
                <input
                  id="last_name"
                  type="text"
                  name="last_name"
                  className={`cert-input${errors.last_name ? " cert-input-err" : ""}`}
                  value={form.last_name}
                  onChange={handleInputChange}
                  placeholder={lang === "en" ? "e.g. Smith" : "เช่น ใจดี"}
                  autoComplete="family-name"
                />
                {errors.last_name && (
                  <span className="cert-err-msg">{lang === "en" ? "Last name is required" : "กรุณาระบุนามสกุล"}</span>
                )}
              </div>

              {/* Thai National ID */}
              {residentType === "thai" ? (
                <div className="cert-field">
                  <label htmlFor="national_id" className="cert-label">
                    {lang === "en" ? "National ID (13 digits)" : "เลขบัตรประจำตัวประชาชน (13 หลัก)"}
                    <span className="cert-required"> *</span>
                  </label>
                  <input
                    id="national_id"
                    type="text"
                    name="national_id"
                    maxLength={13}
                    className={`cert-input${errors.national_id ? " cert-input-err" : ""}`}
                    value={form.national_id}
                    onChange={handleInputChange}
                    placeholder={lang === "en" ? "13-digit National ID" : "เลขบัตรประชาชน 13 หลัก"}
                    autoComplete="off"
                  />
                  {errors.national_id === "13digits" && (
                    <span className="cert-err-msg">{lang === "en" ? "Must be 13 digits" : "ต้องเป็นตัวเลข 13 หลัก"}</span>
                  )}
                  {errors.national_id && errors.national_id !== "13digits" && (
                    <span className="cert-err-msg">{lang === "en" ? "National ID is required" : "กรุณาระบุเลขบัตรประชาชน"}</span>
                  )}
                </div>
              ) : (
                <>
                  {/* Foreigner Passport */}
                  <div className="cert-field">
                    <label htmlFor="passport_no" className="cert-label">
                      {lang === "en" ? "Passport No." : "เลขหนังสือเดินทาง (Passport No.)"}
                      <span className="cert-required"> *</span>
                    </label>
                    <input
                      id="passport_no"
                      type="text"
                      name="passport_no"
                      className={`cert-input${errors.passport_no ? " cert-input-err" : ""}`}
                      value={form.passport_no}
                      onChange={handleInputChange}
                      placeholder={lang === "en" ? "e.g. A12345678" : "เช่น A12345678"}
                      autoComplete="off"
                    />
                    {errors.passport_no && (
                      <span className="cert-err-msg">{lang === "en" ? "Passport number is required" : "กรุณาระบุเลขหนังสือเดินทาง"}</span>
                    )}
                  </div>

                  {/* Foreigner Nationality */}
                  <div className="cert-field">
                    <label htmlFor="nationality" className="cert-label">
                      {lang === "en" ? "Nationality" : "สัญชาติ"}
                      <span className="cert-required"> *</span>
                    </label>
                    <input
                      id="nationality"
                      type="text"
                      name="nationality"
                      className={`cert-input${errors.nationality ? " cert-input-err" : ""}`}
                      value={form.nationality}
                      onChange={handleInputChange}
                      placeholder={lang === "en" ? "e.g. American, British, Japanese" : "เช่น ญี่ปุ่น, อเมริกัน"}
                      autoComplete="off"
                    />
                    {errors.nationality && (
                      <span className="cert-err-msg">{lang === "en" ? "Nationality is required" : "กรุณาระบุสัญชาติ"}</span>
                    )}
                  </div>

                  {/* Date of Birth */}
                  <div className="cert-field">
                    <label htmlFor="date_of_birth" className="cert-label">
                      {lang === "en" ? "Date of Birth" : "วันเดือนปีเกิด"}
                      <span className="cert-required"> *</span>
                    </label>
                    <input
                      id="date_of_birth"
                      type="date"
                      name="date_of_birth"
                      className={`cert-input${errors.date_of_birth ? " cert-input-err" : ""}`}
                      value={form.date_of_birth}
                      onChange={handleInputChange}
                    />
                    {errors.date_of_birth && (
                      <span className="cert-err-msg">{lang === "en" ? "Date of birth is required" : "กรุณาระบุวันเกิด"}</span>
                    )}
                  </div>
                </>
              )}

              {/* Phone Number */}
              <div className="cert-field">
                <label htmlFor="phone" className="cert-label">
                  {lang === "en" ? "Phone Number" : "เบอร์โทรศัพท์ติดต่อ"}
                  <span className="cert-required"> *</span>
                </label>
                <input
                  id="phone"
                  type="tel"
                  name="phone"
                  className={`cert-input${errors.phone ? " cert-input-err" : ""}`}
                  value={form.phone}
                  onChange={handleInputChange}
                  placeholder={lang === "en" ? "e.g. 0812345678" : "เช่น 0812345678"}
                  autoComplete="tel"
                />
                {errors.phone && (
                  <span className="cert-err-msg">{lang === "en" ? "Phone number is required" : "กรุณาระบุเบอร์โทรศัพท์"}</span>
                )}
              </div>
            </div>

            {/* Confirmation Checkbox */}
            <div style={{ marginTop: 20, marginBottom: 12 }}>
              <label style={{ display: "flex", gap: 10, alignItems: "center", cursor: "pointer", fontSize: 13, userSelect: "none" }}>
                <input
                  id="confirm_checkbox"
                  type="checkbox"
                  checked={confirmed}
                  onChange={e => setConfirmed(e.target.checked)}
                  style={{ width: 18, height: 18, cursor: "pointer" }}
                />
                <span>
                  {lang === "en"
                    ? "I hereby confirm that all information provided is true and accurate."
                    : "ข้าพเจ้าขอยืนยันว่าข้อมูลที่กรอกทั้งหมดเป็นข้อมูลจริงและถูกต้องทุกประการ"}
                </span>
              </label>
            </div>

            {/* Form Footer */}
            <div className="cert-form-footer" style={{ display: "flex", gap: 12, justifyContent: "flex-end", marginTop: 20 }}>
              {editing && (
                <button type="button" className="btn-ghost" onClick={() => setEditing(false)}>
                  {lang === "en" ? "Cancel" : "ยกเลิก"}
                </button>
              )}
              <button
                type="submit"
                className="btn-primary"
                disabled={submitting || !confirmed}
                style={{ minWidth: 180 }}
              >
                {submitting ? "⏳..." : (lang === "en" ? "Confirm & Submit" : "ยืนยันข้อมูลผู้เข้าพัก")}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Verified Status Card */}
      {isVerified && (
        <div className="card-shadow" style={{ padding: 24, textAlign: "center" }}>
          <p style={{ color: "var(--ink-secondary)", marginBottom: 16 }}>
            {lang === "en"
              ? "Your resident verification is complete. You can proceed to check your room details."
              : "การยืนยันตัวตนของคุณเสร็จสมบูรณ์แล้ว สามารถไปดูห้องพักและเริ่มเข้าอยู่ได้ทันที"}
          </p>
          <button className="btn-primary" onClick={() => navigate("/move-in")}>
            ✅ {lang === "en" ? "View Move-in Status →" : "ดูสถานะการเข้าอยู่ →"}
          </button>
        </div>
      )}
        </>
      )}
    </div>
  );
}
